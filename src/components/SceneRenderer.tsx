import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Particle, SceneType, TypographyStyle } from '../types';

interface SceneRendererProps {
  activeScene: SceneType;
  typographyStyle: TypographyStyle;
  centralTextSize: number;
  showCentralText: boolean;
  onTapEffect?: (x: number, y: number) => void;
}

export interface SceneRendererRef {
  triggerLanternRise: () => void;
  triggerBurst: (x?: number, y?: number) => void;
}

export const SceneRenderer = forwardRef<SceneRendererRef, SceneRendererProps>(
  ({ activeScene, typographyStyle, centralTextSize, showCentralText, onTapEffect }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Store particles and state in refs to avoid React re-renders on the 60fps animation loop
    const stateRef = useRef({
      particles: [] as Particle[],
      burstParticles: [] as Particle[],
      trailParticles: [] as Particle[],
      lanternParticles: [] as Particle[],
      longPress: {
        x: 0,
        y: 0,
        active: false,
        duration: 0,
        opacity: 0,
      },
      mouse: {
        x: 0,
        y: 0,
        px: 0,
        py: 0,
        isDown: false,
        downTime: 0,
        isMoving: false,
        moveTimeout: null as any,
      },
      time: 0,
      nextId: 0,
      dimensions: { width: 800, height: 600 },
    });

    const [isDeviceMotionSupported, setIsDeviceMotionSupported] = useState(false);

    // Expose functions to trigger effects from parent (e.g. button click for "Release Lanterns" or "Burst")
    useImperativeHandle(ref, () => ({
      triggerLanternRise: () => {
        triggerLanternEffect();
      },
      triggerBurst: (x, y) => {
        const w = stateRef.current.dimensions.width;
        const h = stateRef.current.dimensions.height;
        const targetX = x !== undefined ? x : w / 2;
        const targetY = y !== undefined ? y : h / 2;
        createBurst(targetX, targetY, 30);
      }
    }));

    // Helper to generate IDs
    const getNextId = () => {
      stateRef.current.nextId += 1;
      return stateRef.current.nextId;
    };

    // Helper: Draw text in a selected typography style
    const drawStyledText = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      size: number,
      style: TypographyStyle,
      opacity: number,
      time: number,
      isCentral: boolean = false
    ) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Reset shadows
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      switch (style) {
        case 'handwritten_ink': {
          ctx.font = `${isCentral ? 'normal' : 'normal'} ${size}px 'Great Vibes', 'Dancing Script', cursive`;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Deep slate-black ink
          ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetY = 1;
          ctx.fillText(text, x, y);
          break;
        }

        case 'watercolor': {
          ctx.font = `${size}px 'Dancing Script', 'Sacramento', cursive`;
          // Draw multiple layers with slight offsets and colors to mimic bleeding watercolor
          const colors = [
            'rgba(219, 39, 119, 0.2)', // rose
            'rgba(124, 58, 237, 0.2)', // violet
            'rgba(14, 165, 233, 0.15)', // sky
          ];
          
          const layers = isCentral ? 5 : 2;
          for (let i = 0; i < layers; i++) {
            const offsetX = Math.sin(time * 2 + i) * (isCentral ? 2.5 : 1);
            const offsetY = Math.cos(time * 1.5 + i) * (isCentral ? 2.5 : 1);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillText(text, x + offsetX, y + offsetY);
          }
          // core crisp text
          ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
          ctx.fillText(text, x, y);
          break;
        }

        case 'gold_foil': {
          ctx.font = `bold ${size}px 'Cinzel', 'Playfair Display', serif`;
          
          // Gold metallic gradient
          const grad = ctx.createLinearGradient(x - size * 2, y, x + size * 2, y);
          grad.addColorStop(0, '#d4af37'); // Gold
          grad.addColorStop(0.25, '#fcf6ba'); // Shiny white-gold
          grad.addColorStop(0.5, '#aa771c'); // Dark gold
          grad.addColorStop(0.75, '#fbf5b7'); // Light gold
          grad.addColorStop(1, '#bf953f'); // Bronze gold
          
          ctx.fillStyle = grad;
          
          // Gold glow
          ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
          ctx.shadowBlur = isCentral ? 15 : 6;
          
          // Shimmer shimmer shimmer
          const shimmerOffset = Math.sin(time * 1.2) * (isCentral ? 10 : 3);
          ctx.fillText(text, x + (isCentral ? shimmerOffset * 0.1 : 0), y);
          
          // Stroke outline for metal emboss look
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = isCentral ? 1.5 : 0.5;
          ctx.strokeText(text, x + (isCentral ? shimmerOffset * 0.1 : 0), y);
          break;
        }

        case 'soft_neon': {
          ctx.font = `600 ${size}px 'Space Grotesk', sans-serif`;
          ctx.letterSpacing = isCentral ? '6px' : '1px';
          
          // Outer thick neon glow
          ctx.shadowColor = isCentral ? '#ec4899' : '#06b6d4'; // neon pink or neon cyan
          ctx.shadowBlur = isCentral ? 25 : 10;
          ctx.fillStyle = isCentral ? 'rgba(236, 72, 153, 0.3)' : 'rgba(6, 182, 212, 0.3)';
          ctx.fillText(text, x, y);
          
          // Inner tube white core
          ctx.shadowBlur = isCentral ? 8 : 3;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, y);
          break;
        }

        case 'frosted_glass': {
          ctx.font = `300 ${size}px 'Space Grotesk', sans-serif`;
          ctx.letterSpacing = isCentral ? '4px' : '0px';

          // Backdrop frosted card glow (for central text only)
          if (isCentral) {
            const cardWidth = size * 5;
            const cardHeight = size * 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            
            // Draw a rounded card
            ctx.beginPath();
            ctx.roundRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
            ctx.fill();
            ctx.stroke();
          }

          ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText(text, x, y);
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = isCentral ? 1 : 0.5;
          ctx.strokeText(text, x, y);
          break;
        }

        case 'white_chalk': {
          ctx.font = `normal ${size}px 'Sacramento', 'Great Vibes', cursive`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          
          // Chalky sketchy jitter layers
          const jitterCount = isCentral ? 3 : 1;
          for (let i = 0; i < jitterCount; i++) {
            const dx = (Math.random() - 0.5) * 1.2;
            const dy = (Math.random() - 0.5) * 1.2;
            ctx.fillText(text, x + dx, y + dy);
          }
          break;
        }

        case 'pencil_sketch': {
          ctx.font = `${size}px 'Dancing Script', 'Sacramento', cursive`;
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)'; // graphite gray
          ctx.lineWidth = isCentral ? 1.0 : 0.4;
          
          // Draw text outline
          ctx.strokeText(text, x, y);
          
          // Sketch shading lines inside
          if (isCentral) {
            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 0.5;
            const textWidth = size * 3;
            // Draw diagonal cross hatches
            for (let i = -textWidth / 2; i < textWidth / 2; i += 5) {
              ctx.beginPath();
              ctx.moveTo(x + i - 10, y - size / 3);
              ctx.lineTo(x + i + 10, y + size / 3);
              ctx.stroke();
            }
            ctx.restore();
          } else {
            // simpler secondary stroke for sketchy depth
            ctx.strokeText(text, x + 0.5, y - 0.5);
          }
          break;
        }

        case 'embossed_paper': {
          ctx.font = `bold ${size}px 'Cinzel', 'Playfair Display', serif`;
          
          // Shadow offset (emboss indentation)
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = isCentral ? 3 : 1;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.04)'; // blend in background color
          ctx.fillText(text, x, y);

          // Highlight offset (raised edge)
          ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
          ctx.shadowBlur = isCentral ? 2 : 1;
          ctx.shadowOffsetX = -1;
          ctx.shadowOffsetY = -1;
          ctx.fillText(text, x, y);
          break;
        }

        case 'moonlight_glow': {
          ctx.font = `italic ${size}px 'Playfair Display', 'Cinzel', serif`;
          ctx.shadowColor = '#e0f2fe'; // moonlight soft pale blue
          ctx.shadowBlur = isCentral ? 20 : 7;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
          ctx.fillText(text, x, y);
          break;
        }

        case 'transparent_crystal': {
          ctx.font = `bold ${size}px 'Cinzel', 'Playfair Display', serif`;
          ctx.letterSpacing = isCentral ? '3px' : '0px';

          // Back reflective glow
          ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
          ctx.shadowBlur = 10;
          
          const grad = ctx.createLinearGradient(x, y - size / 2, x, y + size / 2);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
          
          ctx.fillStyle = grad;
          ctx.fillText(text, x, y);

          // Sharp crystal outline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = isCentral ? 1.2 : 0.4;
          ctx.strokeText(text, x, y);

          // Specular glint / sparkle (for central text only)
          if (isCentral && Math.sin(time * 3) > 0.85) {
            const glintX = x + Math.cos(time) * size * 1.5;
            const glintY = y + Math.sin(time * 1.5) * size * 0.4;
            drawSparkle(ctx, glintX, glintY, 8);
          }
          break;
        }
      }

      ctx.restore();
    };

    // Helper: Draw a beautiful diamond sparkle
    const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r / 3, y - r / 3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r / 3, y + r / 3);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r / 3, y + r / 3);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - r / 3, y - r / 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Particles Initializers depending on Active Scene
    const initSceneParticles = (scene: SceneType) => {
      const { width, height } = stateRef.current.dimensions;
      const count = getParticleCountForScene(scene);
      const particles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        particles.push(createSceneParticle(scene, width, height, true));
      }

      stateRef.current.particles = particles;
    };

    const getParticleCountForScene = (scene: SceneType): number => {
      switch (scene) {
        case 'drifting_snow': return 120;
        case 'starry_night': return 100;
        case 'whispering_clouds': return 5;
        case 'rainfall_reflection': return 100;
        case 'floating_feathers': return 25;
        case 'rose_petals': return 35;
        case 'firefly_glow': return 40;
        case 'butterfly_trails': return 8;
        case 'candle_smoke': return 30;
        case 'water_ripples': return 5;
        case 'calligraphy_balloons': return 12;
        case 'light_rays': return 40;
        case 'reflecting_shards': return 15;
        case 'wind_whispers': return 12;
        default: return 50;
      }
    };

    const createSceneParticle = (
      scene: SceneType,
      w: number,
      h: number,
      initialRandomY: boolean = false
    ): Particle => {
      const yVal = initialRandomY ? Math.random() * h : -20;
      
      switch (scene) {
        case 'drifting_snow':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.5 + Math.random() * 1.0,
            size: 10 + Math.random() * 16,
            opacity: 0.15 + Math.random() * 0.5,
            text: 'Sorry',
            color: 'rgba(255,255,255,0.7)',
            wiggleSpeed: 0.01 + Math.random() * 0.02,
            wiggleAmplitude: 15 + Math.random() * 25,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'starry_night':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: initialRandomY ? Math.random() * h * 0.85 : Math.random() * h * 0.1, // keep upper area
            vx: 0.01 * (Math.random() - 0.5),
            vy: 0.01 * (Math.random() - 0.5),
            size: 1 + Math.random() * 3,
            opacity: 0.15 + Math.random() * 0.75,
            text: Math.random() > 0.85 ? 'Sorry' : '', // some stars carry text
            color: '#ffffff',
            pulseSpeed: 0.01 + Math.random() * 0.03,
            pulsePhase: Math.random() * Math.PI * 2,
          };

        case 'whispering_clouds':
          return {
            id: getNextId(),
            x: initialRandomY ? Math.random() * w : -300,
            y: 50 + Math.random() * (h * 0.4),
            vx: 0.1 + Math.random() * 0.25,
            vy: 0,
            size: 120 + Math.random() * 160,
            opacity: 0.08 + Math.random() * 0.15,
            text: 'Sorry',
            color: 'rgba(241, 245, 249, 0.45)', // soft gray slate
            scale: 1,
            wiggleSpeed: 0.005,
            wiggleAmplitude: 10,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'rainfall_reflection':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: -0.5 - Math.random() * 0.5, // slightly slanted
            vy: 5 + Math.random() * 8, // fast falling rain
            size: 6 + Math.random() * 12,
            opacity: 0.15 + Math.random() * 0.45,
            text: 'Sorry',
            color: 'rgba(186, 230, 253, 0.4)', // pale watery blue
          };

        case 'floating_feathers':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.25 + Math.random() * 0.4, // fall very slowly
            size: 14 + Math.random() * 18,
            opacity: 0.2 + Math.random() * 0.5,
            text: 'Sorry',
            color: 'rgba(255,255,255,0.6)',
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.01,
            wiggleSpeed: 0.01 + Math.random() * 0.01,
            wiggleAmplitude: 20 + Math.random() * 30,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'rose_petals':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: -0.2 + Math.random() * 0.6,
            vy: 0.4 + Math.random() * 0.7,
            size: 12 + Math.random() * 16,
            opacity: 0.35 + Math.random() * 0.5,
            text: 'Sorry',
            color: `rgba(${180 + Math.floor(Math.random() * 75)}, ${20 + Math.floor(Math.random() * 40)}, ${50 + Math.floor(Math.random() * 40)}, 0.75)`, // rich rose red tones
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.03,
            wiggleSpeed: 0.02 + Math.random() * 0.02,
            wiggleAmplitude: 15 + Math.random() * 20,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'firefly_glow':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: initialRandomY ? Math.random() * h : h + 10,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -0.2 - Math.random() * 0.6, // drift upwards
            size: 6 + Math.random() * 10,
            opacity: 0.1 + Math.random() * 0.6,
            text: 'Sorry',
            color: 'rgba(163, 230, 53, 0.65)', // glow yellow green
            pulseSpeed: 0.02 + Math.random() * 0.04,
            pulsePhase: Math.random() * Math.PI * 2,
            wiggleSpeed: 0.03,
            wiggleAmplitude: 5,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'butterfly_trails':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: initialRandomY ? Math.random() * h : h * 0.8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: 8 + Math.random() * 10,
            opacity: 0.5 + Math.random() * 0.4,
            text: 'Sorry',
            color: `hsl(${190 + Math.random() * 80}, 85%, 65%)`, // magical cyan-purple transitions
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.05,
            trail: [],
            styleParams: {
              targetX: Math.random() * w,
              targetY: Math.random() * h,
              flutterTime: Math.random() * 100,
            }
          };

        case 'candle_smoke':
          return {
            id: getNextId(),
            x: (w * 0.1) + Math.random() * (w * 0.8), // spread across bottom
            y: h + 10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.6 - Math.random() * 0.8, // rise up
            size: 14 + Math.random() * 20,
            opacity: 0.35 + Math.random() * 0.3,
            text: 'Sorry',
            color: 'rgba(226, 232, 240, 0.4)', // soft smoky gray/blue
            life: 0,
            maxLife: 200 + Math.random() * 150,
            wiggleSpeed: 0.015,
            wiggleAmplitude: 15,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'water_ripples':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 0,
            vy: 0,
            size: 10, // starts small, expands
            opacity: 0.6,
            text: 'Sorry',
            color: 'rgba(186, 230, 253, 0.5)',
            life: 0,
            maxLife: 150 + Math.random() * 100,
          };

        case 'calligraphy_balloons':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: h + 50, // start below screen
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.4 - Math.random() * 0.5, // float up
            size: 24 + Math.random() * 16,
            opacity: 0.4 + Math.random() * 0.4,
            text: 'Sorry',
            color: `hsla(${340 + Math.random() * 40}, 75%, 70%, 0.55)`, // rosy warm tones
            rotation: (Math.random() - 0.5) * 0.2,
            wiggleSpeed: 0.008,
            wiggleAmplitude: 10 + Math.random() * 15,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'light_rays':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: 0.1 + Math.random() * 0.3,
            vy: 0.3 + Math.random() * 0.6, // drift through godrays
            size: 8 + Math.random() * 14,
            opacity: 0.05, // very faint, grows bright inside godray
            text: 'Sorry',
            color: '#fffbeb', // soft yellow gold glow
            wiggleSpeed: 0.01,
            wiggleAmplitude: 10,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'reflecting_shards':
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.3 + Math.random() * 0.5,
            size: 20 + Math.random() * 25,
            opacity: 0.15 + Math.random() * 0.45,
            text: 'Sorry',
            color: 'rgba(241, 245, 249, 0.6)', // silver crystal looks
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.04,
            wiggleSpeed: 0.008,
            wiggleAmplitude: 8,
            wigglePhase: Math.random() * Math.PI * 2,
          };

        case 'wind_whispers':
          return {
            id: getNextId(),
            x: -150,
            y: 50 + Math.random() * (h - 100),
            vx: 1.2 + Math.random() * 1.5, // fly horizontally across screen fast
            vy: (Math.random() - 0.5) * 0.4,
            size: 14 + Math.random() * 14,
            opacity: 0.15 + Math.random() * 0.35,
            text: 'Sorry',
            color: 'rgba(224, 242, 254, 0.4)',
            wiggleSpeed: 0.02,
            wiggleAmplitude: 30,
            wigglePhase: Math.random() * Math.PI * 2,
            trail: [], // for drawing ribbon lines
          };

        default:
          return {
            id: getNextId(),
            x: Math.random() * w,
            y: yVal,
            vx: 0,
            vy: 1,
            size: 12,
            opacity: 0.5,
            text: 'Sorry',
            color: '#ffffff',
          };
      }
    };

    // Burst of "Sorry" particles on Click/Tap
    const createBurst = (x: number, y: number, count: number = 30) => {
      const burstList: Particle[] = [];
      const colors = [
        '#ec4899', // rose pink
        '#f43f5e', // rose red
        '#d4af37', // gold glow
        '#7dd3fc', // sky blue glow
        '#ffffff', // pure white shine
        '#c084fc', // purple pastel
      ];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        burstList.push({
          id: getNextId(),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 10 + Math.random() * 14,
          opacity: 0.85 + Math.random() * 0.15,
          text: 'Sorry',
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 40 + Math.floor(Math.random() * 40), // short life
          rotation: Math.random() * Math.PI,
          vRotation: (Math.random() - 0.5) * 0.1,
        });
      }

      stateRef.current.burstParticles = [...stateRef.current.burstParticles, ...burstList].slice(-150); // limit count
    };

    // Rise Lanterns on Shake/Trigger
    const triggerLanternEffect = () => {
      const { width, height } = stateRef.current.dimensions;
      const lanterns: Particle[] = [];
      
      for (let i = 0; i < 60; i++) {
        lanterns.push({
          id: getNextId(),
          x: Math.random() * width,
          y: height + 20 + Math.random() * 150, // spread start
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.4 - Math.random() * 0.8, // floating up slowly
          size: 14 + Math.random() * 16,
          opacity: 0.6 + Math.random() * 0.4,
          text: 'Sorry',
          color: 'rgba(251, 146, 60, 0.75)', // lovely orange lantern glow
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulsePhase: Math.random() * Math.PI * 2,
          wiggleSpeed: 0.005 + Math.random() * 0.01,
          wiggleAmplitude: 15 + Math.random() * 20,
          wigglePhase: Math.random() * Math.PI * 2,
        });
      }

      stateRef.current.lanternParticles = [...stateRef.current.lanternParticles, ...lanterns].slice(-200);
    };

    // Handle Window Resize via ResizeObserver
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = (entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          // Set canvas internal width to physical display width
          canvas.width = width;
          canvas.height = height;
          
          stateRef.current.dimensions = { width, height };
          
          // Re-initialize particles to fill screen correctly
          initSceneParticles(activeScene);
        }
      };

      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvas.parentElement || document.body);

      return () => {
        observer.disconnect();
      };
    }, [activeScene]);

    // Handle scene switch: recreate background particles
    useEffect(() => {
      const { width, height } = stateRef.current.dimensions;
      initSceneParticles(activeScene);
    }, [activeScene]);

    // Device Shake Detection setup
    useEffect(() => {
      let lastX: number | null = null;
      let lastY: number | null = null;
      let lastZ: number | null = null;
      let lastUpdate = 0;
      const shakeThreshold = 18; // sensitivity

      const handleMotion = (event: DeviceMotionEvent) => {
        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        const curTime = Date.now();
        if ((curTime - lastUpdate) > 100) {
          const diffTime = curTime - lastUpdate;
          lastUpdate = curTime;

          const x = acceleration.x || 0;
          const y = acceleration.y || 0;
          const z = acceleration.z || 0;

          if (lastX !== null && lastY !== null && lastZ !== null) {
            const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
            if (speed > shakeThreshold) {
              triggerLanternEffect();
            }
          }

          lastX = x;
          lastY = y;
          lastZ = z;
        }
      };

      if (window.DeviceMotionEvent) {
        setIsDeviceMotionSupported(true);
        // IOS needs permission request, which is handled at browser level on page click or standard toggle
        window.addEventListener('devicemotion', handleMotion);
      }

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
      };
    }, []);

    // Canvas Main Animation Frame Loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationId: number;

      const renderLoop = () => {
        const state = stateRef.current;
        const w = state.dimensions.width;
        const h = state.dimensions.height;
        
        state.time += 0.01;

        // Clear canvas with subtle ambient tint
        ctx.clearRect(0, 0, w, h);
        
        // Draw scene-specific ambient background glow/gradients
        drawSceneBackground(ctx, activeScene, w, h, state.time);

        // 1. UPDATE AND DRAW STANDARD BACKGROUND PARTICLES
        state.particles = state.particles.map((p) => {
          // Add wiggle motion based on wave math
          let currentX = p.x;
          if (p.wiggleSpeed && p.wiggleAmplitude && p.wigglePhase !== undefined) {
            p.wigglePhase += p.wiggleSpeed;
            currentX += Math.sin(p.wigglePhase) * p.wiggleAmplitude * 0.05;
          }

          // Move
          p.x += p.vx;
          p.y += p.vy;

          // Special updates per scene
          if (activeScene === 'firefly_glow' && p.pulsePhase !== undefined && p.pulseSpeed) {
            p.pulsePhase += p.pulseSpeed;
            p.opacity = 0.15 + Math.sin(p.pulsePhase) * 0.45;
          }

          if (activeScene === 'starry_night' && p.pulsePhase !== undefined && p.pulseSpeed) {
            p.pulsePhase += p.pulseSpeed;
            // Shimmer opacity
            p.opacity = 0.15 + (Math.sin(p.pulsePhase) * 0.5 + 0.5) * 0.8;
          }

          if (activeScene === 'butterfly_trails' && p.styleParams) {
            const params = p.styleParams;
            params.flutterTime += 0.06;
            
            // Move toward target point
            const dx = params.targetX - p.x;
            const dy = params.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 40) {
              // Set new random target
              params.targetX = Math.random() * w;
              params.targetY = Math.random() * h;
            } else {
              p.vx = (dx / dist) * 1.5 + Math.sin(params.flutterTime) * 1.2;
              p.vy = (dy / dist) * 1.5 + Math.cos(params.flutterTime * 1.5) * 1.2;
            }

            // Spawn trails
            if (Math.random() > 0.4) {
              p.trail = p.trail || [];
              p.trail.push({ x: p.x, y: p.y });
              if (p.trail.length > 12) p.trail.shift();
            }
          }

          if (activeScene === 'candle_smoke' && p.life !== undefined) {
            p.life += 1;
            p.opacity = (1 - p.life / p.maxLife!) * 0.5;
            p.size += 0.15; // smoke disperses/grows
          }

          if (activeScene === 'water_ripples' && p.life !== undefined) {
            p.life += 1;
            p.size += 1.2; // expand
            p.opacity = (1 - p.life / p.maxLife!) * 0.6;
          }

          if (activeScene === 'wind_whispers') {
            p.trail = p.trail || [];
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 8) p.trail.shift();
          }

          // Check limits / Wrap / Re-spawn
          let isDead = false;
          if (activeScene === 'candle_smoke' || activeScene === 'water_ripples') {
            if (p.life !== undefined && p.maxLife && p.life >= p.maxLife) {
              isDead = true;
            }
          } else if (p.y > h + 40 || p.x < -40 || p.x > w + 40) {
            isDead = true;
          }

          if (isDead) {
            return createSceneParticle(activeScene, w, h, false);
          }

          // DRAW
          drawSceneParticle(ctx, p, currentX, state.time);

          return p;
        });

        // 2. DRAW STARRY CONSTELLATION LINES (STARRY NIGHT ONLY)
        if (activeScene === 'starry_night') {
          drawStarConstellations(ctx, state.particles, w, h, state.time);
        }

        // 3. UPDATE AND DRAW BURST PARTICLES (USER TAP EFFECTS)
        state.burstParticles = state.burstParticles.filter((p) => {
          if (p.life === undefined || p.maxLife === undefined) return false;
          
          p.x += p.vx;
          p.y += p.vy;
          
          // apply slight decelerate
          p.vx *= 0.96;
          p.vy *= 0.96;

          p.life += 1;
          const lifeRatio = p.life / p.maxLife;
          p.opacity = 1 - lifeRatio;

          if (p.rotation !== undefined && p.vRotation !== undefined) {
            p.rotation += p.vRotation;
          }

          if (p.life >= p.maxLife) return false;

          // Render blooming sorry burst text
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);
          
          // High intensity bloom styling
          ctx.font = `italic ${p.size}px 'Great Vibes', cursive`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffffff';
          ctx.fillText('Sorry', 0, 0);
          
          ctx.restore();

          return true;
        });

        // 4. UPDATE AND DRAW SWIPE TRAIL PARTICLES
        state.trailParticles = state.trailParticles.filter((p) => {
          if (p.life === undefined || p.maxLife === undefined) return false;

          p.life += 1;
          p.opacity = 1 - p.life / p.maxLife;
          p.x += p.vx;
          p.y += p.vy;

          if (p.life >= p.maxLife) return false;

          // Render trail
          ctx.save();
          ctx.globalAlpha = p.opacity * 0.8;
          ctx.font = `italic ${p.size}px 'Sacramento', cursive`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 4;
          ctx.fillText('Sorry', p.x, p.y);
          ctx.restore();

          return true;
        });

        // 5. UPDATE AND DRAW LANTERN PARTICLES (SHAKE EFFECT)
        state.lanternParticles = state.lanternParticles.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // slow weave left/right
          if (p.wigglePhase !== undefined && p.wiggleSpeed) {
            p.wigglePhase += p.wiggleSpeed;
            p.x += Math.sin(p.wigglePhase) * 0.4;
          }

          // Shimmer glow
          if (p.pulsePhase !== undefined && p.pulseSpeed) {
            p.pulsePhase += p.pulseSpeed;
            p.opacity = 0.5 + Math.sin(p.pulsePhase) * 0.3;
          }

          // If lantern moves off screen top, die
          if (p.y < -40) return false;

          // Draw rising soft glowing lantern
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.shadowColor = 'rgba(251, 146, 60, 0.8)'; // orange fire glow
          ctx.shadowBlur = 15;
          
          // Draw a soft glowing lantern bulb
          ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Write beautiful cursive Sorry inside
          ctx.fillStyle = '#ffedd5'; // extremely soft light orange-white
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `normal ${p.size}px 'Great Vibes', cursive`;
          ctx.fillText('Sorry', p.x, p.y);

          // Draw elegant dangling hanging thread
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.size * 0.8);
          ctx.lineTo(p.x + Math.sin(state.time * 2) * 3, p.y + p.size * 2);
          ctx.stroke();

          ctx.restore();
          return true;
        });

        // 6. DRAW LONG PRESS INDICATION
        if (state.longPress.active) {
          state.longPress.duration += 0.02;
          // Fade in then stay
          state.longPress.opacity = Math.min(1.0, state.longPress.duration * 1.5);
          
          // Draw blooming sorry text under finger
          const lpX = state.longPress.x;
          const lpY = state.longPress.y;
          const radius = state.longPress.duration * 40;
          
          ctx.save();
          ctx.globalAlpha = state.longPress.opacity * 0.3;
          
          // Draw expand ripple aura
          const grad = ctx.createRadialGradient(lpX, lpY, 2, lpX, lpY, radius);
          grad.addColorStop(0, 'rgba(255,255,255,0.4)');
          grad.addColorStop(0.5, 'rgba(124, 58, 237, 0.1)'); // purple tint
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lpX, lpY, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Render beautiful gold/moonlight central text right above
          drawStyledText(
            ctx,
            'Sorry',
            lpX,
            lpY - 30,
            42 + Math.sin(state.time * 3) * 3,
            'moonlight_glow',
            state.longPress.opacity,
            state.time,
            true
          );
        } else if (state.longPress.opacity > 0) {
          // Fade out
          state.longPress.opacity -= 0.05;
          drawStyledText(
            ctx,
            'Sorry',
            state.longPress.x,
            state.longPress.y - 30,
            42,
            'moonlight_glow',
            state.longPress.opacity,
            state.time,
            true
          );
        }

        // 7. DRAW MAIN CENTRAL ELEMENT (IF TOGGLED ON)
        if (showCentralText) {
          const centerY = h / 2;
          const centerX = w / 2;
          
          // Add organic breathing movement to size and position
          const breathScale = 1.0 + Math.sin(state.time * 1.8) * 0.04;
          const breathSize = centralTextSize * breathScale;
          const floatY = centerY + Math.sin(state.time * 0.8) * 12;

          drawStyledText(
            ctx,
            'Sorry',
            centerX,
            floatY,
            breathSize,
            typographyStyle,
            0.95,
            state.time,
            true
          );
        }

        animationId = requestAnimationFrame(renderLoop);
      };

      animationId = requestAnimationFrame(renderLoop);

      return () => {
        cancelAnimationFrame(animationId);
      };
    }, [activeScene, typographyStyle, centralTextSize, showCentralText]);

    // Draw the ambient landscape background based on the selected scene
    const drawSceneBackground = (
      ctx: CanvasRenderingContext2D,
      scene: SceneType,
      w: number,
      h: number,
      time: number
    ) => {
      ctx.save();
      
      const grad = ctx.createLinearGradient(0, 0, 0, h);

      switch (scene) {
        case 'drifting_snow':
          // Cold deep winter sky
          grad.addColorStop(0, '#0f172a'); // slate-900
          grad.addColorStop(0.6, '#1e293b'); // slate-800
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'starry_night':
          // Midnight navy-black
          grad.addColorStop(0, '#020617'); // slate-950
          grad.addColorStop(0.5, '#090d16');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'whispering_clouds':
          // Soft misty dawn slate-gray
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(0.5, '#334155');
          grad.addColorStop(1, '#1e293b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'rainfall_reflection':
          // Dark moody slate rainstorm
          grad.addColorStop(0, '#090d16');
          grad.addColorStop(0.6, '#0f172a');
          grad.addColorStop(1, '#090d16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'floating_feathers':
          // Intimate charcoal warm-grey
          grad.addColorStop(0, '#111827'); // gray-900
          grad.addColorStop(0.6, '#1f2937'); // gray-800
          grad.addColorStop(1, '#111827');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'rose_petals':
          // Velvet maroon-burgundy dark rose shadows
          grad.addColorStop(0, '#18020c'); 
          grad.addColorStop(0.5, '#2d0517'); 
          grad.addColorStop(1, '#18020c');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'firefly_glow':
          // Enchanted midnight summer forest deep green-black
          grad.addColorStop(0, '#02120e'); 
          grad.addColorStop(0.5, '#05231c'); 
          grad.addColorStop(1, '#02120e');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'butterfly_trails':
          // Magical violet deep dream space
          grad.addColorStop(0, '#120224');
          grad.addColorStop(0.5, '#1e0436');
          grad.addColorStop(1, '#120224');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'candle_smoke':
          // Intimate flickering warm candle flame background
          grad.addColorStop(0, '#0c0702');
          grad.addColorStop(0.5, '#1a0f05');
          grad.addColorStop(1, '#0c0702');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'water_ripples':
          // Ambient deep clear lake water
          grad.addColorStop(0, '#031424');
          grad.addColorStop(0.5, '#06263f');
          grad.addColorStop(1, '#031424');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'calligraphy_balloons':
          // Sunset pink-lavender dusky gradient
          grad.addColorStop(0, '#1e111c');
          grad.addColorStop(0.5, '#351d32');
          grad.addColorStop(1, '#1e111c');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'light_rays':
          // Volumetric forest glow rays
          grad.addColorStop(0, '#090d16');
          grad.addColorStop(0.6, '#131927');
          grad.addColorStop(1, '#090d16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Draw permanent volumetric god rays streaming from top-left
          ctx.fillStyle = 'rgba(253, 251, 243, 0.04)';
          ctx.beginPath();
          ctx.moveTo(-100, -100);
          ctx.lineTo(w * 0.35, h + 100);
          ctx.lineTo(w * 0.75, h + 100);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(253, 251, 243, 0.02)';
          ctx.beginPath();
          ctx.moveTo(-100, -100);
          ctx.lineTo(w * 0.1, h + 100);
          ctx.lineTo(w * 0.45, h + 100);
          ctx.closePath();
          ctx.fill();
          break;

        case 'reflecting_shards':
          // Deep digital abstract obsidian glass
          grad.addColorStop(0, '#08080c');
          grad.addColorStop(0.5, '#12121c');
          grad.addColorStop(1, '#08080c');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'wind_whispers':
          // Soft cyan slate flowing wind aura
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#111c2e');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;
      }

      ctx.restore();
    };

    // Drawing individual particle depending on its active scene
    const drawSceneParticle = (
      ctx: CanvasRenderingContext2D,
      p: Particle,
      currentX: number,
      time: number
    ) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;

      switch (activeScene) {
        case 'drifting_snow': {
          // Thousands of softly glowing Sorry words drifting like snow
          ctx.font = `${p.size}px 'Great Vibes', cursive`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = p.size > 18 ? 10 : 3;
          ctx.fillText('Sorry', currentX, p.y);
          
          // Draw occasional small snow circle for depth
          ctx.beginPath();
          ctx.arc(currentX - 10, p.y - 10, p.size * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
          break;
        }

        case 'starry_night': {
          // Shinier pulsing star sparkles
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = p.size * 3;
          ctx.fillStyle = p.color;
          
          // Draw custom star cross diamond shape
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size / 3, p.y - p.size / 3);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x + p.size / 3, p.y + p.size / 3);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size / 3, p.y + p.size / 3);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.lineTo(p.x - p.size / 3, p.y - p.size / 3);
          ctx.closePath();
          ctx.fill();

          // If star carries Sorry text, draw it very small and faint
          if (p.text && p.size > 2.2) {
            ctx.font = `8px 'Space Grotesk', sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.textAlign = 'center';
            ctx.fillText('Sorry', p.x, p.y + 12);
          }
          break;
        }

        case 'whispering_clouds': {
          // Fluffy clouds reshaped slowly into Sorry
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(currentX, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.arc(currentX + p.size * 0.3, p.y - p.size * 0.1, p.size * 0.3, 0, Math.PI * 2);
          ctx.arc(currentX - p.size * 0.3, p.y + p.size * 0.05, p.size * 0.3, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();

          // Write Sorry centered in the clouds as if the cloud is reshaped
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.textAlign = 'center';
          ctx.font = `italic ${p.size * 0.22}px 'Great Vibes', cursive`;
          ctx.fillText('Sorry', currentX, p.y);
          break;
        }

        case 'rainfall_reflection': {
          // Raindrops briefly revealing Sorry as they fall
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5); // long raindrop streak
          ctx.stroke();

          // Reveal "Sorry" text trailing behind larger drops
          if (p.size > 9) {
            ctx.font = `italic ${p.size}px 'Sacramento', cursive`;
            ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
            ctx.fillText('Sorry', p.x - 22, p.y - 12);
          }
          break;
        }

        case 'floating_feathers': {
          // Feathers with handwritten Sorry
          ctx.translate(currentX, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);

          const r = p.size;
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          
          // Draw simple graceful feather curve
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(r * 0.3, 0, 0, r);
          ctx.stroke();

          // Draw barbs / hairs
          ctx.lineWidth = 0.4;
          for (let i = -r + 4; i < r - 4; i += 3) {
            const ratio = i / r;
            const barbLen = (1 - Math.abs(ratio)) * r * 0.6;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(barbLen, i - 4);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(-barbLen, i - 4);
            ctx.stroke();
          }

          // Write delicate handwritten Sorry on it
          ctx.font = `${p.size * 0.5}px 'Sacramento', cursive`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText('Sorry', r * 0.2, 0);
          break;
        }

        case 'rose_petals': {
          // Rose petals carrying tiny Sorry
          ctx.translate(currentX, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);

          const r = p.size;
          ctx.fillStyle = p.color;
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 4;
          
          // Draw organic heart/drop shape for rose petal
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo(r * 0.8, -r, r, r * 0.4, 0, r);
          ctx.bezierCurveTo(-r, r * 0.4, -r * 0.8, -r, 0, -r);
          ctx.closePath();
          ctx.fill();

          // Tiny sorry written inside
          ctx.font = `${p.size * 0.38}px 'Great Vibes', cursive`;
          ctx.fillStyle = 'rgba(255, 241, 242, 0.8)'; // rose cream gold
          ctx.fillText('Sorry', 0, -r * 0.1);
          break;
        }

        case 'firefly_glow': {
          // Fireflies whose glow briefly forms Sorry
          ctx.beginPath();
          ctx.arc(currentX, p.y, p.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.size * 1.5;
          ctx.fill();

          // A faint glow aura containing "Sorry"
          if (p.size > 8) {
            ctx.font = `italic 9px 'Great Vibes', cursive`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fillText('Sorry', currentX, p.y - 12);
          }
          break;
        }

        case 'butterfly_trails': {
          // Butterflies leaving sparkling trails
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);

          // Draw folding flapping wings (using sin of time)
          const flap = Math.sin(time * 15 + p.id);
          const r = p.size;
          
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = r * 0.6;

          // Left wing
          ctx.beginPath();
          ctx.ellipse(-r * 0.5, 0, r * 0.6 * Math.abs(flap), r, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Right wing
          ctx.beginPath();
          ctx.ellipse(r * 0.5, 0, r * 0.6 * Math.abs(flap), r, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Butterfly body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, 1.5, r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw the trail of butterfly
          ctx.restore(); // escape local translate before drawing trails
          ctx.save();
          if (p.trail && p.trail.length > 0) {
            p.trail.forEach((tPt, idx) => {
              const alpha = (idx / p.trail!.length) * 0.5 * p.opacity;
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 4;
              ctx.font = '7px Space Grotesk';
              ctx.fillText('Sorry', tPt.x, tPt.y);
            });
          }
          break;
        }

        case 'candle_smoke': {
          // Smoke from candles curling into Sorry
          ctx.font = `italic ${p.size}px 'Great Vibes', cursive`;
          ctx.fillStyle = p.color;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
          ctx.shadowBlur = 5;
          ctx.fillText('Sorry', currentX, p.y);
          break;
        }

        case 'water_ripples': {
          // Ripples that momentarily spell Sorry
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          
          // Draw wave ripple ellipse
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();

          // In the center of ripple, write fading Sorry
          ctx.font = `normal ${12 + p.size * 0.08}px 'Dancing Script', cursive`;
          ctx.fillStyle = `rgba(224, 242, 254, ${p.opacity})`;
          ctx.fillText('Sorry', p.x, p.y);
          break;
        }

        case 'calligraphy_balloons': {
          // Floating balloons with elegant Sorry calligraphy
          ctx.translate(currentX, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);

          const r = p.size;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;

          // Draw balloon oval
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw balloon knot triangle
          ctx.beginPath();
          ctx.moveTo(0, r);
          ctx.lineTo(-4, r + 6);
          ctx.lineTo(4, r + 6);
          ctx.closePath();
          ctx.fill();

          // Write elegant sorry calligraphy inside
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${p.size * 0.42}px 'Great Vibes', cursive`;
          ctx.fillText('Sorry', 0, -2);

          // Draw dangling line string
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, r + 6);
          ctx.quadraticCurveTo(Math.sin(time * 3) * 6, r + 20, Math.sin(time * 2) * 3, r + 45);
          ctx.stroke();
          break;
        }

        case 'light_rays': {
          // Light rays revealing hidden Sorry text
          // Ray area detection: coordinates match general stream of godray
          const inRay1 = p.x < p.y * 0.65 + 100 && p.x > p.y * 0.35 - 100;
          const inRay2 = p.x < p.y * 0.45 + 50 && p.x > p.y * 0.1 - 50;
          
          if (inRay1 || inRay2) {
            // brighten up inside ray
            p.opacity = Math.min(0.65, p.opacity + 0.02);
            ctx.shadowColor = '#fffbeb';
            ctx.shadowBlur = 8;
          } else {
            // dim down outside ray
            p.opacity = Math.max(0.08, p.opacity - 0.01);
          }

          ctx.font = `${p.size}px 'Great Vibes', cursive`;
          ctx.fillStyle = `rgba(254, 243, 199, ${p.opacity})`; // amber cream
          ctx.fillText('Sorry', currentX, p.y);
          break;
        }

        case 'reflecting_shards': {
          // Glass shards reflecting Sorry
          ctx.translate(currentX, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);

          const r = p.size;
          
          // Shard face reflection sheen (sin calculation on rotation)
          const reflectionGleam = Math.abs(Math.sin(p.rotation! + time * 1.5));
          
          // Draw glass shard outline / polygon
          ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + reflectionGleam * 0.15})`;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.5);
          ctx.lineTo(r * 0.4, r * 0.2);
          ctx.lineTo(-r * 0.3, r * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Reflect Sorry when gleam is high
          if (reflectionGleam > 0.65) {
            ctx.font = `italic ${p.size * 0.35}px 'Playfair Display', serif`;
            ctx.fillStyle = `rgba(212, 175, 55, ${(reflectionGleam - 0.65) * 2})`; // reflect gold sorry!
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 5;
            ctx.fillText('Sorry', 0, 0);
          }
          break;
        }

        case 'wind_whispers': {
          // Wind particles carrying translucent Sorry text on ribbon lines
          ctx.restore(); // escape local translate
          ctx.save();

          // Render ribbon line
          if (p.trail && p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.1)';
            ctx.lineWidth = p.size * 0.3;
            ctx.stroke();
          }

          // Render floating sorry along path
          ctx.font = `italic ${p.size}px 'Sacramento', cursive`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.shadowColor = '#bae6fd';
          ctx.shadowBlur = 4;
          ctx.fillText('Sorry', p.x, p.y + Math.sin(time * 5) * 10);
          break;
        }
      }

      ctx.restore();
    };

    // Draw Constellation Star Lines for Starry Night Sky
    const drawStarConstellations = (
      ctx: CanvasRenderingContext2D,
      stars: Particle[],
      w: number,
      h: number,
      time: number
    ) => {
      // Find 12 star coordinates that we'll dynamically link to spell "Sorry" in the sky
      // We can map these positions relative to center of sky
      const centerX = w / 2;
      const centerY = h * 0.3; // upper sky

      // Constellation stroke coordinates of letters S-O-R-R-Y
      const size = Math.min(w, h) * 0.12;

      const constellations = [
        // S
        [
          { x: centerX - size * 2.2, y: centerY - size * 0.4 },
          { x: centerX - size * 2.6, y: centerY - size * 0.4 },
          { x: centerX - size * 2.6, y: centerY - size * 0.1 },
          { x: centerX - size * 2.2, y: centerY + size * 0.1 },
          { x: centerX - size * 2.2, y: centerY + size * 0.4 },
          { x: centerX - size * 2.6, y: centerY + size * 0.4 },
        ],
        // o
        [
          { x: centerX - size * 1.5, y: centerY + size * 0.1 },
          { x: centerX - size * 1.2, y: centerY - size * 0.2 },
          { x: centerX - size * 0.9, y: centerY + size * 0.1 },
          { x: centerX - size * 1.2, y: centerY + size * 0.4 },
          { x: centerX - size * 1.5, y: centerY + size * 0.1 },
        ],
        // r
        [
          { x: centerX - size * 0.4, y: centerY + size * 0.4 },
          { x: centerX - size * 0.4, y: centerY - size * 0.1 },
          { x: centerX - size * 0.2, y: centerY - size * 0.2 },
          { x: centerX + size * 0.1, y: centerY - size * 0.1 },
        ],
        // r
        [
          { x: centerX + size * 0.6, y: centerY + size * 0.4 },
          { x: centerX + size * 0.6, y: centerY - size * 0.1 },
          { x: centerX + size * 0.8, y: centerY - size * 0.2 },
          { x: centerX + size * 1.1, y: centerY - size * 0.1 },
        ],
        // y
        [
          { x: centerX + size * 1.6, y: centerY - size * 0.1 },
          { x: centerX + size * 1.8, y: centerY + size * 0.2 },
          { x: centerX + size * 2.0, y: centerY - size * 0.1 },
          { x: centerX + size * 1.8, y: centerY + size * 0.2 },
          { x: centerX + size * 1.6, y: centerY + size * 0.5 },
          { x: centerX + size * 1.3, y: centerY + size * 0.5 },
        ],
      ];

      ctx.save();
      // Draw very soft glowing connecting lines for constellations
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + Math.sin(time * 2) * 0.04})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#bae6fd';
      ctx.shadowBlur = 3;

      const scaleNodeX = (val: number) => val + Math.sin(time + val) * 2;
      const scaleNodeY = (val: number) => val + Math.cos(time + val) * 2;

      constellations.forEach((letter) => {
        ctx.beginPath();
        ctx.moveTo(scaleNodeX(letter[0].x), scaleNodeY(letter[0].y));
        for (let i = 1; i < letter.length; i++) {
          ctx.lineTo(scaleNodeX(letter[i].x), scaleNodeY(letter[i].y));
        }
        ctx.stroke();

        // Draw small gold glowing stars at each joint of constellation
        letter.forEach((node) => {
          const nodX = scaleNodeX(node.x);
          const nodY = scaleNodeY(node.y);
          ctx.fillStyle = '#fef08a'; // gold star node
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(nodX, nodY, 1.8 + Math.sin(time * 3 + nodX) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Write Starry Constellation Title very softly above
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.sin(time) * 0.05})`;
      ctx.font = '10px Space Grotesk';
      ctx.letterSpacing = '4px';
      ctx.textAlign = 'center';
      ctx.fillText('STARS ALIGN AS ONE', centerX, centerY - size * 0.9);

      ctx.restore();
    };

    // USER INTERACTION EVENT HANDLERS
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      stateRef.current.mouse.isDown = true;
      stateRef.current.mouse.downTime = Date.now();
      stateRef.current.mouse.x = x;
      stateRef.current.mouse.y = y;

      // Click burst
      createBurst(x, y, 22);
      
      // Start long press check timer
      stateRef.current.longPress.x = x;
      stateRef.current.longPress.y = y;
      stateRef.current.longPress.active = false;
      stateRef.current.longPress.duration = 0;

      if (onTapEffect) {
        onTapEffect(x, y);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const state = stateRef.current;
      state.mouse.px = state.mouse.x;
      state.mouse.py = state.mouse.y;
      state.mouse.x = x;
      state.mouse.y = y;

      if (state.mouse.isDown) {
        // Dragging triggers tiny swipe trails
        const dist = Math.sqrt(Math.pow(x - state.mouse.px, 2) + Math.pow(y - state.mouse.py, 2));
        if (dist > 8) {
          state.trailParticles.push({
            id: getNextId(),
            x,
            y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.2 - Math.random() * 0.4,
            size: 10 + Math.random() * 8,
            opacity: 0.85,
            text: 'Sorry',
            color: 'rgba(255, 255, 255, 0.8)',
            life: 0,
            maxLife: 20 + Math.floor(Math.random() * 20),
          });
          // Limit total swipe particles
          if (state.trailParticles.length > 50) state.trailParticles.shift();
        }
      }

      // Check if long pressing
      if (state.mouse.isDown && Date.now() - state.mouse.downTime > 350) {
        state.longPress.active = true;
        state.longPress.x = x;
        state.longPress.y = y;
      }
    };

    const handleMouseUpOrLeave = () => {
      stateRef.current.mouse.isDown = false;
      stateRef.current.longPress.active = false;
    };

    // Mobile touch controls mapped to mouse events
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 0) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      const state = stateRef.current;
      state.mouse.isDown = true;
      state.mouse.downTime = Date.now();
      state.mouse.x = x;
      state.mouse.y = y;

      createBurst(x, y, 22);

      state.longPress.x = x;
      state.longPress.y = y;
      state.longPress.active = false;
      state.longPress.duration = 0;

      if (onTapEffect) {
        onTapEffect(x, y);
      }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 0) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      const state = stateRef.current;
      state.mouse.px = state.mouse.x;
      state.mouse.py = state.mouse.y;
      state.mouse.x = x;
      state.mouse.y = y;

      const dist = Math.sqrt(Math.pow(x - state.mouse.px, 2) + Math.pow(y - state.mouse.py, 2));
      if (dist > 8) {
        state.trailParticles.push({
          id: getNextId(),
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.2 - Math.random() * 0.4,
          size: 10 + Math.random() * 8,
          opacity: 0.85,
          text: 'Sorry',
          color: 'rgba(255, 255, 255, 0.8)',
          life: 0,
          maxLife: 20 + Math.floor(Math.random() * 20),
        });
        if (state.trailParticles.length > 50) state.trailParticles.shift();
      }

      if (Date.now() - state.mouse.downTime > 350) {
        state.longPress.active = true;
        state.longPress.x = x;
        state.longPress.y = y;
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.mouse.isDown = false;
      stateRef.current.longPress.active = false;
    };

    return (
      <div className="relative w-full h-full overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 block w-full h-full cursor-crosshair"
          id="canvas-renderer"
        />
        {isDeviceMotionSupported && (
          <div className="absolute right-4 bottom-4 font-mono text-[10px] text-white/30 bg-black/20 px-2 py-1 rounded select-none pointer-events-none uppercase tracking-widest hidden md:block">
            Accelerometer active • Shake to Rise
          </div>
        )}
      </div>
    );
  }
);
