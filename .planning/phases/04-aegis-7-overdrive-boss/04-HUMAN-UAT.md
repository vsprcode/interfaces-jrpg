# Phase 4 — Human UAT Checklist

**Status:** Pending browser verification
**Command:** `npm run dev` then open localhost:3000

## E4 Access Flow
- [ ] E1 victory → TORC dialogue → E2 → E2 victory → TRINETRA dialogue → E3 → E3 victory → AEGIS-7 dialogue ("AEGIS-7 detectado...") → E4 begins

## E4 Battle — Normal Phase
- [ ] AEGIS-7 appears with HP 200 (SpriteFallback CSS silhouette)
- [ ] command_chamber background visible (dark magenta/purple gradient)
- [ ] All three party members (DEADZONE, TORC, TRINETRA) are playable
- [ ] Normal attacks deal damage to AEGIS-7

## OVERDRIVE Mechanic
- [ ] When AEGIS-7 HP drops below 100: "TERMINUS // CARREGANDO" banner appears (magenta border pulse)
- [ ] "USE [DEFENDER] OU SERÁ ELIMINADO" subtitle visible
- [ ] [DEFENDER] button glows cyan during OVERDRIVE_WARNING phase
- [ ] [DEFENDER] is clickable (not blocked by overlay — pointer-events:none working)
- [ ] Player selects [DEFENDER] for all alive characters → party survives next TERMINUS
- [ ] Party member who did NOT defend receives 999 damage → GAME_OVER if all die

## Post-TERMINUS
- [ ] After TERMINUS resolves, battle continues if party alive
- [ ] Next AEGIS-7 turn below 100 HP re-announces OVERDRIVE (fresh warning cycle)

## Demo Completed
- [ ] AEGIS-7 defeat → "DEMO COMPLETED" screen appears
- [ ] ASCII art renders correctly (AEGIS in pixel text)
- [ ] "AEGIS-7 NEUTRALIZADO" and "OPERACAO INTERFACES — COMPLETA" text visible
- [ ] "NOVA INFILTRAÇÃO" button resets to E1 (DEADZONE vs Probe MK-I)

## Regression Check
- [ ] E1 still playable (DEADZONE solo)
- [ ] E2 still playable (DEADZONE + TORC)
- [ ] E3 still playable (full trio)
- [ ] Game Over retry still works in all encounters
