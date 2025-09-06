'use client';

import { useState, type ChangeEvent } from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import type { Player } from '@/types';
import { useToast } from '@/hooks/use-toast';

const parseCsv = (csvText: string): Player[] => {
  const rows = csvText.split('\n').filter(row => row.trim() !== '');
  const headers = rows.shift()?.split(',').map(h => h.trim().toLowerCase()) || [];
  
  const nameIndex = headers.indexOf('name');
  const positionIndex = headers.indexOf('position');
  let photoUrlIndex = headers.indexOf('photourl');
  if (photoUrlIndex === -1) {
    photoUrlIndex = headers.indexOf('photo url');
  }
  if (photoUrlIndex === -1) {
    photoUrlIndex = headers.indexOf('photo');
  }

  if (nameIndex === -1 || positionIndex === -1 || photoUrlIndex === -1) {
    throw new Error('CSV must contain "Name", "Position", and "Photo URL" (or "Photo") columns.');
  }

  return rows.map(row => {
    const values = row.split(',');
    return {
      name: values[nameIndex]?.trim() || '',
      position: values[positionIndex]?.trim() || '',
      photoUrl: values[photoUrlIndex]?.trim() || '',
    };
  }).filter(p => p.name && p.position && p.photoUrl);
};


export default function PlayerUpload() {
  const { setPlayers, setStage } = useAuction();
  const { toast } = useToast();
  const [elitePlayers, setElitePlayers] = useState<Player[]>([]);
  const [normalPlayers, setNormalPlayers] = useState<Player[]>([]);
  const [eliteFileName, setEliteFileName] = useState('');
  const [normalFileName, setNormalFileName] = useState('');

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    playerType: 'elite' | 'normal'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (playerType === 'elite') setEliteFileName(file.name);
      else setNormalFileName(file.name);

      const text = await file.text();
      try {
        const parsedPlayers = parseCsv(text);
        if (playerType === 'elite') {
          setElitePlayers(parsedPlayers);
        } else {
          setNormalPlayers(parsedPlayers);
        }
        toast({
          title: "File Uploaded Successfully",
          description: `${file.name} contained ${parsedPlayers.length} players.`,
        });
      } catch (error) {
        toast({
          title: "CSV Parsing Error",
          description: (error as Error).message,
          variant: "destructive",
        });
        if (playerType === 'elite') setEliteFileName('');
        else setNormalFileName('');
      }
    }
  };

  const handleSubmit = () => {
    if (elitePlayers.length === 0 && normalPlayers.length === 0) {
      toast({
        title: "No Players Uploaded",
        description: "Please upload at least one player list to begin.",
        variant: "destructive",
      });
      return;
    }
    setPlayers(elitePlayers, normalPlayers);
    setStage('auction');
  };

  return (
    <div className="flex justify-center items-start w-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Upload className="h-6 w-6" /> Player Data Upload
          </CardTitle>
          <CardDescription>
            Upload CSV files for elite and normal players. Each file must have columns: Name, Position, Photo URL (or Photo).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="elite-players-csv">Elite Players List (.csv)</Label>
            <Input id="elite-players-csv" type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'elite')} />
            {eliteFileName && <p className="text-sm text-muted-foreground">File: {eliteFileName} ({elitePlayers.length} players)</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="normal-players-csv">Normal Players List (.csv)</Label>
            <Input id="normal-players-csv" type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'normal')} />
            {normalFileName && <p className="text-sm text-muted-foreground">File: {normalFileName} ({normalPlayers.length} players)</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={elitePlayers.length === 0 && normalPlayers.length === 0} size="lg">
            Begin Auction
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
