/* ============================================================
   NAMJOONING: AN INDIGO ARCHIVE — script.js
   Full CRUD, Autosave, localStorage persistence
   ============================================================ */

'use strict';

/* ============================================================
   DATA LAYER — localStorage key & structure
   ============================================================ */
const STORAGE_KEY = 'namjooning_archive';

/** Load archive from localStorage, merge defaults */
function loadArchive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    return {
      hiking:  Array.isArray(stored.hiking)  ? stored.hiking  : [],
      art:     Array.isArray(stored.art)     ? stored.art     : [],
      reading: Array.isArray(stored.reading) ? stored.reading : [],
    };
  } catch (e) {
    console.warn('Namjooning: Could not parse archive, resetting.', e);
    return { hiking: [], art: [], reading: [] };
  }
}

/** Persist the whole archive to localStorage */
function saveArchive(archive) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
}

/** Mutable in-memory archive; written back on every change */
let archive = loadArchive();

/** Simple UID generator */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ============================================================
   QUOTES
   ============================================================ */
const QUOTES = [
  { text: "The world is mud-luscious and puddle-wonderful.", author: "e.e. cummings" },
  { text: "I took a walk in the woods and came out taller than the trees.", author: "Henry David Thoreau" },
  { text: "One must always be careful of books, and what is inside them, for words have the power to change us.", author: "Cassandra Clare" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { text: "Look deep into nature, and then you will understand everything better.", author: "Albert Einstein" },
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "The clearest way into the universe is through a forest wilderness.", author: "John Muir" },
  { text: "Beauty is truth, truth beauty—that is all ye know on earth, and all ye need to know.", author: "John Keats" },
  { text: "We do not inherit the earth from our ancestors; we borrow it from our children.", author: "Antoine de Saint-Exupéry" },
  { text: "Let the beauty of what you love be what you do.", author: "Rumi" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "To plant a garden is to believe in tomorrow.", author: "Audrey Hepburn" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius" },
  { text: "색깔이 없어도 향기가 나는 꽃처럼—Like a flower that blooms without color, yet still carries its fragrance.", author: "Kim Namjoon" },
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "What is essential is invisible to the eye.", author: "Antoine de Saint-Exupéry" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "We are all just walking each other home.", author: "Ram Dass" },
  { text: "Nature always wears the colors of the spirit.", author: "Ralph Waldo Emerson" },
];

let currentQuoteIndex = Math.floor(Math.random() * QUOTES.length);

function renderQuote(index) {
  const q = QUOTES[index];
  const el = document.getElementById('dailyQuote');
  const au = document.getElementById('quoteAuthor');
  if (el) el.textContent = q.text;
  if (au) au.textContent = `— ${q.author}`;
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNav() {
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;
      // Update buttons
      btns.forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
      // Update sections
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const section = document.getElementById(target);
      if (section) {
        section.classList.add('active');
        // Re-trigger fade
        section.classList.remove('fade-in');
        void section.offsetWidth;
        section.classList.add('fade-in');
      }
      // Close mobile sidebar
      closeSidebar();
    });
  });
}

/* Mobile sidebar */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('sidebarOverlay');
  const sidebar   = document.getElementById('sidebar');

  hamburger?.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  overlay?.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
  const h = document.getElementById('hamburger');
  h?.classList.remove('open');
  h?.setAttribute('aria-expanded', 'false');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  // Stats
  document.getElementById('statHikes').textContent = archive.hiking.length;
  document.getElementById('statArt').textContent   = archive.art.length;
  document.getElementById('statBooks').textContent = archive.reading.length;

  // Recent (last 6 across all categories, newest first)
  const allEntries = [
    ...archive.hiking.map(e => ({ type: 'Trail', label: e.trail, ts: e.createdAt })),
    ...archive.art.map(e    => ({ type: 'Art',   label: e.title,  ts: e.createdAt })),
    ...archive.reading.map(e => ({ type: 'Book',  label: e.title,  ts: e.createdAt })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 6);

  const container = document.getElementById('recentList');
  if (!container) return;

  if (allEntries.length === 0) {
    container.innerHTML = '<p class="empty-state">Your archive is empty. Begin by logging a wandering.</p>';
    return;
  }

  container.innerHTML = allEntries.map(e => `
    <div class="recent-item">
      <span class="recent-type-badge">${e.type}</span>
      <span class="recent-text">${escHtml(e.label)}</span>
      <span class="recent-date">${formatDate(e.ts)}</span>
    </div>
  `).join('');
}

/* ============================================================
   HIKING / TRAIL ARCHIVE
   ============================================================ */
function initHiking() {
  // Set default date to today
  const dateField = document.getElementById('hikeDate');
  if (dateField && !dateField.value) dateField.value = todayISO();

  document.getElementById('saveHikeBtn')?.addEventListener('click', saveHike);
  document.getElementById('cancelHikeEditBtn')?.addEventListener('click', resetHikeForm);

  renderHikes();
}

function saveHike() {
  const trail      = document.getElementById('hikeTrail').value.trim();
  const date       = document.getElementById('hikeDate').value;
  const peak       = document.getElementById('hikePeak').value.trim();
  const reflection = document.getElementById('hikeReflection').value.trim();
  const editId     = document.getElementById('hikeEditId').value;

  if (!trail) { flashField('hikeTrail'); return; }

  if (editId) {
    // Update existing
    const idx = archive.hiking.findIndex(h => h.id === editId);
    if (idx !== -1) {
      archive.hiking[idx] = { ...archive.hiking[idx], trail, date, peak, reflection, updatedAt: Date.now() };
    }
  } else {
    // Create new
    archive.hiking.unshift({ id: uid(), trail, date, peak, reflection, createdAt: Date.now(), updatedAt: Date.now() });
  }

  saveArchive(archive);
  resetHikeForm();
  renderHikes();
  renderDashboard();
}

function resetHikeForm() {
  ['hikeTrail','hikePeak','hikeReflection'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('hikeDate').value = todayISO();
  document.getElementById('hikeEditId').value = '';
  document.getElementById('saveHikeBtn').textContent = 'Archive Entry';
  document.getElementById('cancelHikeEditBtn').style.display = 'none';
}

function editHike(id) {
  const hike = archive.hiking.find(h => h.id === id);
  if (!hike) return;

  document.getElementById('hikeTrail').value      = hike.trail      || '';
  document.getElementById('hikeDate').value       = hike.date       || todayISO();
  document.getElementById('hikePeak').value       = hike.peak       || '';
  document.getElementById('hikeReflection').value = hike.reflection || '';
  document.getElementById('hikeEditId').value     = hike.id;
  document.getElementById('saveHikeBtn').textContent = 'Update Entry';
  document.getElementById('cancelHikeEditBtn').style.display = 'inline-flex';

  // Scroll to form
  document.getElementById('hikeFormCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteHike(id) {
  openModal(() => {
    archive.hiking = archive.hiking.filter(h => h.id !== id);
    saveArchive(archive);
    renderHikes();
    renderDashboard();
  });
}

function renderHikes() {
  const container = document.getElementById('hikeList');
  if (!container) return;

  if (archive.hiking.length === 0) {
    container.innerHTML = '<p class="empty-state">No trails logged yet. Begin your archive.</p>';
    return;
  }

  container.innerHTML = archive.hiking.map(h => `
    <article class="entry-card" data-id="${h.id}">
      <div class="entry-card-header">
        <h3 class="entry-card-title">${escHtml(h.trail)}</h3>
        <div class="entry-card-actions">
          <button class="icon-btn edit-btn" onclick="editHike('${h.id}')" title="Edit" aria-label="Edit ${escHtml(h.trail)}">✎</button>
          <button class="icon-btn delete-btn" onclick="deleteHike('${h.id}')" title="Delete" aria-label="Delete ${escHtml(h.trail)}">⌫</button>
        </div>
      </div>
      <div class="entry-card-meta">
        ${h.date ? `<span class="entry-meta-tag">${formatDisplayDate(h.date)}</span>` : ''}
        ${h.peak ? `<span class="entry-meta-tag">↑ ${escHtml(h.peak)}</span>` : ''}
      </div>
      ${h.reflection ? `<p class="entry-card-reflection">${escHtml(h.reflection)}</p>` : ''}
      <p class="entry-card-date">Logged ${formatDate(h.createdAt)}</p>
    </article>
  `).join('');
}

/* ============================================================
   ART GALLERY
   ============================================================ */
function initArt() {
  const dateField = document.getElementById('artDate');
  if (dateField && !dateField.value) dateField.value = todayISO();

  document.getElementById('saveArtBtn')?.addEventListener('click', saveArt);
  document.getElementById('cancelArtEditBtn')?.addEventListener('click', resetArtForm);

  renderArt();
}

function saveArt() {
  const title      = document.getElementById('artTitle').value.trim();
  const artist     = document.getElementById('artArtist').value.trim();
  const venue      = document.getElementById('artVenue').value.trim();
  const date       = document.getElementById('artDate').value;
  const impression = document.getElementById('artImpression').value.trim();
  const editId     = document.getElementById('artEditId').value;

  if (!title) { flashField('artTitle'); return; }

  if (editId) {
    const idx = archive.art.findIndex(a => a.id === editId);
    if (idx !== -1) {
      archive.art[idx] = { ...archive.art[idx], title, artist, venue, date, impression, updatedAt: Date.now() };
    }
  } else {
    archive.art.unshift({ id: uid(), title, artist, venue, date, impression, createdAt: Date.now(), updatedAt: Date.now() });
  }

  saveArchive(archive);
  resetArtForm();
  renderArt();
  renderDashboard();
}

function resetArtForm() {
  ['artTitle','artArtist','artVenue','artImpression'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('artDate').value = todayISO();
  document.getElementById('artEditId').value = '';
  document.getElementById('saveArtBtn').textContent = 'Archive Entry';
  document.getElementById('cancelArtEditBtn').style.display = 'none';
}

function editArt(id) {
  const art = archive.art.find(a => a.id === id);
  if (!art) return;

  document.getElementById('artTitle').value      = art.title      || '';
  document.getElementById('artArtist').value     = art.artist     || '';
  document.getElementById('artVenue').value      = art.venue      || '';
  document.getElementById('artDate').value       = art.date       || todayISO();
  document.getElementById('artImpression').value = art.impression || '';
  document.getElementById('artEditId').value     = art.id;
  document.getElementById('saveArtBtn').textContent = 'Update Entry';
  document.getElementById('cancelArtEditBtn').style.display = 'inline-flex';

  document.getElementById('artFormCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteArt(id) {
  openModal(() => {
    archive.art = archive.art.filter(a => a.id !== id);
    saveArchive(archive);
    renderArt();
    renderDashboard();
  });
}

function renderArt() {
  const container = document.getElementById('artList');
  if (!container) return;

  if (archive.art.length === 0) {
    container.innerHTML = '<p class="empty-state">No artworks logged yet. Begin your collection.</p>';
    return;
  }

  container.innerHTML = archive.art.map(a => `
    <article class="entry-card" data-id="${a.id}">
      <div class="entry-card-header">
        <h3 class="entry-card-title">${escHtml(a.title)}</h3>
        <div class="entry-card-actions">
          <button class="icon-btn edit-btn" onclick="editArt('${a.id}')" title="Edit" aria-label="Edit ${escHtml(a.title)}">✎</button>
          <button class="icon-btn delete-btn" onclick="deleteArt('${a.id}')" title="Delete" aria-label="Delete ${escHtml(a.title)}">⌫</button>
        </div>
      </div>
      <div class="entry-card-meta">
        ${a.artist ? `<span class="entry-meta-tag">${escHtml(a.artist)}</span>` : ''}
        ${a.venue  ? `<span class="entry-meta-tag">${escHtml(a.venue)}</span>`  : ''}
        ${a.date   ? `<span class="entry-meta-tag">${formatDisplayDate(a.date)}</span>` : ''}
      </div>
      ${a.impression ? `<p class="entry-card-reflection">${escHtml(a.impression)}</p>` : ''}
      <p class="entry-card-date">Logged ${formatDate(a.createdAt)}</p>
    </article>
  `).join('');
}

/* ============================================================
   READING TRACKER
   ============================================================ */
function initReading() {
  document.getElementById('saveBookBtn')?.addEventListener('click', saveBook);
  document.getElementById('cancelBookEditBtn')?.addEventListener('click', resetBookForm);

  renderBooks();
}

function saveBook() {
  const title       = document.getElementById('bookTitle').value.trim();
  const author      = document.getElementById('bookAuthor').value.trim();
  const currentPage = parseInt(document.getElementById('bookCurrentPage').value) || 0;
  const totalPages  = parseInt(document.getElementById('bookTotalPages').value)  || 0;
  const keyQuote    = document.getElementById('bookQuote').value.trim();
  const editId      = document.getElementById('bookEditId').value;

  if (!title) { flashField('bookTitle'); return; }

  if (editId) {
    const idx = archive.reading.findIndex(b => b.id === editId);
    if (idx !== -1) {
      archive.reading[idx] = { ...archive.reading[idx], title, author, currentPage, totalPages, keyQuote, updatedAt: Date.now() };
    }
  } else {
    archive.reading.unshift({ id: uid(), title, author, currentPage, totalPages, keyQuote, createdAt: Date.now(), updatedAt: Date.now() });
  }

  saveArchive(archive);
  resetBookForm();
  renderBooks();
  renderDashboard();
}

function resetBookForm() {
  ['bookTitle','bookAuthor','bookCurrentPage','bookTotalPages','bookQuote'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('bookEditId').value = '';
  document.getElementById('saveBookBtn').textContent = 'Archive Entry';
  document.getElementById('cancelBookEditBtn').style.display = 'none';
}

function editBook(id) {
  const book = archive.reading.find(b => b.id === id);
  if (!book) return;

  document.getElementById('bookTitle').value       = book.title       || '';
  document.getElementById('bookAuthor').value      = book.author      || '';
  document.getElementById('bookCurrentPage').value = book.currentPage || '';
  document.getElementById('bookTotalPages').value  = book.totalPages  || '';
  document.getElementById('bookQuote').value       = book.keyQuote    || '';
  document.getElementById('bookEditId').value      = book.id;
  document.getElementById('saveBookBtn').textContent = 'Update Entry';
  document.getElementById('cancelBookEditBtn').style.display = 'inline-flex';

  document.getElementById('bookFormCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteBook(id) {
  openModal(() => {
    archive.reading = archive.reading.filter(b => b.id !== id);
    saveArchive(archive);
    renderBooks();
    renderDashboard();
  });
}

/** Inline page-number update without full re-render */
function updateBookPage(id, value) {
  const book = archive.reading.find(b => b.id === id);
  if (!book) return;

  const newPage = Math.max(0, parseInt(value) || 0);
  book.currentPage = newPage;
  book.updatedAt = Date.now();
  saveArchive(archive);

  // Update progress bar and percentage in place
  const card = document.querySelector(`.entry-card[data-id="${id}"]`);
  if (!card) return;
  const pct = book.totalPages > 0 ? Math.min(100, Math.round((newPage / book.totalPages) * 100)) : 0;
  const fill = card.querySelector('.progress-bar-fill');
  const pctLabel = card.querySelector('.progress-pct');
  const pagesLabel = card.querySelector('.progress-pages');
  if (fill) fill.style.width = `${pct}%`;
  if (pctLabel) pctLabel.textContent = `${pct}%`;
  if (pagesLabel) pagesLabel.textContent = `p. ${newPage} / ${book.totalPages || '?'}`;
}

function renderBooks() {
  const container = document.getElementById('bookList');
  if (!container) return;

  if (archive.reading.length === 0) {
    container.innerHTML = '<p class="empty-state">No books logged yet. Begin your reading archive.</p>';
    return;
  }

  container.innerHTML = archive.reading.map(b => {
    const pct = (b.totalPages > 0)
      ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100))
      : 0;

    return `
      <article class="entry-card" data-id="${b.id}">
        <div class="entry-card-header">
          <h3 class="entry-card-title">${escHtml(b.title)}</h3>
          <div class="entry-card-actions">
            <button class="icon-btn edit-btn" onclick="editBook('${b.id}')" title="Edit" aria-label="Edit ${escHtml(b.title)}">✎</button>
            <button class="icon-btn delete-btn" onclick="deleteBook('${b.id}')" title="Delete" aria-label="Delete ${escHtml(b.title)}">⌫</button>
          </div>
        </div>
        ${b.author ? `<div class="entry-card-meta"><span class="entry-meta-tag">${escHtml(b.author)}</span></div>` : ''}

        <div class="progress-wrap">
          <div class="progress-label">
            <span class="progress-pct">${pct}%</span>
            <span class="progress-pages">p. ${b.currentPage} / ${b.totalPages || '?'}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>

        <!-- Inline page input -->
        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
          <label style="font-family:var(--font-sans);font-size:0.58rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent-denim);">Page</label>
          <input
            type="number"
            class="field-input"
            style="width:70px; font-size:0.85rem;"
            value="${b.currentPage}"
            min="0"
            max="${b.totalPages || 9999}"
            oninput="updateBookPage('${b.id}', this.value)"
            aria-label="Current page for ${escHtml(b.title)}"
          />
          ${b.totalPages ? `<span style="font-size:0.7rem;color:var(--cream-muted);">of ${b.totalPages}</span>` : ''}
        </div>

        ${b.keyQuote ? `<p class="book-key-quote">${escHtml(b.keyQuote)}</p>` : ''}
        <p class="entry-card-date">Added ${formatDate(b.createdAt)}</p>
      </article>
    `;
  }).join('');
}

/* ============================================================
   AMBIENT PLAYER
   ============================================================ */
/* Web Audio API — generate procedural ambient sounds */
let audioCtx = null;
let currentSource = null;
let gainNode = null;
let isPlaying = false;
let selectedSound = 'rain';

const SOUND_NAMES = {
  rain:   'Rain on Hanji Paper',
  forest: 'Forest at Dusk',
  waves:  'Ocean Waves, Low Tide',
  wind:   'Mountain Wind',
};

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = parseFloat(document.getElementById('volumeSlider')?.value || 0.5);
    gainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

/** Create noise buffer for ambient sounds */
function makeNoiseBuffer(ctx, duration = 2) {
  const sampleRate = ctx.sampleRate;
  const frames = sampleRate * duration;
  const buffer = ctx.createBuffer(2, frames, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1);
  }
  return buffer;
}

function createAmbientSource(sound) {
  const ctx = getAudioCtx();
  const noiseBuffer = makeNoiseBuffer(ctx, 3);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  // Filter shaping per sound type
  const filter = ctx.createBiquadFilter();
  const filter2 = ctx.createBiquadFilter();

  switch (sound) {
    case 'rain':
      filter.type = 'bandpass';
      filter.frequency.value = 2800;
      filter.Q.value = 0.4;
      filter2.type = 'highshelf';
      filter2.frequency.value = 6000;
      filter2.gain.value = -8;
      break;
    case 'forest':
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.7;
      filter2.type = 'peaking';
      filter2.frequency.value = 400;
      filter2.gain.value = 4;
      break;
    case 'waves':
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1.2;
      filter2.type = 'lowshelf';
      filter2.frequency.value = 200;
      filter2.gain.value = 6;
      break;
    case 'wind':
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.3;
      filter2.type = 'highshelf';
      filter2.frequency.value = 3000;
      filter2.gain.value = -12;
      break;
  }

  source.connect(filter);
  filter.connect(filter2);
  filter2.connect(gainNode);
  return source;
}

function startAmbient() {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  if (currentSource) { try { currentSource.stop(); } catch(e){} }
  currentSource = createAmbientSource(selectedSound);
  currentSource.start(0);
  isPlaying = true;
  updatePlayerUI(true);
}

function stopAmbient() {
  if (currentSource) {
    try { currentSource.stop(); } catch(e){}
    currentSource = null;
  }
  isPlaying = false;
  updatePlayerUI(false);
}

function updatePlayerUI(playing) {
  const playBtn   = document.getElementById('playBtn');
  const playLabel = document.getElementById('playLabel');
  const icon      = document.getElementById('playerIcon');
  const ripples   = document.querySelectorAll('.player-ripple');
  const trackName = document.getElementById('playerTrack');

  if (playBtn)   playBtn.setAttribute('aria-pressed', playing);
  if (playLabel) playLabel.textContent = playing ? '⏸ Pause' : '▶ Play';
  if (icon)      icon.textContent = playing ? '♪' : '♩';
  if (trackName) trackName.textContent = SOUND_NAMES[selectedSound] || 'Ambient';

  ripples.forEach(r => r.classList.toggle('playing', playing));
}

function initPlayer() {
  document.getElementById('playBtn')?.addEventListener('click', () => {
    isPlaying ? stopAmbient() : startAmbient();
  });

  document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
    if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
  });

  // Sound selector buttons
  document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSound = btn.dataset.sound;
      if (isPlaying) startAmbient(); // Restart with new sound
      else updatePlayerUI(false);
    });
  });

  // Embed section
  const embedTabs = document.querySelectorAll('.embed-tab');
  embedTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      embedTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('embedUrl').placeholder =
        tab.dataset.embed === 'spotify'
          ? 'Paste a Spotify playlist URL…'
          : 'Paste a YouTube URL…';
    });
  });

  document.getElementById('loadEmbedBtn')?.addEventListener('click', loadEmbed);
}

function loadEmbed() {
  const url   = document.getElementById('embedUrl').value.trim();
  const frame = document.getElementById('embedFrame');
  const wrap  = document.getElementById('embedFrameWrap');
  const activeTab = document.querySelector('.embed-tab.active')?.dataset.embed;

  if (!url) return;

  let embedSrc = url;

  // Transform Spotify share URLs to embed
  if (activeTab === 'spotify' && url.includes('spotify.com')) {
    embedSrc = url.replace('spotify.com/', 'spotify.com/embed/').replace('/playlist/', '/playlist/');
    if (!embedSrc.includes('/embed/')) {
      embedSrc = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
  }

  // Transform YouTube watch URLs to embed
  if (activeTab === 'youtube') {
    const ytMatch = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
    if (ytMatch) embedSrc = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0`;
  }

  if (frame) frame.src = embedSrc;
  if (wrap)  wrap.style.display = 'block';
}

/* ============================================================
   DELETE MODAL
   ============================================================ */
let pendingDeleteCallback = null;

function openModal(callback) {
  pendingDeleteCallback = callback;
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeModal() {
  pendingDeleteCallback = null;
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'none';
}

function initModal() {
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
    if (typeof pendingDeleteCallback === 'function') pendingDeleteCallback();
    closeModal();
  });
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, day] = isoDate.split('-');
  const d = new Date(+y, +m - 1, +day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function flashField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderBottomColor = 'var(--danger)';
  el.focus();
  setTimeout(() => { el.style.borderBottomColor = ''; }, 1600);
}

function setArchiveDate() {
  const el = document.getElementById('archiveDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ============================================================
   PWA SERVICE WORKER REGISTRATION
   ============================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Silently fail — SW is optional for the demo
    });
  }
}

/* ============================================================
   EXPOSE CRUD FUNCTIONS TO GLOBAL SCOPE (for inline onclick)
   ============================================================ */
window.editHike    = editHike;
window.deleteHike  = deleteHike;
window.editArt     = editArt;
window.deleteArt   = deleteArt;
window.editBook    = editBook;
window.deleteBook  = deleteBook;
window.updateBookPage = updateBookPage;

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setArchiveDate();
  initNav();
  initMobileNav();
  initModal();

  // Render quote
  renderQuote(currentQuoteIndex);
  document.getElementById('newQuoteBtn')?.addEventListener('click', () => {
    currentQuoteIndex = (currentQuoteIndex + 1) % QUOTES.length;
    const quoteEl = document.getElementById('dailyQuote');
    const authorEl = document.getElementById('quoteAuthor');
    if (quoteEl && authorEl) {
      quoteEl.style.opacity = '0';
      authorEl.style.opacity = '0';
      setTimeout(() => {
        renderQuote(currentQuoteIndex);
        quoteEl.style.transition = 'opacity 0.6s ease';
        authorEl.style.transition = 'opacity 0.6s ease';
        quoteEl.style.opacity = '1';
        authorEl.style.opacity = '1';
      }, 300);
    }
  });

  renderDashboard();
  initHiking();
  initArt();
  initReading();
  initPlayer();

  registerSW();
});
