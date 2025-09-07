
import { AuctionProvider } from '@/components/auction-provider';
import { AppContent } from '@/components/app-content';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <AuctionProvider>
        <AppContent />
      </AuctionProvider>
    </main>
  );
}
