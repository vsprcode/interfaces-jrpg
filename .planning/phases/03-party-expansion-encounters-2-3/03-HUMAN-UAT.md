# Phase 3 Human UAT Checklist

**Status:** Pending player verification
**When to run:** After waking from sleep — `npm run dev` then open http://localhost:3000

---

## E1 -> E2 Transition

- [ ] 1. Play Encounter 1: defeat Casting Probe MK-I
- [ ] 2. DialogueBox appears: first line is "TORC: Voce sobreviveu ao corredor"; advance 3 times
- [ ] 3. Encounter 2 starts: DEADZONE + TORC in party HUD; 2 Networker Enforcers in enemy zone
- [ ] 4. On TORC's turn: click HABILIDADE -> Forge Wall resolves -> SHIELD badges appear on DEADZONE and TORC HUDs (shows "SHIELD 2T")
- [ ] 5. Play 1 full round: SHIELD badge decrements from 2T to 1T after round wrap
- [ ] 6. Networker Enforcer turn: battle log shows "mira no alvo mais vulneravel" (TARGET_LOWEST_HP)
- [ ] 7. Take a heavy hit (>= 19 damage on DEADZONE): camera shake fires briefly
- [ ] 8. Defeat both Enforcers: EncounterCompleteScreen shows party HP + CONTINUAR button

## E2 -> E3 Transition

- [ ] 9. Click CONTINUAR: DialogueBox shows TRINETRA intro; advance 3 times
- [ ] 10. Encounter 3 starts: full trio (DEADZONE + TORC + TRINETRA) in party HUD; 3 Patrol Bots in enemy zone
- [ ] 11. On TRINETRA's turn: click HABILIDADE -> target picker appears with alive party members
- [ ] 12. Click DEADZONE -> CURAR and LIMPAR STATUS buttons appear
- [ ] 13. Click CURAR -> System Override heal dispatches; TRINETRA EN decreases by 10; DEADZONE HP increases
- [ ] 14. Skill heal ripple effect fires (cyan ripple on HUD area)
- [ ] 15. Patrol Bot turn: battle log shows "varre o setor aleatoriamente" (ATTACK_RANDOM)
- [ ] 16. TurnOrderIndicator visible above enemy zone: shows upcoming combatants in SPD order
- [ ] 17. Defeat all 3 Patrol Bots: EncounterCompleteScreen appears ("Sala de Servidores: Patrol Bots neutralizados")

## Game Over Retry

- [ ] 18. Let party die in any encounter: Game Over screen appears
- [ ] 19. Click TENTAR NOVAMENTE: same encounter restarts (not E1)

---

**Pass criteria:** All 19 steps verified without console errors.
