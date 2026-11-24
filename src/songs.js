// ============================================================================
// KeyFlow Studio — Universal Sheet Parser & FULL-LENGTH Built-in Songs Library
// ============================================================================

// Standard 61-key Virtual Piano mapping (C2 to C7)
const VP_CHAR_TO_NOTE = {
  // Octave 2
  '1': 'C2', '&': 'C2',
  '!': 'C#2', '²': 'C#2',
  '2': 'D2', 'é': 'D2',
  '@': 'D#2', '~': 'D#2',
  '3': 'E2', '"': 'E2',
  '4': 'F2', "'": 'F2',
  '$': 'F#2',
  '5': 'G2', '(': 'G2',
  '%': 'G#2',
  '6': 'A2', '-': 'A2',
  '^': 'A#2', '¨': 'A#2',
  '7': 'B2', 'è': 'B2',

  // Octave 3
  '8': 'C3', '_': 'C3',
  '*': 'C#3',
  '9': 'D3', 'ç': 'D3',
  ')': 'D#3', '°': 'D#3',
  '0': 'E3', 'à': 'E3',
  'q': 'F3', 'Q': 'F#3',
  'w': 'G3', 'W': 'G#3',
  'e': 'A3', 'E': 'A#3',
  'r': 'B3',

  // Octave 4
  't': 'C4', 'T': 'C#4',
  'y': 'D4', 'Y': 'D#4',
  'u': 'E4',
  'i': 'F4', 'I': 'F#4',
  'o': 'G4', 'O': 'G#4',
  'p': 'A4', 'P': 'A#4',
  'a': 'B4',

  // Octave 5
  's': 'C5', 'S': 'C#5',
  'd': 'D5', 'D': 'D#5',
  'f': 'E5',
  'g': 'F5', 'G': 'F#5',
  'h': 'G5', 'H': 'G#5',
  'j': 'A5', 'J': 'A#5',
  'k': 'B5',

  // Octave 6 & 7
  'l': 'C6', 'L': 'C#6',
  'z': 'D6', 'Z': 'D#6',
  'x': 'E6',
  'c': 'F6', 'C': 'F#6',
  'v': 'G6', 'V': 'G#6',
  'b': 'A6', 'B': 'A#6',
  'n': 'B6',
  'm': 'C7'
};

// Clean display labels for standard VP (replacing impossible QWERTY symbols like @ and ^ with clean readable tags)
const NOTE_TO_VP_CHAR = {
  'C2': '1', 'C#2': '1#', 'D2': '2', 'D#2': '2#', 'E2': '3', 'F2': '4', 'F#2': '4#', 'G2': '5', 'G#2': '5#', 'A2': '6', 'A#2': '6#', 'B2': '7',
  'C3': '8', 'C#3': '8#', 'D3': '9', 'D#3': '9#', 'E3': '0', 'F3': 'q', 'F#3': 'Q', 'G3': 'w', 'G#3': 'W', 'A3': 'e', 'A#3': 'E', 'B3': 'r',
  'C4': 't', 'C#4': 'T', 'D4': 'y', 'D#4': 'Y', 'E4': 'u', 'F4': 'i', 'F#4': 'I', 'G4': 'o', 'G#4': 'O', 'A4': 'p', 'A#4': 'P', 'B4': 'a',
  'C5': 's', 'C#5': 'S', 'D5': 'd', 'D#5': 'D', 'E5': 'f', 'F5': 'g', 'F#5': 'G', 'G5': 'h', 'G#5': 'H', 'A5': 'j', 'A#5': 'J', 'B5': 'k',
  'C6': 'l', 'C#6': 'L', 'D6': 'z', 'D#6': 'Z', 'E6': 'x', 'F6': 'c', 'F#6': 'C', 'G6': 'v', 'G#6': 'V', 'A6': 'b', 'A#6': 'B', 'B6': 'n',
  'C7': 'm'
};

// ============================================================================
// French AZERTY Keyboard Mapping — 100% Adapted to French Laptop Keyboards (HP OMEN)
// In exact keyboard order: Row 1 (& é " ...) -> Row 2 (a z e ...) -> Row 3 (q s d ...) -> Row 4 (w x c ...)
// From Left (Grave) to Right (Aigu), continuous, with ZERO key inversions!
// ============================================================================
const AZERTY_KEY_TO_NOTE = {
  // --- Rangée 1 : & é " ' ( - è _ ç à ) = (Grave : Octave 2 à 3) ---
  // Touches blanches (sans Shift ou avec Shift)
  '&': 'C2',
  'é': 'D2',
  '"': 'E2',
  "'": 'F2',
  '(': 'G2',
  '-': 'A2',
  'è': 'B2',
  '_': 'C3',
  'ç': 'D3',
  'à': 'E3',
  ')': 'F3',
  '=': 'G3',
  // Touches noires (Shift ou chiffres)
  '1': 'C#2', '²': 'C#2',
  '2': 'D#2', '~': 'D#2',
  '3': 'E2',
  '4': 'F#2', '{': 'F#2',
  '5': 'G#2', '[': 'G#2',
  '6': 'A#2', '|': 'A#2',
  '7': 'B2',
  '8': 'C#3', '\\': 'C#3',
  '9': 'D#3', '^': 'D#3',
  '0': 'E3', '@': 'E3',
  '°': 'F#3', ']': 'F#3',
  '+': 'G#3', '}': 'G#3',

  // --- Rangée 2 : a z e r t y u i o p ^ $ (Médium : Octave 3 à 4) ---
  // Touches blanches
  'a': 'F3',
  'z': 'G3',
  'e': 'A3',
  'r': 'B3',
  't': 'C4',
  'y': 'D4',
  'u': 'E4',
  'i': 'F4',
  'o': 'G4',
  'p': 'A4',
  '$': 'B4', '£': 'B4',
  // Touches noires (Majuscules / Shift)
  'A': 'F#3',
  'Z': 'G#3',
  'E': 'A#3',
  'T': 'C#4',
  'Y': 'D#4',
  'I': 'F#4',
  'O': 'G#4',
  'P': 'A#4',

  // --- Rangée 3 : q s d f g h j k l m ù * (Aigu : Octave 4 à 5) ---
  // Touches blanches
  'q': 'B4',
  's': 'C5',
  'd': 'D5',
  'f': 'E5',
  'g': 'F5',
  'h': 'G5',
  'j': 'A5',
  'k': 'B5',
  'l': 'C6',
  'm': 'D6',
  'ù': 'E6',
  '*': 'F6',
  // Touches noires (Majuscules / Shift)
  'Q': 'A#4',
  'S': 'C#5',
  'D': 'D#5',
  'G': 'F#5',
  'H': 'G#5',
  'J': 'A#5',
  'L': 'C#6',
  'M': 'D#6',
  '%': 'F#6',
  'µ': 'G#6',

  // --- Rangée 4 : w x c v b n , ; : ! (Très Aigu : Octave 6 à 7) ---
  // Touches blanches
  '<': 'C6', '>': 'C#6',
  'w': 'D6',
  'x': 'E6',
  'c': 'F6',
  'v': 'G6',
  'b': 'A6',
  'n': 'B6',
  ',': 'C7',
  ';': 'D7',
  ':': 'E7',
  '!': 'F7',
  // Touches noires (Majuscules / Shift)
  'W': 'D#6',
  'C': 'F#6',
  'V': 'G#6',
  'B': 'A#6',
  '?': 'C#7',
  '.': 'D#7',
  '/': 'F#7',
  '§': 'G#7'
};

// Physical hardware scancodes mapping for French ISO keyboard
const AZERTY_CODE_TO_NOTE = {
  // Row 1
  'Digit1': 'C2', 'Digit2': 'D2', 'Digit3': 'E2', 'Digit4': 'F2', 'Digit5': 'G2',
  'Digit6': 'A2', 'Digit7': 'B2', 'Digit8': 'C3', 'Digit9': 'D3', 'Digit0': 'E3',
  'Minus': 'F3', 'Equal': 'G3',

  // Row 2
  'KeyQ': 'F3',   // A
  'KeyW': 'G3',   // Z
  'KeyE': 'A3',   // E
  'KeyR': 'B3',   // R
  'KeyT': 'C4',   // T
  'KeyY': 'D4',   // Y
  'KeyU': 'E4',   // U
  'KeyI': 'F4',   // I
  'KeyO': 'G4',   // O
  'KeyP': 'A4',   // P
  'BracketRight': 'B4', // $

  // Row 3
  'KeyA': 'B4',   // Q
  'KeyS': 'C5',   // S
  'KeyD': 'D5',   // D
  'KeyF': 'E5',   // F
  'KeyG': 'F5',   // G
  'KeyH': 'G5',   // H
  'KeyJ': 'A5',   // J
  'KeyK': 'B5',   // K
  'KeyL': 'C6',   // L
  'Semicolon': 'D6', // M
  'Quote': 'E6',  // ù
  'Backslash': 'F6', // *

  // Row 4
  'IntlBackslash': 'C6', // <
  'KeyZ': 'D6',   // W
  'KeyX': 'E6',   // X
  'KeyC': 'F6',   // C
  'KeyV': 'G6',   // V
  'KeyB': 'A6',   // B
  'KeyN': 'B6',   // N
  'KeyM': 'C7',   // ,
  'Comma': 'D7',  // ;
  'Period': 'E7', // :
  'Slash': 'F7',  // !

  // Numpad
  'Numpad1': 'C4', 'Numpad2': 'D4', 'Numpad3': 'E4',
  'Numpad4': 'F4', 'Numpad5': 'G4', 'Numpad6': 'A4',
  'Numpad7': 'B4', 'Numpad8': 'C5', 'Numpad9': 'D5', 'Numpad0': 'C3'
};

// Clear French key labels displayed on the 61-key piano
const NOTE_TO_AZERTY_DISPLAY = {
  // Octave 2
  'C2': '&', 'C#2': '1', 'D2': 'é', 'D#2': '2', 'E2': '"', 'F2': "'", 'F#2': '4', 'G2': '(', 'G#2': '5', 'A2': '-', 'A#2': '6', 'B2': 'è',

  // Octave 3
  'C3': '_', 'C#3': '8', 'D3': 'ç', 'D#3': '9', 'E3': 'à', 'F3': 'A', 'F#3': 'Maj+A', 'G3': 'Z', 'G#3': 'Maj+Z', 'A3': 'E', 'A#3': 'Maj+E', 'B3': 'R',

  // Octave 4
  'C4': 'T', 'C#4': 'Maj+T', 'D4': 'Y', 'D#4': 'Maj+Y', 'E4': 'U', 'F4': 'I', 'F#4': 'Maj+I', 'G4': 'O', 'G#4': 'Maj+O', 'A4': 'P', 'A#4': 'Maj+P', 'B4': 'Q',

  // Octave 5
  'C5': 'S', 'C#5': 'Maj+S', 'D5': 'D', 'D#5': 'Maj+D', 'E5': 'F', 'F5': 'G', 'F#5': 'Maj+G', 'G5': 'H', 'G#5': 'Maj+H', 'A5': 'J', 'A#5': 'Maj+J', 'B5': 'K',

  // Octave 6 & 7
  'C6': 'L', 'C#6': 'Maj+L', 'D6': 'W', 'D#6': 'Maj+W', 'E6': 'X', 'F6': 'C', 'F#6': 'Maj+C', 'G6': 'V', 'G#6': 'Maj+V', 'A6': 'B', 'A#6': 'Maj+B', 'B6': 'N',
  'C7': ','
};

// Generate all 61 piano keys from C2 to C7 for UI rendering
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PIANO_KEYS = [];
for (let octave = 2; octave <= 7; octave++) {
  for (let i = 0; i < NOTE_NAMES.length; i++) {
    const name = `${NOTE_NAMES[i]}${octave}`;
    PIANO_KEYS.push({
      note: name,
      isBlack: NOTE_NAMES[i].includes('#'),
      octave,
      vpChar: NOTE_TO_VP_CHAR[name] || ''
    });
    if (name === 'C7') break;
  }
}

// Convert note name (e.g. "C4", "F#5") to frequency in Hz
function noteToFreq(noteName) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(noteName);
  if (!match) return 440;
  const semitone = NOTE_NAMES.indexOf(match[1]);
  const octave = parseInt(match[2], 10);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Parse either a Virtual Piano sheet OR a Note-name sheet into playable steps
function parseSheetToSteps(rawText, bpm = 120) {
  if (!rawText || typeof rawText !== 'string') return [];
  const text = rawText.trim();
  const baseBeatSec = 60 / (bpm || 120) / 2; // Eighth-note base unit

  const explicitNoteRegex = /\b([A-G][#b]?[2-7]|Do|Ré|Re|Mi|Fa|Sol|La|Si)\b/i;
  const hasExplicitNotes = explicitNoteRegex.test(text) && !/\[[0-9a-zA-Z!@$%^*(]+\]/.test(text);

  if (hasExplicitNotes) {
    return parseExplicitNoteSheet(text, baseBeatSec);
  }

  const steps = [];
  let currentTime = 0;
  let i = 0;
  let consecutiveSpaces = 0;

  while (i < text.length) {
    const ch = text[i];

    // Chord in brackets: [tuo] or 4+ notes [6eup]
    if (ch === '[') {
      consecutiveSpaces = 0;
      const closeIdx = text.indexOf(']', i + 1);
      if (closeIdx !== -1) {
        const inside = text.slice(i + 1, closeIdx);
        const chordNotes = [];
        for (const c of inside) {
          if (VP_CHAR_TO_NOTE[c] && !chordNotes.includes(VP_CHAR_TO_NOTE[c])) {
            chordNotes.push(VP_CHAR_TO_NOTE[c]);
          }
        }
        if (chordNotes.length > 0) {
          const nextCh = text[closeIdx + 1] || '';
          const isFastRun = Boolean(VP_CHAR_TO_NOTE[nextCh] || nextCh === '[');
          const stepDelay = isFastRun ? baseBeatSec * 0.75 : baseBeatSec * 1.1;
          const pressDur = isFastRun ? baseBeatSec * 0.68 : baseBeatSec * 1.35;
          steps.push({
            time: currentTime,
            duration: Math.max(0.75, baseBeatSec * 2.5),
            pressDuration: Math.max(0.14, pressDur),
            velocity: 0.9,
            notes: chordNotes,
            label: `[${inside.replace(/\s+/g, '')}]`,
            nextDelay: stepDelay,
            baseBeatSec,
            pauseType: null // null | 'hold' | 'rest'
          });
          currentTime += stepDelay;
        }
        i = closeIdx + 1;
        continue;
      }
    }

    if (VP_CHAR_TO_NOTE[ch]) {
      consecutiveSpaces = 0;
      const nextCh = text[i + 1] || '';
      // If next char is immediately another note without space, it's a fast run (short key press!)
      const isFastRun = Boolean(VP_CHAR_TO_NOTE[nextCh] || nextCh === '[');
      const stepDelay = isFastRun ? baseBeatSec * 0.68 : baseBeatSec * 1.05;
      const pressDur = isFastRun ? baseBeatSec * 0.48 : baseBeatSec * 0.95;

      steps.push({
        time: currentTime,
        duration: Math.max(0.65, baseBeatSec * 2.2),
        pressDuration: Math.max(0.09, pressDur),
        velocity: isFastRun ? 0.82 : 0.88,
        notes: [VP_CHAR_TO_NOTE[ch]],
        label: ch,
        nextDelay: stepDelay,
        baseBeatSec,
        pauseType: null
      });
      currentTime += stepDelay;
      i++;
      continue;
    }

    // '-' = Sustained Note / Tenue (key stays visually pressed much longer!)
    if (ch === '-') {
      const holdExtra = baseBeatSec * 1.3;
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        last.nextDelay += holdExtra;
        last.pressDuration = Math.min(3.5, (last.pressDuration || baseBeatSec) + holdExtra * 1.15);
        last.duration = Math.min(4.2, last.duration + holdExtra * 1.3);
        if (!last.pauseType) last.pauseType = 'hold';
      }
      currentTime += holdExtra;
      i++;
      continue;
    }

    // '|' or '\n' = Temps d'arrêt / Phrase Break (expressive longer key hold before the silence)
    if (ch === '|' || ch === '\n') {
      const restExtra = baseBeatSec * 1.3;
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        last.pressDuration = Math.min(3.0, (last.pressDuration || baseBeatSec) + baseBeatSec * 0.55);
        last.nextDelay += restExtra;
        last.duration = Math.max(last.duration, last.nextDelay * 0.95);
        last.pauseType = 'rest';
      }
      currentTime += restExtra;
      i++;
      continue;
    }

    // Single space separates normal eighth notes; 2+ spaces = micro-pause with slightly longer key hold
    if (ch === ' ') {
      consecutiveSpaces++;
      if (consecutiveSpaces >= 2 && steps.length > 0) {
        const spaceExtra = baseBeatSec * 0.55;
        const last = steps[steps.length - 1];
        last.nextDelay += spaceExtra;
        last.pressDuration = Math.min(2.8, (last.pressDuration || baseBeatSec) + spaceExtra * 0.7);
        currentTime += spaceExtra;
      }
    }

    i++;
  }

  return steps;
}

function normalizeSolfegeToken(token) {
  const solfegeMap = {
    'do': 'C', 'ré': 'D', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'si': 'B'
  };
  let t = token.trim();
  const solMatch = /^(do|ré|re|mi|fa|sol|la|si)(#?)([2-6])?$/i.exec(t);
  if (solMatch) {
    const letter = solfegeMap[solMatch[1].toLowerCase()];
    const sharp = solMatch[2] || '';
    const oct = solMatch[3] || '4';
    return `${letter}${sharp}${oct}`;
  }
  const stdMatch = /^([A-Ga-g])([#b]?)([2-7])?$/.exec(t);
  if (stdMatch) {
    let letter = stdMatch[1].toUpperCase();
    const acc = stdMatch[2];
    const oct = stdMatch[3] || '4';
    if (acc === 'b') {
      const flatToSharp = { 'D': 'C#', 'E': 'D#', 'G': 'F#', 'A': 'G#', 'B': 'A#' };
      return `${flatToSharp[letter] || letter}${oct}`;
    }
    return `${letter}${acc}${oct}`;
  }
  return null;
}

function parseExplicitNoteSheet(text, baseBeatSec) {
  const tokens = text.split(/(\s+|\||-)/);
  const steps = [];
  let currentTime = 0;

  for (const tok of tokens) {
    if (!tok) continue;
    if (tok === '-') {
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        last.nextDelay += baseBeatSec * 1.25;
        last.duration += baseBeatSec * 1.1;
        last.pauseType = 'hold';
      }
      currentTime += baseBeatSec * 1.25;
      continue;
    }
    if (tok === '|') {
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        last.duration = Math.min(last.duration, last.nextDelay * 0.8);
        last.nextDelay += baseBeatSec * 1.3;
        last.pauseType = 'rest';
      }
      currentTime += baseBeatSec * 1.3;
      continue;
    }
    if (/^\s+$/.test(tok)) continue;

    const cleaned = tok.replace(/^\[|\]$/g, '');
    const parts = cleaned.split(/[+,/]/);
    const notes = parts.map(normalizeSolfegeToken).filter(Boolean);
    if (notes.length > 0) {
      steps.push({
        time: currentTime,
        duration: Math.max(0.28, baseBeatSec * 1.1),
        velocity: 0.88,
        notes,
        label: notes.join('+'),
        nextDelay: baseBeatSec,
        baseBeatSec,
        pauseType: null
      });
      currentTime += baseBeatSec;
    }
  }
  return steps;
}

// ============================================================================
// FULL-LENGTH CONCERT ARRANGEMENTS FOR ALL 12 BUILT-IN SONGS
// Each song includes: Intro, Main Theme, Variation, Rich 4-Note Chords Climax & Finale
// ============================================================================
const RAW_BUILTIN_SONGS = [
  {
    id: 'interstellar',
    title: 'Interstellar — Cornfield Chase (Intégrale)',
    artist: 'Hans Zimmer',
    bpm: 112,
    difficulty: 'Complet',
    category: 'Cinéma',
    sheet: [
      // Section 1: Atmospheric Intro Ostinato
      'u p u p u p u p | [4qu] p u p u p u p | [5wu] p u p u p u p | [6eu] p u p u p u p |',
      // Section 2: Bass & Melody Entry
      '[4qtu] p [4qtu] p [4qtu] p [4qtu] p | [5wyu] p [5wyu] p [5wyu] p [5wyu] p |',
      '[6eu] p [6eu] p [6eu] p [6eu] p | [5wy] u [5wy] u [5wy] t [5wy] r |',
      '[4qti] p [4qti] p [4qti] p [4qti] p | [5wyo] p [5wyo] p [5wyo] p [5wyo] p |',
      '[6eup] a [6eup] a [6eup] s [6eup] a | [5wyo] p [5wyo] o [5wyu] y [5wyt] r |',
      // Section 3: Main Theme Rising (3 & 4-note chords)
      '[4qtip] s [4qtip] s [4qtip] s [4qtip] s | [5wyop] d [5wyop] d [5wyop] d [5wyop] d |',
      '[6eups] f [6eups] f [6eups] f [6eups] d | [5wyos] d [5wyos] a [5wyop] o [5wyou] y |',
      '[4qtip] s [4qtip] s [4qtip] d [4qtip] f | [5wyop] g [5wyop] f [5wyop] d [5wyop] s |',
      '[6eups] f [6eups] h [6eups] g [6eups] f | [5wyod] s [5wyoa] p [5wyoo] u [5wyoy] t |',
      // Section 4: Rapid Arpeggio Drive ("Ticking Clock")
      '[4qt] i p s i p s f [4qt] i p s i p s f | [5wy] o p d o p d g [5wy] o p d o p d g |',
      '[6eu] p s f p s f h [6eu] p s f p s f h | [5wy] o a d o a d g [5wy] o a d o a d f |',
      '[4qt] i p s f s p i [4qt] i p s f s p i | [5wy] o p d g d p o [5wy] o p d g d p o |',
      '[6eu] p s f h f s p [6eu] p s f j h f s | [5wy] o a d g f d a [5wy] o a d s a p o |',
      // Section 5: Grand Orchestral Organ Climax (4-note rich chords)
      '[4qipsf] [4qips] [4qipsf] [4qips] [4qipsg] [4qips] [4qipsf] [4qips] |',
      '[5woadg] [5woad] [5woadg] [5woad] [5woadh] [5woad] [5woadg] [5woad] |',
      '[6epsfh] [6epsf] [6epsfh] [6epsf] [6epsfj] [6epsf] [6epsfh] [6epsf] |',
      '[8tuosf] [8tuos] [8tuosg] [8tuos] [5wyoad] [5wyoa] [5wyos] [5wyop] |',
      '[4qipsf] d s a [4qips] p o i | [5woadg] f d s [5woad] a p o |',
      '[6epsfh] j h f [6epsf] d s a | [5wyoad] s a p [5wyo] o u y |',
      // Section 6: Gentle Resolution & Finale
      '[4qtu] p [4qtu] p [4qtu] o [4qtu] p | [5wyu] p [5wyu] a [5wyu] p [5wyu] o |',
      '[6eu] p [6eu] s [6eu] a [6eu] p | [5wy] o [5wy] u [5wy] y [5wy] t |',
      '[4qtu] p u p [5wyu] p u p | [6eup] - [6eups] - [6eupsf] - [6eupsfj]'
    ].join(' ')
  },
  {
    id: 'giorno',
    title: "Giorno's Theme — Il Vento d'Oro (Intégrale)",
    artist: 'JoJo Golden Wind',
    bpm: 135,
    difficulty: 'Complet',
    category: 'Anime / Gaming',
    sheet: [
      // Section 1: Iconic Bass Riff + Melody
      '[6ep] [6ep] | f d | s a [6ep] o [6ep] a | [4qp] [4qp] | f d | s a [4qp] s [5wd] a |',
      '[6ep] [6ep] | f d | s a [6ep] o [6ep] a | [4qp] [4qp] | j h | g f [5wd] s [5wa] o |',
      '[6ep] [6ep] [uf] [yd] | [ts] [ra] [6ep] [wo] [6ep] [ra] |',
      '[4qp] [4qp] [uf] [yd] | [ts] [ra] [5wp] [ts] [5wd] [ra] |',
      '[6ep] [6ep] [uf] [yd] | [ts] [ra] [6ep] [wo] [6ep] [ra] |',
      '[4qp] [4qp] [pj] [oh] | [ig] [uf] [5wyd] [ts] [5wra] [wo] |',
      // Section 2: Saxophone Lead Section (Full Chords)
      '[6eup] - [6euo] [6eup] - [3ru] [4qti] [5wyo] | [6eup] - [6euo] [6eup] - [8tus] [7rya] [5wyo] |',
      '[6eup] - [6euo] [6eup] - [3ru] [4qti] [5wyo] | [4qti] [5wyo] [6eup] [7rya] [8tus] [7rya] [6eup] [5wyo] |',
      '[6eup] - [6euo] [6eup] - [3ru] [4qti] [5wyo] | [6eup] - [6euo] [6eup] - [8tus] [7rya] [5wyo] |',
      '[4qtip] [4qtio] [4qtip] [5wyos] - [5wyoa] [5wyop] [5wyoo] | [6eups] - [6eupa] [6eupp] - [6euo] [6eup] - |',
      // Section 3: The Famous Piano Solo Breakdown ("JoJo Piano")
      '[6epj] [6epj] [fx] [dz] | [sl] [ak] [6epj] [oh] [6epj] [ak] |',
      '[4qpj] [4qpj] [fx] [dz] | [sl] [ak] [4qpj] [sl] [5wdz] [ak] |',
      '[6epj] [6epj] [fx] [dz] | [sl] [ak] [6epj] [oh] [6epj] [ak] |',
      '[4qpj] [4qpj] [jb] [hv] | [gc] [fx] [5wdz] [sl] [5wak] [oh] |',
      // Section 4: Fast Virtuoso Jazz/Rock Piano Runs
      '[6ep] s d f g f d s [4qp] s d f g f d s | [5wo] a s d f d s a [3e] u o p a p o u |',
      '[6ep] a s d [6ef] g h j [4qf] d s a [4qp] o i u | [5wy] u i o [5wp] a s d [6ef] d s a [6ep] - |',
      // Section 5: Finale Climax with 4-Note Chords
      '[6eups] [6eups] [6eufx] [6eudz] | [4qtsl] [4qtak] [6eupj] [5wyoh] [6eupj] [7ryak] |',
      '[4qtipj] [4qtipj] [4qtfx] [4qtdz] | [5wysl] [5wyak] [5wypj] [5wysl] [5wydz] [5wyak] |',
      '[6eupj] [6eupj] [6eufx] [6eudz] | [4qtsl] [4qtak] [6eupj] [5wyoh] [6eupj] [7ryak] |',
      '[4qtipj] [5wyoh] [6eupj] [7ryak] [8tusl] [7ryak] [6eupj] [5wyoh] | [6eupsj] - [6eupsj] - [6eupsfj]'
    ].join(' ')
  },
  {
    id: 'fur-elise',
    title: 'La Lettre à Élise — Für Elise (Intégrale)',
    artist: 'Ludwig van Beethoven',
    bpm: 126,
    difficulty: 'Classique',
    category: 'Classique',
    sheet: [
      // Section A: Main Theme (First Time + Repeat)
      'f D f D f a d s [6p] - e u p [3a] - e O a [6s] - e f D f D f a d s [6p] - e u p [3a] - e s a [6p] - |',
      'f D f D f a d s [6p] - e u p [3a] - e O a [6s] - e f D f D f a d s [6p] - e u p [3a] - e s a [6ep] - |',
      // Section A2: Secondary Melody in C Major / G Major
      'a s d [8f] - o g f [5d] - i f d [6s] - u d s [3a] - e u f D f D f a d s [6p] - e u p [3a] - e O a [6s] - |',
      'e f D f D f a d s [6p] - e u p [3a] - e s a [6ep] - |',
      'a s d [8tf] - o g f [5wd] - i f d [6es] - u d s [3ra] - e u f D f D f a d s [6ep] - e u p [3ra] - e s a [6eup] - |',
      // Section B: Bright F Major & C Major Classical Episode
      '[4qti] - g f [4qti] e [8tus] - a P [8tup] o [5wyi] u y t [8tu] o [4qti] p [5wyo] a [8tus] - |',
      '[4qti] - g f [4qti] e [8tus] - a P [8tup] o [5wyi] u y t [8tu] d [5wys] a [8tup] o [6eup] - |',
      'u o s f d s a p o i u y t r e w |',
      // Section A3: Return of Main Theme with Rich Accompaniment
      'f D f D f a d s [6eup] - e u p [3rua] - e O a [6eus] - e f D f D f a d s [6eup] - e u p [3rua] - e s a [6eup] - |',
      // Section C: Dramatic Stormy A Minor Bass Ostinato + Chords
      '[6e] [6e] [6e] [6e] [6eups] [6e] [6e] [6e] [6euad] [6e] [6e] [6e] [6eups] [6e] [6e] [6e] |',
      '[29ipd] [29] [29] [29] [6eups] [6e] [6e] [6e] [30oad] [30] [30] [30] [6eups] [6e] [6e] [6e] |',
      '[4qips] [4q] [4q] [4q] [5woad] [5w] [5w] [5w] [8tuos] - [7ryoa] - [6eups] - [30rua] - |',
      // Finale: Return of Für Elise Theme & Final Cadence
      'f D f D f a d s [6eup] - e u p [3rua] - e O a [6eus] - e f D f D f a d s [6eup] - e u p [3rua] - e s a [6eup] |',
      'a s d [8tuf] - o g f [5wyd] - i f d [6eus] - u d s [3rua] - e u f D f D f a d s [6eup] - e u p [3rua] - e s a [6eup] - [6eups]'
    ].join(' ')
  },
  {
    id: 'megalovania',
    title: 'Megalovania — Undertale (Intégrale)',
    artist: 'Toby Fox',
    bpm: 142,
    difficulty: 'Complet',
    category: 'Anime / Gaming',
    sheet: [
      // Section 1: Solo Intro Riff
      'y y d a - P p o y o p | t t d a - P p o y o p |',
      'r r d a - P p o y o p | E E d a - P p o y o p |',
      // Section 2: Bass + Octave Riff
      '[29y] [29y] [yd] [ya] - [YP] [up] [to] [ry] [to] [up] |',
      '[18t] [18t] [yd] [ya] - [YP] [up] [to] [ry] [to] [up] |',
      '[7ry] [7ry] [yd] [ya] - [YP] [up] [to] [ry] [to] [up] |',
      '[6eu] [6eu] [yd] [ya] - [YP] [up] [to] [ry] [to] [up] |',
      // Section 3: Secondary Melody Drive
      '[29p] [29p] p p p [18o] [18o] - [7rp] [7rp] p [6ep] [6ed] [6ea] [6ep] o |',
      '[29d] [29d] d [18a] [18d] [18f] - [7rd] a [7rp] o [6ep] - a d |',
      '[29f] [29d] [18a] [18p] [7ro] [7ry] - [6eu] i o p [5wa] - |',
      // Section 4: Chorus Harmonized Chords
      '[29yad] [29yad] [29dz] [29ak] - [29PJ] [29pj] [29oh] [29yd] [29oh] [29pj] |',
      '[18tad] [18tad] [18dz] [18ak] - [18PJ] [18pj] [18oh] [18yd] [18oh] [18pj] |',
      '[7ryad] [7ryad] [7rdz] [7rak] - [7rPJ] [7rpj] [7roh] [7ryd] [7roh] [7rpj] |',
      '[6euad] [6euad] [6edz] [6eak] - [6ePJ] [6epj] [6eoh] [6eyd] [6eoh] [6epj] |',
      // Section 5: Dramatic Bridge
      '[4qti] - o p [5wyo] - i u [6eup] - y t [3ru] - |',
      '[4qtip] - [5wyos] - [6eupd] - [7ryaf] [7ryad] [7ryas] [7ryaa] |',
      'y o p a s d f g h j k z |',
      // Section 6: Final Boss Climax (4-note chords)
      '[29yadj] [29yadj] [29dfz] [29adk] - [29PSJ] [29psj] [29oah] [29yad] [29oah] [29psj] |',
      '[18tadj] [18tadj] [18dfz] [18adk] - [18PSJ] [18psj] [18oah] [18yad] [18oah] [18psj] |',
      '[7ryadj] [7ryadj] [7rdfz] [7radk] - [7rPSJ] [7rpsj] [7roah] [7ryad] [7roah] [7rpsj] |',
      '[6euadj] [6euadj] [6edfz] [6eadk] - [6ePSJ] [6epsj] [6eoah] [6eyad] [6eoah] [6epsj] | [29yadj]'
    ].join(' ')
  },
  {
    id: 'rush-e',
    title: 'Rush E — Version Virtuose (Intégrale)',
    artist: 'Sheet Music Boss',
    bpm: 158,
    difficulty: 'Expert',
    category: 'Meme / Virtuose',
    sheet: [
      // Section 1: Accelerating E-note Repetition
      'u - u - u u u u | [6u] u u u [6u] u u u [6y] [6u] [6p] [6u] |',
      '[6a] a a a [6a] a [6p] [6o] [4i] i i i [4u] [4i] [4p] [4i] |',
      '[5o] o o o [5i] [5u] [5y] [5t] [6u] [3r] [6u] [3a] [6s] - |',
      // Section 2: Full Ragtime Left-Hand Stride + Melody
      '[6eu] [ups] [6eu] [ups] [6eu] [ups] [6ey] [6eu] [6ep] [6eu] |',
      '[6ea] [ups] [6ea] [ups] [6ep] [6eo] [4qi] [tip] [4qi] [tip] [4qu] [4qi] [4qp] [4qi] |',
      '[5wo] [yop] [5wo] [yop] [5wi] [5wu] [5wy] [5wt] [6eu] [3ru] [6ep] [3ra] [6es] - |',
      // Section 3: High Octave Escalation
      '[6ef] [psf] [6ef] [psf] [6ed] [6es] [6ea] [6ep] |',
      '[4qd] [ipd] [4qd] [ipd] [4qs] [4qa] [4qp] [4qo] |',
      '[5ws] [yos] [5ws] [yos] [5wa] [5wp] [5wO] [5wp] |',
      '[6ea] [3rf] [6ed] [3rs] [6ep] [3ro] [6eu] - |',
      // Section 4: Crazy Arpeggio Tornado
      'e u p a s d f d s a p u e u p a s d f d s a p u |',
      'q t i o p a s a p o i t w y o p a s d s a p o y |',
      'e u p s f h j h f s p u e u p s f h l k j h f s |',
      // Section 5: Massive 4-Note Chords Finale ("Black MIDI" feel)
      '[6eups] [6eups] [6eups] [6eups] [6eyoa] [6eups] [6epdj] [6eups] |',
      '[6eadk] [6eadk] [6eadk] [6eadk] [6epsj] [6eoah] [4qipg] [4qipg] [4qipg] [4qipg] [4quof] [4qipg] [4qpsj] [4qipg] |',
      '[5woah] [5woah] [5woah] [5woah] [5wipg] [5wuof] [5wyod] [5wtos] |',
      '[6eups] [3ruoa] [6epsf] [3radh] [6esfj] [3rfhk] [6eupsfj] [6eupsfj] [6eupsfjl]'
    ].join(' ')
  },
  {
    id: 'pirates',
    title: "Pirates des Caraïbes — He's a Pirate (Intégrale)",
    artist: 'Klaus Badelt & Hans Zimmer',
    bpm: 148,
    difficulty: 'Complet',
    category: 'Cinéma',
    sheet: [
      // Section 1: Driving Ostinato Intro
      '[2y] [2y] [2y] [2y] [2y] [2y] | e t [29y] [29y] - y u [4qi] [4qi] - i o [5wu] [5wu] - y t [29t] [29y] - |',
      'e t [29y] [29y] - y u [4qi] [4qi] - i o [5wu] [5wu] - y t [29y] - |',
      'e t [29y] [29y] - y i [18o] [18o] - o p [4qa] [4qa] - p o [29p] [29y] - |',
      'y u [4qi] [4qi] - o [5wa] [29y] - y i [5wo] [5wo] - p [29u] [29y] - |',
      // Section 2: Second Theme (Heroic Octave Chords)
      '[29yd] [29yd] - d f [4qig] [4qig] - g h [5wuf] [5wuf] - d s [29s] [29d] - |',
      'a s [29yd] [29yd] - d f [4qig] [4qig] - g h [5wuf] [5wuf] - d s [29yd] - |',
      'a s [29yd] [29yd] - d g [18oh] [18oh] - h j [4qak] [4qak] - j h [29pj] [29yd] - |',
      'd f [4qig] [4qig] - h [5wak] [29yd] - d g [5woh] [5woh] - j [29uf] [29yd] - |',
      // Section 3: Broad Sea Theme (Chords)
      '[29yad] - [5wyos] - [4qtip] - [18tuo] [5wy] [29yad] - |',
      '[4qtip] - [18tuo] - [5wyoa] - [29yad] - |',
      '[6eups] - [4qtip] - [18tuo] - [5wyoa] - |',
      '[29yad] d f [4qig] f d [5wuf] d s [6epa] s a [5wop] - |',
      // Section 4: Swashbuckling Climax (4-note chords)
      '[29yadj] - [18tosf] - [4qtipg] - [4qtipg] [5wyoh] [29yadj] - |',
      '[30ruaf] - [4qtipg] - [5wyoad] - [5wyoad] [5wyos] [29yad] - |',
      'a s [29yadj] [29yadj] - d g [18toh] [18toh] - h j [4qak] [4qak] - j h [29pj] [29yd] - |',
      'd f [4qig] [4qig] - h [5wak] [29yd] - d f [5wuf] [5wyd] - s [29yad] - [29yadj]'
    ].join(' ')
  },
  {
    id: 'river-flows',
    title: 'River Flows in You (Intégrale)',
    artist: 'Yiruma',
    bpm: 112,
    difficulty: 'Complet',
    category: 'Moderne',
    sheet: [
      // Section 1: Gentle Intro
      '[6es] S s a s p [4qs] t - | [18s] S s a s p [5ws] w - |',
      '[6es] S s d [6ef] h [4qf] d s | [18a] p s [5wo] u y |',
      // Section 2: Flowing Theme with Arpeggios
      '[6ep] a [6es] d [4qf] g [4qf] d | [18s] a [18p] o [5wy] - |',
      '[6es] S [6es] a [6es] p [4qs] t u p | [18s] S [18s] a [18s] p [5ws] w y o |',
      // Section 3: Full Chorus ( iconic flowing sixteenth notes )
      '[6es] d [6ef] s [4qp] f [4qd] s | [18p] s [18f] h [5wg] f [5wd] s |',
      '[6es] d [6ef] s [4qp] f [4qd] s | [18p] s [18d] a [5wp] o [5wy] - |',
      '[6eps] d [6epf] h [4qpg] f [4qpd] s | [18os] d [18of] h [5wog] f [5wod] s |',
      '[6eps] d [6epf] h [4qpj] h [4qpf] d | [18os] a [18op] o [5wy] u [5wo] a |',
      // Section 4: Emotional High Octave Variation
      '[6epsf] d [6epsf] h [4qpg] f [4qpd] s | [18osf] h [18osj] k [5woh] g [5wof] d |',
      '[6epsf] d [6epsf] h [4qpj] k [4qpl] j | [18osh] f [18osd] s [5woa] p [5woo] u |',
      // Section 5: Outro
      '[6es] S s a s p [4qs] t - | [18s] S s a s p [5ws] w - |',
      '[6ep] a [6es] d [4qf] d s [5wa] p o | [6eup] - [6eups] - [6eupsf]'
    ].join(' ')
  },
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune (Intégrale)',
    artist: 'Claude Debussy',
    bpm: 86,
    difficulty: 'Relaxant',
    category: 'Classique',
    sheet: [
      // Section 1: Dreamy Impressionist Opening Chords
      '[18tu] - [fh] - [df] - | [4qti] - [sp] [da] [sp] - |',
      '[5wyo] - [pa] [os] [pa] - | [6eup] - [uo] - [yi] - |',
      '[4qtu] - [tu] [yi] [tu] - | [5wry] - [ry] [tu] [ry] - |',
      '[6etu] - [5wry] - [4qet] - [30wr] - | [18tuo] - [5wyoa] - |',
      // Section 2: Deep Rich 4-Note Chords Progression
      '[18tuos] - [18tuof] [18tuod] [18tuos] [18tuoa] | [4qtipa] - [4qtip] [4qtio] [4qtip] - |',
      '[5wyopa] - [5wyos] [5wyod] [5wyof] [5wyod] | [6eups] - [6eupa] [6eupp] [6euo] - |',
      // Section 3: Un poco mosso (Flowing Left-Hand Arpeggios + Lyrical Melody)
      '8 w t u [os] u t w | 4 q t i [pa] i t q |',
      '5 w y o [ad] o y w | 6 e u p [sf] p u e |',
      '8 w t u [fh] u t w | 4 q t i [gj] i t q |',
      '5 w y o [hk] o y w | 6 e u p [jl] p u e |',
      // Section 4: Celestial High Register Return
      '[8tuos] - [fhl] - [dfj] - | [4qtip] - [spj] [dak] [spj] - |',
      '[5wyoad] - [pak] [osl] [pak] - | [6eups] - [uos] - [yip] - |',
      '[18tuos] - [5wyoad] - [8tuosf] - [8tuosfh]'
    ].join(' ')
  },
  {
    id: 'bella-ciao',
    title: 'Bella Ciao (Intégrale)',
    artist: 'Traditionnel / La Casa de Papel',
    bpm: 136,
    difficulty: 'Complet',
    category: 'Populaire',
    sheet: [
      // Verse 1
      'e u p a [6es] - e u p a [6es] - | e u p a [6es] a p [6es] a p [4qf] - [4qf] - [4qf] d f [18g] - [18g] - |',
      'g f d [4qg] [18f] - f d s [6ef] [30d] - | s a p [6ef] [30d] - s a [6ep] - |',
      // Verse 2 (Rich Chords)
      'e u p a [6eps] - e u p a [6eps] - | e u p a [6eps] a p [6eps] a p [4qpf] - [4qpf] - [4qpf] d f [18og] - [18og] - |',
      'g f d [4qpg] [18of] - f d s [6epf] [30od] - | s a p [6epf] [30od] - s a [6eup] - |',
      // Virtuoso Variation (Fast Accompaniment)
      '[6e] [ups] [6e] [ups] [6ea] [ups] [6ep] [ups] | [6es] [ups] [6ea] [ups] [4qf] [ips] [4qf] [ips] |',
      '[4qf] d f [18g] [uos] [18g] [uos] | [18g] f d [4qg] [18f] [uos] [18f] d s |',
      '[6ef] [30d] [oad] [30s] a p [6ef] [30d] - s a [6eup] - |',
      // Finale Climax (High Octave 4-Note Chords)
      'p s f h [6epsj] - p s f h [6epsj] - | p s f h [6epsj] h f [6epsj] h f [4qpfj] - [4qpfj] - [4qpfj] k j [18ogk] - [18ogk] - |',
      'k j h [4qpgk] [18ofj] - j h g [6epfj] [30odh] - | g f d [6epfj] [30odh] - s a [6eupsj]'
    ].join(' ')
  },
  {
    id: 'naruto-sadness',
    title: 'Sadness and Sorrow — Naruto (Intégrale)',
    artist: 'Toshio Masuda',
    bpm: 98,
    difficulty: 'Complet',
    category: 'Anime / Gaming',
    sheet: [
      // Section 1: Delicate Music-Box / Piano Intro
      '[6ep] a [6es] f [4qd] s [4qa] p | [5wo] - [5wy] u [6ep] - |',
      '[6ep] a [6es] f [4qj] h [4qf] d | [5ws] - [5wa] o [6ep] - |',
      // Section 2: Full Arpeggiated Theme
      '6 e u p a [6es] f 4 q t i [4qd] s a p | 5 w y [5wo] - y u 6 e u [6ep] - |',
      '6 e u p a [6es] f 4 q t i [4qj] h f d | 5 w y [5ws] - a o 6 e u [6ep] - |',
      // Section 3: Emotional Bridge
      '[4qti] o [4qtip] s [5wyo] a [5wyod] s | [18tuo] p [18tuos] d [6eup] s [6eupf] - |',
      '[4qtip] s [4qtipf] d [5wyos] a [5wyop] o | [30ruo] - [30ruO] - [6eup] - |',
      // Section 4: Orchestral Climax (4-note chords)
      '[6eups] [6eupa] [6eups] [6eupf] [4qtid] [4qtis] [4qtia] [4qtip] | [5wyo] - [5wy] [5wyu] [6eup] - |',
      '[6eups] [6eupa] [6eups] [6eupf] [4qtipj] [4qtiph] [4qtipf] [4qtipd] | [5wyos] - [5wyoa] [5wyoo] [6eups] - |',
      '[4qtipf] d [5wyos] a [6eup] o [30ru] y | [4qti] u [5wyo] a [6eups] - [6eupsf]'
    ].join(' ')
  },
  {
    id: 'tetris',
    title: 'Tetris Theme — Korobeiniki (Intégrale)',
    artist: 'Traditionnel Russe',
    bpm: 144,
    difficulty: 'Rythmé',
    category: 'Anime / Gaming',
    sheet: [
      // Section A1: Main Theme
      '[6ef] s d f d s [6ea] a d [6eh] g f | [30d] - s d [6ef] - [6es] - [6ep] - [6ep] - |',
      '[29d] - f [29j] h g [8tf] - d [8tf] d s | [30a] a s [30d] - [6ef] - [6es] - [6ep] - [6ep] - |',
      // Section A2: Repeated with Stride Chords
      '[6epf] s d [6epf] d s [6epa] a d [6eph] g f | [30od] - s d [6epf] - [6eps] - [6eup] - [6eup] - |',
      '[29id] - f [29ij] h g [18of] - d [18of] d s | [30oa] a s [30od] - [6epf] - [6eps] - [6eup] - [6eup] - |',
      // Section B: Smooth Counter-Melody
      '[6eps] - [30oa] - [4qip] - [30uo] - | [6eup] - [30ry] - [6etu] - [30wr] - |',
      '[6eps] - [30oa] - [4qip] - [30uo] - | [6eup] - [18os] - [6epf] - [6epd] - |',
      // Section C: Fast Kalinka / Tetris Finale (4-note chords)
      '[6epsf] s d [6epsf] d s [6epaa] a d [6epsh] g f | [30oad] - s d [6epsf] - [6eps] - [6eup] - [6eup] - |',
      '[29ipd] - f [29ipj] h g [18tof] - d [18tof] d s | [30oad] a s [30oad] - [6epsf] - [6eps] - [6eup] - [6eupsf]'
    ].join(' ')
  },
  {
    id: 'zelda-lullaby',
    title: "Zelda's Lullaby & Lost Woods (Intégrale)",
    artist: 'Koji Kondo (The Legend of Zelda)',
    bpm: 108,
    difficulty: 'Complet',
    category: 'Anime / Gaming',
    sheet: [
      // Part 1: Zelda's Lullaby
      '[18ua] - d [5wo] - o p [4qa] - d [5wo] - | [18ua] - d [5wj] - h [4qd] - s a [5wo] - |',
      '[18ua] - d [5wo] - o p [4qa] - d [5wo] - | [18ua] - d [5wj] - l [4qk] - h f [18s] - |',
      // Part 2: Lullaby Orchestral Chords
      '[4qtia] - [4qtid] [5wyo] - o p [4qtia] - [4qtid] [5wyo] - |',
      '[4qtia] - [4qtid] [5wyoj] - h [18tud] - s a [5wyo] - |',
      '[4qtip] - s [5wyod] - f [6eups] - a [30rup] - | [4qtia] - d [5wyoj] - l [18tuk] - [18tosf] - |',
      // Part 3: Lost Woods (Saria's Song) Lively Section
      '[4qi] [4qo] [4qp] - [4qi] [4qo] [4qp] - | [4qi] [4qo] [4qp] [5wd] [5ws] - [6ep] [6ea] [6ep] [30u] [6ey] - |',
      '[4qt] [4qu] [5wo] [6ep] - [4qt] [4qu] [5wo] [6ep] - |',
      '[4qi] [4qo] [4qp] [5wd] [5ws] - [6ep] [6ea] [6ed] [5ws] [6ep] - |',
      '[4qti] [4qto] [5wyp] [6eus] [5wyo] [4qti] [6eup] - [6eups]'
    ].join(' ')
  }
];

const BUILTIN_SONGS = RAW_BUILTIN_SONGS.map((song) => ({
  ...song,
  type: 'sheet',
  steps: parseSheetToSteps(song.sheet, song.bpm)
}));

window.KeyFlowSongs = {
  VP_CHAR_TO_NOTE,
  NOTE_TO_VP_CHAR,
  AZERTY_KEY_TO_NOTE,
  AZERTY_CODE_TO_NOTE,
  NOTE_TO_AZERTY_DISPLAY,
  PIANO_KEYS,
  BUILTIN_SONGS,
  noteToFreq,
  parseSheetToSteps
};
