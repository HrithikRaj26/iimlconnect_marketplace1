import AppLayout from "@/components/layout/AppLayout";

export default function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
