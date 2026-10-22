import React, { useMemo, useState } from 'react';
import { rutGonTime } from '../../../core/rutGonTime';
import { EvoAvatar } from '../../molecule/EvoAvatar/EvoAvatar';

interface AllDinosTabProps {
    objects: any[];
    lookup: any;
    userProgress: any;
    onSelectDino: (uuid: string) => void;
}

export const AllDinosTab: React.FC<AllDinosTabProps> = ({
    objects,
    lookup,
    userProgress,
    onSelectDino
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClasses, setFilterClasses] = useState<string[]>([]);
    const [filterRarities, setFilterRarities] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('ferocity');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const getImage = (category: string, key: string, fallback: string) => {
        return lookup?.[category]?.[key] ?? fallback;
    };

    const uniqueClasses = useMemo(() => Array.from(new Set(objects.map(o => (o.class || '').toLowerCase()))).filter(Boolean), [objects]);
    const uniqueRarities = useMemo(() => Array.from(new Set(objects.map(o => (o.rarity || '').toLowerCase()))).filter(Boolean), [objects]);

    const toggleFilter = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    const listData = useMemo(() => {
        if (!objects || !Array.isArray(objects)) return [];

        let mapped = objects.map(item => {
            const uuid = item.uuid || item.id || item.name;
            const userDino = userProgress?.owned_dinos?.[uuid];

            const number = userDino ? (Number(userDino.number) || 0) : 0;
            const rank = userDino ? (Number(userDino.rank) || 0) : 0;
            const isUnlocked = number > 0;

            const evolutions = item.evolutions || [];
            const maxIndex = Math.max(0, evolutions.length - 1);
            const targetRank = Math.max(1, rank);
            let evoIndex = targetRank - 1;
            if (evoIndex > maxIndex) evoIndex = maxIndex;

            const currentEvo = evolutions[evoIndex] || {};

            const damage = currentEvo.damage || 0;
            const health = currentEvo.health || 0;
            const ferocity = damage + (health / 3.2);
            const hatchTime = Number(item.hatch_time_mins) || 0;

            const sellPrice = (Number(item.sell_price_dna) || 0) * 2;
            const efficiency = (sellPrice > 0 && hatchTime > 0) ? (ferocity / (sellPrice * hatchTime)) : 0;
            const releaseTime = new Date(item.release_date || "1970-01-01").getTime();

            const maximumNumber = Number(item.maximum_number || Math.pow(2, Math.max(0, evolutions.length - 1)));

            return {
                uuid, isUnlocked, number, rank, maximumNumber, ferocity, damage, health, hatchTime, sellPrice, efficiency, releaseTime,
                evoImg: currentEvo.image_url || "",
                rarity: (item.rarity || "").toLowerCase(),
                class: (item.class || "").toLowerCase(),
                name: item.name || "",
                image_url: item.image_url || "",
                hybrid_type: item.hybrid_type || "",
                region: item.region || "",
                facts: item.facts || [],
                ingredients: item.ingredients || [],
                evolutions: item.evolutions || []
            };
        });

        // Filter by search
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            mapped = mapped.filter(d =>
                d.name.toLowerCase().includes(term) ||
                d.class.includes(term) ||
                d.rarity.includes(term) ||
                d.hybrid_type.includes(term) ||
                d.region.includes(term)
            );
        }

        // Filter by class
        if (filterClasses.length > 0) {
            mapped = mapped.filter(d => filterClasses.includes(d.class));
        }
        // Filter by rarity
        if (filterRarities.length > 0) {
            mapped = mapped.filter(d => filterRarities.includes(d.rarity));
        }

        // Sort
        mapped.sort((a, b) => {
            if (a.isUnlocked && !b.isUnlocked) return -1;
            if (!a.isUnlocked && b.isUnlocked) return 1;

            const valA = (a as any)[sortBy] || 0;
            const valB = (b as any)[sortBy] || 0;
            const modifier = sortOrder === 'asc' ? 1 : -1;

            if (valA !== valB) {
                return (valA - valB) * modifier;
            }

            return b.releaseTime - a.releaseTime;
        });

        return mapped;
    }, [objects, userProgress, searchTerm, filterClasses, filterRarities, sortBy, sortOrder]);

    const getStatDisplayInfo = (data: any) => {
        switch (sortBy) {
            case 'damage':
                return {
                    valueStr: Math.round(data.damage).toLocaleString(),
                    icon: getImage("stats", "damage", "https://cdn.paleo.gg/games/jwtg/images/stats/damage.png"),
                    color: "#e74c3c"
                };
            case 'health':
                return {
                    valueStr: Math.round(data.health).toLocaleString(),
                    icon: getImage("stats", "health", "https://cdn.paleo.gg/games/jwtg/images/stats/health.png"),
                    color: "#2ecc71"
                };
            case 'hatchTime':
                return {
                    valueStr: rutGonTime(data.hatchTime, 'minutes'),
                    icon: getImage("stats", "time", "⏳"),
                    color: "#3498db"
                };
            case 'sellPrice':
                return {
                    valueStr: Math.round(data.sellPrice).toLocaleString(),
                    icon: getImage("stats", "dna", "🧬"),
                    color: "#9b59b6"
                };
            case 'efficiency':
                return {
                    valueStr: data.efficiency.toFixed(4),
                    icon: getImage("stats", "efficiency", "📈"),
                    color: "#00e5ff"
                };
            case 'ferocity':
            default:
                return {
                    valueStr: Math.round(data.ferocity).toLocaleString(),
                    icon: getImage("stats", "ferocity", "https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png"),
                    color: "#ffd700"
                };
        }
    };

    return (
        <div className="w-full space-y-6">
            <h3 className="text-base font-cinzel font-bold text-white uppercase tracking-wider">
                All Dinosaurs Specimen Catalog
            </h3>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 uppercase min-w-[50px]">Search:</span>
                    <input
                        type="text"
                        placeholder="Search by name, class, rarity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/60 text-white border border-white/15 px-3 py-1.5 rounded-lg text-xs outline-none min-w-[200px]"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 uppercase min-w-[50px]">Class:</span>
                    {uniqueClasses.map(cls => (
                        <button
                            key={cls}
                            type="button"
                            onClick={() => toggleFilter(cls, filterClasses, setFilterClasses)}
                            className={`px-3 py-1 text-xs rounded-full font-bold capitalize transition border cursor-pointer ${
                                filterClasses.includes(cls)
                                    ? 'bg-emerald-600 border-emerald-400 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {cls}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 uppercase min-w-[50px]">Rarity:</span>
                    {uniqueRarities.map(rarity => (
                        <button
                            key={rarity}
                            type="button"
                            onClick={() => toggleFilter(rarity, filterRarities, setFilterRarities)}
                            className={`px-3 py-1 text-xs rounded-full font-bold capitalize transition border cursor-pointer ${
                                filterRarities.includes(rarity)
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {rarity}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/10 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 uppercase min-w-[50px]">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-black/60 text-white border border-white/15 px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                    >
                        <option value="ferocity">Ferocity</option>
                        <option value="damage">Damage</option>
                        <option value="health">Health</option>
                        <option value="hatchTime">Hatching Time</option>
                        <option value="sellPrice">Sell Price (DNA)</option>
                        <option value="efficiency">Efficiency Index (Fero / Price×Time)</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-500 text-white text-xs font-bold cursor-pointer"
                    >
                        {sortOrder === 'desc' ? '⬇ GIẢM DẦN' : '⬆ TĂNG DẦN'}
                    </button>
                </div>
            </div>

            {/* Grid of Dino Avatars */}
            <div className="flex flex-wrap gap-4 justify-start items-start">
                {listData.map(data => {
                    const frameUrl = getImage("portrait_frames", data.rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${data.rarity}.png`);
                    const statInfo = getStatDisplayInfo(data);

                    return (
                        <div
                            key={data.uuid}
                            className="flex flex-col items-center"
                        >
                            <div
                                onClick={() => onSelectDino(data.uuid)}
                                className={`flex flex-col items-center bg-[#111] p-2 rounded-xl border transition hover:scale-105 cursor-pointer select-none ${
                                    data.isUnlocked ? 'border-amber-400 shadow-[0_0_12px_rgba(255,215,0,0.2)]' : 'border-white/15 opacity-70'
                                }`}
                                title={`Click to inspect ${data.name}`}
                            >
                                <EvoAvatar
                                    size={60}
                                    imageUrl={data.evoImg}
                                    frameUrl={frameUrl}
                                    isUnlocked={data.isUnlocked}
                                />
                                {data.isUnlocked && (
                                    <div className="mt-1 text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold text-gray-200">
                                        LV{data.rank > 0 ? data.rank * 10 : 10} ({data.number}/{data.maximumNumber})
                                    </div>
                                )}
                            </div>

                            {data.isUnlocked ? (
                                <div className="flex items-center gap-1 text-xs font-bold mt-1.5" style={{ color: statInfo.color }}>
                                    {statInfo.icon.startsWith('http') ? (
                                        <img src={statInfo.icon} width="13" height="13" className="object-contain" alt={sortBy} />
                                    ) : (
                                        <span className="text-xs">{statInfo.icon}</span>
                                    )}
                                    <span>{statInfo.valueStr}</span>
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-500 mt-1">Locked</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
