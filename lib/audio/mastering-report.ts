import { analyzeAudioFile, type FileDnaAnalysis } from "./file-dna";

export type AnalyzedAudio = { analysis: FileDnaAnalysis; hash: string };
export type MasteringReport = {
  version: 1;
  analyzedAt: string;
  original: AnalyzedAudio & { filename: string };
  mastered: AnalyzedAudio & { filename: string };
};

// Cache by exact File identity, so accepting a master reuses its analysis.
// Failed work is evicted so retrying does not require mastering again.
export function createAnalysisCache(analyze = analyzeAudioFile) {
  const tasks = new WeakMap<Blob, Promise<AnalyzedAudio>>();
  return (file: File) => {
    let task = tasks.get(file);
    if (!task) {
      task = analyze(file).catch((error: unknown) => {
        tasks.delete(file);
        throw error;
      });
      tasks.set(file, task);
    }
    return task;
  };
}

export async function createMasteringReport(
  original: File,
  mastered: File,
  analyze: (file: File) => Promise<AnalyzedAudio>,
): Promise<MasteringReport> {
  const [before, after] = await Promise.all([analyze(original), analyze(mastered)]);
  return {
    version: 1,
    analyzedAt: new Date().toISOString(),
    original: { ...before, filename: original.name },
    mastered: { ...after, filename: mastered.name },
  };
}
