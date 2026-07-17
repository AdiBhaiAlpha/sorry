import React, { useState } from 'react';
import {
  Snowflake,
  Moon,
  Cloud,
  Droplets,
  Feather,
  Flower,
  Sparkles,
  Flame,
  Waves,
  Heart,
  Sun,
  Gem,
  Wind,
  Volume2,
  VolumeX,
  Sparkle,
  MessageCircleCode,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Music4
} from 'lucide-react';
import { SceneDefinition, SceneType, TypographyStyle } from '../types';

interface ControlPanelProps {
  activeScene: SceneType;
  setActiveScene: (scene: SceneType) => void;
  typographyStyle: TypographyStyle;
  setTypographyStyle: (style: TypographyStyle) => void;
  showCentralText: boolean;
  setShowCentralText: (show: boolean) => void;
  centralTextSize: number;
  setCentralTextSize: (size: number) => void;
  onReleaseLanterns: () => void;
  onTriggerBurst: () => void;
  onTriggerWhisper: () => void;
  audioState: {
    isPlaying: boolean;
    master: number;
    rain: number;
    wind: number;
    piano: number;
    whisper: number;
  };
  onToggleAudio: () => void;
  onUpdateVolume: (type: 'master' | 'rain' | 'wind' | 'piano' | 'whisper', val: number) => void;
}

export const SCENE_LIST: SceneDefinition[] = [
  {
    id: 'drifting_snow',
    name: 'Drifting Snow',
    description: 'Thousands of softly glowing "Sorry" words drifting like snow in a silent forest.',
    icon: 'Snowflake',
    primaryColor: '#bae6fd',
    secondaryColor: '#38bdf8',
  },
  {
    id: 'starry_night',
    name: 'Starry Sky',
    description: 'Gazing into a deep sky where constellation lines align to write "Sorry" in the stars.',
    icon: 'Moon',
    primaryColor: '#fef08a',
    secondaryColor: '#eab308',
  },
  {
    id: 'whispering_clouds',
    name: 'Misty Clouds',
    description: 'Slow, majestic fluffy clouds that gently reshape and reform into the word "Sorry".',
    icon: 'Cloud',
    primaryColor: '#f1f5f9',
    secondaryColor: '#cbd5e1',
  },
  {
    id: 'rainfall_reflection',
    name: 'Tears of Rain',
    description: 'Slick slanted raindrops falling rapidly, briefly revealing "Sorry" as they strike the glass.',
    icon: 'Droplets',
    primaryColor: '#7dd3fc',
    secondaryColor: '#0284c7',
  },
  {
    id: 'floating_feathers',
    name: 'Feather Drift',
    description: 'Soft, weightless feathers spinning lazily, carrying delicate handwritten "Sorry" marks.',
    icon: 'Feather',
    primaryColor: '#fafafa',
    secondaryColor: '#e4e4e7',
  },
  {
    id: 'rose_petals',
    name: 'Crimson Rose',
    description: 'Deep red rose petals tumbling down, bearing tiny handwritten messages of apology.',
    icon: 'Flower',
    primaryColor: '#f43f5e',
    secondaryColor: '#be123c',
  },
  {
    id: 'firefly_glow',
    name: 'Fireflies Glow',
    description: 'Greenish gold fireflies drifting in summer darkness, whose pulse briefly spells "Sorry".',
    icon: 'Sparkles',
    primaryColor: '#a3e635',
    secondaryColor: '#65a30d',
  },
  {
    id: 'butterfly_trails',
    name: 'Butterfly Trails',
    description: 'Magic butterflies flapping gracefully, leaving sparkling trails of "Sorry" dust.',
    icon: 'Wind',
    primaryColor: '#c084fc',
    secondaryColor: '#7e22ce',
  },
  {
    id: 'candle_smoke',
    name: 'Candle Smoke',
    description: 'Rising smoke from warm candles curling and twisting into the elegant word "Sorry".',
    icon: 'Flame',
    primaryColor: '#fed7aa',
    secondaryColor: '#ea580c',
  },
  {
    id: 'water_ripples',
    name: 'Water Ripples',
    description: 'Concentric ripples spreading across a deep lake, momentarily spelling out "Sorry".',
    icon: 'Waves',
    primaryColor: '#a5f3fc',
    secondaryColor: '#0891b2',
  },
  {
    id: 'calligraphy_balloons',
    name: 'Apology Balloons',
    description: 'Warm rosy balloons carrying beautiful elegant "Sorry" calligraphy floating skyward.',
    icon: 'Heart',
    primaryColor: '#fbcfe8',
    secondaryColor: '#db2777',
  },
  {
    id: 'light_rays',
    name: 'Golden Rays',
    description: 'Shining god rays revealing hidden floating "Sorry" elements like dust in the light.',
    icon: 'Sun',
    primaryColor: '#fef3c7',
    secondaryColor: '#d97706',
  },
  {
    id: 'reflecting_shards',
    name: 'Glass Shards',
    description: 'Shattered crystal shards spinning slowly, catching light to flash golden reflections.',
    icon: 'Gem',
    primaryColor: '#e2e8f0',
    secondaryColor: '#94a3b8',
  },
  {
    id: 'wind_whispers',
    name: 'Wind Currents',
    description: 'Bending streams of wind carrying translucent, stretched glowing "Sorry" text particles.',
    icon: 'Wind',
    primaryColor: '#bae6fd',
    secondaryColor: '#0ea5e9',
  }
];

export const TYPOGRAPHY_LIST = [
  { id: 'handwritten_ink', name: 'Handwritten Ink', desc: 'Dark cursive ink smudge' },
  { id: 'watercolor', name: 'Watercolor', desc: 'Bleeding pastel rose & violet layers' },
  { id: 'gold_foil', name: 'Gold Foil', desc: 'Shiny metallic gold with bright glint' },
  { id: 'soft_neon', name: 'Soft Neon Glow', desc: 'Bright white core with pink/cyan aura' },
  { id: 'frosted_glass', name: 'Frosted Glass', desc: 'Semi-transparent card with crisp outline' },
  { id: 'white_chalk', name: 'White Chalk', desc: 'Sketchy jitter layers of chalk' },
  { id: 'pencil_sketch', name: 'Pencil Sketch', desc: 'Thin graphite cross-hatching look' },
  { id: 'embossed_paper', name: 'Embossed Paper', desc: 'Carved 3D indent shadow effect' },
  { id: 'moonlight_glow', name: 'Moonlight Glow', desc: 'Serene glowing pale moonlight blue' },
  { id: 'transparent_crystal', name: 'Crystal Glass', desc: 'Water-like transparency with sparkles' }
];

const IconMapper: { [key: string]: React.ComponentType<any> } = {
  Snowflake,
  Moon,
  Cloud,
  Droplets,
  Feather,
  Flower,
  Sparkles,
  Flame,
  Waves,
  Heart,
  Sun,
  Gem,
  Wind
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeScene,
  setActiveScene,
  typographyStyle,
  setTypographyStyle,
  showCentralText,
  setShowCentralText,
  centralTextSize,
  setCentralTextSize,
  onReleaseLanterns,
  onTriggerBurst,
  onTriggerWhisper,
  audioState,
  onToggleAudio,
  onUpdateVolume
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'typography' | 'sound' | 'interact'>('scenes');
  const [isMinimized, setIsMinimized] = useState(false);

  const renderIcon = (iconName: string, color: string) => {
    const Component = IconMapper[iconName] || Sparkles;
    return <Component size={18} style={{ color }} />;
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white/80 hover:bg-black/60 hover:text-white transition-all shadow-lg shadow-black/40 group active:scale-95"
        id="btn-restore-panel"
      >
        <Maximize2 size={16} className="text-sky-400 group-hover:rotate-45 transition-transform" />
        <span className="text-xs uppercase tracking-widest font-sans font-medium">Show Controls</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-6 right-6 md:right-auto md:w-[420px] z-50 backdrop-blur-xl bg-black/55 border border-white/10 rounded-2xl shadow-2xl shadow-black/70 flex flex-col overflow-hidden max-h-[80vh] md:max-h-[550px] transition-all"
      id="control-panel"
    >
      {/* PANEL HEADER */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="text-sm font-sans font-semibold tracking-wider text-slate-100 uppercase">
            Ocean Settings
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded-lg border transition-all ${
              audioState.isPlaying
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
            title={audioState.isPlaying ? 'Mute Audio' : 'Play Soundscape'}
            id="btn-toggle-sound"
          >
            {audioState.isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Minimize Panel"
            id="btn-minimize-panel"
          >
            <Minimize2 size={15} />
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-white/5 text-xs font-sans">
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex-1 py-3 text-center transition-all border-b ${
            activeTab === 'scenes'
              ? 'border-sky-400 text-sky-400 font-medium bg-white/2'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
          id="tab-scenes"
        >
          Atmosphere
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`flex-1 py-3 text-center transition-all border-b ${
            activeTab === 'typography'
              ? 'border-sky-400 text-sky-400 font-medium bg-white/2'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
          id="tab-typography"
        >
          Typography
        </button>
        <button
          onClick={() => setActiveTab('sound')}
          className={`flex-1 py-3 text-center transition-all border-b ${
            activeTab === 'sound'
              ? 'border-sky-400 text-sky-400 font-medium bg-white/2'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
          id="tab-sound"
        >
          Soundscape
        </button>
        <button
          onClick={() => setActiveTab('interact')}
          className={`flex-1 py-3 text-center transition-all border-b ${
            activeTab === 'interact'
              ? 'border-sky-400 text-sky-400 font-medium bg-white/2'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
          id="tab-interact"
        >
          Triggers
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* SCENES TAB */}
        {activeTab === 'scenes' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-400/80 mb-3 leading-relaxed font-sans">
              Choose an ambient landscape filled with animated expressions of apology.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SCENE_LIST.map((scene) => {
                const isActive = activeScene === scene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={`flex items-start text-left p-2.5 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                      isActive
                        ? 'bg-sky-500/10 border-sky-400/40 text-white shadow-md'
                        : 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/6 hover:border-white/10'
                    }`}
                    id={`scene-btn-${scene.id}`}
                  >
                    <div className="flex items-center justify-center p-2 rounded-lg bg-black/40 mr-3 mt-0.5 border border-white/5 group-hover:scale-105 transition-transform">
                      {renderIcon(scene.icon, scene.primaryColor)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium font-sans">{scene.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {scene.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/3 border border-white/5 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Central "Sorry" Title</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle the floating center text</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCentralText}
                  onChange={(e) => setShowCentralText(e.target.checked)}
                  className="sr-only peer"
                  id="toggle-central-text"
                />
                <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>

            {showCentralText && (
              <div className="space-y-3 bg-white/2 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Text Size ({centralTextSize}px)</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="130"
                  value={centralTextSize}
                  onChange={(e) => setCentralTextSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  id="slider-text-size"
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block mb-2">Artistic Styles</span>
              <div className="grid grid-cols-2 gap-2">
                {TYPOGRAPHY_LIST.map((style) => {
                  const isActive = typographyStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setTypographyStyle(style.id as TypographyStyle)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-500/15 border-sky-400/40 text-white'
                          : 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/6 hover:border-white/10'
                      }`}
                      id={`typo-btn-${style.id}`}
                    >
                      <span className="text-xs font-medium font-sans truncate">{style.name}</span>
                      <span className="text-[9px] text-slate-400/80 mt-0.5 leading-tight line-clamp-1">
                        {style.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SOUNDSCAPE TAB */}
        {activeTab === 'sound' && (
          <div className="space-y-4">
            {!audioState.isPlaying ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-center space-y-2.5">
                <p className="text-xs text-amber-300 leading-relaxed">
                  Autoplay is blocked by default. Tap the button below to activate the immersive soundscape.
                </p>
                <button
                  onClick={onToggleAudio}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-sans font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 mx-auto"
                  id="btn-activate-audio"
                >
                  <Music4 size={14} />
                  Enable Soundscape
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 bg-white/2 border border-white/5 p-3 rounded-xl">
                {/* MASTER */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Master Volume</span>
                    <span className="text-[10px] text-slate-500">{Math.round(audioState.master * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.master}
                    onChange={(e) => onUpdateVolume('master', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    id="slider-vol-master"
                  />
                </div>

                {/* PIANO */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Soft Piano Melodies</span>
                    <span className="text-[10px] text-slate-500">{Math.round(audioState.piano * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.piano}
                    onChange={(e) => onUpdateVolume('piano', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    id="slider-vol-piano"
                  />
                </div>

                {/* RAIN */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Ambient Rain</span>
                    <span className="text-[10px] text-slate-500">{Math.round(audioState.rain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.rain}
                    onChange={(e) => onUpdateVolume('rain', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    id="slider-vol-rain"
                  />
                </div>

                {/* WIND */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Whispering Wind</span>
                    <span className="text-[10px] text-slate-500">{Math.round(audioState.wind * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.wind}
                    onChange={(e) => onUpdateVolume('wind', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    id="slider-vol-wind"
                  />
                </div>

                {/* WHISPER */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Voice Whisper</span>
                    <span className="text-[10px] text-slate-500">{Math.round(audioState.whisper * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.whisper}
                    onChange={(e) => onUpdateVolume('whisper', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    id="slider-vol-whisper"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERACTION TRIGGERS */}
        {activeTab === 'interact' && (
          <div className="space-y-3.5">
            <p className="text-[11px] text-slate-400/80 mb-3 leading-relaxed font-sans">
              Experience dynamic interactive motions that burst and release apologetic lights.
            </p>

            {/* LANTERNS */}
            <button
              onClick={onReleaseLanterns}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 text-left hover:bg-white/6 hover:border-white/10 active:scale-98 transition-all group"
              id="btn-trigger-lanterns"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                  Release Apology Lanterns
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Simulate shake to send hundreds of lights floating skyward
                </p>
              </div>
              <Sparkles size={16} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            </button>

            {/* BURST */}
            <button
              onClick={onTriggerBurst}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 text-left hover:bg-white/6 hover:border-white/10 active:scale-98 transition-all group"
              id="btn-trigger-burst"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                  Tap Sparkle Bloom
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Bloom a burst of dozens of glowing "Sorry" particles from screen center
                </p>
              </div>
              <Sparkle size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* WHISPER */}
            <button
              onClick={onTriggerWhisper}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 text-left hover:bg-white/6 hover:border-white/10 active:scale-98 transition-all group"
              id="btn-trigger-whisper"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                  Hear Apology Whisper
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Trigger a gentle, low-volume speech synthesis saying "I'm sorry"
                </p>
              </div>
              <MessageCircleCode size={16} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* TIP info */}
            <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Touch gestures on canvas:
              </span>
              <ul className="text-[9.5px] text-slate-400/90 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-300">Single Tap:</strong> Blooms dozens of glowing "Sorry" words</li>
                <li><strong className="text-slate-300">Swipe/Drag:</strong> "Sorry" sparks trail along your finger/cursor</li>
                <li><strong className="text-slate-300">Long Press:</strong> A large, glowing "Sorry" appears and slowly fades</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-white/5 bg-black/40 text-[9.5px] text-slate-500 font-sans flex items-center justify-between">
        <span>Infinite Ocean of "Sorry"</span>
        <span>Procedural WebGL Rendering</span>
      </div>
    </div>
  );
};
