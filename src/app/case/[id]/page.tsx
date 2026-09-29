import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseOpener } from "@/components/CaseOpener";
import { getCaseDetail } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getCaseDetail(id, null);
  return { title: detail?.case.name ?? "Кейс" };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getCaseDetail(id, await getUserId());
  if (!detail) notFound();
  return <CaseOpener detail={detail} />;
}
