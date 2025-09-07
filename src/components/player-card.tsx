'use client';

import { useRef, useState, useEffect } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player & { bidAmount: number, teamName: string, teamLogo: string };
  team: Team;
}

const getPlaceholderImageUrl = (position: string) => {
    const seed = `${position.toLowerCase()}`;
    return `https://picsum.photos/seed/${seed}/600/800`;
}

export function PlayerCard({ player, team }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardImageSrc = player.photoUrl ? `/api/image?url=${encodeURIComponent(player.photoUrl)}` : getPlaceholderImageUrl(player.position);

  const downloadCard = async () => {
    if (cardRef.current === null) {
      return;
    }
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${player.name.toLowerCase().replace(/ /g, '_')}_card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download player card', err);
      alert('Could not download card. The image may have failed to load due to security restrictions.');
    }
  };

  return (
    <div className="space-y-2">
      <Card ref={cardRef} className="overflow-hidden bg-card text-card-foreground font-sans border-2 border-primary/40 shadow-xl font-body group">
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          <Image
            src={cardImageSrc}
            alt={player.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
            unoptimized
            data-ai-hint="player photo"
            crossOrigin="anonymous"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/80 to-transparent"
          />
           <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-sm font-bold uppercase px-3 py-1 rounded-full shadow-lg">
            {player.position}
          </div>
          <div className="absolute bottom-0 left-0 p-4 text-white w-full">
            <h3 className="text-4xl font-extrabold tracking-tight drop-shadow-xl font-headline uppercase">{player.name}</h3>
          </div>
        </div>
        <CardContent className="p-4 bg-gradient-to-br from-background to-secondary/50 relative">
          <div className="flex items-center justify-between bg-black/10 dark:bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10">
             <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={team.logo} alt={team.name} />
                  <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                    <span className="text-xs text-muted-foreground">Sold To</span>
                    <span className="text-xl font-bold font-headline uppercase text-foreground">{team.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Winning Bid</span>
                  <span className="font-bold text-2xl text-primary drop-shadow-sm">{player.bidAmount.toLocaleString()}</span>
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
