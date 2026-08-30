import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

type FeatureVector = {
  duration?: number;
  transient_rate?: number;
  rhythmicity?: number;
  tonality?: number;
  estimated_bpm?: number | null;
  tags?: string[];
};

type CalibrationRequest = {
  modelVersion?: string;
  contentType?: string;
  suggestedCategory?: string;
  contentConfidence?: number;
  featureVector?: FeatureVector;
};

type FeedbackRow = {
  corrected_type: string;
  corrected_category: string;
  corrected_tags: string[];
  feature_vector: FeatureVector;
};

function finite(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function featureDistance(left: FeatureVector, right: FeatureVector) {
  const durationDistance = Math.abs(Math.log1p(finite(left.duration)) - Math.log1p(finite(right.duration))) / 5;
  const transientDistance = Math.abs(finite(left.transient_rate) - finite(right.transient_rate)) / 10;
  const rhythmDistance = Math.abs(finite(left.rhythmicity) - finite(right.rhythmicity));
  const tonalityDistance = Math.abs(finite(left.tonality) - finite(right.tonality)) / 10;
  const leftBpm = finite(left.estimated_bpm);
  const rightBpm = finite(right.estimated_bpm);
  const bpmDistance = leftBpm && rightBpm ? Math.abs(leftBpm - rightBpm) / 100 : leftBpm || rightBpm ? 0.5 : 0;
  const leftTags = new Set(left.tags ?? []);
  const rightTags = new Set(right.tags ?? []);
  const union = new Set([...leftTags, ...rightTags]);
  const shared = [...leftTags].filter((tag) => rightTags.has(tag)).length;
  const tagDistance = union.size ? 1 - shared / union.size : 0;
  return durationDistance * 0.2 + transientDistance * 0.2 + rhythmDistance * 0.22 + tonalityDistance * 0.14 + bpmDistance * 0.12 + tagDistance * 0.12;
}

function bestVote(neighbors: Array<{ row: FeedbackRow; similarity: number }>, key: "corrected_type" | "corrected_category") {
  const votes = new Map<string, number>();
  for (const neighbor of neighbors) votes.set(neighbor.row[key], (votes.get(neighbor.row[key]) ?? 0) + neighbor.similarity);
  const ranked = [...votes.entries()].sort((left, right) => right[1] - left[1]);
  const total = ranked.reduce((sum, entry) => sum + entry[1], 0);
  return { value: ranked[0]?.[0] ?? null, agreement: total > 0 ? (ranked[0]?.[1] ?? 0) / total : 0 };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in before calibrating File DNA." }, { status: 401 });

    const body = await request.json() as CalibrationRequest;
    if (!body.featureVector || !body.modelVersion) return NextResponse.json({ error: "Missing File DNA features." }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("file_dna_feedback")
      .select("corrected_type,corrected_category,corrected_tags,feature_vector")
      .eq("model_version", body.modelVersion)
      .eq("confirmed", true)
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) throw error;

    const neighbors = ((data ?? []) as FeedbackRow[])
      .map((row) => ({ row, similarity: 1 / (1 + featureDistance(body.featureVector ?? {}, row.feature_vector ?? {}) * 4) }))
      .filter((neighbor) => neighbor.similarity >= 0.58)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 20);

    if (neighbors.length < 3) {
      return NextResponse.json({
        contentType: body.contentType,
        suggestedCategory: body.suggestedCategory,
        contentConfidence: Math.max(0, Math.min(99, Math.round(finite(body.contentConfidence)))),
        learnedFromExamples: neighbors.length,
        confidenceSource: "signal",
      });
    }

    const typeVote = bestVote(neighbors, "corrected_type");
    const categoryVote = bestVote(neighbors, "corrected_category");
    const averageSimilarity = neighbors.reduce((sum, neighbor) => sum + neighbor.similarity, 0) / neighbors.length;
    const agreement = (typeVote.agreement + categoryVote.agreement) / 2;
    const learningWeight = Math.min(0.62, (neighbors.length / 24) * averageSimilarity);
    const signalConfidence = Math.max(0, Math.min(99, finite(body.contentConfidence)));
    const calibratedConfidence = Math.round(signalConfidence * (1 - learningWeight) + agreement * 100 * learningWeight);

    return NextResponse.json({
      contentType: typeVote.agreement >= 0.64 ? typeVote.value : body.contentType,
      suggestedCategory: categoryVote.agreement >= 0.64 ? categoryVote.value : body.suggestedCategory,
      contentConfidence: Math.max(0, Math.min(99, calibratedConfidence)),
      learnedFromExamples: neighbors.length,
      confidenceSource: "signal+community",
      communityAgreement: Math.round(agreement * 100),
    });
  } catch (error) {
    console.error("[file-dna/calibrate] failed", error);
    return NextResponse.json({ error: "File DNA calibration is temporarily unavailable." }, { status: 500 });
  }
}
