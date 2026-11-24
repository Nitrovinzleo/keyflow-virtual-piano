const { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { Midi } = require('@tonejs/midi');
const { DiscordRPCClient } = require('./discordRpc');

app.setName('Virtual Piano');
if (process.platform === 'win32') {
  app.setAppUserModelId('Virtual Piano');
}

let mainWindow = null;
let globalCaptureActive = false;
const discordRpc = new DiscordRPCClient();

// Keys captured when Global Background Mode (F8) is active
const CAPTURED_KEYS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...'0123456789'.split(''),
  'Space', ';', ',', '.', '/', '[', ']', '\\', '=', '-', '`', "'"
];

function clampNoteTo61Keys(rawName) {
  const m = /^([A-G]#?)(-?\d+)$/.exec(rawName);
  if (!m) return 'C4';
  const pitch = m[1];
  let oct = parseInt(m[2], 10);
  while (oct < 2) oct++;
  while (oct > 6 && !(oct === 7 && pitch === 'C')) oct--;
  return `${pitch}${oct}`;
}

function formatDurationMinSec(sec) {
  const totalSec = Math.max(1, Math.round(sec || 0));
  const min = Math.floor(totalSec / 60);
  const rem = totalSec % 60;
  return min > 0 ? `${min}m${String(rem).padStart(2, '0')}s` : `${rem}s`;
}

function parseMidiBufferToSong(buffer, fileName, customId = null) {
  const midi = new Midi(buffer);
  const allNotes = [];

  midi.tracks.forEach((track) => {
    if (track.instrument && track.instrument.percussion) return;
    track.notes.forEach((note) => {
      allNotes.push({
        name: clampNoteTo61Keys(note.name),
        midi: note.midi,
        time: note.time,
        pressDuration: Math.max(0.07, Math.min(note.duration || 0.3, 3.5)),
        duration: Math.max(0.55, Math.min((note.duration || 0.5) * 1.35, 3.5)),
        velocity: note.velocity || 0.8
      });
    });
  });

  // Fallback if all tracks were marked percussion or empty
  if (allNotes.length === 0) {
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        allNotes.push({
          name: clampNoteTo61Keys(note.name),
          midi: note.midi,
          time: note.time,
          pressDuration: Math.max(0.07, Math.min(note.duration || 0.3, 3.5)),
          duration: Math.max(0.55, Math.min((note.duration || 0.5) * 1.35, 3.5)),
          velocity: note.velocity || 0.8
        });
      });
    });
  }

  allNotes.sort((a, b) => a.time - b.time || a.midi - b.midi);

  // Group simultaneous notes (within 35ms) into chord steps
  const steps = [];
  const CHORD_THRESHOLD = 0.035;

  for (const note of allNotes) {
    if (steps.length === 0) {
      steps.push({
        time: note.time,
        pressDuration: note.pressDuration,
        duration: note.duration,
        velocity: note.velocity,
        notes: [note.name]
      });
    } else {
      const lastStep = steps[steps.length - 1];
      if (Math.abs(note.time - lastStep.time) <= CHORD_THRESHOLD) {
        if (!lastStep.notes.includes(note.name) && lastStep.notes.length < 6) {
          lastStep.notes.push(note.name);
        }
        lastStep.pressDuration = Math.max(lastStep.pressDuration, note.pressDuration);
        lastStep.duration = Math.max(lastStep.duration, note.duration);
        lastStep.velocity = Math.max(lastStep.velocity, note.velocity);
      } else {
        steps.push({
          time: note.time,
          pressDuration: note.pressDuration,
          duration: note.duration,
          velocity: note.velocity,
          notes: [note.name]
        });
      }
    }
  }

  const bpm = midi.header.tempos && midi.header.tempos.length > 0
    ? Math.round(midi.header.tempos[0].bpm)
    : 120;
  const baseBeatSec = 60 / (bpm || 120) / 2;

  // Normalize start time to 0 and detect rests (temps d'arrêt) & long holds
  if (steps.length > 0) {
    const offset = steps[0].time;
    steps.forEach((s, idx) => {
      s.time = Math.max(0, s.time - offset);
      s.baseBeatSec = baseBeatSec;
      if (idx < steps.length - 1) {
        s.nextDelay = Math.max(0.04, steps[idx + 1].time - offset - s.time);
      } else {
        s.nextDelay = 0.4;
      }

      if (s.nextDelay > s.duration + 0.08 && s.nextDelay > baseBeatSec * 1.35) {
        s.pauseType = 'rest';
      } else if (s.nextDelay > baseBeatSec * 1.65) {
        s.pauseType = 'hold';
      } else {
        s.pauseType = null;
      }
    });
  }

  const cleanBase = fileName.replace(/\.(mid|midi)$/i, '').replace(/\s*\(Complet\)\s*/i, '').trim();
  const dashParts = cleanBase.split(/\s+-\s+/);
  const parsedTitle = dashParts[0] || cleanBase;
  const parsedArtist = dashParts.length > 1 ? dashParts.slice(1).join(' - ') : 'MIDI Complet';
  const durationLabel = formatDurationMinSec(midi.duration);

  return {
    id: customId || ('custom-midi-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
    title: parsedTitle,
    artist: `${parsedArtist} (${durationLabel})`,
    category: `MIDI Complet • ${durationLabel}`,
    bpm,
    difficulty: durationLabel,
    type: 'midi',
    steps
  };
}

function setGlobalKeyboardCapture(enable) {
  if (enable === globalCaptureActive) return globalCaptureActive;

  if (enable) {
    for (const key of CAPTURED_KEYS) {
      try {
        globalShortcut.register(key, () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('global:keypress', key);
          }
        });
      } catch (err) {
        // Ignore individual key registration failures
      }
    }
    globalCaptureActive = true;
  } else {
    for (const key of CAPTURED_KEYS) {
      try {
        globalShortcut.unregister(key);
      } catch (err) {
        // Ignore
      }
    }
    globalCaptureActive = false;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('global:captureState', globalCaptureActive);
  }
  return globalCaptureActive;
}

function registerBaseShortcuts() {
  // F8: Toggle global keyboard capture for playing while in another window
  globalShortcut.register('F8', () => {
    setGlobalKeyboardCapture(!globalCaptureActive);
  });

  // F9: Toggle Auto-Play Play/Pause from anywhere
  globalShortcut.register('F9', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global:command', 'toggle-autoplay');
    }
  });

  // F10: Reset song to beginning
  globalShortcut.register('F10', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global:command', 'restart-song');
    }
  });
}

function createWindow() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  const appIconPath = path.join(__dirname, 'src', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1340,
    height: 880,
    minWidth: 1020,
    minHeight: 700,
    backgroundColor: '#0b0e17',
    title: 'Virtual Piano',
    icon: appIconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false // Keep audio & timing accurate even when minimized/in background!
    }
  });

  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle('Virtual Piano');
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    setGlobalKeyboardCapture(false);
    if (streamWindow && !streamWindow.isDestroyed()) {
      streamWindow.close();
    }
    mainWindow = null;
  });
}

let streamWindow = null;

function toggleStreamSplitWindow() {
  if (streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.close();
    streamWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stream:splitState', false);
    }
    return false;
  }

  streamWindow = new BrowserWindow({
    width: 1280,
    height: 460,
    minWidth: 800,
    minHeight: 300,
    backgroundColor: '#060911',
    title: 'Virtual Piano',
    icon: path.join(__dirname, 'src', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  streamWindow.loadFile(path.join(__dirname, 'src', 'piano-stream.html'));

  streamWindow.on('closed', () => {
    streamWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stream:splitState', false);
    }
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stream:splitState', true);
  }
  return true;
}

app.whenReady().then(() => {
  createWindow();
  registerBaseShortcuts();
  discordRpc.connect();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  discordRpc.disconnect();
});

// IPC Handlers
ipcMain.on('discord:updateActivity', (_event, activityData) => {
  discordRpc.updateActivity(activityData || {});
});

ipcMain.handle('stats:getSavedNotes', () => {
  return discordRpc.totalNotesPlayed || 0;
});
ipcMain.handle('stream:toggleSplit', () => {
  return toggleStreamSplitWindow();
});

ipcMain.on('stream:syncActiveNotes', (_event, notesArray) => {
  if (streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.webContents.send('stream:activeNotes', notesArray);
  }
});

ipcMain.on('stream:inputEvent', (_event, payload) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stream:forwardedInput', payload);
  }
});

ipcMain.handle('global:toggleCapture', (event, forceState) => {
  const target = typeof forceState === 'boolean' ? forceState : !globalCaptureActive;
  return setGlobalKeyboardCapture(target);
});

ipcMain.handle('window:setAlwaysOnTop', (event, flag) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(Boolean(flag), 'screen-saver');
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});

ipcMain.handle('shell:openExternal', async (event, url) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('dialog:openSongFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Importer un fichier MIDI (.mid) ou une Partition Texte (.txt)',
    filters: [
      { name: 'Partitions & MIDI (.mid, .midi, .txt)', extensions: ['mid', 'midi', 'txt'] },
      { name: 'Fichiers MIDI (.mid, .midi)', extensions: ['mid', 'midi'] },
      { name: 'Partitions Texte (.txt)', extensions: ['txt'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths.length) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  if (ext === '.mid' || ext === '.midi') {
    const buffer = fs.readFileSync(filePath);
    return {
      kind: 'midi',
      song: parseMidiBufferToSong(buffer, fileName)
    };
  } else {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      kind: 'text',
      fileName: fileName.replace(/\.txt$/i, ''),
      content
    };
  }
});

ipcMain.handle('midi:parseArrayBuffer', async (event, { arrayBuffer, fileName }) => {
  const buffer = Buffer.from(arrayBuffer);
  return parseMidiBufferToSong(buffer, fileName || 'Morceau MIDI');
});

ipcMain.handle('midi:loadBuiltinFolder', async () => {
  const midiDir = path.join(__dirname, 'midi');
  if (!fs.existsSync(midiDir)) {
    fs.mkdirSync(midiDir, { recursive: true });
    return [];
  }
  const files = fs.readdirSync(midiDir).filter((f) => /\.(mid|midi)$/i.test(f));
  const songs = [];
  for (const file of files) {
    try {
      const buf = fs.readFileSync(path.join(midiDir, file));
      const song = parseMidiBufferToSong(buf, file, 'folder-midi-' + file);
      if (song && song.steps && song.steps.length > 0) {
        songs.push(song);
      }
    } catch (e) {
      console.error('Failed to parse MIDI file:', file, e.message);
    }
  }
  return songs;
});

ipcMain.handle('midi:openFolder', async () => {
  const midiDir = path.join(__dirname, 'midi');
  if (!fs.existsSync(midiDir)) {
    fs.mkdirSync(midiDir, { recursive: true });
  }
  await shell.openPath(midiDir);
  return midiDir;
});

ipcMain.handle('driver:installVbCable', async () => {
  const { exec } = require('child_process');
  const setupPath = path.join(__dirname, 'vb-cable', 'VBCABLE_Setup_x64.exe');
  if (!fs.existsSync(setupPath)) {
    await shell.openExternal('https://vb-audio.com/Cable/');
    return { launched: false, reason: 'missing' };
  }
  return new Promise((resolve) => {
    const cmd = `powershell -Command "Start-Process -FilePath '${setupPath.replace(/'/g, "''")}' -Verb RunAs"`;
    exec(cmd, (err) => {
      if (err) {
        resolve({ launched: false, error: err.message });
      } else {
        resolve({ launched: true });
      }
    });
  });
});


