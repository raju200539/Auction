'use client';

import { useState, type ChangeEvent } from 'react';
import { useAuction } from '@/hooks/use-auction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Image as ImageIcon, Wallet, ArrowLeft, Palette } from 'lucide-react';
import type { Team } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

type Step = 'config' | 'details';
type TeamSetupData = Partial<Team & { initialPurse: number }>;


export default function TeamSetup() {
  const { setTeams: setAuctionTeams, startAuction } = useAuction();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('config');
  const [numTeams, setNumTeams] = useState(4);
  const [teams, setTeams] = useState<TeamSetupData[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  const handleTeamDataChange = (field: keyof Team | 'initialPurse', value: string | number) => {
    const newTeams = [...teams];
    const currentTeam = newTeams[currentTeamIndex] || { id: currentTeamIndex };
    
    if (field === 'initialPurse') {
        newTeams[currentTeamIndex] = { ...currentTeam, initialPurse: Number(value) };
    } else {
        newTeams[currentTeamIndex] = { ...currentTeam, [field]: value };
    }
    setTeams(newTeams);
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Logo = await fileToBase64(file);
        handleTeamDataChange('logo', base64Logo);
      } catch (error) {
        toast({
          title: "Logo Upload Failed",
          description: "There was an error converting the image.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleStartDetails = () => {
    if (numTeams <= 0) {
        toast({
            title: "Invalid Configuration",
            description: "Please enter a valid number of teams.",
            variant: "destructive",
        });
        return;
    }
    setTeams(Array.from({ length: numTeams }, (_, i) => ({ id: i, initialPurse: 100000, color: '#1D4ED8' })));
    setCurrentTeamIndex(0);
    setStep('details');
  };

  const handleNextTeam = () => {
    const currentTeam = teams[currentTeamIndex];
    if (!currentTeam?.name || !currentTeam.initialPurse || currentTeam.initialPurse <= 0) {
      toast({
        title: "Incomplete Details",
        description: "Please provide a name and a valid purse amount for the current team.",
        variant: "destructive",
      });
      return;
    }
    setCurrentTeamIndex(prev => prev + 1);
  };
  
  const handleBack = () => {
      if (currentTeamIndex > 0) {
          setCurrentTeamIndex(prev => prev -1);
      } else {
          setStep('config');
      }
  }

  const handleFinishSetup = () => {
    const currentTeam = teams[currentTeamIndex];
    if (!currentTeam?.name || !currentTeam.initialPurse || currentTeam.initialPurse <= 0) {
      toast({
        title: "Incomplete Details",
        description: "Please provide a name and a valid purse for the final team.",
        variant: "destructive",
      });
      return;
    }

    const finalTeams: Team[] = teams.map(
      (team, index) =>
        ({
          id: index,
          name: team.name!,
          logo: team.logo || '',
          color: team.color || '#1D4ED8',
          initialPurse: team.initialPurse!,
          purse: team.initialPurse!,
          players: [],
        })
    );
    setAuctionTeams(finalTeams);
    startAuction();
  };

  const currentTeam = teams[currentTeamIndex];
  const isFinalTeam = currentTeamIndex === numTeams - 1;

  if (step === 'config') {
    return (
       <div className="flex justify-center items-start w-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Users className="h-6 w-6" /> Initial Setup
                    </CardTitle>
                    <CardDescription>
                        First, let's set the basic parameters for your auction.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="num-teams">Number of Teams</Label>
                        <Input
                            id="num-teams"
                            type="number"
                            value={numTeams}
                            onChange={(e) => setNumTeams(parseInt(e.target.value) || 0)}
                            min="1"
                            placeholder="e.g., 4"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleStartDetails} size="lg">
                        Next: Enter Team Details
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-start w-full">
        <Card className="w-full max-w-md">
            <CardHeader>
                 <Button variant="ghost" size="sm" className="absolute top-4 left-4 text-muted-foreground" onClick={handleBack}>
                    <ArrowLeft className="mr-2" /> Back
                </Button>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl pt-8">
                    <Users className="h-6 w-6" /> Team Details
                </CardTitle>
                 <CardDescription className="text-center">
                    Enter the details for Team {currentTeamIndex + 1} of {numTeams}.
                </CardDescription>
                <Progress value={((currentTeamIndex + 1) / numTeams) * 100} className="w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex justify-center">
                    <Avatar className="h-24 w-24 border-4 border-muted" style={{ borderColor: currentTeam?.color }}>
                      <AvatarImage src={currentTeam?.logo} alt={currentTeam?.name} />
                      <AvatarFallback>{currentTeam?.name ? currentTeam.name.charAt(0) : currentTeamIndex + 1}</AvatarFallback>
                    </Avatar>
                  </div>
                 <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={currentTeam?.name || ''}
                      onChange={e => handleTeamDataChange('name', e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-logo" className='flex items-center gap-2'><ImageIcon className='h-4 w-4' /> Team Logo (Optional)</Label>
                    <Input
                      id="team-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="initial-purse"><Wallet className='inline-block mr-2 h-4 w-4' />Initial Purse</Label>                    
                        <Input
                            id="initial-purse"
                            type="number"
                            value={currentTeam?.initialPurse || ''}
                            onChange={e => handleTeamDataChange('initialPurse', parseInt(e.target.value, 10) || 0)}
                            placeholder="e.g., 100000"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="team-color" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Team Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="team-color"
                                type="color"
                                value={currentTeam?.color || '#1D4ED8'}
                                onChange={(e) => handleTeamDataChange('color', e.target.value)}
                                className="p-1 h-10 w-14"
                            />
                             <Input
                                type="text"
                                value={currentTeam?.color || '#1D4ED8'}
                                onChange={(e) => handleTeamDataChange('color', e.target.value)}
                                placeholder="e.g., #1D4ED8"
                                className="w-full"
                             />
                        </div>
                    </div>
            </CardContent>
            <CardFooter>
                {isFinalTeam ? (
                    <Button onClick={handleFinishSetup} size="lg" className="w-full">
                        Finish Setup & Upload Players
                    </Button>
                ) : (
                    <Button onClick={handleNextTeam} size="lg" className="w-full">
                        Next Team
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
