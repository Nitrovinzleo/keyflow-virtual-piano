// ============================================================================
// Native Zero-Dependency Discord Rich Presence (IPC) Client for Windows
// Connects to \\.\pipe\discord-ipc-0 .. 9 and updates status in real time
// ============================================================================

const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(__dirname, 'user-stats.json');

function loadSavedTotalNotes() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
      if (typeof data.totalNotesPlayed === 'number' && data.totalNotesPlayed >= 0) {
        return data.totalNotesPlayed;
      }
    }
  } catch (e) {}
  return 0;
}

function saveTotalNotesToDisk(totalNotesPlayed) {
  try {
    let existing = {};
    if (fs.existsSync(STATS_FILE)) {
      existing = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')) || {};
    }
    existing.totalNotesPlayed = totalNotesPlayed;
    fs.writeFileSync(STATS_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (e) {}
}

class DiscordRPCClient {
  constructor(defaultClientId = '1377570118908772352') {
    this.clientId = defaultClientId;
    this.socket = null;
    this.connected = false;
    this.ready = false;
    this.startTimestamp = Math.floor(Date.now() / 1000);
    this.totalNotesPlayed = loadSavedTotalNotes();
    this.lastActivity = {
      details: 'Virtual Piano',
      state: `${this.totalNotesPlayed} ${this.totalNotesPlayed <= 1 ? 'note jouée' : 'notes jouées'}`
    };
    this.reconnectTimer = null;
    this.lastSentTime = 0;
    this.pendingFlushTimer = null;
  }

  connect(pipeIndex = 0) {
    if (this.connected || pipeIndex > 9) return;

    const pipePath = `\\\\?\\pipe\\discord-ipc-${pipeIndex}`;
    const sock = net.createConnection(pipePath);

    sock.once('connect', () => {
      console.log(`[Discord RPC] Connecte au pipe Discord (${pipePath})`);
      this._attachSocket(sock);
    });

    sock.once('error', (err) => {
      sock.destroy();
      if (!this.connected && pipeIndex < 9) {
        this.connect(pipeIndex + 1);
      } else {
        if (pipeIndex === 0 && err && err.code === 'EPERM') {
          console.log('[Discord RPC] Info : Lance "Lancer Virtual Piano.bat" depuis ton dossier Windows pour autoriser la connexion a Discord.');
        }
        this._scheduleReconnect();
      }
    });
  }

  _attachSocket(sock) {
    this.socket = sock;
    this.connected = true;

    this._sendFrame(0, {
      v: 1,
      client_id: this.clientId
    });

    sock.on('data', (chunk) => {
      try {
        let offset = 0;
        while (offset + 8 <= chunk.length) {
          const op = chunk.readInt32LE(offset);
          const len = chunk.readInt32LE(offset + 4);
          if (offset + 8 + len > chunk.length) break;
          const jsonStr = chunk.slice(offset + 8, offset + 8 + len).toString('utf8');
          offset += 8 + len;

          const msg = JSON.parse(jsonStr);
          if (op === 1 && msg.cmd === 'DISPATCH' && msg.evt === 'READY') {
            this.ready = true;
            console.log(`[Discord RPC] Statut Discord actif sur le compte : ${msg.data?.user?.username || 'Connecte'}`);
            this._flushActivityNow();
          } else if (msg.evt === 'ERROR') {
            console.error('[Discord RPC] Erreur Discord :', msg.data);
          }
        }
      } catch (e) {
        // Ignore partial chunk parse errors
      }
    });

    sock.once('close', () => {
      this.connected = false;
      this.ready = false;
      this.socket = null;
      this._scheduleReconnect();
    });

    sock.on('error', () => {});
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(0);
    }, 10000);
  }

  _sendFrame(op, dataObj) {
    if (!this.socket || !this.connected) return;
    try {
      const payload = Buffer.from(JSON.stringify(dataObj), 'utf8');
      const header = Buffer.alloc(8);
      header.writeInt32LE(op, 0);
      header.writeInt32LE(payload.length, 4);
      this.socket.write(Buffer.concat([header, payload]));
    } catch (e) {}
  }

  updateActivity({ details, state, totalNotes } = {}) {
    if (typeof totalNotes === 'number' && totalNotes >= 0) {
      this.totalNotesPlayed = totalNotes;
      saveTotalNotesToDisk(totalNotes);
    }
    if (details) this.lastActivity.details = details;
    if (state) this.lastActivity.state = state;

    if (!this.ready || !this.connected) return false;

    const now = Date.now();
    const elapsed = now - this.lastSentTime;
    const MIN_INTERVAL_MS = 2500;

    if (elapsed >= MIN_INTERVAL_MS) {
      this._flushActivityNow();
    } else if (!this.pendingFlushTimer) {
      this.pendingFlushTimer = setTimeout(() => {
        this.pendingFlushTimer = null;
        this._flushActivityNow();
      }, MIN_INTERVAL_MS - elapsed);
    }
    return true;
  }

  _flushActivityNow() {
    if (!this.ready || !this.connected) return;
    this.lastSentTime = Date.now();

    const activityPayload = {
      details: this.lastActivity.details || 'Virtual Piano',
      state: this.lastActivity.state || '0 note jouée',
      timestamps: {
        start: this.startTimestamp
      },
      assets: {
        large_image: 'piano',
        large_text: 'Virtual Piano',
        small_image: 'active_icon',
        small_text: 'Virtual Piano'
      },
      instance: false
    };

    console.log(`[Discord RPC] Mise a jour statut -> ${activityPayload.details} | ${activityPayload.state}`);

    this._sendFrame(1, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: activityPayload
      },
      nonce: crypto.randomUUID()
    });
  }

  disconnect() {
    if (this.pendingFlushTimer) {
      clearTimeout(this.pendingFlushTimer);
      this.pendingFlushTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (e) {}
      this.socket = null;
    }
    this.connected = false;
    this.ready = false;
  }
}

module.exports = { DiscordRPCClient };
