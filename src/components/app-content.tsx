'use client';

import { useAuction } from '@/hooks/use-auction';
import TeamSetup from '@/components/team-setup';
import PlayerUpload from '@/components/player-upload';
import AuctionView from '@/components/auction-view';
import AuctionSummary from '@/components/auction-summary';
import { Goal } from 'lucide-react';

export function AppContent() {
  const { stage } = useAuction();

  const renderStage = () => {
    switch (stage) {
      case 'team-setup':
        return <TeamSetup />;
      case 'player-upload':
        return <PlayerUpload />;
      case 'auction':
        return <AuctionView />;
      case 'summary':
        return <AuctionSummary />;
      default:
        return <TeamSetup />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full p-4 md:p-8">
      <header className="w-full max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <Goal className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            League Auctioneer
          </h1>
        </div>
      </header>
      <div className="w-full flex-grow">
        {renderStage()}
      </div>
    </div>
  );
}
