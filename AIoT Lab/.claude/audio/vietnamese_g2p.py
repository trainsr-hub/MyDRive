"""
Faust Vietnamese Grapheme-to-Phoneme (G2P) Converter for Kokoro-82M ONNX.
Converts Vietnamese text into Kokoro-compatible IPA tokens with authentic tone contours,
diphthongs, and special word handling.
"""
import re
import unicodedata
from typing import Optional, Tuple

# Tone mapping: maps tone-marked vowel characters to (base_vowel, tone_id)
# 1: Ngang, 2: Huyền, 3: Sắc, 4: Hỏi, 5: Ngã, 6: Nặng
TONE_MAP = {
    # Huyền (2)
    'à': ('a', 2), 'ằ': ('ă', 2), 'ầ': ('â', 2), 'è': ('e', 2), 'ề': ('ê', 2),
    'ì': ('i', 2), 'ò': ('o', 2), 'ồ': ('ô', 2), 'ờ': ('ơ', 2), 'ù': ('u', 2),
    'ừ': ('ư', 2), 'ỳ': ('y', 2),
    # Sắc (3)
    'á': ('a', 3), 'ắ': ('ă', 3), 'ấ': ('â', 3), 'é': ('e', 3), 'ế': ('ê', 3),
    'í': ('i', 3), 'ó': ('o', 3), 'ố': ('ô', 3), 'ớ': ('ơ', 3), 'ú': ('u', 3),
    'ứ': ('ư', 3), 'ý': ('y', 3),
    # Hỏi (4)
    'ả': ('a', 4), 'ẳ': ('ă', 4), 'ẩ': ('â', 4), 'ẻ': ('e', 4), 'ể': ('ê', 4),
    'ỉ': ('i', 4), 'ỏ': ('o', 4), 'ổ': ('ô', 4), 'ở': ('ơ', 4), 'ủ': ('u', 4),
    'ử': ('ư', 4), 'ỷ': ('y', 4),
    # Ngã (5)
    'ã': ('a', 5), 'ẵ': ('ă', 5), 'ẫ': ('â', 5), 'ẽ': ('e', 5), 'ễ': ('ê', 5),
    'ĩ': ('i', 5), 'õ': ('o', 5), 'ỗ': ('ô', 5), 'ỡ': ('ơ', 5), 'ũ': ('u', 5),
    'ữ': ('ư', 5), 'ỹ': ('y', 5),
    # Nặng (6)
    'ạ': ('a', 6), 'ặ': ('ă', 6), 'ậ': ('â', 6), 'ẹ': ('e', 6), 'ệ': ('ê', 6),
    'ị': ('i', 6), 'ọ': ('o', 6), 'ộ': ('ô', 6), 'ợ': ('ơ', 6), 'ụ': ('u', 6),
    'ự': ('ư', 6), 'ỵ': ('y', 6),
}

INITIALS = [
    ('ngh', 'ŋ'), ('ng', 'ŋ'), ('nh', 'ɲ'), ('ch', 'tʃ'), ('tr', 'tʃ'),
    ('th', 'tʰ'), ('ph', 'f'), ('kh', 'x'), ('gh', 'ɣ'), ('g', 'ɣ'),
    ('gi', 'z'), ('qu', 'kw'), ('d', 'z'), ('đ', 'd'), ('b', 'b'),
    ('c', 'k'), ('k', 'k'), ('h', 'h'), ('l', 'l'), ('m', 'm'),
    ('n', 'n'), ('p', 'p'), ('r', 'z'), ('s', 's'), ('t', 't'),
    ('v', 'v'), ('x', 's')
]

# Rimes ordered from longest / most specific to shortest
RIMES = [
    # Triphthongs / Onset Glides + Diphthongs
    ('oanh', 'waɲ'), ('oach', 'watʃ'),
    ('oang', 'waːŋ'), ('oanc', 'waːk'), ('oan', 'waːn'), ('oat', 'waːt'),
    ('oam', 'waːm'), ('oap', 'waːp'), ('oai', 'waːj'), ('oay', 'waj'), ('oao', 'waːw'),
    ('oăng', 'waŋ'), ('oăc', 'wak'), ('oăn', 'wan'), ('oăt', 'wat'), ('oăm', 'wam'), ('oăp', 'wap'),
    ('oeo', 'wɛw'), ('oen', 'wɛn'), ('oet', 'wɛt'), ('oem', 'wɛm'), ('oep', 'wɛp'), ('oe', 'wɛ'),

    ('uynh', 'wiɲ'), ('uych', 'wik'),
    ('uyên', 'wiən'), ('uyêt', 'wiət'), ('uyt', 'wit'), ('uyn', 'win'), ('uyp', 'wip'),
    ('uya', 'wiə'), ('uyê', 'wiə'), ('uyu', 'wju'), ('uy', 'wi'),

    ('uâng', 'wəŋ'), ('uâc', 'wək'), ('uân', 'wən'), ('uât', 'wət'), ('uâm', 'wəm'), ('uâp', 'wəp'), ('uây', 'wəj'),
    ('uên', 'wen'), ('uêt', 'wet'), ('uêm', 'wem'), ('uêp', 'wep'), ('uêu', 'wew'), ('uê', 'we'),
    ('uai', 'waːj'), ('uay', 'waj'),

    # Diphthongs with codas
    ('iêng', 'iəŋ'), ('yêng', 'iəŋ'), ('iên', 'iən'), ('yên', 'iən'),
    ('iêt', 'iət'), ('yêt', 'iət'), ('iêc', 'iək'), ('yêc', 'iək'),
    ('iêm', 'iəm'), ('yêm', 'iəm'), ('iêp', 'iəp'), ('yêp', 'iəp'),
    ('iêu', 'iəw'), ('yêu', 'iəw'), ('ia', 'iə'), ('ya', 'iə'),
    ('iê', 'je'), ('yê', 'je'),

    ('ương', 'ɯəŋ'), ('ươn', 'ɯən'), ('ươt', 'ɯət'), ('ươc', 'ɯək'),
    ('ươm', 'ɯəm'), ('ươp', 'ɯəp'), ('ươi', 'ɯəj'), ('ươu', 'ɯəw'), ('ưa', 'ɯə'),
    ('ươ', 'ɯə'),

    ('uông', 'uəŋ'), ('uôn', 'uən'), ('uôt', 'uət'), ('uôc', 'uək'),
    ('uôm', 'uəm'), ('uôp', 'uəp'), ('uôi', 'uəj'), ('ua', 'uə'), ('uô', 'uə'),

    # Vowel + Glides
    ('ai', 'aːj'), ('ay', 'aj'), ('ao', 'aːw'), ('au', 'aw'),
    ('âu', 'ow'), ('ây', 'ej'), ('eo', 'ɛw'), ('êu', 'ew'),
    ('oi', 'ɔj'), ('ôi', 'oj'), ('ơi', 'ɤj'), ('ui', 'uj'),
    ('ưi', 'ɯj'), ('ưu', 'ɯw'), ('iu', 'iw'),

    # Simple Vowels + Codas
    ('ang', 'aːŋ'), ('ăng', 'aŋ'), ('âng', 'əŋ'),
    ('an', 'aːn'), ('ăn', 'an'), ('ân', 'ən'),
    ('am', 'aːm'), ('ăm', 'am'), ('âm', 'əm'),
    ('ap', 'aːp'), ('ăp', 'ap'), ('âp', 'əp'),
    ('at', 'aːt'), ('ăt', 'at'), ('ât', 'ət'),
    ('ac', 'aːk'), ('ăc', 'ak'), ('âc', 'ək'),
    ('anh', 'aɲ'), ('ach', 'atʃ'),

    ('inh', 'iɲ'), ('ich', 'ik'), ('in', 'in'), ('it', 'it'), ('im', 'im'), ('ip', 'ip'),

    ('ênh', 'eɲ'), ('êch', 'ek'), ('ên', 'en'), ('êt', 'et'), ('êm', 'em'), ('êp', 'ep'),

    ('eng', 'ɛŋ'), ('en', 'ɛn'), ('em', 'ɛm'), ('et', 'ɛt'), ('ep', 'ɛp'), ('ec', 'ɛk'),

    ('ong', 'ɔŋ'), ('ông', 'oŋ'), ('ung', 'uŋ'), ('ưng', 'ɯŋ'),
    ('oc', 'ɔk'), ('ôc', 'ok'), ('uc', 'uk'), ('ưc', 'ɯk'),
    ('om', 'ɔm'), ('ôm', 'om'), ('ơm', 'ɤm'), ('um', 'um'), ('ưm', 'ɯm'),
    ('on', 'ɔn'), ('ôn', 'on'), ('ơn', 'ɤn'), ('un', 'un'), ('ưn', 'ɯn'),
    ('op', 'ɔp'), ('ôp', 'op'), ('ơp', 'ɤp'), ('up', 'up'), ('ưp', 'ɯp'),
    ('ot', 'ɔt'), ('ôt', 'ot'), ('ơt', 'ɤt'), ('ut', 'ut'), ('ưt', 'ɯt'),

    # Single Vowels
    ('a', 'aː'), ('ă', 'a'), ('â', 'ə'), ('e', 'ɛ'), ('ê', 'e'),
    ('i', 'i'), ('y', 'i'), ('o', 'ɔ'), ('ô', 'o'), ('ơ', 'ɤ'),
    ('u', 'u'), ('ư', 'ɯ')
]

# Kokoro Tone Symbols:
# 1: Ngang (Level), 2: Huyền (Falling), 3: Sắc (Rising),
# 4: Hỏi (Dipping-rising), 5: Ngã (High broken/glottal), 6: Nặng (Low-drop)
TONE_SYMBOLS = {
    1: '',        # Ngang
    2: '↓',       # Huyền
    3: '↗',       # Sắc
    4: '↘↗',      # Hỏi
    5: 'ʔ↗',      # Ngã
    6: '↓',       # Nặng
}

# Special loanwords & proper nouns
SPECIAL_WORDS = {
    'faust': 'fˈaʊst',
    'manager': 'mˈænədʒɚ',
    'tts': 'tiː-tiː-ˈɛs',
    'claude': 'klˈɔːd',
    'c2': 'siː-tˈuː',
    'ai': 'eɪ-ˈaɪ',
    'api': 'eɪ-piː-ˈaɪ',
    'ui': 'juː-ˈaɪ',
}

def extract_tone_and_base(word: str) -> Tuple[str, int]:
    """Decompose Vietnamese tone diacritics into base characters and tone ID (1-6)."""
    w = unicodedata.normalize('NFC', word.lower())
    tone = 1
    clean_chars = []
    for ch in w:
        if ch in TONE_MAP:
            base, t = TONE_MAP[ch]
            clean_chars.append(base)
            tone = t
        else:
            clean_chars.append(ch)
    return ''.join(clean_chars), tone

def parse_vietnamese_syllable(clean_w: str, tone: int) -> Optional[str]:
    """Attempt to parse a base string into Vietnamese (initial + rime)."""
    # Special handling for 'gi'
    if clean_w == 'gi':
        return 'zi' + TONE_SYMBOLS.get(tone, '')
    if clean_w.startswith('gi') and len(clean_w) > 2:
        init_ipa = 'z'
        rest = clean_w[1:]
        if rest.startswith('i') and len(rest) > 1:
            rest = rest[1:]
    else:
        init_ipa = ''
        rest = clean_w
        for init_spell, ipa in INITIALS:
            if clean_w.startswith(init_spell):
                init_ipa = ipa
                rest = clean_w[len(init_spell):]
                break

    rime_ipa = None
    for rime_spell, ipa in RIMES:
        if rest == rime_spell:
            rime_ipa = ipa
            break

    if rime_ipa is not None:
        return init_ipa + rime_ipa + TONE_SYMBOLS.get(tone, '')
    return None

def vi_word_to_ipa(word: str) -> str:
    """Convert a single word into Kokoro IPA if it matches Vietnamese phonology or loanwords."""
    clean_w = re.sub(r'[^\w\s]', '', word.lower())
    if not clean_w:
        return word
    if clean_w in SPECIAL_WORDS:
        return SPECIAL_WORDS[clean_w]

    base, tone = extract_tone_and_base(clean_w)
    ipa = parse_vietnamese_syllable(base, tone)
    if ipa is not None:
        return ipa
    return word

def contains_vietnamese(text: str) -> bool:
    """Detect if string contains Vietnamese diacritics or characteristic vowels."""
    t = unicodedata.normalize('NFC', text.lower())
    if any(c in TONE_MAP for c in t):
        return True
    if any(c in 'ăâđêôơư' for c in t):
        return True
    return False

def vi_text_to_ipa(text: str) -> str:
    """
    Parse a mixed Vietnamese/English text string and convert Vietnamese segments
    to Kokoro-compatible IPA tokens.
    """
    tokens = re.split(r'(\s+|[.,!?;:()"]+)', text)
    res = []
    for tok in tokens:
        if not tok:
            continue
        if re.match(r'^\s+$', tok) or re.match(r'^[.,!?;:()"]+$', tok):
            res.append(tok)
        else:
            clean = re.sub(r'[^\w]', '', tok.lower())
            if clean in SPECIAL_WORDS:
                res.append(SPECIAL_WORDS[clean])
            else:
                base, tone = extract_tone_and_base(clean)
                ipa = parse_vietnamese_syllable(base, tone)
                if ipa is not None:
                    res.append(ipa)
                else:
                    res.append(tok)
    return ''.join(res)
