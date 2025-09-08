
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
      <div ref={cardRef} className="bg-[#1a1a1a] text-white aspect-[3/4.2] rounded-xl overflow-hidden relative shadow-2xl border-2 border-yellow-400/20 w-full max-w-sm mx-auto flex flex-col">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/50 opacity-40" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 30%, #1a1a1a 80%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        
        <div className="relative flex-grow flex flex-col p-1">
          {/* Image Container */}
          <div className="flex-grow relative border-2 border-yellow-400/80 rounded-t-lg overflow-hidden">
            <Image
                src={cardImageSrc}
                alt={player.name}
                fill
                className="object-contain object-top"
                unoptimized
                crossOrigin="anonymous"
                data-ai-hint="player photo"
            />
          </div>

          {/* Details Container */}
          <div className="flex-shrink-0 bg-black/80 p-4 border-t-2 border-yellow-400/50 rounded-b-lg flex flex-col justify-center items-center text-center gap-2">
            <h3 className="font-headline text-2xl font-bold tracking-wider uppercase text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
                {player.name}
            </h3>
            <p className="font-headline text-lg text-yellow-300 font-bold tracking-widest uppercase -mt-1">
                {player.position}
            </p>

            <div className="w-full border-b border-yellow-400/20 my-1"></div>

            <p className="text-xs uppercase text-yellow-400/70 tracking-widest">Sold To:</p>
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-yellow-400/50">
                    <AvatarImage src={player.teamLogo} alt={player.teamName} />
                    <AvatarFallback>{player.teamName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{player.teamName}</span>
            </div>

            <p className="text-xs uppercase text-yellow-400/70 tracking-widest mt-2">Final Bid Amount</p>
            <p className="font-mono text-2xl font-bold text-white">
                <span className="font-sans">₹</span>{player.bidAmount.toLocaleString()}
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
