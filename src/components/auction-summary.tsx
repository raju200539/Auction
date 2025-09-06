'use client';

import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, RefreshCw } from 'lucide-react';

export default function AuctionSummary() {
  const { teams, restartAuction } = useAuction();

  const exportToCsv = () => {
    let csvContent = "Team Name,Total Spent,Remaining Purse,Players Bought\n";
    teams.forEach(team => {
      const totalSpent = team.initialPurse - team.purse;
      const playersList = team.players.map(p => `${p.name} (${p.bidAmount.toLocaleString()})`).join('; ');
      csvContent += `"${team.name}",${totalSpent},${team.purse},"${playersList}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'auction_summary.csv');
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
              <Button onClick={exportToCsv} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export as CSV
              </Button>
              <Button onClick={restartAuction}>
                <RefreshCw className="mr-2 h-4 w-4" /> Start New Auction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
