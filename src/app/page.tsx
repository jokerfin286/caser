import { CasesExplorer } from "@/components/CasesExplorer";
import { listCases } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cases = await listCases();
  return <CasesExplorer cases={cases} spotlight />;
}
