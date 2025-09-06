'use client';

import { useAuction } from '@/hooks/use-auction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Wallet } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export default function TeamSidebar() {
  const { teams } = useAuction();

  return (
    <Card className="sticky top-8 h-full flex flex-col">
      <CardHeader>
        <CardTitle>Teams Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
            {teams.map(team => (
            <div key={team.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
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
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
