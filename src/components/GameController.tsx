'use client';

import { useState } from 'react';
import type { Character } from '@/engine/types';
import { ENCOUNTER_CONFIGS } from '@/data/encounters';
import { BattleScene } from '@/components/BattleScene';
import { EncounterCompleteScreen } from '@/components/EncounterCompleteScreen';

type ControllerPhase =
  | 'BATTLE'
  | 'ENCOUNTER_COMPLETE'
  | 'GAME_OVER';

/**
 * GameController — Encounter state machine managing E1→E2→E3 transitions.
 *
 * Responsibilities:
 *   - Tracks encounterIndex (which encounter is active)
 *   - Tracks battleKey (force-remounts BattleScene on encounter advance or retry)
 *   - HP carries between encounters; EN resets to maxEn; status effects cleared (ENC-05)
 *   - New party member added on transition (newPartyMember from EncounterConfig)
 *   - Game Over retries current encounter (not full restart from E1)
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
    if (encounterIndex >= ENCOUNTER_CONFIGS.length - 1) {
      // All encounters done — Phase 4 handles AEGIS-7; for Phase 3 show complete
      setControllerPhase('ENCOUNTER_COMPLETE');
      setCompletedParty(finalParty);
      return;
    }
    // ENC-05: HP carries, EN resets to maxEn, status effects cleared, isDefending cleared
    const nextParty = finalParty.map(c => ({
      ...c,
      en: c.maxEn,
      isDefending: false,
      statusEffects: [],
      isDefeated: false,
    }));
    // Add new party member for next encounter (if any)
    const nextConfig = ENCOUNTER_CONFIGS[encounterIndex + 1]!;
    const alreadyInParty = nextParty.map(c => c.id);
    const newMember = nextConfig.newPartyMember;
    const nextPartyFull = newMember && !alreadyInParty.includes(newMember.id)
      ? [...nextParty, newMember]
      : nextParty;

    setCompletedParty(finalParty);
    setCarryParty(nextPartyFull);
    setControllerPhase('ENCOUNTER_COMPLETE');
  };

  const handleGameOver = () => {
    // Retry current encounter (not full restart from E1) — END-03/04
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
