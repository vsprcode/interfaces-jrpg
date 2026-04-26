# [In]terfaces — JRPG Demo

A playable browser JRPG set in the [In]terfaces universe (2042, Pre-Transhuman Era). Control analog resistance agents infiltrating a Casting Syndicate Arcology through 4 progressive encounters, culminating in a boss fight against AEGIS-7 — the corporation's heavy enforcement unit.

No traditional heroism. Just survival and structural resistance in a system designed to control.

**[Play the demo →](https://interfaces-jrpg.vercel.app)** *(link updated after deploy)*

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict
- **Tailwind CSS v4** + CSS Modules (Blue Wave palette)
- **useReducer** — battle state management
- **Vitest 2** + @testing-library/react — 155+ tests
- **Press Start 2P** — pixel font via next/font
- **Vercel** — deploy

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:3000)
npm run dev

# Run test suite
npm run test

# Production build
npm run build
```

---

## Encounters

| # | Enemy | Party |
|---|-------|-------|
| 1 | Casting Probe MK-I | DEADZONE solo |
| 2 | 2x Networker Enforcer | + TORC |
| 3 | 3x Casting Patrol Bot | + TRINETRA |
| 4 | AEGIS-7 (boss) | Full trio |

**OVERDRIVE mechanic:** When AEGIS-7 HP drops below 100, it telegraphs TERMINUS — a wipe attack. Every alive party member must use [DEFENDER] or die.

---

## Characters

| Code | Name | Class | Ability |
|------|------|-------|---------|
| DEADZONE | Jack Rourke | Ghost/Carrier | Signal Null — electric dmg, ignores 30% DEF |
| TORC | Saorla Byrne | Striker/Adorned | Forge Wall — DEF +8 group buff, 2 turns |
| TRINETRA | Animesh Rao | Seer/Visionary | System Override — 30 HP heal OR remove status |

---

## Universe

The [In]terfaces Agreement (2042): your device is your identity. The Casting Syndicate controls neural-implanted citizens through Arcologia-7, São Paulo. The analog resistance — those without implants — infiltrates from the margins.

*"Objective: cross the arcology. No heroes. Just an exit."*
