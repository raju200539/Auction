
'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

interface PlayerCardProps {
  player: Player & { bidAmount: number; teamName: string; teamLogo: string };
  team: Team;
}

export interface PlayerCardHandle {
  getImageDataUrl: () => Promise<string | null>;
}

const getPlaceholderImageUrl = (position: string, name: string) => {
  const seed = `${position.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return `https://picsum.photos/seed/${seed}/100/100`;
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
      <Card>
        <CardContent className="p-0">
          <div ref={cardRef} className="p-4 bg-card rounded-lg">
            <div className="flex gap-4 items-center">
                 <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border">
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
                 <div className="flex flex-col gap-1 flex-grow">
                     <h3 className="font-bold text-lg leading-tight">{player.name}</h3>
                     <p className="text-sm text-muted-foreground">{player.position}</p>
                     <div className="flex items-center gap-2 pt-1">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={player.teamLogo} alt={player.teamName} className="object-cover" />
                            <AvatarFallback>{player.teamName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{player.teamName}</span>
                     </div>
                     <p className="font-mono text-xl font-semibold text-primary mt-1">{player.bidAmount.toLocaleString()}</p>
                 </div>
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
});

PlayerCard.displayName = 'PlayerCard';
