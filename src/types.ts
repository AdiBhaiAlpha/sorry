export type SceneType =
  | 'drifting_snow'
  | 'starry_night'
  | 'whispering_clouds'
  | 'rainfall_reflection'
  | 'floating_feathers'
  | 'rose_petals'
  | 'firefly_glow'
  | 'butterfly_trails'
  | 'candle_smoke'
  | 'water_ripples'
  | 'calligraphy_balloons'
  | 'light_rays'
  | 'reflecting_shards'
  | 'wind_whispers';

export type TypographyStyle =
  | 'handwritten_ink'
  | 'watercolor'
  | 'gold_foil'
  | 'soft_neon'
  | 'frosted_glass'
  | 'white_chalk'
  | 'pencil_sketch'
  | 'embossed_paper'
  | 'moonlight_glow'
  | 'transparent_crystal';

export interface SceneDefinition {
  id: SceneType;
  name: string;
  description: string;
  icon: string; // lucide icon name
  primaryColor: string;
  secondaryColor: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  text: string;
  color: string;
  rotation?: number;
  vRotation?: number;
  life?: number;
  maxLife?: number;
  scale?: number;
  pulseSpeed?: number;
  pulsePhase?: number;
  trail?: { x: number; y: number }[];
  wiggleSpeed?: number;
  wiggleAmplitude?: number;
  wigglePhase?: number;
  styleParams?: any;
}
