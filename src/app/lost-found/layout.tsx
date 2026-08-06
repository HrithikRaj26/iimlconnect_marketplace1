import AppLayout from "@/components/layout/AppLayout";

export default function LostFoundLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <div className="w-full">{children}</div>
    </AppLayout>
  );
}
