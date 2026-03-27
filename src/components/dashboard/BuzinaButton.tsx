import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

export function BuzinaButton() {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    const audio = new Audio('/sounds/buzina.m4a');
    audio.play();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2000);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="lg"
      className={`gap-2 border-2 border-yellow-500 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-bold transition-all ${
        animating ? 'scale-110 ring-4 ring-yellow-400/50 animate-pulse' : ''
      }`}
    >
      <Volume2 className={`h-5 w-5 ${animating ? 'animate-bounce' : ''}`} />
      🎉 VENDAAAA!
    </Button>
  );
}
