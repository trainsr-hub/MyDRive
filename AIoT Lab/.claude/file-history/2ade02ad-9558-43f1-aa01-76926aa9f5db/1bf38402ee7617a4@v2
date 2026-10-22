"""
Deterministic Graph Resolution Engine - Zero LLM
Ported from Hazard Trigger's resolvePromptGraph logic.
"""

import random
import re
import json
from typing import List, Dict, Any, Optional


class GraphResolver:
    """
    Deterministic prompt graph resolver with weighted sampling.
    """

    def __init__(self, db_manager):
        self.db = db_manager

    def resolve_prompt_graph(
        self,
        active_nodes: List[Dict[str, Any]],
        node_weights: Dict[str, float],
        gacha_pools: List[Dict[str, Any]],
        active_gacha_pool_ids: List[str],
        wildcards: Dict[str, List[Dict[str, Any]]],
        exclusions: Dict[str, Any],
        target_engine: str = "ComfyUI",
        custom_positive: str = "",
        custom_negative: str = "",
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Main resolution entry point.

        Returns:
            {
                "positive_prompt": str,
                "negative_prompt": str,
                "loras": List[str],
                "token_count": int,
                "active_nodes": List[Node],
                "gacha_draws": List[Dict],
                "seed": int,
                "timestamp": int
            }
        """
        if seed is not None:
            random.seed(seed)
        else:
            seed = random.randint(0, 999999999)
            random.seed(seed)

        raw_chunks: List[Dict[str, Any]] = []
        active_tags: List[str] = []
        gacha_draws: List[Dict[str, Any]] = []

        # Phase 1: Process active nodes
        for node in active_nodes:
            weight = node_weights.get(node['id'], node.get('default_weight', 1.0))
            expanded_token = self._expand_wildcards(node['token'], wildcards)
            raw_chunks.append({"token": expanded_token, "weight": weight})

            if node.get('tags'):
                active_tags.extend(node['tags'])

        # Phase 2: Process Gacha Pools
        pools_to_draw = []

        # Add explicitly active pools
        for pool in gacha_pools:
            if pool['id'] in active_gacha_pool_ids:
                pools_to_draw.append(pool)

        # Add pools attached to active nodes
        for node in active_nodes:
            if node.get('gacha_pool_id'):
                pool = next((p for p in gacha_pools if p['id'] == node['gacha_pool_id']), None)
                if pool and pool not in pools_to_draw:
                    pools_to_draw.append(pool)

        # Execute Gacha Draws
        for pool in pools_to_draw:
            drawn_tokens: List[str] = []
            count = max(1, pool.get('draw_count', 1))

            for _ in range(count):
                if not pool.get('items'):
                    continue

                picked = self._pick_weighted(pool['items'])
                if not picked:
                    continue

                token_str = picked['token']
                weight = picked.get('weight', 1.0)
                expanded = self._expand_wildcards(token_str, wildcards)

                raw_chunks.append({"token": expanded, "weight": weight})
                drawn_tokens.append(expanded)

            if drawn_tokens:
                gacha_draws.append({
                    "pool_id": pool['id'],
                    "pool_name": pool['name'],
                    "items": drawn_tokens
                })

        # Phase 3: Append custom positive
        if custom_positive.strip():
            expanded_custom = self._expand_wildcards(custom_positive.strip(), wildcards)
            raw_chunks.append({"token": expanded_custom, "weight": 1.0})

        # Phase 4: Assemble clean positive prompt & extract LoRAs
        positive_prompt, token_count, loras = self._assemble_clean_prompt(
            raw_chunks,
            target_engine,
            exclusions.get('forbidden_keywords', [])
        )

        # Phase 5: Assemble negative prompt
        negative_prompt = self._assemble_negative_prompt(
            exclusions.get('global_negatives', []),
            exclusions.get('auto_negatives', {}),
            active_tags,
            custom_negative
        )

        return {
            "positive_prompt": positive_prompt,
            "negative_prompt": negative_prompt,
            "loras": loras,
            "token_count": token_count,
            "active_nodes": active_nodes,
            "gacha_draws": gacha_draws,
            "seed": seed,
            "timestamp": int(random.random() * 1000000000)
        }

    def _pick_weighted(self, items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Randomly picks one item from a weighted array."""
        if not items:
            return None

        weights = [item.get('weight', 1.0) for item in items]
        total_weight = sum(weights)
        r = random.random() * total_weight

        cumulative = 0
        for i, item in enumerate(items):
            cumulative += weights[i]
            if cumulative >= r:
                return item

        return items[-1]

    def _expand_wildcards(self, text: str, wildcards: Dict[str, List[Dict[str, Any]]], depth: int = 0) -> str:
        """Expands {opt1|opt2|opt3} and __wildcard__ tokens recursively."""
        if depth > 5:
            return text

        # Resolve {a|b|c} choices
        result = re.sub(r'\{([^{}]+)\}', lambda m: random.choice(m.group(1).split('|')).strip(), text)

        # Resolve __wildcard__ tokens
        def replace_wildcard(match):
            key = match.group(0)
            pool = wildcards.get(key, [])
            if pool:
                picked = self._pick_weighted(pool)
                if picked:
                    token_str = picked.get('token', '')
                    return self._expand_wildcards(token_str, wildcards, depth + 1)
            return key

        result = re.sub(r'__[a-zA-Z0-9_-]+__', replace_wildcard, result)

        return result

    def _assemble_clean_prompt(
        self,
        chunks: List[Dict[str, Any]],
        target_engine: str,
        forbidden_keywords: List[str]
    ) -> tuple:
        """Assembles clean prompt, extracts LoRAs, applies weights."""
        loras: List[str] = []
        tokens: List[str] = []

        for chunk in chunks:
            token = chunk['token'].strip()
            weight = chunk['weight']

            # Extract LoRA tags
            lora_matches = re.findall(r'<lora:[^>]+>', token)
            loras.extend(lora_matches)
            token = re.sub(r'<lora:[^>]+>', '', token).strip()

            # Filter forbidden keywords
            if any(kw.lower() in token.lower() for kw in forbidden_keywords):
                continue

            # Apply weight formatting
            if weight != 1.0 and target_engine in ['ComfyUI', 'SD_WebUI']:
                token = f"({token}:{weight:.2f})"

            if token:
                tokens.append(token)

        prompt = ', '.join(tokens)
        token_count = len(tokens)

        return prompt, token_count, loras

    def _assemble_negative_prompt(
        self,
        global_negatives: List[str],
        auto_negatives: Dict[str, List[str]],
        active_tags: List[str],
        custom_negative: str
    ) -> str:
        """Assembles negative prompt from exclusions and active tags."""
        negatives = list(global_negatives)

        # Add auto-negatives based on active tags
        for tag in active_tags:
            if tag in auto_negatives:
                negatives.extend(auto_negatives[tag])

        # Add custom negative
        if custom_negative.strip():
            negatives.append(custom_negative.strip())

        # Deduplicate
        unique_negatives = []
        seen = set()
        for neg in negatives:
            neg_lower = neg.lower()
            if neg_lower not in seen:
                unique_negatives.append(neg)
                seen.add(neg_lower)

        return ', '.join(unique_negatives)
