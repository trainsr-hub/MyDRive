// path: src/apps/golden-hour/components/gacha/GachaLobby.tsx

import React, { useState, useEffect } from 'react';
import type { RawDeckPack } from '../../packs';
import { Sparkles, Ticket, Scissors } from 'lucide-react';
import './gachaStyles.css';

interface GachaLobbyProps {
  cardpacks: RawDeckPack[];
  totalDict: Record<string, number>;
  totalPackOpened: number;
  ticketBalances: Record<string, number>;
  onRoll: (deck: RawDeckPack, useUniversalShredderTicket?: boolean) => void;
}

export const GachaLobby: React.FC<GachaLobbyProps> = ({
  cardpacks,
  totalDict,
  totalPackOpened,
  ticketBalances,
  onRoll,
}) => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveringEffect, setHoveringEffect] = useState<number | string>('none');

  // Handle card click toggle
  const handleCardClick = (index: number) => {
    setActiveCard((prev) => (prev === index ? null : index));
    setHoveringEffect((prev) => (prev === index ? 'none' : index));
  };

  // Click outside listener to deselect active card
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.card')) {
        setActiveCard(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full space-y-6">
      {/* 📊 Top-Right Real-Time Hover HUD Telemetry */}
      {hoveredCard !== null && (
        <div className="total-dict">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-mono text-[#ffd86b]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <strong>Unboxed Archives</strong>
            </span>
            <span className="text-[10px] text-[#9c93a8]">Lifetime Pulls</span>
          </div>

          <div className="total-dict-list">
            {Object.entries(totalDict).length === 0 && (
              <div className="text-xs text-[#8c7a9e] py-2 text-center font-mono">No items pulled yet</div>
            )}
            {Object.entries(totalDict)
              .sort(([, a], [, b]) => b - a)
              .map(([key, value]) => (
                <div key={key} className="total-dict-item">
                  <strong title={key}>{key}:</strong>
                  <span className="font-bold text-white bg-[#1c1424] px-1.5 py-0.5 rounded border border-[#3b304f]">
                    {value}
                  </span>
                </div>
              ))}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-[#8c7a9e]">Packs Opened:</span>
            <strong className="text-[#38bdf8] text-sm">{totalPackOpened}</strong>
          </div>
        </div>
      )}

      {/* 🃏 Card Packs Grid Container (Centered) */}
      <div className="cards-container">
        {cardpacks.map((card, index) => {
          const isSelected = activeCard === index;
          const isHovered = hoveredCard === index;
          const availableTickets = ticketBalances[card.cost.currency] || 0;
          const shredderBalance = ticketBalances['shredder-ticket'] || 0;
          const isShredderPack = card.cost.currency === 'shredder-ticket';
          const canAffordStandard = availableTickets >= card.cost.amount;
          const canAffordShredder = shredderBalance >= 1;
          const buttonLabel = card.visuals.button_text || 'Engage';

          // Image asset swap on hover or active selection
          const imageSrc =
            isHovered || isSelected || hoveringEffect === index
              ? card.visuals.preview_url || card.visuals.cover_url
              : card.visuals.cover_url;

          return (
            <div
              className={`card ${isSelected ? 'active' : ''}`}
              key={card.id || index}
              onClick={() => handleCardClick(index)}
              onMouseEnter={() => {
                setHoveredCard(index);
                setHoveringEffect(activeCard === index ? index : index);
              }}
              onMouseLeave={() => {
                setHoveredCard(null);
                setHoveringEffect('none');
              }}
            >
              {/* Pack Image Container */}
              <div className="card-img-wrapper">
                <img
                  src={imageSrc}
                  alt={card.title}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Cards Per Pack Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#120f18]/85 border border-[#d4af37]/60 text-[11px] font-mono font-bold text-[#ffd86b] shadow-lg backdrop-blur-md">
                  {card.cards_per_pull} Cards
                </div>

                {/* Ticket / Disc Cost Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#120f18]/85 border border-white/20 text-[11px] font-mono text-white flex items-center gap-1 shadow-lg backdrop-blur-md">
                  <Ticket className="w-3 h-3 text-[#ffd86b]" />
                  <span>{card.cost.amount} {card.cost.currency === 'discs' ? 'DISCS' : card.cost.currency.split('-')[0].toUpperCase()}</span>
                </div>

                {/* Universal Shredder Substitute Badge on Pack */}
                {!isShredderPack && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1 backdrop-blur-md shadow-md">
                    <Scissors className="w-2.5 h-2.5 text-amber-400" />
                    <span>or 1x A8 Pass</span>
                  </div>
                )}
              </div>

              {/* Pack Body (Centered Horizontally) */}
              <div className="card-body">
                <div className="w-full text-center">
                  <div className="card-title">
                    <span>{card.title}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8c7a9e] mt-1 text-center flex items-center justify-center gap-2">
                    <span>Avail: <strong className={canAffordStandard ? 'text-emerald-400' : 'text-rose-400'}>{availableTickets}</strong></span>
                    {!isShredderPack && (
                      <span className="text-slate-400 font-mono">| A8 Pass: <strong className={canAffordShredder ? 'text-amber-300' : 'text-slate-500'}>{shredderBalance}</strong></span>
                    )}
                  </div>
                </div>

                {/* Pack Footer */}
                <div className="card-footer">
                  <div
                    className="card-note"
                    style={{
                      '--note-color': isSelected || isHovered ? 'transparent' : '#9c93a8',
                    } as React.CSSProperties}
                  >
                    <i>{card.subtitle}</i>
                  </div>

                  {(isSelected || isHovered) && (
                    <div className="button-row" onClick={(e) => e.stopPropagation()}>
                      {/* ONLY ONE GACHA BUTTON APPEARS AT A TIME */}
                      {canAffordStandard ? (
                        /* Case 1: Player has enough of original resource -> Standard Button */
                        <button
                          className="card-button"
                          style={{
                            backgroundColor: card.visuals.accent_color || '#ffd86b',
                          }}
                          onClick={() => onRoll(card, false)}
                          title={`Spend ${card.cost.amount} ${card.cost.currency}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{`${buttonLabel} (${card.cost.amount})`}</span>
                        </button>
                      ) : canAffordShredder ? (
                        /* Case 2: Insufficient original resource, but has A8 Shredder Ticket -> Universal Shredder Pass Button */
                        <button
                          className="card-button text-white shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #1e88e5 0%, #ffc107 50%, #d32f2f 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.35)',
                            color: '#ffffff',
                          }}
                          onClick={() => onRoll(card, true)}
                          title="Use 1x A8 Universal Shredder Ticket as complete substitute"
                        >
                          <Scissors className="w-3.5 h-3.5 text-white" />
                          <span>A8 Shredder Pass (1x)</span>
                        </button>
                      ) : (
                        /* Case 3: Insufficient original resource and 0 A8 Shredder Tickets -> Disabled Button */
                        <button
                          className="card-button"
                          disabled
                          title={`Insufficient ${card.cost.currency} and 0 A8 Shredder Tickets`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{`Need ${card.cost.amount} ${card.cost.currency === 'discs' ? 'DISCS' : card.cost.currency.split('-')[0].toUpperCase()}`}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GachaLobby;
