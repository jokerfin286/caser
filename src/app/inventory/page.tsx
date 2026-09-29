import type { Metadata } from "next";
import { InventoryView } from "@/components/InventoryView";
import { LoginGate } from "@/components/LoginGate";
import { listInventory } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Инвентарь" };

export default async function InventoryPage() {
  const userId = await getUserId();
  if (!userId) return <LoginGate title="Инвентарь" next="/login?next=/inventory" />;
  const data = await listInventory(userId);
  return <InventoryView {...data} />;
}
