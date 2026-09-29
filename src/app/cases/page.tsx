import type { Metadata } from "next";
import { CasesExplorer } from "@/components/CasesExplorer";
import { listCases } from "@/server/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Кейсы" };

export default async function CasesPage() {
  const cases = await listCases();
  return <CasesExplorer cases={cases} />;
}
