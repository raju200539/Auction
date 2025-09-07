
'use client';

import { usePastAuctions } from '@/hooks/use-past-auctions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

export default function PastAuctionsPage() {
    const { pastAuctions } = usePastAuctions();

    return (
        <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-screen bg-muted/30">
             <header className="w-full max-w-4xl mx-auto mb-8">
                <Button asChild variant="ghost">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Auction
                    </Link>
                </Button>
            </header>
            <main className="w-full max-w-4xl">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <List className="h-6 w-6" />
                            Past Auctions
                        </CardTitle>
                        <CardDescription>
                            Review the results of previously completed auctions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pastAuctions.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p>No past auctions found.</p>
                                <p>Complete an auction to see it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pastAuctions.map((auction) => (
                                    <div key={auction.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">Auction from {new Date(auction.date).toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">{auction.teams.length} teams, {auction.teams.reduce((acc, t) => acc + t.players.length, 0)} players sold</p>
                                        </div>
                                        <Button asChild>
                                             <Link href={`/past-auctions/${auction.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
