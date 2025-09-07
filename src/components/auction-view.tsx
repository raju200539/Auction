
'use client';

import AuctionControls from '@/components/auction-controls';
import PlayerDisplay from '@/components/player-display';
import TeamSidebar from '@/components/team-sidebar';
import { ScrollArea } from './ui/scroll-area';
import AuctionCore from './auction-core';

export default function AuctionView() {
  return (
    <div className="w-full max-w-7xl mx-auto flex gap-8 p-4 md:p-8">
      <aside className="w-72 flex-shrink-0">
        <TeamSidebar />
      </aside>
      <main className="flex-grow">
        <AuctionCore />
      </main>
    </div>
  );
}
