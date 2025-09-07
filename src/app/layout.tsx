import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PastAuctionsProvider } from '@/components/past-auctions-provider';

export const metadata: Metadata = {
  title: 'League Auctioneer',
  description: 'A web application for conducting a Football League Auction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@700&display=swap');
            `,
          }}
        />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <PastAuctionsProvider>
            {children}
        </PastAuctionsProvider>
        <Toaster />
      </body>
    </html>
  );
}
