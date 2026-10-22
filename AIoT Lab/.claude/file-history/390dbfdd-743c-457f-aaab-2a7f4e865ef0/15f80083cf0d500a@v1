---
name: arc-jurassic-gameplay-rules
description: "Core mathematical formulas and gameplay economics for ARC Jurassic: formulaic pricing, dynamic rates, ingredient inflation, and creature caps."
metadata: 
  node_type: memory
  type: project
  key: div:game:arc_jurassic_rules
  keys: 
    - div:game:arc_jurassic_rules
    - div:game:*
    - core:modular_construction
  originSessionId: 2706b1fc-e9bd-4efc-be1d-7fa7ddcd353a
  modified: 2026-09-16T12:53:30.062Z
---

# ARC Jurassic Gameplay Rules & Mathematical Economics

### 1. Specimen Purchasing Economics (`calcDinoCost.ts`):
- **Standard Dinosaurs (Non-hybrids & Standard Hybrids)**:
  - **Elemental Time**: $\frac{\text{hatch\_time\_mins}}{2}$ minutes (converted to seconds for deduction).
  - **DNA**: Equal to `sell_price_dna`.
- **Special Dinosaurs (`super-hybrid` & `boss`)**:
  - **Elemental Time**: $\frac{\text{hatch\_time\_mins}}{2}$ minutes.
  - **Red Orbs**: $\lceil\frac{\text{max\_ferocity}}{365}\rceil$ Red Orbs (no DNA required).

### 2. Gacha Pool Gating (`calcGachaPool.ts`):
- **Ferocity Cap**: The sum of the top 3 ferocities among owned creatures (at current unlocked levels). If below 200, floor at 200:
  $$\text{cap} = \max(\text{top3Ferocity}, 200)$$
- Only creatures with $\text{evo4\_ferocity} \le \text{cap}$ and $\text{owned\_count} < \text{maximum\_number}$ enter the pool.

### 3. Dynamic Rates with Ingredient Inflation:
- For hybrids and super-hybrids with ingredients:
  $$\text{modified\_ferocity} = \text{evo4\_ferocity} \times 2^{(16 - \min(16, \text{owned\_ingredients\_count}))}$$
- For non-hybrids: $\text{modified\_ferocity} = \text{evo4\_ferocity}$.
- Dynamic weight per candidate $i$ in pool (inverse-ferocity principle: least ferocity in pool = highest drop probability):
  $$w_i = \frac{1}{\max(\text{modified\_ferocity}_i, 1)}, \quad \text{Rate}_i = \frac{w_i}{\sum_k w_k} \times 100\%$$
- As the player acquires more ingredient dinosaurs, the hybrid's modified ferocity increases (due to the $2^{(16-\min(16,\ \text{ingredients}))}$ multiplier), which lowers $w_i$ and therefore decreases its drop rate.

### 4. Maximum Specimen Capacity:
- A creature's ownership limit cannot exceed:
  $$\text{maximum\_number} = 2^{(\text{evolutions} - 1)}$$
  (8 for 4-evo standard dinos, 512 for 10-evo boss creatures).

### 5. Deterministic Data Precomputation:
- `dino.json` is enriched with precomputed `ferocity` for each evolution step, `max_ferocity`, `evo4_ferocity`, and `maximum_number`.

### 6. Due Dinosaur Persistence & Skip Governance:
- If a player rolls a dinosaur but lacks the resources to purchase it, the rolled specimen and wager are saved as a **Due Dinosaur** (`arc_jurassic_due_dino_v1`).
- Re-entering Gacha or clicking "Summon Dinosaur" while a specimen is due automatically redirects back to that due specimen.
- In Standard Mode (`isFreeBuyCheat === false`), passing/skipping is strictly locked. The player must gather resources to purchase the due creature before new rolls are permitted.
- In God Mode (`isFreeBuyCheat === true`), players can skip/pass the due specimen at will.

**Why:** Creates a high-stakes, rewarding economic progression where collecting base species boosts hybrid roll rates and specimen capacity prevents infinite bloat.

**How to apply:** All purchasing, pool generation, and drop logic in `arc-jurassic` must route through `calcDinoCost.ts` and `calcGachaPool.ts`.
