---
status: partial
phase: 02-encounter-1-deadzone-solo
source: [02-VERIFICATION.md]
started: 2026-04-26T12:25:00.000Z
updated: 2026-04-26T12:25:00.000Z
---

## Current Test

[awaiting human testing — run `npm run dev` and open http://localhost:3000]

## Tests

### 1. Browser renders battle scene without errors
expected: No console errors; Blue Wave corridor gradient background visible; Press Start 2P pixel font rendering; DEADZONE sprite fallback visible with cyan-neon color; Casting Probe MK-I sprite fallback visible on enemy side
result: [pending]

### 2. ATTACK action completes full turn cycle
expected: Click [ATACAR]; combat log shows damage number (≈16); floating damage number animates above enemy sprite; enemy HP bar drains with CSS transition (600ms ease-out); 600ms later enemy counterattacks; DEADZONE HP bar drains
result: [pending]

### 3. SKILL action (Signal Null) works with EN cost
expected: Click [HABILIDADE] with DEADZONE EN ≥ 8; combat log shows "Signal Null" or similar; electric animation effect visible; enemy takes ≈18 damage (defPenetration:0.7); DEADZONE EN decreases by 8; HABILIDADE button dims when EN < 8
result: [pending]

### 4. DEFEND action halves incoming damage
expected: Click [DEFENDER]; DEADZONE shows [DEFENDING] indicator in CharacterHUD; on enemy's turn, damage received is roughly half of ATTACK damage; isDefending clears after action resolves
result: [pending]

### 5. ITEM action heals DEADZONE
expected: Click [ITEM] with nanoMed > 0; DEADZONE HP increases by up to 30; combat log shows heal; [ITEM] button dims/disables when nanoMed = 0
result: [pending]

### 6. Victory screen appears when enemy defeated
expected: After enemy HP reaches 0, VictoryScreen renders over battle; "MISSÃO CONCLUÍDA" or equivalent text visible; Blue Wave aesthetic preserved
result: [pending]

### 7. Game Over screen appears when DEADZONE defeated
expected: After DEADZONE HP reaches 0, GameOverScreen renders; "GAME OVER" text visible; [REINICIAR] button present
result: [pending]

### 8. Retry (battleKey reset) works
expected: Click [REINICIAR] on GameOverScreen; battle scene resets completely — DEADZONE and Probe MK-I both at full HP; fresh combat log; no stale state from prior run
result: [pending]

### 9. Animated damage number self-removes
expected: Floating damage number floats upward and fades out within ~1 second; does not accumulate on screen across multiple attacks
result: [pending]

### 10. Screen flash on enemy attack
expected: Brief screen flash (opacity flicker or color pulse) when enemy hits DEADZONE; visible but not disruptive
result: [pending]

### 11. Corridor gradient background visible
expected: Dark steel-blue gradient background behind battle scene (ASSETS-03); not plain black
result: [pending]

### 12. Sprite image-rendering pixelated (VISUAL-02)
expected: Sprite fallback divs appear with crisp pixel edges, not blurred; check in browser DevTools that image-rendering: pixelated is applied
result: [pending]

### 13. ActionMenu keyboard shortcuts work
expected: Press A → ATTACK fires; S → SKILL fires (if EN ≥ 8); D → DEFEND fires; I → ITEM fires (if nanoMed > 0); shortcuts disabled during enemy turn
result: [pending]

### 14. No Strict Mode double-fire on INIT
expected: No duplicate INIT dispatch in React Strict Mode (dev server); battle starts with correct single combatant set; no doubled HP values; check browser console for double-dispatch warnings
result: [pending]

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0
blocked: 0

## Gaps
