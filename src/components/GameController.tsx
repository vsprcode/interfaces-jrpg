'use client';

import { useState } from 'react';
import type { Character } from '@/engine/types';
import { ENCOUNTER_CONFIGS } from '@/data/encounters';
import { BattleScene } from '@/components/BattleScene';
import { EncounterCompleteScreen } from '@/components/EncounterCompleteScreen';
import { DialogueBox } from '@/components/DialogueBox';

type ControllerPhase =
  | 'BATTLE'
  | 'ENCOUNTER_2_DIALOGUE'
  | 'ENCOUNTER_3_DIALOGUE'
  | 'ENCOUNTER_COMPLETE'
  | 'GAME_OVER';

// Lore dialogue shown before E2 — TORC intro
const E2_DIALOGUE = [
  { speaker: 'TORC', text: 'Você sobreviveu ao corredor. Impressionante para um Ghost.' },
  { speaker: 'TORC', text: 'Saorla Byrne. Striker. Não venho pelo heroísmo — venho pela saída.' },
  { speaker: 'DEADZONE', text: 'Forge Wall primeiro. Perguntas depois.' },
];

// Lore dialogue shown before E3 — TRINETRA intro
const E3_DIALOGUE = [
  { speaker: 'TRINETRA', text: 'Meus sensores captaram o padrão de vocês dois. Eficiência aceitável.' },
  { speaker: 'TRINETRA', text: 'Animesh Rao. Visionário. System Override já está calibrado.' },
  { speaker: 'TORC', text: 'Trio completo. Próxima sala: Patrol Bots. Sigam minha formação.' },
];

/**
 * GameController — Encounter state machine managing E1→E2→E3 transitions.
 *
 * Responsibilities:
 *   - Tracks encounterIndex (which encounter is active)
 *   - Tracks battleKey (force-remounts BattleScene on encounter advance or retry)
 *   - HP carries between encounters; EN resets to maxEn; status effects cleared (ENC-05)
 *   - New party member added on transition (newPartyMember from EncounterConfig)
 *   - Game Over retries current encounter (not full restart from E1)
 *   - DialogueBox shown before E2 (TORC intro) and before E3 (TRINETRA intro)
 *   - EncounterCompleteScreen shown between encounters with party HP snapshot
 */
export function GameController() {
  const [encounterIndex, setEncounterIndex] = useState(0);
  // T-03-04-03: battleKey increments on both game-over retry and encounter advance
  const [battleKey, setBattleKey] = useState(0);
  const [controllerPhase, setControllerPhase] = useState<ControllerPhase>('BATTLE');
  // carryParty: HP persists between encounters; EN resets; status effects cleared (ENC-05)
  const [carryParty, setCarryParty] = useState<Character[]>(ENCOUNTER_CONFIGS[0]!.party);
  const [completedParty, setCompletedParty] = useState<Character[]>([]);

  const config = ENCOUNTER_CONFIGS[encounterIndex]!;

  const handleVictory = (finalParty: Character[]) => {
    // ENC-05: HP carries, EN resets to maxEn, status effects cleared, isDefending cleared
    const nextParty = finalParty.map(c => ({
      ...c,
      en: c.maxEn,
      isDefending: false,
      statusEffects: [],
      isDefeated: false,
    }));
    setCompletedParty(finalParty);

    if (encounterIndex === 0) {
      // E1 complete → show TORC intro dialogue before E2
      const nextConfig = ENCOUNTER_CONFIGS[1]!;
      const withTorc = nextConfig.newPartyMember
        ? [...nextParty, nextConfig.newPartyMember]
        : nextParty;
      setCarryParty(withTorc);
      setControllerPhase('ENCOUNTER_2_DIALOGUE');
    } else if (encounterIndex === 1) {
      // E2 complete → show TRINETRA intro dialogue before E3
      const nextConfig = ENCOUNTER_CONFIGS[2]!;
      const withTrinetra = nextConfig.newPartyMember
        ? [...nextParty, nextConfig.newPartyMember]
        : nextParty;
      setCarryParty(withTrinetra);
      setControllerPhase('ENCOUNTER_3_DIALOGUE');
    } else {
      // E3+ → show encounter complete screen
      setControllerPhase('ENCOUNTER_COMPLETE');
    }
  };

  const handleGameOver = () => {
    // Retry current encounter (not full restart from E1) — END-03/04
    setBattleKey(k => k + 1);
    setControllerPhase('BATTLE');
  };

  // Called when DialogueBox finishes — advance to next encounter
  const handleDialogueComplete = () => {
    setEncounterIndex(i => i + 1);
    setBattleKey(k => k + 1);
    setControllerPhase('BATTLE');
  };

  const handleContinue = () => {
    setEncounterIndex(i => i + 1);
    setBattleKey(k => k + 1);
    setControllerPhase('BATTLE');
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/9' }}>
      {controllerPhase === 'BATTLE' && (
        <BattleScene
          key={battleKey}
          party={carryParty}
          enemies={config.enemies}
          encounterIndex={encounterIndex}
          onVictory={handleVictory}
          onGameOver={handleGameOver}
        />
      )}
      {controllerPhase === 'ENCOUNTER_2_DIALOGUE' && (
        <DialogueBox lines={E2_DIALOGUE} onComplete={handleDialogueComplete} />
      )}
      {controllerPhase === 'ENCOUNTER_3_DIALOGUE' && (
        <DialogueBox lines={E3_DIALOGUE} onComplete={handleDialogueComplete} />
      )}
      {controllerPhase === 'ENCOUNTER_COMPLETE' && (
        <EncounterCompleteScreen
          party={completedParty}
          encounterIndex={encounterIndex}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
