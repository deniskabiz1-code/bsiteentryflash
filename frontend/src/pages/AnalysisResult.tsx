import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaceAnalysisResult,
  SCORE_LABELS,
  SKIN_TYPE_LABELS,
  PUFFINESS_LABELS,
} from '@/types';

export default function AnalysisResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  if (!analysis) {
    return (
      <div className="page">
        <div className="page-inner text-center pt-8">
          <p className="text-app-muted">Результаты не найдены</p>
          <button type="button" onClick={() => navigate('/analysis')} className="btn-dark mt-6">
            Новый анализ
          </button>
        </div>
      </div>
    );
  }

  const result = analysis as FaceAnalysisResult & { overall_score?: number; demo?: boolean };
  const overall = result.overall_score || 0;
  const isDemo = Boolean(result.demo);
  const scores = result.scores || {};

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        <section className="text-center pt-2">
          <p className="label-sm mb-3">Общий балл</p>
          <p className="heading-xl">{overall}<span className="text-[20px] text-app-muted font-semibold">/100</span></p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="pill-green">Анализ завершён</span>
            {isDemo && (
              <span className="pill-gray">Демо · OpenAI не подключён</span>
            )}
          </div>
        </section>

        <section className="card-green">
          <p className="label-sm mb-3">По параметрам</p>
          <div className="space-y-0">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="list-row">
                <span className="text-[15px] text-app-text">{SCORE_LABELS[key]}</span>
                <span className="text-[15px] font-bold text-brand-greenDark">{value as number}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-0">
          <div className="list-row">
            <span className="text-[15px] text-app-muted">Тип кожи</span>
            <span className="text-[15px] font-semibold">{SKIN_TYPE_LABELS[result.skin_type]}</span>
          </div>
          <div className="list-row">
            <span className="text-[15px] text-app-muted">Отёчность</span>
            <span className="text-[15px] font-semibold">{PUFFINESS_LABELS[result.puffiness]}</span>
          </div>
        </section>

        {result.problem_zones?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Проблемные зоны</h2>
            <div className="card space-y-4">
              {result.problem_zones.map((zone, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-app-border' : ''}>
                  <p className="font-semibold text-[15px]">{zone.zone}</p>
                  <p className="text-[14px] text-app-muted mt-1 leading-relaxed">{zone.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.improvement_tips?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Рекомендации</h2>
            <div className="card space-y-3">
              {result.improvement_tips.map((tip, i) => (
                <p key={i} className="text-[14px] leading-relaxed">• {tip}</p>
              ))}
            </div>
          </section>
        )}

        {result.growth_plan?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">План роста</h2>
            <div className="space-y-3">
              {result.growth_plan.map((step) => (
                <div key={step.step} className="card">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-app-text text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-semibold text-[15px]">{step.action}</p>
                      <p className="text-[13px] text-app-muted mt-2">{step.timeline}</p>
                      <p className="text-[13px] text-brand-greenDark font-medium mt-1">{step.progress_metric}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.skincare_routine?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Уход за кожей</h2>
            <div className="card !p-0 overflow-hidden">
              {result.skincare_routine.map((item, i) => (
                <div key={i} className="px-5 py-4 border-b border-app-border last:border-0">
                  <p className="font-semibold text-[15px]">{item.step}</p>
                  <p className="text-[14px] text-app-muted mt-1">{item.product_type}</p>
                  <p className="text-[13px] text-app-faint mt-1">{item.tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="btn-row pb-4">
          <button type="button" onClick={() => navigate('/analysis')} className="btn-light">
            Повторить
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-dark">
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}