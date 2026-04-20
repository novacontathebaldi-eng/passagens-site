import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motorista — ViajaEdu!",
  robots: "noindex, nofollow",
};

export default function MotoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
