
'use client';

import Image from 'next/image';
import { useAuction } from '@/hooks/use-auction';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

const getPlaceholderImageUrl = (position: string, name: string) => {
    const seed = `${position.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    return `https://picsum.photos/seed/${seed}/600/800`;
}

export default function PlayerDisplay() {
  const { players, currentPlayerIndex } = useAuction();
  const currentPlayer = players[currentPlayerIndex];

  if (!currentPlayer) {
    return (
       <Card className="h-full flex items-center justify-center bg-muted/30 border-dashed">
        <div className="text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2"/>
          <p>No Active Player</p>
        </div>
      </Card>
    );
  }

  const cardImageSrc = currentPlayer.photoUrl ? `/api/image?url=${encodeURIComponent(currentPlayer.photoUrl)}` : getPlaceholderImageUrl(currentPlayer.position, currentPlayer.name);

  return (
    <div className="bg-[#1a1a1a] text-white aspect-[3/4.2] rounded-xl overflow-hidden relative shadow-2xl border-2 border-yellow-400/20 w-full max-w-sm mx-auto">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/50 opacity-40" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 30%, #1a1a1a 80%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        
        <div className="relative w-full h-full flex flex-col p-1">
          <div className='flex-grow flex min-h-0'>
            <div className="w-full h-full relative p-1">
                <div className="relative h-full w-full border-2 border-yellow-400/80">
                      <Image
                          src={cardImageSrc}
                          alt={currentPlayer.name}
                          fill
                          className="object-contain object-center"
                          unoptimized
                          crossOrigin="anonymous"
                          data-ai-hint="player photo"
                      />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                     <h3 className="font-headline text-4xl font-bold tracking-wider uppercase leading-tight text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)'}}>
                        {currentPlayer.name}
                    </h3>
                </div>
            </div>
          </div>
          {/* Bottom Banner for Position */}
          <div className="flex-shrink-0 h-[10%] bg-black/80 border-t-2 border-yellow-400/50 flex items-center justify-center rounded-b-lg">
              <p className="font-headline text-3xl text-yellow-300 font-bold tracking-widest uppercase">
                  {currentPlayer.position}
              </p>
          </div>
        </div>
    </div>
  );
}
