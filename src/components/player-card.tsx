
'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface PlayerCardProps {
  player: Player & { bidAmount: number; teamName: string; teamLogo: string };
  team: Team;
}

export interface PlayerCardHandle {
  getImageDataUrl: () => Promise<string | null>;
}

const getPlaceholderImageUrl = (position: string, name: string) => {
  const seed = `${position.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return `https://picsum.photos/seed/${seed}/600/800`;
};

export const PlayerCard = forwardRef<PlayerCardHandle, PlayerCardProps>(({ player, team }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const cardImageSrc = player.photoUrl ? `/api/image?url=${encodeURIComponent(player.photoUrl)}` : getPlaceholderImageUrl(player.position, player.name);

  const getImageDataUrl = async (): Promise<string | null> => {
     if (cardRef.current === null) {
      return null;
    }
    try {
      return await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    } catch (err) {
      console.error('Failed to generate player card image', err);
      return null;
    }
  }

  useImperativeHandle(ref, () => ({
    getImageDataUrl,
  }));
  
  const downloadCard = async () => {
    const dataUrl = await getImageDataUrl();
     if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${player.name.toLowerCase().replace(/ /g, '_')}_card.png`;
        link.href = dataUrl;
        link.click();
    } else {
        toast({
            title: 'Download Failed',
            description: 'Could not create the card image. The player photo might be inaccessible.',
            variant: 'destructive'
        });
    }
  };
  
  return (
    <div className="space-y-2">
      <div ref={cardRef} className="bg-card text-card-foreground aspect-[3/4.2] rounded-xl overflow-hidden relative shadow-2xl border-2 border-primary/20">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-background/50 opacity-40" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 30%, hsl(var(--background)) 80%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
          
          <div className="relative w-full h-full flex flex-col p-1">
              {/* Main Content Area */}
              <div className="flex-grow w-full flex flex-col items-center justify-start p-4 text-center">
                  <div className="relative w-32 h-32 rounded-full border-4 border-amber-400/50 shadow-lg overflow-hidden bg-background/50 mb-4">
                      <Image
                          src={cardImageSrc}
                          alt={player.name}
                          fill
                          className="object-contain"
                          unoptimized
                          crossOrigin="anonymous"
                          data-ai-hint="player photo"
                      />
                  </div>
                  <h3 className="font-headline text-3xl font-bold tracking-wider uppercase leading-tight text-foreground" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      {player.name}
                  </h3>
                  <p className="font-body text-primary/80 text-lg uppercase tracking-wider">{player.position}</p>
              </div>

              {/* Middle Section with Team and Bid */}
              <div className="flex-shrink-0 w-full flex items-end justify-between px-4 pb-4">
                  <div className="text-left">
                      <p className="font-body text-primary/80 text-xs uppercase tracking-wider">Sold To:</p>
                      <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-12 w-12 border-2 border-primary/30 bg-background/50 p-1 flex-shrink-0">
                              <AvatarImage src={team.logo} alt={team.name} className="object-contain" />
                              <AvatarFallback className="bg-transparent text-xs">{team.name.substring(0, 3)}</AvatarFallback>
                          </Avatar>
                          <p className="font-headline text-xl font-bold text-foreground uppercase tracking-wider">
                              {team.name}
                          </p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="font-body text-primary/80 text-xs uppercase tracking-wider">Final Bid</p>
                      <p className="font-headline text-4xl font-bold text-primary" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(player.bidAmount)}
                      </p>
                  </div>
              </div>

              {/* Bottom Banner for Position */}
              <div className="flex-shrink-0 h-[10%] bg-background/80 border-t-2 border-primary/50 flex items-center justify-center rounded-b-lg">
                  <p className="font-headline text-2xl text-primary font-bold tracking-widest uppercase">
                      {player.position}
                  </p>
              </div>
          </div>
      </div>
      <Button onClick={downloadCard} variant="outline" className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download Card
      </Button>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';
