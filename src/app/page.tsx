'use client';

import { GameController } from '@/components/GameController';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <GameController />
    </main>
  );
}
