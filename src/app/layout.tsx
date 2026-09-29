import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Unbounded } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { getBootstrap } from "@/server/queries";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "КЕЙСЕР — кейсы",
    template: "%s — КЕЙСЕР",
  },
  description: "Демо-платформа открытия кейсов: рулетка, апгрейды, инвентарь и виртуальный баланс.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initial = await getBootstrap();
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable}`}>
      <body className="antialiased">
        <AppShell initial={initial}>{children}</AppShell>
      </body>
    </html>
  );
}
