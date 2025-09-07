'use client';

import React from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Wallet } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TeamSidebar() {
  const { teams } = useAuction();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: teams.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68, // Approximate height of each team item (p-2 + avatar + gaps)
    overscan: 5,
  });

  return (
    <Card className="md:sticky md:top-8 h-full flex flex-col max-h-[calc(100vh-4rem)]">
      <CardHeader>
        <CardTitle>Teams Dashboard</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow" ref={parentRef}>
        <CardContent>
            <div
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
            }}
            >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const team = teams[virtualItem.index];
                return (
                <div
                    key={team.id}
                    style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                >
                    <Avatar className="h-12 w-12 border">
                    <AvatarImage src={team.logo} alt={team.name} />
                    <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                    <p className="font-semibold text-foreground">{team.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        <span>{team.purse.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{team.players.length} players</span>
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
