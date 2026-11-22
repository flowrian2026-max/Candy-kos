import React, { useId } from 'react';
import { PieceType, SpecialType } from '../types/game';

interface NailPieceGraphicProps {
  type: PieceType;
  special?: SpecialType;
  className?: string;
}

/**
 * Luxury Persian Petal Nail Parlor SVG Tiles
 * Design Language:
 * - Square 100x100 viewBox, transparent backdrop
 * - Unified 2.4 stroke weight in Deep Burgundy (#6B2D3C)
 * - Soft top-left directional highlight & warm specular reflection
 * - Strict 5-color palette:
 *   Bone Cream (#F5EDE4), Dusty Pink (#E8B4B8), Rose Gold (#B76E79),
 *   Mint Sage (#A8C3A0), Deep Burgundy (#6B2D3C)
 */
export const NailPieceGraphic: React.FC<NailPieceGraphicProps> = ({
  type,
  special = 'none',
  className = 'w-full h-full',
}) => {
  const uid = useId().replace(/:/g, '');

  if (special === 'prism') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`${className} pp-tile-svg`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}-prism-core`} cx="32%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#F5EDE4" />
            <stop offset="35%" stopColor="#E8B4B8" />
            <stop offset="68%" stopColor="#B76E79" />
            <stop offset="100%" stopColor="#6B2D3C" />
          </radialGradient>
          <linearGradient id={`${uid}-prism-ring`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#F5EDE4" />
            <stop offset="50%" stopColor="#B76E79" />
            <stop offset="100%" stopColor="#6B2D3C" />
          </linearGradient>
        </defs>

        <ellipse cx="50" cy="88" rx="26" ry="5.5" fill="#6B2D3C" fillOpacity="0.16" />

        {/* Ceramic + Rose Gold Cabochon Base */}
        <circle
          cx="50"
          cy="49"
          r="35"
          fill={`url(#${uid}-prism-core)`}
          stroke={`url(#${uid}-prism-ring)`}
          strokeWidth="3.2"
        />

        {/* Alternating Palette Petals inside Prism Medallion */}
        <path
          d="M50 18 C57 30, 57 38, 50 49 C43 38, 43 30, 50 18 Z"
          fill="#F5EDE4"
          fillOpacity="0.92"
        />
        <path
          d="M80 49 C68 56, 60 56, 50 49 C60 42, 68 42, 80 49 Z"
          fill="#A8C3A0"
          fillOpacity="0.92"
        />
        <path
          d="M50 80 C43 68, 43 60, 50 49 C57 60, 57 68, 50 80 Z"
          fill="#E8B4B8"
          fillOpacity="0.94"
        />
        <path
          d="M20 49 C32 42, 40 42, 50 49 C40 56, 32 56, 20 49 Z"
          fill="#F5EDE4"
          fillOpacity="0.88"
        />

        {/* Center Faceted Star */}
        <polygon
          points="50,31 55,44 68,49 55,54 50,67 45,54 32,49 45,44"
          fill="#F5EDE4"
          stroke="#6B2D3C"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Top-Left Specular Arc */}
        <path
          d="M26 30 C33 21, 46 18, 57 20"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.72"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="34" cy="31" r="3" fill="#FFFFFF" fillOpacity="0.9" />
      </svg>
    );
  }

  return (
    <div className={`relative select-none ${className}`}>
      {/* 1. Rose Polish Bottle (لاک صورتی) */}
      {type === 'rose-polish' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cap`} x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="35%" stopColor="#D799A2" />
              <stop offset="78%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
            <linearGradient id={`${uid}-glass`} x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#F5EDE4" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#E8B4B8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#B76E79" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id={`${uid}-polish`} x1="20%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#F3CACD" />
              <stop offset="45%" stopColor="#E8B4B8" />
              <stop offset="82%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="89" rx="25" ry="5" fill="#6B2D3C" fillOpacity="0.16" />

          {/* Rose-Gold Cap & Collar */}
          <rect
            x="38"
            y="11"
            width="24"
            height="23"
            rx="6.5"
            fill={`url(#${uid}-cap)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
          />
          <rect
            x="41"
            y="14"
            width="4.5"
            height="16"
            rx="2.2"
            fill="#FFFFFF"
            fillOpacity="0.65"
          />
          <rect
            x="40"
            y="33"
            width="20"
            height="6.5"
            rx="2.5"
            fill="#F5EDE4"
            stroke="#6B2D3C"
            strokeWidth="2.2"
          />

          {/* Heavy Crystal Bottle Outer Wall */}
          <rect
            x="22"
            y="39"
            width="56"
            height="46"
            rx="15"
            fill={`url(#${uid}-glass)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
          />

          {/* Inner Lacquer Reservoir */}
          <rect
            x="27"
            y="44"
            width="46"
            height="36"
            rx="11"
            fill={`url(#${uid}-polish)`}
          />

          {/* Bottom Glass Refraction */}
          <path
            d="M31 74 C38 78, 62 78, 69 74"
            fill="none"
            stroke="#6B2D3C"
            strokeOpacity="0.32"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Top-Left Soft Glass Specular */}
          <path
            d="M30 48 C30 44.5, 36 44.5, 36 49 L36 69 C36 72.5, 30 72.5, 30 69 Z"
            fill="#FFFFFF"
            fillOpacity="0.62"
          />
          <circle cx="33" cy="43" r="2.2" fill="#FFFFFF" fillOpacity="0.85" />

          {/* Delicate Cream Petal Emblem on Bottle */}
          <path
            d="M52 57 C52 53, 56 51, 58 55 C60 51, 64 53, 64 57 C64 62, 58 66, 58 66 C58 66, 52 62, 52 57 Z"
            fill="#F5EDE4"
            fillOpacity="0.92"
            stroke="#6B2D3C"
            strokeWidth="1.4"
          />
        </svg>
      )}

      {/* 2. Faceted Gem (نگین درخشان) */}
      {type === 'lavender-gem' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-gem-base`} x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="35%" stopColor="#E8B4B8" />
              <stop offset="75%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
            <linearGradient id={`${uid}-gem-bezel`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="50%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="88" rx="23" ry="5" fill="#6B2D3C" fillOpacity="0.16" />

          {/* Rose-Gold Setting Rim */}
          <polygon
            points="50,12 80,28 84,56 64,84 36,84 16,56 20,28"
            fill={`url(#${uid}-gem-bezel)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Main Crystal Body */}
          <polygon
            points="50,18 74,31 77,54 61,77 39,77 23,54 26,31"
            fill={`url(#${uid}-gem-base)`}
            stroke="#6B2D3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* 4 Cut Facets for Depth */}
          <polygon
            points="50,28 65,37 65,55 50,65 35,55 35,37"
            fill="#F5EDE4"
            fillOpacity="0.45"
            stroke="#6B2D3C"
            strokeOpacity="0.35"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <polygon
            points="26,31 50,18 50,28 35,37"
            fill="#FFFFFF"
            fillOpacity="0.62"
          />
          <polygon
            points="65,55 77,54 61,77 50,65"
            fill="#6B2D3C"
            fillOpacity="0.3"
          />
          <polygon
            points="35,37 50,28 50,48 35,55"
            fill="#FFFFFF"
            fillOpacity="0.34"
          />

          {/* Top-Left Sparkle Highlight */}
          <path
            d="M36 22 L38 28 L44 30 L38 32 L36 38 L34 32 L28 30 L34 28 Z"
            fill="#FFFFFF"
            fillOpacity="0.96"
          />
        </svg>
      )}

      {/* 3. Soft 5-Petal Blossom with Mint Leaf (گل نرم) */}
      {type === 'pearl-blossom' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-petal`} cx="35%" cy="28%" r="74%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="48%" stopColor="#E8B4B8" />
              <stop offset="92%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#8F4D59" />
            </radialGradient>
            <radialGradient id={`${uid}-flower-core`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#F5EDE4" />
              <stop offset="100%" stopColor="#D6B293" />
            </radialGradient>
            <linearGradient id={`${uid}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C8DCC2" />
              <stop offset="60%" stopColor="#A8C3A0" />
              <stop offset="100%" stopColor="#6D8C66" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="88" rx="26" ry="5" fill="#6B2D3C" fillOpacity="0.15" />

          {/* Small Mint Sage Leaf (Lower Right) */}
          <path
            d="M64 62 C78 58, 88 66, 86 78 C75 81, 65 74, 64 62 Z"
            fill={`url(#${uid}-leaf)`}
            stroke="#6B2D3C"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M67 65 L79 73"
            stroke="#F5EDE4"
            strokeOpacity="0.7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* 5 Sculpted Petals */}
          <g stroke="#6B2D3C" strokeWidth="2.4">
            <circle cx="50" cy="26" r="15.5" fill={`url(#${uid}-petal)`} />
            <circle cx="72" cy="42" r="15.5" fill={`url(#${uid}-petal)`} />
            <circle cx="64" cy="68" r="15.5" fill={`url(#${uid}-petal)`} />
            <circle cx="36" cy="68" r="15.5" fill={`url(#${uid}-petal)`} />
            <circle cx="28" cy="42" r="15.5" fill={`url(#${uid}-petal)`} />
          </g>

          {/* Top-Left Petal Highlights */}
          <circle cx="45" cy="20" r="4" fill="#FFFFFF" fillOpacity="0.58" />
          <circle cx="23" cy="36" r="3.4" fill="#FFFFFF" fillOpacity="0.48" />

          {/* Cream Pearl Stamen Core */}
          <circle
            cx="50"
            cy="50"
            r="14"
            fill={`url(#${uid}-flower-core)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
          />
          <circle cx="45" cy="45" r="4" fill="#FFFFFF" fillOpacity="0.92" />
        </svg>
      )}

      {/* 4. Manicure Shears (قیچی مانیکور) */}
      {type === 'mint-card' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-blade`} x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="55%" stopColor="#E6D2CC" />
              <stop offset="100%" stopColor="#B76E79" />
            </linearGradient>
            <linearGradient id={`${uid}-handle`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9DEC4" />
              <stop offset="55%" stopColor="#A8C3A0" />
              <stop offset="100%" stopColor="#6D8C66" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="88" rx="25" ry="5" fill="#6B2D3C" fillOpacity="0.16" />

          {/* Precision Blades (Pointing Top-Left / Top-Right) */}
          <path
            d="M47 47 L28 16 C25 18, 26 26, 33 38 L44 52 Z"
            fill={`url(#${uid}-blade)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M53 47 L72 16 C75 18, 74 26, 67 38 L56 52 Z"
            fill={`url(#${uid}-blade)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Blade Top-Left Edge Sheens */}
          <path
            d="M30 22 L43 44"
            stroke="#FFFFFF"
            strokeOpacity="0.82"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M68 22 L57 42"
            stroke="#FFFFFF"
            strokeOpacity="0.55"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Finger Loops in Mint Sage & Rose-Gold Trim */}
          <path
            d="M44 52 L35 66 C26 67, 21 75, 25 82 C29 88, 39 87, 43 80 C46 74, 44 68, 41 65 L48 54"
            fill={`url(#${uid}-handle)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle
            cx="33"
            cy="76"
            r="5.5"
            fill="#F5EDE4"
            stroke="#6B2D3C"
            strokeWidth="2.1"
          />

          <path
            d="M56 52 L65 66 C74 67, 79 75, 75 82 C71 88, 61 87, 57 80 C54 74, 56 68, 59 65 L52 54"
            fill={`url(#${uid}-handle)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle
            cx="67"
            cy="76"
            r="5.5"
            fill="#F5EDE4"
            stroke="#6B2D3C"
            strokeWidth="2.1"
          />

          {/* Rose-Gold Pivot Screw */}
          <circle
            cx="50"
            cy="49"
            r="6.2"
            fill="#B76E79"
            stroke="#6B2D3C"
            strokeWidth="2.2"
          />
          <circle cx="48.5" cy="47.5" r="2" fill="#F5EDE4" />
        </svg>
      )}

      {/* 5. Glossy Polish Drop (قطره لاک) */}
      {type === 'amber-serum' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-drop`} x1="22%" y1="8%" x2="82%" y2="95%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="32%" stopColor="#E8B4B8" />
              <stop offset="72%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="88" rx="22" ry="5" fill="#6B2D3C" fillOpacity="0.16" />

          {/* Tiny Companion Bead */}
          <circle
            cx="74"
            cy="30"
            r="5.5"
            fill="#E8B4B8"
            stroke="#6B2D3C"
            strokeWidth="2.2"
          />
          <circle cx="72.5" cy="28.5" r="1.7" fill="#FFFFFF" fillOpacity="0.9" />

          {/* Main Sculpted Polish Drop */}
          <path
            d="M50 13 C64 34, 77 48, 77 63 C77 77, 65 86, 50 86 C35 86, 23 77, 23 63 C23 48, 36 34, 50 13 Z"
            fill={`url(#${uid}-drop)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Soft Internal Cream Rim & Specular Streak */}
          <path
            d="M34 52 C31 60, 33 70, 40 75"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.72"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <circle cx="38" cy="44" r="3" fill="#FFFFFF" fillOpacity="0.88" />
          <path
            d="M55 76 C63 75, 68 70, 69 63"
            fill="none"
            stroke="#F5EDE4"
            strokeOpacity="0.38"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* 6. Star Salon Charm (ستاره / شارم) */}
      {type === 'berry-bow' && (
        <svg viewBox="0 0 100 100" className="w-full h-full pp-tile-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-charm`} x1="18%" y1="10%" x2="85%" y2="92%">
              <stop offset="0%" stopColor="#F5EDE4" />
              <stop offset="40%" stopColor="#E8B4B8" />
              <stop offset="76%" stopColor="#B76E79" />
              <stop offset="100%" stopColor="#6B2D3C" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="88" rx="22" ry="5" fill="#6B2D3C" fillOpacity="0.16" />

          {/* Charm Clasp Ring */}
          <circle
            cx="50"
            cy="15"
            r="5.5"
            fill="#F5EDE4"
            stroke="#6B2D3C"
            strokeWidth="2.3"
          />

          {/* Sculpted 5-Point Salon Star Charm */}
          <path
            d="M50 20 L58.5 38.5 L79 41 L64 55 L68 75.5 L50 65.5 L32 75.5 L36 55 L21 41 L41.5 38.5 Z"
            fill={`url(#${uid}-charm)`}
            stroke="#6B2D3C"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Inner Facet & Pearl Accent */}
          <polygon
            points="50,32 54.5,43 66,44.5 57.5,52.5 59.5,64 50,58.5 40.5,64 42.5,52.5 34,44.5 45.5,43"
            fill="#F5EDE4"
            fillOpacity="0.45"
          />
          <circle
            cx="50"
            cy="49.5"
            r="6.2"
            fill="#F5EDE4"
            stroke="#6B2D3C"
            strokeWidth="2"
          />
          <circle cx="48" cy="47.5" r="2.2" fill="#FFFFFF" />
          <path
            d="M32 42 L43 40"
            stroke="#FFFFFF"
            strokeOpacity="0.78"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Cohesive Rose-Gold & Ceramic Special Power-Up Overlays */}
      {special === 'line-h' && (
        <div className="pointer-events-none absolute inset-x-0.5 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-gradient-to-r from-[#B76E79] via-[#F5EDE4] to-[#B76E79] border border-[#6B2D3C]/70 shadow-[0_2px_6px_rgba(107,45,60,0.35)] opacity-95" />
      )}

      {special === 'line-v' && (
        <div className="pointer-events-none absolute inset-y-0.5 left-1/2 -translate-x-1/2 w-2.5 rounded-full bg-gradient-to-b from-[#B76E79] via-[#F5EDE4] to-[#B76E79] border border-[#6B2D3C]/70 shadow-[0_2px_6px_rgba(107,45,60,0.35)] opacity-95" />
      )}

      {special === 'bomb' && (
        <div className="pointer-events-none absolute inset-0 rounded-[12px] border-2 border-[#B76E79] shadow-[0_0_10px_rgba(183,110,121,0.55),inset_0_0_8px_rgba(245,237,228,0.65)]">
          <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-gradient-to-b from-[#F5EDE4] to-[#B76E79] border border-[#6B2D3C] shadow flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#6B2D3C]" fill="currentColor" aria-hidden="true">
              <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
            </svg>
          </div>
        </div>
      )}

      {special === 'butterfly' && (
        <div className="pointer-events-none absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-b from-[#F5EDE4] to-[#E8B4B8] border border-[#6B2D3C] shadow flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#6B2D3C]" fill="currentColor" aria-hidden="true">
            <path d="M12 11 C9 5, 3 4, 3 9 C3 12, 7 13, 10 12 C7 14, 5 18, 8 19 C10 20, 11 16, 12 14 C13 16, 14 20, 16 19 C19 18, 17 14, 14 12 C17 13, 21 12, 21 9 C21 4, 15 5, 12 11 Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
