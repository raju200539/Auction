'use client';

import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuctionSummary() {
  const { teams, restartAuction } = useAuction();

  const exportTeamSummaryToCsv = () => {
    let csvContent = "Team Name,Total Spent,Remaining Purse,Players Bought\n";
    teams.forEach(team => {
      const totalSpent = team.initialPurse - team.purse;
      const playersList = team.players.map(p => `${p.name} (${p.bidAmount.toLocaleString()})`).join('; ');
      csvContent += `"${team.name}",${totalSpent},${team.purse},"${playersList}"\n`;
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
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Auction Summary</CardTitle>
              <CardDescription>Review the final results of the auction.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={restartAuction}>
                <RefreshCw className="mr-2 h-4 w-4" /> Start New Auction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team-summary">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="team-summary">Team Summary</TabsTrigger>
                <TabsTrigger value="player-summary">Player Summary</TabsTrigger>
              </TabsList>
               <Button onClick={exportTeamSummaryToCsv} variant="outline" className="hidden data-[state=active]:flex">
                  <Download className="mr-2 h-4 w-4" /> Export Team Summary
                </Button>
                <Button onClick={exportPlayerSummaryToCsv} variant="outline" className="hidden data-[state=active]:flex">
                  <Download className="mr-2 h-4 w-4" /> Export Player Summary
                </Button>
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
                                <AvatarImage src={team.logo} />
                                <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{totalSpent.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{team.purse.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              {team.players.map(player => (
                                <div key={player.id}>
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
                    {teams.flatMap(team => team.players.map(player => ({...player, teamName: team.name}))).sort((a,b) => b.bidAmount - a.bidAmount).map(player => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>{player.teamName}</TableCell>
                        <TableCell className="text-right font-mono">{player.bidAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
