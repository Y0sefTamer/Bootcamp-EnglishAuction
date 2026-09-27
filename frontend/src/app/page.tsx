import AuctionPanel from "@/components/AuctionPanel";

export default function Home() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <AuctionPanel />
      </div>
    </main>
  );
}
