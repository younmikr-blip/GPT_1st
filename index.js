
import { LitElement, html, css } from 'lit';

/**
 * Guitar Scale Master - Ultra Pro Edition
 * All Features Restored & Optimized
 */

// --- IndexedDB Management ---
const DB_NAME = 'GuitarBackingDB_V4';
const STORE_NAME = 'tracks';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveTrackToDB(track) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(track);
  return new Promise((resolve) => (tx.oncomplete = resolve));
}

async function deleteTrackFromDB(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve) => (tx.oncomplete = resolve));
}

async function getAllTracksFromDB() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// --- Music Theory Data ---
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const GUITAR_TUNING = [4, 11, 7, 2, 9, 4]; // E4, B3, G3, D3, A2, E2
const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];

const SCALES = [
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
];

const INTERVAL_COLORS = {
  0: '#ef4444', 1: '#f97316', 2: '#f59e0b', 3: '#fbbf24', 4: '#10b981',
  5: '#06b6d4', 6: '#0891b2', 7: '#3b82f6', 8: '#6366f1', 9: '#8b5cf6',
  10: '#a855f7', 11: '#ec4899',
};

class GuitarScaleApp extends LitElement {
  static properties = {
    sectionOrder: { type: Array },
    notation: { type: String },
    harmonyMode: { type: String },
    rootNote: { type: String },
    scaleType: { type: String },
    timeSignature: { type: String },
    bpm: { type: Number },
    syncopation: { type: Number },
    difficulty: { type: Number },
    drumComplexity: { type: Number },
    isPlaying: { type: Boolean },
    currentBeat: { type: Number },
    rhythmPattern: { type: Array },
    metronomeEnabled: { type: Boolean },
    drumMode: { type: String },
    selectedBackingKey: { type: String },
    userTracks: { type: Object },
    currentPlayingUrl: { type: String },
    isTrackPlaying: { type: Boolean },
    audioCurrentTime: { type: Number },
    audioDuration: { type: Number },
    loopStart: { type: Number },
    loopEnd: { type: Number },
    loopEnabled: { type: Boolean },
    copyMachineRate: { type: Number },
    copyMachineVolume: { type: Number },
    copyMachineUrl: { type: String },
    isCopyMachinePlaying: { type: Boolean },
    cmCurrentTime: { type: Number },
    cmDuration: { type: Number },
    cmWaveformData: { type: Array },
    tunerActive: { type: Boolean },
    detectedFrequency: { type: Number },
    centOffset: { type: Number },
    detectedNote: { type: String },
    detectedOctave: { type: String },
  };

  static styles = css`
    :host {
      display: flex; flex-direction: column; min-height: 100vh;
      background-color: #020617; color: #f8fafc;
      font-family: 'Pretendard', sans-serif; padding: 16px; gap: 24px;
      max-width: 1400px; margin: 0 auto; box-sizing: border-box;
    }

    .section-card {
      background: #0f172a; border: 1px solid #1e293b; border-radius: 20px;
      padding: 28px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      position: relative; overflow: hidden;
    }

    .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .section-title { font-size: 0.9rem; color: #3b82f6; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; display: flex; align-items: center; gap: 10px; }
    .section-title::before { content: ''; width: 4px; height: 18px; background: #3b82f6; border-radius: 2px; }

    .btn-main-play {
      background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none;
      padding: 16px 32px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); font-size: 1rem;
    }
    .btn-main-play:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); }
    .btn-main-play:active { transform: translateY(0); }
    .btn-main-play.active { background: #dc2626; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }

    .btn-chip {
      background: #1e293b; border: 1px solid #334155; color: #cbd5e1;
      padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-weight: 700; transition: 0.2s;
    }
    .btn-chip:hover { border-color: #3b82f6; color: white; }
    .btn-chip.active { background: #3b82f6; color: white; border-color: #3b82f6; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2); }
    .btn-chip.red-active { background: #ef4444; color: white; border-color: #ef4444; }

    .waveform-container {
      position: relative; width: 100%; height: 180px; background: #020617;
      border-radius: 14px; margin: 24px 0; overflow: hidden; border: 1px solid #1e293b; cursor: crosshair;
    }
    .waveform-canvas { width: 100%; height: 100%; display: block; }
    .waveform-progress { position: absolute; top: 0; bottom: 0; width: 3px; background: #fff; z-index: 15; pointer-events: none; box-shadow: 0 0 10px #fff; }
    .loop-overlay { position: absolute; top: 0; bottom: 0; background: rgba(59, 130, 246, 0.25); border-left: 2px solid #3b82f6; border-right: 2px solid #3b82f6; z-index: 10; pointer-events: none; }

    .fretboard-container { overflow-x: auto; background: #0f172a; padding: 50px 0; border-radius: 20px; border: 1px solid #1e293b; }
    .fretboard { position: relative; min-width: 1400px; display: grid; grid-template-rows: repeat(6, 48px); gap: 4px; margin-left: 70px; margin-right: 30px; }
    .string { position: relative; height: 3px; background: #334155; margin: 22px 0; z-index: 3; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .fret-line { position: absolute; top: -14px; bottom: -14px; width: 4px; background: #1e293b; z-index: 2; border-radius: 2px; }
    .fret-inlay { position: absolute; width: 16px; height: 16px; background: #1e293b; border-radius: 50%; transform: translate(-50%, -50%); z-index: 1; opacity: 0.7; border: 1px solid #334155; }
    .fret-number { position: absolute; bottom: -50px; font-size: 0.9rem; color: #64748b; font-weight: 900; transform: translateX(-50%); }

    .note-marker {
      position: absolute; transform: translate(-50%, -50%); width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 900;
      z-index: 10; color: white; box-shadow: 0 6px 10px rgba(0,0,0,0.6); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .note-marker:hover { transform: translate(-50%, -50%) scale(1.2); z-index: 20; }
    .note-marker.root-note { border: 4px solid #fff; width: 42px; height: 42px; z-index: 15; font-size: 1rem; box-shadow: 0 0 20px rgba(255,255,255,0.3); }

    .slider-group { display: flex; flex-direction: column; gap: 20px; }
    .slider-header { display: flex; justify-content: space-between; font-size: 0.85rem; color: #94a3b8; font-weight: 800; }
    input[type="range"] { -webkit-appearance: none; width: 100%; height: 6px; background: #1e293b; border-radius: 3px; outline: none; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; cursor: pointer; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5); }

    .tuner-display { display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 40px; background: #020617; border-radius: 24px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto; }
    .tuner-note-main { font-size: 7rem; font-weight: 900; line-height: 1; letter-spacing: -0.05em; }
    .tuner-note-main.in-tune { color: #10b981; text-shadow: 0 0 40px rgba(16, 185, 129, 0.5); }
    .tuner-freq { font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; color: #64748b; font-weight: 700; }
    .tuner-meter { width: 100%; height: 12px; background: #1e293b; border-radius: 6px; position: relative; margin: 24px 0; }
    .tuner-needle { position: absolute; top: -14px; width: 5px; height: 40px; background: #3b82f6; border-radius: 3px; transform: translateX(-50%); transition: left 0.1s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
    .tuner-needle.in-tune { background: #10b981; box-shadow: 0 0 15px #10b981; }

    .btn-order { background: #1e293b; border: none; color: #64748b; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-order:hover { background: #334155; color: white; }

    .rhythm-grid { display: flex; gap: 10px; margin-top: 24px; overflow-x: auto; padding: 10px 2px; }
    .beat-column { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; background: #1e293b; min-width: 50px; transition: 0.2s; border: 1px solid transparent; }
    .beat-column.active { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; transform: scale(1.05); }
    .dot { width: 14px; height: 14px; border-radius: 50%; background: #334155; cursor: pointer; transition: all 0.2s; }
    .dot.hit { background: #8b5cf6; box-shadow: 0 0 12px #8b5cf6; }
    .dot.active { transform: scale(1.6); border: 3px solid #fff; }

    .track-item { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 16px 20px; border-radius: 14px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
    .track-item:hover { border-color: #3b82f6; background: #2d3748; }
    .track-item.playing { border-left: 5px solid #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .delete-btn { color: #ef4444; background: none; border: none; font-size: 1.4rem; cursor: pointer; opacity: 0.6; transition: 0.2s; }
    .delete-btn:hover { opacity: 1; transform: scale(1.2); }
  `;

  constructor() {
    super();
    this.sectionOrder = ['rhythm_station', 'config', 'fretboard', 'copy', 'backing', 'tuner'];
    this.notation = 'English'; this.harmonyMode = 'Scale'; this.rootNote = 'C'; this.scaleType = 'Major';
    this.timeSignature = '4/4'; this.bpm = 100; this.syncopation = 6; this.difficulty = 5; this.drumComplexity = 6;
    this.isPlaying = false; this.currentBeat = 0;
    this.rhythmPattern = Array(32).fill(0).map((_, i) => i % 4 === 0 ? 1 : 0);
    this.metronomeEnabled = true; this.drumMode = 'Rock';
    this.selectedBackingKey = 'C'; this.userTracks = { 'C': [], 'C#': [], 'D': [], 'D#': [], 'E': [], 'F': [], 'F#': [], 'G': [], 'G#': [], 'A': [], 'A#': [], 'B': [] };
    this.audioCurrentTime = 0; this.audioDuration = 0;
    this.loopStart = 0; this.loopEnd = 0; this.loopEnabled = false;
    this.copyMachineRate = 1.0; this.copyMachineVolume = 0.8;
    this.cmCurrentTime = 0; this.cmDuration = 0; this.cmWaveformData = [];
    
    this.audioPlayer = new Audio();
    this.copyMachinePlayer = new Audio();
    this.audioCtx = null;
    this.timerID = null;
    this.nextNoteTime = 0;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.audioPlayer.addEventListener('timeupdate', () => { this.audioCurrentTime = this.audioPlayer.currentTime; this.audioDuration = this.audioPlayer.duration; });
    this.copyMachinePlayer.addEventListener('timeupdate', () => {
      this.cmCurrentTime = this.copyMachinePlayer.currentTime;
      this.cmDuration = this.copyMachinePlayer.duration;
      if (this.loopEnabled && this.loopEnd > this.loopStart) {
        if (this.cmCurrentTime >= this.loopEnd || this.cmCurrentTime < this.loopStart) {
          this.copyMachinePlayer.currentTime = this.loopStart;
        }
      }
    });
    await this.loadAllTracks();
    this.updateRhythmLocally();
    window.addEventListener('resize', () => this.drawWaveform());
  }

  async loadAllTracks() {
    const tracks = await getAllTracksFromDB();
    const map = { 'C': [], 'C#': [], 'D': [], 'D#': [], 'E': [], 'F': [], 'F#': [], 'G': [], 'G#': [], 'A': [], 'A#': [], 'B': [] };
    tracks.forEach(t => {
      t.url = URL.createObjectURL(t.blob);
      if (map[t.key]) map[t.key].push(t);
    });
    this.userTracks = map;
  }

  async ensureAudioCtx() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    return this.audioCtx;
  }

  async handleFileUpload(e, isCopyMachine = false) {
    const files = e.target.files; if (!files?.length) return;
    for (let file of files) {
      if (isCopyMachine) {
        await this.generateWaveform(file);
        this.copyMachineUrl = URL.createObjectURL(file);
        this.copyMachinePlayer.src = this.copyMachineUrl;
        this.copyMachinePlayer.play();
        this.isCopyMachinePlaying = true;
      } else {
        const track = { id: Math.random().toString(36).substr(2, 9), title: file.name, key: this.selectedBackingKey, blob: file };
        await saveTrackToDB(track);
      }
    }
    await this.loadAllTracks();
  }

  async generateWaveform(file) {
    const ctx = await this.ensureAudioCtx();
    const buffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buffer);
    const data = audioBuffer.getChannelData(0);
    const samples = 1000;
    const blockSize = Math.floor(data.length / samples);
    const peaks = [];
    for (let i = 0; i < samples; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(data[i * blockSize + j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    this.cmWaveformData = peaks;
    this.cmDuration = audioBuffer.duration;
    this.loopStart = 0; this.loopEnd = audioBuffer.duration;
    this.requestUpdate();
  }

  drawWaveform() {
    const canvas = this.shadowRoot.querySelector('#cmWaveform');
    if (!canvas || !this.cmWaveformData.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const barWidth = w / this.cmWaveformData.length;
    
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#3b82f6'); grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    
    this.cmWaveformData.forEach((p, i) => {
      const bh = p * h * 0.95;
      ctx.fillRect(i * barWidth, (h - bh) / 2, barWidth - 1, bh);
    });
  }

  updateRhythmLocally() {
    const [num, den] = this.timeSignature.split('/').map(Number);
    const total = den === 8 ? num * 2 : num * 4;
    const pat = Array(total).fill(0);
    for (let i = 0; i < total; i++) {
      const isDownbeat = (i % (den === 8 ? 6 : 4) === 0);
      if (isDownbeat) pat[i] = 1;
      else {
        const syncChance = this.syncopation / 15;
        const diffChance = this.difficulty / 10;
        if (Math.random() < syncChance && Math.random() < diffChance) pat[i] = 1;
      }
    }
    this.rhythmPattern = pat;
  }

  async togglePlayback() {
    const ctx = await this.ensureAudioCtx();
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) { this.currentBeat = 0; this.nextNoteTime = ctx.currentTime; this.scheduler(); }
    else clearTimeout(this.timerID);
  }

  scheduler() {
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.nextNoteTime += (60.0 / this.bpm) / 4.0;
      this.currentBeat = (this.currentBeat + 1) % this.rhythmPattern.length;
    }
    this.timerID = setTimeout(() => this.scheduler(), 25);
  }

  scheduleNote(step, time) {
    if (this.metronomeEnabled && this.rhythmPattern[step]) {
      const osc = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
      osc.connect(g); g.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(step === 0 ? 1200 : 600, time);
      g.gain.setValueAtTime(step === 0 ? 0.3 : 0.15, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time); osc.stop(time + 0.05);
    }
    if (this.drumMode !== 'None') this.playDrums(step, time);
  }

  playDrums(step, time) {
    const complexity = this.drumComplexity / 10;
    if (step % 2 === 0) this.playHiHat(time, 0.12);
    
    switch(this.drumMode) {
      case 'Rock':
        if (step === 0 || (complexity > 0.6 && step === 10)) this.playKick(time);
        if (step === this.rhythmPattern.length / 2) this.playSnare(time);
        break;
      case 'Metal':
        if (step % 2 === 0) this.playKick(time, 1.0);
        if (step === 4 || step === 12) this.playSnare(time, 0.9);
        break;
      case 'Jazz':
        if (step === 0) this.playKick(time, 0.5);
        if (step % 4 === 0) this.playHiHat(time, 0.3);
        if (complexity > 0.7 && Math.random() < 0.2) this.playSnare(time, 0.15);
        break;
      case 'Blues':
        if (step % 6 === 0) this.playKick(time);
        if (step === 6) this.playSnare(time);
        break;
      case 'Funk':
        if (step === 0 || step === 6 || step === 10) this.playKick(time);
        if (step === 4 || step === 12) this.playSnare(time, 0.5);
        break;
    }
  }

  playKick(t, v = 0.8) {
    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
    o.connect(g); g.connect(this.audioCtx.destination);
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.start(t); o.stop(t + 0.5);
  }

  playSnare(t, v = 0.5) {
    const n = this.audioCtx.createBufferSource();
    const b = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.15, this.audioCtx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = this.audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1100;
    const g = this.audioCtx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    n.connect(f); f.connect(g); g.connect(this.audioCtx.destination);
    n.start(t); n.stop(t + 0.3);
  }

  playHiHat(t, v = 0.15) {
    const n = this.audioCtx.createBufferSource();
    const b = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.05, this.audioCtx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = this.audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 10000;
    const g = this.audioCtx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(f); f.connect(g); g.connect(this.audioCtx.destination);
    n.start(t); n.stop(t + 0.1);
  }

  async toggleTuner() {
    if (this.tunerActive) { this.tunerActive = false; this.tunerStream?.getTracks().forEach(t => t.stop()); }
    else {
      try {
        const ctx = await this.ensureAudioCtx();
        this.tunerStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(this.tunerStream);
        this.tunerAnalyser = ctx.createAnalyser(); source.connect(this.tunerAnalyser);
        this.tunerActive = true; this.updateTuner(ctx);
      } catch(e) { alert("Mic required"); }
    }
  }

  updateTuner(ctx) {
    if (!this.tunerActive) return;
    const buf = new Float32Array(2048); this.tunerAnalyser.getFloatTimeDomainData(buf);
    const freq = this.autoCorrelate(buf, ctx.sampleRate);
    if (freq !== -1) {
      this.detectedFrequency = freq;
      const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
      const rolled = Math.round(noteNum) + 69;
      this.detectedNote = NOTES_SHARP[rolled % 12];
      this.centOffset = Math.floor(100 * (noteNum - Math.round(noteNum)));
      this.detectedOctave = Math.floor(rolled / 12) - 1;
    }
    requestAnimationFrame(() => this.updateTuner(ctx));
  }

  autoCorrelate(buf, sr) {
    let rms = 0; for(let v of buf) rms += v*v; if (Math.sqrt(rms/buf.length) < 0.01) return -1;
    let c = new Float32Array(buf.length);
    for(let i=0; i<buf.length; i++) for(let j=0; j<buf.length-i; j++) c[i] += buf[j]*buf[j+i];
    let d=0; while(c[d]>c[d+1]) d++;
    let maxv=-1, maxp=-1; for(let i=d; i<buf.length; i++) if(c[i]>maxv) { maxv=c[i]; maxp=i; }
    return sr / maxp;
  }

  moveSection(key, dir) {
    const idx = this.sectionOrder.indexOf(key);
    const order = [...this.sectionOrder];
    if (dir === 'up' && idx > 0) [order[idx], order[idx-1]] = [order[idx-1], order[idx]];
    else if (dir === 'down' && idx < order.length - 1) [order[idx], order[idx+1]] = [order[idx+1], order[idx]];
    this.sectionOrder = order;
  }

  updated(cp) { if (cp.has('cmWaveformData')) this.drawWaveform(); }

  renderSection(key) {
    switch(key) {
      case 'rhythm_station': return html`
        <div class="section-card">
          <div class="section-header-row"><span class="section-title">Rhythm Station</span>
            <div style="display:flex;gap:4px;"><button class="btn-order" @click=${()=>this.moveSection('rhythm_station','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('rhythm_station','down')}>↓</button></div>
          </div>
          <div style="display:flex; gap:24px; align-items:center; margin-bottom:24px;">
            <button class="btn-main-play ${this.isPlaying?'active':''}" @click=${this.togglePlayback}>${this.isPlaying?'STOP ENGINE':'START ENGINE'}</button>
            <div style="font-size:2rem; font-weight:900; color:#3b82f6; letter-spacing:-0.05em;">${this.bpm} BPM</div>
          </div>
          <div class="slider-group">
            <div class="slider-item"><div class="slider-header"><span>TEMPO</span><span>${this.bpm}</span></div><input type="range" min="40" max="240" .value=${this.bpm} @input=${e=>this.bpm=Number(e.target.value)}></div>
            <div class="slider-item"><div class="slider-header"><span>SYNCOPATION</span><span>${this.syncopation}</span></div><input type="range" min="1" max="15" .value=${this.syncopation} @input=${e=>{this.syncopation=Number(e.target.value);this.updateRhythmLocally();}}></div>
            <div class="slider-item"><div class="slider-header"><span>DENSITY / DIFFICULTY</span><span>${this.difficulty}</span></div><input type="range" min="1" max="10" .value=${this.difficulty} @input=${e=>{this.difficulty=Number(e.target.value);this.updateRhythmLocally();}}></div>
          </div>
          <div style="margin-top:24px;">
            <div class="slider-header"><span>DRUM GENRE</span></div>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
              ${['None', 'Rock', 'Jazz', 'Funk', 'Blues', 'Metal'].map(g => html`<button class="btn-chip ${this.drumMode===g?'active':''}" @click=${()=>this.drumMode=g}>${g}</button>`)}
            </div>
          </div>
          <div class="rhythm-grid">
            ${this.rhythmPattern.map((p, i) => html`
              <div class="beat-column ${this.currentBeat === i ? 'active' : ''}">
                <div class="dot ${p ? 'hit' : ''} ${this.currentBeat === i ? 'active' : ''}" @click=${()=>{const n=[...this.rhythmPattern];n[i]=n[i]?0:1;this.rhythmPattern=n;}}></div>
                <div style="font-size:0.7rem; font-weight:900; color:#475569;">${i+1}</div>
              </div>
            `)}
          </div>
        </div>`;
      case 'config': return html`
        <div class="section-card">
          <div class="section-header-row"><span class="section-title">Scale & Harmony Config</span></div>
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div><div class="slider-header" style="margin-bottom:8px;">ROOT NOTE</div><div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${NOTES_SHARP.map(n => html`<button class="btn-chip ${this.rootNote===n?'active':''}" @click=${()=>this.rootNote=n}>${n}</button>`)}
            </div></div>
            <div><div class="slider-header" style="margin-bottom:8px;">SCALE TYPE</div><div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${SCALES.map(s => html`<button class="btn-chip ${this.scaleType===s.name?'active':''}" @click=${()=>this.scaleType=s.name}>${s.name}</button>`)}
            </div></div>
            <div><div class="slider-header" style="margin-bottom:8px;">DISPLAY MODE</div><div style="display:flex; gap:8px;">
              ${['Individual', 'Chord', 'Scale'].map(h => html`<button class="btn-chip ${this.harmonyMode===h?'active':''}" @click=${()=>this.harmonyMode=h}>${h==='Individual'?'ROOTS':h==='Chord'?'CHORD TONES':'FULL SCALE'}</button>`)}
            </div></div>
          </div>
        </div>`;
      case 'fretboard':
        const rIdx = NOTES_SHARP.indexOf(this.rootNote);
        const sc = SCALES.find(s => s.name === this.scaleType);
        const scNotes = sc ? sc.intervals.map(i => (rIdx + i) % 12) : [rIdx];
        const chordNotes = [scNotes[0], scNotes[2], scNotes[4], scNotes[6]].filter(n => n !== undefined);
        const visible = this.harmonyMode === 'Chord' ? chordNotes : (this.harmonyMode === 'Individual' ? [rIdx] : scNotes);
        return html`
        <div class="section-card fretboard-container">
          <div class="fretboard">
            ${[3,5,7,9,12,15,17,19,21].map(f => html`<div class="fret-inlay" style="left:${(f - 0.5) * 4.35}%; top:50%"></div>`)}
            ${GUITAR_TUNING.map((base, sIdx) => html`
              <div class="string"><span style="position:absolute; left:-50px; top:-5px; font-weight:900; color:#64748b; font-size:1.2rem;">${STRINGS[sIdx]}</span>
                ${Array.from({length: 24}).map((_, f) => {
                  const nIdx = (base + f) % 12; if (!visible.includes(nIdx)) return null;
                  const iv = (12 + nIdx - rIdx) % 12;
                  return html`<div class="note-marker ${iv===0?'root-note':''}" style="left:${(f - 0.5) * 4.35}%; background:${INTERVAL_COLORS[iv]}">${NOTES_SHARP[nIdx]}</div>`;
                })}
              </div>
            `)}
            ${Array.from({length: 24}).map((_, i) => html`<div class="fret-line" style="left:${i * 4.35}%"></div><div class="fret-number" style="left:${i * 4.35}%">${i}</div>`)}
          </div>
        </div>`;
      case 'copy': return html`
        <div class="section-card">
          <div class="section-header-row"><span class="section-title">Copy Machine Looper</span>
            <label class="btn-chip active">+ LOAD AUDIO<input type="file" @change=${e=>this.handleFileUpload(e,true)} style="display:none"></label>
          </div>
          ${this.copyMachineUrl ? html`
            <div class="waveform-container" @click=${e => { const r = e.currentTarget.getBoundingClientRect(); this.copyMachinePlayer.currentTime = ((e.clientX - r.left) / r.width) * this.cmDuration; }}>
              <canvas id="cmWaveform" class="waveform-canvas"></canvas>
              <div class="waveform-progress" style="left: ${(this.cmCurrentTime / this.cmDuration) * 100}%"></div>
              ${this.loopEnabled ? html`<div class="loop-overlay" style="left: ${(this.loopStart / this.cmDuration) * 100}%; width: ${((this.loopEnd - this.loopStart) / this.cmDuration) * 100}%"></div>` : ''}
            </div>
            <div style="display:flex; justify-content:center; gap:16px; margin-bottom:24px; flex-wrap:wrap;">
              <button class="btn-main-play active" style="width:160px" @click=${() => this.isCopyMachinePlaying ? (this.copyMachinePlayer.pause(), this.isCopyMachinePlaying=false) : (this.copyMachinePlayer.play(), this.isCopyMachinePlaying=true)}>${this.isCopyMachinePlaying?'PAUSE':'PLAY'}</button>
              <button class="btn-chip" @click=${() => {this.loopStart = this.cmCurrentTime; this.requestUpdate();}}>SET A (START)</button>
              <button class="btn-chip" @click=${() => {this.loopEnd = this.cmCurrentTime; this.requestUpdate();}}>SET B (END)</button>
              <button class="btn-chip ${this.loopEnabled?'active':''}" @click=${() => this.loopEnabled = !this.loopEnabled}>LOOP MODE</button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
              <div><div class="slider-header"><span>SPEED RATE</span><span>${this.copyMachineRate}x</span></div><input type="range" min="0.5" max="1.5" step="0.01" .value=${this.copyMachineRate} @input=${e=>{this.copyMachineRate=Number(e.target.value);this.copyMachinePlayer.playbackRate=this.copyMachineRate;}}></div>
              <div><div class="slider-header"><span>VOLUME</span></div><input type="range" min="0" max="1" step="0.01" .value=${this.copyMachineVolume} @input=${e=>{this.copyMachineVolume=Number(e.target.value);this.copyMachinePlayer.volume=this.copyMachineVolume;}}></div>
            </div>
            <div style="text-align:right; font-family:monospace; margin-top:12px; color:#94a3b8; font-size:1rem;">${this.formatTime(this.cmCurrentTime)} / ${this.formatTime(this.cmDuration)}</div>
          ` : html`<div style="height:150px; display:flex; align-items:center; justify-content:center; color:#475569; border:3px dashed #1e293b; border-radius:16px; font-weight:700;">연습할 음원을 로드하여 카피를 시작하세요</div>`}
        </div>`;
      case 'backing': return html`
        <div class="section-card">
          <div class="section-header-row"><span class="section-title">Backing Track Library</span>
            <label class="btn-chip active">+ ADD TRACKS<input type="file" multiple @change=${this.handleFileUpload} style="display:none"></label>
          </div>
          <div style="display:flex; gap:8px; overflow-x:auto; margin-bottom:20px; padding-bottom:10px;">
            ${NOTES_SHARP.map(n => html`<button class="btn-chip ${this.selectedBackingKey===n?'active':''}" @click=${()=>this.selectedBackingKey=n}>${n}</button>`)}
          </div>
          <div>${(this.userTracks[this.selectedBackingKey] || []).map(t => html`
            <div class="track-item ${this.currentPlayingUrl===t.url?'playing':''}" @click=${() => {this.currentPlayingUrl=t.url; this.audioPlayer.src=t.url; this.audioPlayer.play();}}>
              <span style="font-weight:700;">${t.title}</span><button class="delete-btn" @click=${e=>{e.stopPropagation();deleteTrackFromDB(t.id).then(()=>this.loadAllTracks());}}>×</button>
            </div>`)}
          </div>
          ${this.currentPlayingUrl ? html`<div style="margin-top:20px;"><input type="range" min="0" .max=${this.audioDuration} .value=${this.audioCurrentTime} @input=${e=>this.audioPlayer.currentTime=Number(e.target.value)}><div style="text-align:right;font-family:monospace;font-size:0.9rem;margin-top:6px;">${this.formatTime(this.audioCurrentTime)} / ${this.formatTime(this.audioDuration)}</div></div>` : ''}
        </div>`;
      case 'tuner': return html`
        <div class="section-card">
          <div class="section-header-row"><span class="section-title">Master Tuner</span><button class="btn-chip ${this.tunerActive?'red-active':''}" @click=${this.toggleTuner}>${this.tunerActive?'STOP TUNER':'START TUNER'}</button></div>
          <div class="tuner-display">
            ${this.tunerActive ? html`
              <div class="tuner-note-main ${Math.abs(this.centOffset)<5?'in-tune':''}">${this.detectedNote}</div>
              <div class="tuner-meter"><div class="tuner-needle ${Math.abs(this.centOffset)<5?'in-tune':''}" style="left:${50 + this.centOffset}%"></div></div>
              <div class="tuner-freq">${this.detectedFrequency.toFixed(2)} Hz</div>
              <div style="font-weight:900; letter-spacing:0.2em; color:${Math.abs(this.centOffset)<5?'#10b981':this.centOffset<0?'#f59e0b':'#ef4444'}">${Math.abs(this.centOffset)<5?'IN TUNE':this.centOffset<0?'FLAT':'SHARP'}</div>
            ` : html`<div style="font-weight:700; color:#475569;">튜너를 활성화하고 튜닝을 확인하세요</div>`}
          </div>
        </div>`;
      default: return html``;
    }
  }

  formatTime(s) { if(isNaN(s)) return "0:00"; const m=Math.floor(s/60); const sc=Math.floor(s%60); return `${m}:${sc.toString().padStart(2,'0')}`; }

  render() { return html`${this.sectionOrder.map(k => this.renderSection(k))}`; }
}

customElements.define('guitar-scale-app', GuitarScaleApp);
