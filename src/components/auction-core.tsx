'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateDynamicPlayerCard } from '@/ai/flows/generate-dynamic-player-card';
import { getImageDataUri } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Download, Loader2, Tag, User } from 'lucide-react';

export default function AuctionCore() {
  const { teams, players, currentPlayerIndex, assignPlayer, nextPlayer } = useAuction();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCardUri, setGeneratedCardUri] = useState<string | null>(null);
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

    setIsGenerating(true);
    setGeneratedCardUri(null);

    try {
      const photoUrl = await getImageDataUri(currentPlayer.photoUrl);
      const result = await generateDynamicPlayerCard({
        playerName: currentPlayer.name,
        position: currentPlayer.position,
        photoUrl: photoUrl,
        teamName: team.name,
        teamLogoUrl: team.logo,
        bidAmount: bidAmount,
        remainingPurse: team.purse - bidAmount,
      });

      assignPlayer(team.id, bidAmount);
      setGeneratedCardUri(result.playerCardDataUri);
      setPlayerAssigned(true);
      toast({ title: 'Player Assigned!', description: `${currentPlayer.name} sold to ${team.name} for ${bidAmount.toLocaleString()}.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Card Generation Failed', description: 'Could not generate the player card. Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleNextPlayer = () => {
    nextPlayer();
    setPlayerAssigned(false);
    setGeneratedCardUri(null);
    setBidAmount('');
    setSelectedTeamId(undefined);
  };

  const downloadImage = () => {
    if (!generatedCardUri) return;
    const link = document.createElement('a');
    link.href = generatedCardUri;
    link.download = `${currentPlayer.name.replace(/\s+/g, '_')}_card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Button onClick={handleAssignPlayer} disabled={isGenerating || playerAssigned} className="w-full">
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Tag className="mr-2" />}
              {isGenerating ? 'Generating Card...' : 'Assign Player & Generate Card'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedCardUri && (
        <Card>
          <CardHeader>
            <CardTitle>Final Player Card</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src={generatedCardUri}
              alt={`Final card for ${currentPlayer.name}`}
              width={400}
              height={500}
              className="rounded-lg border shadow-lg"
              data-ai-hint="player card"
            />
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-4">
             <Button onClick={downloadImage} variant="secondary">
              <Download className="mr-2" />
              Download Card
            </Button>
            <Button onClick={handleNextPlayer} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              Next Player <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {!generatedCardUri && !isGenerating && playerAssigned && (
         <Button onClick={handleNextPlayer} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
            Next Player <ArrowRight className="ml-2" />
        </Button>
      )}
    </div>
  );
}
