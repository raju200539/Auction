
'use client';

import { usePastAuctions } from '@/hooks/use-past-auctions';
import AuctionSummary from '@/components/auction-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { AuctionContext } from '@/hooks/use-auction';
import { type Team } from '@/types';

function PastAuctionDetail({ id }: { id: string }) {
    const { getAuctionById } = usePastAuctions();
    const auction = getAuctionById(id);

    if (!auction) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card>
                    <CardHeader>
                        <CardTitle>Auction Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The requested auction could not be found.</p>
                        <Button asChild className="mt-4">
                            <Link href="/past-auctions">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Past Auctions
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const mockAuctionContext = {
        teams: auction.teams as Team[],
        restartAuction: () => {},
        stage: 'summary' as const,
        players: [],
        currentPlayerIndex: 0,
        lastTransaction: null,
        interstitialMessage: null,
        setTeams: () => {},
        setStage: () => {},
        setPlayers: () => {},
        assignPlayer: () => {},
        skipPlayer: () => {},
        nextPlayer: () => {},
        startAuction: () => {},
        undoLastAssignment: () => {},
        clearInterstitial: () => {},
    };

    return (
        <AuctionContext.Provider value={mockAuctionContext}>
            <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-screen bg-muted/30">
                 <header className="w-full max-w-7xl mx-auto mb-8 flex justify-between items-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-primary" />
                        Past Auction Results
                    </h1>
                    <Button asChild variant="outline">
                        <Link href="/past-auctions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Link>
                    </Button>
                </header>
                <main className="w-full">
                     <AuctionSummary isPastAuction={true} />
                </main>
            </div>
        </AuctionContext.Provider>
    )
}

export default function PastAuctionDetailPage({ params: { id } }: { params: { id: string } }) {
    return <PastAuctionDetail id={id} />;
}
