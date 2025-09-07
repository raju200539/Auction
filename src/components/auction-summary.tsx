
'use client';
import { useState } from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, RefreshCw, Trophy, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerCard } from './player-card';

const getPlaceholderImageUrl = (position: string) => {
    const seed = `${position.toLowerCase()}`;
    return `https://picsum.photos/seed/${seed}/100/100`;
}

export default function AuctionSummary({ isPastAuction = false }: { isPastAuction?: boolean}) {
  const { teams, restartAuction } = useAuction();
  const [activeTab, setActiveTab] = useState('team-summary');

  const exportTeamSummaryToCsv = () => {
    let csvContent = "";
    teams.forEach(team => {
      const totalSpent = team.initialPurse - team.purse;
      csvContent += `Team Name,Total Spent,Remaining Purse\n`;
      csvContent += `"${team.name}",${totalSpent},${team.purse}\n`;
      csvContent += `Player Name,Bid Amount\n`;
      if (team.players.length > 0) {
        team.players.forEach(player => {
          csvContent += `"${player.name}",${player.bidAmount}\n`;
        });
      } else {
        csvContent += `No players bought,0\n`;
      }
      csvContent += `\n`; // Add a blank line between teams for readability
    });

    downloadCsv(csvContent, 'team_summary.csv');
  };

  const exportPlayerSummaryToCsv = () => {
    let csvContent = "Player Name,Position,Sold To,Bid Amount\n";
    teams.forEach(team => {
      team.players.forEach(player => {
        csvContent += `"${player.name}","${player.position}","${team.name}",${player.bidAmount}\n`;
      });
    });
    downloadCsv(csvContent, 'player_summary.csv');
  };

  const downloadCsv = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex justify-center items-start w-full">
      <Card className="w-full max-w-7xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6" /> Auction Results
              </CardTitle>
              <CardDescription>Review the final results of the auction.</CardDescription>
            </div>
            {!isPastAuction && (
                <div className="flex gap-2">
                <Button onClick={restartAuction}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Start New Auction
                </Button>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team-summary" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <TabsList>
                <TabsTrigger value="team-summary">Team View</TabsTrigger>
                <TabsTrigger value="player-summary">Player View</TabsTrigger>
                <TabsTrigger value="player-cards">Player Cards</TabsTrigger>
              </TabsList>
              <div>
                {activeTab === 'team-summary' && (
                   <Button onClick={exportTeamSummaryToCsv} variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Export Teams
                    </Button>
                )}
                {activeTab === 'player-summary' && (
                  <Button onClick={exportPlayerSummaryToCsv} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Players
                  </Button>
                )}
              </div>
            </div>
            <TabsContent value="team-summary">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Remaining Purse</TableHead>
                      <TableHead>Players Bought</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map(team => {
                      const totalSpent = team.initialPurse - team.purse;
                      return (
                        <TableRow key={team.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={team.logo} alt={team.name} />
                                <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{totalSpent.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{team.purse.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              {team.players.map((player, index) => (
                                <div key={`${team.id}-${player.id}-${index}`}>
                                  {player.name} - <span className="text-muted-foreground">{player.bidAmount.toLocaleString()}</span>
                                </div>
                              ))}
                              {team.players.length === 0 && <span className="text-muted-foreground">No players bought</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="player-summary">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Sold To</TableHead>
                      <TableHead className="text-right">Bid Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.flatMap(team => team.players.map(player => ({...player, teamName: team.name, teamLogo: team.logo}))).sort((a,b) => b.bidAmount - a.bidAmount).map(player => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage className="object-cover object-top" src={player.photoUrl ? `/api/image?url=${encodeURIComponent(player.photoUrl)}` : getPlaceholderImageUrl(player.position)} alt={player.name} />
                                <AvatarFallback>
                                  <User />
                                </AvatarFallback>
                              </Avatar>
                              {player.name}
                            </div>
                        </TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={player.teamLogo} alt={player.teamName} />
                                <AvatarFallback>{player.teamName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {player.teamName}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{player.bidAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
             <TabsContent value="player-cards">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {teams.flatMap(team => team.players.map(player => ({...player, teamName: team.name, teamLogo: team.logo}))).sort((a,b) => b.bidAmount - a.bidAmount).map(player => (
                        <PlayerCard key={player.id} player={player} team={teams.find(t => t.name === player.teamName)!} />
                    ))}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
