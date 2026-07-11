import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Trash2 } from 'lucide-react';

import Modal from '@/components/Modal';
import MiniBarChart from '@/components/MiniBarChart';
import SegmentedControl from '@/components/SegmentedControl';
import { getAnalysisHistory, deleteAnalysis } from '@/api/client';
import { useTelegram } from '@/hooks/useTelegram';
import { Analysis, FaceAnalysisResult } from '@/types';
import { assetUrl } from '@/utils/assets';

export default function Progress() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [period, setPeriod] = useState('Месяц');

  const load = async () => {
    try {
      const data = await getAnalysisHistory();
      const faceAnalyses = data.analyses.filter((a: Analysis) => a.type === 'face');
      setAnalyses(faceAnalyses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const faceAnalyses = analyses;
  const chartValues = [...faceAnalyses].reverse().map((a) => a.overallScore || 0);
  while (chartValues.length < 10) chartValues.unshift(chartValues[0] || 50);

  const openAnalysis = (analysis: Analysis) => {
    haptic('light');
    navigate(`/analysis/result/${analysis.id}`);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAnalysis(id);
      haptic('success');
      setDeleteId(null);
      load();
    } catch {
      haptic('error');
    }
  };

  const first = faceAnalyses[faceAnalyses.length - 1];
  const latest = faceAnalyses[0];
  const delta = (latest?.overallScore || 0) - (first?.overallScore || 0);

  if (loading) {
    return (
      <div className="page flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        <section className="text-center pt-2">
          <p className="label-sm mb-3">Текущий балл</p>
          <p className="heading-xl">{latest?.overallScore ?? '—'}<span className="text-[20px] text-app-muted font-semibold">/100</span></p>
          {delta !== 0 && (
            <div className="mt-4 flex justify-center">
              <span className={`pill-green ${delta < 0 ? '!bg-red-50 !text-red-600' : ''}`}>
                {delta >= 0 ? '+' : ''}{delta} с начала
              </span>
            </div>
          )}
        </section>

        <button type="button" onClick={() => navigate('/analysis')} className="btn-dark flex items-center justify-center gap-2">
          <Camera size={18} />
          Еженедельный чек-ин
        </button>

        <div className="btn-row">
          <div className="card flex-1 text-center !py-4">
            <p className="text-[28px] font-bold">{faceAnalyses.length}</p>
            <p className="text-[13px] text-app-muted mt-1">Чек-инов</p>
          </div>
          <div className="card flex-1 text-center !py-4">
            <p className="text-[28px] font-bold">{latest?.overallScore ?? '—'}</p>
            <p className="text-[13px] text-app-muted mt-1">Сейчас</p>
          </div>
        </div>

        {faceAnalyses.length > 0 && (
          <section className="card-green">
            <p className="label-sm mb-1">Динамика</p>
            <p className="text-[28px] font-bold tracking-tight mb-4">{latest?.overallScore ?? 0} баллов</p>
            <MiniBarChart values={chartValues.slice(-10)} />
            <div className="mt-4">
              <SegmentedControl
                options={['День', 'Неделя', 'Месяц', 'Год']}
                value={period}
                onChange={setPeriod}
              />
            </div>
          </section>
        )}

        {first && latest && first.id !== latest.id && (
          <section className="card">
            <h2 className="text-[17px] font-bold mb-4">До / После</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <img src={assetUrl(first.photoUrl)} alt="До" className="w-full aspect-square object-cover rounded-2xl" />
                <p className="text-[15px] mt-2 font-bold">{first.overallScore}</p>
                <p className="text-[12px] text-app-muted">Первый</p>
              </div>
              <span className={`text-xl font-bold ${delta >= 0 ? 'text-brand-greenDark' : 'text-red-500'}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
              <div className="flex-1 text-center">
                <img src={assetUrl(latest.photoUrl)} alt="После" className="w-full aspect-square object-cover rounded-2xl" />
                <p className="text-[15px] mt-2 font-bold">{latest.overallScore}</p>
                <p className="text-[12px] text-app-muted">Последний</p>
              </div>
            </div>
          </section>
        )}

        {faceAnalyses.length > 0 ? (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">История</h2>
            <div className="card !p-0 overflow-hidden">
              {faceAnalyses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 border-b border-app-border last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => openAnalysis(a)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 text-left active:bg-app-canvas"
                  >
                    <img
                      src={assetUrl(a.photoUrl)}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">{a.overallScore}/100</p>
                      <p className="text-[13px] text-app-muted">
                        {new Date(a.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronRight size={18} className="flex-shrink-0 text-app-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(a.id)}
                    className="p-4 text-app-muted"
                    aria-label="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="card text-center py-12">
            <p className="text-app-muted text-[15px]">Пока нет чек-инов</p>
            <p className="text-app-faint text-[13px] mt-1">Сделайте первый анализ лица</p>
          </div>
        )}
      </div>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <p className="font-bold text-center text-[17px]">Удалить этот чек-ин?</p>
          <div className="btn-row">
            <button type="button" onClick={() => setDeleteId(null)} className="btn-light flex-1">
              Отмена
            </button>
            <button
              type="button"
              onClick={() => deleteId !== null && handleDelete(deleteId)}
              className="flex-1 py-4 rounded-full bg-red-500 text-white font-semibold"
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}