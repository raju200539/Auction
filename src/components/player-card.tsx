
'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Button } from './ui/button';
import { Download, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const cardImageSrc = player.photoUrl
    ? `/api/image?url=${encodeURIComponent(player.photoUrl)}&v=${new Date().getTime()}`
    : getPlaceholderImageUrl(player.position, player.name);

  const getImageDataUrl = async (): Promise<string | null> => {
     if (cardRef.current === null) {
      return null;
    }
    try {
      return await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        // The cross-origin attribute on the img tag is crucial for this to work
      });
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
      <div
        ref={cardRef}
        className="bg-[#1a1a1a] text-white aspect-[3/4.2] rounded-xl overflow-hidden relative shadow-2xl border-2 border-yellow-400/20 w-full max-w-sm mx-auto flex flex-col"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <div className='flex-grow flex p-3 gap-2 min-h-0'>
            {/* Left Column - Image */}
            <div className='w-[45%] h-full flex flex-col'>
                 <div
                    className="relative w-full h-full bg-gray-200"
                    style={{ clipPath: 'polygon(0 5%, 100% 0, 100% 95%, 0% 100%)' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src={cardImageSrc}
                            alt={player.name}
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain"
                            data-ai-hint="player photo"
                        />
                    </div>
                     <div className="absolute inset-0 border-2 border-yellow-400/80" style={{ clipPath: 'polygon(0 5%, 100% 0, 100% 95%, 0% 100%)' }}></div>
                </div>
            </div>
            {/* Right Column - Details */}
            <div className='w-[55%] h-full flex flex-col justify-center items-start text-left p-2 space-y-4'>
                <div>
                  <h3 className="font-headline text-2xl font-bold tracking-wider uppercase text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
                      {player.name}
                  </h3>
                   <p className="font-headline text-lg text-yellow-300 font-semibold tracking-widest uppercase">
                      {player.position}
                  </p>
                </div>

                <div className="w-full border-b border-yellow-400/20 my-1"></div>

                 <div>
                    <p className="text-sm uppercase text-yellow-400/70 tracking-widest">Sold To:</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-8 w-8 border border-yellow-400/50">
                            <AvatarImage src={player.teamLogo} alt={player.teamName} className="object-cover" />
                            <AvatarFallback>{player.teamName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-base">{player.teamName}</span>
                    </div>
                </div>

                 <div>
                    <p className="text-sm uppercase text-yellow-400/70 tracking-widest">Final Bid Amount</p>
                    <p className="font-mono text-3xl font-bold text-white mt-1">
                        <span className="font-sans">₹</span>{player.bidAmount.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        {/* Footer - Position */}
        <div className="flex-shrink-0 bg-black/80 p-3 border-t-2 border-yellow-400/50 flex items-center justify-center rounded-b-lg">
             <p className="font-headline text-xl text-yellow-300 font-bold tracking-widest uppercase">
                  {player.position}
              </p>
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
