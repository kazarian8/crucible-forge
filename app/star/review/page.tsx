import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { isStarAdmin } from "../../../lib/star/admin";
import ReviewQueue from "./review-queue";

export default async function StarReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/star/review");
  if (!isStarAdmin(user)) return <main className="p-8 text-white">Administrator access is required to review other artists’ tracks.</main>;
  return <ReviewQueue />;
}
