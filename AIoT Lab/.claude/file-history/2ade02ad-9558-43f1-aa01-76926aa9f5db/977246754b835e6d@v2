import React, { useState, useEffect, useMemo } from 'react';
import { App as ObsidianApp, normalizePath } from 'obsidian';
import {
  WorldManager,
  WorldFile,
  WorldTreeNode,
  WorldNode,
  AssociationResolution,
} from '../../utils/worldManager';
import { VisualAssetManager } from '../../utils/visualAssetManager';
import { CharacterManager } from '../../utils/characterManager';
import {
  CharacterFileInfo,
  CharacterFileStructure,
  CharacterDefinition,
} from '../../types/character';
import { PhysicalSelectorBox } from './PhysicalSelectorBox';
import { CharacterInfoMode } from './character/CharacterInfoMode';
import { CharacterSkinMode } from './character/CharacterSkinMode';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Folder,
  RotateCcw,
  ChevronLeft,
  Users,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Plus,
  Trash2,
  Edit2,
  User,
  Sparkles,
  Layers,
  RefreshCw,
  FileText,
  Filter,
  CheckCircle2,
  Tag,
  Dna,
  Shirt,
  Shield,
  Eye,
  EyeOff,
  Sliders,
  SlidersHorizontal,
  ArrowRight,
  Info,
} from 'lucide-react';

interface CharacterReconstructorViewProps {
  app: ObsidianApp;
}

interface PhysicalTopologyData {
  eyes?: {
    eyes_shape?: string[];
    eyes_special?: string[];
    eyes_color?: string[];
  };
  hair?: {
    hair_length?: string[];
    hair_special_color?: string[];
    hair_color?: string[];
    hair_style?: {
      bangs?: string[];
      sides?: string[];
      back?: string[];
      special?: string[];
    };
    hair_accessories?: string[];
  };
  body_type?: {
    breast_size?: string[];
    height_and_physique?: string[];
    features_and_anatomy?: string[];
  };
}

// Default fallback physical topology
const DEFAULT_PHYSICAL_TOPOLOGY: PhysicalTopologyData = {
  eyes: {
    eyes_shape: [
      'tareme',
      'tsurime',
      'slit pupils',
      'symbol-shaped pupils',
      'heart-shaped pupils',
      'bright eyes',
      'jitome',
      'sanpaku',
    ],
    eyes_special: [
      'heterochromia',
      'gradient eyes',
      'glowing eyes',
      'two-tone eyes',
      'empty eyes',
    ],
    eyes_color: [
      'blue eyes',
      'light blue eyes',
      'sky blue eyes',
      'red eyes',
      'green eyes',
      'brown eyes',
      'purple eyes',
      'amber eyes',
      'yellow eyes',
      'golden eyes',
      'black eyes',
      'pink eyes',
      'silver eyes',
      'white eyes',
      'orange eyes',
      'grey eyes',
    ],
  },
  hair: {
    hair_length: [
      'short hair',
      'medium hair',
      'long hair',
      'very long hair',
      'shoulder-length hair',
      'pixie cut',
      'bald',
    ],
    hair_special_color: [
      'colored inner hair',
      'gradient hair',
      'two-tone hair',
      'split-color hair',
      'streaked hair',
      'colored tips',
      'multicolored hair',
    ],
    hair_color: [
      'blonde hair',
      'golden blonde hair',
      'ash blonde hair',
      'brown hair',
      'black hair',
      'silver hair',
      'white hair',
      'pink hair',
      'blue hair',
      'light blue hair',
      'dark blue hair',
      'red hair',
      'purple hair',
      'green hair',
      'orange hair',
      'grey hair',
    ],
    hair_style: {
      bangs: [
        'bangs',
        'blunt bangs',
        'swept bangs',
        'parted bangs',
        'asymmetrical bangs',
        'crossed bangs',
        'hair over one eye',
        'forehead',
      ],
      sides: [
        'twintails',
        'low twintails',
        'sidelocks',
        'side ponytail',
        'twin braids',
        'single side braid',
        'twin low buns',
        'short twin braids',
        'drill hair',
      ],
      back: [
        'ponytail',
        'high ponytail',
        'low ponytail',
        'braid',
        'french braid',
        'bun',
        'hair down',
        'half updo',
      ],
      special: [
        'ahoge',
        'antenna hair',
        'messy hair',
        'wavy hair',
        'straight hair',
        'curly hair',
        'spiky hair',
        'pointy hair',
      ],
    },
    hair_accessories: [
      'hair ornament',
      'hair ribbon',
      'hair bow',
      'hairclip',
      'bobby pins',
      'hair flower',
      'scrunchie',
      'hairband',
    ],
  },
  body_type: {
    breast_size: [
      'flat chest',
      'small breasts',
      'medium breasts',
      'large breasts',
      'huge breasts',
      'gigantic breasts',
    ],
    height_and_physique: [
      'petite',
      'tall',
      'slender',
      'curvy',
      'toned',
      'plump',
      'muscular',
      'fair skin',
      'pale skin',
      'tanned skin',
      'dark skin',
    ],
    features_and_anatomy: [
      'mole on chest',
      'mole under eye',
      'mole on cheek',
      'collarbone',
      'cleavage',
      'navel',
      'pierced navel',
      'abs',
      'freckles',
      'horns',
      'demon horns',
      'animal ears',
      'cat ears',
      'fox ears',
      'elf ears',
      'tail',
      'demon tail',
      'wings',
      'halo',
      'fang',
      'pointy ears',
    ],
  },
};

interface PhysicalSelections {
  eyes_shape: string[];
  eyes_special: string[];
  eyes_color: string[]; // max 2
  hair_length: string[]; // single
  hair_special_color: string[];
  hair_color: string[]; // max 4
  hair_bangs: string[];
  hair_sides: string[];
  hair_back: string[];
  hair_special: string[];
  hair_accessories: string[];
  breast_size: string[]; // single
  height_and_physique: string[];
  features_and_anatomy: string[];
}

/**
 * Deconstructs a prompt string into matching Physical selections and leftover exclusive keywords.
 */
function deconstructPrompt(
  promptStr: string,
  topology: PhysicalTopologyData
): {
  exclusiveTokens: string[];
  physicalSelections: PhysicalSelections;
} {
  const tokens = promptStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const selections: PhysicalSelections = {
    eyes_shape: [],
    eyes_special: [],
    eyes_color: [],
    hair_length: [],
    hair_special_color: [],
    hair_color: [],
    hair_bangs: [],
    hair_sides: [],
    hair_back: [],
    hair_special: [],
    hair_accessories: [],
    breast_size: [],
    height_and_physique: [],
    features_and_anatomy: [],
  };

  const exclusive: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    let matched = false;

    // Check eyes
    if (topology.eyes?.eyes_shape?.some((o) => o.toLowerCase() === lower)) {
      selections.eyes_shape.push(token);
      matched = true;
    } else if (topology.eyes?.eyes_special?.some((o) => o.toLowerCase() === lower)) {
      selections.eyes_special.push(token);
      matched = true;
    } else if (topology.eyes?.eyes_color?.some((o) => o.toLowerCase() === lower)) {
      selections.eyes_color.push(token);
      matched = true;
    }
    // Check hair length & color
    else if (topology.hair?.hair_length?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_length = [token];
      matched = true;
    } else if (topology.hair?.hair_special_color?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_special_color.push(token);
      matched = true;
    } else if (topology.hair?.hair_color?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_color.push(token);
      matched = true;
    }
    // Check hair style
    else if (topology.hair?.hair_style?.bangs?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_bangs.push(token);
      matched = true;
    } else if (topology.hair?.hair_style?.sides?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_sides.push(token);
      matched = true;
    } else if (topology.hair?.hair_style?.back?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_back.push(token);
      matched = true;
    } else if (topology.hair?.hair_style?.special?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_special.push(token);
      matched = true;
    } else if (topology.hair?.hair_accessories?.some((o) => o.toLowerCase() === lower)) {
      selections.hair_accessories.push(token);
      matched = true;
    }
    // Check body
    else if (topology.body_type?.breast_size?.some((o) => o.toLowerCase() === lower)) {
      selections.breast_size = [token];
      matched = true;
    } else if (topology.body_type?.height_and_physique?.some((o) => o.toLowerCase() === lower)) {
      selections.height_and_physique.push(token);
      matched = true;
    } else if (topology.body_type?.features_and_anatomy?.some((o) => o.toLowerCase() === lower)) {
      selections.features_and_anatomy.push(token);
      matched = true;
    }

    if (!matched) {
      exclusive.push(token);
    }
  }

  return {
    exclusiveTokens: exclusive,
    physicalSelections: selections,
  };
}

export const CharacterReconstructorView: React.FC<CharacterReconstructorViewProps> = ({ app }) => {
  // ==========================================
  // TOP-LEVEL THREE-MODE WORKSPACE SELECTOR
  // ==========================================
  const [activeMode, setActiveMode] = useState<'info' | 'dna' | 'skin'>('dna');

  // ==========================================
  // MODE 1: CHARACTER INFO & TAXONOMY STATES
  // ==========================================
  const [infoNames, setInfoNames] = useState<string[]>([]);
  const [infoNicknames, setInfoNicknames] = useState<string[]>([]);
  const [infoAliases, setInfoAliases] = useState<string[]>([]);
  const [infoArchetype, setInfoArchetype] = useState<string[]>([]);
  const [infoPersonalityTropes, setInfoPersonalityTropes] = useState<string[]>([]);
  const [infoAddressment, setInfoAddressment] = useState<string[]>([]);
  const [infoHazardScore, setInfoHazardScore] = useState<number>(3.0);
  const [currentAssociate, setCurrentAssociate] = useState<string[]>([]);

  // ==========================================
  // MODE 3: SKIN (OUTFIT & WARDROBE) STATES
  // ==========================================
  const [outfitPrompt, setOutfitPrompt] = useState<string>('');
  const [outfitCopied, setOutfitCopied] = useState<boolean>(false);
  const [layerToggles, setLayerToggles] = useState<Record<string, boolean>>({
    headwear: true,
    neckwear: true,
    outerwear: true,
    tops: true,
    bottoms: true,
    legwear: true,
    footwear: true,
    underwear: true,
    props: true,
  });
  const [skinPresets, setSkinPresets] = useState<Record<string, { display_name: string; prompt: string; subjects?: number[] }>>({});
  const [isLoadingSkins, setIsLoadingSkins] = useState<boolean>(false);
  const [skinSearch, setSkinSearch] = useState<string>('');

  // ==========================================
  // SIDEBAR & CHARACTER REPOSITORY STATE
  // ==========================================
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [characterFiles, setCharacterFiles] = useState<CharacterFileInfo[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState<boolean>(false);
  const [characterSearch, setCharacterSearch] = useState<string>('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');

  // Active Loaded Character File & Structure
  const [selectedCharFile, setSelectedCharFile] = useState<CharacterFileInfo | null>(null);
  const [activeCharStructure, setActiveCharStructure] = useState<CharacterFileStructure | null>(null);
  const [activeVariantKey, setActiveVariantKey] = useState<string>('default');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Section 1: Character Exclusive Prompt
  const [exclusivePrompt, setExclusivePrompt] = useState<string>(
    'amelia watson, amelia watson (hololive)'
  );

  // Section 2: World & Association Hierarchy
  const [worldFiles, setWorldFiles] = useState<WorldFile[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>('Internet');
  const [selectedPath, setSelectedPath] = useState<string[]>([
    'Vtuber',
    'Hololive',
    'HoloEN',
    'HoloMyth',
  ]);

  // Collapsed header paths state for World
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  // Search state for instant World tree jump
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Section 3: Physical Appearance Topology & Selections
  const [physicalTopology, setPhysicalTopology] = useState<PhysicalTopologyData>(DEFAULT_PHYSICAL_TOPOLOGY);
  const [physicalSelections, setPhysicalSelections] = useState<PhysicalSelections>({
    eyes_shape: [],
    eyes_special: [],
    eyes_color: ['blue eyes'],
    hair_length: ['medium hair'],
    hair_special_color: [],
    hair_color: ['blonde hair'],
    hair_bangs: ['bangs'],
    hair_sides: ['sidelocks'],
    hair_back: ['hair down'],
    hair_special: [],
    hair_accessories: ['hairclip'],
    breast_size: ['medium breasts'],
    height_and_physique: ['petite'],
    features_and_anatomy: [],
  });

  // Collapsible physical sub-sections
  const [collapsedPhysicalSections, setCollapsedPhysicalSections] = useState<Record<string, boolean>>({
    eyes: false,
    hair: false,
    body: false,
  });

  // Collapsible main reconstructor sections
  const [collapsedMainSections, setCollapsedMainSections] = useState<Record<string, boolean>>({
    exclusive: false,
    world: false,
    physical: false,
    finalPrompt: false,
  });

  const toggleMainSection = (sec: string) => {
    setCollapsedMainSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // Load Character files list from Vault (High performance: index only)
  const refreshCharacterList = async () => {
    setIsLoadingCharacters(true);
    try {
      const files = await CharacterManager.listCharacters(app);
      setCharacterFiles(files);
      // Auto-select first character if none selected and files exist
      if (!selectedCharFile && files.length > 0) {
        handleSelectCharacterFile(files[0]);
      }
    } catch (err) {
      console.error('Error loading character files:', err);
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  useEffect(() => {
    refreshCharacterList();
  }, [app]);

  // Load Worlds from Vault
  useEffect(() => {
    const loadWorlds = async () => {
      try {
        const files = await WorldManager.listWorlds(app);
        setWorldFiles(files);
        if (files.length > 0 && !files.some((f) => f.id === selectedWorldId)) {
          setSelectedWorldId(files[0].id);
        }
      } catch (e) {
        console.error('Failed to load worlds:', e);
      }
    };
    loadWorlds();
    VisualAssetManager.loadPackages(app);
  }, [app]);

  // Load Physical Appearance JSON from Vault
  useEffect(() => {
    const loadPhysicalTopology = async () => {
      try {
        const filePath = normalizePath('Hazard_Trigger_Data/Topology/Tree/_1_physical_appearance.json');
        if (await app.vault.adapter.exists(filePath)) {
          const raw = await app.vault.adapter.read(filePath);
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.eyes || parsed.hair || parsed.body_type)) {
            setPhysicalTopology(parsed);
          }
        }
      } catch (e) {
        console.warn('Using default physical topology fallback:', e);
      }
    };
    loadPhysicalTopology();
  }, [app]);

  // Load Skin Presets from Eva_Skin.json
  const loadSkinPresets = async () => {
    setIsLoadingSkins(true);
    try {
      const filePath = normalizePath('Hazard_Trigger_Data/Components/_03_Apeals/Eva_Skin.json');
      if (await app.vault.adapter.exists(filePath)) {
        const raw = await app.vault.adapter.read(filePath);
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setSkinPresets(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load Eva_Skin.json presets:', e);
    } finally {
      setIsLoadingSkins(false);
    }
  };

  useEffect(() => {
    loadSkinPresets();
  }, [app]);

  // Layer toggle handlers for Mode 3
  const handleToggleLayer = (layerKey: string) => {
    setLayerToggles((prev) => ({
      ...prev,
      [layerKey]: prev[layerKey] === false ? true : false,
    }));
  };

  const handleResetLayers = () => {
    setLayerToggles({
      headwear: true,
      neckwear: true,
      outerwear: true,
      tops: true,
      bottoms: true,
      legwear: true,
      footwear: true,
      underwear: true,
      props: true,
    });
  };

  const activeWorldFile = useMemo(() => {
    return worldFiles.find((f) => f.id === selectedWorldId) || worldFiles[0] || null;
  }, [worldFiles, selectedWorldId]);

  // Flatten active tree for search
  const flattenedNodes = useMemo(() => {
    if (!activeWorldFile?.data) return [];
    return WorldManager.flattenTree(activeWorldFile.data);
  }, [activeWorldFile]);

  // Search Results for World Hierarchy
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return WorldManager.searchTreeNodes(flattenedNodes, searchQuery, selectedPath);
  }, [flattenedNodes, searchQuery, selectedPath]);

  // Batches derived from character files (e.g. TT01, TT02)
  const availableBatches = useMemo(() => {
    const batches = new Set<string>();
    characterFiles.forEach((cf) => {
      if (cf.batchDir) batches.add(cf.batchDir);
    });
    return ['ALL', ...Array.from(batches).sort()];
  }, [characterFiles]);

  // Filtered Character List based on search query and batch filter
  const filteredCharacterFiles = useMemo(() => {
    const q = characterSearch.trim().toLowerCase();
    return characterFiles.filter((cf) => {
      if (selectedBatchFilter !== 'ALL' && cf.batchDir !== selectedBatchFilter) {
        return false;
      }
      if (!q) return true;
      return (
        cf.id.toLowerCase().includes(q) ||
        cf.fileName.toLowerCase().includes(q) ||
        cf.batchDir.toLowerCase().includes(q) ||
        cf.canonicalName.toLowerCase().includes(q)
      );
    });
  }, [characterFiles, characterSearch, selectedBatchFilter]);

  // Variants list for active character
  const activeVariantsList = useMemo(() => {
    if (!activeCharStructure) return [];
    return Object.keys(activeCharStructure).filter((k) => k === 'default' || k.startsWith('ego_') || k.startsWith('variant_'));
  }, [activeCharStructure]);

  // ==========================================
  // CHARACTER SELECTION & INGESTION
  // ==========================================
  const handleSelectCharacterFile = async (charFile: CharacterFileInfo) => {
    setSelectedCharFile(charFile);
    try {
      const structure = await CharacterManager.loadCharacterFile(app, charFile.relPath);
      if (structure && structure.default) {
        setActiveCharStructure(structure);
        setActiveVariantKey('default');
        applyVariantToEditor(structure, 'default');
      }
    } catch (err) {
      console.error(`Failed to load character file ${charFile.relPath}:`, err);
    }
  };

  /**
   * Applies the resolved variant state into the Reconstructor Editor.
   */
  const applyVariantToEditor = (structure: CharacterFileStructure, variantKey: string) => {
    const targetDef = variantKey === 'default' ? structure.default : structure[variantKey];
    const resolved: CharacterDefinition = CharacterManager.resolveVariant(structure.default, targetDef);

    // 1. Ingest prompt / _prpt_
    const rawPrompt = resolved._prpt_ || resolved.prompt || '';
    if (rawPrompt) {
      const { exclusiveTokens, physicalSelections: deconstructed } = deconstructPrompt(
        rawPrompt,
        physicalTopology
      );
      setExclusivePrompt(exclusiveTokens.join(', '));
      setPhysicalSelections(deconstructed);
    } else {
      setExclusivePrompt('');
      setPhysicalSelections({} as any);
    }

    // 2. Ingest Mode 1: Nomenclature (names, nicknames, aliases)
    if (resolved.names) {
      if (typeof resolved.names === 'object' && !Array.isArray(resolved.names)) {
        const nObj = resolved.names as any;
        setInfoNames(Array.isArray(nObj.names) ? nObj.names : (nObj.canonical ? [nObj.canonical] : []));
        setInfoNicknames(Array.isArray(nObj.nicknames) ? nObj.nicknames : []);
        setInfoAliases(Array.isArray(nObj.aliases) ? nObj.aliases : []);
      } else if (Array.isArray(resolved.names)) {
        setInfoNames([...resolved.names]);
        setInfoNicknames([]);
        setInfoAliases([]);
      } else if (typeof resolved.names === 'string') {
        setInfoNames([resolved.names]);
        setInfoNicknames([]);
        setInfoAliases([]);
      }
    } else {
      setInfoNames([]);
      setInfoNicknames([]);
      setInfoAliases([]);
    }

    // 3. Ingest Mode 1: Taxonomy (archetype, personalityTropes, addressment)
    if (resolved.taxonomy) {
      setInfoArchetype(Array.isArray(resolved.taxonomy.archetype) ? resolved.taxonomy.archetype : []);
      setInfoPersonalityTropes(Array.isArray(resolved.taxonomy.personalityTropes) ? resolved.taxonomy.personalityTropes : []);
      setInfoAddressment(Array.isArray(resolved.taxonomy.addressment) ? resolved.taxonomy.addressment : []);
    } else {
      setInfoArchetype([]);
      setInfoPersonalityTropes([]);
      setInfoAddressment([]);
    }

    // 4. Ingest Mode 1: Hazard Level
    if (resolved.hazardLevel?.hazardScore !== undefined) {
      setInfoHazardScore(resolved.hazardLevel.hazardScore);
    } else {
      setInfoHazardScore(3.0);
    }

    // 5. Ingest Associate if present and map to tree
    let assocList: string[] = [];
    if (Array.isArray(resolved.associate)) {
      assocList = resolved.associate;
    } else if (typeof resolved.associate === 'string') {
      assocList = [resolved.associate];
    } else if (typeof resolved.associate === 'object' && resolved.associate && (resolved.associate as any).series) {
      assocList = [(resolved.associate as any).series];
    }
    setCurrentAssociate(assocList);

    if (assocList.length > 0 && activeWorldFile?.data) {
      const associateName = assocList[assocList.length - 1];
      const found = flattenedNodes.find(
        (n) => n.key.toLowerCase() === associateName.toLowerCase() || n.id.toLowerCase().includes(associateName.toLowerCase())
      );
      if (found) {
        setSelectedPath(found.path);
      }
    }

    // 6. Ingest Mode 3: Skin / Outfit
    setOutfitPrompt(resolved.outfit || '');
  };

  // Switch Variant
  const handleSwitchVariant = (variantKey: string) => {
    if (!activeCharStructure) return;
    setActiveVariantKey(variantKey);
    applyVariantToEditor(activeCharStructure, variantKey);
  };

  // Rename Active Variant
  const handleRenameVariant = (newName: string) => {
    if (!activeCharStructure) return;
    const updated = JSON.parse(JSON.stringify(activeCharStructure));
    const targetDef = activeVariantKey === 'default' ? updated.default : updated[activeVariantKey];
    if (targetDef) {
      CharacterManager.setVariantDisplayName(targetDef, newName);
      setActiveCharStructure(updated);
    }
  };

  // Rename Specific Variant in Table
  const handleRenameSpecificVariant = (vKey: string, newName: string) => {
    if (!activeCharStructure) return;
    const updated = JSON.parse(JSON.stringify(activeCharStructure));
    const targetDef = vKey === 'default' ? updated.default : updated[vKey];
    if (targetDef) {
      CharacterManager.setVariantDisplayName(targetDef, newName);
      setActiveCharStructure(updated);
    }
  };

  // Create New Variant
  const handleCreateVariant = () => {
    if (!activeCharStructure) return;
    const { structure: updated, newVariantKey } = CharacterManager.createVariant(
      activeCharStructure,
      activeVariantKey,
      `Variant ${Object.keys(activeCharStructure).length}`
    );
    setActiveCharStructure(updated);
    setActiveVariantKey(newVariantKey);
    applyVariantToEditor(updated, newVariantKey);
  };

  // Delete Current Variant
  const handleDeleteVariant = () => {
    if (!activeCharStructure || activeVariantKey === 'default') return;
    const updated = CharacterManager.deleteVariant(activeCharStructure, activeVariantKey);
    setActiveCharStructure(updated);
    setActiveVariantKey('default');
    applyVariantToEditor(updated, 'default');
  };

  // Delete Specific Variant in Table
  const handleDeleteSpecificVariant = (vKey: string) => {
    if (!activeCharStructure || vKey === 'default') return;
    const updated = CharacterManager.deleteVariant(activeCharStructure, vKey);
    setActiveCharStructure(updated);
    if (activeVariantKey === vKey) {
      setActiveVariantKey('default');
      applyVariantToEditor(updated, 'default');
    }
  };

  // Save Character Changes Back to Disk
  const handleSaveCharacter = async () => {
    if (!selectedCharFile || !activeCharStructure) return;
    setSaveStatus('saving');

    try {
      const updated: CharacterFileStructure = JSON.parse(JSON.stringify(activeCharStructure));
      const targetDef = activeVariantKey === 'default' ? updated.default : updated[activeVariantKey];

      if (targetDef) {
        // Update _prpt_ from current editor state
        const currentPhysicalPrompt = physicalPrompt;
        const currentExclusive = exclusivePrompt.trim();
        const combined = [currentExclusive, currentPhysicalPrompt].filter(Boolean).join(', ');
        targetDef._prpt_ = combined;

        // Update outfit (Mode 3)
        targetDef.outfit = outfitPrompt;

        // Update associate (Bound from Mode 2 World Hierarchy)
        targetDef.associate = [...currentAssociate];

        // Update Mode 1: Nomenclature & Taxonomy
        if (activeVariantKey === 'default') {
          targetDef.names = {
            names: infoNames,
            nicknames: infoNicknames,
            aliases: infoAliases,
          };
          targetDef.taxonomy = {
            archetype: infoArchetype,
            personalityTropes: infoPersonalityTropes,
            addressment: infoAddressment,
          };
          targetDef.hazardLevel = {
            hazardScore: infoHazardScore,
          };
        } else {
          if (typeof targetDef.names === 'object' && !Array.isArray(targetDef.names)) {
            targetDef.names = {
              names: infoNames,
              nicknames: infoNicknames,
              aliases: infoAliases,
            };
          } else {
            targetDef.names = infoNames.length > 0 ? infoNames : targetDef.names || ['Unnamed Variant'];
          }
          if (infoArchetype.length > 0 || infoPersonalityTropes.length > 0 || infoAddressment.length > 0) {
            targetDef.taxonomy = {
              archetype: infoArchetype,
              personalityTropes: infoPersonalityTropes,
              addressment: infoAddressment,
            };
          }
          if (infoHazardScore !== undefined) {
            targetDef.hazardLevel = {
              hazardScore: infoHazardScore,
            };
          }
        }
      }

      await CharacterManager.saveCharacterFile(app, selectedCharFile.relPath, updated);
      setActiveCharStructure(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save character file:', err);
      setSaveStatus('idle');
    }
  };

  // Handle World File Selection
  const handleWorldFileChange = (newWorldId: string) => {
    setSelectedWorldId(newWorldId);
    setSearchQuery('');
    setCollapsedPaths(new Set());
    const targetFile = worldFiles.find((f) => f.id === newWorldId);
    if (targetFile?.data) {
      const newPath: string[] = [];
      let node: any = targetFile.data;
      while (node) {
        const childKeys = WorldManager.getChildKeys(node);
        if (childKeys.length > 0) {
          const first = childKeys[0];
          newPath.push(first);
          node = node[first];
        } else {
          break;
        }
      }
      setSelectedPath(newPath);
    } else {
      setSelectedPath([]);
    }
  };

  // Toggle Collapse / Expand for a specific world node
  const toggleCollapse = (pathStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) {
        next.delete(pathStr);
      } else {
        next.add(pathStr);
      }
      return next;
    });
  };

  // Toggle collapse for physical major sections (# Eyes, # Hair, # Body Type)
  const togglePhysicalSection = (sec: string) => {
    setCollapsedPhysicalSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // Handle Selecting or Deselecting a Header Node
  const handleSelectHeaderNode = (path: string[], depth: number) => {
    const isDeepestSelected = selectedPath.length === depth + 1 && selectedPath[depth] === path[depth];
    const isAncestorSelected = selectedPath.length > depth + 1 && selectedPath[depth] === path[depth];

    if (isDeepestSelected) {
      const newPath = selectedPath.slice(0, depth);
      setSelectedPath(newPath);
      setCurrentAssociate(newPath.length > 0 ? [newPath[newPath.length - 1]] : []);
    } else if (isAncestorSelected) {
      const newPath = selectedPath.slice(0, depth + 1);
      setSelectedPath(newPath);
      setCurrentAssociate(newPath.length > 0 ? [newPath[newPath.length - 1]] : []);
    } else {
      setSelectedPath(path);
      setCurrentAssociate(path.length > 0 ? [path[path.length - 1]] : []);
      setCollapsedPaths((prev) => {
        const next = new Set(prev);
        for (let i = 1; i <= path.length; i++) {
          next.delete(path.slice(0, i).join('/'));
        }
        return next;
      });
    }
  };

  // Handle Search Result Select
  const handleSelectSearchResult = (node: WorldTreeNode) => {
    setSelectedPath(node.path);
    setCurrentAssociate(node.path.length > 0 ? [node.path[node.path.length - 1]] : []);
    setSearchQuery('');
    setIsSearchFocused(false);
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      for (let i = 1; i <= node.path.length; i++) {
        next.delete(node.path.slice(0, i).join('/'));
      }
      return next;
    });
  };

  // Clear all world selections
  const handleClearSelection = () => {
    setSelectedPath([]);
    setCurrentAssociate([]);
    setCollapsedPaths(new Set());
  };

  // Set field value in physical selections
  const updatePhysicalSelection = (field: keyof PhysicalSelections, values: string[]) => {
    setPhysicalSelections((prev) => ({
      ...prev,
      [field]: values,
    }));
  };

  // Inherited Association Prompts
  const associationResolution: AssociationResolution = useMemo(() => {
    if (!activeWorldFile?.data) {
      return { worldId: selectedWorldId, path: selectedPath, inheritedPrompts: [], assembledPrompt: '' };
    }
    return WorldManager.resolveAssociationPath(activeWorldFile.data, selectedPath, selectedWorldId);
  }, [activeWorldFile, selectedPath, selectedWorldId]);

  // Aggregate all selected physical tokens in structured logical order
  const physicalTokens = useMemo(() => {
    const tokens: string[] = [];

    // Hair
    if (physicalSelections.hair_length?.length) tokens.push(...physicalSelections.hair_length);
    if (physicalSelections.hair_special_color?.length) tokens.push(...physicalSelections.hair_special_color);
    if (physicalSelections.hair_color?.length) tokens.push(...physicalSelections.hair_color);
    if (physicalSelections.hair_bangs?.length) tokens.push(...physicalSelections.hair_bangs);
    if (physicalSelections.hair_sides?.length) tokens.push(...physicalSelections.hair_sides);
    if (physicalSelections.hair_back?.length) tokens.push(...physicalSelections.hair_back);
    if (physicalSelections.hair_special?.length) tokens.push(...physicalSelections.hair_special);
    if (physicalSelections.hair_accessories?.length) tokens.push(...physicalSelections.hair_accessories);

    // Eyes
    if (physicalSelections.eyes_color?.length) tokens.push(...physicalSelections.eyes_color);
    if (physicalSelections.eyes_shape?.length) tokens.push(...physicalSelections.eyes_shape);
    if (physicalSelections.eyes_special?.length) tokens.push(...physicalSelections.eyes_special);

    // Body
    if (physicalSelections.breast_size?.length) tokens.push(...physicalSelections.breast_size);
    if (physicalSelections.height_and_physique?.length) tokens.push(...physicalSelections.height_and_physique);
    if (physicalSelections.features_and_anatomy?.length) tokens.push(...physicalSelections.features_and_anatomy);

    return Array.from(new Set(tokens.filter(Boolean)));
  }, [physicalSelections]);

  const physicalPrompt = useMemo(() => {
    return physicalTokens.join(', ');
  }, [physicalTokens]);

  // Master Compiled Prompt (Exclusive + World Association + Physical Appearance)
  const compiledPrompt = useMemo(() => {
    const parts: string[] = [];
    const cleanExclusive = exclusivePrompt
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');

    if (cleanExclusive) parts.push(cleanExclusive);
    if (associationResolution.assembledPrompt) {
      parts.push(associationResolution.assembledPrompt);
    }
    if (physicalPrompt) {
      parts.push(physicalPrompt);
    }

    return parts.join(', ');
  }, [exclusivePrompt, associationResolution, physicalPrompt]);

  const handleCopy = () => {
    if (!compiledPrompt) return;
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Depth color tokens for markdown headers
  const depthStyles = [
    {
      prefixColor: 'text-hazard-gold font-black',
      activeText: 'text-hazard-gold font-black',
      idleText: 'text-hazard-textBright font-extrabold',
      activeBg: 'bg-hazard-gold/15 border-hazard-gold shadow-hazard-glow',
      idleBg: 'bg-hazard-void/80 hover:bg-hazard-card hover:border-hazard-gold/50 border-hazard-border/80',
      lineColor: 'border-hazard-gold/30',
    },
    {
      prefixColor: 'text-hazard-cyan font-black',
      activeText: 'text-hazard-cyan font-black',
      idleText: 'text-hazard-textBright font-bold',
      activeBg: 'bg-hazard-cyan/15 border-hazard-cyan shadow-sm',
      idleBg: 'bg-hazard-void/80 hover:bg-hazard-card hover:border-hazard-cyan/50 border-hazard-border/80',
      lineColor: 'border-hazard-cyan/30',
    },
    {
      prefixColor: 'text-hazard-purple font-black',
      activeText: 'text-hazard-purple font-black',
      idleText: 'text-hazard-textBright font-semibold',
      activeBg: 'bg-hazard-purple/15 border-hazard-purple shadow-sm',
      idleBg: 'bg-hazard-void/80 hover:bg-hazard-card hover:border-hazard-purple/50 border-hazard-border/80',
      lineColor: 'border-hazard-purple/30',
    },
    {
      prefixColor: 'text-emerald-400 font-black',
      activeText: 'text-emerald-400 font-black',
      idleText: 'text-hazard-textBright font-medium',
      activeBg: 'bg-emerald-500/15 border-emerald-400 shadow-sm',
      idleBg: 'bg-hazard-void/80 hover:bg-hazard-card hover:border-emerald-400/50 border-hazard-border/80',
      lineColor: 'border-emerald-400/30',
    },
  ];

  // Recursive Markdown Header Node Renderer for World
  const renderHeaderNode = (
    key: string,
    nodeObj: WorldNode,
    currentPath: string[],
    depth: number
  ) => {
    const path = [...currentPath, key];
    const pathStr = path.join('/');
    const allChildKeys = WorldManager.getChildKeys(nodeObj);
    const hasChildren = allChildKeys.length > 0;
    const isCollapsed = collapsedPaths.has(pathStr);

    const isExactMatch = selectedPath.join('/') === pathStr;
    const isAncestor = selectedPath.slice(0, path.length).join('/') === pathStr;
    const isSelected = isExactMatch || isAncestor;

    const selectedChildKey = selectedPath[depth + 1];
    const visibleChildKeys = (selectedChildKey && allChildKeys.includes(selectedChildKey))
      ? [selectedChildKey]
      : allChildKeys;

    const style = depthStyles[depth] || depthStyles[depthStyles.length - 1];
    const headerPrefix = '#'.repeat(depth + 1);
    const prtVal = typeof nodeObj?._prt_ === 'string' ? nodeObj._prt_.trim() : null;

    return (
      <div key={key} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSelectHeaderNode(path, depth);
            }}
            className={`min-h-[50px] px-4 py-2.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer group shadow-sm ${
              isSelected ? style.activeBg : style.idleBg
            }`}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(pathStr, e)}
                className="p-1 -ml-1 rounded-lg hover:bg-black/30 text-hazard-textMuted hover:text-hazard-textBright transition shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-hazard-gold/80 group-hover:text-hazard-gold transition-transform" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-hazard-gold/80 group-hover:text-hazard-gold transition-transform" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 shrink-0" />
            )}

            <span className={`text-base select-none shrink-0 ${style.prefixColor}`}>
              {headerPrefix}
            </span>

            <span
              className={`text-sm md:text-base tracking-wide whitespace-nowrap ${
                isSelected ? style.activeText : style.idleText
              }`}
            >
              {key}
            </span>

            {prtVal && (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-mono select-all ml-1 ${
                  isSelected
                    ? 'bg-black/40 border-current/40 text-current'
                    : 'bg-hazard-void text-hazard-textMuted border-hazard-border group-hover:text-hazard-textBright'
                }`}
              >
                {prtVal}
              </span>
            )}

            {isExactMatch && (
              <span className="ml-auto text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-hazard-gold text-black shadow-sm shrink-0">
                Selected
              </span>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className={`flex flex-col gap-2 pl-6 ml-4 border-l-2 ${style.lineColor} transition-all`}>
            {visibleChildKeys.map((childKey) =>
              renderHeaderNode(childKey, nodeObj[childKey], path, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMarkdownIndexTree = () => {
    if (!activeWorldFile?.data) {
      return (
        <div className="p-8 text-center text-hazard-textMuted/60 italic font-mono text-sm">
          No hierarchy data found in selected World file.
        </div>
      );
    }

    const allRootKeys = WorldManager.getChildKeys(activeWorldFile.data);

    if (allRootKeys.length === 0) {
      return (
        <div className="p-8 text-center text-hazard-textMuted/60 italic font-mono text-sm">
          World file is empty.
        </div>
      );
    }

    const selectedRootKey = selectedPath[0];
    const visibleRootKeys = (selectedRootKey && allRootKeys.includes(selectedRootKey))
      ? [selectedRootKey]
      : allRootKeys;

    return (
      <div className="flex flex-col gap-3 font-mono">
        {visibleRootKeys.map((rootKey) =>
          renderHeaderNode(rootKey, activeWorldFile.data[rootKey], [], 0)
        )}
      </div>
    );
  };

  const currentVariantDef = activeCharStructure
    ? (activeVariantKey === 'default' ? activeCharStructure.default : activeCharStructure[activeVariantKey])
    : null;

  const currentVariantDisplayName = currentVariantDef
    ? CharacterManager.getVariantDisplayName(currentVariantDef, activeVariantKey)
    : activeVariantKey;

  return (
    <div className="w-full flex flex-col gap-6 pb-20 animate-in fade-in duration-150 font-sans relative">
      {/* Top Character & Variant Banner (Entire Banner is a Generous Clickable Hitbox) */}
      {selectedCharFile ? (
        <div
          onClick={() => setIsSidebarOpen(true)}
          className="p-5 sm:p-6 rounded-2xl bg-hazard-card/95 border-2 border-hazard-border hover:border-hazard-gold/80 transition-all shadow-lg flex flex-wrap items-center justify-between gap-4 font-mono cursor-pointer group select-none"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold group-hover:bg-hazard-gold/20 group-hover:scale-105 transition shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black text-hazard-textBright uppercase tracking-wide group-hover:text-hazard-gold transition truncate">
                  {selectedCharFile.id}
                </h3>
                {selectedCharFile.batchDir && (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-hazard-void border border-hazard-border text-hazard-cyan font-bold">
                    {selectedCharFile.batchDir}
                  </span>
                )}
                <span className="text-[11px] px-2.5 py-0.5 rounded bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold font-bold hidden sm:inline-flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>Click to Browse</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-hazard-textMuted mt-0.5 truncate">
                Active Variant: <span className="text-hazard-gold font-bold">{currentVariantDisplayName}</span> <span className="text-hazard-textMuted/60">({activeVariantKey})</span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Clicks isolated from banner open trigger) */}
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleSaveCharacter}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500 text-black shadow-hazard-glow'
                  : 'bg-hazard-gold text-black hover:bg-hazard-goldGlow'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save File'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsSidebarOpen(true)}
          className="p-6 rounded-2xl bg-hazard-card/95 border-2 border-dashed border-hazard-border hover:border-hazard-gold/80 transition-all shadow-md flex items-center justify-between gap-4 font-mono cursor-pointer group select-none"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-hazard-void border border-hazard-border text-hazard-textMuted group-hover:text-hazard-gold group-hover:border-hazard-gold/40 group-hover:scale-105 transition shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-hazard-textBright uppercase tracking-wide group-hover:text-hazard-gold transition">
                No Character Selected
              </h3>
              <p className="text-xs text-hazard-textMuted mt-0.5">
                Click anywhere on this banner to open the Character Drawer and choose a file.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-hazard-gold text-xs font-bold shrink-0">
            <span>Browse Characters</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP-LEVEL WORKSPACE MODE SELECTOR (INFO | DNA | SKIN)           */}
      {/* ============================================================== */}
      <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-hazard-card/90 border-2 border-hazard-border shadow-lg font-mono">
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            type="button"
            onClick={() => setActiveMode('info')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all cursor-pointer select-none ${
              activeMode === 'info'
                ? 'bg-hazard-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.01]'
                : 'text-hazard-textMuted hover:text-hazard-cyan hover:bg-hazard-void/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Character Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('dna')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all cursor-pointer select-none ${
              activeMode === 'dna'
                ? 'bg-hazard-gold text-black shadow-hazard-glow scale-[1.01]'
                : 'text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-void/60'
            }`}
          >
            <Dna className="w-4 h-4" />
            <span>DNA Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('skin')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all cursor-pointer select-none ${
              activeMode === 'skin'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.01]'
                : 'text-hazard-textMuted hover:text-purple-400 hover:bg-hazard-void/60'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Skin (Attire)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: CHARACTER INFO & TAXONOMY */}
      {activeMode === 'info' && (
        <CharacterInfoMode
          characterId={selectedCharFile?.id || (currentVariantDef as any)?.id || 'UNNAMED'}
          activeVariantKey={activeVariantKey}
          names={infoNames}
          onNamesChange={setInfoNames}
          nicknames={infoNicknames}
          onNicknamesChange={setInfoNicknames}
          aliases={infoAliases}
          onAliasesChange={setInfoAliases}
          archetype={infoArchetype}
          onArchetypeChange={setInfoArchetype}
          personalityTropes={infoPersonalityTropes}
          onPersonalityTropesChange={setInfoPersonalityTropes}
          addressment={infoAddressment}
          onAddressmentChange={setInfoAddressment}
          hazardScore={infoHazardScore}
          onHazardScoreChange={setInfoHazardScore}
          currentAssociate={currentAssociate}
          // World & Association Hierarchy
          worldFiles={worldFiles}
          activeWorldFile={activeWorldFile}
          selectedWorldId={selectedWorldId}
          onWorldFileChange={handleWorldFileChange}
          selectedPath={selectedPath}
          flattenedNodes={flattenedNodes}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isSearchFocused={isSearchFocused}
          onSearchFocusedChange={setIsSearchFocused}
          collapsedPaths={collapsedPaths}
          onToggleCollapse={toggleCollapse}
          onSelectHeaderNode={handleSelectHeaderNode}
          onSelectSearchResult={handleSelectSearchResult}
          onClearSelection={handleClearSelection}
          associationResolution={associationResolution}
        />
      )}

      {/* MODE 2: PHYSICAL APPEARANCE DNA PROMPT */}
      {activeMode === 'dna' && (
        <div className="w-full flex flex-col gap-6">

        {/* 1. SECTION 1: Character Exclusive Prompt */}
        {collapsedMainSections.exclusive ? (
          /* Minimized Section 1 Bar */
          <div
            onClick={() => toggleMainSection('exclusive')}
            className="w-full min-h-[58px] p-4 sm:px-6 rounded-2xl bg-hazard-card border-2 border-hazard-border hover:border-hazard-cyan/60 hover:bg-hazard-card/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md group select-none font-mono"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl">🏷️</span>
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-sm md:text-base font-extrabold text-hazard-textBright uppercase tracking-wide">
                  Character Exclusive Prompt
                </span>
                <span className="text-xs text-hazard-cyan font-bold truncate max-w-[420px] opacity-85">
                  {exclusivePrompt ? `"${exclusivePrompt}"` : <span className="text-hazard-textMuted italic">(Empty)</span>}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-hazard-textMuted group-hover:text-hazard-cyan transition">
              <span className="text-xs hidden sm:inline font-bold">Expand</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          /* Expanded Section 1 Container */
          <div className="flex flex-col gap-3 p-6 rounded-3xl bg-hazard-card border-2 border-hazard-border shadow-lg">
            <div className="flex items-center justify-between gap-2 select-none pb-1">
              <div
                onClick={() => toggleMainSection('exclusive')}
                className="flex items-center gap-2.5 cursor-pointer hover:text-hazard-cyan transition group"
              >
                <span className="text-2xl">🏷️</span>
                <label className="text-base md:text-lg font-extrabold uppercase tracking-wider text-hazard-textBright group-hover:text-hazard-cyan transition font-mono cursor-pointer">
                  Character Exclusive Prompt
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleMainSection('exclusive')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hazard-void/80 hover:bg-hazard-cardHover border border-hazard-border hover:border-hazard-cyan/50 text-xs text-hazard-textMuted hover:text-hazard-cyan transition font-mono cursor-pointer"
                title="Collapse Section"
              >
                <span className="text-[11px] hidden sm:inline font-bold">Collapse</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {/* Dedicated Input Zone for Character Exclusive Prompt */}
            <div className="hazard-exclusive-zone relative rounded-2xl bg-[#121826] border-2 border-[#2e4168] hover:border-cyan-500/50 hover:bg-[#152033] focus-within:border-cyan-400 focus-within:bg-[#17243a] focus-within:ring-2 focus-within:ring-cyan-400/25 transition-all p-3.5 shadow-inner">
              <textarea
                rows={2}
                value={exclusivePrompt}
                onChange={(e) => setExclusivePrompt(e.target.value)}
                placeholder="Type character trigger keywords here (e.g. amelia watson, amelia watson (hololive))..."
                className="hazard-exclusive-textarea w-full text-base md:text-lg font-mono text-hazard-textBright placeholder-hazard-textMuted/50 cursor-text resize-y leading-relaxed bg-transparent border-0 outline-none"
              />
            </div>
          </div>
        )}

        
        {/* 3. SECTION 3: Physical Appearance DNA (Clean Selector Boxes) */}
        {collapsedMainSections.physical ? (
          /* Minimized Section 3 Bar */
          <div
            onClick={() => toggleMainSection('physical')}
            className="w-full min-h-[58px] p-4 sm:px-6 rounded-2xl bg-hazard-card border-2 border-hazard-border hover:border-hazard-cyan/60 hover:bg-hazard-card/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md group select-none font-mono"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl">🧬</span>
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-sm md:text-base font-extrabold text-hazard-textBright uppercase tracking-wide">
                  Physical Appearance DNA
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-hazard-void border border-hazard-border text-hazard-cyan text-xs font-bold shrink-0">
                  {physicalTokens.length} tags
                </span>
                {physicalPrompt && (
                  <span className="text-xs text-hazard-gold font-bold truncate max-w-[340px]">
                    {physicalPrompt}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-hazard-textMuted group-hover:text-hazard-cyan transition">
              <span className="text-xs hidden sm:inline font-bold">Expand</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          /* Expanded Section 3 Container */
          <div className="flex flex-col gap-6 p-6 rounded-3xl bg-hazard-card border-2 border-hazard-border shadow-lg">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hazard-border/80">
              <div
                onClick={() => toggleMainSection('physical')}
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <span className="text-2xl">🧬</span>
                <div>
                  <h3 className="text-base md:text-lg font-extrabold uppercase tracking-wider text-hazard-textBright group-hover:text-hazard-cyan transition font-mono">
                    Physical Appearance DNA
                  </h3>
                  <p className="text-xs text-hazard-textMuted font-mono">
                    Modular multi-select boxes for eyes, hair styles, and body anatomy.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Quick Summary Pill */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-hazard-textMuted">Selected:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-hazard-void border border-hazard-border text-hazard-cyan font-bold">
                    {physicalTokens.length} tags
                  </span>
                </div>

                {/* Dedicated Collapse Button */}
                <button
                  type="button"
                  onClick={() => toggleMainSection('physical')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hazard-void/80 hover:bg-hazard-cardHover border border-hazard-border hover:border-hazard-cyan/50 text-xs text-hazard-textMuted hover:text-hazard-cyan transition font-mono cursor-pointer"
                  title="Collapse Section"
                >
                  <span className="text-[11px] hidden sm:inline font-bold">Collapse</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Physical Appearance Markdown Sections */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col gap-6 font-mono cursor-default"
            >
              {/* # 1. Eyes Section */}
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-hazard-void/60 border border-hazard-cyan/30">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhysicalSection('eyes');
                  }}
                  className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-hazard-border/60 group"
                >
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-1 rounded-md text-hazard-cyan hover:bg-black/30 transition">
                      {collapsedPhysicalSections.eyes ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-base md:text-lg font-black text-hazard-cyan"># Eyes</span>
                  </div>
                  <span className="text-xs text-hazard-textMuted group-hover:text-hazard-cyan transition">
                    {collapsedPhysicalSections.eyes ? 'Expand' : 'Collapse'}
                  </span>
                </div>

                {!collapsedPhysicalSections.eyes && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pl-2 pt-1">
                    {/* Eyes Shape */}
                    <PhysicalSelectorBox
                      label="Eyes Shape"
                      prefix="##"
                      options={physicalTopology.eyes?.eyes_shape || []}
                      selected={physicalSelections.eyes_shape}
                      onChange={(val) => updatePhysicalSelection('eyes_shape', val)}
                      colorTheme="cyan"
                      placeholder="Select eye shape(s)..."
                    />

                    {/* Eyes Special */}
                    <PhysicalSelectorBox
                      label="Eyes Special"
                      prefix="##"
                      options={physicalTopology.eyes?.eyes_special || []}
                      selected={physicalSelections.eyes_special}
                      onChange={(val) => updatePhysicalSelection('eyes_special', val)}
                      colorTheme="cyan"
                      placeholder="Select special eye traits (heterochromia, glowing, etc.)..."
                    />

                    {/* Eyes Color (max 2) */}
                    <PhysicalSelectorBox
                      label="Eyes Color"
                      prefix="##"
                      options={physicalTopology.eyes?.eyes_color || []}
                      selected={physicalSelections.eyes_color}
                      onChange={(val) => updatePhysicalSelection('eyes_color', val)}
                      max={2}
                      colorTheme="cyan"
                      placeholder="Select eye color(s) (max 2)..."
                    />
                  </div>
                )}
              </div>

              {/* # 2. Hair Section */}
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-hazard-void/60 border border-hazard-gold/30">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhysicalSection('hair');
                  }}
                  className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-hazard-border/60 group"
                >
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-1 rounded-md text-hazard-gold hover:bg-black/30 transition">
                      {collapsedPhysicalSections.hair ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-base md:text-lg font-black text-hazard-gold"># Hair</span>
                  </div>
                  <span className="text-xs text-hazard-textMuted group-hover:text-hazard-gold transition">
                    {collapsedPhysicalSections.hair ? 'Expand' : 'Collapse'}
                  </span>
                </div>

                {!collapsedPhysicalSections.hair && (
                  <div className="flex flex-col gap-6 pl-2 pt-1">
                    {/* Core Hair Properties Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Hair Length */}
                      <PhysicalSelectorBox
                        label="Hair Length"
                        prefix="##"
                        options={physicalTopology.hair?.hair_length || []}
                        selected={physicalSelections.hair_length}
                        onChange={(val) => updatePhysicalSelection('hair_length', val)}
                        colorTheme="gold"
                        isSingleSelect={true}
                        placeholder="Select hair length..."
                      />

                      {/* Special Color */}
                      <PhysicalSelectorBox
                        label="Special Color"
                        prefix="##"
                        options={physicalTopology.hair?.hair_special_color || []}
                        selected={physicalSelections.hair_special_color}
                        onChange={(val) => updatePhysicalSelection('hair_special_color', val)}
                        colorTheme="gold"
                        placeholder="Select gradient / inner / tips..."
                      />

                      {/* Hair Color (max 4) */}
                      <PhysicalSelectorBox
                        label="Hair Color"
                        prefix="##"
                        options={physicalTopology.hair?.hair_color || []}
                        selected={physicalSelections.hair_color}
                        onChange={(val) => updatePhysicalSelection('hair_color', val)}
                        max={4}
                        colorTheme="gold"
                        placeholder="Select hair color(s) (max 4)..."
                      />
                    </div>

                    {/* Hair Styles Section */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-hazard-border/60">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-hazard-gold/90">
                        Hair Styles (Multi-Select)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Bangs */}
                        <PhysicalSelectorBox
                          label="Bangs"
                          prefix="###"
                          options={physicalTopology.hair?.hair_style?.bangs || []}
                          selected={physicalSelections.hair_bangs}
                          onChange={(val) => updatePhysicalSelection('hair_bangs', val)}
                          colorTheme="gold"
                          placeholder="Select bangs..."
                        />

                        {/* Sides */}
                        <PhysicalSelectorBox
                          label="Sides"
                          prefix="###"
                          options={physicalTopology.hair?.hair_style?.sides || []}
                          selected={physicalSelections.hair_sides}
                          onChange={(val) => updatePhysicalSelection('hair_sides', val)}
                          colorTheme="gold"
                          placeholder="Select sides (twintails, sidelocks)..."
                        />

                        {/* Back */}
                        <PhysicalSelectorBox
                          label="Back"
                          prefix="###"
                          options={physicalTopology.hair?.hair_style?.back || []}
                          selected={physicalSelections.hair_back}
                          onChange={(val) => updatePhysicalSelection('hair_back', val)}
                          colorTheme="gold"
                          placeholder="Select back (ponytail, braid, bun)..."
                        />

                        {/* Special */}
                        <PhysicalSelectorBox
                          label="Special"
                          prefix="###"
                          options={physicalTopology.hair?.hair_style?.special || []}
                          selected={physicalSelections.hair_special}
                          onChange={(val) => updatePhysicalSelection('hair_special', val)}
                          colorTheme="gold"
                          placeholder="Select special (ahoge, wavy)..."
                        />
                      </div>
                    </div>

                    {/* Hair Accessories */}
                    <div className="pt-4 border-t border-hazard-border/60">
                      <PhysicalSelectorBox
                        label="Hair Accessories"
                        prefix="##"
                        options={physicalTopology.hair?.hair_accessories || []}
                        selected={physicalSelections.hair_accessories}
                        onChange={(val) => updatePhysicalSelection('hair_accessories', val)}
                        colorTheme="gold"
                        placeholder="Select hair accessories (ribbon, hairclip, bow)..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* # 3. Body Type Section */}
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-hazard-void/60 border border-hazard-purple/30">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhysicalSection('body');
                  }}
                  className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-hazard-border/60 group"
                >
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-1 rounded-md text-hazard-purple hover:bg-black/30 transition">
                      {collapsedPhysicalSections.body ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-base md:text-lg font-black text-hazard-purple"># Body Type</span>
                  </div>
                  <span className="text-xs text-hazard-textMuted group-hover:text-hazard-purple transition">
                    {collapsedPhysicalSections.body ? 'Expand' : 'Collapse'}
                  </span>
                </div>

                {!collapsedPhysicalSections.body && (
                  <div className="flex flex-col gap-5 pl-2 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Breast Size */}
                      <PhysicalSelectorBox
                        label="Breast Size"
                        prefix="##"
                        options={physicalTopology.body_type?.breast_size || []}
                        selected={physicalSelections.breast_size}
                        onChange={(val) => updatePhysicalSelection('breast_size', val)}
                        colorTheme="purple"
                        isSingleSelect={true}
                        placeholder="Select breast size..."
                      />

                      {/* Height & Physique */}
                      <PhysicalSelectorBox
                        label="Height & Physique"
                        prefix="##"
                        options={physicalTopology.body_type?.height_and_physique || []}
                        selected={physicalSelections.height_and_physique}
                        onChange={(val) => updatePhysicalSelection('height_and_physique', val)}
                        colorTheme="purple"
                        placeholder="Select height, build, and skin tone..."
                      />
                    </div>

                    {/* Features & Anatomy */}
                    <div className="pt-2 border-t border-hazard-border/60">
                      <PhysicalSelectorBox
                        label="Features & Anatomy"
                        prefix="##"
                        options={physicalTopology.body_type?.features_and_anatomy || []}
                        selected={physicalSelections.features_and_anatomy}
                        onChange={(val) => updatePhysicalSelection('features_and_anatomy', val)}
                        colorTheme="purple"
                        placeholder="Select features (mole, horns, animal ears, wings, halo, fangs)..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Physical Prompts Summary Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl bg-hazard-void border border-hazard-border font-mono text-xs md:text-sm cursor-default"
            >
              <span className="text-hazard-textMuted font-bold uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5">
                <span>🧬</span>
                <span>Physical Appearance Prompts:</span>
              </span>
              <span className="text-hazard-gold font-bold break-words select-all">
                {physicalPrompt ? (
                  `"${physicalPrompt}"`
                ) : (
                  <span className="text-hazard-textMuted/40 italic">None selected</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* 4. SECTION 4: Final Compiled Prompt - Full Content Display */}
        {collapsedMainSections.finalPrompt ? (
          /* Minimized Section 4 Bar */
          <div
            onClick={() => toggleMainSection('finalPrompt')}
            className="w-full min-h-[58px] p-4 sm:px-6 rounded-2xl bg-hazard-card border-2 border-hazard-border hover:border-hazard-gold/60 hover:bg-hazard-card/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md group select-none font-mono"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl">⚡</span>
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-sm md:text-base font-extrabold text-hazard-gold uppercase tracking-wide">
                  Final Compiled Prompt
                </span>
                <span className="text-xs text-hazard-textBright/80 truncate max-w-[380px]">
                  {compiledPrompt ? `"${compiledPrompt.slice(0, 70)}..."` : <span className="text-hazard-textMuted italic">(No prompt)</span>}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                disabled={!compiledPrompt}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  copied
                    ? 'bg-hazard-gold text-black'
                    : 'bg-hazard-void hover:bg-hazard-cardHover text-hazard-textBright border border-hazard-border hover:border-hazard-gold'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <ChevronRight className="w-5 h-5 text-hazard-textMuted group-hover:text-hazard-gold group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          /* Expanded Section 4 Container */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-hazard-card border-2 border-hazard-border shadow-lg">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  onClick={() => toggleMainSection('finalPrompt')}
                  className="text-xs md:text-sm font-extrabold font-mono text-hazard-gold uppercase tracking-wider flex items-center gap-1.5 select-none cursor-pointer group"
                >
                  <span>⚡</span>
                  <span className="group-hover:underline">Final Compiled Prompt</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleMainSection('finalPrompt')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-hazard-void border border-hazard-border hover:border-hazard-gold/50 text-xs text-hazard-textMuted hover:text-hazard-gold transition font-mono cursor-pointer"
                  title="Collapse Section"
                >
                  <span className="text-[11px] hidden sm:inline">Collapse</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-hazard-void border border-hazard-border/80 font-mono text-sm text-hazard-textBright break-words leading-relaxed select-all">
                {compiledPrompt || (
                  <span className="text-hazard-textMuted/40 italic">
                    No prompt generated.
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              disabled={!compiledPrompt}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold font-mono transition shrink-0 self-stretch md:self-center justify-center shadow-md cursor-pointer ${
                copied
                  ? 'bg-hazard-gold text-black shadow-hazard-glow scale-[1.02]'
                  : 'bg-hazard-void hover:bg-hazard-cardHover text-hazard-textBright border-2 border-hazard-border hover:border-hazard-gold hover:text-hazard-gold'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Prompt</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      )}

      {/* MODE 3: SKIN (ATTIRE & WARDROBE) */}
      {activeMode === 'skin' && (
        <CharacterSkinMode
          app={app}
          characterId={selectedCharFile?.id || (currentVariantDef as any)?.id || 'UNNAMED'}
          activeVariantKey={activeVariantKey}
          outfitPrompt={outfitPrompt}
          onOutfitPromptChange={setOutfitPrompt}
          layerToggles={layerToggles}
          onToggleLayer={handleToggleLayer}
          onResetLayers={handleResetLayers}
          skinPresets={skinPresets}
          isLoadingSkins={isLoadingSkins}
          onRefreshPresets={loadSkinPresets}
        />
      )}

      {/* FLOATING ACTION BUTTON (FAB) TO OPEN CHARACTER DRAWER */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        title="Open Character & Variant Drawer"
        className="fixed bottom-20 right-6 z-30 px-4 py-3 rounded-2xl bg-gradient-to-r from-hazard-gold to-hazard-goldGlow text-black font-extrabold shadow-hazard-glow border border-hazard-gold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
      >
        <Folder className="w-4 h-4" />
        <span className="text-xs font-mono tracking-wider uppercase">Characters</span>
      </button>

      {/* HIGH Z-INDEX FLOATING OVERLAY DRAWER (z-50) WITH SMOOTH KINETIC TRANSITIONS */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-all duration-300 ${
          isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop Click Dismiss (z-40) with Smooth Opacity Fade */}
        <div
          className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-out cursor-pointer ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Drawer Container (z-50) with Smooth Transform Slide */}
        <aside
          className={`relative w-full max-w-[540px] bg-hazard-card border-l-2 border-hazard-border shadow-2xl flex flex-col h-full z-50 font-mono transform transition-transform duration-300 ease-out ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header with Generous Padding */}
          <div className="p-6 border-b border-hazard-border flex items-center justify-between gap-4 bg-hazard-void/80 shrink-0 min-h-[64px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold shrink-0">
                <Folder className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black uppercase tracking-wider text-hazard-textBright truncate">
                  Character Library
                </h3>
                <p className="text-xs text-hazard-textMuted font-mono truncate">
                  {filteredCharacterFiles.length} of {characterFiles.length} files
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedCharFile && (
                <button
                  type="button"
                  onClick={handleSaveCharacter}
                  disabled={saveStatus === 'saving'}
                  title="Save Changes to File"
                  className="p-3 rounded-xl text-hazard-gold hover:bg-hazard-gold/15 border border-hazard-gold/30 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Save className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={refreshCharacterList}
                title="Reload Files from Vault"
                className="p-3 rounded-xl text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-card border border-hazard-border transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingCharacters ? 'animate-spin text-hazard-gold' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Close Drawer"
                className="p-3 rounded-xl text-hazard-textMuted hover:text-white hover:bg-hazard-card border border-hazard-border transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            {/* SECTION 1: MONOLITHIC SEARCH BAR (Full-Height 52px Hitbox) */}
            <div
              onClick={() => {
                const input = document.getElementById('char-sidebar-search-input');
                input?.focus();
              }}
              className="relative flex items-center bg-hazard-void border-2 border-hazard-border focus-within:border-hazard-gold focus-within:ring-4 focus-within:ring-hazard-gold/15 rounded-2xl transition cursor-text h-[52px] px-5 shadow-sm"
            >
              <Search className="w-5 h-5 text-hazard-gold shrink-0 mr-4 pointer-events-none" />
              <input
                id="char-sidebar-search-input"
                type="text"
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                placeholder="Search character ID, name, or batch..."
                className="w-full h-full bg-transparent text-sm text-hazard-textBright placeholder-hazard-textMuted/50 focus:outline-none font-mono"
              />
              {characterSearch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCharacterSearch('');
                  }}
                  className="p-2 rounded-lg text-hazard-textMuted hover:text-white hover:bg-white/10 shrink-0 cursor-pointer ml-2 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* SECTION 2: BATCH FILTER (Optional if multiple batches) */}
            {availableBatches.length > 1 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-hazard-textMuted">Filter by Batch</span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-hazard-void border-2 border-hazard-border focus:border-hazard-gold focus:ring-2 focus:ring-hazard-gold/10 text-sm font-bold text-hazard-textBright focus:outline-none transition cursor-pointer font-mono"
                >
                  {availableBatches.map((b) => (
                    <option key={b} value={b} className="bg-hazard-card text-hazard-textBright font-mono">
                      {b === 'ALL' ? 'All Batches' : b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SECTION 3: CHARACTER TREELIST (Full-Surface Hitbox) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-hazard-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-hazard-textBright">
                    Characters ({filteredCharacterFiles.length})
                  </span>
                </div>
              </div>

              {/* TreeView List (Generous 48px+ per row) */}
              <div className="border border-hazard-border rounded-2xl overflow-hidden bg-hazard-void/60 shadow-sm max-h-[400px] overflow-y-auto">
                {filteredCharacterFiles.length === 0 ? (
                  <div className="py-12 px-6 text-center text-hazard-textMuted/60 italic font-mono text-xs">
                    No characters found
                  </div>
                ) : (
                  <div className="divide-y divide-hazard-border/50">
                    {filteredCharacterFiles.map((cf) => {
                      const isSelected = selectedCharFile?.relPath === cf.relPath;
                      return (
                        <button
                          key={cf.relPath}
                          type="button"
                          onClick={() => handleSelectCharacterFile(cf)}
                          className={`w-full min-h-[48px] px-6 py-3 flex items-center justify-between gap-4 text-left transition-all group ${
                            isSelected
                              ? 'bg-hazard-gold/15 text-hazard-gold font-bold'
                              : 'hover:bg-hazard-card/60 text-hazard-textBright'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <User className={`w-5 h-5 shrink-0 ${isSelected ? 'text-hazard-gold' : 'text-hazard-textMuted'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold truncate">{cf.id}</div>
                              {cf.batchDir && (
                                <div className="text-xs text-hazard-textMuted truncate">
                                  {cf.batchDir}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-hazard-gold text-black shadow-sm shrink-0">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: VARIANT MANAGER (Full-Surface Rows) */}
            {selectedCharFile && activeCharStructure && (
              <div className="flex flex-col gap-3 pt-6 border-t border-hazard-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-hazard-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider text-hazard-textBright">
                      Variants ({activeVariantsList.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateVariant}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-hazard-gold/15 text-hazard-gold hover:bg-hazard-gold hover:text-black border border-hazard-gold/40 transition cursor-pointer min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New</span>
                  </button>
                </div>

                {/* Variant List (Full-Surface Hitbox) */}
                <div className="border border-hazard-border rounded-2xl overflow-hidden bg-hazard-void/60 shadow-sm">
                  <div className="divide-y divide-hazard-border/50">
                    {activeVariantsList.map((vKey) => {
                      const isCurrent = activeVariantKey === vKey;
                      const vDef = vKey === 'default' ? activeCharStructure.default : activeCharStructure[vKey];
                      const displayName = CharacterManager.getVariantDisplayName(vDef, vKey);

                      return (
                        <div
                          key={vKey}
                          className={`min-h-[48px] px-6 py-3 flex items-center gap-3 transition-all group ${
                            isCurrent
                              ? 'bg-hazard-gold/15'
                              : 'hover:bg-hazard-card/60'
                          }`}
                        >
                          {/* Variant Key Badge */}
                          <span
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border shrink-0 ${
                              vKey === 'default'
                                ? 'bg-hazard-cyan/15 border-hazard-cyan/40 text-hazard-cyan'
                                : 'bg-hazard-card border-hazard-border text-hazard-textMuted group-hover:text-hazard-textBright'
                            }`}
                          >
                            {vKey}
                          </span>

                          {/* Variant Name Editor (Full-Height Notion Input) */}
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => handleRenameSpecificVariant(vKey, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Variant name..."
                            className="flex-1 h-10 min-h-[40px] notion-input bg-transparent hover:bg-hazard-void/60 focus:bg-hazard-void border border-transparent hover:border-hazard-border/60 focus:border-hazard-gold focus:ring-2 focus:ring-hazard-gold/20 rounded-xl px-4 text-sm text-hazard-textBright focus:outline-none transition-all font-mono"
                          />

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleSwitchVariant(vKey)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-hazard-void border border-hazard-border hover:border-hazard-gold text-hazard-textMuted hover:text-hazard-gold transition cursor-pointer min-h-[40px]"
                              >
                                Select
                              </button>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-black uppercase px-3 py-2 rounded-lg bg-hazard-gold text-black shadow-sm">
                                Active
                              </span>
                            )}
                            {vKey !== 'default' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSpecificVariant(vKey)}
                                title="Delete Variant"
                                className="p-2 rounded-lg text-hazard-textMuted hover:text-hazard-crimson hover:bg-hazard-crimson/15 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
