import type { Metadata } from "next";
import { Suspense } from "react";
import { UpgradeStudio } from "@/components/UpgradeStudio";
import { listInventory, listSkins } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Апгрейды" };

export default async function UpgradePage() {
  const userId = await getUserId();
  const [skins, inventory] = await Promise.all([
    listSkins(),
    userId ? listInventory(userId) : Promise.resolve(null),
  ]);
  return (
    <Suspense fallback={<div className="text-white/50">Собираем колесо…</div>}>
      <UpgradeStudio skins={skins} initialItems={inventory?.items ?? []} />
    </Suspense>
  );
}
