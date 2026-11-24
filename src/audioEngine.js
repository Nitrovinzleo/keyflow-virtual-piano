// ============================================================================
// KeyFlow Studio — Real Yamaha C5 Acoustic Sampler + Unlimited Polyphony Engine
// ============================================================================

const SALAMANDER_SAMPLE_MAP = {
  'C2': 'samples/C2.mp3',
  'F#2': 'samples/Fs2.mp3',
  'A2': 'samples/A2.mp3',
  'C3': 'samples/C3.mp3',
  'D#3': 'samples/Ds3.mp3',
  'F#3': 'samples/Fs3.mp3',
  'A3': 'samples/A3.mp3',
  'C4': 'samples/C4.mp3',
  'D#4': 'samples/Ds4.mp3',
  'F#4': 'samples/Fs4.mp3',
  'A4': 'samples/A4.mp3',
  'C5': 'samples/C5.mp3',
  'D#5': 'samples/Ds5.mp3',
  'F#5': 'samples/Fs5.mp3',
  'A5': 'samples/A5.mp3',
  'C6': 'samples/C6.mp3',
  'D#6': 'samples/Ds6.mp3',
  'F#6': 'samples/Fs6.mp3',
  'A6': 'samples/A6.mp3',
  'C7': 'samples/C7.mp3'
};

class KeyFlowAudioEngine {
  constructor() {
    this.ctx = null;
    this.instrument = 'real-piano'; // 'real-piano' | 'real-piano-natural' | 'grand-piano' | 'electric-rhodes' | 'music-box' | 'synthwave'
    this.sustainEnabled = true;
    this.sustainMultiplier = 1.65;
    this.octaveShift = 0;

    // Decoded Yamaha C5 Grand Piano AudioBuffers
    this.sampleBuffers = new Map();
    this.samplesLoaded = false;
    this.samplesLoadingPromise = null;

    // Gains (Unlimited headroom, no chord volume ducking)
    this.pianoVolume = 1.0;
    this.micVolume = 1.0;
    this.micEnabled = false;
    this.monitorVoice = false;

    // Audio routing nodes
    this.masterLimiter = null;
    this.pianoBus = null;
    this.reverbNode = null;
    this.reverbSend = null;

    // Active held voices map: holdId -> Array of active voice objects
    this.activeHeldVoices = new Map();

    // Two simultaneous destinations:
    // 1. Direct Hardware Monitor Destination (this.ctx.destination — zero latency!)
    // 2. Virtual Mic Destination (VB-Cable Input / Screaming Bee / VoiceMeeter)
    this.virtualMicDest = null;
    this.virtualMicCtx = null;
    this.virtualMicAudioEl = null;

    this.monitorDeviceId = 'default';
    this.virtualMicDeviceId = '';
    this.micInputDeviceId = 'default';

    // Real microphone stream
    this.micStream = null;
    this.micSourceNode = null;
    this.micGainNode = null;
    this.micMonitorGainNode = null;

    // Real-time Analyser for Visualizer & VU Meter
    this.analyser = null;
    this.micAnalyser = null;
  }

  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (!this.samplesLoaded && !this.samplesLoadingPromise) {
        this._preloadPianoSamples();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive' });

    this.virtualMicDest = this.ctx.createMediaStreamDestination();

    // Transparent Brickwall Limiter ONLY at -1dB so 4, 6, or 10 held notes
    // play at full volume without clipping
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -1.5;
    this.masterLimiter.knee.value = 2;
    this.masterLimiter.ratio.value = 18;
    this.masterLimiter.attack.value = 0.001;
    this.masterLimiter.release.value = 0.06;

    this.pianoBus = this.ctx.createGain();
    this.pianoBus.gain.value = this.pianoVolume;

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this._createReverbImpulse(2.1, 2.7);
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.22;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;

    this.pianoBus.connect(this.masterLimiter);
    this.pianoBus.connect(this.reverbSend);
    this.reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(this.masterLimiter);

    // Direct hardware connection to AudioContext.destination for instantaneous (<5ms) monitor sound!
    this.masterLimiter.connect(this.ctx.destination);
    this.masterLimiter.connect(this.analyser);

    // Dedicated Virtual Mic Bus: Receives raw piano sound + reverb directly at full gain!
    this.virtualMicBus = this.ctx.createGain();
    this.virtualMicBus.gain.value = 1.0;
    this.pianoBus.connect(this.virtualMicBus);
    this.reverbNode.connect(this.virtualMicBus);

    this.virtualMicAnalyser = this.ctx.createAnalyser();
    this.virtualMicAnalyser.fftSize = 128;
    this.virtualMicBus.connect(this.virtualMicAnalyser);
    this.virtualMicBus.connect(this.virtualMicDest);

    // Preload real Yamaha C5 samples in background immediately
    this._preloadPianoSamples();
  }

  _detectSampleStartOffset(audioBuf) {
    try {
      const ch0 = audioBuf.getChannelData(0);
      const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : ch0;
      const len = ch0.length;
      const scanLimit = Math.min(len, Math.floor(audioBuf.sampleRate * 0.5));
      let peak = 0;
      for (let i = 0; i < scanLimit; i++) {
        const amp = Math.max(Math.abs(ch0[i]), Math.abs(ch1[i]));
        if (amp > peak) peak = amp;
      }
      const threshold = Math.max(0.004, peak * 0.05);
      for (let i = 0; i < scanLimit; i++) {
        const amp = Math.max(Math.abs(ch0[i]), Math.abs(ch1[i]));
        if (amp >= threshold) {
          const backoff = Math.floor(audioBuf.sampleRate * 0.001);
          return Math.max(0, (i - backoff) / audioBuf.sampleRate);
        }
      }
    } catch (e) {}
    return 0;
  }

  async _preloadPianoSamples() {
    if (this.samplesLoadingPromise) return this.samplesLoadingPromise;
    this.samplesLoadingPromise = (async () => {
      const entries = Object.entries(SALAMANDER_SAMPLE_MAP);
      await Promise.all(
        entries.map(async ([noteName, url]) => {
          try {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
            const startOffset = this._detectSampleStartOffset(audioBuf);
            this.sampleBuffers.set(noteName, {
              buffer: audioBuf,
              freq: window.KeyFlowSongs.noteToFreq(noteName),
              startOffset
            });
          } catch (err) {
            console.warn('Could not load sample', noteName, err);
          }
        })
      );
      this.samplesLoaded = this.sampleBuffers.size > 0;
    })();
    return this.samplesLoadingPromise;
  }

  _findClosestSample(targetFreq) {
    let best = null;
    let minRatioDiff = Infinity;
    for (const sampleInfo of this.sampleBuffers.values()) {
      const ratioDiff = Math.abs(Math.log2(targetFreq / sampleInfo.freq));
      if (ratioDiff < minRatioDiff) {
        minRatioDiff = ratioDiff;
        best = sampleInfo;
      }
    }
    return best;
  }

  _createReverbImpulse(durationSec, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return impulse;
  }

  async getAudioDevices() {
    try {
      let devices = await navigator.mediaDevices.enumerateDevices();
      // In Chromium, device labels can be blank until a media permission or stream is queried
      const hasLabels = devices.some((d) => d.label && d.label.length > 0);
      if (!hasLabels && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch (e) {
          console.warn('Could not query temp media stream for labels:', e);
        }
      }
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      return { outputs, inputs };
    } catch (err) {
      console.error('Device enumeration error:', err);
      return { outputs: [], inputs: [] };
    }
  }

  isVirtualCableDevice(label = '') {
    return /(cable input|vb-audio|voicemeeter|screaming bee|virtual audio|blackhole|vac)/i.test(label);
  }

  async setMonitorOutputDevice(deviceId) {
    await this.init();
    this.monitorDeviceId = deviceId || 'default';
    if (this.ctx && typeof this.ctx.setSinkId === 'function') {
      try {
        await this.ctx.setSinkId(this.monitorDeviceId === 'default' ? '' : this.monitorDeviceId);
      } catch (err) {
        console.warn('AudioContext.setSinkId failed:', err);
      }
    }
  }

  async setVirtualMicOutputDevice(deviceId) {
    await this.init();
    this.virtualMicDeviceId = deviceId || '';

    if (!this.virtualMicAudioEl) {
      this.virtualMicAudioEl = document.getElementById('virtual-mic-player');
      if (!this.virtualMicAudioEl) {
        this.virtualMicAudioEl = document.createElement('audio');
        this.virtualMicAudioEl.id = 'virtual-mic-player';
        this.virtualMicAudioEl.className = 'audio-sink-hidden';
        document.body.appendChild(this.virtualMicAudioEl);
      }
    }

    if (!this.virtualMicDeviceId) {
      if (this.virtualMicAudioEl) {
        this.virtualMicAudioEl.muted = true;
        this.virtualMicAudioEl.pause();
      }
      return false;
    }

    this.virtualMicAudioEl.muted = false;
    this.virtualMicAudioEl.volume = 1.0;

    if (this.virtualMicAudioEl.srcObject !== this.virtualMicDest.stream) {
      this.virtualMicAudioEl.srcObject = this.virtualMicDest.stream;
    }

    if (typeof this.virtualMicAudioEl.setSinkId === 'function') {
      try {
        await this.virtualMicAudioEl.setSinkId(this.virtualMicDeviceId);
      } catch (err) {
        console.warn('virtualMicAudioEl.setSinkId failed:', err);
      }
    }

    try {
      await this.virtualMicAudioEl.play();
    } catch (err) {
      console.warn('virtualMicAudioEl.play failed:', err);
    }

    return true;
  }

  async toggleRealMicrophone(enable, inputDeviceId) {
    await this.init();
    if (inputDeviceId) this.micInputDeviceId = inputDeviceId;

    if (!enable) {
      this.micEnabled = false;
      if (this.micSourceNode) {
        try { this.micSourceNode.disconnect(); } catch (e) {}
        this.micSourceNode = null;
      }
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
      return false;
    }

    try {
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        audio: {
          deviceId: this.micInputDeviceId && this.micInputDeviceId !== 'default'
            ? { exact: this.micInputDeviceId }
            : undefined,
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: false
        }
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);

      this.micGainNode = this.ctx.createGain();
      this.micGainNode.gain.value = this.micVolume;

      this.micMonitorGainNode = this.ctx.createGain();
      this.micMonitorGainNode.gain.value = this.monitorVoice ? this.micVolume : 0;

      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 128;

      this.micSourceNode.connect(this.micGainNode);
      this.micGainNode.connect(this.micAnalyser);
      if (this.virtualMicBus) {
        this.micGainNode.connect(this.virtualMicBus);
      } else {
        this.micGainNode.connect(this.virtualMicDest);
      }

      this.micSourceNode.connect(this.micMonitorGainNode);
      this.micMonitorGainNode.connect(this.ctx.destination);

      this.micEnabled = true;
      return true;
    } catch (err) {
      console.error('Microphone capture error:', err);
      this.micEnabled = false;
      return false;
    }
  }

  setMonitorVoice(flag) {
    this.monitorVoice = Boolean(flag);
    if (this.micMonitorGainNode && this.ctx) {
      this.micMonitorGainNode.gain.setTargetAtTime(
        this.monitorVoice ? this.micVolume : 0,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  setPianoVolume(val) {
    this.pianoVolume = Math.max(0, Math.min(2.5, val));
    if (this.pianoBus && this.ctx) {
      this.pianoBus.gain.setTargetAtTime(this.pianoVolume, this.ctx.currentTime, 0.015);
    }
  }

  setMicVolume(val) {
    this.micVolume = Math.max(0, Math.min(2.5, val));
    if (this.micGainNode && this.ctx) {
      this.micGainNode.gain.setTargetAtTime(this.micVolume, this.ctx.currentTime, 0.015);
    }
    if (this.micMonitorGainNode && this.monitorVoice && this.ctx) {
      this.micMonitorGainNode.gain.setTargetAtTime(this.micVolume, this.ctx.currentTime, 0.015);
    }
  }

  shiftNoteOctave(noteName, shift) {
    if (!shift) return noteName;
    const match = /^([A-G]#?)(-?\d+)$/.exec(noteName);
    if (!match) return noteName;
    const nextOct = Math.max(1, Math.min(7, parseInt(match[2], 10) + shift));
    return `${match[1]}${nextOct}`;
  }

  // ==========================================================================
  // CONTINUOUS HOLD VOICES: Sound stays active continuously until key release!
  // ==========================================================================
  startSustainedNotes(holdId, notesArray, velocity = 0.92) {
    if (!notesArray || !notesArray.length) return;
    if (!this.ctx) {
      this.init().then(() => this.startSustainedNotes(holdId, notesArray, velocity));
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // If same holdId is reused, let previous voices fade out smoothly instead of cutting them!
    if (this.activeHeldVoices.has(holdId)) {
      this.stopSustainedNotes(holdId, false);
    }

    const voices = notesArray.map((rawNoteName) => this._createContinuousVoice(rawNoteName, velocity));
    this.activeHeldVoices.set(holdId, voices);
  }

  stopSustainedNotes(holdId, immediate = false) {
    const voices = this.activeHeldVoices.get(holdId);
    if (!voices) return;
    this.activeHeldVoices.delete(holdId);

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const releaseSec = immediate ? 0.18 : (this.sustainEnabled ? 1.15 : 0.35);

    voices.forEach((v) => {
      try {
        v.voiceGain.gain.cancelScheduledValues(now);
        v.voiceGain.gain.setValueAtTime(Math.max(0.0001, v.voiceGain.gain.value), now);
        v.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseSec);
        v.sources.forEach((src) => {
          try { src.stop(now + releaseSec + 0.05); } catch (e) {}
        });
      } catch (e) {}
    });
  }

  stopAllSustainedNotes() {
    for (const holdId of this.activeHeldVoices.keys()) {
      this.stopSustainedNotes(holdId, true);
    }
  }

  _createContinuousVoice(rawNoteName, velocity = 0.92) {
    const noteName = this.shiftNoteOctave(rawNoteName, this.octaveShift);
    const freq = window.KeyFlowSongs.noteToFreq(noteName);
    const now = this.ctx.currentTime;

    const voiceGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const sources = [];

    // 1. REAL YAMAHA C5 STUDIO PIANO SAMPLES ('real-piano' & 'real-piano-natural')
    if ((this.instrument === 'real-piano' || this.instrument === 'real-piano-natural') && this.samplesLoaded) {
      const closest = this._findClosestSample(freq);
      if (closest) {
        const bufSrc = this.ctx.createBufferSource();
        bufSrc.buffer = closest.buffer;
        bufSrc.playbackRate.setValueAtTime(freq / closest.freq, now);

        const sampleGain = this.ctx.createGain();
        sampleGain.gain.setValueAtTime(Math.min(1.35, velocity * 1.15), now);

        bufSrc.connect(sampleGain);
        sampleGain.connect(voiceGain);

        bufSrc.start(now, closest.startOffset || 0);
        sources.push(bufSrc);

        // In 'real-piano' mode, also blend a warm infinite acoustic string resonance
        // so if the user holds the key down for 10+ seconds, the note never dies out until keyup!
        if (this.instrument === 'real-piano') {
          const susOsc1 = this.ctx.createOscillator();
          const susOsc2 = this.ctx.createOscillator();
          susOsc1.type = 'triangle';
          susOsc1.frequency.setValueAtTime(freq, now);
          susOsc2.type = 'sine';
          susOsc2.frequency.setValueAtTime(freq * 2, now);

          const susFilter = this.ctx.createBiquadFilter();
          susFilter.type = 'lowpass';
          susFilter.frequency.setValueAtTime(Math.max(700, freq * 2.4), now);

          const susGain = this.ctx.createGain();
          // Starts silent while the real hammer strike rings, then smoothly holds the string vibration indefinitely
          susGain.gain.setValueAtTime(0.0001, now);
          susGain.gain.linearRampToValueAtTime(0.0001, now + 0.45);
          susGain.gain.linearRampToValueAtTime(velocity * 0.24, now + 1.6);

          const g2 = this.ctx.createGain();
          g2.gain.value = 0.22;

          susOsc1.connect(susFilter);
          susOsc2.connect(g2);
          g2.connect(susFilter);
          susFilter.connect(susGain);
          susGain.connect(voiceGain);

          susOsc1.start(now);
          susOsc2.start(now);
          sources.push(susOsc1, susOsc2);
        }

        voiceGain.gain.setValueAtTime(1.0, now);
        voiceGain.connect(this.pianoBus);

        return { noteName, voiceGain, sources };
      }
    }

    // 2. SYNTHESIZED INSTRUMENTS (or fallback while samples finish decoding)
    if (this.instrument === 'grand-piano' || this.instrument === 'real-piano' || this.instrument === 'real-piano-natural') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(3.5, now);

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 2, now);

      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      const g3 = this.ctx.createGain();
      g1.gain.value = 0.72;
      g2.gain.value = 0.26;
      g3.gain.value = 0.16;

      const brightness = Math.min(11000, freq * (4.2 + velocity * 4.5));
      filter.frequency.setValueAtTime(brightness, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(900, freq * 2.8), now + 0.35);

      const peakGain = Math.min(0.65, velocity * 0.48);
      const sustainGain = peakGain * 0.76;
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.006);
      voiceGain.gain.exponentialRampToValueAtTime(sustainGain, now + 0.15);

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);
      g1.connect(filter);
      g2.connect(filter);
      g3.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(this.pianoBus);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      sources.push(osc1, osc2, osc3);
    } else if (this.instrument === 'electric-rhodes') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);
      osc2.detune.setValueAtTime(-5, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.26, now);

      filter.frequency.setValueAtTime(2800, now);

      const peakGain = Math.min(0.62, velocity * 0.46);
      const sustainGain = peakGain * 0.80;
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
      voiceGain.gain.exponentialRampToValueAtTime(sustainGain, now + 0.15);

      osc1.connect(filter);
      osc2.connect(g2);
      g2.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(this.pianoBus);

      osc1.start(now);
      osc2.start(now);
      sources.push(osc1, osc2);
    } else if (this.instrument === 'music-box') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq * 2, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 4, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.18, now);

      const peakGain = Math.min(0.55, velocity * 0.42);
      const sustainGain = peakGain * 0.72;
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
      voiceGain.gain.exponentialRampToValueAtTime(sustainGain, now + 0.14);

      osc1.connect(voiceGain);
      osc2.connect(g2);
      g2.connect(voiceGain);
      voiceGain.connect(this.pianoBus);

      osc1.start(now);
      osc2.start(now);
      sources.push(osc1, osc2);
    } else {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-9, now);
      osc2.detune.setValueAtTime(9, now);

      filter.frequency.setValueAtTime(4800, now);

      const peakGain = Math.min(0.52, velocity * 0.40);
      const sustainGain = peakGain * 0.85;
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.012);
      voiceGain.gain.exponentialRampToValueAtTime(sustainGain, now + 0.12);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(this.pianoBus);

      osc1.start(now);
      osc2.start(now);
      sources.push(osc1, osc2);
    }

    return { noteName, voiceGain, sources };
  }

  // ==========================================================================
  // TIMED VOICES (Used for Auto-Play and global shortcuts where keyup is absent)
  // ==========================================================================
  playNote(noteName, durationSec = 0.65, velocity = 0.9) {
    if (!this.ctx) {
      this.init().then(() => this.playNote(noteName, durationSec, velocity));
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const tempId = 'auto-' + Math.random().toString(36).slice(2);
    this.startSustainedNotes(tempId, [noteName], velocity);
    const holdMs = Math.max(55, durationSec * 1000);
    setTimeout(() => {
      this.stopSustainedNotes(tempId);
    }, holdMs);
  }

  playChord(notes, durationSec = 0.65, velocity = 0.9) {
    if (!notes || !notes.length) return;
    const tempId = 'chord-' + Math.random().toString(36).slice(2);
    this.startSustainedNotes(tempId, notes, velocity);
    const holdMs = Math.max(55, durationSec * 1000);
    setTimeout(() => {
      this.stopSustainedNotes(tempId);
    }, holdMs);
  }

  getLevelMetrics() {
    let pianoLevel = 0;
    let micLevel = 0;
    let virtualMicLevel = 0;

    if (this.analyser) {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      pianoLevel = Math.min(100, Math.round((sum / data.length / 130) * 100));
    }

    if (this.virtualMicAnalyser) {
      const data = new Uint8Array(this.virtualMicAnalyser.frequencyBinCount);
      this.virtualMicAnalyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      virtualMicLevel = Math.min(100, Math.round((sum / data.length / 130) * 100));
    }

    if (this.micEnabled && this.micAnalyser) {
      const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
      this.micAnalyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      micLevel = Math.min(100, Math.round((sum / data.length / 120) * 100));
    }

    return { pianoLevel, micLevel, virtualMicLevel };
  }
}

window.KeyFlowAudioEngine = KeyFlowAudioEngine;
