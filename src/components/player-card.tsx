'use client';

import { useRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface PlayerCardProps {
  player: Player & { bidAmount: number, teamName: string, teamLogo: string };
  team: Team;
}

const getFontEmbedCss = async () => {
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  try {
    const response = await fetch(fontUrl);
    const cssText = await response.text();
    const style = document.createElement('style');
    style.innerHTML = cssText;
    return style.outerHTML;
  } catch (error) {
    console.error('Failed to fetch font CSS:', error);
    return '';
  }
}

export function PlayerCard({ player, team }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    if (cardRef.current === null) {
      return;
    }
    
    const fontEmbedCss = await getFontEmbedCss();

    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, fontEmbedCSS: fontEmbedCss })
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
      <Card ref={cardRef} className="overflow-hidden bg-card text-card-foreground font-sans border-2 border-primary/20 shadow-lg font-body">
        <div className="relative aspect-[3/4] bg-muted">
          <Image
            src={player.photoUrl}
            alt={player.name}
            fill
            className="object-cover object-top"
            unoptimized // Use unoptimized for html-to-image to prevent using WebP
          />
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/70 to-transparent"
          />
           <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-bold uppercase px-2 py-1 rounded-full">
            {player.position}
          </div>
          <div className="absolute bottom-0 left-0 p-4 text-white w-full">
            <h3 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">{player.name}</h3>
          </div>
        </div>
        <CardContent className="p-4 bg-background">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-muted">
                  <AvatarImage src={team.logo} alt={team.name} />
                  <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                    <span className="text-xs text-muted-foreground">Sold To</span>
                    <span className="text-sm font-bold">{team.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Winning Bid</span>
                  <span className="font-bold text-xl text-primary">{player.bidAmount.toLocaleString()}</span>
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
