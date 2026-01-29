// app/series/new/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nova Série",
  description: "Adicione uma nova série à sua coleção",
};

export default function NewSeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
