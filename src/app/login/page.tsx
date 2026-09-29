import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/LoginView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white/50">Открываем Steam…</div>}>
      <LoginView />
    </Suspense>
  );
}
