# Hazard Level Calculation Exploration Plan

1. **Analyze `engine.ts`**:
   - Read `universe-25\src\apps\vinyl-angel\services\engine.ts` to understand the current implementation of `rawXP` and hazard level calculation.
   - Identify the inputs to the formula (s3-s7) and how they are derived.

2. **Trace Hazard Level Flow**:
   - Use `Grep` to find usages of the hazard level calculation function within the codebase.
   - Determine how the calculated hazard level is stored and displayed in the UI.

3. **Semantic Analysis of Score Values**:
   - Search for definitions or enums related to scores (3-7) to understand their meaning (e.g., is 7 "Perfect", 3 "Fail"?).
   - Investigate how `score_count` is tracked and used in the system.

4. **Investigate "Rank" and Baseline Concepts**:
   - Search the codebase for terms like "rank", "base level", "expected level", or "baseline" to see if there are existing mechanisms for these.

5. **Examine Data Distribution**:
   - If possible, look at any mock data, tests, or database schemas to understand the current range and distribution of hazard levels.

6. **Synthesize Findings**:
   - Summarize how the current system works and how it relates to the user's requested changes.
