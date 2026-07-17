// Procedural Audio Engine for Infinite Ocean of Sorry
// Uses Web Audio API for ambient rain, wind, delay-enabled soft piano, and Speech Synthesis for whispers.

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  private pianoTimer: any = null;
  private windModulationTimer: any = null;

  // Volume state (0 to 1)
  private volumes = {
    master: 0.5,
    rain: 0.3,
    wind: 0.3,
    piano: 0.4,
    whisper: 0.5,
  };

  private isPlaying = false;
  private isPianoRunning = false;

  constructor() {
    // Lazy initialization happens on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    
    // Create Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Setup Stereo Delay Effect for Piano
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.45, this.ctx.currentTime);
    
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

    // Connect delay feedback loop
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    
    // Connect delay to master
    this.delayNode.connect(this.masterGain);

    this.setupRain();
    this.setupWind();
    this.startWindModulation();
  }

  private setupRain() {
    if (!this.ctx || !this.masterGain) return;

    // Create 2 seconds of white noise buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    // Filter rain to sound soft (high pass + low pass)
    const lpFilter = this.ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.volumes.rain * 0.4, this.ctx.currentTime);

    this.rainNode.connect(lpFilter);
    lpFilter.connect(hpFilter);
    hpFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
  }

  private setupWind() {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4; // 4 seconds of wind noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise filter approximation for wind warmth
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // normalise
      b6 = white * 0.115926;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = buffer;
    this.windNode.loop = true;

    // Resonant bandpass filter to simulate whistling/howling wind
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(this.volumes.wind * 0.5, this.ctx.currentTime);

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
  }

  private startWindModulation() {
    if (this.windModulationTimer) clearInterval(this.windModulationTimer);

    let phase = 0;
    this.windModulationTimer = setInterval(() => {
      if (!this.ctx || !this.windFilter || !this.windGain || !this.isPlaying) return;

      phase += 0.03;
      // Modulate frequency of wind between 180Hz and 450Hz
      const targetFreq = 280 + Math.sin(phase) * 100 + Math.sin(phase * 0.3) * 50;
      this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);

      // Modulate wind gain slightly for gusts
      const gustFactor = 0.6 + Math.sin(phase * 0.8) * 0.3 + (Math.sin(phase * 2.1) > 0.7 ? 0.2 : 0);
      this.windGain.gain.setTargetAtTime(this.volumes.wind * 0.3 * gustFactor, this.ctx.currentTime, 0.4);
    }, 100);
  }

  public async start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.isPlaying) {
      this.isPlaying = true;

      // Start buffers
      try {
        if (this.rainNode) {
          // Recreate node if it was stopped before
          if ((this.rainNode as any).playbackState === 3 || (this.rainNode as any).active) {
            this.setupRain();
          }
          this.rainNode.start(0);
        }
        if (this.windNode) {
          this.windNode.start(0);
        }
      } catch (e) {
        // Fallback recreate and start
        this.setupRain();
        this.setupWind();
        try {
          this.rainNode?.start(0);
          this.windNode?.start(0);
        } catch (err) {
          console.warn("Audio node play error:", err);
        }
      }

      this.startPiano();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.stopPiano();

    try {
      this.rainNode?.stop();
      this.windNode?.stop();
    } catch (e) {}

    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  private startPiano() {
    if (this.isPianoRunning) return;
    this.isPianoRunning = true;

    // Play a gentle slow piano arpeggio / sequence
    // Using a beautiful slow, spacious pentatonic scale in A Minor (Am9 / Fmaj9 / Cmaj7)
    const chords = [
      [110, 220, 261.63, 329.63, 392.00, 493.88], // Am9: A2, A3, C4, E4, G4, B4
      [87.31, 174.61, 261.63, 349.23, 392.00, 440.00], // Fmaj9: F2, F3, C4, F4, G4, A4
      [130.81, 261.63, 329.63, 392.00, 493.88, 523.25], // Cmaj9: C3, C4, E4, G4, B4, C5
      [98.00, 196.00, 246.94, 293.66, 392.00, 440.00] // G6: G2, G3, B3, D4, G4, A4
    ];

    let chordIndex = 0;
    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.isPianoRunning) return;

      const currentChord = chords[chordIndex];
      
      // Play 1-2 notes from the chord at random or in arpeggio
      if (step === 0) {
        // Root bass note
        this.playPianoNote(currentChord[0], 4.0, 0.4);
        if (Math.random() > 0.3) {
          setTimeout(() => this.playPianoNote(currentChord[1], 3.5, 0.3), 200);
        }
      } else if (step === 2) {
        // Mid voice
        this.playPianoNote(currentChord[2], 3.0, 0.25);
        if (Math.random() > 0.4) {
          setTimeout(() => this.playPianoNote(currentChord[3], 2.5, 0.2), 300);
        }
      } else if (step === 4) {
        // High melody
        this.playPianoNote(currentChord[4], 2.0, 0.2);
        if (Math.random() > 0.5) {
          setTimeout(() => this.playPianoNote(currentChord[5], 1.5, 0.15), 400);
        }
      } else if (step === 6) {
        // Accent note
        if (Math.random() > 0.5) {
          this.playPianoNote(currentChord[2], 2.0, 0.15);
        }
      }

      step = (step + 1) % 8;
      
      if (step === 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }

      // Schedule next step (slow, spacious beats of 1.2 seconds)
      this.pianoTimer = setTimeout(playStep, 1000 + Math.random() * 400);
    };

    playStep();
  }

  private stopPiano() {
    this.isPianoRunning = false;
    if (this.pianoTimer) {
      clearTimeout(this.pianoTimer);
      this.pianoTimer = null;
    }
  }

  public playPianoNote(frequency: number, duration: number, noteVolume: number) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    const t = this.ctx.currentTime;
    
    // Warm custom oscillator combo
    const oscBody = this.ctx.createOscillator();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(frequency, t);

    const oscOvertones = this.ctx.createOscillator();
    oscOvertones.type = 'sine';
    oscOvertones.frequency.setValueAtTime(frequency * 2, t);

    const oscStrike = this.ctx.createOscillator();
    oscStrike.type = 'sine';
    oscStrike.frequency.setValueAtTime(frequency * 4, t);

    // Warmth Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, t);
    // filter sweep
    filter.frequency.exponentialRampToValueAtTime(150, t + duration * 0.8);

    const noteGain = this.ctx.createGain();
    
    // Piano ADSR envelope
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(noteVolume * this.volumes.piano * 0.8, t + 0.02); // attack
    noteGain.gain.exponentialRampToValueAtTime(noteVolume * this.volumes.piano * 0.1, t + duration * 0.5); // decay to sustain
    noteGain.gain.linearRampToValueAtTime(0, t + duration); // release

    // Strike hammer envelope (extremely short)
    const strikeGain = this.ctx.createGain();
    strikeGain.gain.setValueAtTime(noteVolume * this.volumes.piano * 0.5, t);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    // Connections
    oscBody.connect(filter);
    oscOvertones.connect(filter);
    filter.connect(noteGain);

    oscStrike.connect(strikeGain);
    
    noteGain.connect(this.masterGain);
    strikeGain.connect(this.masterGain);

    // Send piano note to Delay effect for spatial ambient tail
    if (this.delayNode) {
      noteGain.connect(this.delayNode);
      strikeGain.connect(this.delayNode);
    }

    oscBody.start(t);
    oscOvertones.start(t);
    oscStrike.start(t);

    oscBody.stop(t + duration);
    oscOvertones.stop(t + duration);
    oscStrike.stop(t + duration);
  }

  // Uses Web Speech API for beautiful soft, whispery voice saying "I'm sorry"
  public whisperSorry() {
    if (!this.isPlaying) return;

    if ('speechSynthesis' in window) {
      // Cancel previous speaking to prevent piling
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance("I'm sorry");
      
      // Attempt to find a soft sounding voice or female voice
      const voices = window.speechSynthesis.getVoices();
      const softVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') || 
        v.name.includes('Hazel') ||
        v.name.includes('Microsoft Zira') ||
        v.lang.startsWith('en')
      );

      if (softVoice) {
        utterance.voice = softVoice;
      }

      utterance.rate = 0.65; // slow
      utterance.pitch = 0.8; // low pitch for deep warmth
      utterance.volume = this.volumes.whisper * 0.25; // extremely low volume, gentle

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: Synthesize a gorgeous shimmering sound wave (representing a whispery sign)
      this.playGlisteningWhisper();
    }
  }

  private playGlisteningWhisper() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Beautiful chime chord (E5, A5, B5, E6)
    const freqs = [659.25, 880.00, 987.77, 1318.51];
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      
      gain.gain.setValueAtTime(0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.04 * this.volumes.piano, t + idx * 0.05 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 1.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      if (this.delayNode) gain.connect(this.delayNode);
      
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 1.5);
    });
  }

  // Volume controls
  public setVolume(type: 'master' | 'rain' | 'wind' | 'piano' | 'whisper', value: number) {
    this.volumes[type] = value;

    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (type === 'master' && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, t, 0.1);
    } else if (type === 'rain' && this.rainGain) {
      this.rainGain.gain.setTargetAtTime(value * 0.4, t, 0.1);
    } else if (type === 'wind' && this.windGain) {
      this.windGain.gain.setTargetAtTime(value * 0.3, t, 0.1);
    }
  }

  public getVolume(type: 'master' | 'rain' | 'wind' | 'piano' | 'whisper') {
    return this.volumes[type];
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

// Single instance for global application use
export const globalAudio = new AudioEngine();
