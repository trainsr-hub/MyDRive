import React from 'react';

interface DinoCardProps {
    dinoName: string;
    imageUrl: string;
    cardBgUrl: string;
    classIconUrl: string;
    displayRarity: string;
    isUnlocked: boolean;
}

export const DinoCard: React.FC<DinoCardProps> = ({
    dinoName,
    imageUrl,
    cardBgUrl,
    classIconUrl,
    displayRarity,
    isUnlocked
}) => {
    return (
        <div style={{ width: '250px', height: '389px', position: 'relative', overflow: 'hidden', borderRadius: '2px', transform: 'scale(1)', transformOrigin: 'top left' }}>
            <div style={{ width: '250px', height: '389px', position: 'relative', filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(60%)' }}>
                <img src={cardBgUrl} width="250" height="389" style={{ position: 'absolute', top: 0, left: 0 }} alt="Background" />
                <img src={imageUrl} width="206" height="236" style={{ position: 'absolute', left: '23px', top: '29px', objectFit: 'contain' }} alt={dinoName} />

                <div style={{ position: 'absolute', top: '44px', left: '7px', width: '37px', height: '135px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'rotate(-90deg) translate(-50%,-50%) scaleX(0.72)', transformOrigin: '0 0', fontFamily: "Impact, 'Arial'", fontSize: '26px', lineHeight: 1, color: 'white', whiteSpace: 'nowrap', letterSpacing: '-0.4px', textShadow: '0 2px 0 rgba(0,0,0,0.9)' }}>
                        {displayRarity}
                    </div>
                </div>

                <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '70px', height: '28px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: "'Arial'", fontSize: '16px', color: 'black', textShadow: '0 1px 0 black', lineHeight: 1, whiteSpace: 'nowrap' }}>
                        <img src={classIconUrl} width="23" height="20" style={{ flexShrink: 0, width: '23px', height: '20px' }} alt="Class Icon" />
                        <span style={{ marginLeft: '2px' }}>{(dinoName || "").toUpperCase()}</span>
                    </div>
                </div>

                {isUnlocked && (
                    <>
                        <div className="card-sparkle-layer" style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: '14%', top: '17%', width: '5px', height: '5px', borderRadius: '50%', background: 'white', boxShadow: '0 0 8px 3px rgba(255,255,255,0.95)', animation: 'cardSparkle1 2800ms ease-in-out infinite' }}></div>
                            <div style={{ position: 'absolute', left: '78%', top: '20%', width: '3px', height: '3px', borderRadius: '50%', background: 'white', boxShadow: '0 0 7px 2px rgba(255,255,255,0.9)', animation: 'cardSparkle2 2800ms ease-in-out 800ms infinite' }}></div>
                        </div>
                        <div className="card-light-sweep" style={{ position: 'absolute', left: '-115%', top: '145%', width: '30%', height: '220%', zIndex: 40, pointerEvents: 'none', transform: 'rotate(-45deg)', transformOrigin: 'center center', background: 'linear-gradient(to right,rgba(255,255,255,0),rgba(255,255,255,0.18) 20%,rgba(255,255,255,0.95) 48%,rgba(255,255,255,0.18) 78%,rgba(255,255,255,0))', filter: 'blur(0.8px)', mixBlendMode: 'screen', opacity: 0, animation: 'cardLightSweep 7000ms linear infinite' }}></div>
                    </>
                )}

                {!isUnlocked && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 50, pointerEvents: 'none' }}>
                        <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', border: '3px solid white', padding: '5px 15px', transform: 'rotate(-15deg)', letterSpacing: '2px' }}>
                            NOT OWNED
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
