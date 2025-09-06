'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function AuctionCore() {
  const { teams, players, currentPlayerIndex, assignPlayer, nextPlayer } = useAuction();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [playerAssigned, setPlayerAssigned] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  const handleAssignPlayer = async () => {
    if (!selectedTeamId || bidAmount === '' || bidAmount <= 0) {
      toast({ title: 'Invalid Bid', description: 'Please select a team and enter a valid bid amount.', variant: 'destructive' });
      return;
    }

    const team = teams.find(t => t.id === parseInt(selectedTeamId));
    if (!team) return;

    if (bidAmount > team.purse) {
      toast({ title: 'Insufficient Funds', description: `${team.name} does not have enough purse for this bid.`, variant: 'destructive' });
      return;
    }

    assignPlayer(team.id, bidAmount);
    setPlayerAssigned(true);
    toast({ title: 'Player Assigned!', description: `${currentPlayer.name} sold to ${team.name} for ${bidAmount.toLocaleString()}.` });
  };
  
  const handleNextPlayer = () => {
    nextPlayer();
    setPlayerAssigned(false);
    setBidAmount('');
    setSelectedTeamId(undefined);
  };

  if (!currentPlayer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Players Left</CardTitle>
          <CardDescription>All players have been auctioned.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const assignedTeam = teams.find(t => t.id === parseInt(selectedTeamId || ''));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{currentPlayer.name}</CardTitle>
          <CardDescription className="text-lg">{currentPlayer.position}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            <Image
              src={currentPlayer.photoUrl}
              alt={currentPlayer.name}
              fill
              className="object-cover"
              data-ai-hint="player photo"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Assign to Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={playerAssigned}>
                <SelectTrigger id="team-select" className="w-full">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name} (Purse: {team.purse.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid-amount">Bid Amount</Label>
              <Input
                id="bid-amount"
                type="number"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value === '' ? '' : parseInt(e.target.value))}
                disabled={playerAssigned}
              />
            </div>
            <Button onClick={handleAssignPlayer} disabled={playerAssigned} className="w-full">
              <Tag className="mr-2" />
              Assign Player
            </Button>
          </div>
        </CardContent>
      </Card>

      {playerAssigned && assignedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Player Sold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className='flex items-center gap-4'>
                 <Avatar className="h-16 w-16 border">
                  <AvatarImage src={assignedTeam.logo} alt={assignedTeam.name} />
                  <AvatarFallback>{assignedTeam.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-semibold">{currentPlayer.name}</p>
                    <p className='text-muted-foreground'>Sold to {assignedTeam.name}</p>
                </div>
              </div>
            <div className="text-4xl font-bold text-primary text-center py-4">
              {bidAmount.toLocaleString()}
            </div>
            <div className='text-sm text-muted-foreground text-center'>
              Remaining Purse: {(assignedTeam.purse).toLocaleString()}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleNextPlayer} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
              Next Player <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
