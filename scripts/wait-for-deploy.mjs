#!/usr/bin/env node

const REPO = process.env.GITHUB_REPO || 'deniskabiz1-code/bsiteentryflash';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const MAX_WAIT_MS = Number(process.env.DEPLOY_MAX_WAIT_MS || 8 * 60 * 1000);
const POLL_MS = 5000;

const workflows = [
  { file: 'deploy-frontend.yml', label: 'Frontend (GitHub Pages)', required: true },
  { file: 'deploy-backend.yml', label: 'Backend (Render)', required: false },
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'primeform-deploy-wait',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
  return res.json();
}

async function getLatestRun(workflowFile) {
  const data = await fetchJson(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflowFile}/runs?branch=${BRANCH}&per_page=1`
  );
  return data.workflow_runs?.[0] ?? null;
}

function formatRun(run) {
  if (!run) return 'no runs found';
  return `${run.head_sha?.slice(0, 7)} — ${run.status}/${run.conclusion || 'pending'} — ${run.html_url}`;
}

async function waitForWorkflow(workflowFile, label, expectedSha, required = true) {
  const started = Date.now();
  let missingRunPolls = 0;

  while (Date.now() - started < MAX_WAIT_MS) {
    const run = await getLatestRun(workflowFile);
    if (!run) {
      console.log(`[${label}] no workflow run yet, retrying...`);
      await sleep(POLL_MS);
      continue;
    }

    if (expectedSha && !run.head_sha?.startsWith(expectedSha)) {
      missingRunPolls += 1;
      if (!required && missingRunPolls >= 6) {
        console.log(`[${label}] skipped — no run for this commit (path filter)`);
        return true;
      }
      console.log(`[${label}] latest run is ${run.head_sha?.slice(0, 7)}, waiting for ${expectedSha.slice(0, 7)}...`);
      await sleep(POLL_MS);
      continue;
    }

    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        console.log(`[${label}] deploy succeeded`);
        return true;
      }
      console.error(`[${label}] deploy failed: ${formatRun(run)}`);
      return false;
    }

    console.log(`[${label}] in progress... (${run.status})`);
    await sleep(POLL_MS);
  }

  console.error(`[${label}] timed out after ${MAX_WAIT_MS}ms`);
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const expectedSha = process.argv[2] || '';
  console.log(`Waiting for deploy workflows on ${REPO}@${BRANCH}${expectedSha ? ` (commit ${expectedSha.slice(0, 7)})` : ''}`);

  let allOk = true;
  for (const wf of workflows) {
    const run = await getLatestRun(wf.file);
    if (!run) {
      console.log(`[${wf.label}] skipped — no runs for ${wf.file}`);
      continue;
    }

    if (expectedSha && !run.head_sha?.startsWith(expectedSha)) {
      console.log(`[${wf.label}] waiting for new run...`);
    }

    const ok = await waitForWorkflow(wf.file, wf.label, expectedSha || undefined, wf.required);
    if (!ok && wf.required) allOk = false;
    if (!ok && !wf.required) console.log(`[${wf.label}] optional workflow failed — continuing`);
  }

  if (!allOk) process.exit(1);
  console.log('All deploy workflows finished successfully.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});