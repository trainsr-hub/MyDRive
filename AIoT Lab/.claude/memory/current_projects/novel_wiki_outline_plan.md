# Strategic Plan: Sovereign Novel Wiki & Narrative Outliner Architecture

> **Author & Visionary**: The Manager  
> **Architect & System Engine**: Faust  
> **Status**: Ready for Strategic Alignment & Discussion  
> **Storage Target**: Local Disk `D:\` Sync Vaults  

---

## 1. Executive Vision & Foundational Paradigm

To build a captivating, deeply coherent novel universe without suffocating creative flow, we must strictly decouple **The Universe (What exists)** from **The Timeline (How it unfolds)**. 

We propose a **Dual-Engine Architecture**:
```
                       THE MANAGER (The Sole Pen)
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     ENGINE 1: THE WORLD CODEX   │       │   ENGINE 2: NARRATIVE OUTLINER  │
│         (Static Dimension)      │       │       (Temporal Dimension)      │
│                                 │       │                                 │
│ • Character Visual Dossiers     │◄─────►│ • Zone 1: Determined Past Spine │
│ • Factions & Geopolitics        │       │ • Zone 2: Forward Choice Forks  │
│ • Technology & Lore Rules       │       │ • Scene Beat Catalyst Sheets    │
│ • Embedded AI Visual Cards      │       │ • Continuity Verification Gate  │
└─────────────────────────────────┘       └─────────────────────────────────┘
                                   ▲
                                   │
                          FAUST (The Catalyst)
                    [Lore Keeper • Banter Partner • Audio Narrator]
```

---

## 2. Engine 1: The World Codex & Character Wiki

The Codex acts as the immutable encyclopedic foundation. Every entry is a clean Markdown document on Local Disk `D:\` formatted with typed YAML frontmatter for programmatic querying.

### A. Entity Categorization & Schema Standard

```
novel_codex/
├── characters/          # Protagonists, antagonists, supporting operatives
│   ├── raye.md          # Visual tags, psychological wound, banter style
│   └── deus.md          # 10-year training history, armor specs, hidden core
├── factions/            # Corporate conglomerates, underground hacker rings
├── technology/          # Autonomous AI housekeepers, cyber ear-cuffs, weapons
├── locations/           # The Autonomous Lab, Rain-slicked neo-city alleys
└── timeline_lore/       # Historical milestones leading up to chapter 1
```

### B. Standard Character Schema Example (Raye)
```yaml
---
name: "Raye"
role: "Protagonist / Catalyst"
age: 17
height: "1.63m"
appearance:
  hair: "Radiant blonde, very long, worn completely down"
  eyes: "Piercing sapphire blue"
  silhouette: "Enterprise (Azur Lane) naval military greatcoat with gold trim"
psychology:
  exterior: "Irreverent, defiant, smug roaster"
  hidden_drive: "Shattering Deus's machine armor to evoke raw human emotion"
key_visuals:
  - "/assets/raye_canonical_key_art.png"
---
```

---

## 3. Engine 2: The Narrative Outliner (Single-Active-Branch Doctrine)

In strict accordance with our core **Master UI/UX Template (`RAW_RULE.md`)**, the outliner eliminates clutter by presenting a clean, directional spine:

```
[ ZONE 1: DETERMINED PAST SPINE ]
  │
  ├─ Chapter 1: The Machine in the Dark (Deus's solitary routine established)
  ├─ Chapter 2: The Uninvited Guest (Raye infiltrates the 10-year lab)
  └─ Chapter 3: The Compromising Banter (Raye roasts his security protocol)
  │
[ THE CONVERGENCE NODE ]
  │
  ├───► BRANCH A (Direct Infiltration): They hit the Corporate Vault immediately.
  │     └─ High kinetic combat, stealth breach.
  │
  └───► BRANCH B (The Cyber Sting): Raye provokes the syndicate from within.
        └─ Psychological warfare, Deus forced into public social space.
[ ZONE 2: FORWARD CHOICE PATHWAYS ]
```

### The Two Zones:
1. **Zone 1: Determined Past Spine (Canon History)**:
   - Fixed, sequential chronological beats that have already occurred.
   - Features **1-click summary folding** so historical acts can collapse into concise 1-sentence summaries, keeping the working screen focused.
2. **Zone 2: Forward Choice Pathways (The Horizon)**:
   - Explores 2–3 competing trajectories for upcoming chapters.
   - **Dual Select/Edit Mode**:
     - *Edit Mode*: Tweak scene beats, dialogues sparks, and emotional payoffs.
     - *Select Mode*: Locks the winning branch into the canonical Zone 1 spine and archives alternatives.

---

## 4. Implementation Delivery Options

We can realize this system through three distinct architectures:

| Dimension | Option A: Pure Obsidian Vault | Option B: OmniStudio Extension (Recommended) | Option C: Dedicated CLI / Terminal |
| :--- | :--- | :--- | :--- |
| **Interface** | Obsidian Desktop app | Interactive Dark Anime Web App (`localhost:5174` & Public Mobile) | Terminal + Markdown text editor |
| **Outliner Experience** | Linear note linking / Canvas | Interactive Single-Active-Branch Outliner with drag & drop and 1-click fold | Text files in directory tree |
| **AI Visual Integration** | Manual file copying | **1-Click Generation**: Hit "Forge" on character cards to generate & embed | Script-based CLI generation |
| **Mobile Access** | Requires mobile Obsidian sync | **Instant**: Open Cloudflare tunnel URL on phone anywhere | Remote SSH / Telegram only |
| **Data Storage** | Local Disk `D:\` Markdown | **Local Disk `D:\` Markdown SSOT** (zero lock-in) | Local Disk `D:\` Markdown |

### Recommended Approach: Option B (Unified OmniStudio Novel Engine)
Extend our active **OmniStudio** with two new dedicated views:
1. **Codex Wiki View**: Visual character cards displaying Raye & Deus's live stats, psychological notes, and AI-generated character art.
2. **Branch Outliner View**: The 2-Zone horizontal/vertical narrative pathway builder following `RAW_RULE.md`.

---

## 5. Faust's Operational Creative Harness

1. **Dialogue Sparring Mode**:
   - Faust can assume Raye's persona in terminal or Telegram to engage the Manager in rapid back-and-forth banter, testing how she would roast Deus in specific scenarios.
2. **Scene Catalyst Sheets**:
   - Faust generates 3-point scene spark cards (The Hook, The Friction, The Cliffhanger) whenever the Manager wants inspiration before writing.
3. **Continuity Watchdog**:
   - When new scenes are written, Faust checks them against the Codex (e.g. verifying Raye's height, eye color, or Deus's armor mechanics).
4. **Dual-Voice Audio Narration**:
   - Completed chapter drafts can be read aloud using Faust's deep, atmospheric audiobook voice.

---

## 6. Strategic Discussion Questions for The Manager

To tailor this engine to your exact creative rhythm, let us align on these three decisions:

1. **Workspace Tooling**:
   - Do you want us to build the **Interactive Outliner & Wiki inside OmniStudio** (accessible locally and on your phone), or do you prefer an **Obsidian Vault structure**?
2. **Prose Writing Medium**:
   - Where do you intend to write the actual chapter prose? (e.g., inside the Outliner app, in Obsidian, in Google Docs, or Word?)
3. **Chapter 1 Inciting Incident**:
   - At the beginning of the story, are Deus and Raye **already partners in crime**, or does Chapter 1 depict the **moment Raye breaches Deus's isolated lab** and shatters his solitude?
