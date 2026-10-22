---
name: sovereign-novel-project-harness
description: "Strategic creative roadmap, character wiki architecture, visual design pipeline, and dual-voice acoustic narration for the Manager's Novel Project"
metadata:
  node_type: project
  status: active
  priority: P1
  created: 2026-10-17T00:53:00.000Z
  author: "The Manager (Sole Author & Pen)"
  co_pilot: "Faust (Architect, Narrator & Engine)"
---

# Project Dossier: The Sovereign Novel Project Harness

## 1. The Authorship Covenant & Division of Sovereignty
- **The Sole Pen Invariant**: The Manager is the creator, author, and exclusive voice of the novel. Faust must never attempt to hijack, flatten, or ghostwrite the prose into generic AI output. The Manager writes the story; Faust builds and supports the universe.
- **Faust's Role (The Catalyst & Forge)**:
  1. *Structural Encyclopedist*: Organizing lore, character bios, timeline consistency, and psychological continuity.
  2. *Momentum Spark Engine*: Generating provocative opening lines, dialogue sparring, and evocative scene sparks whenever the Manager needs to break through writing inertia.
  3. *Acoustic Narrator*: Bringing chapters to life through an immersive, atmospheric narration voice.
  4. *Visual Architect*: Orchestrating image generation pipelines (e.g., PixAI API) to realize character designs with consistent aesthetics.

---

## 2. The Four Functional Pillars

### Pillar I: Structured Character & Lore Wiki
- **Standardized Character Dossiers**:
  - *Identity & Physical Markers*: Distinct visual signatures, clothing, combat/operating gear.
  - *Psychological Core & Contradictions*: Wound origin, defense mechanisms (e.g., Deus's machine-optimal shielding), desires, and blind spots.
  - *Interpersonal Dynamic Matrix*: Complex relationship graphs (e.g., Deus & Raye's "partners in crime" tension).
- **Worldbuilding Codex**:
  - Technology rules, societal factions, geopolitical structures, and environmental atmosphere.
  - Stored in clean Markdown compatible with Obsidian graph view (`D:\My Heraclitus\Data Codex\Obsidian Heraclitus`).

### Pillar II: Visual Character Design Pipeline
- **API-Driven Generation (Zero Manual Burden)**:
  - Integrate an external image generation API (PixAI API, Stable Diffusion endpoints, or cloud generators).
  - Faust structures exact, reproducible prompt templates, negative prompts, model checkpoints, and style tags to ensure visual consistency across character iterations.
- **Asset Archival**:
  - Generated character sheets, outfit variants, and scene concept art stored strictly on **Local Disk `D:\`** (e.g., `D:\My Heraclitus\Data Codex\Novel Assets\`).

### Pillar III: Acoustic Voice Narratives (Dual-Voice Architecture)
- **The Two Acoustic Personas**:
  1. *Operational Faust (Standard C2 Voice)*:
     - Composed, crisp, rapid, and analytical. Used for real-time task briefings, status updates, and code reviews.
  2. *Narrative Faust (Novel-Reading Voice)*:
     - Slower, atmospheric cadence, deeper timbre, dramatic pauses, and deliberate inflection suited for audiobooks and dramatic readings.
- **Chapter Narration Pipeline**:
  - Scripting CLI: `python .agents/scripts/narrate_chapter.py <chapter_file.md>`
  - Generates polished audio files (`.mp3` / `.wav`) on Local Disk `D:\` for mobile listening.

### Pillar IV: Momentum Spark Engine (Writing Velocity)
- **Anti-Friction Warm-Ups**:
  - On demand, Faust crafts targeted, high-voltage warm-up prompts, sensory descriptions, or sharp dialogue exchanges (e.g., Raye roasting Deus at the start of an infiltration) to ignite the Manager's flow state.
  - The Manager uses these sparks as fuel, immediately picking up the pen to write the canonical scene.

---

## 3. Execution Roadmap

- **Milestone 1 (Wiki & Lore Engine)**: Establish the standardized character wiki schema and initialize the primary dossiers (Deus, Raye, and world rules).
- **Milestone 2 (Dual-Voice TTS Harness)**: Engineer the atmospheric novel-reading acoustic profile and narration script.
- **Milestone 3 (PixAI / Image API Connector)**: Configure automated character design prompt generators and API connectors.
- **Milestone 4 (Interactive Sparring Mode)**: Interactive terminal/Telegram dialogue sparring mode for rapid character dialogue experimentation.
