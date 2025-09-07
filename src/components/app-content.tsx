
'use client';

import { useAuction } from '@/hooks/use-auction';
import TeamSetup from '@/components/team-setup';
import PlayerUpload from '@/components/player-upload';
import AuctionView from '@/components/auction-view';
import AuctionSummary from '@/components/auction-summary';
import { Goal } from 'lucide-react';
import InterstitialMessage from './interstitial-message';

export function AppContent() {
  const { stage, interstitialMessage, clearInterstitial } = useAuction();

  const renderStage = () => {
    // Always render InterstitialMessage if it exists, regardless of stage
    if (interstitialMessage) {
        return <InterstitialMessage 
                  title={interstitialMessage.title} 
                  description={interstitialMessage.description}
                  onContinue={clearInterstitial} 
               />;
    }

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

  const isAuctionStage = stage === 'auction' && !interstitialMessage;
  const isInterstitialStage = !!interstitialMessage;

  return (
    <div className={`flex flex-col w-full ${isAuctionStage ? 'h-screen' : `min-h-screen items-center justify-start ${!isInterstitialStage && 'p-4 md:p-8'}`}`}>
       {isInterstitialStage && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10"></div>
       )}
      <header className={`w-full ${isAuctionStage ? 'p-4 md:p-6' : 'max-w-7xl mx-auto mb-8'} relative z-20`}>
        <div className="flex items-center gap-3">
          <Goal className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            League Auctioneer
          </h1>
        </div>
      </header>
      <div className={`w-full ${isAuctionStage ? 'flex-grow overflow-hidden' : 'flex justify-center items-center'} relative z-20`}>
        {renderStage()}
      </div>
    </div>
  );
}
