import type { Metadata } from "next";
import { RewardsView } from "@/components/RewardsView";
import { getRewards } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Награды" };

export default async function RewardsPage() {
  const data = await getRewards(await getUserId());
  return <RewardsView initial={data} />;
}
