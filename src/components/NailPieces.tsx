import React from 'react';
import { PieceType, SpecialType } from '../types/game';

interface NailPieceGraphicProps {
  type: PieceType;
  special?: SpecialType;
  className?: string;
}

export const NailPieceGraphic: React.FC<NailPieceGraphicProps> = ({
  type,
  special = 'none',
  className = 'w-full h-full',
}) => {
  if (special === 'prism') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={`${className} drop-shadow-[0_4px_3px_rgba(125,28,84,0.34)]`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="prismCore25" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FF9EC7" />
            <stop offset="62%" stopColor="#A855F7" />
            <stop offset="88%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#9D174D" />
          </radialGradient>
          <linearGradient id="prismRim25" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="56" rx="18" ry="4" fill="#6D1844" fillOpacity="0.22" />
        <circle cx="32" cy="31" r="23" fill="url(#prismCore25)" stroke="url(#prismRim25)" strokeWidth="3" />
        <path d="M16 20 C22 12, 42 12, 48 20" fill="none" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
        <polygon
          points="32,12 37,23 50,24 40,32 43,45 32,38 21,45 24,32 14,24 27,23"
          fill="#FFFDF7"
          stroke="#D97706"
          strokeWidth="1.4"
        />
        <circle cx="24" cy="20" r="3.2" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <div className={`relative select-none ${className}`}>
      {type === 'rose-polish' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(145,20,66,0.28)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="roseBody25" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#FFA3C4" />
              <stop offset="45%" stopColor="#EC3678" />
              <stop offset="85%" stopColor="#B4134F" />
              <stop offset="100%" stopColor="#7C0A34" />
            </linearGradient>
            <linearGradient id="roseCap25" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF5C0" />
              <stop offset="45%" stopColor="#EAB331" />
              <stop offset="100%" stopColor="#9A6609" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="16" ry="3.6" fill="#7D143D" fillOpacity="0.22" />
          <rect x="14" y="28" width="36" height="27" rx="11" fill="#7C0A34" />
          <rect x="14" y="24" width="36" height="29" rx="11" fill="url(#roseBody25)" stroke="#7D1038" strokeWidth="1.5" />
          <rect x="23" y="6" width="18" height="16" rx="4.5" fill="url(#roseCap25)" stroke="#8A5A07" strokeWidth="1.3" />
          <rect x="25.5" y="8" width="3.5" height="11" rx="1.5" fill="#FFFFFF" fillOpacity="0.65" />
          <rect x="26" y="21" width="12" height="4" rx="1.5" fill="#FCE7F3" />
          <path d="M19 30 C19 27.5, 24 27.5, 24 31 L24 44 C24 47, 19 47, 19 44 Z" fill="#FFFFFF" fillOpacity="0.58" />
          <circle cx="38.5" cy="39" r="5" fill="#FFF1F6" fillOpacity="0.35" />
          <path d="M35.5 39 C35.5 36.5, 39 36.5, 39 39 C39 36.5, 42.5 36.5, 42.5 39 C42.5 41.5, 39 44, 39 44 C39 44, 35.5 41.5, 35.5 39 Z" fill="#FFFDFB" fillOpacity="0.9" />
        </svg>
      )}

      {type === 'lavender-gem' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(91,33,182,0.3)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gemOuter25" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%" stopColor="#F3E8FF" />
              <stop offset="40%" stopColor="#A855F7" />
              <stop offset="85%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
            <linearGradient id="gemBezel25" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="16" ry="3.8" fill="#4C1D95" fillOpacity="0.22" />
          <polygon points="32,11 54,25 46,54 18,54 10,25" fill="#3B0764" />
          <polygon
            points="32,7 54,22 46,51 18,51 10,22"
            fill="url(#gemOuter25)"
            stroke="url(#gemBezel25)"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <polygon points="32,13 46,24 32,33 18,24" fill="#FFFFFF" fillOpacity="0.58" />
          <polygon points="18,24 32,33 24,46 14,34" fill="#DDD6FE" fillOpacity="0.32" />
          <polygon points="46,24 50,34 40,46 32,33" fill="#4C1D95" fillOpacity="0.28" />
          <circle cx="25" cy="18" r="2.8" fill="#FFFFFF" fillOpacity="0.95" />
        </svg>
      )}

      {type === 'pearl-blossom' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(168,42,88,0.28)]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="petal25" cx="35%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="52%" stopColor="#FBCFE8" />
              <stop offset="88%" stopColor="#E15B8D" />
              <stop offset="100%" stopColor="#A92A58" />
            </radialGradient>
            <radialGradient id="pearlCore25" cx="32%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#CA8A04" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="3.8" fill="#831843" fillOpacity="0.2" />
          <g fill="#9D174D" fillOpacity="0.45" transform="translate(0, 3)">
            <circle cx="32" cy="16" r="11" />
            <circle cx="47" cy="27" r="11" />
            <circle cx="41" cy="44" r="11" />
            <circle cx="23" cy="44" r="11" />
            <circle cx="17" cy="27" r="11" />
          </g>
          <g stroke="#AD2D5C" strokeWidth="1.4">
            <circle cx="32" cy="16" r="11" fill="url(#petal25)" />
            <circle cx="47" cy="27" r="11" fill="url(#petal25)" />
            <circle cx="41" cy="44" r="11" fill="url(#petal25)" />
            <circle cx="23" cy="44" r="11" fill="url(#petal25)" />
            <circle cx="17" cy="27" r="11" fill="url(#petal25)" />
          </g>
          <circle cx="32" cy="32" r="9.5" fill="url(#pearlCore25)" stroke="#B45309" strokeWidth="1.6" />
          <circle cx="28.5" cy="28.5" r="3" fill="#FFFFFF" fillOpacity="0.92" />
        </svg>
      )}

      {type === 'mint-card' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(13,115,96,0.28)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mintNail25" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="48%" stopColor="#26B38E" />
              <stop offset="100%" stopColor="#0D6E5E" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="57" rx="16" ry="3.5" fill="#0F766E" fillOpacity="0.22" />
          <rect x="13" y="12" width="38" height="44" rx="9" fill="#0F766E" />
          <rect x="13" y="8" width="38" height="44" rx="9" fill="#FFFDFB" stroke="#15806B" strokeWidth="1.8" />
          <path d="M23 19 C23 11.5, 41 11.5, 41 19 L41 40 C41 45, 23 45, 23 40 Z" fill="url(#mintNail25)" stroke="#0D6E5E" strokeWidth="1.2" />
          <path d="M23.5 20 C26 14, 38 14, 40.5 20 C36.5 17, 27.5 17, 23.5 20 Z" fill="#FFFFFF" fillOpacity="0.92" />
          <path d="M27.5 22 L27.5 38" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="32" cy="31" r="3.6" fill="#FDE047" stroke="#B45309" strokeWidth="1.1" />
        </svg>
      )}

      {type === 'amber-serum' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(146,84,10,0.28)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="serum25" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="90%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="15" ry="3.5" fill="#78350F" fillOpacity="0.22" />
          <rect x="27" y="6" width="10" height="10" rx="4.5" fill="#FFFDFB" stroke="#92400E" strokeWidth="1.5" />
          <rect x="23.5" y="14" width="17" height="6" rx="2.5" fill="#FBBF24" stroke="#92400E" strokeWidth="1.3" />
          <path d="M32 23 C45 28, 49 41, 45 50 C42 55, 22 55, 19 50 C15 41, 19 28, 32 23 Z" fill="#78350F" />
          <path
            d="M32 19 C45 24, 49 38, 45 47 C42 52, 22 52, 19 47 C15 38, 19 24, 32 19 Z"
            fill="url(#serum25)"
            stroke="#92400E"
            strokeWidth="1.6"
          />
          <path d="M23.5 31 C22.5 38, 24.5 44, 28 46.5" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <circle cx="37" cy="39" r="3.4" fill="#FFFFFF" fillOpacity="0.45" />
        </svg>
      )}

      {type === 'berry-bow' && (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-[0_4px_3px_rgba(131,24,67,0.3)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bow25" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8BC2" />
              <stop offset="48%" stopColor="#DB2777" />
              <stop offset="100%" stopColor="#831843" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="17" ry="3.5" fill="#831843" fillOpacity="0.22" />
          <path
            d="M27 33 L16 51 L24 49 L30 37 Z M37 33 L48 51 L40 49 L34 37 Z"
            fill="#9D174D"
            stroke="#6B1035"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M31 32 C18 18, 7 24, 10 36 C12 44, 23 42, 31 35 Z M33 32 C46 18, 57 24, 54 36 C52 44, 41 42, 33 35 Z"
            fill="#6B1035"
          />
          <path
            d="M31 29 C18 15, 7 21, 10 33 C12 41, 23 39, 31 32 Z"
            fill="url(#bow25)"
            stroke="#701238"
            strokeWidth="1.6"
          />
          <path
            d="M33 29 C46 15, 57 21, 54 33 C52 41, 41 39, 33 32 Z"
            fill="url(#bow25)"
            stroke="#701238"
            strokeWidth="1.6"
          />
          <path d="M15 24 C19 21, 24 23, 27 26" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M49 24 C45 21, 40 23, 37 26" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="30.5" r="6.5" fill="#FFFDF9" stroke="#D97706" strokeWidth="2" />
          <circle cx="30" cy="28.5" r="2.2" fill="#FCE7F3" />
        </svg>
      )}

      {/* 2.5D Special Power-Up Overlays */}
      {special === 'line-h' && (
        <div className="pointer-events-none absolute inset-x-0.5 top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-amber-300 via-white to-amber-300 border border-amber-600/80 shadow-[0_2px_6px_rgba(245,158,11,0.65)] opacity-95" />
      )}

      {special === 'line-v' && (
        <div className="pointer-events-none absolute inset-y-0.5 left-1/2 -translate-x-1/2 w-3 rounded-full bg-gradient-to-b from-amber-300 via-white to-amber-300 border border-amber-600/80 shadow-[0_2px_6px_rgba(245,158,11,0.65)] opacity-95" />
      )}

      {special === 'bomb' && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6),inset_0_0_8px_rgba(251,191,36,0.45)]">
          <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border border-white shadow flex items-center justify-center text-[10px] font-bold text-amber-950">
            ✦
          </div>
        </div>
      )}

      {special === 'butterfly' && (
        <div className="pointer-events-none absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-b from-amber-200 to-pink-400 border border-white shadow flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#351427]" fill="currentColor" aria-hidden="true">
            <path d="M12 11 C9 5, 3 4, 3 9 C3 12, 7 13, 10 12 C7 14, 5 18, 8 19 C10 20, 11 16, 12 14 C13 16, 14 20, 16 19 C19 18, 17 14, 14 12 C17 13, 21 12, 21 9 C21 4, 15 5, 12 11 Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
