'use client';

import { useRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player & { bidAmount: number; teamName: string; teamLogo: string };
  team: Team;
}

const getPlaceholderImageUrl = (position: string) => {
  const seed = `${position.toLowerCase()}`;
  return `https://picsum.photos/seed/${seed}/600/800`;
};

// Function to lighten or darken a hex color
const adjustColor = (color: string, amount: number) => {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
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
  
  const teamColor = team.color || 'hsl(var(--primary))';
  const gradientColor = adjustColor(teamColor, -20); // Darken for gradient effect

  return (
    <div className="space-y-2">
      <Card
        ref={cardRef}
        className="overflow-hidden bg-card text-card-foreground font-sans border-0 shadow-xl font-body group aspect-[1/1.25]"
      >
        <div className="flex h-full">
          <div
            className="w-2/5 relative h-full"
            style={{
              backgroundColor: teamColor,
              backgroundImage: `linear-gradient(to bottom right, ${teamColor}, ${gradientColor})`,
            }}
          >
            <Image
              src={cardImageSrc}
              alt={player.name}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              unoptimized
              data-ai-hint="player photo"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
              <h3 className="text-2xl font-bold tracking-tight drop-shadow-lg font-headline uppercase leading-tight">
                {player.name}
              </h3>
            </div>
          </div>
          <div className="w-3/5 bg-background flex flex-col justify-around p-4">
            <div className="text-center">
              <p className="font-headline text-muted-foreground text-sm uppercase">Position</p>
              <p
                className="font-headline text-3xl font-bold uppercase"
                style={{ color: teamColor }}
              >
                {player.position}
              </p>
            </div>

            <div className="text-center">
              <p className="font-headline text-muted-foreground text-sm uppercase">Sold To</p>
               <div className="flex flex-col items-center gap-2 mt-1">
                <Avatar className="h-16 w-16 border-2" style={{borderColor: teamColor}}>
                  <AvatarImage src={team.logo} alt={team.name} />
                  <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-headline text-xl font-bold text-foreground uppercase truncate w-full">
                  {team.name}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="font-headline text-muted-foreground text-sm uppercase">Final Bid</p>
              <p className="font-headline text-4xl font-bold text-foreground">
                ${player.bidAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
      <Button onClick={downloadCard} variant="outline" className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download Card
      </Button>
    </div>
  );
}
