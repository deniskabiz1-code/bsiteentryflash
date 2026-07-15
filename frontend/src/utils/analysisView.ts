import {
  Analysis,
  AnalysisAccessTier,
  AnalysisContentLevel,
  FaceAnalysisResult,
} from '@/types';

export type AnalysisResultView = FaceAnalysisResult & {
  overall_score: number;
  photoUrl?: string;
  id?: number;
  createdAt?: string;
  demo?: boolean;
  accessTier?: AnalysisAccessTier;
  contentLevel?: AnalysisContentLevel;
};

export function toAnalysisResultView(
  source: AnalysisResultView | Analysis | Record<string, unknown>,
): AnalysisResultView {
  const record = source as Analysis & FaceAnalysisResult & { demo?: boolean };
  const json = (record.resultJson ?? record) as FaceAnalysisResult;

  const demoFlag = record.demo
    ?? (record as { demo?: boolean }).demo
    ?? (json as { demo?: boolean }).demo;

  return {
    ...json,
    overall_score: record.overallScore ?? record.overall_score ?? json.overall_score ?? 0,
    photoUrl: record.photoUrl,
    id: record.id,
    createdAt: record.createdAt,
    demo: demoFlag,
    accessTier: record.accessTier,
    contentLevel: record.contentLevel,
  };
}