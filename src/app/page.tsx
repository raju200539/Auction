
import { AuctionProvider } from '@/components/auction-provider';
import { AppContent } from '@/components/app-content';
import { PastAuctionsProvider } from '@/components/past-auctions-provider';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <PastAuctionsProvider>
        <AuctionProvider>
          <AppContent />
        </AuctionProvider>
      </PastAuctionsProvider>
    </main>
