'use client';

import { useState } from 'react';
import { BattleScene } from '@/components/BattleScene';

export default function Home() {
  const [battleKey, setBattleKey] = useState(0);

  const handleGameOver = () => {
    // React key increment destroys and recreates BattleScene (END-03, END-04)
    // All state (useReducer, useState) inside BattleScene resets completely
    setBattleKey(k => k + 1);
  };

  return (
    <main className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <BattleScene key={battleKey} onGameOver={handleGameOver} />
    </main>
  );
}
