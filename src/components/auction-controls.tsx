'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Tag, SkipForward, Edit, Undo, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export default function AuctionControls() {
  const { teams, players, currentPlayerIndex, assignPlayer, nextPlayer, skipPlayer, undoLastAssignment, lastTransaction } = useAuction();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  
  const currentPlayer = players[currentPlayerIndex];
  const playerAssigned = !!lastTransaction;

  useEffect(() => {
    // Reset controls when the current player changes, as long as it's not due to an undo operation
    setSelectedTeamId(undefined);
    setBidAmount('');
  }, [currentPlayerIndex]);

  const handleAssignPlayer = () => {
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
  };
  
  const handleEdit = () => {
    undoLastAssignment();
  };

  const handleNextPlayer = () => {
    nextPlayer();
  };
  
  const handleSkipPlayer = () => {
    skipPlayer();
  };

  if (!currentPlayer) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardHeader>
          <CardTitle>No Players Left</CardTitle>
          <CardDescription>All players have been auctioned.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className='flex items-center gap-2'><Tag className='h-6 w-6'/>Bidding Controls</CardTitle>
        <CardDescription>Select a team and enter the winning bid amount.</CardDescription>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-6">
            <div className="space-y-4">
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
            </div>
            {playerAssigned && lastTransaction && (
            <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/50 border-2 border-dashed border-green-300 dark:border-green-700 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-bold text-lg text-green-800 dark:text-green-200">
                    Assignment Successful!
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    <span className="font-semibold">{lastTransaction.player.name}</span> assigned to <span className="font-semibold">{teams.find(t => t.id === lastTransaction.teamId)?.name}</span> for {lastTransaction.player.bidAmount.toLocaleString()}.
                  </p>
                </div>
            </div>
            )}
        </CardContent>
      </ScrollArea>
      <CardFooter className="bg-muted/50 p-6 flex-shrink-0 border-t">
          {!playerAssigned ? (
          <div className="flex w-full gap-2">
              <Button onClick={handleAssignPlayer} className="w-full">
              <Tag className="mr-2 h-4 w-4" />
              Assign Player
              </Button>
              <Button onClick={handleSkipPlayer} variant="outline" className="w-full bg-background">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Player
              </Button>
              <Button onClick={undoLastAssignment} variant="outline" className="w-full bg-background" disabled={!lastTransaction}>
                  <Undo className="mr-2 h-4 w-4" />
                  Undo Last
              </Button>
          </div>
          ) : (
          <div className="flex w-full gap-2">
              <Button onClick={handleNextPlayer} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Next Player <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleEdit} variant="outline" className="w-full bg-background">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
              </Button>
          </div>
          )}
      </CardFooter>
    </Card>
  );
}
