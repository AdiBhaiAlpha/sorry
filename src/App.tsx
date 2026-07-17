import React, { useState, useEffect, useRef } from 'react';
import { SceneRenderer, SceneRendererRef } from './components/SceneRenderer';
import { ControlPanel, SCENE_LIST } from './components/ControlPanel';
import { SceneType, TypographyStyle } from './types';
import { globalAudio } from './lib/AudioEngine';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Maximize2,
  HelpCircle,
  X,
  Sparkles,
  Info,
  Compass
} from 'lucide-react';

export default function App() {
  const rendererRef = useRef<SceneRendererRef>(null);

  // Experience Settings States
  const [activeScene, setActiveScene] = useState<SceneType>('drifting_snow');
  const [typographyStyle, setTypographyStyle] = useState<TypographyStyle>('moonlight_glow');
  const [showCentralText, setShowCentralText] = useState(true);
  const [centralTextSize, setCentralTextSize] = useState(72);
  
  // UI States
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);

  // Audio Engine Mirror States
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    master: 0.5,
    rain: 0.35,
    wind: 0.35,
    piano: 0.5,
    whisper: 0.6,
  });

  // Track cursor inactivity to fade out UI overlays for deep immersion
  const inactivityTimeoutRef = useRef<any>(null);

  const resetInactivityTimer = () => {
    setIsUserActive(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    // Only fade out if panel is visible (if panel is hidden, fade out anyway)
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsUserActive(false);
    }, 6000); // 6 seconds of absolute peace before fading
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);

  // Update sound volumes inside globalAudio
  const handleUpdateVolume = (type: 'master' | 'rain' | 'wind' | 'piano' | 'whisper', value: number) => {
    globalAudio.setVolume(type, value);
    setAudioState((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Toggle master soundscape on/off
  const handleToggleAudio = async () => {
    if (audioState.isPlaying) {
      globalAudio.stop();
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      // Set initial volumes on start
      globalAudio.setVolume('master', audioState.master);
      globalAudio.setVolume('rain', audioState.rain);
      globalAudio.setVolume('wind', audioState.wind);
      globalAudio.setVolume('piano', audioState.piano);
      globalAudio.setVolume('whisper', audioState.whisper);
      
      await globalAudio.start();
      setAudioState((prev) => ({ ...prev, isPlaying: true }));
      setIsIntroOpen(false); // dismiss intro once sound begins
    }
  };

  // Trigger manual interactive actions
  const triggerReleaseLanterns = () => {
    rendererRef.current?.triggerLanternRise();
    // occasionally trigger a subtle chime chord
    if (audioState.isPlaying) {
      globalAudio.playPianoNote(329.63, 4.0, 0.4); // E4 notes of warmth
      setTimeout(() => globalAudio.playPianoNote(493.88, 3.5, 0.3), 150); // B4
    }
  };

  const triggerSparkleBurst = () => {
    rendererRef.current?.triggerBurst();
    if (audioState.isPlaying) {
      globalAudio.playPianoNote(523.25, 2.5, 0.3); // High C5 chord sparkle
      setTimeout(() => globalAudio.playPianoNote(659.25, 2.0, 0.2), 100); // High E5
    }
  };

  const triggerSoftWhisper = () => {
    globalAudio.whisperSorry();
  };

  // Automatic subtle whisper loop (every 25-40 seconds, say "I'm sorry" very softly)
  useEffect(() => {
    let whisperTimer: any;
    
    const scheduleNextWhisper = () => {
      const delay = 25000 + Math.random() * 20000; // random interval
      whisperTimer = setTimeout(() => {
        if (audioState.isPlaying && Math.random() > 0.3) {
          globalAudio.whisperSorry();
        }
        scheduleNextWhisper();
      }, delay);
    };

    if (audioState.isPlaying) {
      scheduleNextWhisper();
    }

    return () => {
      if (whisperTimer) clearTimeout(whisperTimer);
    };
  }, [audioState.isPlaying]);

  const activeSceneInfo = SCENE_LIST.find((s) => s.id === activeScene);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      
      {/* 1. THE FULLSCREEN CANVAS BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <SceneRenderer
          ref={rendererRef}
          activeScene={activeScene}
          typographyStyle={typographyStyle}
          centralTextSize={centralTextSize}
          showCentralText={showCentralText}
          onTapEffect={(x, y) => {
            // Play responsive soft piano sound on user tap
            if (audioState.isPlaying) {
              const notes = [220, 261.63, 329.63, 392.00, 440.00, 523.25]; // A minor pentatonic frequencies
              const randomFreq = notes[Math.floor(Math.random() * notes.length)];
              globalAudio.playPianoNote(randomFreq, 2.5, 0.25);
            }
          }}
        />
      </div>

      {/* 2. CINEMATIC HEADERS & FLOATING UI OVERLAYS (Fades on inactivity) */}
      <div
        className={`absolute inset-0 z-10 flex flex-col justify-between pointer-events-none transition-opacity duration-1000 ${
          isUserActive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* TOP HEADER BAR */}
        <header className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-b from-black/45 to-transparent pointer-events-auto">
          <div className="flex flex-col">
            <h1 className="text-sm font-sans font-medium tracking-[0.25em] text-slate-100 uppercase select-none">
              Infinite Ocean of Sorry
            </h1>
            <p className="text-[10px] font-mono text-slate-400/80 uppercase tracking-widest mt-1">
              Active Scene: {activeSceneInfo?.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2.5 rounded-full bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
              title="Show Concept Guide"
              id="btn-open-help"
            >
              <Info size={15} />
            </button>
            <button
              onClick={() => setIsPanelVisible(!isPanelVisible)}
              className={`p-2.5 rounded-full border transition-all active:scale-95 ${
                isPanelVisible
                  ? 'bg-sky-500/10 border-sky-400/20 text-sky-400'
                  : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title={isPanelVisible ? 'Hide UI Overlay' : 'Show UI Overlay'}
              id="btn-toggle-panel"
            >
              {isPanelVisible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </header>

        {/* CENTER BOTTOM FLOATING INSTRUCTIONS */}
        <div className="w-full text-center pb-8 bg-gradient-to-t from-black/25 to-transparent flex flex-col items-center gap-1">
          <p className="text-[10px] font-mono tracking-[0.18em] text-white/35 uppercase pointer-events-none">
            Interact by tapping, dragging, or long pressing anywhere
          </p>
          {!audioState.isPlaying && (
            <button
              onClick={handleToggleAudio}
              className="mt-2 text-[10px] font-sans font-medium tracking-widest text-emerald-400 hover:text-emerald-300 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full pointer-events-auto active:scale-95 transition-all"
              id="btn-sound-alert"
            >
              🔈 Sound is currently muted • Click to enable
            </button>
          )}
        </div>
      </div>

      {/* 3. SETTINGS CONTROL PANEL */}
      {isPanelVisible && (
        <div className={`transition-all duration-1000 ${isUserActive ? 'opacity-100 pointer-events-auto' : 'opacity-10 pointer-events-none hover:opacity-100 hover:pointer-events-auto'}`}>
          <ControlPanel
            activeScene={activeScene}
            setActiveScene={setActiveScene}
            typographyStyle={typographyStyle}
            setTypographyStyle={setTypographyStyle}
            showCentralText={showCentralText}
            setShowCentralText={setShowCentralText}
            centralTextSize={centralTextSize}
            setCentralTextSize={setCentralTextSize}
            onReleaseLanterns={triggerReleaseLanterns}
            onTriggerBurst={triggerSparkleBurst}
            onTriggerWhisper={triggerSoftWhisper}
            audioState={audioState}
            onToggleAudio={handleToggleAudio}
            onUpdateVolume={handleUpdateVolume}
          />
        </div>
      )}

      {/* 4. MEDITATIVE INTRO SCREEN OVERLAY */}
      {isIntroOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-slate-950/90 transition-opacity duration-700"
          id="modal-intro"
        >
          <div className="max-w-md w-full backdrop-blur-md bg-white/2 border border-white/10 rounded-2xl p-6 md:p-8 text-center space-y-6 shadow-2xl shadow-black">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h2 className="text-xl font-sans font-medium tracking-[0.2em] text-slate-100 uppercase pt-2">
                Infinite Ocean
              </h2>
              <p className="text-xs font-serif italic text-slate-400 tracking-wider">
                "An immersive sanctuary of apology, forgiveness, and soft soundscapes."
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Welcome to a peaceful interactive artwork. Thousands of delicate expressions of
              <strong> "Sorry"</strong> flow like drifting snow, glowing fireflies, starry skies, or soft raindrops.
            </p>

            <div className="space-y-2 text-[11px] text-slate-400 font-mono text-left bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Tap or drag anywhere to create glowing sparkles.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Long press on the screen to focus glowing light.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Procedural piano arpeggios, rain, and wind.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleToggleAudio}
                className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 active:scale-98 font-sans font-semibold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-white/5"
                id="btn-enter-sound"
              >
                Enter with Soundscape (Recommended)
              </button>
              <button
                onClick={() => setIsIntroOpen(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 active:scale-98 font-sans font-medium text-xs tracking-widest text-slate-400 hover:text-slate-200 uppercase rounded-xl transition-all"
                id="btn-enter-silent"
              >
                Explore Silently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONCEPT GUIDE MODAL */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
          id="modal-help"
        >
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 text-left relative shadow-2xl space-y-4">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              id="btn-close-help"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2">
              <Compass size={18} className="text-sky-400" />
              <h3 className="text-sm font-sans font-bold tracking-wider text-slate-100 uppercase">
                Artistic Philosophy
              </h3>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed font-sans">
              <p>
                The word <strong>"Sorry"</strong> is often carries complex weight: guilt, relief,
                sadness, and connection. This artwork is designed to decouple "Sorry" from heavy
                remorse, turning it into a beautiful, gentle elemental force of nature.
              </p>
              <p>
                By experiencing the apology through cosmic stars, soft snow, or whispering wind currents,
                we witness the words drift away, dissolving slowly into a larger, infinite sky.
              </p>
              <p>
                Allow yourself to meditate, tap along to release glowing sparkles, and let the gentle piano
                and whispering breeze carry your thoughts.
              </p>
            </div>

            <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1 text-[10px] text-slate-400 font-mono leading-relaxed">
              <p>• Created using HTML5 Canvas & Web Audio synthesis.</p>
              <p>• Designed to maintain a stable 60 FPS across desktop & mobile.</p>
              <p>• Clean, human-labeled, safe visual rendering.</p>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-sans font-semibold text-xs rounded-xl transition-all"
              id="btn-help-close-confirm"
            >
              Return to Ocean
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
