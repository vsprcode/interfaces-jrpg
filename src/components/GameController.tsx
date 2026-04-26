'use client';

import React, { useState } from 'react';
import type { Character } from '@/engine/types';
import { ENCOUNTER_CONFIGS } from '@/data/encounters';
import { BattleScene } from '@/components/BattleScene';
import { EncounterCompleteScreen } from '@/components/EncounterCompleteScreen';
import { DialogueBox } from '@/components/DialogueBox';
import { DemoCompletedScreen } from '@/components/DemoCompletedScreen';

type ControllerPhase =
  | 'OPENING_DIALOGUE'       // cinematic intro before E1 (NARR-01)
  | 'BATTLE'
  | 'ENCOUNTER_2_DIALOGUE'
  | 'ENCOUNTER_3_DIALOGUE'
  | 'ENCOUNTER_4_DIALOGUE'   // AEGIS-7 reveal before E4 (ENC-04)
  | 'CLOSING_DIALOGUE'       // cinematic outro after AEGIS-7 defeat (NARR-01)
  | 'ENCOUNTER_COMPLETE'
  | 'DEMO_COMPLETED'         // shown after closing dialogue (END-01)
  | 'GAME_OVER';

// Opening cinematic — shown before E1 on first load and on NOVA INFILTRACAO (NARR-01)
const OPENING_DIALOGUE_LINES = [
  { speaker: 'SISTEMA', text: 'Arcologia Casting-7. São Paulo. 2042. Protocolo Interfaces Agreement em vigor — identidade = dispositivo.' },
  { speaker: 'SISTEMA', text: 'Chuva ácida no Corredor 7-A. Visibilidade: 12%. Patrulhas: 3 setores ativos.' },
  { speaker: 'DEADZONE', text: 'Rourke. Ghost. Sem implante neural, sem rastro no grid. Aqui começa a infiltração.' },
  { speaker: 'DEADZONE', text: 'Objetivo: atravessar a arcologia. Sem heróis. Apenas saída.' },
];

// Closing cinematic — shown after AEGIS-7 defeat before DemoCompletedScreen (NARR-01)
const CLOSING_DIALOGUE_LINES = [
  { speaker: 'SISTEMA', text: 'AEGIS-7 neutralizado. Câmara de Comando: protocolo de lockdown em 90 segundos.' },
  { speaker: 'TRINETRA', text: 'Os dados foram extraídos. O que a Casting Syndicate queria esconder agora está conosco.' },
  { speaker: 'DEADZONE', text: 'Isso foi um setor. A arcologia tem dezesseis.' },
  { speaker: 'SISTEMA', text: '>>> DEMO ENCERRADA. PRÓXIMO CAPÍTULO EM BREVE. <<<' },
];

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

// Lore dialogue shown before E4 — AEGIS-7 reveal (ENC-04)
const E4_DIALOGUE = [
  { speaker: 'DEADZONE', text: 'AEGIS-7. Unidade de enforcement pesado da Casting.' },
  { speaker: 'TORC', text: 'HP 200. ATK 28. DEF 15. Protocolo de eliminação ativo.' },
  { speaker: 'TRINETRA', text: 'Quando o contador chegar a zero — use DEFENDER. Sem exceções.' },
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
  const [controllerPhase, setControllerPhase] = useState<ControllerPhase>('OPENING_DIALOGUE');
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
    } else if (encounterIndex === 2) {
      // E3 complete → AEGIS-7 reveal dialogue before E4 (ENC-04)
      // No new party member for E4 — full trio already present
      setCarryParty(nextParty);
      setControllerPhase('ENCOUNTER_4_DIALOGUE');
    } else if (encounterIndex === 3) {
      // E4 complete (AEGIS-7 defeated) → closing cinematic before DEMO COMPLETED (NARR-01)
      setControllerPhase('CLOSING_DIALOGUE');
    } else {
      // Fallback for any future encounters beyond E4
      setControllerPhase('ENCOUNTER_COMPLETE');
    }
  };

  const handleGameOver = () => {
    // Retry current encounter (not full restart from E1) — END-03/04
    setBattleKey(k => k + 1);
    setControllerPhase('BATTLE');
  };

  // Called when opening cutscene finishes — transition to first battle (NARR-01)
  const handleOpeningComplete = () => setControllerPhase('BATTLE');

  // Called when closing cutscene finishes — transition to DemoCompletedScreen (NARR-01)
  const handleClosingComplete = () => setControllerPhase('DEMO_COMPLETED');

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

  // END-05: reset to E1 from DemoCompletedScreen — replays opening cutscene (NARR-01: NOVA INFILTRACAO must not skip intro)
  const handleNewGame = () => {
    setEncounterIndex(0);
    setCarryParty(ENCOUNTER_CONFIGS[0]!.party);
    setBattleKey(k => k + 1);
    setControllerPhase('OPENING_DIALOGUE');
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/9' }}>
      {controllerPhase === 'OPENING_DIALOGUE' && (
        <DialogueBox lines={OPENING_DIALOGUE_LINES} onComplete={handleOpeningComplete} />
      )}
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
      {controllerPhase === 'ENCOUNTER_4_DIALOGUE' && (
        <DialogueBox lines={E4_DIALOGUE} onComplete={handleDialogueComplete} />
      )}
      {controllerPhase === 'CLOSING_DIALOGUE' && (
        <DialogueBox lines={CLOSING_DIALOGUE_LINES} onComplete={handleClosingComplete} />
      )}
      {controllerPhase === 'ENCOUNTER_COMPLETE' && (
        <EncounterCompleteScreen
          party={completedParty}
          encounterIndex={encounterIndex}
          onContinue={handleContinue}
        />
      )}
      {controllerPhase === 'DEMO_COMPLETED' && (
        <DemoCompletedScreen onNewGame={handleNewGame} />
      )}
    </div>
  );
}
