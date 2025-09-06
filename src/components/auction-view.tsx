'use client';

import AuctionCore from '@/components/auction-core';
import TeamSidebar from '@/components/team-sidebar';

export default function AuctionView() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0">
        <TeamSidebar />
      </aside>
      <main className="flex-grow min-w-0">
        <AuctionCore />
      </main>
    </div>
  );
}
