'use client';

import Image from 'next/image';
import { useAuction } from '@/hooks/use-auction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

const getPlaceholderImageUrl = (position: string) => {
    const seed = `${position.toLowerCase()}`;
    return `https://picsum.photos/seed/${seed}/800/600`;
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

  const photoUrl = currentPlayer.photoUrl || getPlaceholderImageUrl(currentPlayer.position);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{currentPlayer.name}</CardTitle>
        <CardDescription className="text-lg">{currentPlayer.position}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow relative rounded-b-lg overflow-hidden bg-muted">
        <Image
            src={photoUrl}
            alt={currentPlayer.name}
            fill
            className="object-cover"
            data-ai-hint="player photo"
            sizes="(max-width: 1280px) 100vw, 50vw"
        />
      </CardContent>
    </Card>
  );
}
