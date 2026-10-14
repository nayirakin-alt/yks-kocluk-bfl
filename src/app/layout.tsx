import "@fontsource-variable/manrope";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rota | YKS 2027 Koçluk",
  description: "YKS 2027 hazırlık sürecin için öğrenci ve öğretmen koçluk paneli.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}