'use client';

import { useRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface PlayerCardProps {
  player: Player & { bidAmount: number, teamName: string, teamLogo: string };
  team: Team;
}

export function PlayerCard({ player, team }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = () => {
    if (cardRef.current === null) {
      return;
    }

    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${player.name.toLowerCase().replace(/ /g, '_')}_card.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download player card', err);
      });
  };

  return (
    <div className="space-y-2">
      <Card ref={cardRef} className="overflow-hidden bg-card text-card-foreground">
        <div className="relative aspect-[3/4] bg-muted">
          <Image
            src={player.photoUrl}
            alt={player.name}
            fill
            className="object-cover"
            unoptimized // Use unoptimized for html-to-image to prevent using WebP
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"
          />
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-sm font-light uppercase tracking-widest">{player.position}</p>
            <h3 className="text-2xl font-bold">{player.name}</h3>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={team.logo} alt={team.name} />
                  <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{team.name}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Sold For</span>
                  <span className="font-bold text-lg text-primary">{player.bidAmount.toLocaleString()}</span>
              </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={downloadCard} variant="outline" className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download Card
      </Button>
    </div>
  );
}
