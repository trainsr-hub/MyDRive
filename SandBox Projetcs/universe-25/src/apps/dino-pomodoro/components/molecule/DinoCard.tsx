// path: src/apps/dino-pomodoro/components/molecule/DinoCard.tsx
// Authentic JWTG / Arc Jurassic Dinosaur Card with hexagonal backdrop, vertical rarity tab, and diagonal NOT OWNED stamp
// Delegates directly to the authentic DinoCard component from Arc Jurassic

import React from 'react';
import { DinoCard as AuthenticDinoCard } from '../../../arc-jurassic/components/molecule/DinoCard/DinoCard';
import lookupRawData from '../../../arc-jurassic/data/lookup.json';

export interface DinoCardProps {
  dino: any;
  isUnlocked: boolean;
  scale?: number;
  className?: string;
  onClick?: () => void;
}

export const DinoCard: React.FC<DinoCardProps> = ({
  dino,
  isUnlocked,
  scale = 1,
  className = '',
  onClick,
}) => {
  if (!dino) return null;

  const dinoName = dino.name || '';
  const rawRarity = (dino.rarity || 'common').toLowerCase();
  const rarityMap: Record<string, string> = {
    tournament: 'legendary',
    vip: 'legendary',
    star: 'legendary',
    toy: 'legendary',
    'super-star': 'legendary',
  };
  const displayRarity = (rarityMap[rawRarity] || rawRarity).toUpperCase();

  const hybridType = (dino.hybrid_type || 'non-hybrid').toLowerCase();
  const dinoRarity = (dino.rarity || 'common').toLowerCase();
  const bgKey = `${hybridType}_${dinoRarity}`;

  const cardBgUrl =
    (lookupRawData.card_backgrounds as Record<string, string>)[bgKey] ||
    (lookupRawData.card_backgrounds as Record<string, string>)[`non-hybrid_${dinoRarity}`] ||
    `https://cdn.paleo.gg/games/jwtg/images/card-bg/${hybridType}/${dinoRarity}.png`;

  const dinoClass = (dino.class || 'carnivore').toLowerCase();
  const classIconUrl =
    (lookupRawData.class_icons as Record<string, string>)[dinoClass] ||
    `https://cdn.paleo.gg/games/jwtg/images/class/${dinoClass}.png`;

  // Always use the full creature artwork image_url from the original tab
  const imageUrl = dino.image_url || '';

  const baseW = 250;
  const baseH = 389;

  return (
    <div
      onClick={onClick}
      className={`inline-block select-none relative ${className}`}
      style={{
        width: `${baseW * scale}px`,
        height: `${baseH * scale}px`,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${baseW}px`,
          height: `${baseH}px`,
        }}
      >
        <AuthenticDinoCard
          dinoName={dinoName}
          imageUrl={imageUrl}
          cardBgUrl={cardBgUrl}
          classIconUrl={classIconUrl}
          displayRarity={displayRarity}
          isUnlocked={isUnlocked}
        />
      </div>
    </div>
  );
};
