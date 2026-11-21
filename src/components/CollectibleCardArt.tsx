import React, { useState } from 'react';
import { CollectibleCard } from '../types/game';

interface CollectibleCardArtProps {
  card: CollectibleCard;
  unlocked: boolean;
  className?: string;
}

export const CollectibleCardArt: React.FC<CollectibleCardArtProps> = ({
  card,
  unlocked,
  className = 'w-full aspect-[4/3]',
}) => {
  const [imgError, setImgError] = useState(false);

  if (card.imageUrl && !imgError) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-[#F9EEF2] ${className}`}>
        <img
          src={card.imageUrl}
          alt={card.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            unlocked ? '' : 'grayscale opacity-45 contrast-75'
          }`}
        />
      </div>
    );
  }

  const [c1, c2, c3] = card.palette;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#EAD4DC] flex items-center justify-center p-3 ${className}`}
      style={{
        background: `linear-gradient(145deg, ${c3} 0%, ${c1} 100%)`,
      }}
    >
      <svg
        viewBox="0 0 220 120"
        className={`w-full h-full ${unlocked ? '' : 'grayscale opacity-50'}`}
        aria-label={card.title}
      >
        <defs>
          <linearGradient id={`tip-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c3} />
            <stop offset="55%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((idx) => {
          const x = 18 + idx * 39;
          const yOffset = idx === 2 ? 12 : idx === 1 || idx === 3 ? 17 : 22;
          return (
            <g key={idx} transform={`translate(${x}, ${yOffset})`}>
              <rect
                x="0"
                y="0"
                width="28"
                height="74"
                rx="14"
                fill={`url(#tip-${card.id})`}
                stroke="#FFFDFB"
                strokeWidth="1.8"
              />
              <path
                d="M7 14 C7 9, 9 9, 9 14 L9 46 C9 49, 7 49, 7 46 Z"
                fill="#FFFFFF"
                fillOpacity="0.45"
              />
              {card.motif === 'petal-crown' && (
                <circle cx="14" cy="36" r="5" fill="#FFFDFB" stroke="#D4AF37" strokeWidth="1.5" />
              )}
              {card.motif === 'shiraz-tile' && (
                <polygon
                  points="14,24 21,36 14,48 7,36"
                  fill="none"
                  stroke="#F5DFAA"
                  strokeWidth="1.6"
                />
              )}
              {card.motif === 'gold-lotus' && (
                <path
                  d="M14 22 C19 29, 19 39, 14 44 C9 39, 9 29, 14 22 Z"
                  fill="#FFF8E1"
                  fillOpacity="0.85"
                />
              )}
              {card.motif === 'rose-pearl' && (
                <path
                  d="M2 16 C6 9, 22 9, 26 16"
                  fill="none"
                  stroke="#FFFDFB"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
              {card.motif === 'lavender-silk' && (
                <ellipse
                  cx="14"
                  cy="38"
                  rx="8"
                  ry="16"
                  fill="#FFFFFF"
                  fillOpacity="0.22"
                  transform="rotate(-14 14 38)"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
