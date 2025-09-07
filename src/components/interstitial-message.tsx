
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Info } from 'lucide-react';

interface InterstitialMessageProps {
    title: string;
    description: string;
    onContinue: () => void;
}

export default function InterstitialMessage({ title, description, onContinue }: InterstitialMessageProps) {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Card className="w-full max-w-lg text-center animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <Info className="h-8 w-8" />
            {title}
          </CardTitle>
          <CardDescription className="text-base pt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={onContinue} size="lg">
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
