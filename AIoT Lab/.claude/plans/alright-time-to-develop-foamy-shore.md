# Implementation Plan - Golden Hour Gacha System Overhaul (CardPacks UI & High-Efficiency Engine)

## 1. Context & Objectives
The Manager requested developing/overhauling the **Gacha Tab** of `universe-25/src/apps/golden-hour` (`D:\My Drive\SandBox Projetcs\universe-25\src\apps\golden-hour`). The design inspiration is drawn from the historical `CardPacks` repository (`https://github.com/trainsr-hub/CardPacks`), which featured:
- Interactive Card Pack Lobby with hover animations & pack previews.
- Dynamic multi-card roll generation with remainder distributions, guarantee slots, and token expansions.
- Multi-layered card unboxing modal (`RenderListAndDict`) displaying visual cards alongside an aggregated breakdown dictionary.

Our goal is to replicate the responsive, immersive visual experience of `CardPacks` while replacing its legacy string-parsing and unoptimized state loops with an **O(1) high-performance gacha engine**, strict TypeScript safety, atomic multi-pull batching, and full integration into the Universe 25 ecosystem (`useGoldenHourStore`, `useInventoryStore`, `syncEngine`, and backend persistence).

---

## 2. Architectural Comparison & Efficiency Upgrades

| Dimension | Legacy `CardPacks` (`trainsr-hub/CardPacks`) | Golden Hour Overhauled Gacha |
| :--- | :--- | :--- |
| **Gacha Engine** | Runtime regex/string splitting on every button click (`handleButtonClick.js`) | Pre-compiled cumulative probability tables with O(1) sampling & multi-pull batching |
| **Pull Modes** | Single-iteration or loop with multiple re-renders | 1x, 5x, and 10x multi-pulls with single-pass atomic state updates & audit logging |
| **State Management** | Unlifted ad-hoc React `useState` & raw fetch of `Decks.json` | Zustand (`useGoldenHourStore`), auto-synced with `useInventoryStore` & SQLite backend |
| **Card Unboxing Modal** | Raw CSS transitions + unoptimized image stack | Hardware-accelerated Tailwind modal with rarity particle glows, rank badges, and flip animations |
| **Pack Catalog** | Hardcoded JSON with loose string types | Type-safe Pack Registry with dynamic drop tables, guarantees, and pity counters |
| **Item Output** | Loose string tokens (`"Item ~ Category"`) | Fully typed `PullItem` entities with combat stats, tactical buffs, downsides, and IoT energy fuel |

---

## 3. Core Architecture & Components

```
src/apps/golden-hour/
├── components/
│   ├── gacha/
│   │   ├── GachaLobby.tsx           # Card pack selection grid, animated preview, hover stats HUD
│   │   ├── PackCard.tsx             # Interactive pack container with hover/active animations
│   │   ├── PackUnboxModal.tsx       # Fullscreen unboxing modal with multi-card grid & summary dict
│   │   ├── UnboxedItemCard.tsx      # Multi-layered card with rarity border, rank badge, and flip effect
│   │   ├── PackSummaryPanel.tsx     # Sorted breakdown summary dictionary (grouped counts)
│   │   └── DropRatesModal.tsx       # Transparent drop rate & guarantee probability inspector
│   └── GachaAltar.tsx               # Orchestration view integrating GachaLobby & PackUnboxModal
├── engine/
│   └── gachaEngine.ts               # Pre-compiled weighted sampler, guarantee solver, range parser
├── store/
│   └── useGoldenHourStore.ts        # Extended with multi-pull action, pity tracker, pack telemetry
└── types.ts                         # Extended with PackDefinition, MultiPullResult, PackStats
```

---

## 4. Step-by-Step Implementation Strategy

### Phase 1: High-Efficiency Gacha Engine (`gachaEngine.ts`)
- Build a zero-allocation, pre-compiled probability distribution engine.
- Support syntax from CardPacks:
  - Explicit rates (`"Relic ~ 30%"`)
  - Remainder distribution (`"Common ... remaining"`)
  - Range parsing (`"10...50"` for energy units or stat rolls)
  - Choice branches (`"OptionA | OptionB"`)
  - Guaranteed drops (pity threshold or bonus slots per pack)
- Produce strictly typed `PullItem` arrays in a single execution pass.

### Phase 2: Store & State Enhancements (`useGoldenHourStore.ts` & `types.ts`)
- Add `pullPackBatch(packId: string, count: 1 | 5 | 10)`:
  - Deducts tickets from `useInventoryStore` atomically.
  - Generates multi-item results using `gachaEngine`.
  - Automatically charges IoT Energy Reserves for any pulled energy cores.
  - Updates lifetime stats (`totalPulls`, `packOpenCounts`, `pityCounters`).
  - Dispatches a single `syncVaultToBackend()` call and logs structured audit events.

### Phase 3: Card Pack Lobby Component (`GachaLobby.tsx` & `PackCard.tsx`)
- Implement a responsive multi-column grid with Babylonian / Cyber-Altar aesthetics.
- Card hover effects: glowing trims, animated sheen, and dynamic status inspection.
- Live Top-Right HUD showing:
  - Dimensional ticket balances (`🎟️ Angel`, `☀️ Solar`, `📜 Codex`).
  - Total lifetime packs opened.
  - Lifetime unboxed item frequencies tally.
- Single / Multi-pull action triggers (`1x Summon`, `5x Summon`, `10x Summon`).

### Phase 4: Modernized Unboxing Modal (`PackUnboxModal.tsx` & `PackSummaryPanel.tsx`)
- Fullscreen modal overlay with smooth entrance transitions (`opacity` + `scale`).
- Multi-card auto-fit grid displaying unboxed items with:
  - Layered background styling based on rarity (`legendary`, `epic`, `rare`, `uncommon`, `common`).
  - Dynamic rank badges (`✦`, `Ψ`, `S₁`, `A+`, `B`, `D`).
  - Stat modifiers, buffs, curses, and IoT energy tags.
- Aggregated breakdown summary panel:
  - Sorted by item quantity descending, then alphabetically.
  - Clean pill tags indicating duplicate counts and category distributions.
- Quick "Summon Again" and "Send to Vault" dismissal actions.

### Phase 5: Integration & Verification
- Wire the new components into `GachaAltar.tsx` and verify seamless rendering within `GoldenHour.tsx`.
- Test ticket deduction, 1x/5x/10x multi-pulls, vault storage, and backend persistence.

---

## 5. Verification Plan
1. **Engine Benchmark**: Validate that roll calculations for 10x pulls complete in `< 1ms` without UI lag.
2. **Visual Fidelity**: Verify card pack hover effects, unbox modal transitions, and responsive grid layouts on all screen sizes.
3. **Inventory & Vault Sync**: Confirm tickets are accurately deducted from `useInventoryStore` and all pulled items land in `useGoldenHourStore.vault` with backend JSON persistence.
4. **Dev Cheat Verification**: Test with `GoldenHourConfig` cheat injectors to verify seamless summoning under high pull volumes.
