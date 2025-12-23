
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

// --- IndexedDB 관리 ---
const DB_NAME = 'GuitarBackingDB';
const STORE_NAME = 'tracks';

async function openDB(): Promise<IDBDatabase> {
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

async function saveTrackToDB(track: any) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(track);
  return new Promise((resolve) => (tx.oncomplete = resolve));
}

async function deleteTrackFromDB(id: string) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve) => (tx.oncomplete = resolve));
}

async function getAllTracksFromDB(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// --- 음악 이론 데이터 ---
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const GUITAR_TUNING = [4, 11, 7, 2, 9, 4]; 
const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];

interface Scale {
  name: string;
  intervals: number[];
}

const SCALES: Scale[] = [
  // 기본 및 메이저/마이너
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  // 펜타토닉 & 블루스
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  // 7가지 모드
  { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  // 확장 및 엑조틱 스케일
  { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  { name: 'Diminished (H-W)', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  { name: 'Diminished (W-H)', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  { name: 'Altered', intervals: [0, 1, 3, 4, 6, 8, 10] },
  { name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10] },
  { name: 'Lydian Dominant', intervals: [0, 2, 4, 6, 7, 9, 10] },
  { name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11] },
  { name: 'Spanish Gypsy', intervals: [0, 1, 4, 5, 7, 8, 10] },
];

const INTERVAL_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#f97316', 2: '#f59e0b', 3: '#fbbf24', 4: '#10b981',
  5: '#06b6d4', 6: '#0891b2', 7: '#3b82f6', 8: '#6366f1', 9: '#8b5cf6',
  10: '#a855f7', 11: '#ec4899',
};

interface Track {
  id: string;
  title: string;
  fileName: string;
  url: string;
  key: string;
  sortOrder: number;
}

type Notation = 'English' | 'Degree' | 'Sharp';
type HarmonyMode = 'Individual' | 'Chord' | 'Scale';
type DrumMode = 'None' | 'Rock' | 'Blues' | 'Jazz' | 'Funk' | 'Reggae' | 'Swing' | 'Metal' | 'Bossa' | 'Shuffle' | 'Country' | 'Punk';

@customElement('guitar-scale-app')
export class GuitarScaleApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Pretendard', system-ui, -apple-system, sans-serif;
      padding: 16px;
      gap: 16px;
      box-sizing: border-box;
    }

    .section-card {
      position: relative;
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      margin: 0;
      font-size: 1rem;
      color: #94a3b8;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .order-controls { display: flex; gap: 4px; }

    .btn-order {
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .time-signature-selector {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    select.ts-select {
      background: #334155;
      color: white;
      border: 1px solid #475569;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .top-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .btn-main {
      flex: 1;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 140px;
    }

    .btn-icon {
      background: #334155;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon.active { background: #ef4444; }

    .btn-toggle-sound {
      background: #334155;
      border: 1px solid #475569;
      color: #94a3b8;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-toggle-sound.enabled { background: #10b981; color: white; border-color: #10b981; }

    .slider-group { display: flex; flex-direction: column; gap: 16px; }

    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    input[type="range"] { width: 100%; accent-color: #3b82f6; }

    .rhythm-grid { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 20px; overflow-x: auto; padding-bottom: 8px; }

    .beat-column { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 6px; border-radius: 8px; border: 2px solid transparent; min-width: 40px; }
    .beat-column.active { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); }

    .dots-row { display: flex; gap: 4px; align-items: center; height: 18px; }

    .dot { width: 10px; height: 10px; border-radius: 50%; background: #334155; transition: all 0.1s; cursor: pointer; }
    .dot.active { background: #8b5cf6; transform: scale(1.3); }
    .dot.hit { border: 2px solid #8b5cf6; background: #8b5cf6; }

    .beat-label { font-size: 0.9rem; font-weight: 800; color: #64748b; }

    .control-panel { display: flex; flex-direction: column; gap: 12px; }
    .control-row { display: flex; align-items: flex-start; gap: 12px; }
    .row-label { width: 90px; font-size: 0.9rem; color: #94a3b8; padding-top: 8px; flex-shrink: 0; }
    .btn-group { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }

    .btn-chip {
      background: #334155;
      border: none;
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-chip.active { background: #3b82f6; color: white; }
    .btn-chip.red-active { background: #ef4444; color: white; }

    .fretboard-container { margin-top: 0; overflow-x: auto; background: #1e293b; padding: 24px 0 48px 0; border-radius: 12px; }
    .fretboard { position: relative; min-width: 1100px; display: grid; grid-template-rows: repeat(6, 36px); gap: 4px; margin-left: 55px; margin-right: 20px; }
    .string { position: relative; height: 2px; background: #64748b; margin: 17px 0; width: 100%; z-index: 3; }
    .fret-line { position: absolute; top: -8px; bottom: -8px; width: 2px; background: #475569; z-index: 1; }
    .fret-inlay { position: absolute; width: 12px; height: 12px; background: #475569; border-radius: 50%; transform: translate(-50%, -50%); z-index: 0; opacity: 0.4; }
    .fret-number { position: absolute; bottom: -40px; font-size: 0.8rem; color: #64748b; text-align: center; font-weight: 700; }

    .note-marker {
      position: absolute; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;
      z-index: 4; color: white; box-shadow: 0 3px 6px rgba(0,0,0,0.5);
    }
    .note-marker.root-note { border: 3px solid #ffffff; z-index: 10; width: 32px; height: 32px; font-size: 0.8rem; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }

    .string-label { position: absolute; left: -42px; top: 50%; transform: translateY(-50%); width: 28px; font-size: 1rem; color: #94a3b8; font-weight: 900; text-align: right; }

    .tuner-card { background: #1e293b; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .tuner-display {
      width: 100%; max-width: 600px; height: 220px; background: #0f172a; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      border: 2px solid #334155; padding: 20px 0;
    }
    .tuner-note-group { display: flex; align-items: baseline; }
    .tuner-note { font-size: 4.5rem; font-weight: 900; color: #f8fafc; line-height: 1; }
    .tuner-note.in-tune { color: #22c55e; text-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
    .tuner-octave { font-size: 1.8rem; color: #64748b; margin-left: 8px; }
    .tuner-freq { font-size: 1.2rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-weight: 700; }

    .tuner-visualizer { width: 100%; padding: 0 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .tuner-dots-container { display: flex; justify-content: space-between; width: 100%; align-items: center; position: relative; height: 30px; }
    .tuner-center-line { position: absolute; left: 50%; top: -10px; bottom: -10px; width: 3px; background: #475569; transform: translateX(-50%); border-radius: 2px; }
    .tuner-center-line.in-tune { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
    .tuner-dot { width: 8px; height: 8px; border-radius: 50%; background: #334155; transition: all 0.1s; }
    .tuner-dot.flat.active { background: #facc15; box-shadow: 0 0 10px #facc15; transform: scale(2); }
    .tuner-dot.sharp.active { background: #ef4444; box-shadow: 0 0 10px #ef4444; transform: scale(2); }
    .tuner-status { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px; }
    .tuner-status.flat { color: #facc15; }
    .tuner-status.sharp { color: #ef4444; }
    .tuner-status.in-tune { color: #22c55e; }

    .backing-track-card, .copy-machine-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .waveform-container {
      position: relative;
      width: 100%;
      height: 120px;
      background: #0f172a;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      cursor: crosshair;
    }
    .waveform-canvas { width: 100%; height: 100%; display: block; }
    .waveform-progress {
      position: absolute; top: 0; bottom: 0; width: 2px; background: #fff; z-index: 5; pointer-events: none;
    }
    .loop-overlay {
      position: absolute; top: 0; bottom: 0; background: rgba(59, 130, 246, 0.2); border-left: 1px solid #3b82f6; border-right: 1px solid #3b82f6; z-index: 2; pointer-events: none;
    }
  `;

  @state() sectionOrder: string[] = ['rhythm_station', 'config', 'fretboard', 'backing', 'copy', 'tuner'];
  @state() notation: Notation = 'English';
  @state() harmonyMode: HarmonyMode = 'Scale';
  @state() rootNote: string = 'C';
  @state() scaleType: string = 'Major';
  @state() timeSignature: string = '4/4';
  @state() bpm: number = 100;
  @state() syncopation: number = 5;
  @state() difficulty: number = 5;
  @state() drumComplexity: number = 5;
  @state() isPlaying: boolean = false;
  @state() currentBeat: number = 0; 
  @state() rhythmPattern: number[] = Array(32).fill(0);
  @state() metronomeEnabled: boolean = true;
  @state() drumMode: DrumMode = 'Rock';
  @state() selectedBackingKey: string = 'C';
  @state() userTracks: Record<string, Track[]> = {
    'C': [], 'C#': [], 'D': [], 'D#': [], 'E': [], 'F': [], 'F#': [], 'G': [], 'G#': [], 'A': [], 'A#': [], 'B': []
  };
  @state() currentPlayingUrl: string = '';
  @state() isTrackPlaying: boolean = false;
  @state() audioCurrentTime: number = 0;
  @state() audioDuration: number = 0;
  
  // Copy Machine States
  @state() loopStart: number = 0;
  @state() loopEnd: number = 0;
  @state() loopEnabled: boolean = false;
  @state() copyMachineRate: number = 1.0;
  @state() copyMachineVolume: number = 1.0;
  @state() copyMachineUrl: string = '';
  @state() isCopyMachinePlaying: boolean = false;
  @state() cmCurrentTime: number = 0;
  @state() cmDuration: number = 0;
  @state() cmWaveformData: number[] = [];

  // Tuner States
  @state() tunerActive: boolean = false;
  @state() detectedFrequency: number = 0;
  @state() centOffset: number = 0;
  @state() detectedNote: string = '-';
  @state() detectedOctave: string = '';

  @query('#cmWaveform') cmCanvas?: HTMLCanvasElement;

  private audioCtx?: AudioContext;
  private nextNoteTime: number = 0;
  private timerID?: number;
  private tunerAnalyser?: AnalyserNode;
  private tunerStream?: MediaStream;
  private tunerAnimationId?: number;
  private audioPlayer = new Audio();
  private copyMachinePlayer = new Audio();

  async connectedCallback() {
    super.connectedCallback();
    this.audioPlayer.addEventListener('timeupdate', () => {
      this.audioCurrentTime = this.audioPlayer.currentTime;
      this.audioDuration = this.audioPlayer.duration;
    });
    this.copyMachinePlayer.addEventListener('timeupdate', () => {
      this.cmCurrentTime = this.copyMachinePlayer.currentTime;
      this.cmDuration = this.copyMachinePlayer.duration;
      if (this.loopEnabled && this.loopEnd > 0) {
        if (this.cmCurrentTime >= this.loopEnd || this.cmCurrentTime < this.loopStart) {
          this.copyMachinePlayer.currentTime = this.loopStart;
        }
      }
    });
    await this.loadAllTracks();
    this.updateRhythmLocally();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('cmWaveformData') || changedProperties.has('cmCurrentTime')) {
      this.drawWaveform();
    }
  }

  // --- Helper: Ensure Audio Context is active ---
  private async ensureAudioCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // --- Drum Sound Synthesis ---
  private playKick(time: number, vol = 1.0) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.start(time); osc.stop(time + 0.5);
  }

  private playSnare(time: number, vol = 0.5) {
    if (!this.audioCtx) return;
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1000;
    const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(vol, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination);
    noise.start(time); noise.stop(time + 0.2);
    const osc = this.audioCtx.createOscillator(); const oGain = this.audioCtx.createGain();
    osc.frequency.setValueAtTime(180, time); oGain.gain.setValueAtTime(vol * 0.6, time); oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oGain); oGain.connect(this.audioCtx.destination);
    osc.start(time); osc.stop(time + 0.1);
  }

  private playHiHat(time: number, vol = 0.2) {
    if (!this.audioCtx) return;
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.05;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 10000;
    const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(vol, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination);
    noise.start(time); noise.stop(time + 0.05);
  }

  private playRimshot(time: number, vol = 0.4) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.05);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time); osc.stop(time + 0.05);
  }

  private async loadAllTracks() {
    try {
      const storedTracks = await getAllTracksFromDB();
      const newMap: Record<string, Track[]> = {
        'C': [], 'C#': [], 'D': [], 'D#': [], 'E': [], 'F': [], 'F#': [], 'G': [], 'G#': [], 'A': [], 'A#': [], 'B': []
      };
      storedTracks.forEach((t: any) => {
        const url = URL.createObjectURL(t.blob);
        const track: Track = { id: t.id, title: t.title, fileName: t.fileName, key: t.key, sortOrder: t.sortOrder || 0, url: url };
        if (newMap[t.key]) newMap[t.key].push(track);
      });
      this.userTracks = newMap;
    } catch (e) { console.error(e); }
  }

  private async handleFileUpload(e: any, isCopyMachine: boolean = false) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    const currentKey = this.selectedBackingKey;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      if (isCopyMachine) {
        await this.generateWaveform(file);
        this.handleCopyMachinePlay(URL.createObjectURL(file));
      } else {
        const trackData = { id, title: file.name, fileName: file.name, key: currentKey, blob: file, sortOrder: Date.now() + i };
        await saveTrackToDB(trackData);
      }
    }
    await this.loadAllTracks();
    if (input) input.value = '';
  }

  private async generateWaveform(file: File) {
    const ctx = await this.ensureAudioCtx();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const samples = 400;
    const blockSize = Math.floor(channelData.length / samples);
    const peaks = [];
    for (let i = 0; i < samples; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[i * blockSize + j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    this.cmWaveformData = peaks;
    this.cmDuration = audioBuffer.duration;
    this.loopStart = 0;
    this.loopEnd = audioBuffer.duration;
    this.loopEnabled = false;
  }

  private drawWaveform() {
    if (!this.cmCanvas || this.cmWaveformData.length === 0) return;
    const ctx = this.cmCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.cmCanvas.width = this.cmCanvas.offsetWidth;
    const h = this.cmCanvas.height = this.cmCanvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    
    const barWidth = w / this.cmWaveformData.length;
    ctx.fillStyle = '#3b82f6';
    this.cmWaveformData.forEach((peak, i) => {
      const barHeight = peak * h;
      ctx.fillRect(i * barWidth, (h - barHeight) / 2, barWidth - 1, barHeight);
    });
  }

  private handleWaveformClick(e: MouseEvent) {
    if (!this.cmCanvas) return;
    const rect = this.cmCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    this.copyMachinePlayer.currentTime = ratio * this.cmDuration;
  }

  private async deleteTrack(key: string, id: string, url: string) {
    await deleteTrackFromDB(id);
    URL.revokeObjectURL(url);
    await this.loadAllTracks();
  }

  private async handleTrackPlay(url: string) {
    await this.ensureAudioCtx();
    if (this.currentPlayingUrl === url) {
      if (this.isTrackPlaying) { this.audioPlayer.pause(); this.isTrackPlaying = false; }
      else { this.audioPlayer.play(); this.isTrackPlaying = true; }
    } else {
      this.currentPlayingUrl = url;
      this.audioPlayer.src = url;
      this.audioPlayer.play();
      this.isTrackPlaying = true;
    }
  }

  private async handleCopyMachinePlay(url: string) {
    await this.ensureAudioCtx();
    if (this.copyMachineUrl === url) {
      if (this.isCopyMachinePlaying) { this.copyMachinePlayer.pause(); this.isCopyMachinePlaying = false; }
      else { this.copyMachinePlayer.play(); this.isCopyMachinePlaying = true; }
    } else {
      this.copyMachineUrl = url;
      this.copyMachinePlayer.src = url;
      this.copyMachinePlayer.play();
      this.isCopyMachinePlaying = true;
    }
  }

  private handleSeek(e: any) { this.audioPlayer.currentTime = parseFloat(e.target.value); }
  private handleCopyMachineSpeed(rate: number) { this.copyMachineRate = rate; this.copyMachinePlayer.playbackRate = rate; }
  private handleCopyMachineVolume(e: any) { this.copyMachineVolume = parseFloat(e.target.value); this.copyMachinePlayer.volume = this.copyMachineVolume; }
  private formatTime(seconds: number) { if (isNaN(seconds)) return "0:00"; const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec.toString().padStart(2, '0')}`; }
  
  private getNumerator(): number { const [num] = this.timeSignature.split('/').map(Number); return num; }
  private getDenominator(): number { const [_, den] = this.timeSignature.split('/').map(Number); return den; }
  private getStepsPerBeat(): number { 
    const den = this.getDenominator();
    return den === 8 ? 2 : 4; 
  }
  private getTotalSteps(): number {
    return this.getNumerator() * this.getStepsPerBeat();
  }

  private updateRhythmLocally() {
    const total = this.getTotalSteps();
    const newPattern = Array(total).fill(0);
    const steps = this.getStepsPerBeat();
    
    for (let i = 0; i < total; i++) {
      const isOnBeat = (i % steps === 0);
      if (isOnBeat) {
        newPattern[i] = 1;
      } else {
        const syncChance = this.syncopation / 20;
        const diffChance = this.difficulty / 20;
        if (Math.random() < syncChance && Math.random() < diffChance) {
          newPattern[i] = 1;
        }
      }
    }
    this.rhythmPattern = newPattern;
  }

  private async togglePlayback() {
    const ctx = await this.ensureAudioCtx();
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) { 
      this.currentBeat = 0; 
      this.nextNoteTime = ctx.currentTime; 
      this.scheduler(); 
    }
    else { clearTimeout(this.timerID); }
  }

  private scheduler() {
    if (!this.audioCtx) return;
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      const stepDuration = (60.0 / this.bpm) / 4.0;
      this.nextNoteTime += stepDuration;
      this.currentBeat = (this.currentBeat + 1) % this.getTotalSteps();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), 25.0);
  }

  private scheduleNote(step: number, time: number) {
    if (!this.audioCtx) return;
    const pos = step % this.getTotalSteps();
    
    if (this.metronomeEnabled && this.rhythmPattern[pos]) {
      const isDown = pos === 0;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(isDown ? 1000 : 500, time);
      gain.gain.setValueAtTime(isDown ? 0.2 : 0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time); osc.stop(time + 0.05);
    }

    if (this.drumMode !== 'None') {
      this.scheduleDrumPattern(pos, time);
    }
  }

  private scheduleDrumPattern(pos: number, time: number) {
    const complexity = this.drumComplexity / 10;
    const total = this.getTotalSteps();
    const den = this.getDenominator();
    const steps = this.getStepsPerBeat();

    // High Hat - Steady pulse (Improved sounds per genre)
    let hatVol = 0.12;
    if (this.drumMode === 'Jazz' || this.drumMode === 'Swing') {
      // Swing ride pattern (1, 2&, 3, 4&)
      if (pos % 4 === 0 || pos % 4 === 3) this.playHiHat(time, 0.15);
    } else if (this.drumMode === 'Shuffle' || this.drumMode === 'Blues') {
      // Triplet shuffle (1, (2), 3)
      if (pos % 3 === 0 || pos % 3 === 2) this.playHiHat(time, 0.12);
    } else {
      if (pos % 2 === 0) this.playHiHat(time, hatVol);
      if (complexity > 0.6 && pos % 2 !== 0 && Math.random() < complexity * 0.4) this.playHiHat(time, 0.04);
    }

    switch (this.drumMode) {
      case 'Rock':
        if (pos === 0 || (complexity > 0.4 && pos === Math.floor(total * 0.625))) this.playKick(time);
        if (pos === Math.floor(total / 2)) this.playSnare(time, 0.7);
        if (complexity > 0.8 && pos === total - 2) this.playSnare(time, 0.25);
        break;
      case 'Funk':
        if (pos === 0 || pos === 6 || (complexity > 0.5 && pos === 10)) this.playKick(time);
        if (pos === steps || pos === steps * 3) this.playSnare(time, 0.5);
        if (complexity > 0.3 && (pos % 4 !== 0) && Math.random() < complexity * 0.6) this.playSnare(time, 0.1); // Ghost notes
        break;
      case 'Jazz':
        if (pos === 0 || (complexity > 0.7 && pos === 8)) this.playKick(time, 0.4);
        if (pos % 4 === 0) this.playHiHat(time, 0.2); // Pedal hat
        if (complexity > 0.5 && Math.random() < 0.15) this.playSnare(time, 0.1);
        break;
      case 'Blues':
        if (pos % 6 === 0) this.playKick(time, 0.8);
        if (pos === 6) this.playSnare(time, 0.6);
        break;
      case 'Reggae':
        // One Drop: 3rd beat has kick + snare
        if (pos === Math.floor(total / 2)) { this.playKick(time); this.playSnare(time, 0.8); }
        if (complexity > 0.7 && pos === 0) this.playRimshot(time, 0.3);
        break;
      case 'Metal':
        if (pos % 2 === 0) this.playKick(time, 1.1); // Constant double kick
        if (pos === steps || pos === steps * 3) this.playSnare(time, 0.9);
        break;
      case 'Swing':
        if (pos % 4 === 0) this.playKick(time, 0.5);
        if (pos % 4 === 2) this.playHiHat(time, 0.25);
        break;
      case 'Bossa':
        // 킥 클라베: 1, (2), 3, (4) &
        if (pos === 0 || pos === 6 || pos === 10 || pos === 14) this.playKick(time, 0.7);
        // 스틱 패턴: 0, 3, 6, 10, 13
        const stick = [0, 3, 6, 10, 13];
        if (stick.includes(pos)) this.playRimshot(time, 0.5);
        break;
      case 'Shuffle':
        if (pos % 6 === 0) this.playKick(time);
        if (pos === 6) this.playSnare(time, 0.6);
        break;
      case 'Country':
        // Boom-Chick: 킥-스네어-킥-스네어
        if (pos % 8 === 0 || pos % 8 === 4) this.playKick(time, 0.9);
        if (pos % 8 === 2 || pos % 8 === 6) this.playSnare(time, 0.5);
        break;
      case 'Punk':
        // Fast 2-beat
        if (pos % 4 === 0 || pos % 4 === 1) this.playKick(time, 1.0);
        if (pos % 4 === 2) this.playSnare(time, 0.8);
        break;
    }
  }

  private async toggleTuner() { if (this.tunerActive) this.stopTuner(); else await this.startTuner(); }
  
  private async startTuner() {
    try {
      const ctx = await this.ensureAudioCtx();
      this.tunerStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(this.tunerStream);
      this.tunerAnalyser = ctx.createAnalyser(); this.tunerAnalyser.fftSize = 2048;
      source.connect(this.tunerAnalyser); this.tunerActive = true;
      this.updateTuner(ctx);
    } catch (err: any) {
      alert("마이크 접근 권한이 필요합니다.");
      this.tunerActive = false;
    }
  }

  private stopTuner() { this.tunerActive = false; this.tunerStream?.getTracks().forEach(t => t.stop()); if (this.tunerAnimationId) cancelAnimationFrame(this.tunerAnimationId); }
  
  private updateTuner(ctx: AudioContext) {
    if (!this.tunerActive || !this.tunerAnalyser) return;
    const buffer = new Float32Array(this.tunerAnalyser.fftSize);
    this.tunerAnalyser.getFloatTimeDomainData(buffer);
    const freq = this.autoCorrelate(buffer, ctx.sampleRate);
    if (freq !== -1) {
      this.detectedFrequency = freq;
      const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
      const rolledNote = Math.round(noteNum) + 69;
      this.centOffset = Math.floor(100 * (noteNum - Math.round(noteNum)));
      this.detectedNote = NOTES_SHARP[rolledNote % 12] || '-';
      this.detectedOctave = (Math.floor(rolledNote / 12) - 1).toString();
    }
    this.tunerAnimationId = requestAnimationFrame(() => this.updateTuner(ctx));
  }

  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    let size = buffer.length; let rms = 0; for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / size); if (rms < 0.01) return -1;
    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < size / 2; i++) if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }
    const buf = buffer.slice(r1, r2); size = buf.length; let c = new Float32Array(size);
    for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1; for (let i = d; i < size; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    let T0 = maxpos; const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2; const b = (x3 - x1) / 2; if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  }

  private moveSection(key: string, dir: 'up' | 'down') {
    const idx = this.sectionOrder.indexOf(key);
    const newOrder = [...this.sectionOrder];
    if (dir === 'up' && idx > 0) [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    else if (dir === 'down' && idx < newOrder.length - 1) [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    this.sectionOrder = newOrder;
  }

  private getNoteLabel(noteIdx: number, interval: number): string {
    if (this.notation === 'Degree') return ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'][interval] || '?';
    return (this.notation === 'Sharp' ? NOTES_SHARP : NOTES_FLAT)[noteIdx] || '?';
  }

  private renderSection(key: string) {
    switch (key) {
      case 'rhythm_station':
        const total = this.getTotalSteps();
        const stepsPerBeat = this.getStepsPerBeat();
        return html`
          <div class="section-card">
            <div class="section-header-row"><span class="section-title">Rhythm Station</span>
              <div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('rhythm_station','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('rhythm_station','down')}>↓</button></div>
            </div>
            <div class="time-signature-selector">
              <div style="display:flex;align-items:center;gap:8px;"><label>박자:</label>
                <select class="ts-select" @change=${(e:any)=>{this.timeSignature=e.target.value; this.updateRhythmLocally();}} .value=${this.timeSignature}>
                  <option value="2/4">2/4</option><option value="3/4">3/4</option><option value="4/4">4/4</option>
                  <option value="5/4">5/4</option><option value="6/8">6/8</option><option value="7/8">7/8</option><option value="12/8">12/8</option>
                </select>
              </div>
              <div style="font-size:1.2rem;font-weight:bold;color:#3b82f6;">${this.bpm} BPM</div>
            </div>
            <div class="top-controls">
              <button class="btn-icon ${this.isPlaying ? 'active' : ''}" @click=${this.togglePlayback}>${this.isPlaying ? 'Ⅱ' : '▶'}</button>
              <button class="btn-toggle-sound ${this.metronomeEnabled ? 'enabled' : ''}" @click=${()=>this.metronomeEnabled=!this.metronomeEnabled}>메트로놈</button>
              <button class="btn-toggle-sound ${this.drumMode!=='None' ? 'enabled' : ''}" @click=${()=>this.drumMode=this.drumMode==='None'?'Rock':'None'}>드럼 활성</button>
              <button class="btn-main" @click=${this.updateRhythmLocally}>로컬 리듬 생성</button>
            </div>
            <div class="slider-group">
              <div class="slider-item"><div class="slider-header"><span>템포</span><span>${this.bpm}</span></div><input type="range" min="40" max="220" .value=${this.bpm} @input=${(e:any)=>this.bpm=parseInt(e.target.value)}></div>
              <div class="slider-item"><div class="slider-header"><span>당김음</span><span>${this.syncopation}</span></div><input type="range" min="1" max="10" .value=${this.syncopation} @input=${(e:any)=>{this.syncopation=parseInt(e.target.value);this.updateRhythmLocally();}}></div>
              <div class="slider-item"><div class="slider-header"><span>난이도</span><span>${this.difficulty}</span></div><input type="range" min="1" max="10" .value=${this.difficulty} @input=${(e:any)=>{this.difficulty=parseInt(e.target.value);this.updateRhythmLocally();}}></div>
              <div class="slider-item"><div class="slider-header"><span>드럼 복잡도</span><span>${this.drumComplexity}</span></div><input type="range" min="1" max="10" .value=${this.drumComplexity} @input=${(e:any)=>this.drumComplexity=parseInt(e.target.value)}></div>
            </div>
            <div style="margin-top:16px;"><div class="slider-header"><span>드럼 장르</span></div><div class="btn-group">${['None', 'Rock', 'Jazz', 'Funk', 'Swing', 'Reggae', 'Metal', 'Bossa', 'Shuffle', 'Country', 'Punk'].map(m => html`<button class="btn-chip ${this.drumMode === m ? 'active' : ''}" @click=${()=>this.drumMode=m as any}>${m}</button>`)}</div></div>
            <div class="rhythm-grid">
              ${Array.from({length: this.getNumerator()}, (_, bIdx) => {
                const step = this.currentBeat % total;
                return html`<div class="beat-column ${Math.floor(step / stepsPerBeat) === bIdx ? 'active' : ''}"><div class="dots-row">${Array.from({length: stepsPerBeat}, (_, sIdx) => {
                  const abs = bIdx * stepsPerBeat + sIdx; return html`<div class="dot ${this.rhythmPattern[abs] ? 'hit' : ''} ${step === abs ? 'active' : ''}" @click=${()=>{const pat=[...this.rhythmPattern]; pat[abs]=pat[abs]?0:1; this.rhythmPattern=pat;}}></div>`;
                })}</div><div class="beat-label">${bIdx + 1}</div></div>`;
              })}
            </div>
          </div>`;
      case 'config':
        return html`<div class="section-card control-panel">
          <div class="section-header-row"><span class="section-title">Scale Config</span><div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('config','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('config','down')}>↓</button></div></div>
          <div class="control-row"><div class="row-label">표기:</div><div class="btn-group">${['English', 'Degree', 'Sharp'].map(n => html`<button class="btn-chip ${this.notation === n ? 'active' : ''}" @click=${()=>this.notation=n as any}>${n}</button>`)}</div></div>
          <div class="control-row"><div class="row-label">구성:</div><div class="btn-group">${['Individual', 'Chord', 'Scale'].map(h => html`<button class="btn-chip ${this.harmonyMode === h ? 'active' : ''}" @click=${()=>this.harmonyMode=h as any}>${h === 'Individual' ? '개별음' : h === 'Chord' ? '코드톤' : '스케일'}</button>`)}</div></div>
          <div class="control-row"><div class="row-label">근음:</div><div class="btn-group">${NOTES_SHARP.map(n => html`<button class="btn-chip ${this.rootNote === n ? 'red-active' : ''}" @click=${()=>this.rootNote=n}>${n}</button>`)}</div></div>
          <div class="control-row"><div class="row-label">스케일:</div><div class="btn-group">${SCALES.map(s => html`<button class="btn-chip ${this.scaleType === s.name ? 'active' : ''}" @click=${()=>this.scaleType=s.name}>${s.name}</button>`)}</div></div>
        </div>`;
      case 'fretboard':
        const rIdx = NOTES_SHARP.indexOf(this.rootNote); const sc = SCALES.find(s => s.name === this.scaleType);
        const scNotes = sc ? sc.intervals.map(i => (rIdx + i) % 12) : [rIdx];
        const chordNotes = [scNotes[0], scNotes[2], scNotes[4], scNotes[6]].filter(n => n !== undefined);
        const visible = this.harmonyMode === 'Chord' ? chordNotes : this.harmonyMode === 'Individual' ? [rIdx] : scNotes;
        return html`<div class="fretboard-container section-card">
          <div class="section-header-row" style="margin-left:55px;"><span class="section-title">Fretboard</span><div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('fretboard','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('fretboard','down')}>↓</button></div></div>
          <div class="fretboard">${[3, 5, 7, 9, 12, 15].map(f => html`<div class="fret-inlay" style="left:${(f - 0.5) * 6.25}%; top:50%"></div>`)}
            ${GUITAR_TUNING.map((base, sIdx) => html`<div class="string"><span class="string-label">${STRINGS[sIdx]}</span>
              ${Array.from({length: 16}).map((_, f) => {
                const nIdx = (base + f) % 12; if (!visible.includes(nIdx)) return null; const iv = (12 + nIdx - rIdx) % 12;
                return html`<div class="note-marker ${iv === 0 ? 'root-note' : ''}" style="left:${(f - 0.5) * 6.25}%; background:${INTERVAL_COLORS[iv]}">${this.getNoteLabel(nIdx, iv)}</div>`;
              })}</div>`)}
            ${Array.from({length: 16}).map((_, i) => html`<div class="fret-line" style="left:${i * 6.25}%"></div><div class="fret-number" style="left:${i * 6.25}%">${i}</div>`)}
          </div></div>`;
      case 'tuner':
        const tune = Math.abs(this.centOffset) < 5;
        return html`<div class="tuner-card section-card">
          <div class="section-header-row" style="width:100%"><span class="section-title">Master Tuner</span><div style="display:flex;gap:12px;"><button class="btn-chip ${this.tunerActive ? 'red-active' : ''}" @click=${this.toggleTuner}>${this.tunerActive ? 'OFF' : 'ON'}</button><div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('tuner','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('tuner','down')}>↓</button></div></div></div>
          <div class="tuner-display">${this.tunerActive ? html`
            <div class="tuner-note-group"><span class="tuner-note ${tune ? 'in-tune' : ''}">${this.detectedNote}</span><span class="tuner-octave">${this.detectedOctave}</span></div>
            <div class="tuner-visualizer"><div class="tuner-dots-container"><div class="tuner-center-line ${tune ? 'in-tune' : ''}"></div>
                ${Array.from({length: 10}).map((_, i) => html`<div class="tuner-dot flat ${this.centOffset < -5 && Math.abs(this.centOffset - (-50 + i * 4.5)) < 5 ? 'active' : ''}"></div>`)}<div style="width:20px;"></div>
                ${Array.from({length: 10}).map((_, i) => html`<div class="tuner-dot sharp ${this.centOffset > 5 && Math.abs(this.centOffset - (5 + i * 4.5)) < 5 ? 'active' : ''}"></div>`)}
            </div><div class="tuner-freq">${this.detectedFrequency.toFixed(1)} Hz</div><div class="tuner-status ${tune?'in-tune':this.centOffset<0?'flat':'sharp'}">${tune?'In Tune':this.centOffset<0?'Flat':'Sharp'}</div></div>
          ` : html`<div>TUNER OFF</div>`}</div></div>`;
      case 'backing':
        return html`<div class="backing-track-card section-card">
          <div class="section-header-row"><span class="section-title">Backing Tracks</span><div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('backing','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('backing','down')}>↓</button></div></div>
          <div class="btn-group" style="margin-bottom:12px;">${NOTES_SHARP.map(n => html`<button class="btn-chip ${this.selectedBackingKey === n ? 'active' : ''}" @click=${()=>this.selectedBackingKey=n}>${n}</button>`)}</div>
          <label class="btn-chip active" style="cursor:pointer">+ 음원 추가 <input type="file" multiple accept="audio/*" @change=${this.handleFileUpload} style="display:none"></label>
          <div class="track-list">${(this.userTracks[this.selectedBackingKey] || []).map(t => html`<div class="track-item ${this.currentPlayingUrl===t.url?'playing':''}" @click=${()=>this.handleTrackPlay(t.url)}><span>${t.title}</span><button class="btn-order" @click=${(e:any)=>{e.stopPropagation();this.deleteTrack(this.selectedBackingKey,t.id,t.url);}}>×</button></div>`)}</div>
          ${this.currentPlayingUrl ? html`<div class="audio-controls"><input type="range" min="0" .max=${this.audioDuration} .value=${this.audioCurrentTime} @input=${this.handleSeek}><div style="font-size:0.8rem">${this.formatTime(this.audioCurrentTime)} / ${this.formatTime(this.audioDuration)}</div></div>` : ''}
        </div>`;
      case 'copy':
        return html`<div class="copy-machine-card section-card">
          <div class="section-header-row"><span class="section-title" style="color:#3b82f6;">Copy Machine</span>
            <div style="display:flex;gap:12px;"><label class="btn-chip active" style="cursor:pointer">+ 로드<input type="file" @change=${(e:any)=>this.handleFileUpload(e,true)} style="display:none"></label><div class="order-controls"><button class="btn-order" @click=${()=>this.moveSection('copy','up')}>↑</button><button class="btn-order" @click=${()=>this.moveSection('copy','down')}>↓</button></div></div>
          </div>
          ${this.copyMachineUrl ? html`
            <div class="waveform-container" @click=${this.handleWaveformClick}>
              <canvas id="cmWaveform" class="waveform-canvas"></canvas>
              <div class="waveform-progress" style="left: ${(this.cmCurrentTime / this.cmDuration) * 100}%"></div>
              ${this.loopEnabled ? html`
                <div class="loop-overlay" style="left: ${(this.loopStart / this.cmDuration) * 100}%; width: ${((this.loopEnd - this.loopStart) / this.cmDuration) * 100}%"></div>
              ` : ''}
            </div>
            <div class="control-panel">
              <div class="control-row">
                <div class="btn-group">
                  <button class="btn-chip active" @click=${() => this.handleCopyMachinePlay(this.copyMachineUrl)}>${this.isCopyMachinePlaying ? 'Pause' : 'Play'}</button>
                  <button class="btn-chip" @click=${() => this.loopStart = this.cmCurrentTime}>A (Start)</button>
                  <button class="btn-chip" @click=${() => this.loopEnd = this.cmCurrentTime}>B (End)</button>
                  <button class="btn-chip ${this.loopEnabled ? 'red-active' : ''}" @click=${() => this.loopEnabled = !this.loopEnabled}>Loop: ${this.loopEnabled ? 'ON' : 'OFF'}</button>
                </div>
              </div>
              <div class="control-row">
                <div class="row-label">속도:</div>
                <div class="btn-group">
                  ${[0.5, 0.75, 1.0, 1.25].map(r => html`<button class="btn-chip ${this.copyMachineRate === r ? 'active' : ''}" @click=${() => this.handleCopyMachineSpeed(r)}>${r}x</button>`)}
                </div>
              </div>
              <div class="control-row">
                <div class="row-label">볼륨:</div>
                <input type="range" min="0" max="1" step="0.01" .value=${this.copyMachineVolume} @input=${this.handleCopyMachineVolume}>
              </div>
              <div style="font-size:0.8rem;color:#94a3b8;text-align:right;">${this.formatTime(this.cmCurrentTime)} / ${this.formatTime(this.cmDuration)}</div>
            </div>
          ` : html`<div style="height:120px;display:flex;align-items:center;justify-content:center;color:#64748b;border:2px dashed #334155;border-radius:8px;">오디오 파일을 로드하세요</div>`}
        </div>`;
      default: return html``;
    }
  }

  render() { return html`${this.sectionOrder.map(key => this.renderSection(key))}`; }
}
