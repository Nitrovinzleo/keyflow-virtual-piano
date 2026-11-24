const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleGlobalCapture: (forceState) => ipcRenderer.invoke('global:toggleCapture', forceState),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openSongFile: () => ipcRenderer.invoke('dialog:openSongFile'),
  parseMidiBuffer: (arrayBuffer, fileName) =>
    ipcRenderer.invoke('midi:parseArrayBuffer', { arrayBuffer, fileName }),
  loadBuiltinMidis: () => ipcRenderer.invoke('midi:loadBuiltinFolder'),
  openMidiFolder: () => ipcRenderer.invoke('midi:openFolder'),
  installVbCable: () => ipcRenderer.invoke('driver:installVbCable'),
  updateDiscordActivity: (activityData) => ipcRenderer.send('discord:updateActivity', activityData),
  getSavedNotes: () => ipcRenderer.invoke('stats:getSavedNotes'),

  // Stream Split Mode API
  toggleStreamSplit: () => ipcRenderer.invoke('stream:toggleSplit'),
  syncStreamActiveNotes: (notesArray) => ipcRenderer.send('stream:syncActiveNotes', notesArray),
  sendStreamInput: (payload) => ipcRenderer.send('stream:inputEvent', payload),
  onStreamSplitState: (callback) => {
    ipcRenderer.on('stream:splitState', (_event, isSplit) => callback(isSplit));
  },
  onStreamActiveNotes: (callback) => {
    ipcRenderer.on('stream:activeNotes', (_event, notesArray) => callback(notesArray));
  },
  onStreamForwardedInput: (callback) => {
    ipcRenderer.on('stream:forwardedInput', (_event, payload) => callback(payload));
  },

  onGlobalKeypress: (callback) => {
    ipcRenderer.on('global:keypress', (_event, key) => callback(key));
  },
  onGlobalCaptureState: (callback) => {
    ipcRenderer.on('global:captureState', (_event, state) => callback(state));
  },
  onGlobalCommand: (callback) => {
    ipcRenderer.on('global:command', (_event, command) => callback(command));
  }
});
