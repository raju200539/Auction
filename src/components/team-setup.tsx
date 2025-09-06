'use client';

import { useState, type ChangeEvent, useMemo } from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Image as ImageIcon, Wallet } from 'lucide-react';
import type { Team } from '@/types';
import { useToast } from '@/hooks/use-toast';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export default function TeamSetup() {
  const { setTeams: setAuctionTeams, startAuction } = useAuction();
  const { toast } = useToast();
  const [numTeams, setNumTeams] = useState<number | ''>('');
  const [teams, setTeams] = useState<Partial<Team>[]>([]);

  const handleNumTeamsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    if (value === '' || (value > 0 && value <= 20)) {
      setNumTeams(value);
      if (value !== '') {
        setTeams(Array.from({ length: value }, (_, i) => ({ id: i })));
      } else {
        setTeams([]);
      }
    }
  };

  const handleTeamDataChange = (index: number, field: keyof Team, value: string | number) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], [field]: value };
    setTeams(newTeams);
  };

  const handleLogoUpload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Logo = await fileToBase64(file);
      handleTeamDataChange(index, 'logo', base64Logo);
    }
  };

  const isFormComplete = useMemo(() => {
    if (teams.length === 0) return false;
    return teams.every(
      team => team.name && team.logo && team.initialPurse && team.initialPurse > 0
    );
  }, [teams]);

  const handleSubmit = () => {
    if (!isFormComplete) {
       toast({
        title: "Incomplete Setup",
        description: "Please fill in all details for every team.",
        variant: "destructive",
      });
      return;
    }
    const finalTeams = teams.map(
      (team, index) =>
        ({
          id: index,
          name: team.name!,
          logo: team.logo!,
          initialPurse: team.initialPurse!,
          purse: team.initialPurse!,
          players: [],
        } as Team)
    );
    setAuctionTeams(finalTeams);
    startAuction();
  };

  return (
    <div className="flex justify-center items-start w-full">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6" /> Team Setup
          </CardTitle>
          <CardDescription>
            Enter the number of teams, their names, logos, and starting purse amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="w-full max-w-xs space-y-2">
            <Label htmlFor="num-teams">Number of Teams</Label>
            <Input
              id="num-teams"
              type="number"
              min="1"
              max="20"
              value={numTeams}
              onChange={handleNumTeamsChange}
              placeholder="e.g., 8"
            />
          </div>

          {teams.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, index) => (
                <Card key={index} className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={team.logo} alt={team.name} />
                      <AvatarFallback>{team.name ? team.name.charAt(0) : index + 1}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">Team {index + 1}</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`team-name-${index}`}>Team Name</Label>
                    <Input
                      id={`team-name-${index}`}
                      value={team.name || ''}
                      onChange={e => handleTeamDataChange(index, 'name', e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`team-logo-${index}`} className='flex items-center gap-2'><ImageIcon className='h-4 w-4' /> Team Logo</Label>
                    <Input
                      id={`team-logo-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(index, e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`team-purse-${index}`} className='flex items-center gap-2'><Wallet className='h-4 w-4' /> Initial Purse</Label>
                    <Input
                      id={`team-purse-${index}`}
                      type="number"
                      value={team.initialPurse || ''}
                      onChange={e =>
                        handleTeamDataChange(index, 'initialPurse', parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="e.g., 100000"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={!isFormComplete || teams.length === 0} size="lg">
            Next: Upload Players
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
