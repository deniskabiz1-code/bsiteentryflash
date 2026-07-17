/**
 * Replace em/en dashes only inside string literals and JSX text.
 * Does NOT touch spread operators (...).
 */
import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(ts|tsx|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Fix dash characters in a string's content (no surrounding quotes). */
function fixContent(s, { capitalizeAfterPeriod = true } = {}) {
  // Empty placeholder em dash alone
  if (s === '—' || s === '–') return '-';

  // Ranges 1–2 → 1-2
  s = s.replace(/(\d)–(\d)/g, '$1-$2');
  s = s.replace(/–/g, '-');

  // Em dash as clause break → period + space (or special cases)
  s = s.replace(/ — /g, '. ');
  s = s.replace(/—/g, '. ');

  if (capitalizeAfterPeriod) {
    s = s.replace(/\. ([a-zа-яё])/g, (_, ch) => `. ${ch.toUpperCase()}`);
  }

  // CTA / price cleanup
  s = s.replace(/\. 400 ₽\/мес/g, ', 400 ₽/мес');
  s = s.replace(/400 ₽\/мес\. Безлимит/g, '400 ₽/мес: безлимит');
  s = s.replace(/400 ₽\/мес\. безлимит/g, '400 ₽/мес: безлимит');
  s = s.replace(/Стрижки\. Избегать/g, 'Избегать');
  s = s.replace(/Стрижки\. избегать/g, 'Избегать');
  s = s.replace(/\. Подходит при/g, ': подходит при');
  s = s.replace(/\(и при отёках\. Вечером\)/g, '(и при отёках вечером)');
  s = s.replace(/Я подписался\. Проверить/g, 'Я подписался, проверить');
  s = s.replace(/Оценки и обзор\. Бесплатно всегда/g, 'Оценки и обзор бесплатны всегда');

  return s;
}

function processFile(content) {
  // Single-quoted strings
  content = content.replace(/'((?:\\.|[^'\\])*)'/g, (_, inner) => {
    if (!inner.includes('—') && !inner.includes('–')) return `'${inner}'`;
    return `'${fixContent(inner)}'`;
  });

  // Double-quoted strings
  content = content.replace(/"((?:\\.|[^"\\])*)"/g, (_, inner) => {
    if (!inner.includes('—') && !inner.includes('–')) return `"${inner}"`;
    return `"${fixContent(inner)}"`;
  });

  // Template literals without interpolation (safe)
  content = content.replace(/`((?:\\.|[^`\\$]|\$(?!\{))*)`/g, (full, inner) => {
    if (full.includes('${')) return full;
    if (!inner.includes('—') && !inner.includes('–')) return full;
    return `\`${fixContent(inner)}\``;
  });

  // Template literals WITH interpolation: only replace dash chars, no capitalize
  content = content.replace(/`((?:\\.|[^`\\])*)`/g, (full) => {
    if (!full.includes('—') && !full.includes('–')) return full;
    if (!full.includes('${')) return full; // already handled
    let s = full;
    s = s.replace(/(\d)–(\d)/g, '$1-$2');
    s = s.replace(/–/g, '-');
    s = s.replace(/ — /g, '. ');
    s = s.replace(/—/g, '. ');
    s = s.replace(/\. 400 ₽\/мес/g, ', 400 ₽/мес');
    s = s.replace(/\. подходит при/g, ': подходит при');
    s = s.replace(/\. Подходит при/g, ': подходит при');
    // Capitalize after ". " only in plain text parts of template (rough)
    s = s.replace(/\. ([a-zа-яё])/g, (_, ch) => `. ${ch.toUpperCase()}`);
    return s;
  });

  // JSX text between tags: >text with dash<
  content = content.replace(/>([^<>{]*[—–][^<>{]*)</g, (full, text) => {
    return `>${fixContent(text)}<`;
  });

  // CSS / line comments containing em dash (non-code)
  content = content.replace(/(\/\/.*)([—–])/g, (_, pre, d) => pre + (d === '–' ? '-' : '. '));
  content = content.replace(/(\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)/g, (block) => {
    if (!block.includes('—') && !block.includes('–')) return block;
    return block.replace(/(\d)–(\d)/g, '$1-$2').replace(/–/g, '-').replace(/ — /g, ': ').replace(/—/g, ': ');
  });

  return content;
}

const files = ['frontend/src', 'backend/src'].flatMap((r) => walk(r));
let n = 0;
for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  if (!orig.includes('—') && !orig.includes('–')) continue;
  const next = processFile(orig);
  if (next !== orig) {
    // safety: never reduce count of ... spreads
    const spreadBefore = (orig.match(/\.\.\./g) || []).length;
    const spreadAfter = (next.match(/\.\.\./g) || []).length;
    if (spreadAfter < spreadBefore) {
      console.error('ABORT spreads reduced in', f, spreadBefore, '->', spreadAfter);
      continue;
    }
    fs.writeFileSync(f, next);
    console.log('fixed', f);
    n += 1;
  }
}
console.log('done', n);
