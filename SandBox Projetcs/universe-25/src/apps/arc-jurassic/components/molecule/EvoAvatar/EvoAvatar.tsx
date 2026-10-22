import React from 'react';

interface EvoAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number | string;
    imageUrl?: string | null;
    frameUrl: string;
    isUnlocked?: boolean;
    isShadow?: boolean;
    showLockOverlay?: boolean;
    fallbackType?: 'black' | 'gold' | null;
    borderRadius?: string;
    children?: React.ReactNode;
}

export const EvoAvatar = React.forwardRef<HTMLDivElement, EvoAvatarProps>(({
    size,
    imageUrl,
    frameUrl,
    isUnlocked = true,
    isShadow = false,
    showLockOverlay = true,
    fallbackType = null,
    borderRadius = '12px',
    style,
    className = '',
    children,
    ...rest
}, ref) => {

    const dinoFilterStyle = isShadow
        ? { filter: 'brightness(0) opacity(0.85) drop-shadow(0 0 4px rgba(0,0,0,0.9))' }
        : isUnlocked
        ? {}
        : { filter: 'brightness(0.38) grayscale(0.85)' };

    const frameFilterStyle = isUnlocked || isShadow
        ? {}
        : { filter: 'brightness(0.38) grayscale(0.85)' };

    const dimensionStyle: React.CSSProperties = size !== undefined
        ? (typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : { width: size, height: size })
        : { width: '100%', height: '100%', aspectRatio: '1 / 1' };

    return (
        <div
            ref={ref}
            className={`relative overflow-hidden select-none ${className}`}
            style={{
                borderRadius,
                ...dimensionStyle,
                ...style
            }}
            {...rest}
        >
            {/* Dino Image or Fallback */}
            {imageUrl ? (
                <img
                    loading="lazy"
                    src={imageUrl}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        ...dinoFilterStyle
                    }}
                    alt="Evo Image"
                />
            ) : (
                fallbackType === 'black' ? (
                    <div className="evo-fallback-black" style={{ position: 'absolute', inset: '6%', borderRadius, background: '#080808' }}></div>
                ) : fallbackType === 'gold' ? (
                    <div className="evo-fallback-gold" style={{ position: 'absolute', inset: '6%', borderRadius, background: 'radial-gradient(circle at 35% 35%, #fffacd, #ffd700 45%, #b8860b 80%)' }}></div>
                ) : null
            )}

            {/* Rarity Frame */}
            <img
                loading="lazy"
                src={frameUrl}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    ...frameFilterStyle,
                    pointerEvents: 'none'
                }}
                alt="Frame"
            />

            {/* Lock Icon */}
            {(!isUnlocked && showLockOverlay) && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                        fontSize: typeof size === 'number' ? `${Math.max(16, size * 0.38)}px` : '2rem'
                    }}
                >
                    🔒
                </div>
            )}

            {/* Injected Badges or Overlays */}
            {children}
        </div>
    );
});

EvoAvatar.displayName = 'EvoAvatar';
