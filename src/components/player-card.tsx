'use client';

import { useRef } from 'react';
import type { Player, Team } from '@/types';
import { toPng } from 'html-to-image';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface PlayerCardProps {
  player: Player & { bidAmount: number; teamName: string; teamLogo: string };
  team: Team;
}

const getPlaceholderImageUrl = (position: string) => {
  const seed = `${position.toLowerCase()}`;
  return `https://picsum.photos/seed/${seed}/600/800`;
};

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
       <div ref={cardRef} className="bg-[#1a1a1a] text-white aspect-[3/4.5] rounded-lg overflow-hidden relative shadow-2xl border-2 border-transparent p-2">
            <div className="absolute inset-0 bg-black/50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232c2c2c' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
            <div className="absolute inset-0 border-[3px] border-yellow-400/50 rounded-md"></div>
            <div className="relative w-full h-full flex flex-col">
                <div className="flex-grow flex">
                    {/* Left side with Player Image */}
                    <div className="w-2/5 h-full relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/90" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}></div>
                        <div className="h-5/6 w-full relative" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}>
                            <Image
                                src={cardImageSrc}
                                alt={player.name}
                                fill
                                className="object-contain object-bottom"
                                unoptimized
                                crossOrigin="anonymous"
                                data-ai-hint="player photo"
                            />
                        </div>
                    </div>
                    {/* Right side with Player Details */}
                    <div className="w-3/5 h-full flex flex-col justify-center items-center text-center p-4 space-y-4">
                        <div>
                            <h3 className="font-headline text-3xl font-bold tracking-wider uppercase leading-tight text-yellow-300">
                                {player.name}
                            </h3>
                        </div>
                        <div className="w-full border-b-2 border-yellow-400/50"></div>
                        <div>
                            <p className="font-body text-yellow-300/80 text-sm uppercase tracking-wider">Sold To</p>
                            <p className="font-headline text-2xl font-bold text-white uppercase leading-tight tracking-wider">
                                {team.name}
                            </p>
                        </div>
                        <Avatar className="h-24 w-24 border-4 border-yellow-400/30 bg-black/50">
                            <AvatarImage src={team.logo} alt={team.name} className="p-1"/>
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="w-full border-b-2 border-yellow-400/50"></div>
                        <div>
                            <p className="font-body text-yellow-300/80 text-sm uppercase tracking-wider">Final Bid</p>
                            <p className="font-headline text-4xl font-bold text-yellow-300">
                                ₹{player.bidAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                 {/* Bottom Banner for Position */}
                <div className="flex-shrink-0 h-[10%] bg-black/70 border-t-2 border-yellow-400/50 flex items-center justify-center">
                    <p className="font-headline text-2xl text-yellow-300 font-bold tracking-widest uppercase">
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
}
