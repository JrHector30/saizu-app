import React from 'react';
import { useSuitcase } from '../context/SuitcaseContext';

// Zooms are adjusted for the new viewBox (0 0 300 800)
const ZOOM_CONFIG = {
  head: { scale: 2.5, originX: '50%', originY: '10%' },
  torso: { scale: 1.8, originX: '50%', originY: '35%' },
  hands: { scale: 1.8, originX: '50%', originY: '45%' },
  legs: { scale: 1.6, originX: '50%', originY: '65%' },
  feet: { scale: 2.2, originX: '50%', originY: '90%' },
};

const AvatarSVG = () => {
  const { activeZone, setActiveZone } = useSuitcase();
  const zoom = ZOOM_CONFIG[activeZone] || { scale: 1, originX: '50%', originY: '50%' };
  
  const handleClick = (zone) => {
    setActiveZone(zone);
  };

  const getPathClass = (zone) => {
    return `avatar-path ${activeZone === zone ? 'active' : ''}`;
  };

  return (
    <div className="avatar-container">
      <div 
        className="avatar-zoom-wrapper"
        style={{
          transform: `scale(${zoom.scale})`,
          transformOrigin: `${zoom.originX} ${zoom.originY}`
        }}
      >
        <svg 
          viewBox="0 0 300 800" 
          xmlns="http://www.w3.org/2000/svg" 
          className="avatar-svg"
        >
          {/* Subtle defs for stylized lines */}
          <defs>
            <style>
              {`
                .avatar-path {
                  fill: transparent;
                  stroke: #D1D5DB;
                  stroke-width: 2;
                  stroke-linecap: round;
                  stroke-linejoin: round;
                  cursor: pointer;
                  transition: all 0.3s ease;
                }
                .avatar-path:hover {
                  stroke: #9CA3AF;
                  stroke-width: 3;
                  fill: rgba(243, 244, 246, 0.5);
                }
                .avatar-path.active {
                  stroke: #1A1A1A;
                  stroke-width: 4;
                  fill: rgba(243, 244, 246, 0.8);
                }
              `}
            </style>
          </defs>

          {/* HEAD */}
          <g onClick={() => handleClick('head')} className={getPathClass('head')}>
            <path d="M125 70 C125 40 175 40 175 70 C175 100 165 115 150 120 C135 115 125 100 125 70 Z" />
            {/* Neck */}
            <path d="M140 118 L140 140 M160 118 L160 140" />
          </g>

          {/* TORSO */}
          <g onClick={() => handleClick('torso')} className={getPathClass('torso')}>
            <path d="M140 140 C110 145 90 160 90 180 C90 250 110 320 125 400 L175 400 C190 320 210 250 210 180 C210 160 190 145 160 140 Z" />
            <path d="M120 280 C140 285 160 285 180 280" /> {/* Waistline aesthetic detail */}
          </g>

          {/* HANDS / ARMS */}
          <g onClick={() => handleClick('hands')} className={getPathClass('hands')}>
            {/* Left Arm */}
            <path d="M90 180 C70 200 65 250 60 300 C58 330 60 380 65 400" />
            {/* Right Arm */}
            <path d="M210 180 C230 200 235 250 240 300 C242 330 240 380 235 400" />
            {/* Left Hand Indicator */}
            <circle cx="65" cy="405" r="8" />
            {/* Right Hand Indicator */}
            <circle cx="235" cy="405" r="8" />
          </g>

          {/* LEGS */}
          <g onClick={() => handleClick('legs')} className={getPathClass('legs')}>
            <path d="M125 400 C110 500 115 600 100 700 M175 400 C190 500 185 600 200 700" />
            {/* Inner leg line */}
            <path d="M150 420 L150 500 M120 500 C150 510 150 510 180 500" />
            <path d="M100 700 L125 700 L140 460 C150 420 150 420 160 460 L175 700 L200 700" />
          </g>

          {/* FEET */}
          <g onClick={() => handleClick('feet')} className={getPathClass('feet')}>
            {/* Left Foot */}
            <path d="M95 700 C80 720 80 740 95 745 C115 745 125 730 125 700" />
            {/* Right Foot */}
            <path d="M205 700 C220 720 220 740 205 745 C185 745 175 730 175 700" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default AvatarSVG;
