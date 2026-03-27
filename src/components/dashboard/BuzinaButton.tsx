import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

const playBuzina = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Layer 1: Main horn tone
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(220, audioCtx.currentTime);
  osc1.frequency.linearRampToValueAtTime(280, audioCtx.currentTime + 0.1);
  osc1.frequency.setValueAtTime(280, audioCtx.currentTime + 0.8);
  gain1.gain.setValueAtTime(0, audioCtx.currentTime);
  gain1.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
  gain1.gain.setValueAtTime(0.4, audioCtx.currentTime + 0.7);
  gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  
  // Layer 2: Harmonic
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc2.frequency.linearRampToValueAtTime(560, audioCtx.currentTime + 0.1);
  gain2.gain.setValueAtTime(0, audioCtx.currentTime);
  gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
  gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.7);
  gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  
  // Layer 3: Sub bass
  const osc3 = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(110, audioCtx.currentTime);
  gain3.gain.setValueAtTime(0, audioCtx.currentTime);
  gain3.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
  gain3.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.7);
  gain3.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  osc3.connect(gain3);
  gain3.connect(audioCtx.destination);

  osc1.start(audioCtx.currentTime);
  osc2.start(audioCtx.currentTime);
  osc3.start(audioCtx.currentTime);
  osc1.stop(audioCtx.currentTime + 1.0);
  osc2.stop(audioCtx.currentTime + 1.0);
  osc3.stop(audioCtx.currentTime + 1.0);
};

export function BuzinaButton() {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    playBuzina();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
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
