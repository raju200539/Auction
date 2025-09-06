'use client';

import AuctionControls from '@/components/auction-controls';
import PlayerDisplay from '@/components/player-display';
import TeamSidebar from '@/components/team-sidebar';

export default function AuctionView() {
  return (
    <div className="w-full h-full mx-auto flex flex-col md:flex-row gap-8 px-4 md:px-6 pb-6">
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 md:h-full">
        <TeamSidebar />
      </aside>
      <main className="flex-grow min-w-0 md:h-full grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="h-full hidden xl:block">
            <PlayerDisplay />
        </div>
        <div className="h-full">
            <AuctionControls />
        </div>
      </main>
    </div>
  );
}
