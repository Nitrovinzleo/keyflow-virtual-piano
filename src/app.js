// ============================================================================
// KeyFlow Studio — Main Application Controller
// ============================================================================

(function () {
  const {
    VP_CHAR_TO_NOTE,
    NOTE_TO_VP_CHAR,
    AZERTY_KEY_TO_NOTE,
    AZERTY_CODE_TO_NOTE,
    NOTE_TO_AZERTY_DISPLAY,
    PIANO_KEYS,
    BUILTIN_SONGS,
    parseSheetToSteps
  } = window.KeyFlowSongs;

  const audio = new window.KeyFlowAudioEngine();

  // Application State
  const state = {
    songs: [...BUILTIN_SONGS],
    currentSong: BUILTIN_SONGS[0],
    currentStepIndex: 0,
    mode: 'mash',           // 'mash' | 'autoplay' | 'free'
    mashSubmode: 'flow',    // 'flow' (Vrai Rythme & Temps d'Arrêt) | 'step' (Manuel Libre)
    freeLayout: 'azerty',   // 'azerty' | 'vp'
    isAutoPlaying: false,
    autoPlaySpeed: 1.0,
    autoPlayLoop: true,
    autoPlayTimer: null,

    // Library Favorites, Deleted, Renamed & Song Queue
    favoriteIds: new Set(),
    deletedIds: new Set(),
    renamedTitles: {},      // { [songId]: customTitle }
    queue: [],              // Array of song IDs in playback queue
    libraryFilter: 'all',   // 'all' | 'fav' | 'queue'

    // 4-Second Transition / Skip state between songs
    isTransitioning: false,
    transitionSecondsLeft: 0,
    transitionInterval: null,
    transitionTimeout: null,
    transitionTargetSong: null,
    transitionResumeAutoPlay: false,

    // Typing speed & Pause (Temps d'arrêt) metrics
    tapTimestamps: [],
    pauseLockUntil: 0,
    pauseQueueTimer: null,
    flowActiveUntil: 0,
    flowTimer: null,
    lastFlowStepTime: 0,

    // Window states
    globalCapture: false,
    alwaysOnTop: false,
    totalNotesPlayed: 0
  };

  // DOM Elements
  const el = {
    mainWorkspace: document.getElementById('main-workspace'),
    songList: document.getElementById('song-list'),
    songSearch: document.getElementById('song-search'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterAllBtn: document.getElementById('filter-all-btn'),
    filterFavBtn: document.getElementById('filter-fav-btn'),
    filterQueueBtn: document.getElementById('filter-queue-btn'),
    favCountBadge: document.getElementById('fav-count-badge'),
    queueCountBadge: document.getElementById('queue-count-badge'),
    btnRestoreDeleted: document.getElementById('btn-restore-deleted'),
    queueCompartment: document.getElementById('queue-compartment'),
    queueBoxCount: document.getElementById('queue-box-count'),
    queueBoxList: document.getElementById('queue-box-list'),
    btnQueueNext: document.getElementById('btn-queue-next'),
    btnClearQueue: document.getElementById('btn-clear-queue'),
    resizerLeft: document.getElementById('resizer-left'),
    resizerRight: document.getElementById('resizer-right'),
    resizerQueue: document.getElementById('resizer-queue'),
    resizerSheet: document.getElementById('resizer-sheet'),
    resizerPiano: document.getElementById('resizer-piano'),
    currentSongBadge: document.getElementById('current-song-badge'),
    currentSongTitle: document.getElementById('current-song-title'),
    currentSongArtist: document.getElementById('current-song-artist'),
    currentSongSteps: document.getElementById('current-song-steps'),
    statTypingSpeed: document.getElementById('stat-typing-speed'),
    statProgress: document.getElementById('stat-progress'),
    progressSlider: document.getElementById('song-progress-slider'),
    progressFill: document.getElementById('song-progress-fill'),
    noteRibbon: document.getElementById('note-ribbon'),
    sheetTokensStrip: document.getElementById('sheet-tokens-strip'),
    currentChordDisplay: document.getElementById('current-chord-display'),
    typingPromptBanner: document.getElementById('typing-prompt-banner'),
    pianoKeyboard: document.getElementById('piano-keyboard'),

    // Mode buttons & panels
    modeBtns: document.querySelectorAll('.mode-btn'),
    controlsMash: document.getElementById('controls-mash'),
    controlsAutoplay: document.getElementById('controls-autoplay'),
    controlsFree: document.getElementById('controls-free'),
    submodeStepBtn: document.getElementById('submode-step-btn'),
    submodeFlowBtn: document.getElementById('submode-flow-btn'),
    btnAutoplayToggle: document.getElementById('btn-autoplay-toggle'),
    autoplaySpeedSlider: document.getElementById('autoplay-speed-slider'),
    autoplaySpeedLabel: document.getElementById('autoplay-speed-label'),
    autoplayLoopCheck: document.getElementById('autoplay-loop-check'),
    freeLayoutSelect: document.getElementById('free-layout-select'),
    btnRestartSong: document.getElementById('btn-restart-song'),
    btnSkipSong: document.getElementById('btn-skip-song'),
    queueTransitionBanner: document.getElementById('queue-transition-banner'),
    transitionCountdownBadge: document.getElementById('transition-countdown-badge'),
    transitionNextTitle: document.getElementById('transition-next-title'),
    btnTransitionNow: document.getElementById('btn-transition-now'),
    btnTransitionSkip: document.getElementById('btn-transition-skip'),
    btnTransitionCancel: document.getElementById('btn-transition-cancel'),

    // Top bar actions
    btnGlobalCapture: document.getElementById('btn-global-capture'),
    captureDot: document.getElementById('capture-dot'),
    btnPinWindow: document.getElementById('btn-pin-window'),
    btnHelpMic: document.getElementById('btn-help-mic'),
    btnSecretSplit: document.getElementById('btn-secret-split'),
    pianoDockFooter: document.getElementById('piano-dock-footer'),

    // Audio Studio controls
    selectInstrument: document.getElementById('select-instrument'),
    checkSustain: document.getElementById('check-sustain'),
    btnOctDown: document.getElementById('btn-oct-down'),
    btnOctUp: document.getElementById('btn-oct-up'),
    octaveVal: document.getElementById('octave-val'),
    sliderPianoVol: document.getElementById('slider-piano-vol'),
    labelPianoVol: document.getElementById('label-piano-vol'),
    selectMonitorOutput: document.getElementById('select-monitor-output'),
    selectVirtualMicOutput: document.getElementById('select-virtual-mic-output'),
    virtualMicBadge: document.getElementById('virtual-mic-badge'),
    noVirtualMicBox: document.getElementById('no-virtual-mic-box'),
    btnInstallVbCable: document.getElementById('btn-install-vbcable'),
    btnRefreshDevices: document.getElementById('btn-refresh-devices'),
    checkEnableRealMic: document.getElementById('check-enable-real-mic'),
    realMicSettings: document.getElementById('real-mic-settings'),
    selectRealMicInput: document.getElementById('select-real-mic-input'),
    sliderMicVol: document.getElementById('slider-mic-vol'),
    labelMicVol: document.getElementById('label-mic-vol'),
    checkMonitorVoice: document.getElementById('check-monitor-voice'),
    vuPianoFill: document.getElementById('vu-piano-fill'),
    vuMicFill: document.getElementById('vu-mic-fill'),

    // Import & Modals
    btnImportFile: document.getElementById('btn-import-file'),
    btnOpenMidiFolder: document.getElementById('btn-open-midi-folder'),
    btnOpenSheetModal: document.getElementById('btn-open-sheet-modal'),
    modalSheet: document.getElementById('modal-sheet'),
    btnCloseSheetModal: document.getElementById('btn-close-sheet-modal'),
    btnCancelSheet: document.getElementById('btn-cancel-sheet'),
    btnSaveSheet: document.getElementById('btn-save-sheet'),
    customSheetTitle: document.getElementById('custom-sheet-title'),
    customSheetBpm: document.getElementById('custom-sheet-bpm'),
    customSheetText: document.getElementById('custom-sheet-text'),
    modalMicGuide: document.getElementById('modal-mic-guide'),
    btnCloseMicGuide: document.getElementById('btn-close-mic-guide'),
    btnOkMicGuide: document.getElementById('btn-ok-mic-guide'),
    dropOverlay: document.getElementById('drop-overlay')
  };

  const keyElementsByNote = new Map();
  let lastActiveTokenIdx = -1;
  let draggedQueueIndex = null;

  // ============================================================================
  // 1. Initialization
  // ============================================================================
  async function init() {
    initResizableCompartments();
    loadSavedLibraryPrefs();
    await loadSavedTotalNotesCount();
    await loadBuiltinFolderMidis();
    loadSavedCustomSongs();
    applyDeletedAndRenamedToSongs();
    renderPianoKeyboard();
    renderSongList();
    if (state.songs.length > 0) {
      selectSong(state.songs[0]);
    }
    bindEvents();
    refreshAudioDevices(true);
    startVuMeterLoop();
  }

  // Interactive Resizing for all Compartments (Left, Right, Queue, Sheet, Piano)
  function initResizableCompartments() {
    const defaults = {
      leftWidth: 285,
      rightWidth: 290,
      queueHeight: 145,
      sheetHeight: 74,
      pianoHeight: 205
    };
    let sizes = { ...defaults };
    try {
      const saved = JSON.parse(localStorage.getItem('keyflow_layout_sizes') || '{}');
      sizes = { ...defaults, ...saved };
    } catch (e) {}

    const root = document.documentElement;
    const applySizes = () => {
      root.style.setProperty('--left-width', `${sizes.leftWidth}px`);
      root.style.setProperty('--right-width', `${sizes.rightWidth}px`);
      root.style.setProperty('--queue-height', `${sizes.queueHeight}px`);
      root.style.setProperty('--sheet-height', `${sizes.sheetHeight}px`);
      root.style.setProperty('--piano-height', `${sizes.pianoHeight}px`);
    };
    const saveSizes = () => {
      try {
        localStorage.setItem('keyflow_layout_sizes', JSON.stringify(sizes));
      } catch (e) {}
    };
    applySizes();

    function attachDragResizer(handleEl, key, isVertical, invertDelta, minVal, maxVal) {
      if (!handleEl) return;
      handleEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const startPos = isVertical ? e.clientX : e.clientY;
        const startVal = sizes[key];
        handleEl.classList.add('active');
        document.body.classList.add('is-resizing');

        const onMove = (moveEvt) => {
          const curPos = isVertical ? moveEvt.clientX : moveEvt.clientY;
          const delta = (curPos - startPos) * (invertDelta ? -1 : 1);
          sizes[key] = Math.max(minVal, Math.min(maxVal, Math.round(startVal + delta)));
          applySizes();
        };

        const onUp = () => {
          handleEl.classList.remove('active');
          document.body.classList.remove('is-resizing');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          saveSizes();
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

      handleEl.addEventListener('dblclick', () => {
        sizes[key] = defaults[key];
        applySizes();
        saveSizes();
      });
    }

    attachDragResizer(el.resizerLeft, 'leftWidth', true, false, 185, 620);
    attachDragResizer(el.resizerRight, 'rightWidth', true, true, 185, 620);
    attachDragResizer(el.resizerQueue, 'queueHeight', false, true, 65, 450);
    attachDragResizer(el.resizerSheet, 'sheetHeight', false, true, 45, 360);
    attachDragResizer(el.resizerPiano, 'pianoHeight', false, true, 110, 420);
  }

  function loadSavedLibraryPrefs() {
    try {
      const favRaw = localStorage.getItem('keyflow_favorites');
      if (favRaw) {
        const arr = JSON.parse(favRaw);
        if (Array.isArray(arr)) state.favoriteIds = new Set(arr);
      }
      const delRaw = localStorage.getItem('keyflow_deleted_songs');
      if (delRaw) {
        const arr = JSON.parse(delRaw);
        if (Array.isArray(arr)) state.deletedIds = new Set(arr);
      }
      const renRaw = localStorage.getItem('keyflow_renamed_songs');
      if (renRaw) {
        const obj = JSON.parse(renRaw);
        if (obj && typeof obj === 'object') state.renamedTitles = obj;
      }
      const qRaw = localStorage.getItem('keyflow_song_queue');
      if (qRaw) {
        const qArr = JSON.parse(qRaw);
        if (Array.isArray(qArr)) state.queue = qArr;
      }
    } catch (e) {}
  }

  function saveLibraryPrefs() {
    try {
      localStorage.setItem('keyflow_favorites', JSON.stringify([...state.favoriteIds]));
      localStorage.setItem('keyflow_deleted_songs', JSON.stringify([...state.deletedIds]));
      localStorage.setItem('keyflow_renamed_songs', JSON.stringify(state.renamedTitles));
      localStorage.setItem('keyflow_song_queue', JSON.stringify(state.queue));
    } catch (e) {}
  }

  function applyDeletedAndRenamedToSongs() {
    if (state.deletedIds.size > 0) {
      state.songs = state.songs.filter((s) => !state.deletedIds.has(s.id));
    }
    const validIds = new Set(state.songs.map((s) => s.id));
    state.queue = state.queue.filter((id) => validIds.has(id));
    state.songs.forEach((s) => {
      if (state.renamedTitles[s.id]) {
        s.title = state.renamedTitles[s.id];
      }
    });
  }

  async function loadBuiltinFolderMidis() {
    try {
      if (window.electronAPI && window.electronAPI.loadBuiltinMidis) {
        const midiSongs = await window.electronAPI.loadBuiltinMidis();
        if (Array.isArray(midiSongs) && midiSongs.length > 0) {
          // Put the complete full-length .mid files first as the primary repertoire!
          state.songs = [...midiSongs];
          state.currentSong = state.songs[0];
        }
      }
    } catch (e) {}
  }

  async function loadSavedTotalNotesCount() {
    let localCount = 0;
    try {
      const saved = parseInt(localStorage.getItem('keyflow_total_notes_played') || '0', 10);
      if (!isNaN(saved) && saved > 0) localCount = saved;
    } catch (e) {}

    let diskCount = 0;
    try {
      if (window.electronAPI && window.electronAPI.getSavedNotes) {
        diskCount = (await window.electronAPI.getSavedNotes()) || 0;
      }
    } catch (e) {}

    state.totalNotesPlayed = Math.max(localCount, diskCount);
    try {
      localStorage.setItem('keyflow_total_notes_played', String(state.totalNotesPlayed));
    } catch (e) {}
  }

  function loadSavedCustomSongs() {
    try {
      const raw = localStorage.getItem('keyflow_custom_songs');
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          saved.forEach((s) => {
            if (s && s.steps && s.steps.length && !state.deletedIds.has(s.id)) {
              state.songs.unshift(s);
            }
          });
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  function saveCustomSongToStorage(song) {
    try {
      const raw = localStorage.getItem('keyflow_custom_songs');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(song);
      localStorage.setItem('keyflow_custom_songs', JSON.stringify(list.slice(0, 25)));
    } catch (e) {}
  }

  function updateCustomSongTitleInStorage(songId, newTitle) {
    try {
      const raw = localStorage.getItem('keyflow_custom_songs');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        let changed = false;
        list.forEach((s) => {
          if (s && s.id === songId) {
            s.title = newTitle;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('keyflow_custom_songs', JSON.stringify(list));
        }
      }
    } catch (e) {}
  }

  function removeCustomSongFromStorage(songId) {
    try {
      const raw = localStorage.getItem('keyflow_custom_songs');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((s) => s && s.id !== songId);
        localStorage.setItem('keyflow_custom_songs', JSON.stringify(filtered));
      }
    } catch (e) {}
  }

  // ============================================================================
  // 2. Render 61-Key Piano Dock
  // ============================================================================
  function renderPianoKeyboard() {
    el.pianoKeyboard.innerHTML = '';
    keyElementsByNote.clear();

    const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);
    const totalWhites = whiteKeys.length; // 36 white keys from C2 to C7
    let whiteIndex = 0;

    PIANO_KEYS.forEach((keyObj) => {
      const keyEl = document.createElement('div');
      keyEl.className = `piano-key ${keyObj.isBlack ? 'black' : 'white'}`;
      keyEl.dataset.note = keyObj.note;

      const labelChar = state.freeLayout === 'azerty'
        ? (NOTE_TO_AZERTY_DISPLAY[keyObj.note] || '')
        : (NOTE_TO_VP_CHAR[keyObj.note] || keyObj.vpChar);

      keyEl.innerHTML = `
        <span class="key-char-label">${labelChar || ''}</span>
        <span class="key-note-label">${keyObj.note}</span>
      `;

      if (keyObj.isBlack) {
        const leftPercent = ((whiteIndex / totalWhites) * 100) - 0.95;
        keyEl.style.left = `${leftPercent}%`;
      } else {
        whiteIndex++;
      }

      const mouseHoldId = `mouse-${keyObj.note}`;
      keyEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        audio.startSustainedNotes(mouseHoldId, [keyObj.note], 0.92);
        keyEl.classList.add('active');
        el.currentChordDisplay.textContent = `Note maintenue : ${keyObj.note}`;
        broadcastStreamActiveNotes();
        addPlayedNotesCount(1);
      });
      const stopMouseNote = () => {
        if (audio.activeHeldVoices.has(mouseHoldId)) {
          audio.stopSustainedNotes(mouseHoldId);
          keyEl.classList.remove('active');
          broadcastStreamActiveNotes();
        }
      };
      keyEl.addEventListener('mouseup', stopMouseNote);
      keyEl.addEventListener('mouseleave', stopMouseNote);

      el.pianoKeyboard.appendChild(keyEl);
      keyElementsByNote.set(keyObj.note, keyEl);
    });
  }

  function broadcastStreamActiveNotes() {
    if (!window.electronAPI || !window.electronAPI.syncStreamActiveNotes) return;
    const activeList = [];
    keyElementsByNote.forEach((kEl, noteName) => {
      if (kEl.classList.contains('active')) activeList.push(noteName);
    });
    window.electronAPI.syncStreamActiveNotes(activeList);
  }

  const keyFlashTimeouts = new Map();

  function flashPianoKeys(notes, durationMs = 260) {
    const holdTime = Math.max(50, durationMs);
    notes.forEach((noteName) => {
      const keyEl = keyElementsByNote.get(noteName);
      if (keyEl) {
        if (keyFlashTimeouts.has(noteName)) {
          clearTimeout(keyFlashTimeouts.get(noteName));
        }
        keyEl.classList.add('active');
        const timer = setTimeout(() => {
          keyFlashTimeouts.delete(noteName);
          keyEl.classList.remove('active');
          broadcastStreamActiveNotes();
        }, holdTime);
        keyFlashTimeouts.set(noteName, timer);
      }
    });
    broadcastStreamActiveNotes();
  }

  function highlightNextStepKeys() {
    keyElementsByNote.forEach((kEl) => kEl.classList.remove('next-hint'));
    if (!state.currentSong || !state.currentSong.steps.length) return;
    const step = state.currentSong.steps[state.currentStepIndex];
    if (!step) return;
    step.notes.forEach((noteName) => {
      const kEl = keyElementsByNote.get(noteName);
      if (kEl) kEl.classList.add('next-hint');
    });
  }

  // ============================================================================
  // 3. Song List, Queue, Favorites, Rename & Deletion
  // ============================================================================
  function renderSongList(filterText = '') {
    const q = (filterText || (el.songSearch ? el.songSearch.value : '')).trim().toLowerCase();
    el.songList.innerHTML = '';

    // Clean up any stale song IDs in queue
    const validMap = new Map(state.songs.map((s) => [s.id, s]));
    state.queue = state.queue.filter((id) => validMap.has(id));

    // Update badges & dedicated File d'attente compartment
    const activeFavCount = state.songs.filter((s) => state.favoriteIds.has(s.id)).length;
    if (el.favCountBadge) {
      el.favCountBadge.textContent = String(activeFavCount);
    }
    if (el.queueCountBadge) {
      el.queueCountBadge.textContent = String(state.queue.length);
    }
    if (el.btnRestoreDeleted) {
      el.btnRestoreDeleted.classList.toggle('hidden', state.deletedIds.size === 0);
    }
    renderQueueCompartment(validMap);

    let filtered = [];
    if (state.libraryFilter === 'queue') {
      filtered = state.queue
        .map((id) => validMap.get(id))
        .filter((s) => {
          if (!s) return false;
          if (!q) return true;
          return (
            s.title.toLowerCase().includes(q) ||
            (s.artist && s.artist.toLowerCase().includes(q)) ||
            (s.category && s.category.toLowerCase().includes(q))
          );
        });
    } else {
      filtered = state.songs.filter((s) => {
        if (state.libraryFilter === 'fav' && !state.favoriteIds.has(s.id)) return false;
        if (!q) return true;
        return (
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      });

      // Sort favorites to the top while preserving original order within groups
      filtered = [...filtered].sort((a, b) => {
        const aFav = state.favoriteIds.has(a.id) ? 1 : 0;
        const bFav = state.favoriteIds.has(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'song-list-empty';
      empty.textContent = state.libraryFilter === 'queue'
        ? 'La file d\'attente est vide. Clique sur + sur un morceau pour l\'ajouter.'
        : state.libraryFilter === 'fav'
          ? 'Aucun morceau en favori.'
          : 'Aucun morceau trouvé.';
      el.songList.appendChild(empty);
      return;
    }

    filtered.forEach((song, listIndex) => {
      const isFav = state.favoriteIds.has(song.id);
      const isQueued = state.queue.includes(song.id);

      const item = document.createElement('div');
      item.className = `song-item ${state.currentSong && state.currentSong.id === song.id ? 'active' : ''}`;
      const totalNotesCount = song.totalRawNotes || song.steps.length;
      const durInfo = song.durationFormatted ? ` • ${song.durationFormatted}` : '';

      item.innerHTML = `
        <div class="song-item-info">
          <div class="song-item-title" title="Double-cliquer pour renommer">${song.title}</div>
          <div class="song-item-sub">${song.artist || 'MIDI'} • ${totalNotesCount} notes${durInfo}</div>
        </div>
        <div class="song-item-actions">
          <button class="song-action-btn queue-btn ${isQueued ? 'queued' : ''}" title="Ajouter à la file d'attente (cliquer plusieurs fois pour l'ajouter plusieurs fois d'affilée)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="song-action-btn fav-btn ${isFav ? 'favorited' : ''}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
          <button class="song-action-btn edit-btn" title="Renommer ce morceau">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="song-action-btn del-btn" title="${state.libraryFilter === 'queue' ? 'Retirer cette entrée de la file' : 'Supprimer de la liste du répertoire'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      const titleEl = item.querySelector('.song-item-title');
      const queueBtn = item.querySelector('.queue-btn');
      const favBtn = item.querySelector('.fav-btn');
      const editBtn = item.querySelector('.edit-btn');
      const delBtn = item.querySelector('.del-btn');

      queueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addSongToQueue(song.id);
      });

      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteSong(song.id);
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startInlineRenameSong(song, titleEl);
      });

      titleEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startInlineRenameSong(song, titleEl);
      });

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.libraryFilter === 'queue') {
          state.queue.splice(listIndex, 1);
          saveLibraryPrefs();
          renderSongList(el.songSearch.value);
        } else {
          deleteSongFromRepertoire(song);
        }
      });

      item.addEventListener('click', () => selectSong(song));
      el.songList.appendChild(item);
    });
  }

  // Render the dedicated File d'attente compartment with Drag-and-Drop reordering (clean order without numbers)
  function renderQueueCompartment(validMap = null) {
    if (!el.queueBoxList || !el.queueBoxCount) return;
    const songMap = validMap || new Map(state.songs.map((s) => [s.id, s]));
    el.queueBoxCount.textContent = String(state.queue.length);
    el.queueBoxList.innerHTML = '';

    if (state.queue.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'queue-box-empty';
      empty.textContent = 'Aucun morceau en attente. Clique sur [+] dans le répertoire pour ajouter des titres.';
      el.queueBoxList.appendChild(empty);
      return;
    }

    state.queue.forEach((songId, idx) => {
      const song = songMap.get(songId);
      if (!song) return;

      const row = document.createElement('div');
      row.className = 'queue-box-item';
      row.draggable = true;
      row.dataset.queueIdx = String(idx);
      row.title = 'Glisser-déposer pour changer l\'ordre • Cliquer pour lancer';

      row.innerHTML = `
        <div class="queue-box-item-left">
          <span class="queue-drag-handle" title="Glisser pour déplacer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
            </svg>
          </span>
          <span class="queue-box-name">${song.title}</span>
        </div>
        <button class="queue-box-remove" title="Retirer de la file">✕</button>
      `;

      const removeBtn = row.querySelector('.queue-box-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.queue.splice(idx, 1);
        saveLibraryPrefs();
        renderSongList(el.songSearch.value);
      });

      row.addEventListener('click', () => {
        state.queue.splice(idx, 1);
        saveLibraryPrefs();
        selectSong(song);
      });

      // Drag and Drop reordering inside the queue
      row.addEventListener('dragstart', (e) => {
        draggedQueueIndex = idx;
        row.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(idx));
        }
      });

      row.addEventListener('dragend', () => {
        draggedQueueIndex = null;
        row.classList.remove('dragging');
        el.queueBoxList.querySelectorAll('.queue-box-item').forEach((it) => {
          it.classList.remove('drag-over-top', 'drag-over-bottom');
        });
      });

      row.addEventListener('dragover', (e) => {
        if (draggedQueueIndex === null || draggedQueueIndex === idx) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const rect = row.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > rect.height / 2;
        row.classList.toggle('drag-over-top', !isAfter);
        row.classList.toggle('drag-over-bottom', isAfter);
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      row.addEventListener('drop', (e) => {
        if (draggedQueueIndex === null || draggedQueueIndex === idx) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = row.getBoundingClientRect();
        const insertAfter = (e.clientY - rect.top) > rect.height / 2;

        const movedSongId = state.queue[draggedQueueIndex];
        state.queue.splice(draggedQueueIndex, 1);

        let targetIdx = idx;
        if (draggedQueueIndex < idx) targetIdx--;
        if (insertAfter) targetIdx++;

        targetIdx = Math.max(0, Math.min(state.queue.length, targetIdx));
        state.queue.splice(targetIdx, 0, movedSongId);
        draggedQueueIndex = null;

        saveLibraryPrefs();
        renderSongList(el.songSearch.value);
      });

      el.queueBoxList.appendChild(row);
    });
  }

  function addSongToQueue(songId) {
    state.queue.push(songId);
    saveLibraryPrefs();
    renderSongList(el.songSearch.value);
    if (el.queueBoxList) {
      el.queueBoxList.scrollTop = el.queueBoxList.scrollHeight;
    }
  }

  function clearSongQueue() {
    state.queue = [];
    saveLibraryPrefs();
    renderSongList(el.songSearch.value);
  }

  // Get the next song to play (from queue if non-empty, otherwise next song in repertoire)
  function peekNextSongInOrder(afterSongId = null) {
    const validMap = new Map(state.songs.map((s) => [s.id, s]));
    state.queue = state.queue.filter((id) => validMap.has(id));

    if (state.queue.length > 0) {
      return { song: validMap.get(state.queue[0]), fromQueue: true };
    }
    if (state.songs.length === 0) return null;
    const baseId = afterSongId || (state.currentSong && state.currentSong.id);
    const curIdx = state.songs.findIndex((s) => s.id === baseId);
    const nextIdx = curIdx >= 0 ? (curIdx + 1) % state.songs.length : 0;
    return { song: state.songs[nextIdx], fromQueue: false };
  }

  function cancelNextSongTransition() {
    state.isTransitioning = false;
    state.transitionTargetSong = null;
    if (state.transitionInterval) {
      clearInterval(state.transitionInterval);
      state.transitionInterval = null;
    }
    if (state.transitionTimeout) {
      clearTimeout(state.transitionTimeout);
      state.transitionTimeout = null;
    }
    if (el.queueTransitionBanner) {
      el.queueTransitionBanner.classList.add('hidden');
    }
  }

  function executeTransitionTargetNow() {
    const target = state.transitionTargetSong;
    const shouldAutoPlay = state.transitionResumeAutoPlay;
    cancelNextSongTransition();
    if (!target) return;

    // If this song was at the front of the queue, pop it now!
    if (state.queue.length > 0 && state.queue[0] === target.id) {
      state.queue.shift();
      saveLibraryPrefs();
    }

    selectSong(target);
    if (shouldAutoPlay && state.mode === 'autoplay') {
      startAutoPlay();
    }
  }

  // Start the 4-second countdown before launching the next song (with skip option!)
  function startNextSongTransition(durationSec = 4, forceSkipCandidateAfterId = null) {
    const wasPlayingAuto = state.isAutoPlaying || state.transitionResumeAutoPlay;
    if (state.isAutoPlaying) {
      stopAutoPlay();
    }
    cancelNextSongTransition();

    const candidate = peekNextSongInOrder(forceSkipCandidateAfterId);
    if (!candidate || !candidate.song) return;

    state.isTransitioning = true;
    state.transitionTargetSong = candidate.song;
    state.transitionResumeAutoPlay = wasPlayingAuto;
    state.transitionSecondsLeft = durationSec;

    if (el.queueTransitionBanner) {
      el.queueTransitionBanner.classList.remove('hidden');
      el.transitionCountdownBadge.textContent = `${state.transitionSecondsLeft}s`;
      el.transitionNextTitle.textContent = `Suivant : ${candidate.song.title}`;
    }

    state.transitionInterval = setInterval(() => {
      state.transitionSecondsLeft = Math.max(0, state.transitionSecondsLeft - 1);
      if (el.transitionCountdownBadge) {
        el.transitionCountdownBadge.textContent = `${state.transitionSecondsLeft}s`;
      }
    }, 1000);

    state.transitionTimeout = setTimeout(() => {
      executeTransitionTargetNow();
    }, durationSec * 1000);
  }

  // Skip the currently queued upcoming song during the 4s window and start a fresh 4s countdown on the song after it!
  function skipUpcomingTransitionSong() {
    const skippedSong = state.transitionTargetSong || state.currentSong;
    if (skippedSong && state.queue.length > 0 && state.queue[0] === skippedSong.id) {
      state.queue.shift();
      saveLibraryPrefs();
      renderSongList(el.songSearch.value);
    }
    startNextSongTransition(4, skippedSong ? skippedSong.id : null);
  }

  function startInlineRenameSong(song, titleEl) {
    if (!song || !titleEl) return;
    if (titleEl.querySelector('input')) return;

    const currentTitle = song.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'song-rename-input';
    input.value = currentTitle;

    titleEl.textContent = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    let finished = false;
    const commitRename = (save) => {
      if (finished) return;
      finished = true;
      const nextTitle = input.value.trim();
      if (save && nextTitle && nextTitle !== currentTitle) {
        song.title = nextTitle;
        state.renamedTitles[song.id] = nextTitle;
        saveLibraryPrefs();
        updateCustomSongTitleInStorage(song.id, nextTitle);
        if (state.currentSong && state.currentSong.id === song.id) {
          el.currentSongTitle.textContent = nextTitle;
        }
      }
      renderSongList(el.songSearch.value);
    };

    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        commitRename(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        commitRename(false);
      }
    });
    input.addEventListener('blur', () => commitRename(true));
  }

  function toggleFavoriteSong(songId) {
    if (state.favoriteIds.has(songId)) {
      state.favoriteIds.delete(songId);
    } else {
      state.favoriteIds.add(songId);
    }
    saveLibraryPrefs();
    renderSongList(el.songSearch.value);
  }

  function deleteSongFromRepertoire(song) {
    if (!song) return;
    state.deletedIds.add(song.id);
    state.favoriteIds.delete(song.id);
    state.queue = state.queue.filter((id) => id !== song.id);
    saveLibraryPrefs();
    removeCustomSongFromStorage(song.id);

    state.songs = state.songs.filter((s) => s.id !== song.id);

    if (state.currentSong && state.currentSong.id === song.id) {
      stopAutoPlay();
      if (state.songs.length > 0) {
        selectSong(state.songs[0]);
        return;
      }
    }
    renderSongList(el.songSearch.value);
  }

  async function restoreDeletedSongs() {
    state.deletedIds.clear();
    saveLibraryPrefs();
    await loadBuiltinFolderMidis();
    loadSavedCustomSongs();
    applyDeletedAndRenamedToSongs();
    renderSongList(el.songSearch.value);
    if (!state.currentSong && state.songs.length > 0) {
      selectSong(state.songs[0]);
    }
  }

  function selectSong(song) {
    if (!song || !song.steps || song.steps.length === 0) return;
    cancelNextSongTransition();
    stopAutoPlay();
    state.currentSong = song;
    state.currentStepIndex = 0;

    el.currentSongBadge.textContent = song.category || (song.type === 'midi' ? 'MIDI Complet' : 'Partition');
    el.currentSongTitle.textContent = song.title;
    const totalNotesCount = song.totalRawNotes || song.steps.length;
    const durInfo = song.durationFormatted ? ` • ${song.durationFormatted}` : '';
    el.currentSongArtist.innerHTML = `${song.artist || 'Artiste'} • <span id="current-song-steps">${song.steps.length} accords / ${totalNotesCount} notes (${song.bpm || 120} BPM${durInfo})</span>`;

    renderSongList(el.songSearch.value);
    renderSheetTokensStrip();
    updateStageUI();
    syncDiscordPresence();
  }

  function addPlayedNotesCount(count = 1) {
    state.totalNotesPlayed += Math.max(1, count);
    try {
      localStorage.setItem('keyflow_total_notes_played', String(state.totalNotesPlayed));
    } catch (e) {}
    syncDiscordPresence();
  }

  function syncDiscordPresence() {
    if (!window.electronAPI || !window.electronAPI.updateDiscordActivity) return;
    const n = state.totalNotesPlayed;
    window.electronAPI.updateDiscordActivity({
      details: 'Virtual Piano',
      state: `${n} ${n <= 1 ? 'note jouée' : 'notes jouées'}`,
      totalNotes: n
    });
  }

  function renderSheetTokensStrip() {
    el.sheetTokensStrip.innerHTML = '';
    lastActiveTokenIdx = -1;
    const steps = state.currentSong.steps;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const span = document.createElement('span');
      span.className = `sheet-token ${i === state.currentStepIndex ? 'active' : ''}`;
      span.dataset.idx = i;
      const getNoteKeyDisplay = (n) => (state.freeLayout === 'azerty' ? (NOTE_TO_AZERTY_DISPLAY[n] || NOTE_TO_VP_CHAR[n] || n) : (NOTE_TO_VP_CHAR[n] || n));
      const keyChars = step.notes.map(getNoteKeyDisplay).join('');
      const pauseSuffix = step.pauseType === 'rest' ? ' ·' : step.pauseType === 'hold' ? ' —' : '';
      span.textContent = (step.notes.length > 1 ? `[${keyChars}]` : keyChars) + pauseSuffix;
      span.title = `Étape ${i + 1} : ${step.notes.join(' + ')}`;
      span.addEventListener('click', () => {
        state.currentStepIndex = i;
        state.pauseLockUntil = 0;
        updateStageUI();
      });
      frag.appendChild(span);
    }
    el.sheetTokensStrip.appendChild(frag);
    lastActiveTokenIdx = state.currentStepIndex;
  }

  function updateStageUI(hitFlash = false) {
    const steps = state.currentSong ? state.currentSong.steps : [];
    const total = steps.length;
    const idx = state.currentStepIndex;

    // Progress stats
    el.statProgress.textContent = `${idx} / ${total}`;
    const pct = total > 0 ? Math.round((idx / Math.max(1, total - 1)) * 100) : 0;
    el.progressSlider.value = pct;
    el.progressFill.style.width = `${pct}%`;

    const currentStep = steps[idx];
    if (currentStep) {
      el.currentChordDisplay.textContent = currentStep.notes.join(' + ');
    }

    // Render Note Ribbon (3 past steps, 1 current step, 4 upcoming steps)
    el.noteRibbon.innerHTML = '';
    for (let offset = -3; offset <= 4; offset++) {
      const targetIdx = idx + offset;
      if (targetIdx < 0 || targetIdx >= total) continue;

      const step = steps[targetIdx];
      const card = document.createElement('div');
      const isCurrent = offset === 0;
      card.className = `step-card ${offset < 0 ? 'past' : isCurrent ? 'current' : 'upcoming'} ${isCurrent && hitFlash ? 'hit-flash' : ''}`;

      const getNoteKeyDisplay = (n) => (state.freeLayout === 'azerty' ? (NOTE_TO_AZERTY_DISPLAY[n] || NOTE_TO_VP_CHAR[n] || n) : (NOTE_TO_VP_CHAR[n] || n));
      const vpLabel = step.notes.length > 1
        ? `[${step.notes.map(getNoteKeyDisplay).join('')}]`
        : getNoteKeyDisplay(step.notes[0]);

      const pauseBadge = step.pauseType === 'rest'
        ? '<span class="step-idx">PAUSE</span>'
        : step.pauseType === 'hold'
          ? '<span class="step-idx">TENUE</span>'
          : `<span class="step-idx">#${targetIdx + 1}</span>`;

      card.innerHTML = `
        ${pauseBadge}
        <div class="step-notes">${step.notes.join(' ')}</div>
        <span class="step-vp">[${vpLabel}]</span>
      `;
      el.noteRibbon.appendChild(card);
    }

    // O(1) fast token highlight in strip (supports 6500+ note MIDIs without DOM lag!)
    const tokens = el.sheetTokensStrip.children;
    if (tokens.length > 0) {
      if (Math.abs(idx - lastActiveTokenIdx) > 3 || idx === 0) {
        for (let i = 0; i < tokens.length; i++) {
          tokens[i].classList.toggle('active', i === idx);
          tokens[i].classList.toggle('played', i < idx);
        }
      } else {
        if (lastActiveTokenIdx >= 0 && lastActiveTokenIdx < tokens.length) {
          tokens[lastActiveTokenIdx].classList.remove('active');
          if (lastActiveTokenIdx < idx) {
            tokens[lastActiveTokenIdx].classList.add('played');
          }
        }
        if (idx >= 0 && idx < tokens.length) {
          tokens[idx].classList.add('active');
          tokens[idx].classList.remove('played');
        }
      }
      lastActiveTokenIdx = idx;
      if (tokens[idx]) {
        tokens[idx].scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }
    }

    highlightNextStepKeys();
  }

  // ============================================================================
  // 4. Play Modes: Mash-to-Play (Any Letter), Auto-Play, Free Play
  // ============================================================================

  // Track currently held physical keys & active overlapping voices
  const heldPhysicalKeys = new Set();
  const heldActiveNotes = new Map(); // voiceId -> Array of noteNames
  const heldKeyBindings = new Map(); // physicalCode -> { voiceId, minReleaseAt }
  let voiceCounter = 0;

  function refreshActivePianoKeyLights() {
    const currentlyHeldSet = new Set();
    heldActiveNotes.forEach((notesArr) => {
      notesArr.forEach((n) => currentlyHeldSet.add(n));
    });
    keyElementsByNote.forEach((kEl, noteName) => {
      if (!keyFlashTimeouts.has(noteName)) {
        kEl.classList.toggle('active', currentlyHeldSet.has(noteName));
      }
    });
    broadcastStreamActiveNotes();
  }

  function startOverlappingKeyVoice(code, notes, vel, minAudioOverlapSec = 0.55, visualPressSec = 0.25) {
    const voiceId = `voice-${++voiceCounter}`;
    audio.startSustainedNotes(voiceId, notes, vel);
    heldActiveNotes.set(voiceId, [...notes]);

    // If this physical key already had an older voice attached, release that binding into its natural overlap tail
    if (heldKeyBindings.has(code)) {
      releaseKeyVoice(code);
    }

    const now = performance.now();
    // Add a subtle human organic feel (±10%) so no two notes ever look robotically identical
    const humanFactor = 0.90 + Math.random() * 0.20;
    const minVisualReleaseAt = now + Math.max(55, visualPressSec * humanFactor * 1000);
    const minAudioReleaseAt = now + Math.max(160, minAudioOverlapSec * 1000);

    heldKeyBindings.set(code, { voiceId, minVisualReleaseAt, minAudioReleaseAt });
    refreshActivePianoKeyLights();
  }

  function releaseKeyVoice(code) {
    const binding = heldKeyBindings.get(code);
    if (!binding) return;
    heldKeyBindings.delete(code);

    const { voiceId, minVisualReleaseAt, minAudioReleaseAt } = binding;
    const now = performance.now();
    const remainingVisualMs = minVisualReleaseAt - now;
    const remainingAudioMs = minAudioReleaseAt - now;

    // 1. Graphical key release: adapts to the note's real musical length (short, medium, or long!)
    if (remainingVisualMs <= 15) {
      heldActiveNotes.delete(voiceId);
      refreshActivePianoKeyLights();
    } else {
      setTimeout(() => {
        heldActiveNotes.delete(voiceId);
        refreshActivePianoKeyLights();
      }, remainingVisualMs);
    }

    // 2. Audio legato release: continues superimposing smoothly so sound is never choppy!
    if (remainingAudioMs <= 15) {
      audio.stopSustainedNotes(voiceId);
    } else {
      setTimeout(() => {
        audio.stopSustainedNotes(voiceId);
      }, remainingAudioMs);
    }
  }

  function getEffectiveSpeedFactor(step) {
    if (state.mode === 'autoplay') {
      return Math.max(0.15, state.autoPlaySpeed || 1.0);
    }
    if (state.mode === 'mash') {
      const tapRate = Math.max(0.8, state.tapTimestamps.length / 2.0);
      const naturalRate = 1 / (step?.baseBeatSec || 0.25);
      return Math.max(0.25, Math.min(3.0, tapRate / naturalRate));
    }
    return 1.0;
  }

  // Play the current step in the loaded song and advance to next (with varied visual key hold + full audio superposition!)
  function playAndAdvanceStep(velocityOverride = null, holdCode = null) {
    if (!state.currentSong || !state.currentSong.steps.length) return null;
    const steps = state.currentSong.steps;
    const step = steps[state.currentStepIndex];
    if (!step) return null;

    const vel = velocityOverride !== null ? velocityOverride : (step.velocity || 0.88);
    const speedFactor = getEffectiveSpeedFactor(step);

    // Audio duration stays rich and overlapping (legato) so sound never chops
    const baseAudioSec = Math.max(0.55, step.duration || 0.65);
    const scaledAudioSec = Math.max(0.18, Math.min(6.0, baseAudioSec / speedFactor));

    // Visual key press duration adapts to each note's true length (short fast run, normal note, chord, or long '-' hold)
    const rawPressSec = step.pressDuration || (
      step.pauseType === 'hold'
        ? (step.nextDelay || 0.6) * 0.95
        : step.notes.length > 1
          ? (step.nextDelay || 0.3) * 1.15
          : (step.nextDelay || 0.24) * 0.78
    );
    const scaledVisualSec = Math.max(0.06, Math.min(5.0, rawPressSec / speedFactor));

    if (holdCode) {
      startOverlappingKeyVoice(holdCode, step.notes, vel, scaledAudioSec * 0.85, scaledVisualSec);
    } else {
      audio.playChord(step.notes, scaledAudioSec, vel);
      const humanFactor = 0.90 + Math.random() * 0.20;
      const visualHoldMs = Math.max(55, scaledVisualSec * humanFactor * 1000);
      flashPianoKeys(step.notes, visualHoldMs);
    }

    // Advance step index immediately (never wait for previous note to stop!)
    const wasLastStep = state.currentStepIndex >= steps.length - 1;
    state.currentStepIndex++;
    if (state.currentStepIndex >= steps.length) {
      state.currentStepIndex = 0;
    }

    addPlayedNotesCount(step.notes.length);
    updateStageUI(true);

    // In Mash Mode: if the song just finished and there are songs in the queue, start the 4s transition!
    if (wasLastStep && state.mode === 'mash' && state.queue.length > 0) {
      startNextSongTransition(4);
    }

    return step;
  }

  // Record a user key tap & calculate live typing speed (notes/sec)
  function registerUserKeyTap() {
    const now = performance.now();
    state.tapTimestamps.push(now);
    // Keep taps from last 2.2 seconds
    state.tapTimestamps = state.tapTimestamps.filter((t) => now - t <= 2200);
    const rate = (state.tapTimestamps.length / 2.0).toFixed(1);
    el.statTypingSpeed.innerHTML = `${rate} <small>notes/s</small>`;
    return parseFloat(rate);
  }

  // Handle key press in "Frappe Magique" (Mash-to-Play: ANY letter plays immediately & superimposes!)
  function handleMashModeKeyPress(code = null) {
    if (state.isTransitioning) return;
    const tapRate = registerUserKeyTap();
    const dynamicVel = Math.min(0.98, 0.78 + Math.min(tapRate, 10) * 0.02);
    playAndAdvanceStep(dynamicVel, code);
  }

  // Auto-Play Mode
  function toggleAutoPlay() {
    if (state.isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    if (!state.currentSong || !state.currentSong.steps.length) return;
    cancelNextSongTransition();
    state.isAutoPlaying = true;
    el.btnAutoplayToggle.textContent = 'Pause (F9)';
    el.btnAutoplayToggle.classList.add('playing');
    el.typingPromptBanner.textContent = 'Lecture automatique active';
    scheduleNextAutoPlayStep();
  }

  function stopAutoPlay() {
    state.isAutoPlaying = false;
    if (state.autoPlayTimer) {
      clearTimeout(state.autoPlayTimer);
      state.autoPlayTimer = null;
    }
    el.btnAutoplayToggle.textContent = 'Lecture (F9)';
    el.btnAutoplayToggle.classList.remove('playing');
    updatePromptBanner();
  }

  function scheduleNextAutoPlayStep() {
    if (!state.isAutoPlaying) return;
    const steps = state.currentSong.steps;
    const step = steps[state.currentStepIndex];
    if (!step) {
      stopAutoPlay();
      return;
    }

    const isLastStep = state.currentStepIndex === steps.length - 1;
    playAndAdvanceStep();

    if (isLastStep) {
      // If there are songs in the queue OR if loop is disabled, start the 4-second transition to the next song!
      if (state.queue.length > 0 || !state.autoPlayLoop) {
        startNextSongTransition(4);
        return;
      }
    }

    const rawDelay = step.nextDelay || 0.25;
    const delayMs = Math.max(35, (rawDelay / state.autoPlaySpeed) * 1000);
    state.autoPlayTimer = setTimeout(scheduleNextAutoPlayStep, delayMs);
  }

  // Free Play Mode (Unlimited simultaneous keys: 4, 6, 10 notes at once, held until release + smooth overlap!)
  function handleFreePlayKeyPress(keyStr, code = '') {
    registerUserKeyTap();
    let note = null;
    const kLower = (keyStr || '').toLowerCase();

    if (state.freeLayout === 'azerty') {
      if (keyStr && AZERTY_KEY_TO_NOTE[keyStr]) {
        note = AZERTY_KEY_TO_NOTE[keyStr];
      } else if (kLower && AZERTY_KEY_TO_NOTE[kLower]) {
        note = AZERTY_KEY_TO_NOTE[kLower];
      } else if (code && AZERTY_CODE_TO_NOTE[code]) {
        note = AZERTY_CODE_TO_NOTE[code];
      }
    } else {
      note = VP_CHAR_TO_NOTE[keyStr] || VP_CHAR_TO_NOTE[kLower];
    }

    if (note) {
      const speedFactor = getEffectiveSpeedFactor(null);
      const minOverlapSec = Math.max(0.22, 0.45 / speedFactor);
      if (code) {
        startOverlappingKeyVoice(code, [note], 0.92, minOverlapSec);
      } else {
        audio.playNote(note, Math.max(0.5, 0.75 / speedFactor), 0.92);
        flashPianoKeys([note], Math.max(180, 400 / speedFactor));
      }
      addPlayedNotesCount(1);

      const allHeld = [];
      heldActiveNotes.forEach((arr) => arr.forEach((n) => {
        if (!allHeld.includes(n)) allHeld.push(n);
      }));
      if (!allHeld.includes(note)) allHeld.push(note);

      el.currentChordDisplay.textContent = allHeld.join(' + ');

      // If user played a note from the current step, also advance the sheet guide!
      const step = state.currentSong?.steps[state.currentStepIndex];
      if (step && step.notes.includes(note)) {
        state.currentStepIndex = (state.currentStepIndex + 1) % state.currentSong.steps.length;
        updateStageUI(true);
      }
    }
  }

  function setPlayMode(newMode) {
    if (newMode !== 'autoplay') stopAutoPlay();
    state.mode = newMode;

    el.modeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    el.controlsMash.classList.toggle('hidden', newMode !== 'mash');
    el.controlsAutoplay.classList.toggle('hidden', newMode !== 'autoplay');
    el.controlsFree.classList.toggle('hidden', newMode !== 'free');

    updatePromptBanner();
    syncDiscordPresence();
  }

  function updatePromptBanner() {
    if (state.mode === 'mash') {
      el.typingPromptBanner.textContent = 'Mode Assisté actif';
    } else if (state.mode === 'autoplay') {
      el.typingPromptBanner.textContent = 'Mode Lecture Auto';
    } else {
      el.typingPromptBanner.textContent = 'Mode Clavier Libre';
    }
  }

  // ============================================================================
  // 5. Audio Devices & Virtual Mic Routing
  // ============================================================================
  async function refreshAudioDevices(autoSelectVirtualCable = false) {
    await audio.init();
    const { outputs, inputs } = await audio.getAudioDevices();

    // 1. Populate Monitor Output (Headphones / Speakers ONLY — exclude Virtual Mic cables)
    const savedMonitor = localStorage.getItem('keyflow_monitor_device') || 'default';
    const prevMonitor = el.selectMonitorOutput.value || savedMonitor;
    el.selectMonitorOutput.innerHTML = '<option value="default">Sortie par défaut (Casque / Haut-parleurs)</option>';
    outputs.forEach((d) => {
      if (d.deviceId === 'default' || d.deviceId === 'communications') return;
      if (audio.isVirtualCableDevice(d.label)) return;
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Haut-parleurs (${d.deviceId.slice(0, 6)})`;
      el.selectMonitorOutput.appendChild(opt);
    });
    if ([...el.selectMonitorOutput.options].some((o) => o.value === prevMonitor)) {
      el.selectMonitorOutput.value = prevMonitor;
      audio.setMonitorOutputDevice(prevMonitor);
    }

    // 2. Populate Virtual Microphone Selector (VB-Cable, Voicemeeter, Screaming Bee)
    const savedVirtual = localStorage.getItem('keyflow_virtual_mic_device') || '';
    const prevVirtual = el.selectVirtualMicOutput.value || savedVirtual;
    el.selectVirtualMicOutput.innerHTML = '<option value="">Aucun (Désactivé)</option>';
    let detectedCableId = '';

    const virtualBridgeOutputs = outputs.filter(
      (d) => d.deviceId !== 'default' && d.deviceId !== 'communications' && audio.isVirtualCableDevice(d.label)
    );

    const standardOutputs = outputs.filter(
      (d) => d.deviceId !== 'default' && d.deviceId !== 'communications' && !audio.isVirtualCableDevice(d.label)
    );

    if (virtualBridgeOutputs.length > 0) {
      const group = document.createElement('optgroup');
      group.label = 'Périphériques Micro Virtuel Détectés (Recommandé)';
      virtualBridgeOutputs.forEach((bridgeOut) => {
        if (!detectedCableId) detectedCableId = bridgeOut.deviceId;
        const opt = document.createElement('option');
        opt.value = bridgeOut.deviceId;
        opt.textContent = `${bridgeOut.label} (Vers micro Discord)`;
        group.appendChild(opt);
      });
      el.selectVirtualMicOutput.appendChild(group);
    }

    if (standardOutputs.length > 0) {
      const group = document.createElement('optgroup');
      group.label = 'Autres sorties audio';
      standardOutputs.forEach((out) => {
        const opt = document.createElement('option');
        opt.value = out.deviceId;
        opt.textContent = out.label || `Sortie (${out.deviceId.slice(0, 6)})`;
        group.appendChild(opt);
      });
      el.selectVirtualMicOutput.appendChild(group);
    }

    if (el.noVirtualMicBox) {
      el.noVirtualMicBox.classList.toggle('hidden', virtualBridgeOutputs.length > 0);
    }

    const availableIds = [...el.selectVirtualMicOutput.options].map((o) => o.value);
    if (prevVirtual && availableIds.includes(prevVirtual)) {
      el.selectVirtualMicOutput.value = prevVirtual;
      await handleVirtualMicChange(prevVirtual);
    } else if (detectedCableId) {
      el.selectVirtualMicOutput.value = detectedCableId;
      await handleVirtualMicChange(detectedCableId);
    } else {
      await handleVirtualMicChange('');
    }

    // 3. Populate Real Microphone Input
    const savedRealMic = localStorage.getItem('keyflow_real_mic_device') || 'default';
    el.selectRealMicInput.innerHTML = '<option value="default">Microphone par défaut</option>';
    inputs.forEach((d) => {
      if (d.deviceId === 'default' || d.deviceId === 'communications') return;
      if (audio.isVirtualCableDevice(d.label)) return;
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Microphone (${d.deviceId.slice(0, 6)})`;
      el.selectRealMicInput.appendChild(opt);
    });
    if ([...el.selectRealMicInput.options].some((o) => o.value === savedRealMic)) {
      el.selectRealMicInput.value = savedRealMic;
    }
  }

  async function handleVirtualMicChange(deviceId) {
    if (deviceId === 'need-vbcable') {
      el.selectVirtualMicOutput.value = '';
      if (el.noVirtualMicBox) {
        el.noVirtualMicBox.classList.remove('hidden');
      }
      if (window.electronAPI && window.electronAPI.installVbCable) {
        await triggerVbCableInstall();
      }
      return;
    }
    localStorage.setItem('keyflow_virtual_mic_device', deviceId || '');
    const active = await audio.setVirtualMicOutputDevice(deviceId);
    if (active && deviceId) {
      el.virtualMicBadge.textContent = 'Actif';
      el.virtualMicBadge.className = 'mic-status-badge on';
    } else {
      el.virtualMicBadge.textContent = 'Inactif';
      el.virtualMicBadge.className = 'mic-status-badge off';
    }
  }

  async function triggerVbCableInstall() {
    if (!window.electronAPI || !window.electronAPI.installVbCable) return;
    if (el.btnInstallVbCable) {
      el.btnInstallVbCable.textContent = 'Installation en cours...';
    }
    await window.electronAPI.installVbCable();
    // Poll every 2.5s to automatically detect and connect the new Virtual Microphone once installed!
    let checks = 0;
    const poll = setInterval(async () => {
      checks++;
      await refreshAudioDevices(true);
      if (el.selectVirtualMicOutput.value && el.selectVirtualMicOutput.value !== 'need-vbcable') {
        clearInterval(poll);
      }
      if (checks > 25) {
        clearInterval(poll);
        if (el.btnInstallVbCable) {
          el.btnInstallVbCable.textContent = 'Installer VB-Cable';
        }
      }
    }, 2500);
  }

  function startVuMeterLoop() {
    function updateMeters() {
      const { pianoLevel, micLevel } = audio.getLevelMetrics();
      el.vuPianoFill.style.width = `${pianoLevel}%`;
      el.vuMicFill.style.width = `${micLevel}%`;

      // Decay typing speed display if user stopped typing
      const now = performance.now();
      const recent = state.tapTimestamps.filter((t) => now - t <= 2200);
      if (recent.length !== state.tapTimestamps.length) {
        state.tapTimestamps = recent;
        const rate = (recent.length / 2.0).toFixed(1);
        el.statTypingSpeed.innerHTML = `${rate} <small>notes/s</small>`;
      }

      requestAnimationFrame(updateMeters);
    }
    requestAnimationFrame(updateMeters);
  }

  // ============================================================================
  // 6. Event Listeners & File Imports (MIDI & Text Sheets)
  // ============================================================================
  function bindEvents() {
    // Mode switcher
    el.modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => setPlayMode(btn.dataset.mode));
    });

    // Mash submode toggle
    el.submodeStepBtn.addEventListener('click', () => {
      state.mashSubmode = 'step';
      el.submodeStepBtn.classList.add('active');
      el.submodeFlowBtn.classList.remove('active');
    });
    el.submodeFlowBtn.addEventListener('click', () => {
      state.mashSubmode = 'flow';
      el.submodeFlowBtn.classList.add('active');
      el.submodeStepBtn.classList.remove('active');
    });

    // Auto-Play controls
    el.btnAutoplayToggle.addEventListener('click', toggleAutoPlay);
    el.autoplaySpeedSlider.addEventListener('input', (e) => {
      state.autoPlaySpeed = parseFloat(e.target.value);
      el.autoplaySpeedLabel.textContent = `${state.autoPlaySpeed.toFixed(2)}x`;
    });
    el.autoplayLoopCheck.addEventListener('change', (e) => {
      state.autoPlayLoop = e.target.checked;
    });

    // Free Play layout
    el.freeLayoutSelect.addEventListener('change', (e) => {
      state.freeLayout = e.target.value;
      renderPianoKeyboard();
      highlightNextStepKeys();
    });

    // Restart & Skip song (4s countdown)
    el.btnRestartSong.addEventListener('click', () => {
      cancelNextSongTransition();
      state.currentStepIndex = 0;
      updateStageUI();
    });

    if (el.btnSkipSong) {
      el.btnSkipSong.addEventListener('click', () => {
        if (state.isTransitioning) {
          skipUpcomingTransitionSong();
        } else {
          startNextSongTransition(4);
        }
      });
    }

    if (el.btnTransitionNow) {
      el.btnTransitionNow.addEventListener('click', () => {
        executeTransitionTargetNow();
      });
    }

    if (el.btnTransitionSkip) {
      el.btnTransitionSkip.addEventListener('click', () => {
        skipUpcomingTransitionSong();
      });
    }

    if (el.btnTransitionCancel) {
      el.btnTransitionCancel.addEventListener('click', () => {
        cancelNextSongTransition();
      });
    }

    // Progress slider scrub
    el.progressSlider.addEventListener('input', (e) => {
      if (!state.currentSong || !state.currentSong.steps.length) return;
      const pct = parseFloat(e.target.value) / 100;
      state.currentStepIndex = Math.min(
        state.currentSong.steps.length - 1,
        Math.floor(pct * state.currentSong.steps.length)
      );
      updateStageUI();
    });

    // Search songs & Filter Tabs (Tous / Favoris / File / Restaurer)
    const updateClearSearchBtn = () => {
      if (el.btnClearSearch) {
        el.btnClearSearch.classList.toggle('hidden', !el.songSearch.value.length);
      }
    };

    el.songSearch.addEventListener('input', (e) => {
      updateClearSearchBtn();
      renderSongList(e.target.value);
    });

    if (el.btnClearSearch) {
      el.btnClearSearch.addEventListener('click', () => {
        el.songSearch.value = '';
        updateClearSearchBtn();
        renderSongList('');
        el.songSearch.focus();
      });
    }

    const setLibraryFilterTab = (tab) => {
      state.libraryFilter = tab;
      if (el.filterAllBtn) el.filterAllBtn.classList.toggle('active', tab === 'all');
      if (el.filterFavBtn) el.filterFavBtn.classList.toggle('active', tab === 'fav');
      if (el.filterQueueBtn) el.filterQueueBtn.classList.toggle('active', tab === 'queue');
      renderSongList(el.songSearch.value);
    };

    if (el.filterAllBtn) {
      el.filterAllBtn.addEventListener('click', () => setLibraryFilterTab('all'));
    }

    if (el.filterFavBtn) {
      el.filterFavBtn.addEventListener('click', () => setLibraryFilterTab('fav'));
    }

    if (el.filterQueueBtn) {
      el.filterQueueBtn.addEventListener('click', () => setLibraryFilterTab('queue'));
    }

    if (el.btnQueueNext) {
      el.btnQueueNext.addEventListener('click', () => {
        if (state.isTransitioning) {
          skipUpcomingTransitionSong();
        } else {
          startNextSongTransition(4);
        }
      });
    }

    if (el.btnClearQueue) {
      el.btnClearQueue.addEventListener('click', () => {
        clearSongQueue();
      });
    }

    if (el.btnRestoreDeleted) {
      el.btnRestoreDeleted.addEventListener('click', () => {
        restoreDeletedSongs();
      });
    }

    // Keyboard input inside window (Unlimited simultaneous keys!)
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in an input or textarea
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ignore if Global Capture is active (to avoid double-firing with globalShortcut)
      if (state.globalCapture) return;

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'F8' || e.key === 'F9' || e.key === 'F10') return;

      const isSystemModifier = [
        'Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'Tab', 'Escape',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'NumLock', 'ScrollLock', 'Pause', 'Insert', 'Home', 'PageUp', 'PageDown', 'End',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ContextMenu'
      ].includes(e.key);
      if (isSystemModifier) return;

      // Block OS auto-repeat on a single held key, while keeping its sound active continuously until keyup!
      if (e.repeat || heldPhysicalKeys.has(e.code)) {
        if (state.mode === 'mash' && state.mashSubmode === 'flow') {
          e.preventDefault();
          handleMashModeKeyPress();
        }
        return;
      }

      heldPhysicalKeys.add(e.code);
      e.preventDefault();

      if (state.mode === 'mash') {
        handleMashModeKeyPress(e.code);
      } else if (state.mode === 'autoplay') {
        if (e.code === 'Space') toggleAutoPlay();
      } else if (state.mode === 'free') {
        handleFreePlayKeyPress(e.key, e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      heldPhysicalKeys.delete(e.code);
      releaseKeyVoice(e.code);
    });

    window.addEventListener('blur', () => {
      heldPhysicalKeys.clear();
      heldKeyBindings.clear();
      audio.stopAllSustainedNotes();
      heldActiveNotes.clear();
      refreshActivePianoKeyLights();
    });

    // Audio Studio Controls
    el.selectInstrument.addEventListener('change', (e) => {
      audio.instrument = e.target.value;
    });

    el.checkSustain.addEventListener('change', (e) => {
      audio.sustainEnabled = e.target.checked;
    });

    el.btnOctDown.addEventListener('click', () => {
      audio.octaveShift = Math.max(-2, audio.octaveShift - 1);
      el.octaveVal.textContent = audio.octaveShift > 0 ? `+${audio.octaveShift}` : audio.octaveShift;
    });

    el.btnOctUp.addEventListener('click', () => {
      audio.octaveShift = Math.min(2, audio.octaveShift + 1);
      el.octaveVal.textContent = audio.octaveShift > 0 ? `+${audio.octaveShift}` : audio.octaveShift;
    });

    el.sliderPianoVol.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      el.labelPianoVol.textContent = `${v}%`;
      audio.setPianoVolume(v / 100);
    });

    el.selectMonitorOutput.addEventListener('change', (e) => {
      localStorage.setItem('keyflow_monitor_device', e.target.value);
      audio.setMonitorOutputDevice(e.target.value);
    });

    el.selectVirtualMicOutput.addEventListener('change', (e) => {
      handleVirtualMicChange(e.target.value);
    });

    if (el.btnInstallVbCable) {
      el.btnInstallVbCable.addEventListener('click', triggerVbCableInstall);
    }

    el.btnRefreshDevices.addEventListener('click', () => refreshAudioDevices(true));

    el.checkEnableRealMic.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      el.realMicSettings.classList.toggle('hidden', !enabled);
      await audio.toggleRealMicrophone(enabled, el.selectRealMicInput.value);
    });

    el.selectRealMicInput.addEventListener('change', async (e) => {
      localStorage.setItem('keyflow_real_mic_device', e.target.value);
      if (el.checkEnableRealMic.checked) {
        await audio.toggleRealMicrophone(true, e.target.value);
      }
    });

    el.sliderMicVol.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      el.labelMicVol.textContent = `${v}%`;
      audio.setMicVolume(v / 100);
    });

    el.checkMonitorVoice.addEventListener('change', (e) => {
      audio.setMonitorVoice(e.target.checked);
    });

    // Global Capture & Pin Window via Electron IPC
    el.btnGlobalCapture.addEventListener('click', async () => {
      if (window.electronAPI) {
        await window.electronAPI.toggleGlobalCapture();
      }
    });

    el.btnPinWindow.addEventListener('click', async () => {
      if (window.electronAPI) {
        state.alwaysOnTop = await window.electronAPI.setAlwaysOnTop(!state.alwaysOnTop);
        el.btnPinWindow.classList.toggle('active', state.alwaysOnTop);
      }
    });

    // External Links
    document.querySelectorAll('.chip-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url && window.electronAPI) {
          window.electronAPI.openExternal(url);
        }
      });
    });

    if (el.btnOpenMidiFolder) {
      el.btnOpenMidiFolder.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openMidiFolder) {
          window.electronAPI.openMidiFolder();
        }
      });
    }

    // Import MIDI / TXT via File Dialog
    el.btnImportFile.addEventListener('click', async () => {
      if (!window.electronAPI) return;
      const res = await window.electronAPI.openSongFile();
      if (!res) return;

      if (res.kind === 'midi' && res.song && res.song.steps.length > 0) {
        addAndSelectImportedSong(res.song);
      } else if (res.kind === 'text' && res.content) {
        const steps = parseSheetToSteps(res.content, 120);
        if (steps.length > 0) {
          const newSong = {
            id: 'custom-txt-' + Date.now(),
            title: res.fileName || 'Partition Importée',
            artist: 'Fichier .txt',
            bpm: 120,
            difficulty: 'Import',
            category: 'Import .txt',
            type: 'sheet',
            steps
          };
          addAndSelectImportedSong(newSong);
        }
      }
    });

    // Drag & Drop MIDI / TXT anywhere on window (ignore internal queue drag-and-drop)
    window.addEventListener('dragover', (e) => {
      if (draggedQueueIndex !== null) return;
      const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
      if (!types.includes('Files')) return;
      e.preventDefault();
      el.dropOverlay.classList.remove('hidden');
    });

    el.dropOverlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      el.dropOverlay.classList.add('hidden');
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      el.dropOverlay.classList.add('hidden');
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      if ((ext === 'mid' || ext === 'midi') && window.electronAPI) {
        const arrayBuffer = await file.arrayBuffer();
        const song = await window.electronAPI.parseMidiBuffer(arrayBuffer, file.name);
        if (song && song.steps && song.steps.length > 0) {
          addAndSelectImportedSong(song);
        }
      } else {
        const text = await file.text();
        const steps = parseSheetToSteps(text, 120);
        if (steps.length > 0) {
          addAndSelectImportedSong({
            id: 'drop-' + Date.now(),
            title: file.name.replace(/\.[^.]+$/, ''),
            artist: 'Glisser-Déposer',
            bpm: 120,
            category: 'Partition',
            type: 'sheet',
            steps
          });
        }
      }
    });

    // Custom Sheet Modal
    el.btnOpenSheetModal.addEventListener('click', () => {
      el.modalSheet.classList.remove('hidden');
      el.customSheetText.focus();
    });
    el.btnCloseSheetModal.addEventListener('click', () => el.modalSheet.classList.add('hidden'));
    el.btnCancelSheet.addEventListener('click', () => el.modalSheet.classList.add('hidden'));

    el.btnSaveSheet.addEventListener('click', () => {
      const title = el.customSheetTitle.value.trim() || 'Ma Partition Personnalisée';
      const bpm = parseInt(el.customSheetBpm.value, 10) || 120;
      const rawText = el.customSheetText.value.trim();
      const steps = parseSheetToSteps(rawText, bpm);

      if (steps.length === 0) {
        alert('Aucune note reconnue dans le texte. Utilise des lettres Virtual Piano (ex: [tu] o p) ou des notes (Do Ré Mi / C4 D4 E4).');
        return;
      }

      const newSong = {
        id: 'custom-' + Date.now(),
        title,
        artist: 'Partition Personnalisée',
        bpm,
        difficulty: 'Perso',
        category: 'Personnalisé',
        type: 'sheet',
        sheet: rawText,
        steps
      };

      addAndSelectImportedSong(newSong);
      el.modalSheet.classList.add('hidden');
      el.customSheetTitle.value = '';
      el.customSheetText.value = '';
    });

    // Mic Guide Modal
    el.btnHelpMic.addEventListener('click', () => el.modalMicGuide.classList.remove('hidden'));
    el.btnCloseMicGuide.addEventListener('click', () => el.modalMicGuide.classList.add('hidden'));
    el.btnOkMicGuide.addEventListener('click', () => el.modalMicGuide.classList.add('hidden'));

    // Secret Red Button: Split Menu & Piano into 2 separate windows for Streaming
    if (el.btnSecretSplit) {
      el.btnSecretSplit.addEventListener('click', async () => {
        if (window.electronAPI && window.electronAPI.toggleStreamSplit) {
          await window.electronAPI.toggleStreamSplit();
        }
      });
    }

    // Electron IPC Listeners for Global Background Capture (F8, F9, F10) & Stream Split Window
    if (window.electronAPI) {
      window.electronAPI.onGlobalKeypress((key) => {
        if (state.mode === 'mash') {
          handleMashModeKeyPress();
        } else if (state.mode === 'free') {
          handleFreePlayKeyPress(key);
        }
      });

      window.electronAPI.onGlobalCaptureState((isActive) => {
        state.globalCapture = isActive;
        el.btnGlobalCapture.classList.toggle('active', isActive);
        el.captureDot.classList.toggle('on', isActive);
      });

      window.electronAPI.onGlobalCommand((cmd) => {
        if (cmd === 'toggle-autoplay') {
          if (state.mode !== 'autoplay') setPlayMode('autoplay');
          toggleAutoPlay();
        } else if (cmd === 'restart-song') {
          state.currentStepIndex = 0;
          updateStageUI();
        }
      });

      if (window.electronAPI.onStreamSplitState) {
        window.electronAPI.onStreamSplitState((isSplit) => {
          if (el.btnSecretSplit) el.btnSecretSplit.classList.toggle('active', isSplit);
          if (el.pianoDockFooter) el.pianoDockFooter.classList.toggle('hidden', isSplit);
          if (isSplit) {
            setTimeout(broadcastStreamActiveNotes, 150);
          }
        });
      }

      if (window.electronAPI.onStreamForwardedInput) {
        window.electronAPI.onStreamForwardedInput((payload) => {
          if (!payload) return;
          if (payload.type === 'keydown') {
            if (payload.key === 'F8' || payload.key === 'F9' || payload.key === 'F10') return;
            const isPlayable = /^[a-zA-Z0-9 ,;:!^$]$/.test(payload.key) || payload.code === 'Space';
            if (!isPlayable) return;
            if (payload.repeat || heldPhysicalKeys.has(payload.code)) {
              if (state.mode === 'mash' && state.mashSubmode === 'flow') {
                handleMashModeKeyPress();
              }
              return;
            }
            heldPhysicalKeys.add(payload.code);
            if (state.mode === 'mash') {
              handleMashModeKeyPress(payload.code);
            } else if (state.mode === 'autoplay') {
              if (payload.code === 'Space') toggleAutoPlay();
            } else if (state.mode === 'free') {
              handleFreePlayKeyPress(payload.key, payload.code);
            }
          } else if (payload.type === 'keyup') {
            heldPhysicalKeys.delete(payload.code);
            releaseKeyVoice(payload.code);
          } else if (payload.type === 'blur') {
            heldPhysicalKeys.clear();
            heldKeyBindings.clear();
            audio.stopAllSustainedNotes();
            heldActiveNotes.clear();
            refreshActivePianoKeyLights();
          } else if (payload.type === 'mousedown' && payload.note) {
            const mId = `stream-mouse-${payload.note}`;
            audio.startSustainedNotes(mId, [payload.note], 0.92);
            heldActiveNotes.set(mId, [payload.note]);
            refreshActivePianoKeyLights();
            addPlayedNotesCount(1);
          } else if (payload.type === 'mouseup' && payload.note) {
            const mId = `stream-mouse-${payload.note}`;
            audio.stopSustainedNotes(mId);
            if (heldActiveNotes.has(mId)) {
              heldActiveNotes.delete(mId);
              refreshActivePianoKeyLights();
            }
          }
        });
      }
    }
  }

  function addAndSelectImportedSong(song) {
    state.songs.unshift(song);
    saveCustomSongToStorage(song);
    selectSong(song);
  }

  // Start the app
  init();
})();
