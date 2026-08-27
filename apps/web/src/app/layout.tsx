import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_NAME } from "@portfolio-copilot/shared";

import { FinancialSessionProvider } from "@/components/financial-session";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Copiloto inteligente de investimentos em construção.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <FinancialSessionProvider>{children}</FinancialSessionProvider>
      </body>
    </html>
  );
}
