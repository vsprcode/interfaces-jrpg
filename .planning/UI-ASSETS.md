# UI & Visual Assets Guide — [In]terfaces JRPG MVP

Guia completo de UI, layout de telas e prompts para geração de todos os sprites/imagens necessários para o MVP. Estética: **32-bit Sega Saturn era** + paleta **Blue Wave** + influências [In]terfaces.

---

## 1. Direção de Arte (referência mestre)

**Referências visuais:**
- Grandia (Sega Saturn) — sprites de batalha, paleta cinemática
- Mega Man X4 (PS1/Saturn) — efeitos neon, animação fluida
- Castlevania: Symphony of the Night — UI estilizada, fontes
- Blade Runner 2049 — paleta atmosférica, neons azuis
- Ghost in the Shell (filme 1995) — arquitetura cyberpunk asiática

**Paleta Blue Wave (uso obrigatório em TODOS os assets):**

```
Primary:
  #00BFFF  Blue Electric    (highlights, UI principais)
  #0047AB  Blue Cobalt      (sombras médias, fills)
  #00FFFF  Cyan Neon        (glow effects, magia)
  #7DF9FF  Text Glow        (texto destacado, holograms)

Backgrounds:
  #050510  BG Dark          (preto azulado puro)
  #0A0A1A  Shadow Cold      (sombras profundas)
  #1A1A3A  Mid Shadow       (mid-tones de cenário)

Accents (uso restrito):
  #FF00AA  Magenta Alert    (OVERDRIVE warning, perigo)
  #FFD700  Gold Data        (XP/recompensa, raro)
  #FFFFFF  Pure White       (flash de impacto, apenas frames)
```

**Regras de iluminação:**
- Fonte de luz principal SEMPRE azulada (cyan ou cobalto)
- Sprites recebem rim light azul nas bordas
- Sombras nunca pretas puras — sempre azul-escuro
- Magenta APENAS em momento de tensão (OVERDRIVE)

**Tipografia:**
- **Press Start 2P** (Google Fonts) — todos os textos de UI
- Tamanhos: 8px (status), 12px (menus), 16px (diálogo), 24px (títulos)
- Anti-aliasing: DESLIGADO (`image-rendering: pixelated`)

---

## 2. Layout de Telas

### 2.1 Tela de Título (Title Screen)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                 │
│            [LOGO: NEON PROTOCOL]                │
│                                                 │
│         AN [IN]TERFACES SIDE STORY              │
│                                                 │
│                                                 │
│              ▶ INICIAR INFILTRAÇÃO              │
│                CRÉDITOS                         │
│                                                 │
│                                                 │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                 │
│     CASTING SYNDICATE — ARCOLOGIA-7 — 2042     │
└─────────────────────────────────────────────────┘
```

**Fundo:** chuva ácida sobre skyline de arcologia, neon azul piscando ao fundo.

### 2.2 Tela de Diálogo / Cutscene Pré-Batalha

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [BACKGROUND: CORRIDOR + RAIN]           │
│                                                 │
│                  [PORTRAIT]                     │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ ► DEADZONE                                      │
│                                                 │
│ "O sinal aqui é instável. Bom. Eles não vão     │
│  me ver chegando."                              │
│                                                 │
│                                       [▼ NEXT]  │
└─────────────────────────────────────────────────┘
```

### 2.3 Tela de Batalha (CRÍTICA — layout principal)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [ENEMY SPRITES]                    │ ← área inimigos
│         🤖        🤖        🤖                  │
│                                                 │
│                                                 │
│      ╔═══════════════════════════════╗          │ ← efeitos overlay
│      ║   "CARREGANDO TERMINUS"       ║          │   (OVERDRIVE)
│      ╚═══════════════════════════════╝          │
│                                                 │
│                                                 │
│              [PARTY SPRITES]                    │ ← área aliados
│        🥷        ⚔️         🔮                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ STATUS                                          │
│ DEADZONE   HP ████████░░ 95/95   EN █████ 25/25 │
│ TORC       HP ██████████ 130/130  EN ████ 20/20 │
│ TRINETRA   HP ██████░░░░ 50/85   EN ████░ 18/35 │
├─────────────────────────────────────────────────┤
│ ► TURNO DE: DEADZONE                            │
│ ┌───────────┬───────────┬───────────┬────────┐  │
│ │ [ATACAR]  │ HABILIDADE│  DEFENDER │  ITEM  │  │
│ └───────────┴───────────┴───────────┴────────┘  │
└─────────────────────────────────────────────────┘
```

**Notas de layout:**
- 16:9 fixo (1280×720 base, escalável)
- Inimigos no terço superior
- Aliados no terço médio (frente, ligeiramente abaixo)
- HUD de status no terço inferior
- Menu de comandos sempre na parte de baixo
- Tudo em estilo "diorama" — perspectiva levemente isométrica

### 2.4 Tela de Vitória (Victory Screen)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ╔═══════════════════╗                │
│            ║    VICTORY        ║                │
│            ╚═══════════════════╝                │
│                                                 │
│       Inimigos neutralizados.                   │
│                                                 │
│       Dados extraídos:  +50 XP                  │
│       Ítens encontrados: Nano-Med x1            │
│                                                 │
│                                                 │
│                  [▶ CONTINUAR]                  │
└─────────────────────────────────────────────────┘
```

### 2.5 Tela DEMO COMPLETED

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                 │
│           ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄              │
│           DEMO COMPLETED                        │
│           ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀              │
│                                                 │
│         AEGIS-7: SISTEMA OFFLINE                │
│                                                 │
│       Você é fantasma. Eles não viram.          │
│                                                 │
│                                                 │
│         "Próximo capítulo em breve"             │
│                                                 │
│              [▶ NOVA INFILTRAÇÃO]               │
└─────────────────────────────────────────────────┘
```

### 2.6 Tela Game Over

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ███████████████                      │
│            SINAL PERDIDO                        │
│            ███████████████                      │
│                                                 │
│         A Casting localizou você.               │
│         A Arcologia se fechou.                  │
│                                                 │
│              [▶ TENTAR NOVAMENTE]               │
│                [▶ MENU PRINCIPAL]               │
└─────────────────────────────────────────────────┘
```

---

## 3. Inventário de Assets (lista completa MVP)

### 3.1 Sprites de Personagens (3 jogáveis)

| Asset | Frames necessários | Dimensão | Uso |
|-------|-------------------|----------|-----|
| DEADZONE — battle sprite | idle (2 frames), attack (3), hurt (1), defend (1), skill_signal_null (4) | 96×128px | Tela de batalha |
| DEADZONE — portrait | 1 frame estático | 256×256px | Diálogo/menu |
| TORC — battle sprite | idle (2), attack (3), hurt (1), defend (1), skill_forge_wall (4) | 96×128px | Tela de batalha |
| TORC — portrait | 1 frame | 256×256px | Diálogo/menu |
| TRINETRA — battle sprite | idle (2), attack (3), hurt (1), defend (1), skill_system_override (4) | 96×128px | Tela de batalha |
| TRINETRA — portrait | 1 frame | 256×256px | Diálogo/menu |

### 3.2 Sprites de Inimigos (4 tipos)

| Asset | Frames | Dimensão | Uso |
|-------|--------|----------|-----|
| Casting Probe MK-I | idle (2), attack (2), hurt (1), defeat (3) | 80×80px | Fase 1 |
| Networker Enforcer | idle (2), attack (3), hurt (1), defeat (3) | 96×128px | Fase 2 (x2) |
| Casting Patrol Bot | idle (2), attack (2), hurt (1), defeat (3) | 96×112px | Fase 3 (x3) |
| AEGIS-7 (boss) | idle (3), attack (4), hurt (2), overdrive_charge (3), terminus (4), defeat (5) | 256×256px | Fase 4 |

### 3.3 Backgrounds (4 cenários)

| Asset | Dimensão | Uso |
|-------|----------|-----|
| BG_corridor_maintenance | 1280×720px | Fase 1 — corredor de manutenção |
| BG_loading_dock | 1280×720px | Fase 2 — plataforma de carga |
| BG_server_room | 1280×720px | Fase 3 — sala de servidores |
| BG_command_chamber | 1280×720px | Fase 4 — câmara de comando AEGIS |

### 3.4 UI Elements

| Asset | Dimensão | Uso |
|-------|----------|-----|
| HUD_frame_status | 1280×180px | Frame inferior da tela de batalha |
| Menu_frame_command | 800×80px | Botões de ação |
| Dialogue_box_frame | 1280×200px | Caixa de diálogo |
| HP_bar_segment | 8×16px | Tile repetível para barra HP |
| EN_bar_segment | 8×16px | Tile repetível para barra EN |
| Cursor_arrow | 24×24px | Indicador de seleção |
| Title_logo | 800×400px | Logo "NEON PROTOCOL" |

### 3.5 Effect Sprites (overlays)

| Asset | Frames | Dimensão | Uso |
|-------|--------|----------|-----|
| FX_signal_null | 6 frames | 128×128px | Habilidade DEADZONE |
| FX_forge_wall | 5 frames | 192×192px | Habilidade TORC |
| FX_system_override | 6 frames | 128×128px | Habilidade TRINETRA |
| FX_basic_attack_slash | 4 frames | 96×96px | Ataque físico genérico |
| FX_basic_attack_projectile | 4 frames | 64×64px | Ataque ranged inimigo |
| FX_overdrive_warning | 8 frames (loop) | 1280×720px | Tela inteira pulsando magenta |
| FX_screen_flash | 2 frames | 1280×720px | Flash branco crítico |
| FX_damage_number | n/a | 48×24px | Renderizado em CSS, não sprite |

### 3.6 Ícones

| Asset | Dimensão | Uso |
|-------|----------|-----|
| Icon_nano_med | 32×32px | Item consumível |
| Icon_signal_null | 32×32px | Habilidade DEADZONE no menu |
| Icon_forge_wall | 32×32px | Habilidade TORC no menu |
| Icon_system_override | 32×32px | Habilidade TRINETRA no menu |
| Icon_status_def_up | 24×24px | Buff de defesa |
| Icon_status_overdrive | 24×24px | Avisar OVERDRIVE no boss |

**TOTAL: ~30 assets distintos para o MVP.**

---

## 4. Prompts de Geração (Midjourney / DALL-E / Stable Diffusion)

> **Use essas prompts em INGLÊS** — geradores de imagem performam melhor. Adicionar `--style raw` no Midjourney, `--ar 1:1` ou apropriado, e fixar seed para consistência entre frames do mesmo personagem.

### 4.1 Master Style Prefix (use em TODOS os prompts)

```
sega saturn era 32-bit pixel art, JRPG battle sprite, "blue wave" cyberpunk
aesthetic, dominant electric blue and cyan neon palette (#00BFFF #00FFFF
#0047AB), cold deep blue shadows (#0A0A1A background), rim lighting cyan
on character edges, alpha blending transparencies, dithering on shadows,
clean pixel edges no anti-aliasing, Grandia + Mega Man X4 reference,
high-density pixel art (not low-res chunky pixels)
```

### 4.2 Personagens

#### DEADZONE (Jack Rourke)

```
[MASTER STYLE PREFIX]
Character: DEADZONE, irish carrier-class hacker, late 30s, lean tactical
silhouette, wears matte black hooded windbreaker over neoprene undersuit,
fingerless gloves, analog flip-phone clipped to belt, monofilament wire
blade on hip, faded burn-scar across left jaw, eyes hidden in hood shadow
with single cyan reflection. Pose: idle combat stance, weight on back
foot, hands loose. Battle sprite full body, facing 3/4 right.

Frame 1 (idle): standing relaxed, slight breathing motion
Frame 2 (idle): same pose, hood swaying minimally
Frame 3 (attack_1): drawing monoblade
Frame 4 (attack_2): mid-slash, motion blur cyan trail
Frame 5 (attack_3): follow-through, blade extended
Frame 6 (hurt): recoiling backward, knee bent
Frame 7 (defend): arms crossed in front, shoulders raised
Frames 8-11 (skill_signal_null): hands raise, electric cyan pulse
expanding outward, EMP-style ring effect, character at center silhouetted
```

Portrait prompt (separado):

```
[MASTER STYLE PREFIX] high-detail portrait bust, DEADZONE character,
hood pulled low, single cyan eye-glow visible, scar visible on jaw,
neutral expression, looking past camera, blue cobalt gradient background
with subtle data-noise texture
```

#### TORC (Saorla Byrne)

```
[MASTER STYLE PREFIX]
Character: TORC, irish-celtic adorned-class striker, mid 30s, broad
muscular build, wears layered salvage-armor of welded plates and
celtic-knot etched bronze plates, leather harness, copper torc collar
visible at neck (signature ornament), heavy industrial gauntlets, short
red braided hair, freckled determined face, carries massive forge-hammer.
Pose: planted wide stance, hammer rested over shoulder.

Frame 1 (idle): grounded, weight-shifted, hammer resting
Frame 2 (idle): subtle breathing, torc collar catching cyan light
Frame 3 (attack_1): hammer winding back overhead
Frame 4 (attack_2): mid-swing downward, motion lines
Frame 5 (attack_3): impact pose, hammer connected to ground
Frame 6 (hurt): shielded with forearm, knee buckled
Frame 7 (defend): planting hammer-head down, both hands gripping handle
Frames 8-11 (skill_forge_wall): kneels, slams hammer ground, translucent
cyan hexagonal shield wall rises in front of party, alpha blending
```

Portrait:
```
[MASTER STYLE PREFIX] portrait bust of TORC, copper torc collar
prominent, freckles visible, red braid over shoulder, fierce eyes
looking direct, salvage-armor visible at shoulders, blue cobalt gradient
background with metalwork sketch-noise texture
```

#### TRINETRA (Animesh Rao)

```
[MASTER STYLE PREFIX]
Character: TRINETRA, indian visionary-class engineer, late 20s, slender
build, wears clean white-and-cyan technical jacket with subtle hindi
script embroidery, AR visor across eyes (transparent cyan-tinted glass
with three faint glowing dot indicators — the "three eyes"), dark hair
tied back, fingerless data-gloves, two small support drones hovering at
shoulder level (palm-sized hexagonal drones, cyan LEDs).
Pose: gestural, light footed, hands typing in air.

Frame 1 (idle): hands raised gesturing at invisible interface
Frame 2 (idle): drones drift around shoulders
Frame 3 (attack_1): pointing forward sharply
Frame 4 (attack_2): drones dart forward firing
Frame 5 (attack_3): pulling back, arms wide
Frame 6 (hurt): stumbling, visor briefly desync glitch
Frame 7 (defend): drones form triangle shield in front
Frames 8-11 (skill_system_override): visor blazes with three cyan eye
icons, data-streams flow from hands into ally, healing particle effect
```

Portrait:
```
[MASTER STYLE PREFIX] portrait bust of TRINETRA, AR visor catching cyan
light with three small dots glowing, slight smile, drone hovering at
shoulder, blue cobalt gradient background with overlay HUD elements
```

### 4.3 Inimigos

#### Casting Probe MK-I

```
[MASTER STYLE PREFIX]
Enemy sprite: Casting Probe MK-I, surveillance drone, sphere-shaped
80mm body of brushed steel, single large central camera-eye glowing
cyan, four small thrusters around equator, three small antennas on top,
hovering. Subtle Casting Syndicate logo (geometric C+S monogram) etched
on side. Cold mechanical aesthetic.

Frame 1-2 (idle): hovering, slight bobbing, camera-eye scanning
Frame 3 (attack_1): camera-eye locks red, projects targeting laser
Frame 4 (attack_2): firing small cyan plasma bolt
Frame 5 (hurt): sparks from one thruster, slight tilt
Frames 6-8 (defeat): smoke pours, falls, explodes in cyan flash, leaves
debris cloud
```

#### Networker Enforcer

```
[MASTER STYLE PREFIX]
Enemy sprite: Networker Enforcer, Casting Syndicate corporate guard,
human male, tall lean build, wears sleek charcoal-grey corporate
exo-armor with cyan accent lines down the limbs, mirrored visor helmet
(reflects cyan), neural implant port visible at temple, holds collapsible
plasma-baton (cyan glow), strict military posture.

Frame 1-2 (idle): rigid combat stance
Frame 3 (attack_1): baton raised
Frame 4 (attack_2): mid strike forward
Frame 5 (attack_3): pulling back to ready
Frame 6 (hurt): visor cracks, shoulder hit
Frames 7-9 (defeat): exo-armor sparks, falls knees-first, neural port
shorts out with cyan electric arc
```

#### Casting Patrol Bot

```
[MASTER STYLE PREFIX]
Enemy sprite: Casting Patrol Bot, quadrupedal robot, panther-sized,
sleek brushed-steel chassis, cyan light-strip running spine and legs,
hexagonal head with two camera lenses (cyan glow), telescoping plasma-
turret on back, smooth servo joints, predatory low stance.

Frame 1-2 (idle): low alert stance, head scanning
Frame 3 (attack_1): turret deploys upward
Frame 4 (attack_2): firing cyan plasma burst
Frame 5 (hurt): leg buckles, sparks
Frames 6-8 (defeat): collapses, all lights dim, optical lenses go dark
```

#### AEGIS-7 (BOSS)

```
[MASTER STYLE PREFIX]
Boss sprite: AEGIS-7, Casting Enforcement Heavy Mech, towering 4-meter
combat mech, brushed-steel plates over reinforced chassis, asymmetric
silhouette: massive pile-driver right arm, multi-barrel plasma gatling
left arm, single huge sensor-eye in head dome (cyan, can flash magenta),
exposed cyan power core in chest, four stabilizer legs, Casting Syndicate
crest etched in shoulder armor. Imposing, slow, industrial menace.

Frames 1-3 (idle): heavy breathing animation, steam vents from joints
Frame 4 (attack_1): pile-driver winding
Frame 5 (attack_2): pile-driver slam impact
Frame 6 (attack_3): plasma gatling spinning up
Frame 7 (attack_4): plasma gatling firing volley
Frames 8-9 (hurt): chest plate cracks, cyan sparks from joints
Frames 10-12 (overdrive_charge): chest core glows MAGENTA (#FF00AA),
all body lights shift cyan→magenta, energy crackling around mech, both
arms raise high charging
Frames 13-16 (terminus): massive magenta beam fires from chest core,
screen-wide impact
Frames 17-21 (defeat): power core flickers, mech collapses to knees,
explosions cascade from joints, sensor-eye dims to dead grey, finally
falls forward
```

### 4.4 Backgrounds

#### BG_corridor_maintenance (Fase 1)

```
[MASTER STYLE PREFIX] but as BACKGROUND not sprite — wide cinematic.
Setting: industrial maintenance corridor inside Casting Syndicate
arcology, year 2042. Steel grated floor, exposed wet ducts and pipes
overhead leaking condensation, recessed cyan emergency lighting strips
along both walls, distant doorway showing acid rain falling outside
through grimy reinforced window, holographic warning signs floating in
hindi/portuguese/english (cyan), puddles reflecting light, atmospheric
fog. 16:9, depth perspective vanishing into background, locked camera
angle. Empty (no characters — they will be composited on top).
```

#### BG_loading_dock (Fase 2)

```
[MASTER STYLE PREFIX] BACKGROUND wide cinematic.
Setting: cargo loading dock inside Casting arcology, large open space,
stacked cargo containers with Casting Syndicate logos, suspended crane
overhead, freight elevator on right wall, cyan floor markings, wet
concrete, distant view of São Paulo skyline through open dock door
(neon-lit megastructures, acid rain, drones flying), blue cobalt
ambient light, industrial fans rotating overhead.
```

#### BG_server_room (Fase 3)

```
[MASTER STYLE PREFIX] BACKGROUND wide cinematic.
Setting: Casting Syndicate server farm, narrow corridor between towering
black server racks 5 meters tall, each rack lined with thousands of
small cyan blinking LEDs, fiber-optic cables in transparent floor
glowing cyan, holographic data-streams floating in air, mist from
cooling systems, cathedral-like reverence aesthetic, dark ceiling
lost in shadow.
```

#### BG_command_chamber (Fase 4)

```
[MASTER STYLE PREFIX] BACKGROUND wide cinematic, EPIC SCALE.
Setting: AEGIS-7 docking chamber, vast circular industrial command
room, vaulted ceiling 20 meters high, central platform raised with
cables descending from above (where AEGIS-7 was docked), massive
hexagonal blast doors on far wall, holographic Casting Syndicate logo
projected mid-air rotating, magenta-cyan dual lighting (warning state
already active), exposed power conduits pulsing cyan along walls,
oppressive cathedral-of-machines atmosphere, smoke rising from floor
vents.
```

### 4.5 UI Frames & Logo

#### Title Logo "NEON PROTOCOL"

```
[MASTER STYLE PREFIX] LOGO design, transparent background.
Text "NEON PROTOCOL" in custom retro-cyber typeface, chunky pixel
letters with cyan glow outline and blue-cobalt fill, slight glitch
displacement on letters (chromatic aberration cyan/magenta), thin
horizontal scan-lines across, subtitle below in smaller letters: "AN
[IN]TERFACES SIDE STORY" in white pixel font. Logo feels like terminal
boot screen merged with arcade marquee.
```

#### HUD_frame_status

```
[MASTER STYLE PREFIX] UI frame asset, transparent background.
Horizontal HUD bar, 1280×180px, frame design: dark blue cobalt
(#0A0A1A) with cyan beveled edges, corners with small angular cuts,
faint hexagonal pattern overlay, three internal subdivisions for three
party members each with: portrait slot (left), name placeholder, HP/EN
bar slots. Decorative cyan accent lines running horizontally. NO text
content — just the frame structure.
```

#### Menu_frame_command

```
[MASTER STYLE PREFIX] UI menu frame, transparent background.
Horizontal action menu, 800×80px, four equal-width buttons separated
by cyan vertical dividers, each button has angular cut corners, dark
cobalt fill, cyan border. Selected-state version: bright cyan glow
border, slight inner gradient brighter. Provide both states stacked
vertically.
```

#### Dialogue_box_frame

```
[MASTER STYLE PREFIX] UI dialogue box, transparent background.
1280×200px, double-line cyan border, dark cobalt semi-transparent fill
(80% opacity), small angular cuts at corners, top-left corner has
speaker-name tag area (smaller box protruding), bottom-right has small
"▼" advance indicator placeholder area. Subtle hexagonal noise texture
in background fill.
```

### 4.6 Effect Sprites

#### FX_signal_null (DEADZONE skill)

```
[MASTER STYLE PREFIX] VFX sprite sheet, 6 frames horizontally.
Effect: EMP/electric pulse expanding outward in concentric rings, cyan
electric arcs, no character — just the effect overlay. Frame 1: small
cyan dot. Frames 2-4: rings expanding with cyan lightning arcs branching
outward. Frames 5-6: dissipating into static particles. Transparent
background.
```

#### FX_forge_wall (TORC skill)

```
[MASTER STYLE PREFIX] VFX sprite sheet, 5 frames horizontally.
Effect: cyan hexagonal energy shield wall rising from ground. Frame 1:
ground crack with cyan glow. Frame 2: hex tiles emerging from ground.
Frames 3-4: wall fully formed, hexagonal pattern visible, translucent
cyan with sparkling edges. Frame 5: stable shield (loopable). Alpha
blending transparency essential.
```

#### FX_system_override (TRINETRA skill)

```
[MASTER STYLE PREFIX] VFX sprite sheet, 6 frames horizontally.
Effect: data-stream healing effect, cascading cyan binary code falling
upward around target, small "+" healing particles, soft cyan aura. Frame
1: small data-spark. Frames 2-4: cascading data column with healing
icons. Frames 5-6: dissipating into gentle particles. Transparent
background.
```

#### FX_overdrive_warning (full-screen overlay)

```
[MASTER STYLE PREFIX] full-screen UI overlay, 1280×720px, 8 frames loop.
Magenta (#FF00AA) screen border pulsing inward, glitch lines across
screen, large warning text in center: "TERMINUS // CARREGANDO" in
distorted pixel font, magenta scan-lines, slight chromatic aberration
shift between frames. Transparent center (only borders/edges have
content).
```

### 4.7 Ícones

```
[MASTER STYLE PREFIX] icon set, transparent background, 32×32px each:

1. Nano-Med: green-cyan medical capsule with cross symbol
2. Signal Null: cyan lightning bolt inside null/circle-slash
3. Forge Wall: hexagonal shield outline with hammer overlay
4. System Override: three small cyan dots in triangle (eyes)
5. Status DEF UP: small upward arrow over shield icon (24×24)
6. Status OVERDRIVE: magenta exclamation in triangle (24×24)
```

---

## 5. Workflow Sugerido de Geração

### Fase 1 — Concept (antes de gerar tudo)
1. Gerar APENAS portraits dos 3 personagens primeiro
2. Aprovar visual / iterar até estar perfeito
3. Salvar SEEDS dos approved (Midjourney `--seed N`)

### Fase 2 — Sprites de Batalha
1. Para cada personagem, usar mesmo seed + variar pose
2. Gerar como sprite sheet horizontal (Midjourney `--ar 8:1` para 8 frames)
3. Em caso de inconsistência: refazer todo o sheet, não frames isolados

### Fase 3 — Inimigos
1. Gerar idle frame primeiro de cada inimigo
2. Lock seed + variar pose para attack/hurt/defeat
3. AEGIS-7 prioritário e mais detalhado (é o boss)

### Fase 4 — Backgrounds
1. Gerar 4 backgrounds em ordem narrativa
2. Manter consistência de paleta (todos usando Blue Wave)
3. Cada um deve "evoluir" — fase 1 mais sujo/abandonado, fase 4 mais grandioso

### Fase 5 — UI / FX
1. Frames de UI por último (mais previsíveis)
2. FX podem ser feitos em CSS puro se a IA não acertar
3. Ícones em batch único de 32×32

### Ferramentas Recomendadas (em ordem de qualidade para pixel art):
1. **Midjourney v6.1** com `--style raw` — melhor qualidade
2. **Stable Diffusion XL + LoRA "PixelArt"** — controle máximo
3. **DALL-E 3** — bom para portraits, médio para sprites
4. **Pixel Lab** ou **Aseprite + AI plugin** — fine-tuning final

### Pós-processamento OBRIGATÓRIO:
- Passar todos os outputs por **Aseprite** ou **Pixelorama** para:
  - Reduzir cores ao palette Blue Wave (16 cores fixas)
  - Limpar anti-aliasing residual
  - Ajustar transparências
  - Cortar frames em grid uniforme
- Exportar como **PNG-8** com transparência

---

## 6. Estrutura de Pastas para Assets

```
Interfaces JRPG/
└── public/
    └── assets/
        ├── characters/
        │   ├── deadzone_battle.png      (sprite sheet)
        │   ├── deadzone_portrait.png
        │   ├── torc_battle.png
        │   ├── torc_portrait.png
        │   ├── trinetra_battle.png
        │   └── trinetra_portrait.png
        ├── enemies/
        │   ├── probe_mk1.png
        │   ├── networker_enforcer.png
        │   ├── patrol_bot.png
        │   └── aegis_7.png
        ├── backgrounds/
        │   ├── bg_corridor.png
        │   ├── bg_loading_dock.png
        │   ├── bg_server_room.png
        │   └── bg_command_chamber.png
        ├── ui/
        │   ├── hud_status.png
        │   ├── menu_command.png
        │   ├── dialogue_box.png
        │   ├── title_logo.png
        │   └── cursor_arrow.png
        ├── effects/
        │   ├── fx_signal_null.png       (sprite sheet 6 frames)
        │   ├── fx_forge_wall.png
        │   ├── fx_system_override.png
        │   ├── fx_overdrive.png
        │   └── fx_screen_flash.png
        └── icons/
            ├── icon_nano_med.png
            ├── icon_signal_null.png
            ├── icon_forge_wall.png
            ├── icon_system_override.png
            └── icon_status_*.png
```

---

## 7. Fallback (se geração de IA falhar)

Se prompts de IA não derem resultados consistentes, plano B:

1. **Sprites como CSS shapes coloridos:** silhuetas geométricas + glow CSS (estética minimalista funciona pro tom cyberpunk)
2. **Backgrounds como CSS gradients + SVG patterns:** layout matemático (linhas perpendiculares, hexágonos)
3. **Ícones como Lucide-React + filtros CSS:** já é vetorial, fácil de estilizar
4. **Logo como CSS text-shadow + filter:** "NEON PROTOCOL" em Press Start 2P com text-shadow cyan multi-layer

Esse fallback pode até ser **superior** ao MVP — mantém estética coerente sem depender de IA externa.

---

## 8. Checklist de Validação Visual

Antes de marcar a fase de assets como completa:

- [ ] Todos os 3 personagens têm sprite sheet completo + portrait
- [ ] Todos os 4 inimigos têm pelo menos idle/attack/defeat
- [ ] AEGIS-7 tem frames de OVERDRIVE em magenta
- [ ] 4 backgrounds prontos, todos seguindo Blue Wave
- [ ] UI frames criados (HUD, menu, dialogue, logo)
- [ ] FX para 3 habilidades + OVERDRIVE warning
- [ ] Ícones para itens e habilidades
- [ ] Tudo em PNG-8 com transparência
- [ ] Paleta limitada a Blue Wave (max ~16 cores por sprite)
- [ ] Image-rendering: pixelated funcionando (sem blur)
- [ ] Carregamento total < 2MB (otimizado)

---

*Last updated: 2026-04-25 — created during project initialization*
