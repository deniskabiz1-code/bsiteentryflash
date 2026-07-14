import { updatePersonalizedAnalysis } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  resolvePersonalizedAnalysis,
  writePersonalizedAnalysisPreference,
} from '@/utils/personalizedAnalysis';

export function usePersonalizedAnalysisToggle() {
  const { user, applyUser } = useApp();
  const { haptic } = useTelegram();

  const enabled = resolvePersonalizedAnalysis(user?.personalizedAnalysis);

  const toggle = async () => {
    if (!user) return;

    const newVal = !enabled;
    writePersonalizedAnalysisPreference(newVal);
    applyUser({ ...user, personalizedAnalysis: newVal });

    try {
      const data = await updatePersonalizedAnalysis(newVal);
      const saved = data.personalizedAnalysis === false
        ? false
        : data.personalizedAnalysis === true
          ? true
          : newVal;
      writePersonalizedAnalysisPreference(saved);
      if (data.user) {
        applyUser({ ...data.user, personalizedAnalysis: saved });
      } else {
        applyUser({ ...user, personalizedAnalysis: saved });
      }
      haptic('light');
    } catch {
      haptic('error');
    }
  };

  return { enabled, toggle };
}