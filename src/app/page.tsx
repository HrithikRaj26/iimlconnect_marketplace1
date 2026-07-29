import Link from "next/link";
import { TopNav } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to IIML Connect Marketplace
        </h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Buy and sell pre-owned items within the verified IIM Lucknow community.
          Feature 1 — Easy Item Listing — is live below.
        </p>
        <Link href="/listing/create" className="mt-8">
          <Button size="lg">+ Sell an Item</Button>
        </Link>
      </main>
    </div>
  );
}
