import AppLayout from "@/components/layout/AppLayout";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
