(() => {
'use strict';
// ───────── 상수 ─────────
const LOW = 12, HIGH = 108, ROWS = HIGH - LOW + 1;  // C0 ~ C8 (8옥타브)
// ── 페이지 구분: edit.html(편집) / mypage.html(마이페이지). 엔진 안 창(?engine)에서는 예전처럼 한 페이지 안에서 전환
const PAGE = document.body.dataset.page === 'mypage' ? 'mypage' : 'edit';
const SPLIT = !(new URLSearchParams(location.search).has('engine') && window.parent !== window);
const ON_MYPAGE = PAGE === 'mypage' && SPLIT;
const PG_EDIT = './edit.html', PG_MY = './mypage.html';
const goPage = (url, q) => { location.href = url + (q || ''); };
// 키보드가 올라오며 생기는 '높이만 바뀐 resize'는 메뉴를 닫거나 다시 그리지 않게 표시 (전체화면에서는 키보드 때문에 창 크기가 실제로 바뀜)
let __lastW = window.innerWidth;
window.__kbResize = false;
window.addEventListener('resize', () => {
  const a = document.activeElement, w = window.innerWidth;
  const typingNow = !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(range|checkbox|radio|color|button|file|submit)$/.test(a.type)));
  window.__kbResize = typingNow && w === __lastW; __lastW = w;
}, true);
let ROW_H = 18, STEP_W = 22;                        // 확대/축소로 바뀜 (1 step = 16분음표)
const SOL = ['도','도#','레','레#','미','파','파#','솔','솔#','라','라#','시'];
const ABC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MAJOR = [0,2,4,5,7,9,11];
const BLACK = new Set([1,3,6,8,10]);
const STORE = 'humming-composer-v2';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// ───────── 아이콘 ─────────
const ICON = {
  score: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M8.5 10.5h8M8.5 13h8M8.5 15.5h8"/><circle cx="11" cy="18" r="1.3" fill="currentColor"/><path d="M12.3 18v-6"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  fsEnter: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  fsExit: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  grip: [6,12,18].map(y => `<circle cx="9" cy="${y}" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="${y}" r="1.4" fill="currentColor" stroke="none"/>`).join(''),
  hand: '<path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11"/><path d="M15 10.5V4.5a1.5 1.5 0 0 0-3 0v6"/><path d="M12 10.5V5.5a1.5 1.5 0 0 0-3 0V13"/><path d="M18 8.5a1.5 1.5 0 0 1 3 0V14a8 8 0 0 1-8 8h-1.2a7 7 0 0 1-5.2-2.3L3.4 16a1.6 1.6 0 0 1 2.3-2.2L9 16.5V13"/>',
  select: '<path d="M5 3.5l13.5 6.2-5.8 1.9-2 5.9z"/><path d="M13 12l5.5 5.5"/>',
  pen: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="M14.5 5.5l3 3"/>',
  eraser: '<path d="M8.5 19.5L4 15a1.5 1.5 0 0 1 0-2.1L13 4a1.5 1.5 0 0 1 2.1 0l4.9 4.9a1.5 1.5 0 0 1 0 2.1L11.5 19.5z"/><path d="M8.5 19.5H20"/><path d="M8.5 8.5l7 7"/>',
  range: '<rect x="4" y="4" width="16" height="16" rx="1.5" stroke-dasharray="3 2.6"/>',
  bucket: '<path d="M10.5 3.5l8 8-6.6 6.6a2 2 0 0 1-2.8 0L4 13a2 2 0 0 1 0-2.8z"/><path d="M4.5 12h13.6"/><path d="M20.5 15.5s-1.6 2-1.6 3.1a1.6 1.6 0 0 0 3.2 0c0-1.1-1.6-3.1-1.6-3.1z"/>',
  picker: '<path d="M13 5l6 6"/><path d="M15 3.8a2.3 2.3 0 0 1 3.2 0l1.9 1.9a2.3 2.3 0 0 1 0 3.2L18 11"/><path d="M16 9l-9 9H5v-2l9-9"/>',
  dockUp: '<path d="M5 4h14"/><path d="M12 20V9"/><path d="M7.5 13.5L12 9l4.5 4.5"/>',
  dockDown: '<path d="M5 20h14"/><path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/>',
  rec: '<circle cx="12" cy="12" r="6.5" fill="currentColor" stroke="none"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
  home: '<path d="M6 5v14"/><path d="M18.5 5.5v13L9 12z" fill="currentColor" stroke="none"/>',
  homeH: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
  metro: '<path d="M9 3.5h6l3.5 17h-13z"/><path d="M12 15.5l5-9"/><path d="M7 15.5h10"/>',
  countin: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><text x="12.5" y="15.5" font-size="8.5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">1</text>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  paste: '<path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/>',
  dup: '<rect x="3" y="7" width="9" height="10" rx="1.5"/><rect x="12" y="7" width="9" height="10" rx="1.5" stroke-dasharray="2.5 2"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>',
  download: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 20h14"/>',
  clear: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  minus: '<path d="M5 12h14"/>',
  rename: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  upload: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><circle cx="10" cy="16" r="1.6"/><path d="M11.6 16v-5l3 1"/>',
  magnet: '<path d="M6 3.5v8a6 6 0 0 0 12 0v-8"/><path d="M6 7.5h4M14 7.5h4"/><path d="M10 3.5v8a2 2 0 0 0 4 0v-8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  panelL: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/><path d="M5.5 8h2M5.5 11h2"/>',
  panelR: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M14.5 4.5v15"/><path d="M16.5 8h2M16.5 11h2"/>',
  // ── 악기 · 테마 아이콘 (라인 스타일)
  keys: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M7.5 12v7M16.5 12v7"/><rect x="6.2" y="5" width="2.6" height="7" rx=".6" fill="currentColor" stroke="none"/><rect x="15.2" y="5" width="2.6" height="7" rx=".6" fill="currentColor" stroke="none"/>',
  ekeys: '<rect x="2.5" y="8" width="19" height="11" rx="2"/><path d="M2.5 13h19M7 13v6M12 13v6M17 13v6"/><path d="M5.5 10.5h4"/><circle cx="15.5" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="18.5" cy="10.5" r=".9" fill="currentColor" stroke="none"/><path d="M9 3.5l-1.5 2.5h2L8 8"/>',
  organ: '<rect x="3.5" y="10" width="3" height="10" rx="1.5"/><rect x="8" y="6" width="3" height="14" rx="1.5"/><rect x="12.5" y="3.5" width="3" height="16.5" rx="1.5"/><rect x="17" y="8" width="3" height="12" rx="1.5"/><path d="M2.5 20.5h19"/>',
  sparkle: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M18.5 15.5v5M16 18h5"/>',
  musicbox: '<rect x="3" y="10" width="14" height="10" rx="1.5"/><path d="M3 10l2.5-4h9L17 10"/><path d="M17 15h3v-3h1.5"/><circle cx="10" cy="15" r="1.6"/>',
  violin: '<path d="M12 9.5c-2 0-3.5.8-3.5 2.6 0 1 .8 1.5.8 2.4s-1.3 1.4-1.3 3c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5c0-1.6-1.3-2.1-1.3-3s.8-1.4.8-2.4c0-1.8-1.5-2.6-3.5-2.6z"/><path d="M12 2.5v13M10.5 18.5h3M10.4 3.2h3.2"/>',
  viola: '<path d="M12 9.5c-2 0-3.5.8-3.5 2.6 0 1 .8 1.5.8 2.4s-1.3 1.4-1.3 3c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5c0-1.6-1.3-2.1-1.3-3s.8-1.4.8-2.4c0-1.8-1.5-2.6-3.5-2.6z"/><path d="M12 2.5v13M10.5 18.5h3M10.4 3.2h3.2"/><path d="M17.5 3l1.5 4M20 3l-1 4"/>',
  cello: '<path d="M12 7.5c-2.3 0-4 1-4 3 0 1.2.9 1.7.9 2.7s-1.5 1.6-1.5 3.4c0 2.3 2 3.9 4.6 3.9s4.6-1.6 4.6-3.9c0-1.8-1.5-2.4-1.5-3.4s.9-1.5.9-2.7c0-2-1.7-3-4-3z"/><path d="M12 1.5v13M10.3 17h3.4M12 20.5v2.5"/>',
  strings: '<path d="M10 9.5c-2 0-3.5.8-3.5 2.6 0 1 .8 1.5.8 2.4s-1.3 1.4-1.3 3c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5c0-1.6-1.3-2.1-1.3-3s.8-1.4.8-2.4c0-1.8-1.5-2.6-3.5-2.6z"/><path d="M10 2.5v13"/><path d="M4 21L21 4.5"/><path d="M19.5 3.5l2 2"/>',
  pizz: '<path d="M10 9.5c-2 0-3.5.8-3.5 2.6 0 1 .8 1.5.8 2.4s-1.3 1.4-1.3 3c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5c0-1.6-1.3-2.1-1.3-3s.8-1.4.8-2.4c0-1.8-1.5-2.6-3.5-2.6z"/><path d="M10 2.5v13"/><path d="M17 9l3-1.5M17.5 12.5h3.5M17 16l3 1.5"/>',
  flute: '<g transform="rotate(-38 12 12)"><rect x="1" y="10.4" width="22" height="3.2" rx="1.6"/><circle cx="5" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="11" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="14" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r=".7" fill="currentColor" stroke="none"/></g>',
  recorder: '<path d="M10.5 2.5h3v15.5l1.5 3.5h-6l1.5-3.5z"/><path d="M10.5 6h3"/><circle cx="12" cy="9" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="11.8" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="14.6" r=".8" fill="currentColor" stroke="none"/>',
  clarinet: '<path d="M11 2.5h2l.3 3h-2.6z"/><path d="M10.6 5.5h2.8V17l3 4.5H7.6l3-4.5z"/><circle cx="12" cy="8.5" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="13.5" r=".7" fill="currentColor" stroke="none"/>',
  shawm: '<path d="M11 2.5h2l.3 3h-2.6z"/><path d="M10.6 5.5h2.8L15 15l3.5 6.5h-13L9 15z"/><circle cx="12" cy="9" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/>',
  whistle: '<path d="M2.5 9h12a5 5 0 1 1-4.7 6.7H5.5a3 3 0 0 1-3-3z"/><circle cx="14.5" cy="14" r="1.6"/><path d="M8.5 9V6.5"/><path d="M18 4.5l1.5-1.5M20.5 7.5l1.5-.5"/>',
  mandolin: '<circle cx="9" cy="15" r="6"/><circle cx="9" cy="15" r="1.6"/><path d="M13.2 10.8L20 4"/><path d="M18.3 2.6l3.1 3.1"/>',
  lute: '<ellipse cx="9" cy="15" rx="5.5" ry="6.8" transform="rotate(45 9 15)"/><circle cx="9" cy="15" r="1.5"/><path d="M13.3 10.7l4.7-4.7"/><path d="M18 6l3 2.5"/>',
  guitar: '<path d="M14 10l6-6"/><path d="M18.8 2.8l2.4 2.4"/><path d="M10.5 9.5c-1-1-3.5-.5-4.5 1.5-.6 1.2-2.5 1-3.3 2.6-1.2 2.4.5 5.7 3.2 6.6 2.4.8 4.6-.8 4.8-2.7.2-1.5 1.8-2 2.5-3.1 1.1-1.8.6-3.9-.5-4.6z"/><circle cx="8.6" cy="15.4" r="1.4"/>',
  harp: '<path d="M5 21V3.5"/><path d="M5 3.5c4 0 5 3 9 3s5-1.5 6-2.5"/><path d="M20 4L7 21"/><path d="M4 21h4.5"/><path d="M8 5.4v14.2M11 6.4v9.4M14 6.6v5.2M17 5.6v2.4"/>',
  harpsichord: '<path d="M4 3.5h5.5c1.2 0 1.8.6 2.3 1.8L18.8 19a1.5 1.5 0 0 1-1.4 2H4z"/><path d="M4 8h7.5"/><path d="M6.5 11v7.5M9.5 11v7.5M12.5 12v6.5"/>',
  dulcimer: '<path d="M2.5 19h19L17 8H7z"/><path d="M5 15.5h14M6.5 11.8h11"/><path d="M15 2.5l-3 5.5"/><circle cx="11.6" cy="8.6" r="1.1" fill="currentColor" stroke="none"/>',
  hurdy: '<path d="M3.5 12c0-4 4-6 8-6h4.5c3 0 5 2.5 5 6s-2 6-5 6h-4.5c-4 0-8-2-8-6z"/><circle cx="16" cy="12" r="3"/><path d="M3.5 12H1.5V9"/><path d="M6.5 10.5h4.5M6.5 13.5h4.5"/>',
  bagpipe: '<path d="M5 13.5c0-3.5 3-6 6.5-6S18 10 18 13.5 15 20 11 20s-6-3-6-6.5z"/><path d="M9 8L6 2.5M12.5 7.5l1-5M15.8 9l4-5.5"/><path d="M11 20v2.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/><path d="M12 3v2"/>',
  handbell: '<path d="M12 2.5V8M10 2.5h4"/><path d="M7 18.5c0-6 1-10.5 5-10.5s5 4.5 5 10.5z"/><path d="M5 18.5h14"/><circle cx="12" cy="21" r="1.1"/>',
  chime: '<path d="M3 3.5h18"/><path d="M6 3.5v1M10 3.5v1M14 3.5v1M18 3.5v1"/><rect x="4.8" y="4.5" width="2.4" height="16" rx="1.2"/><rect x="8.8" y="4.5" width="2.4" height="13" rx="1.2"/><rect x="12.8" y="4.5" width="2.4" height="10" rx="1.2"/><rect x="16.8" y="4.5" width="2.4" height="7.5" rx="1.2"/>',
  sleigh: '<circle cx="8" cy="15" r="4"/><circle cx="16.5" cy="16.5" r="3.5"/><path d="M6.2 16.5h3.6M14.8 18h3.4"/><path d="M8 11c.5-4 4.5-6.5 9-6"/><path d="M16.5 13c.6-3 1-5.5.5-8"/>',
  cymbal: '<ellipse cx="12" cy="9" rx="9" ry="2.6"/><path d="M12 6.4V5M12 11.6V21M8 21h8"/>',
  drum: '<ellipse cx="12" cy="10" rx="8" ry="3"/><path d="M4 10v7.5c0 1.7 3.6 3 8 3s8-1.3 8-3V10"/><path d="M8 12.6l1.5 7.6M16 12.6l-1.5 7.6"/><path d="M5 2.5l5.5 5.5M19 2.5l-5.5 5.5"/>',
  choir: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.6"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M13.2 17a4.5 4.5 0 0 1 8.3 3"/>',
  candle: '<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 10V8.2"/><path d="M12 2.8c1.6 1.8 2.1 3.1 1 4.4a1.4 1.4 0 0 1-2 0c-1.1-1.3-.6-2.6 1-4.4z"/>',
  ufo: '<ellipse cx="12" cy="12" rx="9.5" ry="3.2"/><path d="M7.4 10.2a4.6 4.6 0 0 1 9.2 0"/><path d="M8 18l-1 2.5M12 18.3v2.7M16 18l1 2.5"/>',
  sine: '<path d="M2.5 12c1.6-5 4.7-5 6.3 0s4.7 5 6.3 0 4.7-5 6.4 0"/>',
  wave: '<path d="M2.5 12c1.6-5 4.7-5 6.3 0s4.7 5 6.3 0 4.7-5 6.4 0"/>',
  pulse: '<path d="M2.5 16.5h3V7h4.5v9.5h3V7h4.5v9.5h4"/>',
  triwave: '<path d="M2.5 15.5l4.75-8 4.75 8 4.75-8 4.75 8"/>',
  invader: 'PIX',
  gamepad: '<path d="M7 7h10a5 5 0 0 1 4.8 6.4l-1 3.4a2.5 2.5 0 0 1-4.3.9L14.5 15h-5l-2 2.7a2.5 2.5 0 0 1-4.3-.9l-1-3.4A5 5 0 0 1 7 7z"/><path d="M7.5 9.5v3.5M5.8 11.2h3.4"/><circle cx="15.5" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="17.7" cy="12.2" r=".9" fill="currentColor" stroke="none"/>',
  diamond: '<path d="M6.5 4h11l4 5.5L12 21 2.5 9.5z"/><path d="M2.5 9.5h19M8.5 9.5L12 21l3.5-11.5"/>',
  tv: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 3l3.5 4 3.5-4"/><path d="M6 11h1.5M10 11h2M15.5 11h2.5M7 14h3M13 14h1.5M17 14h1M6 17h2M11 17h3M16.5 17h1.5"/>',
  trumpet: '<path d="M2.5 9.5v5M2.5 12H14"/><path d="M14 9.5l7-4v13l-7-4z"/><path d="M6.5 12v3.5M9 12v3.5M11.5 12v3.5"/>',
  speaker: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="14.5" r="4"/><circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="6.5" r="1.5"/>',
  cart: '<path d="M5 3h14v12l-2 2v4H7v-4l-2-2z"/><rect x="8" y="6" width="8" height="6" rx="1"/><path d="M9.5 18v2M12 18v2M14.5 18v2"/>',
  castle: '<path d="M3 21V8h2.5v2.2h2.2V8h2.6v2.5h3.4V8h2.6v2.2h2.2V8H21v13z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  tree: '<path d="M12 2.5l5 6h-2.5l4 5H16l4 5H4l4-5H5.5l4-5H7z"/><path d="M12 18.5V22"/>',
  bear: '<circle cx="6" cy="6.5" r="2.5"/><circle cx="18" cy="6.5" r="2.5"/><circle cx="12" cy="13" r="7"/><circle cx="9.5" cy="11.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11.5" r=".9" fill="currentColor" stroke="none"/><ellipse cx="12" cy="15.5" rx="2.4" ry="1.8"/>',
  coffee: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3"/>',
  bolt: '<path d="M13.5 2.5L5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.5"/>',
  disco: '<circle cx="12" cy="13.5" r="7.5"/><path d="M4.5 13.5h15M12 6v15M6 9.5h12M6 17.5h12"/><path d="M12 2v4"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z"/>',
  sax: '<path d="M8.5 2.5h4M10.5 2.5v11a4.5 4.5 0 0 0 9 0V11.5"/><path d="M16.5 11.5h5"/><circle cx="10.5" cy="7" r=".8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="10" r=".8" fill="currentColor" stroke="none"/>',
  palm: '<path d="M12 21c0-5 .5-9 1.5-12"/><path d="M13.5 9C11 5 6 5 3.5 7.5M13.5 9c2-4 6-5 8.5-3M13.5 9c-3 0-6 2-7 5M13.5 9c3 0 5.5 2 6 5"/><path d="M7.5 21h10"/>',
  sliders: '<path d="M6 3.5v17M12 3.5v17M18 3.5v17"/><rect x="3.8" y="13" width="4.4" height="3.2" rx="1" fill="currentColor"/><rect x="9.8" y="6.5" width="4.4" height="3.2" rx="1" fill="currentColor"/><rect x="15.8" y="10.5" width="4.4" height="3.2" rx="1" fill="currentColor"/>',
  env: '<path d="M2.5 19.5l4-15 4.5 7.5h6l4.5 7.5"/><path d="M2.5 20.5h19" stroke-dasharray="1.5 2"/>',
  filter: '<path d="M2.5 9.5h10c2 0 3-3.5 4.5-3.5s2 3.5 4.5 13.5"/><path d="M2.5 20.5h19" stroke-dasharray="1.5 2"/>',
  vibrato: '<path d="M2.5 12h2.5c1 0 1.5-4 3-4s2 8 3.5 8 2-8 3.5-8 2 8 3.5 8c1 0 1.5-4 3-4"/>',
  layers: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  folderOpen: '<path d="M3 18.5V6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2H18a1.5 1.5 0 0 1 1.5 1.5V10"/><path d="M3 18.5l2.6-7.2a1.5 1.5 0 0 1 1.4-1H21a1 1 0 0 1 .9 1.4l-2.5 6.9a1.5 1.5 0 0 1-1.4.9z"/>',
  folderPlus: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M12 10.5v6M9 13.5h6"/>',
  folderOut: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M9 13.5h6"/>',
  more: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  logo: '<path d="M2.5 12h2.5l2-5 3 10 3-14 3 13 2-4h3"/>',
  speakerOn: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
};
{ // 픽셀 인베이더 (칩튠)
  const R = ['..X.....X..','...X...X...','..XXXXXXX..','.XX.XXX.XX.','XXXXXXXXXXX','X.XXXXXXX.X','X.X.....X.X','...XX.XX...'];
  ICON.invader = R.map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${1.5 + x * 1.9}" y="${4.5 + y * 1.9}" width="1.95" height="1.95" fill="currentColor" stroke="none"/>` : '').join('')).join('');
}
const svg = n => `<svg class="i" viewBox="0 0 24 24">${ICON[n] || ICON.music}</svg>`;
const ico = (n, cls) => { const s = el('span', cls); s.innerHTML = svg(n); return s; };
function svgCursor(name, hx, hy) {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke-linecap='round' stroke-linejoin='round'><g stroke='black' stroke-width='4'>${ICON[name]}</g><g stroke='white' stroke-width='1.8'>${ICON[name]}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s)}") ${hx} ${hy}, crosshair`;
}
const CURSOR = {
  hand: 'grab', select: 'default', range: 'crosshair',
  pen: svgCursor('pen', 4, 19), eraser: svgCursor('eraser', 6, 18),
  picker: svgCursor('picker', 5, 19),
};

// ───────── 악기 정의 ─────────
// 신스 기본값: 모든 선율 악기는 이 파라미터 조합으로 만들어짐 (인스펙터에서 수정 가능)
const BASE = { wave: 'triangle', harm: null, tone: 1, oct: 0, mix2: 0, wave2: 'sine', ratio2: 1, det2: 0,
  a: 0.01, d: 0.3, s: 0.8, r: 0.15, keytrack: 0, cut: 8, res: 0.7, fenv: 0, fdec: 0.3,
  fm: 0, fmRatio: 1, fmDec: 0.5, vib: 0, vibRate: 5.5, vibDelay: 0.15, noise: 0, nHz: 0, nQ: 1,
  trem: 0, tremRate: 12, bend: 0, formant: 0, lvl: 1, rev: 0.18, pan: 0 };
const PULSE = d => Array.from({ length: 24 }, (_, i) => Math.sin(Math.PI * (i + 1) * d) / (i + 1));   // 펄스파 배음
const DRUM_BASE = { tune: 0, dlen: 1, lvl: 1, rev: 0.12, pan: 0 };
const INSTS = {
  piano:    { label: '그랜드 피아노', fam: 'keys', icon: 'keys', color: '#5fa8ff', prog: 0, alias: 'piano grand 피아노',
    p: { wave: 'harm', harm: [1,.6,.3,.22,.1,.08,.04,.03], mix2: .25, wave2: 'sine', ratio2: 2, det2: 2, a: .002, d: 1.8, s: 0, r: .4, keytrack: 1, cut: 7, fenv: 2.5, fdec: .5, fm: .4, fmRatio: 1, fmDec: .2, lvl: 1.1, rev: .28 } },
  epiano:   { label: '일렉 피아노', fam: 'keys', icon: 'ekeys', color: '#4d8fe6', prog: 4, alias: 'electric piano rhodes ep 일렉',
    p: { wave: 'sine', fm: 1.2, fmRatio: 1, fmDec: 1.2, mix2: .2, wave2: 'sine', ratio2: 1, det2: 5, a: .002, d: 2.2, s: .12, r: .35, keytrack: .8, cut: 10, trem: .25, tremRate: 4.5, rev: .3 } },
  organ:    { label: '오르간', fam: 'keys', icon: 'organ', color: '#7aa7d9', prog: 16, alias: 'organ 오르간',
    p: { wave: 'harm', harm: [1,.7,.45,.35,0,.25,0,.18], a: .01, d: .1, s: 1, r: .06, cut: 12, trem: .15, tremRate: 6.5, lvl: .7, rev: .3 } },
  celesta:  { label: '첼레스타', fam: 'keys', icon: 'sparkle', color: '#8fd0ff', prog: 8, alias: 'celesta 첼레스타',
    p: { wave: 'sine', oct: 1, fm: 1.4, fmRatio: 4, fmDec: .25, mix2: .25, wave2: 'sine', ratio2: 3, a: .002, d: 1.4, s: 0, r: .6, keytrack: .6, cut: 12, lvl: .9, rev: .45 } },
  musicbox: { label: '오르골', fam: 'keys', icon: 'musicbox', color: '#a4b8ff', prog: 10, alias: 'music box 오르골 뮤직박스',
    p: { wave: 'sine', oct: 1, fm: 2, fmRatio: 5.3, fmDec: .12, mix2: .3, wave2: 'sine', ratio2: 4.02, a: .001, d: 1.6, s: 0, r: .8, keytrack: .5, cut: 14, rev: .5 } },
  violin:   { label: '바이올린', fam: 'str', icon: 'violin', color: '#c792ea', prog: 40, alias: 'violin 바이올린 vn',
    p: { wave: 'sawtooth', mix2: .6, wave2: 'sawtooth', det2: 4, a: .08, d: .3, s: .9, r: .18, cut: 5, res: 1.2, vib: 25, vibRate: 5.6, vibDelay: .15, lvl: .55, rev: .3 } },
  viola:    { label: '비올라', fam: 'str', icon: 'viola', color: '#ad7fe0', prog: 41, alias: 'viola 비올라 va',
    p: { wave: 'sawtooth', mix2: .6, wave2: 'sawtooth', det2: 5, a: .09, d: .3, s: .9, r: .2, cut: 4, res: 1.2, vib: 20, vibRate: 5.2, vibDelay: .18, lvl: .6, rev: .3 } },
  cello:    { label: '첼로', fam: 'str', icon: 'cello', color: '#9a6bd1', prog: 42, alias: 'cello 첼로 vc',
    p: { wave: 'sawtooth', mix2: .5, wave2: 'sawtooth', det2: 5, a: .1, d: .3, s: .9, r: .25, cut: 3.2, res: 1.5, vib: 18, vibRate: 5, vibDelay: .2, lvl: .7, rev: .3 } },
  strings:  { label: '스트링 합주', fam: 'str', icon: 'strings', color: '#d6a8f2', prog: 48, alias: 'strings str ensemble 현악 스트링',
    p: { wave: 'sawtooth', mix2: .8, wave2: 'sawtooth', det2: 9, a: .3, d: .4, s: .9, r: .5, cut: 3, res: .8, vib: 10, vibRate: 5, vibDelay: .3, lvl: .55, rev: .4 } },
  pizz:     { label: '피치카토', fam: 'str', icon: 'pizz', color: '#e0b5ff', prog: 45, alias: 'pizzicato pizz 피치카토',
    p: { wave: 'sawtooth', mix2: .3, wave2: 'triangle', det2: 6, a: .002, d: .4, s: 0, r: .2, keytrack: 1, cut: 3.5, fenv: 4, fdec: .08, rev: .35 } },
  flute:    { label: '플루트', fam: 'wind', icon: 'flute', color: '#5ed6d0', prog: 73, alias: 'flute fl 플루트',
    p: { wave: 'harm', harm: [1,.35,.12,.05], a: .06, d: .25, s: .85, r: .12, cut: 5, vib: 10, vibRate: 5, vibDelay: .25, noise: .1, nQ: 1.5, rev: .3 } },
  flutesus: { label: '플루트 서스테인', fam: 'wind', icon: 'flute', color: '#48c2bc', prog: 73, alias: 'flute sus fl sus 플루트',
    p: { wave: 'harm', harm: [1,.35,.12,.05], a: .18, d: .3, s: .95, r: .35, cut: 5, vib: 14, vibRate: 5, vibDelay: .4, noise: .08, nQ: 1.5, rev: .38 } },
  clarinet: { label: '클라리넷', fam: 'wind', icon: 'clarinet', color: '#3ba8a3', prog: 71, alias: 'clarinet cl 클라리넷',
    p: { wave: 'square', a: .04, d: .2, s: .9, r: .1, cut: 3.2, res: 1, vib: 6, vibDelay: .3, noise: .03, lvl: .7, rev: .25 } },
  whistle:  { label: '휘슬', fam: 'wind', icon: 'whistle', color: '#86e6e0', prog: 78, alias: 'whistle 휘슬 휘파람',
    p: { wave: 'sine', a: .04, d: .2, s: .9, r: .08, cut: 6, vib: 18, vibRate: 5.8, vibDelay: .1, noise: .06, nQ: 2, lvl: .8, rev: .25 } },
  mandolin: { label: '만돌린', fam: 'pluck', icon: 'mandolin', color: '#ffb454', prog: 25, alias: 'mandolin 만돌린',
    p: { wave: 'sawtooth', mix2: .7, wave2: 'sawtooth', det2: 7, a: .002, d: .6, s: 0, r: .15, keytrack: 1, cut: 4, fenv: 4, fdec: .06, lvl: .7, rev: .25 } },
  mandotrem:{ label: '만돌린 트레몰로', fam: 'pluck', icon: 'mandolin', color: '#f29a3a', prog: 25, alias: 'mandolin tr tremolo 만돌린 트레몰로',
    p: { wave: 'sawtooth', mix2: .7, wave2: 'sawtooth', det2: 7, a: .002, d: .1, s: .75, r: .2, cut: 4, fenv: 2, fdec: .06, trem: 1, tremRate: 13, lvl: .7, rev: .25 } },
  bell:     { label: '벨', fam: 'bell', icon: 'bell', color: '#f2c230', prog: 9, alias: 'bell 벨 종 glockenspiel',
    p: { wave: 'sine', fm: 3, fmRatio: 1.4, fmDec: 1.5, mix2: .15, wave2: 'sine', ratio2: 2.76, a: .001, d: 3, s: 0, r: 1.2, keytrack: .4, cut: 14, rev: .5 } },
  chime:    { label: '차임', fam: 'bell', icon: 'chime', color: '#e0b020', prog: 14, alias: 'chime tubular 차임 튜불러',
    p: { wave: 'sine', fm: 1.8, fmRatio: 2.76, fmDec: 1.2, mix2: .3, wave2: 'sine', ratio2: 5.4, a: .001, d: 3.5, s: 0, r: 1.5, keytrack: .3, cut: 14, rev: .45 } },
  sleigh:   { label: '슬레이벨', fam: 'bell', icon: 'sleigh', color: '#ffd966', prog: 9, alias: 's-bell sleigh bell 슬레이벨 방울',
    p: { wave: 'sine', tone: .1, oct: 2, noise: 1, nHz: 8000, nQ: 3, trem: 1, tremRate: 18, a: .001, d: .45, s: 0, r: .2, cut: 16, lvl: 1.2, rev: .3 } },
  cym:      { label: '심벌 스웰', fam: 'bell', icon: 'cymbal', color: '#b8b2a6', prog: 119, alias: 'cym cymbal 심벌',
    p: { wave: 'sine', tone: 0, noise: 1, nHz: 6000, nQ: .4, a: .002, d: 2, s: 0, r: 1, cut: 16, rev: .35 } },
  drums:    { label: '드럼 키트', fam: 'bell', icon: 'drum', color: '#4fd1a5', prog: 0, alias: 'drum drums kit 드럼 타악기 percussion', drum: true },
  choir:    { label: '콰이어', fam: 'synth', icon: 'choir', color: '#ff8fb1', prog: 52, alias: 'choir 콰이어 합창 보컬 aah',
    p: { wave: 'sawtooth', mix2: .8, wave2: 'sawtooth', det2: 12, a: .35, d: .5, s: .9, r: .6, cut: 2.2, vib: 8, vibRate: 4.5, vibDelay: .2, noise: .04, nQ: .7, formant: .8, lvl: .55, rev: .5 } },
  // 보컬 (가사로 노래하는 목소리)
  vocal:    { label: '여성 보컬', fam: 'voice', icon: 'mic', color: '#ff7aa8', prog: 54, vocal: true, alias: 'vocal voice vocaloid singer female soprano 보컬 보컬로이드 가사 노래 한국어 여자 여성 소프라노 기본',
    p: { vSex: 1, vBreath: .2, vTense: .5, vPorta: 1, vCons: 1, vRobot: 0, vib: 30, vibRate: 5.6, vibDelay: .25, lvl: 1, rev: .25 } },
  vidol:    { label: '디지털 아이돌', fam: 'voice', icon: 'sparkle', color: '#3fd8d0', prog: 54, vocal: true, alias: 'vocal voice vocaloid idol digital miku synth 보컬 보컬로이드 미쿠 아이돌 디지털 전자 기계 맑은 밝은 여성 가사 노래',
    p: { vSex: 1.17, vBreath: .04, vTense: .9, vPorta: .55, vCons: .85, vRobot: .85, vib: 18, vibRate: 6.4, vibDelay: .35, lvl: .95, rev: .2 } },
  vhusky:   { label: '허스키 여성 보컬', fam: 'voice', icon: 'mic', color: '#c98a6b', prog: 54, vocal: true, alias: 'vocal voice husky breathy alto female 보컬 허스키 숨 알토 여성 가사 노래 발라드 재즈',
    p: { vSex: .95, vBreath: .62, vTense: .28, vPorta: 1.3, vCons: 1, vRobot: 0, vib: 34, vibRate: 5.1, vibDelay: .3, lvl: 1.05, rev: .3 } },
  vocalm:   { label: '남성 보컬 (테너)', fam: 'voice', icon: 'mic', color: '#e0607f', prog: 54, vocal: true, alias: 'vocal voice vocaloid singer male tenor 보컬 보컬로이드 가사 노래 한국어 남자 남성 테너',
    p: { vSex: .84, vBreath: .15, vTense: .45, vPorta: 1, vCons: 1, vRobot: 0, vib: 22, vibRate: 5.2, vibDelay: .3, lvl: 1, rev: .22 } },
  vbari:    { label: '바리톤 남성 보컬', fam: 'voice', icon: 'mic', color: '#7a6fe0', prog: 54, vocal: true, alias: 'vocal voice baritone bass deep male 보컬 바리톤 베이스 굵은 낮은 남자 남성 가사 노래',
    p: { vSex: .75, vBreath: .18, vTense: .4, vPorta: 1.1, vCons: 1.05, vRobot: 0, vib: 26, vibRate: 4.9, vibDelay: .35, lvl: 1.1, rev: .24 } },
  fx:       { label: 'FX 신스', fam: 'synth', icon: 'ufo', color: '#ff6fd8', prog: 98, alias: 'fx effect 효과 신스',
    p: { wave: 'square', mix2: .5, wave2: 'sawtooth', det2: 25, bend: 12, a: .01, d: .5, s: .6, r: .6, cut: 6, res: 6, fenv: 3, fdec: .6, vib: 40, vibRate: 7, vibDelay: 0, lvl: .5, rev: .5 } },
  synth:    { label: '신스 리드', fam: 'synth', icon: 'sine', color: '#ff6f91', prog: 80, alias: 'synth lead 신스 리드 삼각파',
    p: { wave: 'triangle', a: .012, d: .1, s: .9, r: .05, cut: 16, rev: .1 } },
  bass:     { label: '베이스', fam: 'synth', icon: 'guitar', color: '#e0735a', prog: 33, alias: 'bass bs 베이스',
    p: { wave: 'sawtooth', mix2: .6, wave2: 'square', ratio2: .5, a: .005, d: .35, s: .55, r: .08, cut: 2.5, res: 2, fenv: 3, fdec: .18, lvl: 1.1, rev: .05 } },

  // 16비트 / 칩튠
  chipsq:   { label: '칩 스퀘어', fam: 'chip', icon: 'invader', color: '#7cff6b', prog: 80, alias: 'chip square 8bit 16bit 칩튠 스퀘어 게임 레트로',
    p: { wave: 'square', a: .002, d: .1, s: .8, r: .05, cut: 16, vib: 15, vibRate: 6, vibDelay: .3, lvl: .45, rev: .08 } },
  chip25:   { label: '칩 펄스 25%', fam: 'chip', icon: 'pulse', color: '#5ee35e', prog: 80, alias: 'chip pulse 25 8bit 16bit 칩튠 펄스 레트로',
    p: { wave: 'harm', harm: PULSE(.25), a: .002, d: .1, s: .8, r: .05, cut: 16, vib: 15, vibRate: 6, vibDelay: .3, lvl: .5, rev: .08 } },
  chip12:   { label: '칩 펄스 12.5%', fam: 'chip', icon: 'gamepad', color: '#a4ff8a', prog: 80, alias: 'chip pulse 12.5 thin 8bit 16bit 칩튠 펄스',
    p: { wave: 'harm', harm: PULSE(.125), a: .002, d: .1, s: .8, r: .05, cut: 16, vib: 12, vibRate: 6, vibDelay: .3, lvl: .55, rev: .08 } },
  chiptri:  { label: '칩 트라이앵글 베이스', fam: 'chip', icon: 'triwave', color: '#4cc94c', prog: 38, alias: 'chip triangle bass 8bit 16bit 칩튠 베이스',
    p: { wave: 'harm', harm: [1,0,.11,0,.04,0,.02,0,.012,0,.008,0,.006,0,.004,0,.12,0,.03], a: .002, d: .1, s: 1, r: .03, cut: 16, lvl: 1, rev: .03 } },
  chipbell: { label: '칩 벨', fam: 'chip', icon: 'diamond', color: '#b6ff9a', prog: 8, alias: 'chip bell 8bit 16bit 칩튠 벨 반짝',
    p: { wave: 'harm', harm: PULSE(.125), oct: 1, a: .001, d: .45, s: 0, r: .2, keytrack: .5, cut: 16, lvl: .55, rev: .2 } },
  chipnoise:{ label: '칩 노이즈', fam: 'chip', icon: 'tv', color: '#8fbf7f', prog: 121, alias: 'chip noise 8bit 16bit 칩튠 노이즈 효과 폭발',
    p: { wave: 'sine', tone: 0, noise: 1, nHz: 0, nQ: .6, a: .001, d: .18, s: 0, r: .05, cut: 16, lvl: 1.2, rev: .05 } },
  fmbrass:  { label: 'FM 브라스', fam: 'chip', icon: 'trumpet', color: '#6bffd0', prog: 61, alias: 'fm brass 16bit genesis 메가드라이브 브라스 트럼펫',
    p: { wave: 'sine', fm: 2.6, fmRatio: 1, fmDec: .45, mix2: .25, wave2: 'sawtooth', det2: 4, a: .03, d: .3, s: .75, r: .1, cut: 9, vib: 8, vibRate: 5.5, vibDelay: .25, lvl: .6, rev: .15 } },
  fmbass:   { label: 'FM 슬랩 베이스', fam: 'chip', icon: 'speaker', color: '#4fd6b0', prog: 36, alias: 'fm bass slap 16bit genesis 메가드라이브 베이스',
    p: { wave: 'sine', fm: 3, fmRatio: 1, fmDec: .15, mix2: .3, wave2: 'sine', ratio2: .5, a: .002, d: .3, s: .4, r: .05, cut: 12, lvl: 1, rev: .03 } },
  snesstr:  { label: 'SNES 스트링', fam: 'chip', icon: 'cart', color: '#9ae0ff', prog: 50, alias: 'snes strings 16bit 슈퍼패미컴 스트링 rpg',
    p: { wave: 'sawtooth', mix2: .5, wave2: 'sawtooth', det2: 6, a: .15, d: .4, s: .85, r: .3, cut: 2.4, res: 1, vib: 6, vibRate: 5, vibDelay: .3, lvl: .5, rev: .3 } },

  // 중세
  lute:     { label: '류트', fam: 'medieval', icon: 'lute', color: '#c8935a', prog: 24, alias: 'lute 류트 음유시인 중세 판타지 발현',
    p: { wave: 'sawtooth', mix2: .5, wave2: 'triangle', det2: 5, a: .002, d: .9, s: 0, r: .25, keytrack: 1, cut: 2.6, fenv: 3, fdec: .05, lvl: .8, rev: .3 } },
  harp:     { label: '하프', fam: 'medieval', icon: 'harp', color: '#e0b07a', prog: 46, alias: 'harp 하프 중세 판타지 몽환',
    p: { wave: 'triangle', mix2: .3, wave2: 'sine', ratio2: 2, a: .002, d: 1.8, s: 0, r: .6, keytrack: 1, cut: 6, fenv: 1.5, fdec: .1, lvl: .9, rev: .45 } },
  recorder: { label: '리코더', fam: 'medieval', icon: 'recorder', color: '#b8875a', prog: 74, alias: 'recorder 리코더 피리 중세 동요',
    p: { wave: 'harm', harm: [1,.2,.08,.03], a: .04, d: .2, s: .9, r: .08, cut: 6, vib: 6, vibRate: 5, vibDelay: .3, noise: .14, nQ: 1.2, lvl: .8, rev: .3 } },
  harpsichord:{ label: '하프시코드', fam: 'medieval', icon: 'harpsichord', color: '#d9a36b', prog: 6, alias: 'harpsichord 하프시코드 쳄발로 바로크 중세',
    p: { wave: 'sawtooth', mix2: .5, wave2: 'sawtooth', ratio2: 2, det2: 3, a: .001, d: 1.2, s: 0, r: .12, keytrack: .8, cut: 9, res: 2, fenv: 2, fdec: .15, lvl: .6, rev: .3 } },
  dulcimer: { label: '해머드 덜시머', fam: 'medieval', icon: 'dulcimer', color: '#c47a4a', prog: 15, alias: 'dulcimer 덜시머 양금 중세 판타지',
    p: { wave: 'harm', harm: [1,.5,.4,.2,.15], mix2: .5, wave2: 'triangle', det2: 9, fm: .6, fmRatio: 2, fmDec: .1, a: .001, d: 2, s: 0, r: .8, keytrack: .6, cut: 8, lvl: .8, rev: .4 } },
  hurdy:    { label: '허디거디', fam: 'medieval', icon: 'hurdy', color: '#a8613f', prog: 110, alias: 'hurdy gurdy 허디거디 중세 드론',
    p: { wave: 'sawtooth', mix2: .7, wave2: 'sawtooth', ratio2: .5, det2: 4, a: .06, d: .3, s: 1, r: .2, cut: 3.5, res: 3, trem: .1, tremRate: 9, noise: .05, formant: .4, lvl: .5, rev: .3 } },
  bagpipe:  { label: '백파이프', fam: 'medieval', icon: 'bagpipe', color: '#b5523b', prog: 109, alias: 'bagpipe 백파이프 켈틱 스코틀랜드 중세',
    p: { wave: 'square', mix2: .6, wave2: 'sawtooth', ratio2: .5, a: .02, d: .2, s: 1, r: .05, cut: 5, res: 4, formant: .5, lvl: .45, rev: .25 } },
  shawm:    { label: '숌', fam: 'medieval', icon: 'shawm', color: '#c96a52', prog: 111, alias: 'shawm 숌 오보에 리드 중세 축제',
    p: { wave: 'sawtooth', a: .03, d: .2, s: .9, r: .08, cut: 4, res: 5, vib: 5, vibDelay: .3, noise: .04, formant: .7, lvl: .5, rev: .3 } },
  chant:    { label: '수도사 성가', fam: 'medieval', icon: 'candle', color: '#9c7a5b', prog: 53, alias: 'chant monk gregorian 성가 그레고리안 수도사 합창 중세',
    p: { wave: 'sawtooth', mix2: .8, wave2: 'sawtooth', det2: 8, a: .4, d: .5, s: .9, r: .7, cut: 1.4, vib: 4, vibRate: 4.5, noise: .03, formant: 1, lvl: .6, rev: .65 } },
  handbell: { label: '핸드벨', fam: 'medieval', icon: 'handbell', color: '#e8c28a', prog: 112, alias: 'handbell 핸드벨 종 교회 크리스마스 중세',
    p: { wave: 'sine', fm: 1.6, fmRatio: 2.4, fmDec: .8, mix2: .2, wave2: 'sine', ratio2: 3.01, a: .001, d: 2.5, s: 0, r: 1.2, keytrack: .4, cut: 14, lvl: .9, rev: .5 } },
};
const FAMS = [['all','전체'], ['voice','보컬 · 목소리'], ['keys','건반'], ['str','현악'], ['wind','목관'], ['pluck','발현'], ['bell','벨 · 타악'], ['synth','합창 · 신스 · 베이스'], ['chip','16비트'], ['medieval','중세']];
// 테마: 악기 창 위쪽 2:1 블록 (좌우로 넘김)
const THEMES = [
  { id: 'all', name: '전체 악기', desc: '모든 악기 보기', icon: 'music', grad: ['#3a3f4b', '#15171c'], list: null },
  { id: 'voice', name: '보컬 · 노래', desc: '가사를 넣으면 노래하는 목소리', icon: 'mic', grad: ['#a03a6a', '#2a0f1f'],
    list: ['vocal','vidol','vhusky','vocalm','vbari','choir'] },
  { id: 'chip', name: '16비트 게임', desc: '칩튠 · FM 음원 · 레트로', icon: 'invader', grad: ['#1d7a40', '#0b2416'],
    list: ['chipsq','chip25','chip12','chiptri','chipbell','chipnoise','fmbrass','fmbass','snesstr','drums'] },
  { id: 'medieval', name: '중세 판타지', desc: '류트 · 하프 · 백파이프', icon: 'castle', grad: ['#7a5226', '#24170a'],
    list: ['lute','harp','recorder','harpsichord','dulcimer','hurdy','bagpipe','shawm','chant','handbell','organ','drums'] },
  { id: 'orch', name: '오케스트라', desc: '현악 · 목관 · 피아노', icon: 'violin', grad: ['#5a2f80', '#1b1230'],
    list: ['violin','viola','cello','strings','pizz','flute','flutesus','clarinet','harp','piano','celesta','chime','drums'] },
  { id: 'dream', name: '몽환 · 앰비언트', desc: '반짝임 · 잔향 · 패드', icon: 'moon', grad: ['#25458a', '#0d1530'],
    list: ['musicbox','celesta','epiano','choir','strings','bell','chime','harp','flutesus','chant','fx','snesstr'] },
  { id: 'xmas', name: '크리스마스', desc: '방울 · 종 · 합창', icon: 'tree', grad: ['#8a2230', '#1b3d24'],
    list: ['sleigh','bell','handbell','chime','celesta','musicbox','choir','strings','piano','flute','drums'] },
  { id: 'band', name: '밴드 · 팝', desc: '건반 · 베이스 · 드럼', icon: 'guitar', grad: ['#8a4220', '#2a130a'],
    list: ['piano','epiano','organ','bass','synth','fx','drums','strings','mandolin','cym'] },
  { id: 'kids', name: '동요 · 잔잔', desc: '맑고 귀여운 소리', icon: 'bear', grad: ['#8a7420', '#2a230a'],
    list: ['piano','musicbox','recorder','whistle','celesta','pizz','flute','mandolin','bell','harp','chipbell'] },
  { id: 'perc', name: '타악기 · 효과', desc: '드럼 · 심벌 · 노이즈', icon: 'drum', grad: ['#1f7070', '#0a2424'],
    list: ['drums','cym','sleigh','handbell','chime','chipnoise','fx'] },
];
const famName = f => (FAMS.find(x => x[0] === f) || [, ''])[1];
const preset = inst => INSTS[inst] && INSTS[inst].drum ? { ...DRUM_BASE } : JSON.parse(JSON.stringify({ ...BASE, ...(INSTS[inst] || INSTS.piano).p }));

// 드럼 키트: GM 드럼 번호 = 건반 번호 (36 킥 …). 레이어: t=음(파형,시작Hz,끝Hz,스윕,크기,감쇠) n=노이즈(필터,Hz,Q,크기,감쇠,떨림) c=클랩
const DK = {
  35: ['어쿠스틱 킥', [['t','sine',120,40,.14,1.2,.45]]],
  36: ['킥', [['t','sine',150,45,.12,1.2,.38], ['n','lowpass',3000,1,.15,.02]]],
  37: ['사이드스틱', [['t','triangle',1700,1500,.01,.6,.04], ['n','bandpass',3000,2,.4,.03]]],
  38: ['스네어', [['n','highpass',1200,1,.6,.2], ['t','triangle',190,140,.1,.5,.12]]],
  39: ['클랩', [['c']]],
  40: ['스네어 2', [['n','highpass',1800,1,.7,.16], ['t','triangle',220,170,.08,.4,.1]]],
  41: ['로우 플로어 탐', [['t','sine',95,65,.3,1,.5]]],
  42: ['닫힌 하이햇', [['n','highpass',7500,1,.45,.05]]],
  43: ['하이 플로어 탐', [['t','sine',115,80,.3,1,.45]]],
  44: ['페달 하이햇', [['n','highpass',7000,1,.35,.07]]],
  45: ['로우 탐', [['t','sine',140,95,.25,1,.4]]],
  46: ['열린 하이햇', [['n','highpass',7000,1,.4,.4]]],
  47: ['로우미드 탐', [['t','sine',165,115,.25,1,.38]]],
  48: ['하이미드 탐', [['t','sine',190,135,.22,1,.35]]],
  49: ['크래시', [['n','highpass',5000,1,.45,1.5], ['n','bandpass',3000,.8,.3,.25]]],
  50: ['하이 탐', [['t','sine',230,165,.2,1,.32]]],
  51: ['라이드', [['n','bandpass',6000,1.5,.3,1], ['t','sine',3200,3200,0,.08,.8]]],
  52: ['차이나', [['n','bandpass',4000,.7,.5,1.2]]],
  53: ['라이드 벨', [['t','square',820,820,0,.12,.7], ['t','square',1230,1230,0,.08,.6]]],
  54: ['탬버린', [['n','highpass',6500,1,.5,.25,18]]],
  55: ['스플래시', [['n','highpass',6000,1,.4,.6]]],
  56: ['카우벨', [['t','square',545,545,0,.15,.3], ['t','square',815,815,0,.1,.3]]],
  57: ['크래시 2', [['n','highpass',4500,1,.45,1.8]]],
  58: ['비브라슬랩', [['n','bandpass',2500,3,.4,.8,30]]],
  59: ['라이드 2', [['n','bandpass',5000,1.5,.3,1.1], ['t','sine',2900,2900,0,.08,.9]]],
  60: ['하이 봉고', [['t','sine',420,380,.05,.9,.15]]],
  61: ['로우 봉고', [['t','sine',310,280,.05,.9,.18]]],
  62: ['콩가 뮤트', [['t','sine',360,330,.03,.8,.08]]],
  63: ['하이 콩가', [['t','sine',330,300,.05,.9,.25]]],
  64: ['로우 콩가', [['t','sine',250,220,.05,.9,.3]]],
  65: ['하이 팀발레', [['t','triangle',520,480,.03,.7,.25], ['n','bandpass',3000,1,.2,.1]]],
  66: ['로우 팀발레', [['t','triangle',380,350,.03,.7,.3], ['n','bandpass',2500,1,.2,.1]]],
  67: ['하이 아고고', [['t','sine',920,920,0,.5,.35], ['t','sine',2300,2300,0,.15,.2]]],
  68: ['로우 아고고', [['t','sine',660,660,0,.5,.4], ['t','sine',1650,1650,0,.15,.2]]],
  69: ['카바사', [['n','highpass',6000,1,.35,.08]]],
  70: ['마라카스', [['n','highpass',7500,1,.35,.06]]],
  71: ['짧은 휘슬', [['t','sine',2300,2300,0,.35,.12]]],
  72: ['긴 휘슬', [['t','sine',2300,2250,.4,.35,.5]]],
  73: ['짧은 귀로', [['n','bandpass',3500,4,.5,.12,40]]],
  74: ['긴 귀로', [['n','bandpass',3500,4,.5,.35,40]]],
  75: ['클라베스', [['t','sine',2500,2500,0,.7,.06]]],
  76: ['하이 우드블록', [['t','sine',900,860,.02,.8,.08], ['n','bandpass',900,5,.3,.03]]],
  77: ['로우 우드블록', [['t','sine',650,620,.02,.8,.1]]],
  78: ['뮤트 쿠이카', [['t','sine',600,900,.1,.5,.12]]],
  79: ['오픈 쿠이카', [['t','sine',400,800,.2,.5,.3]]],
  80: ['뮤트 트라이앵글', [['t','sine',4500,4500,0,.3,.15], ['t','sine',6300,6300,0,.15,.1]]],
  81: ['오픈 트라이앵글', [['t','sine',4500,4500,0,.3,1.6], ['t','sine',6300,6300,0,.15,1.2]]],
};

// 색: 악기마다 기본색, 같은 악기 트랙끼리는 밝기만 다르게
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  const t = a > 0 ? 255 : 0, k = Math.abs(a);
  return '#' + c.map(v => Math.round(v + (t - v) * k).toString(16).padStart(2, '0')).join('');
}
const SHADES = [0, .22, -.2, .38, -.35];
function pickColor(inst, self) {
  const base = (INSTS[inst] || INSTS.piano).color, pal = SHADES.map(a => shade(base, a));
  const others = S.tracks.filter(t => t !== self && t.inst === inst), used = new Set(others.map(t => t.color));
  return pal.find(c => !used.has(c)) || pal[others.length % pal.length];
}

// ───────── 상태 ─────────
const mkTrack = (id, inst, name) => ({ id, name: name || INSTS[inst].label, inst, color: null, vol: 1, mute: false, solo: false, snd: preset(inst) });
const defaults = () => ({
  notes: [], bpm: 100, grid: 2, bars: 32, key: 'off', labelMode: 'sol', metro: true, countin: true,
  tracks: [mkTrack(1, 'piano', '피아노')], folders: [],   // 새 곡: 기본 악기는 피아노 하나
  active: 1, nextId: 2, tool: 'pen', pal: { docked: false, x: null, y: null }, zoomX: 22, zoomY: 18,
});
let S = defaults();
// ── 곡 라이브러리: 곡마다 따로 저장(hc-proj-<id>), 화면 설정은 공통(hc-settings), 목록은 hc-library
const PKEYS = ['notes', 'bpm', 'grid', 'bars', 'key', 'labelMode', 'tracks', 'active', 'nextId', 'folders'];
const LIB_KEY = 'hc-library', SET_KEY = 'hc-settings', PROJ = id => 'hc-proj-' + id;
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
let storageWarned = false;
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { if (!storageWarned) { storageWarned = true; setTimeout(() => toast('브라우저 저장 공간이 부족해요. 마이페이지에서 곡을 내보내고 정리해 주세요'), 0); } return false; } };
const pickProject = src => { const o = {}; PKEYS.forEach(k => o[k] = src[k]); return o; };
const pickSettings = src => { const o = {}; Object.keys(src).forEach(k => { if (!PKEYS.includes(k)) o[k] = src[k]; }); return o; };
const blankProject = () => pickProject(defaults());
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let LIB = lsGet(LIB_KEY);
if (!LIB || !Array.isArray(LIB.items) || !LIB.items.length) {
  // 이전 버전(곡 하나만 저장) → 라이브러리의 첫 곡으로 옮김
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    if (d && Array.isArray(d.notes) && Array.isArray(d.tracks) && d.tracks.length) Object.assign(S, d);
    else {
      const o = JSON.parse(localStorage.getItem('humming-composer-v1'));
      if (o && Array.isArray(o.notes)) {
        ['bpm','grid','bars','key','labelMode'].forEach(k => { if (o[k] != null) S[k] = o[k]; });
        S.notes = o.notes.map(n => ({ p: n.p, s: n.s, l: n.l, t: n.p < 0 ? 3 : 1 }));
      }
    }
  } catch (e) {}
  const id = newId(), now = Date.now();
  LIB = { cur: id, items: [{ id, name: S.notes.length ? '내 첫 곡' : '새 곡', created: now, updated: now }] };
  LIB.migrate = true;
} else {
  Object.assign(S, lsGet(SET_KEY) || {});
  if (!LIB.items.some(i => i.id === LIB.cur)) LIB.cur = LIB.items[0].id;
  const p = lsGet(PROJ(LIB.cur));
  Object.assign(S, blankProject(), p || {});
}
// 곡 데이터 정리 (이전 버전 호환)
const OLD_DRUM_GM = [49, 46, 42, 50, 45, 39, 38, 36];
function fixupProject() {
  if (!Array.isArray(S.tracks) || !S.tracks.length) Object.assign(S, blankProject());
  if (!Array.isArray(S.notes)) S.notes = [];
  S.tracks.forEach(t => {
    if (t.inst === 'basic') t.inst = 'synth';
    if (!INSTS[t.inst]) t.inst = 'piano';
    if (!t.snd) t.snd = preset(t.inst);
    else if (INSTS[t.inst].vocal) t.snd = { ...preset(t.inst), ...t.snd };   // 새로 생긴 보컬 설정값 채우기
  });
  if (S.notes.some(n => n.p < 0)) {   // 예전 '아래쪽 타악기 줄' 노트 → 드럼 키트 트랙으로
    let dt = S.tracks.find(t => t.inst === 'drums');
    if (!dt) { dt = mkTrack(S.nextId++, 'drums', '드럼'); S.tracks.push(dt); }
    S.notes.forEach(n => { if (n.p < 0) { n.p = OLD_DRUM_GM[-1 - n.p] || 36; n.t = dt.id; } });
  }
  S.notes.forEach(n => { if (!S.tracks.some(t => t.id === n.t)) n.t = S.tracks[0].id; });
  if (!S.tracks.some(t => t.id === S.active)) S.active = S.tracks[0].id;
  S.nextId = Math.max(S.nextId || 1, ...S.tracks.map(t => t.id + 1));
  S.tracks.forEach(t => { if (!t.color) t.color = pickColor(t.inst, t); });
  if (!Array.isArray(S.folders)) S.folders = [];
  normFolders();
}
if (!S.instColors2) { S.tracks.forEach(t => t.color = null); S.instColors2 = true; }
fixupProject();
if (!S.pal) S.pal = { docked: false, x: null, y: null };
if (!CURSOR[S.tool]) S.tool = 'pen';
STEP_W = clamp(S.zoomX || 22, 4, 90); ROW_H = clamp(S.zoomY || 18, 6, 40);
if (!S.zxMob && (matchMedia('(pointer:coarse)').matches || window.innerWidth <= 760 || window.innerHeight > window.innerWidth)) {   // 폰·세로 화면: 16분음표를 넓게 (한 번만 적용, 이후엔 확대/축소 값 그대로)
  S.zxMob = true; if (STEP_W < 36) STEP_W = 36; S.zoomX = STEP_W;
}

const curItem = () => LIB.items.find(i => i.id === LIB.cur);
let lastProjJSON = null;
function writeProject() {   // 바뀐 곡만 저장 + 수정 시각 갱신
  const j = JSON.stringify(pickProject(S));
  if (j !== lastProjJSON) {
    try { localStorage.setItem(PROJ(LIB.cur), j); lastProjJSON = j; } catch (e) { lsSet('__fail', 0); return; }
    const it = curItem(); if (it) it.updated = Date.now();
    lsSet(LIB_KEY, LIB);
  }
}
const save = () => { if (ON_MYPAGE) return; lsSet(SET_KEY, pickSettings(S)); writeProject(); renderList(); };
if (LIB.migrate) { delete LIB.migrate; lsSet(LIB_KEY, LIB); }
lastProjJSON = null; writeProject();
let saveT; const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 250); };
const trk = id => S.tracks.find(t => t.id === id);
const activeTrack = () => trk(S.active);
const isDrumTrack = t => t && t.inst === 'drums';
const isVocalTrack = t => !!(t && INSTS[t.inst] && INSTS[t.inst].vocal);
let lyNote = null;   // 가사 입력 중인 노트
const fldOf = t => t && t.folder != null ? (S.folders || []).find(f => f.id === t.folder) : null;
const audible = t => {
  const f = fldOf(t), anySolo = S.tracks.some(x => x.solo || (fldOf(x) || {}).solo);
  return anySolo ? !!(t.solo || (f && f.solo)) : !(t.mute || (f && f.mute));
};
// 폴더: 같은 폴더의 트랙은 목록에서 붙어 있게 정리, 빈 폴더 · 잘못된 참조 정리
function normFolders() {
  if (!Array.isArray(S.folders)) S.folders = [];
  const ids = new Set(S.folders.map(f => f.id));
  S.tracks.forEach(t => { if (t.folder != null && !ids.has(t.folder)) delete t.folder; });
  const out = [], done = new Set();
  for (const t of S.tracks) {
    if (out.includes(t)) continue;
    if (t.folder == null) { out.push(t); continue; }
    if (done.has(t.folder)) continue;
    done.add(t.folder); out.push(...S.tracks.filter(x => x.folder === t.folder));
  }
  S.tracks = out;
  S.folders = S.folders.filter(f => f.keep || S.tracks.some(t => t.folder === f.id));   // keep: 사용자가 만든 빈 폴더는 유지
}

let playhead = 0, mode = 'idle';
let sel = new Set(), drag = null, clip = null;
let undoStack = [], redoStack = [];
let liveMidi = null, trace = [], rec = null;
let hoverP = null;   // 마우스가 가리키는 음 높이

// ───────── 유틸 ─────────
const name = p => (S.labelMode === 'sol' ? SOL : ABC)[p % 12] + (Math.floor(p / 12) - 1);
const noteLabel = (p, t) => isDrumTrack(t) ? (DK[p] ? DK[p][0] : '') : name(p);
const inScale = p => S.key === 'off' || MAJOR.includes(((p - +S.key) % 12 + 12) % 12);
function snapPitch(mf) {
  if (S.key === 'off') return Math.round(mf);
  let best = null, bd = 9;
  for (let m = Math.floor(mf) - 1; m <= Math.ceil(mf) + 1; m++)
    if (inScale(m) && Math.abs(m - mf) < bd) { bd = Math.abs(m - mf); best = m; }
  return best;
}
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const snapshot = () => JSON.stringify({ n: S.notes, t: S.tracks, a: S.active, f: S.folders });
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(json) { const d = JSON.parse(json); S.notes = d.n; S.tracks = d.t; S.active = d.a; S.folders = d.f || []; sel = new Set(); save(); renderInspector(); drawAll(); }
function undo() { if (mode !== 'idle') return; const s = undoStack.pop(); if (!s) return toast('되돌릴 작업이 없어요'); redoStack.push(snapshot()); restore(s); }
function redo() { if (mode !== 'idle') return; const s = redoStack.pop(); if (!s) return toast('다시 실행할 작업이 없어요'); undoStack.push(snapshot()); restore(s); }

// ───────── 오디오 엔진 ─────────
let ac = null, master = null, revIn = null; const voices = new Set(), buses = {};
const SOFT_CURVE = (() => {   // 소프트 클리퍼: 0.8 아래는 그대로, 그 위는 부드럽게 눌러서 1을 넘지 않게 (입력 ±2 범위)
  const N = 4096, k = new Float32Array(N);
  for (let i = 0; i < N; i++) { const y = (i / (N - 1) * 2 - 1) * 2, a = Math.abs(y); k[i] = Math.sign(y) * (a < 0.8 ? a : 0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2)); }
  return k;
})();
function mkMaster(c) {   // 마스터: 게인 → 컴프레서(뭉치기) → 리미터 → 소프트 클리퍼 → 출력 (+ 합성 임펄스 리버브)
  // 노트가 많이 겹치면 합이 0dB를 넘어 '찌직' 깨지던 문제 → 리미터가 먼저 누르고, 남는 순간 피크는 클리퍼가 부드럽게 정리
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  const lim = c.createDynamicsCompressor();
  lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
  const pre = c.createGain(); pre.gain.value = 0.5;   // 셰이퍼 입력 범위(±1)에 ±2를 담기 위해 반으로
  const sh = c.createWaveShaper(); sh.curve = SOFT_CURVE; sh.oversample = '2x';
  const m = c.createGain(); m.gain.value = 0.8; m.connect(comp); comp.connect(lim); lim.connect(pre); pre.connect(sh); sh.connect(c.destination);
  const len = Math.floor(c.sampleRate * 2.6), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = c.createConvolver(); conv.buffer = buf;
  const rvPre = c.createBiquadFilter(); rvPre.type = 'lowpass'; rvPre.frequency.value = 6500;
  const rg = c.createGain(); rg.gain.value = 0.75;
  rvPre.connect(conv); conv.connect(rg); rg.connect(m);
  return { master: m, revIn: rvPre };
}
function AC() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    ({ master, revIn } = mkMaster(ac));
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function bus(t) {   // 트랙별 믹서: 볼륨 → 팬 → 마스터 (+리버브 센드)
  let b = buses[t.id];
  if (!b) {
    b = { in: ac.createGain(), pan: ac.createStereoPanner(), send: ac.createGain() };
    b.in.connect(b.pan); b.pan.connect(master); b.pan.connect(b.send); b.send.connect(revIn);
    buses[t.id] = b;
  }
  b.in.gain.value = t.vol * (t.snd.lvl ?? 1); b.pan.pan.value = t.snd.pan || 0; b.send.gain.value = t.snd.rev || 0;
  return b.in;
}
const m2f = m => 440 * Math.pow(2, (m - 69) / 12);
function trackNode(o) { voices.add(o); o.onended = () => voices.delete(o); }
function osc(type, f, when, stopAt) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.start(when); o.stop(stopAt); trackNode(o); return o; }
function killVoices() { for (const o of voices) { try { o.stop(); } catch (e) {} } voices.clear(); }
let noiseBuf = null;
function noise(when, stopAt) {
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(when); s.stop(stopAt); trackNode(s); return s;
}
function filt(type, f, q = 1) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function envTo(dest, when, peak, decay) { const g = ac.createGain(); g.gain.setValueAtTime(Math.max(peak, 0.0002), when); g.gain.exponentialRampToValueAtTime(0.0001, when + decay); g.connect(dest); return g; }
const waveCaches = new WeakMap();   // PeriodicWave는 만든 오디오 컨텍스트에서만 쓸 수 있어서 컨텍스트마다 따로 보관
function periodic(h) {
  let wc = waveCaches.get(ac); if (!wc) waveCaches.set(ac, wc = {});
  const k = h.join(','); if (!wc[k]) { const im = new Float32Array([0, ...h]); wc[k] = ac.createPeriodicWave(new Float32Array(im.length), im); } return wc[k];
}
function mkOsc(type, harm, f, when, stopAt) {
  const o = ac.createOscillator();
  if (type === 'harm') o.setPeriodicWave(periodic(harm || [1, .5, .33, .25])); else o.type = type;
  o.frequency.value = f; o.start(when); o.stop(stopAt); trackNode(o); return o;
}

// 파라메트릭 신스 한 음
function synthNote(P, m, when, dur, vel, out, bends) {   // bends: [{t: 시각, m: 음}] — 이어진 노트로 음높이만 부드럽게 옮김 (다시 치지 않음)
  const f = m2f(m + 12 * P.oct), end = when + dur;
  const kt = Math.pow(2, (60 - m) / 24 * P.keytrack);
  const A = Math.max(0.001, P.a), D = Math.max(0.01, P.d * kt), Sus = clamp(P.s, 0, 1), R = Math.max(0.02, P.r);
  const relAt = Math.max(end, when + A + 0.002), stopAt = relAt + R * 1.8 + 0.05;
  const mix = ac.createGain(), lp = filt('lowpass', 1000, P.res), amp = ac.createGain();
  // 필터 (밝기 + 어택 밝기)
  const cut = Math.min(18000, f * P.cut);
  if (P.fenv > 0) { lp.frequency.setValueAtTime(Math.min(18000, cut * (1 + P.fenv)), when); lp.frequency.setTargetAtTime(cut, when + 0.001, Math.max(0.01, P.fdec) / 3); }
  else lp.frequency.value = cut;
  let chain = mix;
  if (P.formant > 0) {   // 보컬 '아' 포먼트
    [[730, 6], [1090, 5], [2440, 3]].forEach(([fr, gdb]) => { const pk = filt('peaking', fr, 5); pk.gain.value = gdb * 2 * P.formant; chain.connect(pk); chain = pk; });
  }
  chain.connect(lp);
  let post = lp;
  if (P.trem > 0) {   // 트레몰로 (만돌린 연주, 일렉피아노, 슬레이벨 떨림)
    const tg = ac.createGain(); tg.gain.value = 1 - P.trem / 2;
    const l = osc('triangle', P.tremRate, when, stopAt), lg = ac.createGain(); lg.gain.value = P.trem / 2;
    l.connect(lg); lg.connect(tg.gain); post.connect(tg); post = tg;
  }
  post.connect(amp); amp.connect(out);
  // 발음체
  const oscs = [];
  if (P.tone > 0) { const o = mkOsc(P.wave, P.harm, f, when, stopAt), g = ac.createGain(); g.gain.value = P.tone; o.connect(g); g.connect(mix); oscs.push([o, f]); }
  if (P.mix2 > 0) {
    const f2 = f * P.ratio2 * Math.pow(2, P.det2 / 1200), o = mkOsc(P.wave2, null, f2, when, stopAt), g = ac.createGain();
    g.gain.value = P.mix2; o.connect(g); g.connect(mix); oscs.push([o, f2]);
  }
  if (P.bend) oscs.forEach(([o, fr]) => { o.frequency.setValueAtTime(fr * Math.pow(2, P.bend / 12), when); o.frequency.setTargetAtTime(fr, when, 0.06); });
  if (P.fm > 0 && oscs.length) {   // FM: 금속성/벨 느낌
    const mo = osc('sine', f * P.fmRatio, when, stopAt), mg = ac.createGain();
    mg.gain.setValueAtTime(f * P.fm, when); mg.gain.setTargetAtTime(f * P.fm * 0.06, when, Math.max(0.01, P.fmDec) / 3);
    mo.connect(mg); oscs.forEach(([o]) => mg.connect(o.frequency));
  }
  if (P.vib > 0 && oscs.length) {
    const l = osc('sine', P.vibRate, when, stopAt), lg = ac.createGain();
    const depth = f * (Math.pow(2, P.vib / 1200) - 1);
    lg.gain.setValueAtTime(0, when); lg.gain.setValueAtTime(0, when + P.vibDelay); lg.gain.linearRampToValueAtTime(depth, when + P.vibDelay + 0.25);
    l.connect(lg); oscs.forEach(([o]) => lg.connect(o.frequency));
  }
  if (P.noise > 0) {
    const n = noise(when, stopAt), bp = filt('bandpass', P.nHz > 0 ? P.nHz : Math.min(16000, f * 2), P.nQ), ng = ac.createGain();
    ng.gain.value = P.noise; n.connect(bp); bp.connect(ng); ng.connect(mix);
  }
  if (bends && bends.length) {
    const prm = [...oscs.map(([o, fr]) => [o.frequency, fr]), [lp.frequency, cut]];
    for (const b of bends) {
      const r = Math.pow(2, (b.m - m) / 12), gt = b.gt || 0.07;
      prm.forEach(([pa, base]) => { pa.setTargetAtTime(Math.min(18000, base * r), Math.max(when, b.t - gt * 0.5), gt / 3); });
    }
  }
  // 앰프 엔벨로프 (ADSR)
  const g = amp.gain;
  g.setValueAtTime(0, when); g.linearRampToValueAtTime(vel, when + A);
  g.setTargetAtTime(vel * Sus, when + A, D / 3);
  g.setTargetAtTime(0, relAt, R / 3);
}

function drumHit(m, when, vel, t) {
  const def = DK[m]; if (!def) return;
  const sp = t.snd, out = bus(t), tune = Math.pow(2, (sp.tune || 0) / 12), dl = sp.dlen || 1, v = vel * 4;
  for (const L of def[1]) {
    if (L[0] === 't') {
      const [, w, f0, f1, sw, gn, dec] = L, o = osc(w, f0 * tune, when, when + dec * dl + 0.05);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1 * tune, when + Math.max(0.005, sw));
      o.connect(envTo(out, when, v * gn, dec * dl));
    } else if (L[0] === 'n') {
      const [, ft, fr, q, gn, dec, rate] = L, n = noise(when, when + dec * dl + 0.05), fl = filt(ft, Math.min(16000, fr * tune), q), e = envTo(out, when, v * gn, dec * dl);
      n.connect(fl);
      if (rate) { const tg = ac.createGain(); tg.gain.value = 0.5; const l = osc('square', rate, when, when + dec * dl + 0.05), lg = ac.createGain(); lg.gain.value = 0.5; l.connect(lg); lg.connect(tg.gain); fl.connect(tg); tg.connect(e); }
      else fl.connect(e);
    } else if (L[0] === 'c') {
      const bp = filt('bandpass', 1300 * tune, 1.5), g = ac.createGain(); bp.connect(g); g.connect(out);
      noise(when, when + 0.3 * dl + 0.05).connect(bp);
      g.gain.setValueAtTime(0, when);
      [0, 0.012, 0.024].forEach(x => { g.gain.setValueAtTime(v * 0.9, when + x); g.gain.exponentialRampToValueAtTime(0.05, when + x + 0.01); });
      g.gain.setValueAtTime(v * 0.7, when + 0.036); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.25 * dl);
    }
  }
}
const VEL = 0.2;
// ── 이어 부르기(글라이드): gl 표시된 노트는 바로 앞에 붙은 노트에서 '다시 치지 않고' 음높이만 미끄러져 넘어가요 ──
let GL = new WeakMap();
function glPrev(n, list) {   // 같은 트랙에서 n 시작점에 딱 끝나는 노트 (여럿이면 가장 가까운 음)
  let best = null;
  for (const m of list) if (m !== n && m.t === n.t && m.s + m.l === n.s && m.s < n.s && (!best || Math.abs(m.p - n.p) < Math.abs(best.p - n.p))) best = m;
  return best;
}
function buildGlides(list, fromStep = 0) {   // 재생 전에: 이어진 노트 줄(chain)을 머리 노트 하나로 묶음
  GL = new WeakMap();
  const cand = list.filter(n => n.gl);
  if (!cand.length) return;
  const nextOf = new Map();
  for (const n of cand) {
    const t = trk(n.t); if (!t || isVocalTrack(t) || isDrumTrack(t)) continue;
    const pv = glPrev(n, list); if (pv && !nextOf.has(pv)) nextOf.set(pv, n);
  }
  const ss = stepSec();
  for (const [pv, n] of nextOf) {
    if (n.s <= fromStep) continue;   // 재생 시작점보다 앞에서 끊긴 줄: 이 노트부터 새로 시작
    GL.set(n, { skip: true });
  }
  for (const head of nextOf.keys()) {
    if (GL.get(head) && GL.get(head).skip) continue;
    const bends = []; let cur = head, x = nextOf.get(head);
    while (x && GL.get(x) && GL.get(x).skip) {
      const gt = Math.min(0.09, 0.45 * cur.l * ss, 0.45 * x.l * ss);
      bends.push({ s: x.s, m: x.p, gt }); cur = x; x = nextOf.get(x);
    }
    if (bends.length) GL.set(head, { end: cur.s + cur.l, bends });
  }
}
function tone(m, when, dur, t, v = 1, n) {   // v: 세기(벨로시티 0~1), n: 노트(보컬 가사·앞뒤 연결용)
  if (isVocalTrack(t)) return singNote(m, when, dur, t, v, n);
  const gp = n && GL.get(n);
  if (gp) {
    if (gp.skip) return;
    const ss = stepSec(), headEnd = when + dur, hEndStep = n.s + n.l;
    const vv = VEL * (v !== 1 ? (0.15 + 0.85 * v) : 1);
    return synthNote(t.snd, m, when, dur + (gp.end - hEndStep) * ss, vv, bus(t), gp.bends.map(b => ({ t: headEnd + (b.s - hEndStep) * ss, m: b.m, gt: b.gt })));
  }
  if (v !== 1) { const vv = VEL * (0.15 + 0.85 * v); return isDrumTrack(t) ? drumHit(m, when, vv, t) : synthNote(t.snd, m, when, dur, vv, bus(t)); }
  if (isDrumTrack(t)) return drumHit(m, when, VEL, t);
  synthNote(t.snd, m, when, dur, VEL, bus(t));
}
function click(when, accent) {
  const o = osc('square', accent ? 1760 : 1100, when, when + 0.05), g = ac.createGain();
  g.gain.setValueAtTime(accent ? 0.12 : 0.07, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  o.connect(g); g.connect(master);
}
function preview(p, t = activeTrack()) { AC(); tone(p, ac.currentTime + 0.01, 0.35, t); }
function previewPhrase(t) {   // 악기 미리 듣기
  AC(); const t0 = ac.currentTime + 0.05;
  if (isVocalTrack(t)) {   // 보컬: 짧은 한 소절을 가사로 불러 봄
    const lo = (t.snd.vSex ?? 1) < .9 ? -12 : 0, ss = stepSec();
    const notes = [[60,0,2,'안'],[62,2,2,'녕'],[64,4,2,'하'],[67,6,2,'세'],[64,8,6,'요']].map(([p, s, l, ly]) => ({ p: p + lo, s, l, ly }));
    const ph = KV.model(notes, ss).phrases[0], src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = vocalBuffer(ph, t.snd); g.gain.value = VOCAL_GAIN; src.connect(g); g.connect(bus(t)); src.start(t0); trackNode(src);
    return;
  }
  if (isDrumTrack(t)) { [[36,0],[42,.0],[42,.25],[38,.5],[42,.5],[42,.75],[36,1],[36,1.25],[42,1.25],[38,1.5],[46,1.5],[49,2]].forEach(([p, x]) => tone(p, t0 + x * 0.5, 0.2, t)); return; }
  [60, 64, 67, 72].forEach((p, i) => tone(p, t0 + i * 0.22, 0.3, t));
  [60, 64, 67].forEach(p => tone(p, t0 + 0.95, 0.9, t));
}

// ───────── 한국어 보컬 합성 (Thaniya Voice · 포먼트 방식) ─────────
// 가사(한글) → 발음 규칙(연음·비음화·경음화·격음화·구개음화) → 음소 시간표 → 포먼트 합성
// 소리: 성대 음원(톱니파 + 숨소리) → 성도 공명(포먼트 5개 직렬) + 자음 노이즈(ㅅ·ㅈ·파열음 터짐)
const KV = (() => {
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = [['','a'],['','e'],['j','a'],['j','e'],['','eo'],['','e'],['j','eo'],['j','e'],['','o'],['w','a'],['w','e'],['w','e'],['j','o'],['','u'],['w','eo'],['w','e'],['w','i'],['j','u'],['','eu'],['ɰ','i'],['','i']];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  // 받침 → [남는 받침, 뒤 글자가 'ㅇ'으로 시작할 때 넘어가는 자음]
  const LIAISON = { '':['',''], 'ㄱ':['','ㄱ'], 'ㄲ':['','ㄲ'], 'ㄳ':['ㄱ','ㅆ'], 'ㄴ':['','ㄴ'], 'ㄵ':['ㄴ','ㅈ'], 'ㄶ':['','ㄴ'], 'ㄷ':['','ㄷ'], 'ㄹ':['','ㄹ'],
    'ㄺ':['ㄹ','ㄱ'], 'ㄻ':['ㄹ','ㅁ'], 'ㄼ':['ㄹ','ㅂ'], 'ㄽ':['ㄹ','ㅆ'], 'ㄾ':['ㄹ','ㅌ'], 'ㄿ':['ㄹ','ㅍ'], 'ㅀ':['','ㄹ'], 'ㅁ':['','ㅁ'], 'ㅂ':['','ㅂ'], 'ㅄ':['ㅂ','ㅆ'],
    'ㅅ':['','ㅅ'], 'ㅆ':['','ㅆ'], 'ㅇ':['ㅇ',''], 'ㅈ':['','ㅈ'], 'ㅊ':['','ㅊ'], 'ㅋ':['','ㅋ'], 'ㅌ':['','ㅌ'], 'ㅍ':['','ㅍ'], 'ㅎ':['',''] };
  // 받침 대표음 (7종성)
  const REP = { 'ㄱ':'k','ㄲ':'k','ㅋ':'k','ㄳ':'k','ㄺ':'k', 'ㄴ':'n','ㄵ':'n','ㄶ':'n', 'ㄷ':'t','ㅅ':'t','ㅆ':'t','ㅈ':'t','ㅊ':'t','ㅌ':'t','ㅎ':'t',
    'ㄹ':'l','ㄼ':'l','ㄽ':'l','ㄾ':'l','ㅀ':'l', 'ㅁ':'m','ㄻ':'m', 'ㅂ':'p','ㅍ':'p','ㅄ':'p','ㄿ':'p', 'ㅇ':'ng' };
  // 첫소리: [방식, 위치, 종류(L 예사 · A 거센 · T 된)]
  const ON = { 'ㄱ':['stop','vel','L'], 'ㄲ':['stop','vel','T'], 'ㅋ':['stop','vel','A'], 'ㄷ':['stop','alv','L'], 'ㄸ':['stop','alv','T'], 'ㅌ':['stop','alv','A'],
    'ㅂ':['stop','lab','L'], 'ㅃ':['stop','lab','T'], 'ㅍ':['stop','lab','A'], 'ㅈ':['affr','pal','L'], 'ㅉ':['affr','pal','T'], 'ㅊ':['affr','pal','A'],
    'ㅅ':['fric','alv','L'], 'ㅆ':['fric','alv','T'], 'ㅎ':['h','glot','A'], 'ㄴ':['nas','alv',''], 'ㅁ':['nas','lab',''], 'ㄹ':['liq','alv',''] };
  const TENSE = { 'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ' }, ASP = { 'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅂ':'ㅍ','ㅈ':'ㅊ' };
  const MEL = /^[-~ー_]$/;

  function parse(ch) {
    const c = ch.charCodeAt(0) - 0xAC00;
    if (!(c >= 0 && c <= 11171)) return null;
    const ju = JUNG[((c % 588) / 28) | 0];
    return { on: CHO[(c / 588) | 0], gl: ju[0], v: ju[1], jo: JONG[c % 28] };
  }
  // 가사 글을 노트 단위 토큰으로: 한글 한 글자 = 1, '-'(늘이기) = 1, 나머지(띄어쓰기·문장부호)는 무시
  function tokens(text) {
    const out = [];
    for (const ch of String(text || '')) if (parse(ch) || MEL.test(ch)) out.push(MEL.test(ch) ? '-' : ch);
    return out;
  }

  // 발음 규칙: 이어지는 글자끼리 (sy: [{on,gl,v,jo, link(다음 글자와 이어 부름)}])
  function g2p(sy) {
    for (let i = 0; i < sy.length; i++) {
      const a = sy[i], b = a.link ? sy[i + 1] : null;
      let cd = a.jo ? REP[a.jo] : '';
      if (b && b.on === 'ㅇ' && a.jo && a.jo !== 'ㅇ') {   // 연음: 받침이 뒤로 넘어감
        const [stay, move] = LIAISON[a.jo];
        if (move) { let m = move; if ((m === 'ㄷ' || m === 'ㅌ') && b.v === 'i' && !b.gl) m = m === 'ㄷ' ? 'ㅈ' : 'ㅊ'; b.on = m; }
        cd = stay ? REP[stay] : '';
      } else if (b) {
        const h = a.jo === 'ㅎ' || a.jo === 'ㄶ' || a.jo === 'ㅀ', rest = a.jo === 'ㄶ' ? 'n' : a.jo === 'ㅀ' ? 'l' : '';
        if (h && ASP[b.on]) { b.on = ASP[b.on]; cd = rest; }                       // 좋다 → 조타
        else if (h && b.on === 'ㅅ') { b.on = 'ㅆ'; cd = rest; }                    // 좋소 → 조쏘
        else if (a.jo === 'ㅎ' && b.on === 'ㄴ') cd = 'n';                          // 놓는 → 논는
        else if (cd === 'k' || cd === 't' || cd === 'p') {
          const nas = { k: 'ng', t: 'n', p: 'm' }[cd];
          if (b.on === 'ㅎ') { b.on = { k: 'ㅋ', t: 'ㅌ', p: 'ㅍ' }[cd]; cd = ''; }   // 축하 → 추카
          else if (b.on === 'ㄴ' || b.on === 'ㅁ') cd = nas;                        // 합니다 → 함니다
          else if (b.on === 'ㄹ') { cd = nas; b.on = 'ㄴ'; }                        // 백로 → 뱅노
          else if (TENSE[b.on]) b.on = TENSE[b.on];                                 // 학교 → 학꾜
        }
        else if ((cd === 'm' || cd === 'ng') && b.on === 'ㄹ') b.on = 'ㄴ';           // 심리 → 심니
        else if (cd === 'n' && b.on === 'ㄹ') cd = 'l';                             // 신라 → 실라
        else if (cd === 'l' && b.on === 'ㄴ') b.on = 'ㄹ';                          // 설날 → 설랄
        else if ((cd === 'n' || cd === 'l' || cd === 'm' || cd === 'ng') && b.on === 'ㅎ') b.hw = true;   // 말해 → 약한 ㅎ
      }
      a.cd = cd;
    }
    for (const a of sy) {   // 소리 나는 대로 모음 정리
      if (a.gl === 'ɰ' && a.on !== 'ㅇ') a.gl = '';                 // 희망 → 히망
      if (a.gl === 'j' && 'ㅈㅉㅊ'.includes(a.on)) a.gl = '';       // 져 → 저
      if (a.gl === 'j' && a.v === 'e' && a.on !== 'ㅇ' && a.on !== 'ㄹ') a.gl = '';   // 시계 → 시게
    }
    return sy;
  }

  // 노트 → 음절 단위(unit) → 발음 → 프레이즈(쉬지 않고 이어지는 노트 묶음)
  // notes: 한 트랙의 노트 [{p,s,l,ly,v}], ss: 스텝 길이(초)
  function model(notes, ss, defLy = '라') {
    const ns = notes.slice().sort((a, b) => a.s - b.s || b.p - a.p), units = [];
    for (const n of ns) {
      let tk = tokens(n.ly); if (!tk.length) tk = [n.gl ? '-' : defLy];   // 이어 부르기(gl) 노트에 가사가 없으면 앞 글자를 끌어서 한 음처럼
      const t0 = n.s * ss, d = n.l * ss / tk.length;
      tk.forEach((ch, k) => units.push({ n, ch, p: n.p, v: n.v ?? 1, t0: t0 + k * d, t1: t0 + (k + 1) * d }));
    }
    // 음절: 새 글자마다 하나, '-'는 앞 음절에 붙음
    const sy = []; let cur = null;
    units.forEach((u, i) => {
      const prev = units[i - 1], touch = prev && Math.abs(u.t0 - prev.t1) < 0.004;
      if (u.ch === '-' && cur && touch) { u.sy = cur; cur.units.push(u); return; }
      let ps = u.ch === '-' ? null : parse(u.ch);
      if (!ps) ps = { on: 'ㅇ', gl: '', v: cur ? cur.v : 'a', jo: '' };
      cur = { ...ps, units: [u] }; u.sy = cur; sy.push(cur);
    });
    sy.forEach((a, i) => { const b = sy[i + 1]; a.link = !!b && b.units[0].t0 - a.units[a.units.length - 1].t1 < 0.35 && b.units[0].t0 >= a.units[0].t0 + 1e-6; });
    g2p(sy);
    // 프레이즈
    const phrases = []; let ph = null;
    units.forEach((u, i) => {
      const prev = units[i - 1];
      if (!ph || !(prev && Math.abs(u.t0 - prev.t1) < 0.004 && u.t0 > prev.t0 + 1e-6)) { ph = { units: [] }; phrases.push(ph); }
      ph.units.push(u); u.ph = ph;
    });
    const info = new Map();
    for (const ph of phrases) {
      const T0 = ph.units[0].t0; ph.t0 = T0; ph.len = ph.units[ph.units.length - 1].t1 - T0;
      // 프레이즈 안 음절 목록 (프레이즈 경계에서 '-'가 잘리면 새 음절로)
      ph.sy = []; let last = null;
      for (const u of ph.units) {
        if (u.sy !== last) {
          last = u.sy;
          const first = ph.sy.length === 0, cont = first && u.sy.units[0] !== u;   // 앞 프레이즈에서 이어진 '-'
          ph.sy.push({ on: cont ? 'ㅇ' : u.sy.on, gl: cont ? '' : u.sy.gl, v: u.sy.v, cd: u.sy.cd, hw: !cont && u.sy.hw, ts: u.t0 - T0, te: u.t1 - T0 });
        } else ph.sy[ph.sy.length - 1].te = u.t1 - T0;
      }
      ph.key = JSON.stringify([ph.units.map(u => [+(u.t0 - T0).toFixed(4), +(u.t1 - T0).toFixed(4), u.p, +u.v.toFixed(3), u.n && u.n.gl ? 1 : 0]),
        ph.sy.map(s => [s.on, s.gl, s.v, s.cd, s.hw ? 1 : 0])]);
      for (const u of ph.units) {
        const r = info.get(u.n);
        if (!r) info.set(u.n, { ph, a: u.t0 - T0, b: u.t1 - T0 }); else r.b = u.t1 - T0;
      }
    }
    return { units, phrases, info };
  }

  // ── 소리 재료 (여성 목소리 기준 · 음색 슬라이더로 비례 조정)
  const VOW = { a: [880, 1450, 2800, 3900], e: [560, 2050, 2850, 3900], eo: [640, 1120, 2750, 3800], o: [470, 860, 2700, 3700],
    u: [370, 950, 2650, 3700], eu: [420, 1600, 2750, 3800], i: [330, 2650, 3250, 4100] };
  const GLIDE = { j: [300, 2500, 3100, 4000], w: [340, 760, 2500, 3600], 'ɰ': [390, 1500, 2700, 3800] };
  const VB = [80, 100, 160, 250];
  const VGAIN = { a: 1, e: 1.25, eo: 1.12, o: 1.3, u: 1.45, eu: 1.45, i: 1.55 };   // 모음마다 크기 맞춤
  const LOC = { lab: [850, 2200], alv: [1750, 2750], pal: [2250, 3000] };
  const PRE = 0.24, TAIL = 0.32;

  function render(ph, P, sr, seed = 1) {
    const sex = P.vSex ?? 1, br = P.vBreath ?? 0.2, tense = P.vTense ?? 0.5, porta = P.vPorta ?? 1, cons = P.vCons ?? 1, rb = P.vRobot ?? 0, hum = 1 - rb;
    const vibC = (P.vib ?? 30) / 100, vibRate = P.vibRate ?? 5.5, vibDelay = P.vibDelay ?? 0.25;
    const durMul = 0.7 + 0.3 * cons, ampMul = 0.45 + 0.55 * cons, baseAH = 0.015 + 0.22 * br;
    const sc = f => f.map(x => x * sex);
    const withB = (F, bm = 1) => [...F, ...VB.map(b => b * bm)];
    const K = { av: [], ah: [], af: [], ff: [], fq: [], tl: [], df: [], fm: [], g: [], f0: [], vib: [] };
    const kf = (k, t, v) => K[k].push([t, v]);
    const fm = (t, F, B) => K.fm.push([t, F.length === 8 ? F : [...F, ...(B || VB)]]);
    const locus = (pl, V) => {
      if (pl === 'glot') return V.slice(0, 4);
      let f2, f3;
      if (pl === 'vel') { f2 = Math.min(2600 * sex, Math.max(1300 * sex, V[1] * 1.08 + 150 * sex)); f3 = Math.max(f2 + 350 * sex, V[2] * 0.95); }
      else { const L = LOC[pl]; f2 = L[0] * sex + 0.45 * (V[1] - L[0] * sex); f3 = L[1] * sex + 0.4 * (V[2] - L[1] * sex); }
      return [Math.min(V[0], 300 * sex), f2, f3, V[3]];
    };
    const nasal = (pl, V) => [260 * sex, pl === 'lab' ? 1050 * sex : pl === 'vel' ? Math.max(1700 * sex, Math.min(2200 * sex, V[1])) : 1550 * sex, 2400 * sex, 3600 * sex];
    const NB = [70, 320, 420, 500];
    const nyq = sr * 0.42;

    const sy = ph.sy.map(s => ({ ...s, o: s.on === 'ㅇ' ? null : ON[s.on] }));
    // 1) 자음 길이 정하기 (앞 노트의 끝부분을 빌려 씀)
    const voicedEnd = s => !s.cd || s.cd === 'n' || s.cd === 'm' || s.cd === 'ng' || s.cd === 'l';
    sy.forEach((s, i) => {
      const prev = sy[i - 1], first = !prev, inter = !first && voicedEnd(prev), o = s.o;
      s.first = first; s.inter = inter; s.q = Math.max(0.4, Math.min(1, (s.te - s.ts) / 0.3));
      const z = s.z = {};
      if (!o) z.Cd = first ? 0.04 : 0.03;
      else if (o[0] === 'h') z.Cd = (inter || s.hw ? 0.06 : 0.075) * durMul;
      else if (o[0] === 'stop') {
        z.clo = first ? 0.015 : (o[2] === 'L' ? (inter ? 0.03 : 0.05) : o[2] === 'A' ? 0.06 : 0.075) * durMul;
        z.vot = (o[2] === 'L' ? (inter ? 0.012 : 0.035) : o[2] === 'A' ? 0.075 : 0.012) * durMul;
        z.Cd = z.clo + z.vot;
      } else if (o[0] === 'affr') {
        z.clo = first ? 0.015 : (o[2] === 'L' ? (inter ? 0.025 : 0.045) : o[2] === 'A' ? 0.05 : 0.065) * durMul;
        z.fr = (o[2] === 'A' ? 0.04 : 0.035) * durMul;
        z.asp = (o[2] === 'L' ? (inter ? 0.005 : 0.02) : o[2] === 'A' ? 0.05 : 0) * durMul;
        z.Cd = z.clo + z.fr + z.asp;
      } else if (o[0] === 'fric') z.Cd = (o[2] === 'T' ? 0.125 : inter ? 0.085 : 0.1) * durMul;
      else if (o[0] === 'nas') z.Cd = (first ? 0.07 : 0.06) * durMul;
      else if (o[0] === 'liq') z.Cd = (first ? 0.06 : 0.028) * durMul;
      const span = s.te - s.ts;
      s.Kd = !s.cd ? 0 : (s.cd === 'k' || s.cd === 't' || s.cd === 'p') ? 0.06 : Math.min(0.18, Math.max(0.06, 0.22 * span));
    });
    sy.forEach((s, i) => {   // 노트 안에서 모음이 너무 짧아지지 않게 줄임
      const nx = sy[i + 1], need = s.Kd + (nx ? nx.z.Cd : 0), max = 0.62 * (s.te - s.ts);
      if (need > max && need > 0) { const k = max / need; s.Kd *= k; if (nx) for (const key in nx.z) nx.z[key] *= k; }
      if (s.first && s.z.Cd > PRE - 0.02) { const k = (PRE - 0.02) / s.z.Cd; for (const key in s.z) s.z[key] *= k; }
    });

    // 2) 음소 시간표 → 키프레임
    kf('av', 0, 0); kf('ah', 0, 0); kf('af', 0, 0); kf('tl', 0, 1); kf('df', 0, 0);
    sy.forEach((s, i) => {
      const nx = sy[i + 1], ts = PRE + s.ts, te = PRE + s.te, q = s.q, o = s.o, z = s.z;
      const V = sc(VOW[s.v] || VOW.a), G = s.gl ? sc(GLIDE[s.gl]) : V, Cd = z.Cd, tc = ts - Cd;
      const tr4 = 0.04 * q;   // 자음 → 모음 포먼트 이동 시간
      if (!o) {
        if (s.first) { kf('av', ts - 0.04, 0); kf('av', ts + 0.025, 1); kf('ah', ts - 0.04, 0); kf('ah', ts - 0.01, 0.16 + baseAH); kf('ah', ts + 0.05, baseAH); fm(ts - 0.04, G); }
        else if (sy[i - 1].cd) { kf('av', ts + 0.03, 1); kf('tl', ts + 0.03, 1); fm(ts + 0.035 * q, G); }
        else { const same = sy[i - 1].v === s.v && !s.gl; kf('av', tc, 1); kf('av', ts - 0.004, same ? 0.42 : 0.72); kf('av', ts + 0.03, 1); fm(ts + 0.035 * q, G); }
      } else if (o[0] === 'h') {
        const weak = s.inter || s.hw, a = (s.hw ? 0.22 : 0.5) * ampMul;
        if (weak) { kf('av', tc + 0.02, 0.32); kf('av', ts, 0.38); } else { kf('av', s.first ? tc : tc + 0.015, 0); kf('av', ts, 0); }
        kf('ah', tc, s.first ? 0 : baseAH); kf('ah', tc + 0.02, a); kf('ah', ts, a * 0.85); kf('ah', ts + 0.03, baseAH);
        kf('av', ts + 0.03, 1);
        fm(tc + 0.02, withB(G, 1.6)); fm(ts, withB(G, 1.25)); fm(ts + 0.03, G);
      } else if (o[0] === 'stop' || o[0] === 'affr') {
        const ty = o[2], vbar = s.inter && ty === 'L', L = locus(o[1], G), tr = tc + z.clo;
        if (s.first) kf('av', tc, 0); else { kf('av', tc, s.first ? 0 : (sy[i - 1].cd ? kf_last('av') : 1)); kf('av', tc + 0.012, vbar ? 0.12 : 0); }
        kf('av', tr, vbar ? 0.1 : 0);
        kf('ah', tc + 0.01, 0); kf('ah', tr, 0);
        fm(tc + Math.min(z.clo, 0.03), L);
        let ff, fq;
        if (o[0] === 'stop') {
          if (o[1] === 'lab') { ff = 1300; fq = 0.8; } else if (o[1] === 'alv') { ff = 4300; fq = 1.3; } else { ff = Math.min(3000, Math.max(1500, G[1] * 1.1)); fq = 3; }
          const b = (ty === 'L' ? (vbar ? 0.18 : 0.32) : ty === 'A' ? 0.5 : 0.55) * ampMul;
          kf('ff', tc, ff); kf('fq', tc, fq); kf('ff', ts, ff); kf('fq', ts, fq);
          kf('af', tr - 0.001, 0); kf('af', tr, b); kf('af', tr + 0.007, b * 0.35); kf('af', tr + 0.016, 0);
          const asp = (ty === 'L' ? (vbar ? 0.05 : 0.28) : ty === 'A' ? 0.6 : 0) * ampMul;
          kf('ah', tr + 0.005, asp); kf('ah', ts - 0.003, asp * 0.8);
        } else {
          ff = Math.min(nyq, 3400 * sex); fq = 1.5;
          const a = (ty === 'L' ? (vbar ? 0.25 : 0.38) : 0.48) * ampMul, ta = tr + z.fr;
          kf('ff', tc, ff); kf('fq', tc, fq); kf('ff', ts, ff); kf('fq', ts, fq);
          kf('af', tr - 0.001, 0); kf('af', tr, a * 1.15); kf('af', tr + 0.006, a); kf('af', ta - 0.006, a * 0.7); kf('af', ta, 0);
          const asp = (ty === 'L' ? (vbar ? 0.04 : 0.22) : ty === 'A' ? 0.55 : 0) * ampMul;
          kf('ah', ta, asp * 0.6); kf('ah', ts - 0.003, asp);
          fm(ta, L);
        }
        fm(tr, L);
        kf('ah', ts + 0.02, baseAH);
        kf('av', ts, vbar ? 0.12 : 0); kf('av', ts + (ty === 'T' ? 0.008 : ty === 'A' ? 0.02 : 0.025), 1);
        fm(ts + tr4, G);
        if (ty !== 'L') { kf('tl', ts, ty === 'T' ? 1.55 : 1.2); kf('tl', ts + 0.08, 1); }
        if (!vbar) { kf('df', ts - 0.01, 0); kf('df', ts, ty === 'L' ? -0.35 : 0.6); kf('df', ts + 0.07, 0); }
      } else if (o[0] === 'fric') {
        const pal = s.v === 'i' || s.gl === 'j', ff = Math.min(nyq, (pal ? 3900 : 6200) * sex), fq = pal ? 1.6 : 2.0;
        const a = (o[2] === 'T' ? 0.5 : 0.36) * ampMul, L = locus(pal ? 'pal' : 'alv', G);
        kf('av', s.first ? tc : tc + 0.02, 0); kf('av', ts, 0); kf('av', ts + 0.02, 1);
        kf('ff', tc, ff); kf('fq', tc, fq); kf('ff', ts, ff); kf('fq', ts, fq);
        kf('af', tc, 0); kf('af', tc + 0.025, a); kf('af', ts - 0.015, a); kf('af', ts + 0.004, 0);
        kf('ah', tc + 0.01, 0);
        if (o[2] === 'L') { kf('ah', ts - 0.03, 0); kf('ah', ts - 0.012, 0.2 * ampMul); }
        else { kf('tl', ts, 1.4); kf('tl', ts + 0.08, 1); }
        kf('ah', ts + 0.02, baseAH);
        fm(tc + 0.02, L); fm(ts - 0.005, L); fm(ts + tr4, G);
      } else if (o[0] === 'nas') {
        const N = nasal(o[1], G), L = locus(o[1], G);
        if (s.first) { kf('av', tc, 0); kf('av', tc + 0.02, 0.55); kf('ah', tc, 0); } else kf('av', tc + 0.015, 0.55);
        kf('av', ts, 0.55); kf('av', ts + 0.012, 1);
        kf('tl', tc + 0.015, 0.42); kf('tl', ts, 0.42); kf('tl', ts + 0.015, 1);
        fm(tc + 0.015, N, NB); fm(ts - 0.001, N, NB); fm(ts + 0.002, L); fm(ts + 0.045 * q, G);
        kf('ah', ts + 0.02, baseAH);
      } else if (o[0] === 'liq') {
        if (s.first) {
          const R = [340 * sex, 1300 * sex, 2700 * sex, 3600 * sex];
          kf('av', tc, 0); kf('av', tc + 0.02, 0.6); kf('av', ts, 0.62); kf('av', ts + 0.02, 1); kf('ah', tc, 0);
          fm(tc, R, [90, 160, 250, 300]); fm(ts, R, [90, 160, 250, 300]); fm(ts + 0.045 * q, G);
        } else {
          const R = [340 * sex, 1600 * sex, 2450 * sex, 3500 * sex];
          kf('av', tc + 0.012, 0.5); kf('av', ts - 0.008, 0.66); kf('av', ts + 0.012, 1);
          fm(tc + 0.014, R, [100, 140, 200, 300]); fm(ts + 0.035 * q, G);
        }
        kf('ah', ts + 0.02, baseAH);
      }
      kf('tl', ts + 0.09, 1);
      // 모음 (이중모음은 미끄러지듯)
      const gStart = ts + (o ? tr4 : 0.035 * q);
      if (s.gl) fm(gStart + (s.gl === 'ɰ' ? 0.09 : 0.07) * q, V);
      const vEnd = Math.max(gStart + 0.005, te - s.Kd - (nx ? nx.z.Cd : 0));
      fm(vEnd, V); kf('av', vEnd, 1); kf('ah', vEnd, baseAH);
      // 받침
      const cs = vEnd, ce = cs + s.Kd, last = !nx;
      if (s.cd === 'n' || s.cd === 'm' || s.cd === 'ng') {
        const N = nasal(s.cd === 'm' ? 'lab' : s.cd === 'ng' ? 'vel' : 'alv', V);
        fm(cs + 0.035 * q, N, NB); fm(ce, N, NB);
        kf('av', cs + 0.035 * q, 0.55); kf('av', ce, 0.55); kf('tl', cs + 0.035 * q, 0.42); kf('tl', ce, 0.42);
        if (last) { kf('av', ce + 0.09, 0); }
      } else if (s.cd === 'l') {
        const Lc = [360 * sex, 1150 * sex, 2700 * sex, 3600 * sex];
        fm(cs + 0.03 * q, Lc, [90, 150, 250, 300]); fm(ce, Lc, [90, 150, 250, 300]);
        kf('av', cs + 0.03 * q, 0.75); kf('av', ce, 0.75);
        if (last) kf('av', ce + 0.07, 0);
      } else if (s.cd) {
        const L = locus({ k: 'vel', t: 'alv', p: 'lab' }[s.cd], V);
        fm(cs + 0.04 * q, L);
        kf('av', cs + 0.01, 1); kf('av', cs + 0.04 * q, 0); kf('av', ce, 0); kf('ah', cs + 0.03 * q, 0); kf('ah', ce, 0);
      } else if (last) {
        kf('av', te, 1); kf('av', te + 0.1, 0);
        kf('ah', te, baseAH); kf('ah', te + 0.05, 0.08 + baseAH); kf('ah', te + 0.17, 0);
      }
      if (last) kf('ah', te + 0.2, 0);
    });
    function kf_last(k) { const a = K[k]; return a.length ? a[a.length - 1][1] : 0; }

    // 음높이 (반음 단위) · 비브라토 깊이 · 세기
    const u = ph.units, T0 = ph.t0;
    kf('f0', 0, u[0].p - 0.45 * hum); kf('f0', PRE + 0.07 * (1 - 0.6 * rb), u[0].p);
    u.forEach((a, i) => {
      const b = u[i + 1], A0 = PRE + a.t0 - T0, A1 = PRE + a.t1 - T0, dA = A1 - A0;
      const gv = (0.35 + 0.65 * a.v) * (VGAIN[a.sy && a.sy.v] || 1);
      kf('g', A0, gv); kf('g', A1 - 0.01, gv);
      kf('vib', A0, 0);
      const vd = Math.max(vibDelay, 0.22 * dA);
      if (vibC > 0 && dA > vd + 0.15) { kf('vib', A0 + vd, 0); kf('vib', A0 + vd + Math.min(0.3, dA - vd), vibC); kf('vib', A1, vibC); }
      kf('vib', A1 + 0.001, 0);
      if (!b) { kf('f0', A1, a.p); kf('f0', A1 + 0.22, a.p - 0.6); return; }
      const dB = b.t1 - b.t0, lg = !!(b.n && b.n.gl), d = lg ? Math.min(0.24, 0.55 * dA, 0.6 * dB) : Math.min(0.09 * porta + 0.012, 0.4 * dA, 0.4 * dB);
      if (b.p !== a.p && lg) { kf('f0', A1 - 0.5 * d, a.p); kf('f0', A1 + 0.5 * d, b.p); }   // 이어 부르기: 꺾지 않고 부드럽게 미끄러짐
      else if (b.p !== a.p) {
        kf('f0', A1 - 0.6 * d, a.p); kf('f0', A1 + 0.4 * d, b.p);
        if (porta > 0 && dB > 0.3) { const os = Math.sign(b.p - a.p) * Math.min(0.25, 0.08 * Math.abs(b.p - a.p)) * Math.min(1, porta); kf('f0', A1 + 0.4 * d + 0.05, b.p + os); kf('f0', A1 + 0.4 * d + 0.13, b.p); }
      }
    });

    // 3) 시간축 배열 (제어 프레임 = 64샘플)
    const N = Math.ceil((PRE + ph.len + TAIL) * sr), H = 64, NF = Math.ceil(N / H) + 2, fr = sr / H;
    const raster = (keys, def, smoothSec = 0) => {
      const out = new Float32Array(NF);
      const ks = keys.map((k, i) => [k[0], k[1], i]).sort((a, b) => a[0] - b[0] || a[2] - b[2]);
      if (!ks.length) { out.fill(def); return out; }
      let j = 0;
      for (let f = 0; f < NF; f++) {
        const t = f / fr;
        while (j < ks.length - 1 && ks[j + 1][0] <= t) j++;
        if (t <= ks[0][0]) out[f] = ks[0][1];
        else if (j >= ks.length - 1) out[f] = ks[ks.length - 1][1];
        else { const a = ks[j], b = ks[j + 1], w = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; out[f] = a[1] + (b[1] - a[1]) * w; }
      }
      if (smoothSec > 0) smooth(out, Math.max(1, Math.round(smoothSec * fr)));
      return out;
    };
    const smooth = (a, w) => { for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(a); let s = 0, n = 0; const h = w >> 1;
      for (let i = -h; i < a.length; i++) { const add = i + h, rem = i - h - 1; if (add < a.length) { s += c[add]; n++; } if (rem >= 0) { s -= c[rem]; n--; } if (i >= 0) a[i] = s / n; } } };
    const AV = raster(K.av, 0, 0.004), AH = raster(K.ah, 0, 0.003), AF = raster(K.af, 0, 0), FF = raster(K.ff, 4000), FQ = raster(K.fq, 1.5);
    const TL = raster(K.tl, 1, 0.01), DF = raster(K.df, 0, 0.01), GN = raster(K.g, 1, 0.01), F0 = raster(K.f0, u[0].p, 0.018 * (1 - 0.65 * rb)), VIB = raster(K.vib, 0, 0.03);
    const FM = []; for (let k = 0; k < 8; k++) FM.push(raster(K.fm.map(e => [e[0], e[1][k]]), k < 4 ? VOW.a[k] * sex : VB[k - 4], 0.006));

    // 4) 합성
    const out = new Float32Array(N);
    let rs = (seed * 2654435761) >>> 0 || 1;
    const rnd = () => { rs ^= rs << 13; rs >>>= 0; rs ^= rs >>> 17; rs ^= rs << 5; rs >>>= 0; return rs / 4294967296; };
    const R = [0, 0, 0, 0, 0, 0, 0].map(() => ({ a: 1, b: 0, c: 0, y1: 0, y2: 0 }));
    const setRes = (r, f, bw) => { f = Math.min(f, nyq); const e = Math.exp(-Math.PI * bw / sr); r.c = -e * e; r.b = 2 * e * Math.cos(2 * Math.PI * f / sr); r.a = 1 - r.b - r.c; };
    setRes(R[4], Math.min(4900 * sex, nyq), 350); setRes(R[5], Math.min(6000 * sex, nyq), 500); setRes(R[6], Math.min(7300 * sex, nyq), 700);
    const NR = 7 - (6000 * sex > nyq) - (7300 * sex > nyq);
    let ph0 = 0, jit = 0, shim = 1, lp = 0, dcx = 0, dcy = 0, pe1 = 0, pe2 = 0, bx1 = 0, bx2 = 0, by1 = 0, by2 = 0, nlp = 0;
    let vibPh = rnd() * 6.283, drA = rnd() * 6.283, drB = rnd() * 6.283;
    const bq = { b0: 0, b2: 0, a1: 0, a2: 0 };
    const tiltBase = 1400 + 5200 * tense;
    for (let f = 0; f < NF - 1; f++) {
      const i0 = f * H; if (i0 >= N) break;
      const t = f / fr;
      vibPh += 2 * Math.PI * vibRate * (1 + 0.05 * Math.sin(t * 0.9 + drA)) / fr;
      const semi = F0[f] + DF[f] + VIB[f] * Math.sin(vibPh) + hum * (0.05 * Math.sin(2 * Math.PI * 0.55 * t + drA) + 0.035 * Math.sin(2 * Math.PI * 1.3 * t + drB));
      const f0 = 440 * Math.pow(2, (semi - 69) / 12), dt0 = f0 / sr;
      // 포먼트 (높은 음에서는 F1이 기본음 위로 따라 올라감)
      const F1 = Math.max(FM[0][f], f0 * 1.12), F2 = Math.max(FM[1][f], F1 + 250 * sex), hc = f0 > 262 ? Math.pow(262 / f0, 0.85) : 1;
      setRes(R[0], F1, FM[4][f] + f0 * 0.03 + (F1 - FM[0][f]) * 0.3); const bw = f0 > 300 ? (f0 - 300) * 0.12 : 0;
      setRes(R[1], F2, FM[5][f] + bw); setRes(R[2], Math.max(FM[2][f], F2 + 300 * sex), FM[6][f] + bw); setRes(R[3], Math.max(FM[3][f], FM[2][f] + 400 * sex), FM[7][f] + bw);
      // 마찰음 필터 (RBJ 밴드패스)
      { const w = 2 * Math.PI * Math.min(FF[f], nyq) / sr, al = Math.sin(w) / (2 * FQ[f]), a0 = 1 + al; bq.b0 = al / a0; bq.b2 = -al / a0; bq.a1 = -2 * Math.cos(w) / a0; bq.a2 = (1 - al) / a0; }
      const lpa = 1 - Math.exp(-2 * Math.PI * Math.min(nyq, tiltBase * TL[f]) / sr);
      const av0 = AV[f] * hc, av1 = AV[f + 1] * hc, ah0 = AH[f], ah1 = AH[f + 1], af0 = AF[f], af1 = AF[f + 1], g0 = GN[f], g1 = GN[f + 1];
      for (let j = 0; j < H && i0 + j < N; j++) {
        const w = j / H, av = av0 + (av1 - av0) * w, ah = ah0 + (ah1 - ah0) * w, af = af0 + (af1 - af0) * w, gg = g0 + (g1 - g0) * w;
        // 성대 음원: 대역 제한 톱니파 (PolyBLEP) + 미세한 흔들림
        const dt = dt0 * (1 + jit);
        ph0 += dt;
        if (ph0 >= 1) { ph0 -= 1; jit = (rnd() - 0.5) * 0.006 * hum; shim = 1 + (rnd() - 0.5) * 0.08 * hum; }
        let s = 2 * ph0 - 1;
        if (ph0 < dt) { const x = ph0 / dt; s -= x + x - x * x - 1; } else if (ph0 > 1 - dt) { const x = (ph0 - 1) / dt; s -= x * x + x + x + 1; }
        lp += lpa * (s - lp);
        const nz = rnd() * 2 - 1;
        const asp = nz * ah * (av > 0.3 ? (ph0 < 0.45 ? 1.35 : 0.55) : 1);
        let x = lp * av * shim * 1.6 + asp * 0.9;
        for (let r = 0; r < NR; r++) { const R_ = R[r]; const y = R_.a * x + R_.b * R_.y1 + R_.c * R_.y2; R_.y2 = R_.y1; R_.y1 = y; x = y; }
        // 마찰·파열 노이즈
        const n2 = rnd() * 2 - 1;
        const fy = bq.b0 * n2 + bq.b2 * bx2 - bq.a1 * by1 - bq.a2 * by2; bx2 = bx1; bx1 = n2; by2 = by1; by1 = fy;
        // 입술 방사 + 높은 포먼트 보정 (고음역 살리기)
        const pe = x - 0.86 * pe1 + 0.25 * (x - 2 * pe1 + pe2); pe2 = pe1; pe1 = x;
        let y = pe * 0.5 + fy * af * 0.55;
        const dc = y - dcx + 0.995 * dcy; dcx = y; dcy = dc;
        out[i0 + j] = dc * gg;
      }
    }
    // 5) 부드러운 컴프레서: 높은 음·모음에 따라 튀는 크기를 고르게
    const W = Math.round(sr * 0.03), TH = 0.25, env = new Float32Array(Math.ceil(N / W) + 1);
    for (let b = 0; b < env.length; b++) { let s2 = 0, n = 0; for (let i = b * W; i < Math.min(N, (b + 1) * W); i++) { s2 += out[i] * out[i]; n++; } const r = n ? Math.sqrt(s2 / n) : 0; env[b] = r > TH ? Math.pow(TH / r, 0.7) : 1; }
    for (let b = 1; b < env.length; b++) env[b] = Math.min(env[b], env[b - 1] + 0.15);   // 천천히 풀림
    for (let b = env.length - 2; b >= 0; b--) env[b] = Math.min(env[b], env[b + 1] + 0.3);   // 미리 줄임
    for (let i = 0; i < N; i++) { const p = i / W - 0.5, b = Math.max(0, Math.floor(p)), w = Math.min(1, Math.max(0, p - b)); out[i] *= env[b] + ((env[b + 1] ?? env[b]) - env[b]) * w; }
    return out;
  }
  return { tokens, parse, model, render, PRE, TAIL, g2p };
})();

// ── 보컬 트랙 재생: 트랙 노트 전체로 발음·프레이즈를 정하고, 프레이즈를 한 번에 합성해 노트 단위로 잘라 예약
const VOCAL_GAIN = 0.36, VKEYS = ['vSex', 'vBreath', 'vTense', 'vPorta', 'vCons', 'vRobot', 'vib', 'vibRate', 'vibDelay'];
const vocalBufs = new Map();   // 합성 결과 (같은 프레이즈는 다시 계산하지 않음)
let vocalMemo = null;          // 한 번의 재생 예약 안에서 트랙 분석 재사용
function vocalModel(t) {
  if (!vocalMemo) { vocalMemo = new Map(); queueMicrotask(() => { vocalMemo = null; }); }
  let m = vocalMemo.get(t.id);
  if (!m) { m = KV.model(S.notes.filter(n => n.t === t.id), stepSec()); vocalMemo.set(t.id, m); }
  return m;
}
function strHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function vocalBuffer(ph, P) {
  const sr = ac.sampleRate, key = ph.key + '|' + sr + '|' + VKEYS.map(k => P[k]).join(',');
  let b = vocalBufs.get(key);
  if (b) { vocalBufs.delete(key); vocalBufs.set(key, b); return b; }
  const data = KV.render(ph, P, sr, strHash(key) || 1);
  b = ac.createBuffer(1, data.length, sr); b.getChannelData(0).set(data);
  vocalBufs.set(key, b); if (vocalBufs.size > 120) vocalBufs.delete(vocalBufs.keys().next().value);
  return b;
}
function prepVocals(list, fromStep = 0) {   // 재생 전에 보컬을 미리 합성 (시작 시각을 정하기 전에 해야 앞부분이 잘리지 않음)
  const ss = stepSec(), tids = new Set(list.filter(n => isVocalTrack(trk(n.t))).map(n => n.t));
  for (const id of tids) { const t = trk(id); for (const ph of vocalModel(t).phrases) if (ph.t0 + ph.len > fromStep * ss) vocalBuffer(ph, t.snd); }
}
function singNote(m, when, dur, t, v, n) {
  const P = t.snd, ss = stepSec(), XF = 0.004, PRE = KV.PRE, now = ac.currentTime;
  const info = n && n.t === t.id ? vocalModel(t).info.get(n) : null;
  let ph, a, b, skip = 0, base;
  if (info) { ({ ph, a, b } = info); skip = Math.max(0, n.l * ss - dur - 1e-6); base = when - (PRE + a + skip); }
  else {   // 미리 듣기 · 다른 창의 노트: 그 노트 하나만 (자음까지 다 들리게 필요하면 살짝 늦춰서)
    const one = { p: m, s: 0, l: Math.max(dur, 0.15) / ss, ly: n && n.ly, v: clamp(v, 0, 1) };
    ph = KV.model([one], ss).phrases[0]; a = 0; b = ph.len; base = Math.max(when - PRE, now + 0.005);
  }
  const buf = vocalBuffer(ph, P), first = a < 1e-4, last = b > ph.len - 1e-4;
  let x0 = first && !skip ? 0 : PRE + a + skip - XF, x1 = last ? buf.duration : PRE + b + XF, fadeIn = !first || skip > 0;
  if (base + x0 < now) { x0 = now - base; fadeIn = true; }
  if (x1 - x0 < 0.005) return;
  const src = ac.createBufferSource(), g = ac.createGain(), T0 = base + x0, T1 = base + x1;
  src.buffer = buf; src.connect(g); g.connect(bus(t));
  g.gain.setValueAtTime(fadeIn ? 0 : VOCAL_GAIN, T0);
  if (fadeIn) g.gain.linearRampToValueAtTime(VOCAL_GAIN, T0 + 2 * XF);
  if (!last) { g.gain.setValueAtTime(VOCAL_GAIN, Math.max(T0 + 2 * XF, T1 - 2 * XF)); g.gain.linearRampToValueAtTime(0, T1); }
  src.start(T0, x0, x1 - x0); trackNode(src);
}

// 트랜스포트
const T = { t0: 0, startStep: 0, metroNext: 0, endStep: 0 };
const stepSec = () => 60 / S.bpm / 4;
const stepAt = t => T.startStep + (t - T.t0) / stepSec();
const timeAt = s => T.t0 + (s - T.startStep) * stepSec();
function schedMetro(now) {
  while (timeAt(T.metroNext) < now + 0.15) {
    const t = timeAt(T.metroNext), isCount = T.metroNext < T.startStep && mode !== 'play';
    if (t >= now - 0.01 && (S.metro || isCount)) click(t, ((T.metroNext % 16) + 16) % 16 === 0);
    T.metroNext += 4;
  }
}

// ───────── 음정 감지 (YIN) ─────────
function yin(buf, sr, d, gate) {
  const N = buf.length; let rms = 0;
  for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / N);
  if (rms < gate) return { f: -1, rms };
  const maxTau = Math.min(Math.floor(sr / 60), N >> 1), minTau = Math.floor(sr / 1100), W = N - maxTau;
  d[0] = 1; let run = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
    run += s; d[tau] = run ? s * tau / run : 1;
  }
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) { if (d[t] < 0.15) { while (t + 1 <= maxTau && d[t + 1] < d[t]) t++; tau = t; break; } }
  if (tau < 0) return { f: -1, rms };
  let bt = tau;
  if (tau > 0 && tau < maxTau) { const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b; if (den) bt = tau + (a - c) / (2 * den); }
  return { f: sr / bt, rms };
}
let mic = null;
async function openMic() {
  AC();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('이 환경에서는 마이크를 쓸 수 없어요 (https 또는 로컬 파일로 열어 주세요)'); return false; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    mic = { stream, src, an, buf: new Float32Array(an.fftSize), d: new Float32Array(an.fftSize / 2 + 1) };
    return true;
  } catch (e) { toast('마이크 권한이 거부되었거나 사용할 수 없어요 (' + e.name + ')'); return false; }
}
function closeMic() {
  if (!mic) return;
  mic.stream.getTracks().forEach(t => t.stop());
  try { mic.src.disconnect(); } catch (e) {}
  mic = null; liveMidi = null; showPitch(null); $('meterFill').style.width = '0';
}
const meterPct = v => Math.min(100, Math.sqrt(v / 0.25) * 100);
function analyze() {
  mic.an.getFloatTimeDomainData(mic.buf);
  const r = yin(mic.buf, ac.sampleRate, mic.d, +$('gate').value);
  $('meterFill').style.width = meterPct(r.rms) + '%';
  if (r.f > 0) { const m = 69 + 12 * Math.log2(r.f / 440); if (m >= LOW - 0.5 && m <= HIGH + 0.5) { liveMidi = m; showPitch(m, r.f); return m; } }
  liveMidi = null; showPitch(null); return null;
}
function showPitch(m, f) {
  if (m == null) { $('pitchName').textContent = '—'; $('pitchDetail').textContent = mic ? '소리를 내 보세요' : '마이크 대기 중'; return; }
  const p = Math.round(m), c = Math.round((m - p) * 100);
  $('pitchName').textContent = name(p);
  $('pitchDetail').textContent = `${f.toFixed(1)} Hz · ${c >= 0 ? '+' : ''}${c}¢`;
}

// ───────── 재생 / 녹음 ─────────
function play() {
  if (mode !== 'idle') stop();
  const playable = S.notes.filter(n => audible(trk(n.t)));
  if (!playable.length) return toast('재생할 노트가 없어요 (뮤트/솔로 상태도 확인해 보세요)');
  AC();
  let end = 0; for (const n of playable) end = Math.max(end, n.s + n.l);
  if (playhead >= end) playhead = 0;
  prepVocals(playable, playhead); buildGlides(playable, playhead);
  const lead = playable.some(n => isVocalTrack(trk(n.t))) ? KV.PRE + 0.03 : 0.08;   // 보컬: 첫 자음이 박자보다 먼저 시작
  T.startStep = playhead; T.t0 = ac.currentTime + lead; T.endStep = end + 4;
  // 노트를 한꺼번에 다 예약하지 않고 조금씩(앞으로 1.5초 분량) 예약 — 노트가 많을 때 오디오 처리량이 몰려 소리가 끊기던 문제 개선
  const q = [];
  for (const n of playable) {
    if (n.s + n.l <= T.startStep) continue;
    const st = Math.max(n.s, T.startStep);
    if (isDrumTrack(trk(n.t)) && st > n.s) continue;
    q.push([st, n]);
  }
  q.sort((a, b) => a[0] - b[0]);
  T.q = q; T.qi = 0; T.ss = stepSec();
  T.metroNext = Math.ceil(T.startStep / 4) * 4; T.noMetro = false;
  mode = 'play'; pumpNotes(); clearInterval(T.pumpT); T.pumpT = setInterval(pumpNotes, 200);   // 탭이 가려져 화면 갱신이 멈춰도 계속 예약
  setButtons(); loop();
}
const PUMP_AHEAD = 1.5;
function pumpNotes() {
  if (mode !== 'play' || !T.q) return;
  const lim = ac.currentTime + PUMP_AHEAD;
  while (T.qi < T.q.length) {
    const [st, n] = T.q[T.qi], when = timeAt(st); if (when > lim) break;
    T.qi++; const t = trk(n.t); if (!t) continue;
    tone(n.p, when, (n.s + n.l - st) * T.ss, t, n.v ?? 1, n);
  }
}
async function record() {
  if (mode === 'rec' || mode === 'countin') return stop();
  if (pendingRec) closePreview(false);
  if (mode !== 'idle') stop();
  if (!await openMic()) return;
  const ci = S.countin ? 16 : 0;
  T.startStep = Math.round(playhead / S.grid) * S.grid; playhead = T.startStep;
  T.t0 = ac.currentTime + 0.1 + ci * stepSec(); T.noMetro = false;
  T.metroNext = ci ? T.startStep - ci : Math.ceil(T.startStep / 4) * 4;
  trace = []; sel = new Set();
  startCapture();
  rec = { startStep: T.startStep, t0: T.t0 };
  mode = ci ? 'countin' : 'rec'; setButtons(); loop();
}
function recFrame(now) {   // 녹음 중: 실시간 음정 선(노란 선)만 보여주고, 노트는 녹음이 끝난 뒤 분석
  schedMetro(now);
  const m = analyze();
  if (now < T.t0) { $('pitchDetail').textContent = `카운트인… ${Math.ceil((T.t0 - now) / (stepSec() * 4))}`; drawAll(); return; }
  if (mode === 'countin') { mode = 'rec'; setButtons(); }
  const lat = mic.an.fftSize / 2 / ac.sampleRate;
  playhead = Math.max(T.startStep, stepAt(now - lat));
  ensureLength(playhead);
  trace.push({ s: playhead, m });
  follow(true); drawAll();
}
// 원음 캡처
function startCapture() {
  const sp = ac.createScriptProcessor(4096, 1, 1), z = ac.createGain(); z.gain.value = 0;
  const cap = { sp, z, chunks: [], start: null };
  sp.onaudioprocess = e => {
    if (cap.start === null) cap.start = ac.currentTime - e.inputBuffer.duration;
    cap.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  mic.src.connect(sp); sp.connect(z); z.connect(ac.destination);
  mic.cap = cap;
}
function endCapture() {
  const cap = mic && mic.cap; if (!cap) return null;
  try { mic.src.disconnect(cap.sp); } catch (e) {}
  cap.sp.disconnect(); cap.z.disconnect(); cap.sp.onaudioprocess = null;
  const len = cap.chunks.reduce((a, c) => a + c.length, 0), x = new Float32Array(len);
  let o = 0; for (const c of cap.chunks) { x.set(c, o); o += c.length; }
  return { x, sr: ac.sampleRate, start: cap.start ?? ac.currentTime };
}
async function monitor() {
  if (mode === 'monitor') return stop();
  if (mode !== 'idle') stop();
  if (!await openMic()) return;
  mode = 'monitor'; setButtons(); loop();
}
function stop() {
  clearInterval(T.pumpT); T.pumpT = 0; T.q = null;
  if (mode === 'idle') { playhead = pendingRec ? pendingRec.startStep : 0; if (!pendingRec) scroller.scrollLeft = 0; drawAll(); return; }
  killVoices();
  let captured = null, recInfo = rec;
  if (rec) { captured = endCapture(); rec = null; }
  closeMic();
  mode = 'idle'; setButtons(); drawAll();
  if (captured && recInfo) {
    const MIC_LAT = 0.03;
    const offset = recInfo.t0 - captured.start + MIC_LAT;   // 버퍼 안에서 시작 지점(카운트인 제외)
    if (captured.x.length / captured.sr - offset < 0.25) { toast('녹음이 너무 짧아요'); trace = []; drawAll(); return; }
    let lastMode = 'voice'; try { lastMode = localStorage.getItem('hc-recMode') || 'voice'; } catch (e) {}
    openPreview({ raw: captured.x, rawSr: captured.sr, offset, startStep: recInfo.startStep, source: '녹음', mode: lastMode });
  }
}
function loop() {
  if (mode === 'idle') return;
  requestAnimationFrame(loop);
  const now = ac.currentTime;
  if (mode === 'play') {
    pumpNotes();
    if (!T.noMetro) schedMetro(now);
    playhead = stepAt(now);
    if (playhead >= T.endStep) { playhead = T.endStep - 4; stop(); return; }
    follow(false); drawAll();
  } else if (mode === 'rec' || mode === 'countin') recFrame(now);
  else if (mode === 'monitor') { analyze(); drawAll(); }
}

// ───────── 음정 분석 (녹음/파일 → 노트) ─────────
function prepAudio(x, sr) {
  let y = x, r = sr;
  while (r > 30000) { const n = Math.floor(y.length / 2), z = new Float32Array(n); for (let i = 0; i < n; i++) z[i] = (y[2 * i] + y[2 * i + 1]) * 0.5; y = z; r /= 2; }
  let pk = 0; for (let i = 0; i < y.length; i++) { const a = Math.abs(y[i]); if (a > pk) pk = a; }
  if (pk > 0 && (pk < 0.9 || y === x)) { const g = 0.9 / pk; const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[i] * g; y = z; }
  return { x: y, sr: r };
}
const yieldUI = () => new Promise(r => setTimeout(r, 0));
function median(a) { const b = a.slice().sort((p, q) => p - q); return b.length ? b[b.length >> 1] : 0; }
function medianFilter(arr, k) {
  const h = k >> 1, out = arr.slice();
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == null) continue;
    const w = []; for (let j = i - h; j <= i + h; j++) if (j >= 0 && j < arr.length && arr[j] != null) w.push(arr[j]);
    out[i] = median(w);
  }
  return out;
}
// 목소리(단선율): YIN, 10ms 간격
async function trackVoice(A, P, progress) {
  const W = A.sr > 20000 ? 1024 : 512, hop = Math.round(A.sr * 0.01), d = new Float32Array(W / 2 + 1);
  const gate = 0.004 + 0.06 * Math.pow(1 - P.voice, 2);
  const m = [], lv = [], t = [];
  for (let i = 0, k = 0; i + W <= A.x.length; i += hop, k++) {
    const r = yin(A.x.subarray(i, i + W), A.sr, d, gate);
    let v = null;
    if (r.f > 0) { const mm = 69 + 12 * Math.log2(r.f / 440); if (mm >= LOW && mm <= HIGH) v = mm; }
    m.push(v); lv.push(20 * Math.log10(r.rms + 1e-6)); t.push((i + W / 2) / A.sr);
    if (k % 400 === 0) { progress(i / A.x.length); await yieldUI(); }
  }
  return { m, lv, t, hop: hop / A.sr };
}
// 음악(주선율): FFT 화음 합산 salience + 비터비 경로 추적
let fftCache = {};
function getFFT(N) {
  if (fftCache[N]) return fftCache[N];
  const lev = Math.log2(N), rev = new Uint32Array(N), cs = new Float64Array(N / 2), sn = new Float64Array(N / 2);
  for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < lev; b++) r |= ((i >> b) & 1) << (lev - 1 - b); rev[i] = r; }
  for (let k = 0; k < N / 2; k++) { cs[k] = Math.cos(2 * Math.PI * k / N); sn[k] = -Math.sin(2 * Math.PI * k / N); }
  const f = (re, im) => {
    for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = N / size;
      for (let i = 0; i < N; i += size) for (let j = 0, k = 0; j < half; j++, k += step) {
        const l = i + j + half, wr = cs[k], wi = sn[k];
        const tr = re[l] * wr - im[l] * wi, ti = re[l] * wi + im[l] * wr;
        re[l] = re[i + j] - tr; im[l] = im[i + j] - ti; re[i + j] += tr; im[i + j] += ti;
      }
    }
  };
  return (fftCache[N] = f);
}
async function trackMusic(A, P, progress) {
  const N = 4096, fft = getFFT(N), hop = Math.round(A.sr * (A.x.length / A.sr > 90 ? 0.015 : 0.01));
  const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const binHz = A.sr / N, H = 8, MLO = 36, MHI = 96, STEP = 0.1, C = Math.round((MHI - MLO) / STEP) + 1;
  // 후보 음높이별 배음 위치 미리 계산
  const pos = new Float32Array(C * H), cand = new Float32Array(C), wPitch = new Float32Array(C);
  for (let c = 0; c < C; c++) {
    const mm = MLO + c * STEP, f0 = 440 * Math.pow(2, (mm - 69) / 12); cand[c] = mm;
    wPitch[c] = Math.exp(-Math.pow((mm - 72) / 26, 2));   // 너무 낮은 베이스보다 멜로디 음역을 약간 선호
    for (let h = 0; h < H; h++) pos[c * H + h] = f0 * (h + 1) / binHz;
  }
  const hw = new Float32Array(H); for (let h = 0; h < H; h++) hw[h] = Math.pow(0.82, h);
  const re = new Float64Array(N), im = new Float64Array(N), mag = new Float32Array(N / 2), sal = new Float32Array(C);
  const frames = [], t = [];
  // 짧은 창(1024) 스펙트럼: 같은 음 연타(재타격) 감지용
  const N2 = 1024, fft2 = getFFT(N2), win2 = new Float32Array(N2), re2 = new Float64Array(N2), im2 = new Float64Array(N2);
  for (let i = 0; i < N2; i++) win2[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N2);
  const nFr = Math.ceil((A.x.length + N / 2) / hop) + 1, spec2 = new Uint8Array(nFr * (N2 / 2));
  for (let i = 0, k = 0; i + N <= A.x.length + N / 2; i += hop, k++) {
    const st = i - N / 2;
    for (let n = 0; n < N; n++) { const idx = st + n; re[n] = (idx >= 0 && idx < A.x.length ? A.x[idx] : 0) * win[n]; im[n] = 0; }
    fft(re, im);
    for (let b = 0; b < N / 2; b++) mag[b] = Math.log1p(Math.sqrt(re[b] * re[b] + im[b] * im[b]) * 8);
    let best = 0;
    for (let c = 0; c < C; c++) {
      let sum = 0;
      for (let h = 0; h < H; h++) { const p = pos[c * H + h]; if (p >= N / 2 - 1) break; const b0 = p | 0; sum += hw[h] * Math.max(mag[b0], mag[b0 + 1]); }
      sal[c] = sum * wPitch[c]; if (sal[c] > best) best = sal[c];
    }
    // 상위 5개 봉우리
    const peaks = [];
    for (let c = 2; c < C - 2; c++) {
      const v = sal[c];
      if (v > sal[c - 1] && v >= sal[c + 1] && v > sal[c - 2] && v >= sal[c + 2] && v > best * 0.35) peaks.push([v, c]);
    }
    peaks.sort((a, b) => b[0] - a[0]);
    frames.push(peaks.slice(0, 5).map(([v, c]) => {   // 포물선 보간으로 미세 음높이
      const a = sal[c - 1], b = sal[c], d2 = sal[c + 1], den = a - 2 * b + d2;
      return { m: cand[c] + (den ? 0.5 * (a - d2) / den : 0) * STEP, v };
    }));
    t.push(i / A.sr);
    {
      const st2 = i - N2 / 2;
      for (let n2 = 0; n2 < N2; n2++) { const idx = st2 + n2; re2[n2] = (idx >= 0 && idx < A.x.length ? A.x[idx] : 0) * win2[n2]; im2[n2] = 0; }
      fft2(re2, im2);
      const o = k * (N2 / 2);
      for (let b = 0; b < N2 / 2; b++) spec2[o + b] = Math.min(255, Math.round(Math.log1p(Math.sqrt(re2[b] * re2[b] + im2[b] * im2[b]) * 8) * 24));
    }
    if (k % 200 === 0) { progress(i / A.x.length); await yieldUI(); }
  }
  // 기준 크기 (프레임 최댓값의 90 백분위)
  const maxes = frames.map(f => f.length ? f[0].v : 0).sort((a, b) => a - b), ref = maxes[Math.floor(maxes.length * 0.9)] || 1;
  return { frames, t, ref, hop: hop / A.sr, spec2, half2: N2 / 2, binHz2: A.sr / N2 };
}
// 다성(피아노·악기): 온셋 검출 → 반복적 다중 음높이 추정(배음 제거) → 감쇠로 노트 끝 결정
async function trackPoly(A, progress) {
  const hop = Math.round(A.sr * 0.01), x = A.x, L = x.length, F = Math.floor(L / hop) + 1;
  const hann = N => { const w = new Float32Array(N); for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); return w; };
  const specAt = (N, fft, win, re, im, center, out) => {   // center 샘플 기준 창의 √크기 스펙트럼
    const st = center - N / 2;
    for (let n = 0; n < N; n++) { const idx = st + n; re[n] = (idx >= 0 && idx < L ? x[idx] : 0) * win[n]; im[n] = 0; }
    fft(re, im);
    for (let b = 0; b < out.length; b++) out[b] = Math.sqrt(Math.sqrt(re[b] * re[b] + im[b] * im[b]));
    return out;
  };
  // 1) 온셋: 짧은 창(1024) 로그 스펙트럴 플럭스
  const N1 = 1024, f1 = getFFT(N1), w1 = hann(N1), r1 = new Float64Array(N1), i1 = new Float64Array(N1);
  const prev = new Float32Array(N1 / 2), cur = new Float32Array(N1 / 2), flux = new Float32Array(F), energy = new Float32Array(F);
  // 2) 긴 창(4096) 전체 프레임 저장 (dB, 0.5dB 단위) — 음높이·노트 끝에 사용
  const N4 = 4096, f4 = getFFT(N4), w4 = hann(N4), r4 = new Float64Array(N4), i4 = new Float64Array(N4), nb4 = N4 / 2;
  const spec4 = new Uint8Array(F * nb4), tmp4 = new Float32Array(nb4);
  for (let k = 0; k < F; k++) {
    const c = k * hop;
    specAt(N1, f1, w1, r1, i1, c, cur);
    let s = 0, en = 0; for (let b = 0; b < N1 / 2; b++) { const m2 = cur[b] * cur[b], v = Math.log1p(m2 * 30); s += Math.max(0, v - prev[b]); prev[b] = v; en += m2 * m2; }
    energy[k] = en;
    flux[k] = k ? s : 0;
    specAt(N4, f4, w4, r4, i4, c, tmp4);
    const o = k * nb4;
    for (let b = 0; b < nb4; b++) { const db = 40 * Math.log10(tmp4[b] + 1e-6); spec4[o + b] = Math.max(0, Math.min(255, Math.round((db + 66) * 2))); }
    if (k % 150 === 0) { progress(0.75 * k / F); await yieldUI(); }
  }
  let fmax = 0; for (let k = 0; k < F; k++) if (flux[k] > fmax) fmax = flux[k];
  const onsets = [];
  const fl = k => (k >= 0 && k < F ? flux[k] : 0);
  for (let k = 1; k < F - 1; k++) {
    const w = []; for (let j = Math.max(0, k - 30); j < Math.min(F, k + 15); j++) w.push(flux[j]);
    const thr = median(w) * 1.4 + fmax * 0.03;
    const rising = (energy[Math.min(F - 1, k + 4)] || 0) > (k >= 2 ? energy[k - 2] : 0) * 1.15;   // 소리가 실제로 커지는 곳만 (노트 끝 '딸깍' 제외)
    if (rising && flux[k] > thr && flux[k] >= fl(k - 1) && flux[k] >= fl(k - 2) && flux[k] >= fl(k + 1) && flux[k] >= fl(k + 2) && (!onsets.length || k - onsets[onsets.length - 1] >= 4)) onsets.push(k);
  }
  // 3) 각 온셋에서 '새로 생긴 소리'의 배음 구조로 음높이를 하나씩 찾고 지움
  const N8 = 8192, f8 = getFFT(N8), w8 = hann(N8), r8 = new Float64Array(N8), i8 = new Float64Array(N8), nb8 = N8 / 2;
  const N2 = 2048, f2 = getFFT(N2), w2 = hann(N2), r2 = new Float64Array(N2), i2 = new Float64Array(N2), nb2 = N2 / 2;
  const a2 = new Float32Array(nb2), b2 = new Float32Array(nb2), half2 = Math.floor(N2 / 2 / hop) + 1;
  const resOf = p => p >= 60 ? 2048 : p >= 48 ? 4096 : 8192;   // 높은 음은 짧은 창(빠른 연타), 낮은 음은 긴 창(세밀한 음높이)
  const PLO = 28, PHI = 96, H = 10, hw = Array.from({ length: H }, (_, h) => 1 / Math.pow(h + 1, 0.6));
  const dec4 = (k, out) => { const o = k * nb4; for (let b = 0; b < nb4; b++) out[b] = Math.pow(10, (spec4[o + b] / 2 - 66) / 40); return out; };
  const peaks = v => { const pk = new Float32Array(v.length); for (let b = 2; b < v.length - 2; b++) if (v[b] >= v[b - 1] && v[b] >= v[b + 1] && v[b] >= v[b - 2] && v[b] >= v[b + 2]) for (let d = -1; d <= 1; d++) pk[b + d] = Math.max(pk[b + d], v[b]); return pk; };
  const spread = (v, w = 2) => { const o = new Float32Array(v.length); for (let b = 0; b < v.length; b++) { let m = 0; for (let d = -w; d <= w; d++) { const j = b + d; if (j >= 0 && j < v.length && v[j] > m) m = v[j]; } o[b] = m; } return o; };
  // 새로 생긴 소리: 치기 전보다 얼마나 커졌는지(dB)로 가중 — 2dB 이하 0, 8dB 이상 100%
  const riseW = (post, pre) => { if (post <= 0) return 0; const db = 40 * Math.log10(post / (pre + 1e-9)); return post * Math.max(0, Math.min(1, (db - 2) / 6)); };
  const hbin = (f, binHz, nb) => [Math.max(1, Math.floor(f * 0.985 / binHz)), Math.min(nb - 1, Math.ceil(f * 1.015 / binHz))];
  const cands = [], a4 = new Float32Array(nb4), b4 = new Float32Array(nb4), a8 = new Float32Array(nb8), b8 = new Float32Array(nb8);
  const half4 = Math.floor(N4 / 2 / hop) + 1, half8 = Math.floor(N8 / 2 / hop) + 1;
  for (let oi = 0; oi < onsets.length; oi++) {
    const o = onsets[oi];
    const D = {};
    { // 2048 (높은 음)
      const pi = o - half2 - 1, po = Math.min(F - 1, o + half2 + 2);
      const pre = new Float32Array(nb2);
      if (pi >= 0) for (const k of [pi - 1, pi]) { if (k < 0) continue; specAt(N2, f2, w2, r2, i2, k * hop, a2); for (let b = 0; b < nb2; b++) pre[b] += a2[b] / 2; }
      const pb = spread(pre, 1), post = peaks(specAt(N2, f2, w2, r2, i2, po * hop, b2)), d = new Float32Array(nb2);
      for (let b = 0; b < nb2; b++) d[b] = riseW(post[b], pb[b]);
      D[2048] = d;   // 기준
    }
    { // 4096
      const pi = o - half4 - 1, po = Math.min(F - 1, o + half4 + 2);
      let pre = new Float32Array(nb4);
      if (pi >= 0) for (const k of [pi - 1, pi]) { if (k < 0) continue; dec4(k, a4); for (let b = 0; b < nb4; b++) pre[b] += a4[b] / 2; }
      const post = peaks(dec4(po, b4)), pb = spread(pre), d = new Float32Array(nb4);
      for (let b = 0; b < nb4; b++) d[b] = riseW(post[b], pb[b]) / Math.SQRT2;   // 창 길이 보정
      D[4096] = d;
    }
    { // 8192 (낮은 음)
      const pi = o - half8 - 1, po = Math.min(F - 1, o + half8 + 2);
      const pre = pi >= 0 ? specAt(N8, f8, w8, r8, i8, pi * hop, a8) : a8.fill(0);
      const pb = spread(pre), post = peaks(specAt(N8, f8, w8, r8, i8, po * hop, b8)), d = new Float32Array(nb8);
      for (let b = 0; b < nb8; b++) d[b] = riseW(post[b], pb[b]) / 2;   // 창 길이 보정
      D[8192] = d;
    }
    const pre0 = {};   // 잡음 판별용: 처음 D의 누적합 (주변 평균 대비 뾰족한지)
    for (const N of [2048, 4096, 8192]) { const d = D[N], c = new Float64Array(d.length + 1); for (let b = 0; b < d.length; b++) c[b + 1] = c[b] + d[b]; pre0[N] = c; }
    const localMean = (N, b) => { const c = pre0[N], lo = Math.max(0, b - 8), hi = Math.min(c.length - 1, b + 9); return (c[hi] - c[lo]) / (hi - lo); };
    const used = new Set(); let S0 = 0;
    for (let it = 0; it < 8; it++) {
      let best = -1, bp = -1, bamp = null;
      for (let p = PLO; p <= PHI; p++) {
        if (used.has(p)) continue;
        const N = resOf(p), d = D[N], nb = N / 2, binHz = A.sr / N, f = 440 * Math.pow(2, (p - 69) / 12);
        const amp = new Float32Array(H); let s = 0, mx = 0;
        for (let h = 0; h < H; h++) {
          const [lo, hi] = hbin(f * (h + 1), binHz, nb); if (lo >= nb - 1) break;
          let v = 0; for (let b = lo; b <= hi; b++) if (d[b] > v) v = d[b];
          amp[h] = v; s += hw[h] * v + (h === 0 ? 0.6 * v : 0); if (v > mx) mx = v;
        }
        if (mx <= 0) continue;
        { const b0 = Math.round(f / binHz), tonal = amp[0] / (localMean(N, b0) + 1e-6); if (tonal < 2.2) s *= 0.35; }   // 넓게 퍼진 잡음(하이햇 등) 제외
        const fund = p >= 45 ? amp[0] : Math.max(amp[0], amp[1]);
        if (fund < 0.3 * mx) s *= 0.25;   // 기본음이 약하면 배음일 가능성 ↑
        if (p < 52) { let sup = 0; for (let h = 0; h < 6; h++) if (amp[h] > 0.2 * mx) sup++; if (sup < 3) s *= 0.35; }   // 저음은 배음 여러 개가 받쳐줘야 함
        if (s > best) { best = s; bp = p; bamp = amp; }
      }
      if (bp < 0) break;
      if (!it) S0 = best;
      if (best < S0 * 0.1) break;
      used.add(bp);
      // 이미 찾은 음의 바로 옆 반음은 번짐일 가능성이 커서 확실할 때만
      const nearFound = cands.some(c => c.o === o && Math.abs(c.p - bp) === 1);
      if (!(nearFound && best < S0 * 0.75)) cands.push({ o, p: bp, s: best, rel: best / S0, rank: cands.filter(c => c.o === o).length });
      const f = 440 * Math.pow(2, (bp - 69) / 12);
      for (const N of [2048, 4096, 8192]) {   // 찾은 음의 배음을 지움 (해상도마다 그 해상도에서 잰 크기만큼)
        const d = D[N], nb = N / 2, binHz = A.sr / N, am = new Float32Array(H), rng = [];
        for (let h = 0; h < H; h++) {
          const r = hbin(f * (h + 1), binHz, nb); rng.push(r); if (r[0] >= nb - 1) break;
          for (let b = r[0]; b <= r[1]; b++) if (d[b] > am[h]) am[h] = d[b];
        }
        for (let h = 0; h < rng.length; h++) {
          const [lo, hi] = rng[h]; if (lo >= nb - 1) break;
          const nbh = [h - 1, h + 1].filter(j => j >= 0 && j < H).map(j => am[j]);
          const Am = h === 0 ? am[0] : Math.min(am[h], nbh.reduce((a, b) => a + b, 0) / nbh.length);   // 이웃 배음 평균까지만 (다른 음과 겹친 배음은 남김)
          for (let b = lo; b <= hi; b++) d[b] = Math.max(0, d[b] - Am);
        }
      }
    }
    if (oi % 10 === 0) { progress(0.75 + 0.25 * oi / onsets.length); await yieldUI(); }
  }
  // 같은 음이 0.12초 안에 두 번 잡히면 더 확실한 쪽만
  cands.sort((a, b) => a.p - b.p || a.o - b.o);
  for (let i = 1; i < cands.length; i++) {
    const a = cands[i - 1], b = cands[i];
    if (a.p === b.p && b.o - a.o < 12 && !a.dead) { if (b.s > a.s) a.dead = true; else b.dead = true; }
  }
  for (let i = cands.length - 1; i >= 0; i--) if (cands[i].dead) cands.splice(i, 1);
  cands.sort((a, b) => a.o - b.o || a.rank - b.rank);
  const sorted = cands.map(c => c.s).sort((a, b) => a - b), ref = sorted[Math.floor(sorted.length * 0.95)] || 1;   // 큰 음 기준
  return { poly: true, cands, onsets, spec4, nb4, F, hop: hop / A.sr, binHz4: A.sr / N4, ref };
}
// 걸러내기 + 노트 끝 (조절값만 바뀌면 이것만 다시 계산 → 즉시 반영)
function polySegments(R, P) {
  const relThr = 0.42 - 0.34 * P.voice, absThr = R.ref * (0.22 - 0.2 * P.voice);
  const keep = R.cands.filter(c => c.rank < P.poly && c.rel >= relThr && c.s >= absThr);
  const hb = f => [Math.max(1, Math.floor(f * 0.985 / R.binHz4)), Math.min(R.nb4 - 1, Math.ceil(f * 1.015 / R.binHz4))];
  const level = (k, f) => {   // 기본음/2배음 세기(dB)
    const o = k * R.nb4; const [lo, hi] = hb(f), [lo2, hi2] = hb(2 * f); let a = 0, b = 0;
    for (let i = lo; i <= hi; i++) a = Math.max(a, R.spec4[o + i]);
    for (let i = lo2; i <= hi2 && i < R.nb4; i++) b = Math.max(b, R.spec4[o + i]);
    return Math.max(a, b - 8) / 2;   // 0.5dB 단위 → dB
  };
  const byP = {}; keep.forEach(c => (byP[c.p] = byP[c.p] || []).push(c.o));
  Object.values(byP).forEach(a => a.sort((x, y) => x - y));
  const maxF = Math.round(3 / R.hop), segs = [];
  for (const c of keep) {
    const f = 440 * Math.pow(2, (c.p - 69) / 12), list = byP[c.p], nxt = list.find(o => o > c.o);
    const body = []; for (let k = c.o + 15; k < Math.min(R.F, c.o + 30); k++) body.push(level(k, f));
    const ref = body.length ? median(body) : level(Math.min(R.F - 1, c.o + 10), f);   // 어택 직후(0.15~0.3초) 울림 크기
    let pre = 0; for (let k = Math.max(0, c.o - 6); k < c.o - 1; k++) pre = Math.max(pre, level(k, f));
    const floor = Math.max(ref - P.drop, Math.min(ref - 2, pre + 2));   // 울림이 drop만큼 줄거나 치기 전 수준으로 돌아오면 끝
    const lim = Math.min(nxt ?? R.F, c.o + maxF, R.F);
    let e = c.o + 5; while (e < lim && level(e, f) > floor) e++;
    segs.push({ t0: c.o * R.hop, t1: Math.max(e, c.o + 5) * R.hop, p: c.p, db: ref });
  }
  segs.sort((a, b) => a.t0 - b.t0 || b.p - a.p);
  if (segs.length) {   // 세기: 가장 큰 음 기준 30dB 범위를 0.3~1로
    const dbs = segs.map(g => g.db).sort((a, b) => a - b), top = dbs[Math.floor(dbs.length * 0.95)];
    segs.forEach(g => { g.v = Math.round(clamp(0.3 + 0.7 * (1 - (top - g.db) / 30), 0.3, 1) * 100) / 100; });
  }
  if (!P.melody) return segs;
  // 멜로디만: 시작 순간에 더 높은 음이 울리고 있지 않은 노트만 (skyline)
  const mel = segs.filter(n => !segs.some(m => m !== n && m.p > n.p && (
    Math.abs(m.t0 - n.t0) <= 0.05 ||                                                   // 같은 순간에 친 더 높은 음
    (m.t0 < n.t0 && m.t1 > n.t0 + Math.max(0.12, 0.4 * (n.t1 - n.t0))))));            // 먼저 친 높은 음이 계속 울리는 중
  mel.sort((a, b) => a.t0 - b.t0);
  for (let i = 1; i < mel.length; i++) if (mel[i - 1].t1 > mel[i].t0) mel[i - 1].t1 = mel[i].t0;
  return mel.filter(n => n.t1 - n.t0 > 0.03);
}

function viterbiMusic(raw, P) {
  const { frames, ref } = raw, n = frames.length, U = 0.62 - 0.5 * P.voice, JUMP = 0.045, VU = 0.18;
  const score = [], back = [];
  let prev = [{ m: null, s: 0 }];
  for (let i = 0; i < n; i++) {
    const st = frames[i].map(c => ({ m: c.m, e: Math.min(1.6, c.v / ref) })); st.push({ m: null, e: U });
    const cur = [], bk = [];
    for (const s of st) {
      let bs = -Infinity, bi = 0;
      prev.forEach((p, j) => {
        let pen = 0;
        if (p.m == null && s.m == null) pen = 0;
        else if (p.m == null || s.m == null) pen = VU;
        else pen = JUMP * Math.min(Math.abs(p.m - s.m), 24);
        const v = p.s - pen; if (v > bs) { bs = v; bi = j; }
      });
      cur.push({ m: s.m, s: bs + s.e, e: s.e }); bk.push(bi);
    }
    score.push(cur); back.push(bk); prev = cur;
  }
  const m = new Array(n), lv = new Array(n);
  let j = 0, bs = -Infinity; prev.forEach((p, k) => { if (p.s > bs) { bs = p.s; j = k; } });
  for (let i = n - 1; i >= 0; i--) { const s = score[i][j]; m[i] = s.m; j = back[i][j]; }
  // 찾은 음의 배음 세기(짧은 창) → 연타 분리에 사용
  const { spec2, half2, binHz2 } = raw;
  for (let i = 0; i < n; i++) {
    if (m[i] == null) { lv[i] = -80; continue; }
    const f0 = 440 * Math.pow(2, (m[i] - 69) / 12); let sum = 0;
    for (let h = 1; h <= 4; h++) {
      const b = Math.round(f0 * h / binHz2); if (b >= half2 - 1) break;
      const q = Math.max(spec2[i * half2 + b - 1] || 0, spec2[i * half2 + b], spec2[i * half2 + b + 1]);
      sum += (Math.exp(q / 24) - 1) / 8 / h;
    }
    lv[i] = 20 * Math.log10(sum + 1e-4);
  }
  return { m, lv, t: raw.t, hop: raw.hop };
}
// 음높이 선 → 노트 (확실히 음이 바뀔 때만 나누고, 같은 음 연타는 세기 상승으로 분리)
function segment(cont, P) {
  const hop = cont.hop, n = cont.m.length;
  const minF = Math.max(2, Math.round(P.minMs / 1000 / hop)), gapF = Math.max(2, Math.round(0.035 / hop));
  const hyst = 0.32 - 0.27 * P.change;   // 반음 0.5 + 여유
  const onThr = P.onset <= 0.01 ? Infinity : 13 - 10 * P.onset;   // dB
  const m = medianFilter(cont.m, 5), lv = cont.lv, back3 = Math.max(2, Math.round(0.03 / hop));
  const on = new Float32Array(n);
  for (let i = back3; i < n; i++) on[i] = lv[i] - lv[i - back3];
  const out = []; let cur = null, cand = null, unv = 0;
  const close = endF => { if (cur && endF - cur.f0 >= minF) out.push({ f0: cur.f0, f1: endF, p: cur.p, vals: cur.vals }); cur = null; };
  for (let i = 0; i < n; i++) {
    const v = m[i];
    if (v == null) { unv++; cand = null; if (cur && unv >= gapF) close(i - unv + 1); continue; }
    if (cur && unv > 0 && unv < gapF) { /* 짧은 끊김은 무시 */ }
    unv = 0;
    if (!cur) {
      if (!cand || Math.abs(v - median(cand.vals)) > 0.8) cand = { f0: i, vals: [v] }; else cand.vals.push(v);
      if (cand.vals.length >= minF) { cur = { f0: cand.f0, vals: cand.vals.slice(), p: Math.round(median(cand.vals)) }; cand = null; }
      continue;
    }
    if (Math.abs(v - cur.p) > 0.5 + hyst) {
      if (!cand || Math.abs(v - median(cand.vals)) > 0.8) cand = { f0: i, vals: [v] }; else cand.vals.push(v);
      if (cand.vals.length >= minF) {
        const cp = Math.round(median(cand.vals));
        if (cp !== cur.p) { close(cand.f0); cur = { f0: cand.f0, vals: cand.vals.slice(), p: cp }; }
        cand = null;
      }
    } else {
      cand = null; cur.vals.push(v);
      if (on[i] > onThr && i - cur.f0 >= minF && on[i] >= on[i - 1] && on[i] >= (on[i + 1] || 0)) { const p = cur.p; close(i); cur = { f0: i, vals: [v], p }; }
    }
  }
  close(n);
  return out.map(o => ({ t0: cont.t[o.f0] - hop / 2, t1: cont.t[Math.min(o.f1, n) - 1] + hop / 2, p: o.p }));
}
function toSteps(segs, pr, P) {
  const ss = stepSec(), q = P.q, res = [];
  for (const g of segs) {
    let p = g.p + 12 * P.oct; if (S.key !== 'off') p = snapPitch(p); p = clamp(p, LOW, HIGH);
    let s = pr.startStep + (g.t0 - pr.offset) / ss, e = pr.startStep + (g.t1 - pr.offset) / ss;
    if (e <= pr.startStep) continue;
    s = Math.max(pr.startStep, s);
    if (q > 0) { s = Math.round(s / q) * q; e = Math.round(e / q) * q; if (e <= s) e = s + q; }
    else { s = Math.round(s * 100) / 100; e = Math.max(s + 0.1, Math.round(e * 100) / 100); }
    res.push(g.v != null ? { p, s, l: e - s, v: g.v } : { p, s, l: e - s });
  }
  res.sort((a, b) => a.s - b.s);
  if (P.mode !== 'poly' || P.melody) for (let i = 1; i < res.length; i++) {   // 단선율: 겹치면 앞 노트를 자름
    const a = res[i - 1], b = res[i];
    if (a.s + a.l > b.s) a.l = b.s - a.s;
  }
  return res.filter(n => n.l > 0.01);
}

// ───────── 변환 미리보기 패널 ─────────
let pendingRec = null;
function readParams() {
  return { mode: $('rpMode').value, change: +$('rpChange').value, voice: +$('rpVoice').value, minMs: +$('rpMin').value,
    onset: +$('rpOnset').value, q: +$('rpQ').value, oct: +$('rpOct').value,
    poly: +$('rpPoly').value, drop: +$('rpDrop').value, melody: $('rpMelody').checked };
}
function paramLabels() {
  const P = readParams();
  $('rpChangeV').textContent = Math.round(P.change * 100) + '%';
  $('rpVoiceV').textContent = Math.round(P.voice * 100) + '%';
  $('rpMinV').textContent = P.minMs + 'ms';
  $('rpOnsetV').textContent = P.onset <= 0.01 ? '끔' : Math.round(P.onset * 100) + '%';
  $('rpDropV').textContent = P.drop + 'dB';
  document.querySelectorAll('#recPanel [data-modes]').forEach(e => { e.style.display = e.dataset.modes.split(' ').includes(P.mode) ? '' : 'none'; });
}
async function openPreview(pr) {
  pr.A = prepAudio(pr.raw, pr.rawSr); pr.cache = {}; pr.notes = []; pendingRec = pr;
  $('rpMode').value = pr.mode; $('rpSrc').textContent = pr.source;
  $('recPanel').classList.add('show'); paramLabels();
  await reanalyze(true);
}
async function reanalyze(full) {
  const pr = pendingRec; if (!pr) return;
  const P = readParams(); paramLabels();
  const key = P.mode + (P.mode === 'voice' ? ':' + P.voice.toFixed(2) : '');
  try { localStorage.setItem('hc-recMode', P.mode); } catch (e) {}
  try {
    if (!pr.cache[key] || full && !pr.cache[key]) {
      $('rpBusy').textContent = '분석 중… 0%'; $('recPanel').classList.add('busy');
      const prog = f => { $('rpBusy').textContent = `분석 중… ${Math.round(f * 100)}%`; };
      if (P.mode === 'voice') pr.cache[key] = await trackVoice(pr.A, P, prog);
      else if (P.mode === 'poly') pr.cache[key] = await trackPoly(pr.A, prog);
      else { const rk = 'musicRaw'; if (!pr.cache[rk]) pr.cache[rk] = await trackMusic(pr.A, P, prog); pr.cache[key] = { raw: pr.cache[rk] }; }
      $('recPanel').classList.remove('busy'); $('rpBusy').textContent = '';
    }
    if (pendingRec !== pr) return;
    let cont = pr.cache[key], segs;
    if (P.mode === 'poly') { segs = polySegments(cont, P); cont = null; }
    else { if (P.mode === 'music') cont = viterbiMusic(cont.raw, P); segs = segment(cont, P); }
    pr.cont = cont;
    pr.notes = toSteps(segs, pr, P);
    // 분석된 음높이 선을 노란 선으로 표시
    const ss = stepSec();
    trace = cont ? cont.m.map((mm, i) => ({ s: pr.startStep + (cont.t[i] - pr.offset) / ss, m: mm == null ? null : mm + 12 * P.oct })).filter(x => x.s >= pr.startStep) : [];
    const dur = (pr.raw.length / pr.rawSr - pr.offset);
    $('rpInfo').textContent = `노트 ${pr.notes.length}개 · ${dur.toFixed(1)}초 · '${activeTrack().name}' 트랙`;
    if (pr.notes.length) {
      ensureLength(Math.max(...pr.notes.map(n => n.s + n.l)));
      if (!pr.scrolled) {   // 처음 한 번: 결과가 보이도록 화면 이동
        pr.scrolled = true;
        const first = pr.notes.reduce((a, n) => n.s < a.s ? n : a), mid = median(pr.notes.map(n => n.p));
        const x = first.s * STEP_W; if (x < scroller.scrollLeft || x > scroller.scrollLeft + vw * 0.8) scroller.scrollLeft = Math.max(0, x - 60);
        scroller.scrollTop = (HIGH - mid) * ROW_H - vh * 0.35;
      }
    }
    drawAll();
  } catch (err) {
    $('recPanel').classList.remove('busy'); $('rpBusy').textContent = '분석 실패'; console.error(err);
  }
}
let reT = null;
function reanalyzeSoon() { clearTimeout(reT); paramLabels(); reT = setTimeout(() => reanalyze(false), 120); }
function closePreview(apply) {
  const pr = pendingRec; if (!pr) return;
  if (mode === 'play') stop();
  if (apply && pr.notes.length) {
    pushUndo();
    const nn = pr.notes.map(n => ({ ...n, t: S.active }));
    S.notes.push(...nn); sel = new Set(nn); save();
    toast(`'${activeTrack().name}' 트랙에 노트 ${nn.length}개를 넣었어요 (되돌리기 가능)`);
  } else if (apply) toast('넣을 노트가 없어요. 소리 감지나 민감도를 조절해 보세요');
  pendingRec = null; trace = []; $('recPanel').classList.remove('show'); drawAll();
}
function previewPlay(what) {
  const pr = pendingRec; if (!pr) return;
  if (mode !== 'idle') stop();
  AC();
  const ss = stepSec(), t = activeTrack();
  T.startStep = pr.startStep; T.t0 = ac.currentTime + 0.08; T.noMetro = true;
  let end = pr.startStep;
  if (what !== 'orig') for (const n of pr.notes) { tone(n.p, timeAt(n.s), n.l * ss, t, n.v ?? 1, n); end = Math.max(end, n.s + n.l); }
  if (what !== 'res') {
    const b = ac.createBuffer(1, pr.raw.length, pr.rawSr); b.copyToChannel(pr.raw, 0);
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = b; g.gain.value = what === 'both' ? 0.55 : 1;
    src.connect(g); g.connect(master);
    const off = Math.max(0, pr.offset); src.start(T.t0, off); trackNode(src);
    end = Math.max(end, pr.startStep + (pr.raw.length / pr.rawSr - off) / ss);
  }
  T.endStep = end + 4; playhead = pr.startStep;
  mode = 'play'; setButtons(); loop();
}
// 오디오 파일에서 멜로디 따기
async function importAudioFile(file) {
  if (!file) return;
  if (mode !== 'idle') stop();
  if (pendingRec) closePreview(false);
  AC();
  toast(`'${file.name}' 불러오는 중…`);
  try {
    const buf = await ac.decodeAudioData(await file.arrayBuffer());
    const n = buf.length, x = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) x[i] += d[i] / buf.numberOfChannels; }
    const startStep = Math.round(playhead / S.grid) * S.grid;
    openPreview({ raw: x, rawSr: buf.sampleRate, offset: 0, startStep, source: file.name, mode: 'poly' });
  } catch (e) { toast('이 오디오 파일은 열 수 없어요 (' + (e.message || e.name) + ')'); }
}
function follow(vertical) {
  const x = playhead * STEP_W, sl = scroller.scrollLeft, w = scroller.clientWidth;
  if (x < sl || x > sl + w * 0.85) scroller.scrollLeft = x - w * 0.15;
  if (vertical && liveMidi != null) {
    const y = (HIGH - Math.round(liveMidi)) * ROW_H, st = scroller.scrollTop, h = scroller.clientHeight;
    if (y < st + ROW_H || y > st + h - 2 * ROW_H) scroller.scrollTop = y - h / 2;
  }
}
function ensureLength(s) { if (s > S.bars * 16 - 8) { S.bars = Math.ceil((s + 16) / 8) * 8; layout(); } }
function setButtons() {
  $('recBtn').classList.toggle('on', mode === 'rec' || mode === 'countin');
  $('playBtn').classList.toggle('on', mode === 'play');
  $('monBtn').classList.toggle('on', mode === 'monitor');
  $('metroBtn').classList.toggle('on', S.metro);
  $('countBtn').classList.toggle('on', S.countin);
}

// ───────── 그리기 ─────────
const scroller = $('scroller'), spacer = $('spacer');
const rollCv = $('roll'), keysCv = $('keys'), rulerCv = $('ruler');
const rctx = rollCv.getContext('2d'), kctx = keysCv.getContext('2d'), uctx = rulerCv.getContext('2d');
let dpr = 1, vw = 0, vh = 0, pending = false;
function sizeCv(c, w, h) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px'; }
// 축소해도 음역 밖/곡 끝 너머 빈 영역이 보이지 않도록 최소 크기 보정
function fitLimits() {
  const wrap = $('rollWrap'), W = wrap.clientWidth, H = wrap.clientHeight;
  if (H && ROW_H * ROWS < H) ROW_H = H / ROWS;
  if (W) { const need = Math.ceil(W / (16 * STEP_W)) + 2; if (S.bars < need) S.bars = Math.ceil(need / 8) * 8; }
}
function layout() {
  dpr = window.devicePixelRatio || 1;
  fitLimits();
  spacer.style.width = (S.bars * 16 * STEP_W) + 'px';
  spacer.style.height = (ROWS * ROW_H) + 'px';
  vw = scroller.clientWidth; vh = scroller.clientHeight;
  sizeCv(rollCv, vw, vh); sizeCv(keysCv, $('keysWrap').clientWidth, vh); sizeCv(rulerCv, vw, $('rulerWrap').clientHeight);
  drawAll();
}
function requestDraw() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; drawAll(); }); }
function drawAll() { drawRoll(); drawKeys(); drawRuler(); updatePos(); if (typeof updateTimelineHead === 'function') updateTimelineHead(); $('selInfo').textContent = sel.size ? `선택 ${sel.size}개` : ''; }
function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, Math.min(r, h / 2, Math.abs(w) / 2)); else c.rect(x, y, w, h); }
function updatePos() {
  const st = Math.floor(Math.max(0, playhead));
  $('posBar').textContent = `${Math.floor(st / 16) + 1}.${Math.floor(st % 16 / 4) + 1}.${st % 4 + 1}`;
  const sec = Math.max(0, playhead) * stepSec();
  $('posTime').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${(sec % 60).toFixed(1).padStart(4, '0')}`;
}

function drawRoll() {
  const c = rctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = scroller.scrollLeft, sy = scroller.scrollTop, at = activeTrack(), drumMode = isDrumTrack(at);
  c.fillStyle = '#121317'; c.fillRect(0, 0, vw, vh);
  const live = liveMidi != null ? snapPitch(liveMidi) : null;
  const r0 = Math.max(0, Math.floor(sy / ROW_H)), r1 = Math.min(ROWS - 1, Math.floor((sy + vh) / ROW_H));
  for (let r = r0; r <= r1; r++) {
    const p = HIGH - r, pc = p % 12, y = r * ROW_H - sy;
    if (drumMode) c.fillStyle = DK[p] ? (p % 2 ? '#181a1e' : '#1c1e22') : '#0e0f12';
    else c.fillStyle = !inScale(p) ? '#0f1013' : BLACK.has(pc) ? '#15161a' : '#1a1c20';
    c.fillRect(0, y, vw, ROW_H);
    if (p === hoverP) { c.fillStyle = 'rgba(255,255,255,0.035)'; c.fillRect(0, y, vw, ROW_H); }
    if (p === live) { c.fillStyle = 'rgba(242,194,48,0.13)'; c.fillRect(0, y, vw, ROW_H); }
    if (!drumMode && pc === 0) { c.fillStyle = '#4a4f5a'; c.fillRect(0, y + ROW_H - 1.5, vw, 1.5); }   // 시|도 옥타브 경계
    else { c.fillStyle = '#1f2125'; c.fillRect(0, y + ROW_H - 1, vw, 1); }
  }
  const s0 = Math.floor(sx / STEP_W), s1 = Math.ceil((sx + vw) / STEP_W), showSub = STEP_W * S.grid >= 6, showBeat = STEP_W * 4 >= 6;
  for (let s = s0; s <= s1; s++) {
    const col = s % 16 === 0 ? '#3c3f47' : (showBeat && s % 4 === 0) ? '#292c32' : (showSub && s % S.grid === 0) ? '#1e2024' : null;
    if (!col) continue;
    c.fillStyle = col; c.fillRect(Math.round(s * STEP_W - sx), 0, 1, vh);
  }
  const fs = Math.min(11, ROW_H - 6);
  c.font = `${fs}px system-ui, sans-serif`; c.textBaseline = 'middle';
  const act = rec && rec.active, others = [], mine = [];
  for (const n of S.notes) (n.t === S.active ? mine : others).push(n);
  for (const n of others.concat(mine)) {
    const x = n.s * STEP_W - sx, w = n.l * STEP_W, y = (HIGH - n.p) * ROW_H - sy;
    if (x > vw || x + w < 0 || y > vh || y + ROW_H < 0) continue;
    const tr = trk(n.t), isA = n.t === S.active;
    c.globalAlpha = (isA ? (tr.mute ? 0.55 : 1) : (audible(tr) ? 0.24 : 0.1)) * (0.55 + 0.45 * (n.v ?? 1));
    c.fillStyle = n === act ? '#ff4d4d' : tr.color;
    rr(c, x + 0.25, y + 1, Math.max(2, w - 0.5), ROW_H - 2, 3); c.fill();
    if (!isA) continue;
    if (sel.has(n)) {
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fill();
      c.strokeStyle = '#f2c230'; c.lineWidth = 1.5; rr(c, x + 1, y + 1.75, Math.max(1, w - 2), ROW_H - 3.5, 3); c.stroke();
    }
    if (w > 10) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + w - 4, y + 4, 1.5, ROW_H - 8); }
    if (isVocalTrack(tr)) {   // 보컬: 가사 표시 (비어 있으면 흐리게 '라')
      if (w > 12 && fs >= 7 && n !== lyNote) {
        c.save(); c.beginPath(); c.rect(x + 2, y, w - 6, ROW_H); c.clip();
        c.font = `600 ${fs + 1}px system-ui, sans-serif`; c.fillStyle = n.ly ? '#0d0d0d' : 'rgba(13,13,13,0.4)';
        c.fillText(n.ly || '라', x + 4, y + ROW_H / 2 + 0.5); c.restore();
      }
    } else if (w > 30 && fs >= 7) {
      c.save(); c.beginPath(); c.rect(x + 2, y, w - 7, ROW_H); c.clip();
      c.fillStyle = '#0d0d0d'; c.fillText(noteLabel(n.p, tr), x + 5, y + ROW_H / 2 + 0.5); c.restore();
    }
  }
  c.globalAlpha = 1;
  {   // 이어 부르기: 앞 노트 끝 → 이 노트 시작을 곡선으로 이어서 표시
    const ends = new Map();
    for (const n of mine) { const k = n.s + n.l; (ends.get(k) || ends.set(k, []).get(k)).push(n); }
    c.save(); c.lineWidth = 2.2; c.lineCap = 'round';
    for (const n of mine) {
      if (!n.gl) continue;
      const cs = ends.get(n.s); if (!cs) continue;
      let pv = null; for (const m of cs) if (m !== n && m.s < n.s && (!pv || Math.abs(m.p - n.p) < Math.abs(pv.p - n.p))) pv = m;
      if (!pv) continue;
      const x = n.s * STEP_W - sx, y0 = (HIGH - pv.p) * ROW_H - sy + ROW_H / 2, y1 = (HIGH - n.p) * ROW_H - sy + ROW_H / 2;
      if (x < -40 || x > vw + 40) continue;
      const w = Math.min(14, STEP_W * Math.min(pv.l, n.l) * 0.5);
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(x - w, y0); c.bezierCurveTo(x, y0, x, y1, x + w, y1); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w, y1, 2.2, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  {   // 묶음: 점선 상자 + 이름
    const gb = new Map();
    for (const n of mine) {
      if (!n.g) continue;
      let b = gb.get(n.g);
      if (!b) gb.set(n.g, b = { s0: n.s, s1: n.s + n.l, p0: n.p, p1: n.p, nm: n.gn || '묶음', on: false });
      else { b.s0 = Math.min(b.s0, n.s); b.s1 = Math.max(b.s1, n.s + n.l); b.p0 = Math.min(b.p0, n.p); b.p1 = Math.max(b.p1, n.p); }
      if (sel.has(n)) b.on = true;
    }
    c.save(); c.lineWidth = 1.2; c.setLineDash([5, 4]); c.font = '600 10px system-ui, sans-serif'; c.textBaseline = 'alphabetic';
    bundleLabels = [];
    for (const [gid, b] of gb) {
      const x = b.s0 * STEP_W - sx - 3, y = (HIGH - b.p1) * ROW_H - sy - 3, w = (b.s1 - b.s0) * STEP_W + 6, h = (b.p1 - b.p0 + 1) * ROW_H + 6;
      if (x > vw || x + w < 0 || y > vh || y + h < 0) continue;
      c.strokeStyle = b.on ? 'rgba(242,194,48,.95)' : 'rgba(242,194,48,.38)';
      c.fillStyle = b.on ? 'rgba(242,194,48,.06)' : 'rgba(242,194,48,.025)';
      rr(c, x, y, w, h, 5); c.fill(); c.stroke();
      const lab = '▣ ' + b.nm, tw = c.measureText(lab).width;
      if (w > 26) {
        const short = tw > w - 4, lw = short ? 14 : tw + 8;
        // 이름표: 끌어서 묶음 통째로 옮기기
        c.setLineDash([]); c.fillStyle = b.on ? 'rgba(242,194,48,.18)' : 'rgba(20,21,24,.75)'; rr(c, x, y - 15, lw, 14, 4); c.fill(); c.setLineDash([5, 4]);
        c.fillStyle = b.on ? '#f2c230' : 'rgba(242,194,48,.7)'; c.fillText(short ? '▣' : lab, x + 3, y - 4.5);
        bundleLabels.push({ g: gid, x0: x + sx - 3, y0: y + sy - 18, x1: x + sx + lw + 3, y1: y + sy + 2 });
      }
    }
    c.restore();
  }
  if (trace.length) {
    c.strokeStyle = 'rgba(242,194,48,0.9)'; c.lineWidth = 1.5; c.beginPath(); let pen = false;
    for (const t of trace) {
      if (t.m == null) { pen = false; continue; }
      const x = t.s * STEP_W - sx, y = (HIGH - t.m) * ROW_H + ROW_H / 2 - sy;
      if (x < -50 || x > vw + 50) { pen = false; continue; }
      if (!pen) { c.moveTo(x, y); pen = true; } else c.lineTo(x, y);
    }
    c.stroke();
  }
  if (drag && drag.type === 'band') {
    const xa = Math.min(drag.x0, drag.x1) - sx, xb = Math.max(drag.x0, drag.x1) - sx;
    const ya = Math.min(drag.y0, drag.y1) - sy, yb = Math.max(drag.y0, drag.y1) - sy;
    c.fillStyle = 'rgba(242,194,48,0.1)'; c.fillRect(xa, ya, xb - xa, yb - ya);
    c.strokeStyle = '#f2c230'; c.lineWidth = 1; c.setLineDash([4, 3]);
    c.strokeRect(Math.round(xa) + 0.5, Math.round(ya) + 0.5, Math.round(xb - xa), Math.round(yb - ya)); c.setLineDash([]);
  }
  if (pendingRec && pendingRec.notes) {   // 변환 미리보기 노트
    for (const n of pendingRec.notes) {
      const x = n.s * STEP_W - sx, w = n.l * STEP_W, y = (HIGH - n.p) * ROW_H - sy;
      if (x > vw || x + w < 0 || y > vh || y + ROW_H < 0) continue;
      c.globalAlpha = 0.75; c.fillStyle = at.color; rr(c, x + 0.25, y + 1, Math.max(2, w - 0.5), ROW_H - 2, 3); c.fill();
      c.globalAlpha = 1; c.strokeStyle = '#f2c230'; c.lineWidth = 1; c.setLineDash([3, 2]);
      rr(c, x + 0.75, y + 1.5, Math.max(1, w - 1.5), ROW_H - 3, 3); c.stroke(); c.setLineDash([]);
    }
  }
  const ghost = ghostNotes();
  if (ghost) {
    const col = at.color;
    for (const n of ghost) {
      const x = n.s * STEP_W - sx, w = n.l * STEP_W, y = (HIGH - n.p) * ROW_H - sy;
      c.globalAlpha = 0.45; c.fillStyle = col; rr(c, x + 0.25, y + 1, Math.max(2, w - 0.5), ROW_H - 2, 3); c.fill();
      c.globalAlpha = 1; c.strokeStyle = '#f2c230'; c.lineWidth = 1.2; c.setLineDash([3, 2]);
      rr(c, x + 0.85, y + 1.5, Math.max(1, w - 1.7), ROW_H - 3, 3); c.stroke(); c.setLineDash([]);
    }
  }
  const px = playhead * STEP_W - sx;
  if (px >= -2 && px <= vw + 2) { c.fillStyle = (mode === 'rec' || mode === 'countin') ? '#ff4d4d' : '#eef0f4'; c.fillRect(Math.round(px), 0, 1.5, vh); }
}

function drawKeys() {
  const c = kctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = keysCv.width / dpr, h = keysCv.height / dpr, sy = scroller.scrollTop, drumMode = isDrumTrack(activeTrack());
  c.fillStyle = '#121317'; c.fillRect(0, 0, w, h);
  const live = liveMidi != null ? snapPitch(liveMidi) : null, fs = Math.min(10.5, ROW_H - 6);
  c.textBaseline = 'middle';
  for (let r = 0; r < ROWS; r++) {
    const p = HIGH - r, y = r * ROW_H - sy;
    if (y > h || y + ROW_H < 0) continue;
    if (drumMode) {
      c.fillStyle = DK[p] ? (p % 2 ? '#1b1d21' : '#212328') : '#0e0f12'; c.fillRect(0, y, w, ROW_H - 1);
      if (p === hoverP) { c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, y, w, ROW_H - 1); }
      if (DK[p] && fs >= 7) { c.fillStyle = '#dde1e8'; c.font = `${fs}px system-ui, sans-serif`; c.textAlign = 'left'; c.fillText(DK[p][0], 7, y + ROW_H / 2); }
      continue;
    }
    const blk = BLACK.has(p % 12), on = p === live;
    c.fillStyle = on ? '#f2c230' : '#e6e8ec'; c.fillRect(0, y, w, ROW_H);
    if (p % 12 === 0) { c.fillStyle = '#3a3e47'; c.fillRect(0, y + ROW_H - 1.5, w, 1.5); }
    else { c.fillStyle = '#8a8f98'; c.fillRect(0, y + ROW_H - 1, w, 1); }
    if (blk) { c.fillStyle = on ? '#b58d14' : '#111215'; c.fillRect(0, y + 1, w * 0.58, ROW_H - 2); }
    if (p === hoverP && !on) {   // 마우스가 가리키는 건반은 살짝 어둡게
      c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(blk ? w * 0.58 : 0, y, blk ? w * 0.42 : w, ROW_H - 1);
      if (blk) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, y + 1, w * 0.58, ROW_H - 2); }
    }
    if (fs < 7 && p % 12 !== 0) continue;
    c.font = (p % 12 === 0 ? 'bold ' : '') + `${Math.max(fs, 7)}px system-ui, sans-serif`;
    if (blk) { c.textAlign = 'left'; c.fillStyle = on ? '#111' : '#8a8f99'; c.fillText(name(p), 4, y + ROW_H / 2); }
    else { c.textAlign = 'right'; c.fillStyle = on ? '#111' : (p % 12 === 0 ? '#000' : '#555a64'); c.fillText(name(p), w - 6, y + ROW_H / 2); }
  }
  c.textAlign = 'left';
}

function drawRuler() {
  const c = uctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rulerCv.width / dpr, h = rulerCv.height / dpr, sx = scroller.scrollLeft, barW = 16 * STEP_W;
  c.fillStyle = '#121317'; c.fillRect(0, 0, w, h);
  c.font = '10.5px ui-monospace, Menlo, monospace'; c.textBaseline = 'middle';
  const every = Math.max(1, Math.ceil(28 / barW));
  const b0 = Math.floor(sx / barW), b1 = Math.ceil((sx + w) / barW);
  for (let b = b0; b <= b1; b++) {
    const x = b * barW - sx;
    c.fillStyle = '#3c3f47'; c.fillRect(Math.round(x), b % every ? h - 8 : 0, 1, b % every ? 8 : h);
    if (b % every === 0) { c.fillStyle = '#b0b5bf'; c.fillText(String(b + 1), x + 4, h / 2 - 2); }
    if (STEP_W * 4 >= 8) for (let q = 1; q < 4; q++) { c.fillStyle = '#2b2e34'; c.fillRect(Math.round(x + q * 4 * STEP_W), h - 5, 1, 5); }
  }
  const px = playhead * STEP_W - sx;
  c.fillStyle = (mode === 'rec' || mode === 'countin') ? '#ff4d4d' : '#f2c230';
  c.beginPath(); c.moveTo(px - 6, 0); c.lineTo(px + 7, 0); c.lineTo(px + 0.5, 9); c.fill();
}

// ───────── 확대 / 축소 ─────────
function setZoom(nx, ny, ax = vw / 2, ay = vh / 2) {
  const sAt = (scroller.scrollLeft + ax) / STEP_W, rAt = (scroller.scrollTop + ay) / ROW_H;
  STEP_W = clamp(nx, 4, 90); ROW_H = clamp(ny, Math.max(6, $('rollWrap').clientHeight / ROWS), 40);
  S.zoomX = STEP_W; S.zoomY = ROW_H;
  layout();
  scroller.scrollLeft = sAt * STEP_W - ax; scroller.scrollTop = rAt * ROW_H - ay;
  $('zoomVal').textContent = Math.round(STEP_W / 22 * 100) + '%';
  drawAll(); saveSoon();
}
function wheelZoom(e, axisFromShift = true) {
  if (!(e.ctrlKey || e.metaKey)) return false;
  e.preventDefault();
  const d = e.deltaY || e.deltaX, f = Math.exp(-d * 0.0018), r = scroller.getBoundingClientRect();
  const ax = clamp(e.clientX - r.left, 0, vw), ay = clamp(e.clientY - r.top, 0, vh);
  if (!axisFromShift) setZoom(STEP_W * f, ROW_H, ax, ay);
  else if (e.shiftKey) setZoom(STEP_W * f, ROW_H, ax, ay);        // Ctrl+Shift: 가로만
  else if (e.altKey) setZoom(STEP_W, ROW_H * f, ax, ay);          // Ctrl+Alt: 세로만
  else setZoom(STEP_W * f, ROW_H * f, ax, ay);                    // Ctrl: 화면 전체 확대/축소
  return true;
}
scroller.addEventListener('wheel', e => wheelZoom(e), { passive: false });

// ───────── 편집 ─────────
function evPos(e) {
  const r = scroller.getBoundingClientRect(), lx = e.clientX - r.left, ly = e.clientY - r.top;
  return { lx, ly, x: lx + scroller.scrollLeft, y: ly + scroller.scrollTop };
}
const pitchAtY = y => clamp(HIGH - Math.floor(y / ROW_H), LOW, HIGH);
function hitNote(x, y, any = false) {
  const p = pitchAtY(y);
  const find = test => { for (let i = S.notes.length - 1; i >= 0; i--) { const n = S.notes[i]; if (n.p === p && test(n) && x >= n.s * STEP_W && x <= (n.s + n.l) * STEP_W) return n; } return null; };
  return find(n => n.t === S.active) || (any ? find(n => n.t !== S.active) : null);
}
// ── 묶음: 스텝 입력에서 '묶음'으로 내보낸 노트들(g = 묶음 id, gn = 이름). 하나만 눌러도 통째로 선택 ──
const newGid = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const groupOf = n => n && n.g ? S.notes.filter(m => m.g === n.g && m.t === n.t) : [n];
function expandGroups(set) {
  const gs = new Set(); for (const n of set) if (n.g) gs.add(n.t + '|' + n.g);
  if (!gs.size) return set;
  const out = new Set(set); for (const n of S.notes) if (n.g && gs.has(n.t + '|' + n.g)) out.add(n);
  return out;
}
function regroup(arr) {   // 복사·복제로 새로 생긴 노트에는 새 묶음 id (원본 묶음과 섞이지 않게)
  const m = new Map(); for (const n of arr) if (n.g) { if (!m.has(n.g)) m.set(n.g, newGid()); n.g = m.get(n.g); }
  return arr;
}
function groupSel() {
  if (mode !== 'idle') return;
  if (sel.size < 2) return toast('묶을 노트를 2개 이상 선택하세요');
  pushUndo(); const g = newGid();
  for (const n of sel) { n.g = g; n.gn = '묶음'; }
  save(); drawAll(); toast(`노트 ${sel.size}개를 한 묶음으로 만들었어요 (Ctrl+Shift+B로 풀기)`);
}
// 이어 부르기: 선택한 노트를 앞 노트와 한 음처럼 이어요 (빈틈이 있으면 앞 노트를 늘려서 붙임) · 다시 하면 풀기
function linkSel() {
  if (mode !== 'idle') return;
  const arr = [...sel].filter(n => n.t === S.active).sort((a, b) => a.s - b.s || b.p - a.p);
  if (!arr.length) return toast('이을 노트를 먼저 선택하세요 (2개 이상 고르면 차례로 이어져요)');
  const nGl = arr.filter(n => n.gl).length;
  if (nGl && nGl >= arr.length - 1) {   // 이미 이어져 있으면 풀기
    pushUndo(); arr.forEach(n => delete n.gl); save(); drawAll(); return toast('이어 부르기를 풀었어요 — 다시 음마다 새로 쳐요');
  }
  const mine = S.notes.filter(n => n.t === S.active);
  pushUndo(); let k = 0;
  for (const n of arr) {
    let pv = null;   // n 바로 앞(시작이 더 이른 것 중 가장 늦은 시작) · 빈틈 1마디 안
    for (const m of mine) if (m !== n && m.s < n.s && n.s - (m.s + m.l) <= 16 && m.s + m.l > n.s - 16 && (!pv || m.s > pv.s || (m.s === pv.s && Math.abs(m.p - n.p) < Math.abs(pv.p - n.p)))) pv = m;
    if (!pv) continue;
    pv.l = n.s - pv.s; n.gl = true; k++;
  }
  save(); drawAll();
  toast(k ? `노트 ${k}개를 앞 음과 이었어요 — 다시 치지 않고 한 음처럼 미끄러져요 (Ctrl+L 다시 누르면 풀기)` : '앞에 이을 노트가 없어요 (바로 앞 1마디 안에 노트가 있어야 해요)');
}
function ungroupSel() {
  if (mode !== 'idle') return;
  const arr = [...sel].filter(n => n.g);
  if (!arr.length) return toast('선택한 노트 중에 묶음이 없어요');
  pushUndo(); const k = new Set(arr.map(n => n.g)).size;
  for (const n of arr) { delete n.g; delete n.gn; }
  save(); drawAll(); toast(`묶음 ${k}개를 풀었어요 — 이제 노트를 하나씩 편집할 수 있어요`);
}
const snapOrig = () => new Map([...sel].map(n => [n, { s: n.s, p: n.p, l: n.l }]));
function applyMove(orig, ds, dp) {
  let minS = Infinity, minP = Infinity, maxP = -Infinity;
  for (const o of orig.values()) { minS = Math.min(minS, o.s); minP = Math.min(minP, o.p); maxP = Math.max(maxP, o.p); }
  ds = Math.max(-minS, ds); dp = clamp(dp, LOW - minP, HIGH - maxP);
  for (const [n, o] of orig) { n.s = o.s + ds; n.p = o.p + dp; }
}
let lastY = 0;
function startGroup(e, hit, x, forceMove) {
  pushUndo();
  let changed = false;
  if (e.altKey) {
    const src = [...sel], clones = regroup(src.map(n => ({ ...n })));
    S.notes.push(...clones); hit = clones[src.indexOf(hit)] || hit; sel = new Set(clones); changed = true;
  }
  const edge = !forceMove && x > (hit.s + hit.l) * STEP_W - 7;
  drag = { type: edge ? 'resize' : 'move', grab: hit, x0: x, y0: lastY, orig: snapOrig(), changed, lastP: hit.p };
  preview(hit.p);
}
function penDown(e, x, y) {
  const hit = hitNote(x, y);
  if (hit) { if (!sel.has(hit)) sel = new Set(groupOf(hit)); startGroup(e, hit, x); return; }
  pushUndo();
  const p = pitchAtY(y), s = Math.floor(x / STEP_W / S.grid) * S.grid, n = { p, s, l: S.grid, t: S.active };
  S.notes.push(n); sel = new Set([n]);
  drag = { type: 'paint', n, changed: true }; preview(p);
}
function paintAt(x, y) {
  const n = drag.n, g = S.grid, p = pitchAtY(y), s = Math.max(0, Math.floor(x / STEP_W / g) * g);
  if (p === n.p && s >= n.s && !isDrumTrack(activeTrack())) n.l = s - n.s + g;
  else {
    const ex = hitNote(s * STEP_W + 1, y);
    if (ex) drag.n = ex;
    else { const nn = { p, s, l: g, t: S.active }; S.notes.push(nn); sel.add(nn); drag.n = nn; preview(p); }
  }
  ensureLength(drag.n.s + drag.n.l); requestDraw();
}
function selectDown(e, x, y, marquee) {
  const hit = hitNote(x, y);
  if (hit && (!marquee || sel.has(hit))) {
    if (e.shiftKey && !marquee) { const gp = groupOf(hit); if (sel.has(hit)) { gp.forEach(n => sel.delete(n)); return; } gp.forEach(n => sel.add(n)); }
    else if (!sel.has(hit)) sel = new Set(groupOf(hit));
    startGroup(e, hit, x); return;
  }
  drag = { type: 'band', x0: x, y0: y, x1: x, y1: y, base: e.shiftKey ? new Set(sel) : new Set() };
  sel = new Set(drag.base);
}
function bandSelect() {
  const xa = Math.min(drag.x0, drag.x1), xb = Math.max(drag.x0, drag.x1), ya = Math.min(drag.y0, drag.y1), yb = Math.max(drag.y0, drag.y1);
  const res = new Set(drag.base);
  for (const n of S.notes) {
    if (n.t !== S.active) continue;
    const nx0 = n.s * STEP_W, nx1 = (n.s + n.l) * STEP_W, ny0 = (HIGH - n.p) * ROW_H, ny1 = ny0 + ROW_H;
    if (nx1 > xa && nx0 < xb && ny1 > ya && ny0 < yb) res.add(n);
  }
  sel = expandGroups(res);
}
function eraseAt(x, y) { const h = hitNote(x, y); if (h) { S.notes = S.notes.filter(m => m !== h); sel.delete(h); drag.changed = true; requestDraw(); } }
function pickAt(x, y) {
  const h = hitNote(x, y, true); if (!h) return;
  if (h.t !== S.active) { setActive(h.t); toast(`'${activeTrack().name}' 트랙으로 전환`); }
  sel = new Set([h]); preview(h.p);
}
// 묶음 이름표 위치 (그릴 때 기록 · 화면 전체 좌표)
let bundleLabels = [];
function bundleLabelAt(x, y) {
  for (let i = bundleLabels.length - 1; i >= 0; i--) { const b = bundleLabels[i]; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b.g; }
  return null;
}
function hoverCursor(x, y, e) {
  if (e.ctrlKey || e.metaKey) { scroller.style.cursor = 'zoom-in'; return; }
  if (!pasting && bundleLabelAt(x, y)) { scroller.style.cursor = 'grab'; return; }
  const t = S.tool; let cur = CURSOR[t];
  if (t === 'pen' || t === 'select' || t === 'range') {
    const h = hitNote(x, y);
    if (h && (t !== 'range' || sel.has(h))) cur = x > (h.s + h.l) * STEP_W - 7 ? 'ew-resize' : 'move';
  }
  scroller.style.cursor = cur;
}
const isMac = /Mac/.test(navigator.platform);
scroller.addEventListener('contextmenu', e => e.preventDefault());
// ── 두 손가락 확대/축소 (가로로 벌리면 가로만, 세로로 벌리면 세로만, 대각선이면 전체) + 두 손가락 이동
const tPtr = new Map();
let pinch = null;
function cancelDragForPinch() {   // 첫 손가락이 이미 하던 편집은 취소
  if (autoS) { cancelAnimationFrame(autoS.raf); autoS = null; }
  if (!drag) return;
  const d = drag; drag = null;
  if (d.type === 'band') { requestDraw(); return; }
  if (d.type === 'pan' || d.type === 'zoom') return;
  if (d.changed) undo(); else undoStack.pop();
  if (pendingRestore) { setTool(pendingRestore, true); pendingRestore = null; }
  drawAll();
}
function pinchGeo() {
  const [a, b] = [...tPtr.values()], r = scroller.getBoundingClientRect();
  return { dx: Math.abs(a.x - b.x), dy: Math.abs(a.y - b.y), d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
}
function startPinch() {
  const g = pinchGeo(); if (g.d < 8) { pinch = null; return; }
  const mode = g.dx > g.dy * 2 ? 'x' : g.dy > g.dx * 2 ? 'y' : 'xy';
  pinch = { g0: g, mode, w0: STEP_W, h0: ROW_H, sAt: (scroller.scrollLeft + g.mx) / STEP_W, rAt: (scroller.scrollTop + g.my) / ROW_H };
}
scroller.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  tPtr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (tPtr.size === 2) { cancelDragForPinch(); startPinch(); e.stopImmediatePropagation(); e.preventDefault(); try { scroller.setPointerCapture(e.pointerId); } catch (_) {} }
  else if (tPtr.size > 2) e.stopImmediatePropagation();
});
scroller.addEventListener('pointermove', e => {
  if (!tPtr.has(e.pointerId)) return;
  tPtr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (tPtr.size < 2) return;
  e.stopImmediatePropagation();
  if (!pinch) { startPinch(); if (!pinch) return; }
  const g = pinchGeo(), p = pinch;
  const fx = p.mode === 'y' ? 1 : (p.mode === 'x' ? Math.max(g.dx, 12) / Math.max(p.g0.dx, 12) : g.d / p.g0.d);
  const fy = p.mode === 'x' ? 1 : (p.mode === 'y' ? Math.max(g.dy, 12) / Math.max(p.g0.dy, 12) : g.d / p.g0.d);
  setZoom(p.w0 * fx, p.h0 * fy, g.mx, g.my);
  scroller.scrollLeft = p.sAt * STEP_W - g.mx;   // 두 손가락 가운데 점이 따라오도록 같이 이동
  scroller.scrollTop = p.rAt * ROW_H - g.my;
  requestDraw();
});
const pinchUp = e => {
  if (!tPtr.has(e.pointerId)) return;
  const was = tPtr.size >= 2; tPtr.delete(e.pointerId);
  if (was) { e.stopImmediatePropagation(); pinch = null; if (tPtr.size === 1) { const [id] = tPtr.keys(); tPtr.delete(id); } }   // 남은 손가락은 편집으로 이어지지 않게
};
scroller.addEventListener('pointerup', pinchUp);
scroller.addEventListener('pointercancel', pinchUp);
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));   // iOS 사파리 자체 확대 막기

scroller.addEventListener('pointerdown', e => {
  if (mode === 'rec' || mode === 'countin') return;
  const { lx, ly, x, y } = evPos(e);
  if (lx >= scroller.clientWidth || ly >= scroller.clientHeight) return;
  AC(); lastY = y;
  scroller.setPointerCapture(e.pointerId);
  // Ctrl + 우클릭 드래그 = 확대/축소 (맥은 Ctrl+클릭도 우클릭)
  if ((e.ctrlKey || e.metaKey) && (e.button === 2 || (isMac && e.button === 0 && e.ctrlKey))) {
    drag = { type: 'zoom', cx: e.clientX, cy: e.clientY, w0: STEP_W, h0: ROW_H, ax: lx, ay: ly };
    scroller.style.cursor = 'zoom-in'; return;
  }
  lastClient = { x: e.clientX, y: e.clientY };
  if (e.button === 0 && !pasting && !pendingRec) {   // 묶음 이름표를 잡고 끌면 묶음 통째로 이동 (Alt = 복제)
    const gid = bundleLabelAt(x, y);
    if (gid) {
      const grp = S.notes.filter(n => n.g === gid && n.t === S.active);
      if (grp.length) {
        if (!e.shiftKey || !grp.some(n => sel.has(n))) sel = e.shiftKey ? new Set([...sel, ...grp]) : new Set(grp);
        const hit = grp.reduce((a, b) => (b.s < a.s || (b.s === a.s && b.p > a.p)) ? b : a);
        startGroup(e, hit, x, true); scroller.style.cursor = 'grabbing'; drawAll(); return;
      }
    }
  }
  if (e.button === 1 || (e.button === 0 && S.tool === 'hand' && (!pasting || space))) {
    e.preventDefault();
    if (space) space.used = true;
    drag = { type: 'pan', cx: e.clientX, cy: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop };
    scroller.style.cursor = 'grabbing'; return;
  }
  if (pendingRec) return;   // 변환 미리보기 중에는 화면 이동/확대만
  if (pasting) {   // 붙여넣기 모드: 왼쪽 클릭 = 놓기, 우클릭 = 취소
    if (e.button === 0) placePaste(e.shiftKey); else if (e.button === 2) endPaste();
    drawAll(); return;
  }
  if (e.button === 2) { pushUndo(); drag = { type: 'erase', changed: false }; eraseAt(x, y); return; }
  if (e.button !== 0) return;
  switch (S.tool) {
    case 'pen': penDown(e, x, y); break;
    case 'select': selectDown(e, x, y, false); break;
    case 'range': selectDown(e, x, y, true); break;
    case 'eraser': pushUndo(); drag = { type: 'erase', changed: false }; eraseAt(x, y); break;
    case 'picker': pickAt(x, y); break;
  }
  drawAll();
});
function setHover(p) { if (p !== hoverP) { hoverP = p; requestDraw(); } }
scroller.addEventListener('pointerleave', () => { setHover(null); if (pasting) { lastClient = null; requestDraw(); } });
scroller.addEventListener('pointermove', e => {
  const { x, y, lx, ly } = evPos(e);
  setHover(lx < scroller.clientWidth && ly < scroller.clientHeight ? pitchAtY(y) : null);
  lastClient = { x: e.clientX, y: e.clientY };
  if (pasting && !drag) { scroller.style.cursor = 'copy'; requestDraw(); return; }
  if (!drag) { if (mode !== 'rec' && mode !== 'countin') hoverCursor(x, y, e); return; }
  if (drag.type !== 'pan' && drag.type !== 'zoom') queueAutoScroll(e);
  dragMoveAt(e);
});
// ── 끌다가 화면 가장자리에 닿으면 자동 스크롤 (가까울수록 빠르게)
let autoS = null;
function edgeSpeed(v, lo, hi, touch) { const Z = touch ? 26 : 46, MAX = touch ? 4 : 22; if (v < lo + Z) return -Math.ceil(Math.min(1.5, (lo + Z - v) / Z) * MAX); if (v > hi - Z) return Math.ceil(Math.min(1.5, (v - (hi - Z)) / Z) * MAX); return 0; }
function queueAutoScroll(e) {
  autoS = autoS || { raf: 0 };
  autoS.ev = { touch: e.pointerType === 'touch', clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
  if (!autoS.raf) autoS.raf = requestAnimationFrame(autoScrollTick);
}
function autoScrollTick() {
  if (!autoS) return;
  autoS.raf = 0;
  if (!drag || drag.type === 'pan' || drag.type === 'zoom') { autoS = null; return; }
  const r = scroller.getBoundingClientRect(), ev = autoS.ev;
  const dx = edgeSpeed(ev.clientX, r.left, r.left + scroller.clientWidth, ev.touch), dy = edgeSpeed(ev.clientY, r.top, r.top + scroller.clientHeight, ev.touch);
  if (!dx && !dy) return;
  if (dx > 0 && scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4) ensureLength((scroller.scrollLeft + scroller.clientWidth) / STEP_W + 16);   // 곡 끝이면 마디 늘림
  const sl = scroller.scrollLeft, st = scroller.scrollTop;
  scroller.scrollLeft += dx; scroller.scrollTop += dy;
  if (scroller.scrollLeft !== sl || scroller.scrollTop !== st) dragMoveAt(ev);   // 화면이 움직인 만큼 선택/이동도 따라감
  autoS.raf = requestAnimationFrame(autoScrollTick);
}
function dragMoveAt(e) {
  const { x, y } = evPos(e);
  const g = S.grid;
  switch (drag.type) {
    case 'zoom': setZoom(drag.w0 * Math.exp((e.clientX - drag.cx) * 0.008), drag.h0 * Math.exp(-(e.clientY - drag.cy) * 0.008), drag.ax, drag.ay); return;
    case 'pan': scroller.scrollLeft = drag.sl - (e.clientX - drag.cx); scroller.scrollTop = drag.st - (e.clientY - drag.cy); return;
    case 'erase': eraseAt(x, y); return;
    case 'paint': paintAt(x, y); return;
    case 'band': drag.x1 = x; drag.y1 = y; bandSelect(); requestDraw(); return;
    case 'move': {
      const ds = Math.round((x - drag.x0) / STEP_W / g) * g, dp = -Math.round((y - drag.y0) / ROW_H);
      applyMove(drag.orig, ds, dp);
      if (ds || dp) drag.changed = true;
      if (drag.grab.p !== drag.lastP) { drag.lastP = drag.grab.p; preview(drag.grab.p); }
      ensureLength(drag.grab.s + drag.grab.l); requestDraw(); return;
    }
    case 'resize': {
      const dl = Math.round((x - drag.x0) / STEP_W / g) * g;
      for (const [n, o] of drag.orig) n.l = Math.max(1, o.l + dl);
      if (dl) drag.changed = true;
      ensureLength(drag.grab.s + drag.grab.l); requestDraw(); return;
    }
  }
}
function endDrag() {
  if (autoS) { cancelAnimationFrame(autoS.raf); autoS = null; }
  if (!drag) return;
  const d = drag; drag = null;
  if (pendingRestore) { setTool(pendingRestore, true); pendingRestore = null; }
  if (d.type === 'pan' || d.type === 'zoom') { scroller.style.cursor = pasting ? 'copy' : CURSOR[S.tool]; return; }
  if (d.type !== 'band' && !d.changed) undoStack.pop();
  save(); drawAll();
}
scroller.addEventListener('pointerup', endDrag);
scroller.addEventListener('pointercancel', endDrag);
scroller.addEventListener('dblclick', e => {
  if (isVocalTrack(activeTrack()) && S.tool !== 'eraser') { const { x, y } = evPos(e), h = hitNote(x, y); if (h) { e.preventDefault(); editLyric(h); return; } }
  if (S.tool !== 'pen') return;
  const { x, y } = evPos(e), h = hitNote(x, y);
  if (h) { pushUndo(); S.notes = S.notes.filter(m => m !== h); sel.delete(h); save(); drawAll(); }
});
// 모바일: 보컬 트랙에서 노트를 두 번 톡 치면 가사 입력 (터치는 dblclick이 오지 않는 경우가 많아서)
{
  let lastTap = null;
  scroller.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch' || tPtr.size > 1 || pinch || !isVocalTrack(activeTrack()) || S.tool === 'eraser' || mode !== 'idle') return;
    const now = Date.now(), pt = { x: e.clientX, y: e.clientY };
    if (lastTap && now - lastTap.t < 380 && Math.hypot(pt.x - lastTap.x, pt.y - lastTap.y) < 26) {
      lastTap = null;
      const { x, y } = evPos(e), h = hitNote(x, y);
      if (h) editLyric(h);
    } else lastTap = { t: now, ...pt };
  });
}
scroller.addEventListener('scroll', () => { requestDraw(); if (lyNote) placeLyIn(); });
$('keysWrap').addEventListener('pointerdown', e => {
  const r = $('keysWrap').getBoundingClientRect(), row = Math.floor((e.clientY - r.top + scroller.scrollTop) / ROW_H);
  if (row >= 0 && row < ROWS) preview(HIGH - row);
});
$('keysWrap').addEventListener('pointermove', e => {
  const row = Math.floor((e.clientY - $('keysWrap').getBoundingClientRect().top + scroller.scrollTop) / ROW_H);
  setHover(row >= 0 && row < ROWS ? HIGH - row : null);
});
$('keysWrap').addEventListener('pointerleave', () => setHover(null));
$('keysWrap').addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(STEP_W, ROW_H * Math.exp(-(e.deltaY || e.deltaX) * 0.0018), 0, clamp(e.clientY - $('keysWrap').getBoundingClientRect().top, 0, vh)); return; }
  scroller.scrollTop += e.deltaY; e.preventDefault();
}, { passive: false });
$('rulerWrap').addEventListener('pointerdown', e => {
  if (mode !== 'idle') return;
  const r = $('rulerWrap').getBoundingClientRect();
  playhead = Math.max(0, Math.round((e.clientX - r.left + scroller.scrollLeft) / STEP_W / S.grid) * S.grid);
  drawAll();
});
$('rulerWrap').addEventListener('wheel', e => {
  if (wheelZoom(e, false)) return;
  scroller.scrollLeft += e.deltaY || e.deltaX; e.preventDefault();
}, { passive: false });

function deleteSel() { if (!sel.size || mode !== 'idle') return; pushUndo(); S.notes = S.notes.filter(n => !sel.has(n)); sel = new Set(); save(); drawAll(); }
function copySel(quiet) {
  if (!sel.size) { if (!quiet) toast('선택된 노트가 없어요'); return false; }
  const arr = [...sel], m = Math.min(...arr.map(n => n.s)), end = Math.max(...arr.map(n => n.s + n.l));
  const items = arr.map(n => ({ p: n.p, s: n.s - m, l: n.l, ...(n.ly ? { ly: n.ly } : {}), ...(n.g ? { g: n.g, gn: n.gn } : {}), ...(n.gl ? { gl: true } : {}) })), ps = items.map(c => c.p);
  clip = { items, span: Math.max(4, Math.ceil((end - m) / 4) * 4), minP: Math.min(...ps), maxP: Math.max(...ps),
    anchorP: Math.max(...items.filter(c => c.s === 0).map(c => c.p)) };   // 맨 앞(가장 높은) 노트가 마우스 위치에 오도록
  if (!quiet) toast(`노트 ${arr.length}개 복사 · Ctrl+V 후 원하는 곳을 클릭해 붙여넣기`);
  return true;
}
function paste(at) {
  if (mode !== 'idle') return;
  if (!clip) return toast('복사한 노트가 없어요');
  pushUndo();
  if (at == null) at = Math.round(playhead / S.grid) * S.grid;
  const nn = regroup(clip.items.map(c => ({ p: c.p, s: at + c.s, l: c.l, t: S.active, ...(c.ly ? { ly: c.ly } : {}), ...(c.g ? { g: c.g, gn: c.gn } : {}), ...(c.gl ? { gl: true } : {}) })));
  S.notes.push(...nn); sel = new Set(nn);
  playhead = at + clip.span; ensureLength(playhead); follow(false); save(); drawAll();
}
// 붙여넣기 모드: 복사한 노트 묶음이 마우스를 따라다니다 클릭하면 놓임
let pasting = false, lastClient = null;
function startPaste() {
  if (mode !== 'idle') return;
  if (!clip) return toast('복사한 노트가 없어요 (Ctrl+C로 먼저 복사하세요)');
  pasting = true; $('pasteBadge').classList.add('show');
  $('pasteInfo').textContent = `노트 ${clip.items.length}개 → '${activeTrack().name}'`;
  scroller.style.cursor = 'copy'; requestDraw();
}
function endPaste() { if (!pasting) return; pasting = false; $('pasteBadge').classList.remove('show'); scroller.style.cursor = CURSOR[S.tool]; requestDraw(); }
function ghostNotes() {
  if (!pasting || !lastClient || !clip) return null;
  const r = scroller.getBoundingClientRect(), lx = lastClient.x - r.left, ly = lastClient.y - r.top;
  if (lx < 0 || ly < 0 || lx >= scroller.clientWidth || ly >= scroller.clientHeight) return null;
  const x = lx + scroller.scrollLeft, y = ly + scroller.scrollTop;
  const s0 = Math.max(0, Math.floor(x / STEP_W / S.grid) * S.grid);
  const dp = clamp(pitchAtY(y) - clip.anchorP, LOW - clip.minP, HIGH - clip.maxP);
  return clip.items.map(c => ({ p: c.p + dp, s: s0 + c.s, l: c.l, ...(c.ly ? { ly: c.ly } : {}), ...(c.g ? { g: c.g, gn: c.gn } : {}), ...(c.gl ? { gl: true } : {}) }));
}
function placePaste(keep) {
  const g = ghostNotes(); if (!g) return;
  pushUndo();
  const nn = regroup(g.map(c => ({ ...c, t: S.active })));
  S.notes.push(...nn); sel = new Set(nn);
  ensureLength(Math.max(...nn.map(n => n.s + n.l)));
  preview(nn[0].p); save();
  if (!keep) endPaste(); else requestDraw();
}
function duplicate() {
  const prev = clip;
  if (!copySel(true)) return toast('복제할 노트를 먼저 선택하세요');
  const m = Math.min(...[...sel].map(n => n.s));
  paste(m + clip.span); clip = prev || clip;
}

// ───────── MIDI 내보내기 ─────────
function exportMidi(proj = S, name = (curItem() || {}).name) {
  if (!proj.notes.length) return toast('내보낼 노트가 없어요');
  const TPQ = 480, TPS = TPQ / 4;
  const vlq = (a, v) => { const b = [v & 0x7f]; v >>= 7; while (v) { b.unshift((v & 0x7f) | 0x80); v >>= 7; } a.push(...b); };
  const chunk = a => { const L = a.length; return [0x4d,0x54,0x72,0x6b,(L>>>24)&255,(L>>16)&255,(L>>8)&255,L&255].concat(a); };
  const us = Math.round(60000000 / proj.bpm), t0 = [];
  vlq(t0, 0); t0.push(0xFF, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255);
  vlq(t0, 0); t0.push(0xFF, 0x58, 0x04, 4, 2, 24, 8);
  vlq(t0, 0); t0.push(0xFF, 0x2F, 0x00);
  const chunks = [chunk(t0)]; let chan = 0;
  for (const tr of proj.tracks) {
    const ns = proj.notes.filter(n => n.t === tr.id); if (!ns.length) continue;
    const drums = isDrumTrack(tr);
    let ch = 9;
    if (!drums) { if (chan === 9) chan++; ch = Math.min(chan, 15); chan++; }
    const a = [], nm = Array.from(new TextEncoder().encode(tr.name));
    vlq(a, 0); a.push(0xFF, 0x03); vlq(a, nm.length); a.push(...nm);
    if (!drums) { vlq(a, 0); a.push(0xC0 | ch, INSTS[tr.inst].prog); }
    const vel = Math.round(clamp(96 * tr.vol, 1, 127)), ev = [];
    if (isVocalTrack(tr)) for (const n of ns) ev.push([Math.round(n.s * TPS), 0.5, 'ly', Array.from(new TextEncoder().encode(n.ly || '라'))]);   // 가사 (UTF-8)
    for (const n of ns) { const nv = Math.round(clamp(vel * (n.v ?? 1), 1, 127)); ev.push([Math.round(n.s * TPS), 1, 0x90 | ch, n.p, nv]); ev.push([Math.round((n.s + n.l) * TPS), 0, 0x80 | ch, n.p, 0]); }
    ev.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    let last = 0; for (const e of ev) { vlq(a, e[0] - last); last = e[0]; if (e[2] === 'ly') { a.push(0xFF, 0x05); vlq(a, e[3].length); a.push(...e[3]); } else a.push(e[2], e[3], e[4]); }
    vlq(a, 0); a.push(0xFF, 0x2F, 0x00);
    chunks.push(chunk(a));
  }
  const head = [0x4d,0x54,0x68,0x64,0,0,0,6,0,1,0,chunks.length,(TPQ>>8)&255,TPQ&255];
  const fname = safeName(name) + '.mid';
  downloadBlob(new Blob([new Uint8Array(head.concat(...chunks))], { type: 'audio/midi' }), fname);
  toast(`${fname} 저장 (트랙 ${chunks.length - 1}개)`);
}

// ───────── 반주: 조·코드 추정 + 스타일별 패턴 ─────────
const QUAL = {
  maj: { iv: [0, 4, 7], sfx: '' }, min: { iv: [0, 3, 7], sfx: 'm' }, dim: { iv: [0, 3, 6], sfx: 'dim' },
  '7': { iv: [0, 4, 7, 10], sfx: '7' }, maj7: { iv: [0, 4, 7, 11], sfx: 'maj7' }, m7: { iv: [0, 3, 7, 10], sfx: 'm7' },
};
const ROMAN = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const chordName = c => c ? ABC[c.r] + QUAL[c.q].sfx : 'N.C.';
const keyName = k => `${ABC[k.t]} ${k.minor ? '단조' : '장조'} (${SOL[k.t]})`;
function roman(c, key) {
  if (!c) return '';
  let r = ROMAN[(c.r - key.t + 12) % 12];
  if (c.q === 'min' || c.q === 'm7' || c.q === 'dim') r = r.toLowerCase();
  return r + ({ dim: '°', '7': '7', maj7: 'M7', m7: '7' }[c.q] || '');
}
function keyVocab(key) {   // 조 안에서 자주 쓰는 코드 + 기본 선호도
  const D = key.minor
    ? [[0, 'min', .3], [5, 'min', .2], [7, 'maj', .2], [7, '7', .12], [8, 'maj', .2], [3, 'maj', .15], [10, 'maj', .15], [7, 'min', .05], [2, 'dim', .02]]
    : [[0, 'maj', .3], [5, 'maj', .25], [7, 'maj', .25], [9, 'min', .18], [2, 'min', .1], [7, '7', .08], [4, 'min', .04], [2, 'maj', .01], [4, 'maj', .02], [5, 'min', .02], [10, 'maj', .02]];
  return D.map(([d, q, pr]) => ({ r: (key.t + d) % 12, q, pr }));
}
// 조 추정 (Krumhansl-Schmuckler)
const KS_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function detectKey(notes) {
  const h = new Array(12).fill(0);
  notes.forEach(n => h[n.p % 12] += n.l * (n.v ?? 1));
  const corr = (prof, t) => {
    const x = h.map((_, i) => h[(i + t) % 12]), mx = x.reduce((a, b) => a + b) / 12, my = prof.reduce((a, b) => a + b) / 12;
    let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < 12; i++) { sxy += (x[i] - mx) * (prof[i] - my); sx += (x[i] - mx) ** 2; sy += (prof[i] - my) ** 2; }
    return sxy / Math.sqrt(sx * sy || 1);
  };
  const all = [];
  for (let t = 0; t < 12; t++) { all.push({ t, minor: false, c: corr(KS_MAJ, t) }); all.push({ t, minor: true, c: corr(KS_MIN, t) }); }
  all.sort((a, b) => b.c - a.c);
  return { t: all[0].t, minor: all[0].minor, conf: Math.max(0, Math.min(1, (all[0].c - all[1].c) * 4 + all[0].c * 0.6)) };
}
// 구간 하나에 대한 코드 점수
function scoreChord(c, items) {
  if (!items.length) return 0;
  const tones = QUAL[c.q].iv.map(i => (c.r + i) % 12);
  let s = 0, W = 0;
  for (const it of items) {
    const k = tones.indexOf(it.pc);
    s += it.w * (k === 0 ? 1 : k > 0 ? 0.9 : -0.5); W += it.w;
  }
  return s / W;
}
function segItems(notes, a, b) {
  const out = [];
  for (const n of notes) {
    const ov = Math.min(b, n.s + n.l) - Math.max(a, n.s); if (ov <= 0) continue;
    let w = ov * (n.v ?? 1);
    if (n.s >= a && n.s < b && ((n.s - a) % 4 === 0)) w *= 1.6;   // 박 위에서 시작한 음은 더 중요
    out.push({ pc: n.p % 12, w });
  }
  return out;
}
function analyzeChords(notes, key, per) {
  const vocab = keyVocab(key);
  const start = Math.floor(Math.min(...notes.map(n => n.s)) / 16) * 16, end = Math.ceil(Math.max(...notes.map(n => n.s + n.l)) / 16) * 16;
  let segs = [];
  for (let b = start; b < end; b += 16) {
    if (per === 8) { segs.push({ s: b, e: b + 8 }, { s: b + 8, e: b + 16 }); continue; }
    if (per === 16) { segs.push({ s: b, e: b + 16 }); continue; }
    // 자동: 반마디 둘이 확실히 다르면 나눔
    const best = (a, z) => { const it = segItems(notes, a, z); let bc = null, bs = -9; vocab.forEach(c => { const s = scoreChord(c, it) + c.pr * 0.5; if (s > bs) { bs = s; bc = c; } }); return { c: bc, s: bs, n: it.length }; };
    const W = best(b, b + 16), h1 = best(b, b + 8), h2 = best(b + 8, b + 16);
    if (h1.n && h2.n && (h1.c.r !== h2.c.r || h1.c.q !== h2.c.q) && (h1.s + h2.s) / 2 > W.s + 0.18) segs.push({ s: b, e: b + 8 }, { s: b + 8, e: b + 16 });
    else segs.push({ s: b, e: b + 16 });
  }
  // 비터비: 멜로디와 맞고, 흔한 진행(V→I, IV→V…)이면 가산
  const tb = (p, c) => {
    if (!p) return 0;
    if (p.r === c.r && p.q === c.q) return 0.06;
    const d = (c.r - p.r + 12) % 12;
    if (d === 5 && (p.q === 'maj' || p.q === '7')) return 0.14;   // 5도 하행 (V→I)
    if (d === 2 && c.r === (key.t + 7) % 12) return 0.06;         // IV→V
    return 0;
  };
  const S = [], B = [];
  segs.forEach((sg, i) => {
    const it = segItems(notes, sg.s, sg.e);
    const row = vocab.map(c => ({ c, local: it.length ? scoreChord(c, it) + c.pr * 0.5 : c.pr * 0.5 }));
    if (i === segs.length - 1) row.forEach(x => { if (x.c.r === key.t && (x.c.q === 'maj' || x.c.q === 'min')) x.local += 0.15; });
    if (!i) { S.push(row.map(x => x.local)); B.push(row.map(() => 0)); return; }
    const prevRow = S[i - 1], sc = [], bk = [];
    row.forEach((x, j) => {
      let bs = -1e9, bi = 0;
      vocab.forEach((pc, k) => { const v = prevRow[k] + tb(pc, x.c); if (v > bs) { bs = v; bi = k; } });
      sc.push(bs + x.local); bk.push(bi);
    });
    S.push(sc); B.push(bk);
  });
  let j = S[S.length - 1].indexOf(Math.max(...S[S.length - 1]));
  for (let i = segs.length - 1; i >= 0; i--) { segs[i].chord = { r: vocab[j].r, q: vocab[j].q }; j = B[i][j]; }
  return segs;
}

// ── 연주 패턴 도우미
const inReg = (pc, lo) => lo + ((pc - lo % 12) + 12) % 12;            // lo 이상 가장 가까운 음
const tonesOf = c => QUAL[c.q].iv;
function voicing(c, center = 62, prevV) {   // 가까운 자리바꿈 (이전 화음과 덜 움직이게)
  const pcs = tonesOf(c).map(i => (c.r + i) % 12);
  const cands = [];
  for (let base = center - 7; base <= center + 2; base++) {
    const v = pcs.map(pc => inReg(pc, base)).sort((a, b) => a - b);
    cands.push(v);
  }
  const ref = prevV && prevV.length ? prevV.reduce((a, b) => a + b) / prevV.length : center;
  cands.sort((a, b) => Math.abs(a.reduce((x, y) => x + y) / a.length - ref) - Math.abs(b.reduce((x, y) => x + y) / b.length - ref));
  return cands[0];
}
const to7 = c => c.q === 'maj' ? { r: c.r, q: (c.r === accKeyRef.t + 7 ? '7' : 'maj7') } : c.q === 'min' ? { r: c.r, q: 'm7' } : c;
let accKeyRef = { t: 0, minor: false };
// gen(ctx): ctx.bars → 각 마디 시작, ctx.at(step) → 코드, ctx.end(step) → 그 코드가 끝나는 step, push(p,s,l,v)
const G = {
  arp8(x) { x.bars.forEach(b => { const c0 = x.at(b); [0, 1, 2, 3, 4, 3, 2, 1].forEach((ix, k) => {
    const s = b + k * 2, c = x.at(s); if (!c) return;
    const R = inReg(c.r, 40), t3 = tonesOf(c)[1], T = [R, R + 7, R + 12, R + 12 + t3, R + 19, R + 24];
    x.push(T[ix], s, k === 0 ? 8 : 3, [0.75, .5, .55, .5, .55, .5, .5, .45][k]); }); void c0; }); },
  popPiano(x) { let pv; x.bars.forEach(b => {
    [[0, 3], [3, 3], [6, 2], [8, 3], [11, 3], [14, 2]].forEach(([o, l], k) => { const c = x.at(b + o); if (!c) return; pv = voicing(c, 62, pv); pv.forEach(p => x.push(p, b + o, l, k % 3 ? .45 : .6)); });
    [0, 8].forEach(o => { const c = x.at(b + o); if (c) x.push(inReg(c.r, 36), b + o, 8, .65); }); }); },
  oompah(x) { let pv; x.bars.forEach(b => {
    [0, 8].forEach((o, k) => { const c = x.at(b + o); if (!c) return; const R = inReg(c.r, 40); x.push(k ? (R + 7 > 52 ? R - 5 : R + 7) : R, b + o, 4, .7); });
    [4, 12].forEach(o => { const c = x.at(b + o); if (!c) return; pv = voicing(c, 62, pv); pv.forEach(p => x.push(p, b + o, 3, .45)); }); }); },
  pad(x) { let pv; x.segs.forEach(sg => { if (!sg.chord) return; for (let b = sg.s; b < sg.e; b += 16) { const l = Math.min(16, sg.e - b); pv = voicing(sg.chord, 62, pv); [...pv, inReg(sg.chord.r, 48)].forEach(p => x.push(p, b, l, .5)); } }); },
  pizzBass(x) { x.bars.forEach(b => [0, 4, 8, 12].forEach((o, k) => { const c = x.at(b + o); if (!c) return; const R = inReg(c.r, 40); x.push(k % 2 ? R + 7 : R, b + o, 2, k ? .55 : .7); })); },
  bandKeys(x) { let pv; x.bars.forEach(b => [[0, 6], [6, 2], [8, 6], [14, 2]].forEach(([o, l], k) => { const c = x.at(b + o); if (!c) return; pv = voicing(c, 64, pv); pv.forEach(p => x.push(p, b + o, l, k % 2 ? .45 : .58)); })); },
  bass8(x) { x.bars.forEach(b => { for (let k = 0; k < 8; k++) { const s = b + k * 2, c = x.at(s); if (!c) continue; const R = inReg(c.r, 33); const nx = x.at(s + 2);
    const p = k === 7 && nx && (nx.r !== c.r) ? R + 7 : (k === 3 ? R + 12 : R); x.push(p, s, 2, k % 2 ? .55 : .75); } }); },
  chipArp(x) { x.bars.forEach(b => { for (let k = 0; k < 16; k++) { const s = b + k, c = x.at(s); if (!c) continue; const R = inReg(c.r, 60), iv = tonesOf(c); const T = [R, R + iv[1], R + iv[2], R + 12]; x.push(T[[0, 1, 2, 3, 2, 1][k % 6]], s, 1, k % 4 ? .4 : .55); } }); },
  chipBass(x) { x.bars.forEach(b => { for (let k = 0; k < 8; k++) { const s = b + k * 2, c = x.at(s); if (!c) continue; const R = inReg(c.r, 36); x.push(k % 2 ? R + 12 : R, s, 2, .8); } }); },
  luteArp(x) { x.bars.forEach(b => [0, 1, 2, 3, 2, 1, 2, 1].forEach((ix, k) => { const s = b + k * 2, c = x.at(s); if (!c) return; const R = inReg(c.r, 48), t3 = tonesOf(c)[1]; const T = [R, R + 7, R + 12, R + 12 + t3]; x.push(T[ix], s, 3, k ? .5 : .7); })); },
  drone(x) { x.bars.forEach(b => { const c = x.at(b); if (!c) return; const R = inReg(c.r, 36); x.push(R, b, 16, .45); x.push(R + 7, b, 16, .35); }); },
  lofiKeys(x) { let pv; x.bars.forEach(b => [[0, 7], [10, 6]].forEach(([o, l], k) => { let c = x.at(b + o); if (!c) return; c = to7(c); pv = voicing(c, 62, pv); pv.forEach((p, i) => x.push(p, b + o + (k ? 0 : i * 0.25), l, .45)); })); },
  lofiBass(x) { x.bars.forEach(b => [[0, 5, 0], [7, 2, 7], [10, 5, 0]].forEach(([o, l, iv]) => { const c = x.at(b + o); if (!c) return; x.push(inReg(c.r, 36) + iv, b + o, l, .7); })); },
};
// 드럼 패턴: [GM번호, [step...], 세기]
const DRUMPAT = {
  pop: [[36, [0, 8, 10], .85], [38, [4, 12], .75], [42, [0, 2, 4, 6, 8, 10, 12, 14], .4]],
  band: [[36, [0, 6, 8, 10], .85], [38, [4, 12], .8], [42, [0, 2, 4, 6, 8, 10, 12, 14], .45], [46, [14], .35]],
  chip: [[36, [0, 8], .8], [38, [4, 12], .7], [42, [2, 6, 10, 14], .35]],
  med: [[45, [0, 10], .75], [54, [4, 12], .55], [54, [6, 14], .3]],
  lofi: [[36, [0, 7, 10], .75], [38, [4, 12], .6], [42, [0, 2, 4, 6, 8, 10, 12, 14], .28]],
};
const drumGen = name => x => { x.bars.forEach((b, i) => { if (!x.at(b) && !x.at(b + 8)) return; DRUMPAT[name].forEach(([p, steps, v]) => steps.forEach(o => x.push(p, b + o, 1, v * (o % 4 ? 0.85 : 1)))); if (i === 0) x.push(49, b, 1, .55); }); };
const ACC_STYLES = [
  { id: 'ballad', name: '발라드 아르페지오', desc: '잔잔한 피아노 펼침화음', icon: 'moon', grad: ['#25458a', '#0d1530'], layers: [{ part: 'chord', inst: 'piano', label: '피아노 아르페지오', gen: G.arp8 }] },
  { id: 'pop', name: '팝 피아노', desc: '리듬감 있는 코드 + 드럼', icon: 'keys', grad: ['#5a2f80', '#1b1230'], layers: [{ part: 'chord', inst: 'piano', label: '피아노 코드', gen: G.popPiano }, { part: 'drums', inst: 'drums', label: '드럼', gen: drumGen('pop') }] },
  { id: 'band', name: '밴드', desc: '일렉 피아노 · 베이스 · 드럼', icon: 'guitar', grad: ['#8a4220', '#2a130a'], layers: [{ part: 'chord', inst: 'epiano', label: '일렉 피아노', gen: G.bandKeys }, { part: 'bass', inst: 'bass', label: '베이스', gen: G.bass8 }, { part: 'drums', inst: 'drums', label: '드럼', gen: drumGen('band') }] },
  { id: 'kids', name: '동요 쿵짝', desc: '쿵-짝 피아노 반주', icon: 'bear', grad: ['#8a7420', '#2a230a'], layers: [{ part: 'chord', inst: 'piano', label: '피아노 쿵짝', gen: G.oompah }] },
  { id: 'orch', name: '오케스트라', desc: '스트링 패드 · 피치카토 베이스', icon: 'violin', grad: ['#4b2a6b', '#1b1230'], layers: [{ part: 'chord', inst: 'strings', label: '스트링', gen: G.pad }, { part: 'bass', inst: 'pizz', label: '피치카토 베이스', gen: G.pizzBass }] },
  { id: 'chip', name: '16비트 게임', desc: '칩 아르페지오 · 칩 베이스 · 드럼', icon: 'invader', grad: ['#1d7a40', '#0b2416'], layers: [{ part: 'chord', inst: 'chip12', label: '칩 아르페지오', gen: G.chipArp }, { part: 'bass', inst: 'chiptri', label: '칩 베이스', gen: G.chipBass }, { part: 'drums', inst: 'drums', label: '드럼', gen: drumGen('chip') }] },
  { id: 'medieval', name: '중세 판타지', desc: '류트 · 허디거디 드론 · 탐', icon: 'castle', grad: ['#7a5226', '#24170a'], layers: [{ part: 'chord', inst: 'lute', label: '류트', gen: G.luteArp }, { part: 'bass', inst: 'hurdy', label: '허디거디 드론', gen: G.drone }, { part: 'drums', inst: 'drums', label: '타악기', gen: drumGen('med') }] },
  { id: 'lofi', name: '로파이', desc: '7화음 일렉 피아노 · 느긋한 비트', icon: 'coffee', grad: ['#2f5a5a', '#0e2020'], layers: [{ part: 'chord', inst: 'epiano', label: '일렉 피아노', gen: G.lofiKeys }, { part: 'bass', inst: 'bass', label: '베이스', gen: G.lofiBass }, { part: 'drums', inst: 'drums', label: '드럼', gen: drumGen('lofi') }] },
];
function recommendStyle(src) {
  const f = src ? INSTS[src.inst].fam : 'keys';
  return { chip: 'chip', medieval: 'medieval', str: 'orch', wind: 'orch', bell: 'kids', synth: 'band', pluck: 'medieval' }[f] || 'ballad';
}
function buildAccomp(segs, style, parts, gain) {
  const at = st => { const sg = segs.find(g => st >= g.s && st < g.e); return sg ? sg.chord : null; };
  const start = segs[0].s, end = segs[segs.length - 1].e, bars = []; for (let b = start; b < end; b += 16) bars.push(b);
  return style.layers.filter(L => parts.has(L.part)).map(L => {
    const notes = [];
    L.gen({ bars, segs, at, push: (p, s, l, v) => { if (s >= end || p < LOW || p > HIGH) return; notes.push({ p, s, l: Math.min(l, end - s), v: Math.round(clamp(v * gain, 0.1, 1) * 100) / 100 }); } });
    return { layer: L, notes };
  }).filter(o => o.notes.length);
}
// 샘플 진행
const PROGS = [
  { id: 'pop', name: '팝 · I–V–vi–IV', minor: false, ch: [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']] },
  { id: 'ballad', name: '감성 발라드 · vi–IV–I–V', minor: false, ch: [[9, 'min'], [5, 'maj'], [0, 'maj'], [7, 'maj']] },
  { id: 'canon', name: '캐논 · I–V–vi–iii–IV–I–IV–V', minor: false, ch: [[0, 'maj'], [7, 'maj'], [9, 'min'], [4, 'min'], [5, 'maj'], [0, 'maj'], [5, 'maj'], [7, 'maj']] },
  { id: 'fifties', name: '50년대 · I–vi–IV–V', minor: false, ch: [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']] },
  { id: 'royal', name: '게임 · 왕도진행 IV–V–iii–vi', minor: false, ch: [[5, 'maj'], [7, 'maj'], [4, 'min'], [9, 'min']] },
  { id: 'jazz', name: '재즈 · ii7–V7–Imaj7', minor: false, ch: [[2, 'm7'], [7, '7'], [0, 'maj7'], [0, 'maj7']] },
  { id: 'blues', name: '블루스 12마디', minor: false, ch: [[0, '7'], [0, '7'], [0, '7'], [0, '7'], [5, '7'], [5, '7'], [0, '7'], [0, '7'], [7, '7'], [5, '7'], [0, '7'], [7, '7']] },
  { id: 'epic', name: '단조 서사 · i–VI–III–VII', minor: true, ch: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj']] },
  { id: 'medi', name: '중세 선법 · i–VII–VI–VII', minor: true, ch: [[0, 'min'], [10, 'maj'], [8, 'maj'], [10, 'maj']] },
  { id: 'sad', name: '애잔한 단조 · i–iv–V–i', minor: true, ch: [[0, 'min'], [5, 'min'], [7, 'maj'], [0, 'min']] },
];

// ───────── 파일 내보내기 공용 ─────────
const safeName = n => (n || '곡').replace(/[\\/:*?"<>|]+/g, '_').trim() || '곡';
function downloadBlob(blob, filename) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportProjectFile(proj, name) {
  const data = { format: 'thaniya-soundlab', version: 1, name, exported: new Date().toISOString(), project: proj };
  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), safeName(name) + '.tsl.json');
  toast(`'${name}' 프로젝트 파일을 저장했어요`);
}

// ───────── MIDI 불러오기 ─────────
function parseMidi(buf) {
  const d = new DataView(buf); let p = 0;
  const str = n => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(d.getUint8(p + i)); p += n; return s; };
  const u32 = () => { const v = d.getUint32(p); p += 4; return v; }, u16 = () => { const v = d.getUint16(p); p += 2; return v; };
  if (str(4) !== 'MThd') throw new Error('MIDI 파일이 아니에요');
  const hl = u32(); u16(); const ntr = u16(), div = u16(); p += hl - 6;
  if (div & 0x8000) throw new Error('SMPTE 타이밍 MIDI는 아직 지원하지 않아요');
  let tempo = null; const tracks = [];
  for (let t = 0; t < ntr && p + 8 <= buf.byteLength; t++) {
    const id = str(4), len = u32(), end = Math.min(buf.byteLength, p + len);
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, run = 0, name = ''; const byCh = {}, lyr = new Map();
    const vlq = () => { let v = 0, b; do { b = d.getUint8(p++); v = (v << 7) | (b & 0x7f); } while (b & 0x80 && p < end); return v; };
    while (p < end) { try {
      tick += vlq(); if (p >= end) break;
      let st = d.getUint8(p);
      if (st < 0x80) st = run; else { p++; if (st < 0xF0) run = st; }
      if (st === 0xFF) {
        const type = d.getUint8(p++), l = vlq();
        if (type === 0x51 && tempo == null) tempo = (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2);
        else if (type === 0x03 && !name) { try { name = new TextDecoder().decode(new Uint8Array(buf, p, l)); } catch (e) {} }
        else if (type === 0x05 && l) {   // 가사 (UTF-8, 아니면 EUC-KR)
          const raw = new Uint8Array(buf, p, l); let txt = '';
          try { txt = new TextDecoder('utf-8', { fatal: true }).decode(raw); } catch (e) { try { txt = new TextDecoder('euc-kr').decode(raw); } catch (e2) {} }
          const tk = KV.tokens(txt); if (tk.length) lyr.set(tick, (lyr.get(tick) || '') + tk.join(''));
        }
        p += l; continue;
      }
      if (st === 0xF0 || st === 0xF7) { p += vlq(); continue; }
      const type = st & 0xF0, ch = st & 0x0F, a = d.getUint8(p++), b = (type === 0xC0 || type === 0xD0) ? 0 : d.getUint8(p++);
      const C = byCh[ch] || (byCh[ch] = { prog: 0, notes: [], on: {} });
      if (type === 0xC0) C.prog = a;
      else if (type === 0x90 && b > 0) (C.on[a] = C.on[a] || []).push([tick, b]);
      else if (type === 0x80 || (type === 0x90 && b === 0)) { const q = C.on[a]; if (q && q.length) { const [t0, v] = q.shift(); C.notes.push({ p: a, t0, t1: tick, v }); } }
    } catch (e) { break; } }   // 손상된 부분은 건너뛰고 읽은 데까지 살림
    p = end;
    for (const ch in byCh) if (byCh[ch].notes.length) {
      const ns = byCh[ch].notes; let ly = 0;
      if (lyr.size) ns.forEach(n => { if (lyr.has(n.t0)) { n.ly = lyr.get(n.t0); ly++; } });
      tracks.push({ name, ch: +ch, prog: byCh[ch].prog, notes: ns, lyrics: ly > ns.length * 0.3 });
    }
  }
  return { tpq: div, bpm: Math.round(60000000 / (tempo || 500000)), tracks };
}
function instFromProgram(prog) {   // GM 악기 번호 → 가장 가까운 악기
  const exact = Object.keys(INSTS).find(k => !INSTS[k].drum && INSTS[k].prog === prog); if (exact) return exact;
  const R = [[8,'piano'],[16,'celesta'],[24,'organ'],[32,'mandolin'],[40,'bass'],[41,'violin'],[42,'viola'],[44,'cello'],[45,'strings'],[46,'pizz'],[48,'harp'],[52,'strings'],[56,'choir'],[64,'fmbrass'],[72,'clarinet'],[80,'flute'],[88,'synth'],[96,'strings'],[104,'fx'],[112,'mandolin'],[120,'handbell'],[128,'fx']];
  return (R.find(([hi]) => prog < hi) || [, 'piano'])[1];
}
function midiToProject(M) {
  const P = blankProject(); P.tracks = []; P.notes = []; P.bpm = clamp(M.bpm, 40, 240);
  const spt = 4 / M.tpq; let id = 1, maxEnd = 0;
  for (const tr of M.tracks) {
    const drum = tr.ch === 9, inst = drum ? 'drums' : tr.lyrics ? 'vocal' : instFromProgram(tr.prog);
    const t = mkTrack(id++, inst, tr.name || (drum ? '드럼' : INSTS[inst].label));
    P.tracks.push(t);
    for (const n of tr.notes) {
      if (n.p < LOW || n.p > HIGH) continue;
      const s = Math.round(n.t0 * spt * 100) / 100, l = Math.max(0.25, Math.round((n.t1 - n.t0) * spt * 100) / 100);
      P.notes.push({ p: n.p, s, l, t: t.id, v: Math.round(clamp(n.v / 112, 0.15, 1) * 100) / 100, ...(n.ly ? { ly: n.ly } : {}) }); maxEnd = Math.max(maxEnd, s + l);
    }
  }
  if (!P.tracks.length) throw new Error('MIDI 안에 노트가 없어요');
  P.active = P.tracks[0].id; P.nextId = id; P.bars = Math.max(32, Math.ceil(maxEnd / 16) + 4);
  return P;
}

// ───────── 마이페이지 ─────────
const mp = $('myPage');
let mpSel = new Set();
function setSelMode(on) { mp.classList.toggle('selmode', on); mpSel = new Set(); renderMyPage(); }
function updateSelBar() { $('mpSelCnt').textContent = `${mpSel.size}개 선택`; $('mpSelDel').disabled = !mpSel.size; }
function afterDeleteCur() {   // 편집 중이던 곡이 지워졌을 때: 가장 최근 곡(없으면 새 곡)을 현재 곡으로
  if (ON_MYPAGE) {   // 마이페이지는 편집 화면이 없으므로 목록만 바꿔 둠
    if (!LIB.items.length) { const nid = addProject(blankProject(), '새 곡'); if (nid) LIB.cur = nid; }
    else LIB.cur = LIB.items.slice().sort((a, b) => b.updated - a.updated)[0].id;
    lsSet(LIB_KEY, LIB); return;
  }
  if (!LIB.items.length) { const nid = addProject(blankProject(), '새 곡'); LIB.cur = '__none'; openProject(nid, true); }
  else { const next = LIB.items.slice().sort((a, b) => b.updated - a.updated)[0]; LIB.cur = '__none'; openProject(next.id, true); }
  openMyPage();
}
async function deleteProjects(ids) {
  if (!ids.length) return;
  if (!await confirmBox(`곡 ${ids.length}개를 삭제할까요?`, '이 브라우저에서 완전히 지워져요. 필요하면 먼저 프로젝트 파일로 내보내세요.', '삭제')) return;
  const hadCur = ids.includes(LIB.cur);
  LIB.items = LIB.items.filter(i => !ids.includes(i.id));
  ids.forEach(id => { try { localStorage.removeItem(PROJ(id)); } catch (e) {} });
  if (hadCur) afterDeleteCur();
  lsSet(LIB_KEY, LIB); mpSel = new Set(); renderMyPage(); toast(`곡 ${ids.length}개를 삭제했어요`);
}
const uniqueName = base => { const names = new Set(LIB.items.map(i => i.name)); if (!names.has(base)) return base; let k = 2; while (names.has(`${base} ${k}`)) k++; return `${base} ${k}`; };
function addProject(proj, name) {
  const id = newId(), now = Date.now();
  if (!lsSet(PROJ(id), proj)) return null;
  LIB.items.push({ id, name: uniqueName(name), created: now, updated: now }); lsSet(LIB_KEY, LIB);
  return id;
}
function openProject(id, silent, force) {
  if (ON_MYPAGE) { goPage(PG_EDIT, '?open=' + encodeURIComponent(id)); return; }
  if (mode !== 'idle') stop();
  if (pendingRec) closePreview(false);
  endPaste();
  if (id !== LIB.cur || force) {
    if (id !== LIB.cur) save();
    const p = lsGet(PROJ(id)); if (!p) return toast('곡을 불러올 수 없어요');
    Object.assign(S, blankProject(), p);
    LIB.cur = id; lsSet(LIB_KEY, LIB);
    fixupProject(); lastProjJSON = null; writeProject();
    undoStack = []; redoStack = []; sel = new Set(); playhead = 0; trace = [];
    Object.keys(buses).forEach(k => delete buses[k]);
    $('bpm').value = S.bpm; $('grid').value = String(S.grid); keySel.value = S.key; $('labelMode').value = S.labelMode;
    renderList(); renderInspector(); layout();
    scroller.scrollLeft = 0;
    const ps = S.notes.map(n => n.p); scroller.scrollTop = (HIGH - (ps.length ? median(ps) : 64)) * ROW_H - scroller.clientHeight / 2;
    if (!silent) toast(`'${curItem().name}' 편집을 시작해요`);
  }
  updateSongTitle(); closeMyPage(); drawAll();
}
function newProject() { const id = addProject(blankProject(), '새 곡'); if (id) openProject(id); }
function renameProject(id, name) {
  const it = LIB.items.find(i => i.id === id); name = (name || '').trim();
  if (!it || !name || name === it.name) return;
  it.name = name.slice(0, 40); lsSet(LIB_KEY, LIB); updateSongTitle();
}
function duplicateProject(id) {
  if (id === LIB.cur) save();
  const it = LIB.items.find(i => i.id === id), p = lsGet(PROJ(id)); if (!p) return;
  if (addProject(p, it.name + ' 복사')) { renderMyPage(); toast(`'${it.name}'을(를) 복제했어요`); }
}
async function deleteProject(id) {
  const it = LIB.items.find(i => i.id === id); if (!it) return;
  if (!await confirmBox(`'${it.name}'을(를) 삭제할까요?`, '이 브라우저에서 완전히 지워져요. 필요하면 먼저 프로젝트 파일로 내보내세요.', '삭제')) return;
  LIB.items = LIB.items.filter(i => i.id !== id);
  try { localStorage.removeItem(PROJ(id)); } catch (e) {}
  if (id === LIB.cur) afterDeleteCur();
  lsSet(LIB_KEY, LIB); renderMyPage(); toast(`'${it.name}'을(를) 삭제했어요`);
}
function exportProjectById(id, kind) {
  if (id === LIB.cur) save();
  const it = LIB.items.find(i => i.id === id), p = lsGet(PROJ(id)); if (!p) return;
  if (kind === 'midi') exportMidi(p, it.name); else exportProjectFile(p, it.name);
}
async function importFiles(files) {
  let ok = 0;
  for (const f of files) {
    try {
      const base = f.name.replace(/\.(tsl\.json|json|midi?|MID)$/i, '');
      if (/\.midi?$/i.test(f.name)) {
        const P = midiToProject(parseMidi(await f.arrayBuffer()));
        if (addProject(P, base)) ok++;
      } else {
        const d = JSON.parse(await f.text());
        const proj = d && d.format === 'thaniya-soundlab' ? d.project : d;
        if (!proj || !Array.isArray(proj.notes) || !Array.isArray(proj.tracks)) throw new Error('Thaniya-SoundLab 프로젝트 파일이 아니에요');
        if (addProject(Object.assign(blankProject(), proj), (d && d.name) || base)) ok++;
      }
    } catch (e) { toast(`'${f.name}' 불러오기 실패: ${e.message}`); }
  }
  if (ok) { renderMyPage(); toast(`곡 ${ok}개를 불러왔어요 · '편집'을 눌러 열어 보세요`); }
}
function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return '방금 전'; if (s < 3600) return Math.floor(s / 60) + '분 전'; if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  if (s < 86400 * 7) return Math.floor(s / 86400) + '일 전';
  const d = new Date(t); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
function drawThumb(cv, p) {
  const w = cv.clientWidth || 260, h = cv.clientHeight || 110, r = window.devicePixelRatio || 1;
  cv.width = w * r; cv.height = h * r; const c = cv.getContext('2d'); c.scale(r, r);
  c.fillStyle = '#101114'; c.fillRect(0, 0, w, h);
  const notes = (p && p.notes) || [];
  if (!notes.length) { c.fillStyle = '#4a4e57'; c.font = '12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('빈 곡', w / 2, h / 2 + 4); return; }
  let end = 0, lo = 127, hi = 0; for (const n of notes) { end = Math.max(end, n.s + n.l); lo = Math.min(lo, n.p); hi = Math.max(hi, n.p); }
  lo -= 2; hi += 2; const span = Math.max(12, hi - lo), rowH = (h - 16) / span, sx = (w - 16) / Math.max(16, end);
  c.strokeStyle = '#1b1d22'; c.lineWidth = 1;
  for (let b = 0; b <= end; b += 16) { const x = 8 + b * sx; c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); c.stroke(); }
  const col = {}; (p.tracks || []).forEach(t => col[t.id] = t.color || (INSTS[t.inst] || INSTS.piano).color);
  for (const n of notes) {
    c.globalAlpha = 0.5 + 0.5 * (n.v ?? 1); c.fillStyle = col[n.t] || '#5fa8ff';
    c.fillRect(8 + n.s * sx, 8 + (hi - n.p) * rowH, Math.max(1.5, n.l * sx - 0.5), Math.max(1.5, rowH - 0.5));
  }
  c.globalAlpha = 1;
}
function storageUsage() { let b = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^hc-|^humming/.test(k)) b += (localStorage.getItem(k) || '').length * 2; } } catch (e) {} return b; }
function renderMyPage() {
  if (!mp.classList.contains('show')) return;
  const q = $('mpSearch').value.trim().toLowerCase(), sort = $('mpSort').value;
  const items = LIB.items.filter(i => !q || i.name.toLowerCase().includes(q));
  items.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name, 'ko') : sort === 'created' ? (a, b) => b.created - a.created : (a, b) => b.updated - a.updated);
  $('mpSub').textContent = `이 브라우저에 저장된 곡 ${LIB.items.length}개 · 자동 저장`;
  const used = storageUsage(), cap = 5 * 1024 * 1024;
  $('mpStoreFill').style.width = Math.min(100, used / cap * 100) + '%';
  $('mpStoreTxt').textContent = `${(used / 1024).toFixed(0)}KB / 약 5MB`;
  mpSel.forEach(id => { if (!LIB.items.some(i => i.id === id)) mpSel.delete(id); }); updateSelBar();
  const g = $('mpGrid'); g.innerHTML = '';
  if (!items.length) { g.appendChild(el('div', 'mpEmpty', q ? `'${q}'에 맞는 곡이 없어요` : '저장된 곡이 없어요. 새 곡을 만들어 보세요')); return; }
  for (const it of items) {
    const p = it.id === LIB.cur && !ON_MYPAGE ? pickProject(S) : lsGet(PROJ(it.id));
    const card = el('div', 'song' + (it.id === LIB.cur ? ' cur' : ''));
    const cv = document.createElement('canvas'); cv.title = '편집하기'; card.appendChild(cv);
    const body = el('div', 'sBody'), row = el('div', 'sNameRow'), nm = el('div', 'sName', it.name);
    nm.title = '더블클릭해서 이름 바꾸기'; row.appendChild(nm);
    if (it.id === LIB.cur) row.appendChild(el('span', 'curBadge', '편집 중'));
    body.appendChild(row);
    const notes = (p && p.notes) || [], end = notes.reduce((a, n) => Math.max(a, n.s + n.l), 0), sec = end * 60 / ((p && p.bpm) || 100) / 4;
    body.appendChild(el('div', 'sMeta', `트랙 ${(p && p.tracks || []).length} · 노트 ${notes.length} · ♩${(p && p.bpm) || 100} · ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`));
    body.appendChild(el('div', 'sDate', `${timeAgo(it.updated)} 수정`));
    const btns = el('div', 'sBtns');
    const ed = el('button', 'btn primary edit'); ed.innerHTML = svg('pen'); ed.appendChild(el('span', null, '편집'));
    const rn = el('button', 'btn'); rn.innerHTML = svg('rename'); rn.title = '이름 바꾸기';
    const mo = el('button', 'btn'); mo.innerHTML = svg('more'); mo.title = '더 보기 (복제 · 내보내기 · 삭제)';
    btns.append(ed, rn, mo); body.appendChild(btns); card.appendChild(body);
    const ck = el('span', 'chk2'); ck.innerHTML = svg('check'); card.appendChild(ck);
    if (mpSel.has(it.id)) card.classList.add('picked');
    const pick = () => { mpSel.has(it.id) ? mpSel.delete(it.id) : mpSel.add(it.id); card.classList.toggle('picked', mpSel.has(it.id)); updateSelBar(); };
    card.addEventListener('click', e => { if (mp.classList.contains('selmode')) { e.preventDefault(); e.stopPropagation(); pick(); } }, true);
    ed.onclick = () => openProject(it.id);
    cv.onclick = () => openProject(it.id);
    const startRename = () => {
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = it.name; inp.maxLength = 40;
      nm.textContent = ''; nm.appendChild(inp); inp.focus(); inp.select();
      let done = false; const fin = ok => { if (done) return; done = true; if (ok) renameProject(it.id, inp.value); renderMyPage(); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); e.stopPropagation(); });
      inp.addEventListener('blur', () => fin(true));
    };
    nm.ondblclick = () => { if (!mp.classList.contains('selmode')) startRename(); }; rn.onclick = startRename;
    const menu = (x, y) => {
      ctx.innerHTML = ''; ctx.appendChild(el('div', 'ctxHead', it.name));
      const item = (icon, label, fn, cls = '') => { const d = el('div', 'ci ' + cls); d.innerHTML = svg(icon); d.appendChild(el('span', null, label)); d.addEventListener('click', () => { closeCtx(); fn(); }); ctx.appendChild(d); };
      item('pen', '편집하기', () => openProject(it.id));
      item('rename', '이름 바꾸기', startRename);
      item('copy', '복제', () => duplicateProject(it.id));
      ctx.appendChild(el('div', 'csep'));
      item('download', '내보내기… (프로젝트 · MIDI · MP3)', () => openExport(it.id));
      ctx.appendChild(el('div', 'csep'));
      item('trash', '삭제', () => deleteProject(it.id), 'danger');
      ctx.classList.add('show');
      ctx.style.left = clamp(x, 4, innerWidth - ctx.offsetWidth - 4) + 'px'; ctx.style.top = clamp(y, 4, innerHeight - ctx.offsetHeight - 4) + 'px';
    };
    mo.onclick = e => { const r = mo.getBoundingClientRect(); menu(r.left, r.bottom + 4); e.stopPropagation(); };
    card.addEventListener('contextmenu', e => { e.preventDefault(); menu(e.clientX, e.clientY); });
    g.appendChild(card);
    requestAnimationFrame(() => drawThumb(cv, p));
  }
}
function openMyPage() {
  if (SPLIT && PAGE === 'edit') { if (mode !== 'idle') stop(); save(); goPage(PG_MY); return; }   // 편집 → 마이페이지: 다른 페이지로 이동
  if (mode !== 'idle') stop();
  save(); closeCtx();
  mp.classList.add('show'); pal.style.visibility = 'hidden';
  renderMyPage();
}
function closeMyPage() { if (ON_MYPAGE) return; mp.classList.remove('show'); pal.style.visibility = ''; }
function updateSongTitle() { const it = curItem(); $('songName').value = it ? it.name : ''; document.title = ON_MYPAGE ? '마이페이지 — Thaniya-SoundLab' : (it ? it.name + ' — ' : '') + 'Thaniya-SoundLab'; }
$('logoBtn').onclick = openMyPage;
$('mpBack').onclick = () => openProject(LIB.cur);
$('mpNew').onclick = newProject;
$('mpSelBtn').onclick = () => setSelMode(!mp.classList.contains('selmode'));
$('mpSelDone').onclick = () => setSelMode(false);
$('mpSelAll').onclick = () => { const q = $('mpSearch').value.trim().toLowerCase(); const vis = LIB.items.filter(i => !q || i.name.toLowerCase().includes(q)).map(i => i.id); mpSel = vis.every(id => mpSel.has(id)) ? new Set() : new Set(vis); renderMyPage(); };
$('mpSelDel').onclick = () => deleteProjects([...mpSel]);
$('mpImport').onclick = () => $('mpFile').click();
$('mpFile').addEventListener('change', e => { importFiles([...e.target.files]); e.target.value = ''; });
$('mpSearch').addEventListener('input', renderMyPage);
$('mpSort').addEventListener('change', e => { renderMyPage(); e.target.blur(); });
mp.addEventListener('dragover', e => { e.preventDefault(); mp.classList.add('dragging'); });
mp.addEventListener('dragleave', e => { if (e.target === mp || !mp.contains(e.relatedTarget)) mp.classList.remove('dragging'); });
mp.addEventListener('drop', e => { e.preventDefault(); mp.classList.remove('dragging'); importFiles([...e.dataTransfer.files]); });
$('songName').addEventListener('change', e => { renameProject(LIB.cur, e.target.value); updateSongTitle(); });
$('songName').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { if (e.key === 'Escape') updateSongTitle(); e.target.blur(); } e.stopPropagation(); });
window.addEventListener('beforeunload', () => save());
window.addEventListener('pageshow', e => { if (e.persisted && SPLIT) location.reload(); });

// ───────── 비트 (드럼 패턴) ─────────
const BEAT_ROWS = [[49, '크래시'], [51, '라이드'], [46, '열린 하이햇'], [42, '닫힌 하이햇'], [70, '셰이커'], [50, '하이 탐'], [45, '로우 탐'], [39, '클랩'], [37, '림샷'], [38, '스네어'], [36, '킥']];
// 패턴 문자: . 끔 · o 약하게 · x 보통 · X 강하게 (16칸 = 1마디)
const BEATS = [
  { id: 'pop', name: '팝', desc: '기본 8비트', icon: 'mic', grad: ['#5a2f80', '#1b1230'], A: { 36: 'X.......X.x.....', 38: '....X.......X...', 42: 'x.x.x.x.x.x.x.x.' } },
  { id: 'rock', name: '록', desc: '힘 있는 8비트 + 탐 필인', icon: 'bolt', grad: ['#8a2a20', '#2a0d0a'], A: { 36: 'X.....x.X.x.....', 38: '....X.......X...', 42: 'X.x.X.x.X.x.X.x.' },
    B: { 36: 'X.......X.......', 38: '....X...x.x.XXxx', 50: '........o.o.....', 45: '..............XX' } },
  { id: 'boombap', name: '힙합 붐뱁', desc: '묵직한 킥 · 스윙 하이햇', icon: 'headphones', grad: ['#6b4a24', '#24170a'], swing: 0.25, A: { 36: 'X......x..X.....', 38: '....X.......X...', 42: 'x.x.x.x.x.x.x.xo' },
    B: { 36: 'X......x..X..x..', 38: '....X.......X.X.', 42: 'x.x.x.x.x.x.x...', 46: '..............x.' } },
  { id: 'trap', name: '트랩', desc: '하프타임 스네어 · 하이햇 롤', icon: 'diamond', grad: ['#2f2f6b', '#0d0d24'], A: { 36: 'X......X..x.....', 38: '........X.......', 39: '........x.......', 42: 'xxoxxxoxxxoxxoxx' },
    B: { 36: 'X......X..x...x.', 38: '........X.......', 39: '........x.......', 42: 'xxoxxxoxXxXxXXXX', 46: '.......x........' } },
  { id: 'house', name: '하우스', desc: '포 온 더 플로어', icon: 'disco', grad: ['#1f5f8a', '#0a1f2a'], A: { 36: 'X...X...X...X...', 39: '....X.......X...', 46: '..x...x...x...x.', 42: 'o...o...o...o...' },
    B: { 36: 'X...X...X...X...', 39: '....X.......X...', 46: '..x...x...x.....', 38: '............xxXX' } },
  { id: 'disco', name: '디스코', desc: '오픈 하이햇 오프비트', icon: 'star', grad: ['#8a2a6b', '#2a0d20'], A: { 36: 'X...X...X...X...', 38: '....X.......X...', 46: '..x...x...x...x.', 42: 'x...x...x...x...' } },
  { id: 'funk', name: '펑크', desc: '고스트 노트 16비트', icon: 'sax', grad: ['#8a5a1f', '#2a1a0a'], A: { 36: 'X.....x...X..x..', 38: '....X..o.o..X..o', 42: 'XoxoXoxoXoxoXoxo' } },
  { id: 'dembow', name: '레게톤', desc: '뎀보우 리듬', icon: 'palm', grad: ['#1f7a50', '#0a2418'], A: { 36: 'X...X...X...X...', 38: '...x..x....x..x.', 42: 'x.x.x.x.x.x.x.x.' } },
  { id: 'shuffle', name: '셔플 · 블루스', desc: '통통 튀는 셔플', icon: 'guitar', grad: ['#3a4a8a', '#10142a'], swing: 0.55, A: { 36: 'X.....x.X.....x.', 38: '....X.......X...', 51: 'x.x.x.x.x.x.x.x.' } },
  { id: 'bossa', name: '보사노바', desc: '림샷 클라베 · 부드러운 셰이커', icon: 'wave', grad: ['#2f6b5a', '#0e2420'], A: { 36: 'X..x....X..x....', 37: 'x..x..x...x..x..', 70: 'oooooooooooooooo' } },
  { id: 'lofi', name: '로파이', desc: '느긋하게 끌리는 비트', icon: 'coffee', grad: ['#2f5a5a', '#0e2020'], swing: 0.35, A: { 36: 'X......x..X.....', 38: '....X.......X...', 42: 'o.o.o.o.o.o.o.o.' } },
  { id: 'march', name: '행진곡', desc: '스네어 루디먼트', icon: 'drum', grad: ['#7a1f2a', '#240a0d'], A: { 36: 'X...x...X...x...', 38: 'X.xxX.x.X.xxX.x.' } },
  { id: 'chip', name: '16비트 게임', desc: '칩튠 노이즈 드럼', icon: 'invader', grad: ['#1d7a40', '#0b2416'], A: { 36: 'X.......X.......', 38: '....X.......X...', 42: '..x...x...x...x.' },
    B: { 36: 'X.......X.......', 38: '....X.......XXXX', 42: '..x...x...x.....' } },
  { id: 'medi', name: '중세 북', desc: '탐 · 탬버린 · 셰이커', icon: 'castle', grad: ['#7a5226', '#24170a'], A: { 45: 'X.....x.X.......', 50: '..........x.x...', 70: 'x...x...x...x...' } },
];
const LV = { '.': 0, o: 1, x: 2, X: 3 }, LVV = [0, 0.45, 0.75, 1];
const emptyPat = () => Object.fromEntries(BEAT_ROWS.map(([g]) => [g, new Array(16).fill(0)]));
const parsePat = obj => { const p = emptyPat(); for (const g in obj) if (p[g]) [...obj[g]].forEach((c, i) => { if (i < 16) p[g][i] = LV[c] ?? 0; }); return p; };
function autoFill(A) {   // 필인: 마지막 박을 스네어·탐 롤로
  const B = JSON.parse(JSON.stringify(A));
  [38, 42, 46, 45, 50, 39].forEach(g => { for (let i = 12; i < 16; i++) B[g][i] = 0; });
  B[38][12] = 2; B[38][13] = 1; B[50][14] = 2; B[45][15] = 3;
  return B;
}
const bt = { preset: 'pop', A: emptyPat(), B: emptyPat(), edit: 'A', seed: 1 };
function loadBeatPreset(id) {
  const P = BEATS.find(b => b.id === id) || BEATS[0];
  bt.preset = P.id; bt.A = parsePat(P.A); bt.B = P.B ? parsePat(P.B) : autoFill(bt.A);
  $('btSwing').value = P.swing || 0; btLabels();
}
function recommendBeat() {
  const insts = new Set(S.tracks.map(t => INSTS[t.inst].fam));
  if (insts.has('chip')) return 'chip';
  if (insts.has('medieval')) return 'medi';
  const b = S.bpm; return b < 85 ? 'lofi' : b < 100 ? 'boombap' : b < 118 ? 'pop' : b < 128 ? 'house' : b < 140 ? 'rock' : 'trap';
}
function beatRange() {
  const mode = $('btStart').value, n = +$('btBars').value;
  let start = Math.floor(playhead / 16) * 16;
  if (mode === 'song') start = 0;
  if (mode === 'notes') { const ns = S.notes.filter(n => !trk(n.t).beat); if (ns.length) { start = Math.floor(Math.min(...ns.map(n => n.s)) / 16) * 16; } }
  let bars = n;
  if (mode === 'notes') { const ns = S.notes.filter(x => !trk(x.t).beat); if (ns.length) bars = Math.max(1, Math.ceil(Math.max(...ns.map(x => x.s + x.l)) / 16) - start / 16); }
  return { start, bars };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function genBeat() {
  const { start, bars } = beatRange(), every = +$('btFill').value, sw = +$('btSwing').value, gain = +$('btGain').value, hum = +$('btHuman').value;
  const rnd = mulberry(bt.seed), out = [];
  for (let i = 0; i < bars; i++) {
    const fill = every > 0 && ((i + 1) % every === 0 || i === bars - 1) && bars > 1, pat = fill ? bt.B : bt.A, b0 = start + i * 16;
    for (const [g] of BEAT_ROWS) pat[g].forEach((lv, s) => {
      if (!lv) return;
      const off = s % 4 === 2 ? sw : s % 2 === 1 ? sw * 0.5 : 0;   // 스윙: 뒷박을 살짝 늦게
      const jit = hum ? (rnd() - 0.5) * 0.16 * hum : 0;
      const v = clamp(LVV[lv] * gain * (1 + (hum ? (rnd() - 0.5) * 0.3 * hum : 0)), 0.08, 1);
      out.push({ p: g, s: Math.max(0, Math.round((b0 + s + off + jit) * 100) / 100), l: 1, v: Math.round(v * 100) / 100, fill });
    });
    if (i === 0 && $('btCrash').checked && !pat[49][0]) out.push({ p: 49, s: b0, l: 1, v: Math.round(0.8 * gain * 100) / 100 });
  }
  return out;
}
const tmpDrum = () => { const t = mkTrack(-500, 'drums'); t.vol = 0.9; return t; };
function audition(g, lv = 2) { AC(); tone(g, ac.currentTime + 0.01, 0.2, tmpDrum(), LVV[lv]); }
function renderSeq() {
  const box = $('seq'); box.innerHTML = '';
  const pat = bt[bt.edit];
  for (const [g, label] of BEAT_ROWS) {
    const row = el('div', 'sqRow'), nm = el('button', 'sqName', label); nm.title = '소리 듣기';
    nm.onclick = () => audition(g); row.appendChild(nm);
    pat[g].forEach((lv, i) => {
      const c = el('div', `sqCell lv${lv}` + (i % 4 === 0 ? ' beat' : ''));
      c.addEventListener('pointerdown', e => {
        e.preventDefault();
        const nv = e.button === 2 ? 0 : (pat[g][i] + 1) % 4;
        pat[g][i] = nv; c.className = `sqCell lv${nv}` + (i % 4 === 0 ? ' beat' : '');
        if (nv) audition(g, nv);
        renderBeatTimeline(); updateAccSum();
      });
      c.addEventListener('contextmenu', e => e.preventDefault());
      row.appendChild(c);
    });
    box.appendChild(row);
  }
  accM.querySelectorAll('[data-pat]').forEach(b => b.classList.toggle('on', b.dataset.pat === bt.edit));
}
function btLabels() {
  $('btSwingV').textContent = Math.round(+$('btSwing').value * 100) + '%';
  $('btGainV').textContent = Math.round(+$('btGain').value * 100) + '%';
  $('btHumanV').textContent = Math.round(+$('btHuman').value * 100) + '%';
}
function renderBeatStyles() {
  const row = $('accStyles'); row.innerHTML = ''; const rec = recommendBeat();
  BEATS.forEach(P => {
    const b = el('div', 'theme' + (bt.preset === P.id ? ' on' : ''));
    b.style.background = `linear-gradient(135deg, ${P.grad[0]}, ${P.grad[1]})`;
    b.append(ico(P.icon, 'tIcon'), el('span', 'tName', P.name), el('span', 'tDesc', P.desc));
    if (rec === P.id) b.appendChild((() => { const c = el('span', 'tCnt rec'); c.append(ico('sparkle'), el('span', null, '추천')); return c; })());
    b.addEventListener('click', () => { loadBeatPreset(P.id); renderBeatStyles(); renderSeq(); renderBeatTimeline(); updateAccSum(); });
    row.appendChild(b);
  });
  const on = row.querySelector('.theme.on');
  if (on) { const l = on.offsetLeft - row.offsetLeft, r = l + on.offsetWidth; if (l < row.scrollLeft || r > row.scrollLeft + row.clientWidth) row.scrollLeft = l - 20; }
}
// 타임라인(마디 줄): 코드 칩·비트 마디가 한 스크롤에 있고, 편집 화면과도 같이 움직임
const BARW = 112;
let tlStart = 0, tlSyncing = false;
function drawMiniBar(cv, pat) {
  const w = cv.width = BARW - 18, h = cv.height = 26, c = cv.getContext('2d');
  c.fillStyle = '#0d0e11'; c.fillRect(0, 0, w, h);
  [[42, '#8ae6c6', 2], [38, '#f2c230', 11], [36, '#ff8a65', 20]].forEach(([g, col, y]) => {
    const alt = g === 42 ? [42, 46, 51, 70] : g === 38 ? [38, 39, 37, 50] : [36, 45];
    for (let i = 0; i < 16; i++) { const lv = Math.max(...alt.map(a => pat[a][i])); if (!lv) continue; c.globalAlpha = 0.35 + 0.22 * lv; c.fillStyle = col; c.fillRect(1 + i * (w - 2) / 16, y, (w - 2) / 16 - 1, 5); }
  });
  c.globalAlpha = 1;
}
function renderBeatTimeline() {
  const row = $('accBeatRow'); row.innerHTML = '';
  if (acc.tab !== 'beat') return;
  const { start, bars } = beatRange(), every = +$('btFill').value; tlStart = start;
  for (let i = 0; i < bars; i++) {
    const fill = every > 0 && ((i + 1) % every === 0 || i === bars - 1) && bars > 1;
    const cell = el('div', 'bchip' + (fill ? ' fill' : '')); cell.style.width = (BARW - 6) + 'px';
    cell.appendChild(el('span', 'cbar', `${start / 16 + i + 1}마디 · ${fill ? '필인' : '기본'}`));
    const cv = document.createElement('canvas'); drawMiniBar(cv, fill ? bt.B : bt.A); cell.appendChild(cv);
    cell.title = '눌러서 이 패턴 편집'; cell.onclick = () => { bt.edit = fill ? 'B' : 'A'; renderSeq(); };
    row.appendChild(cell);
  }
  $('btInfo').textContent = `${start / 16 + 1}~${start / 16 + bars}마디 (${bars}마디)`;
  syncTimelineFromEditor();
}
function syncTimelineFromEditor() {
  if (!accM.classList.contains('show') || tlSyncing) return;
  tlSyncing = true;
  $('accTimeline').scrollLeft = Math.max(0, (scroller.scrollLeft / STEP_W - tlStart) / 16 * BARW);
  requestAnimationFrame(() => { tlSyncing = false; });
}
function syncEditorFromTimeline() {
  if (tlSyncing) return;
  tlSyncing = true;
  scroller.scrollLeft = (tlStart + $('accTimeline').scrollLeft / BARW * 16) * STEP_W;
  requestAnimationFrame(() => { tlSyncing = false; });
}
function updateTimelineHead() {
  const hd = $('tlHead'); if (!accM.classList.contains('show')) return;
  const x = (playhead - tlStart) / 16 * BARW;
  hd.style.display = mode === 'play' && x >= 0 ? 'block' : 'none'; hd.style.left = x + 'px';
  if (mode === 'play') { const tl = $('accTimeline'); if (x < tl.scrollLeft || x > tl.scrollLeft + tl.clientWidth - 30) tl.scrollLeft = x - 40; }
}

// ───────── 반주 창 ─────────
const accM = $('accModal');
const acc = { tab: 'rec', key: { t: 0, minor: false, conf: 0 }, segs: [], style: 'ballad', rec: 'ballad' };
const keyVal = k => `${k.t}:${k.minor ? 1 : 0}`;
(() => {
  for (let t = 0; t < 12; t++) for (const m of [0, 1]) $('accKey').add(new Option(keyName({ t, minor: !!m }), `${t}:${m}`));
  for (let t = 0; t < 12; t++) $('accSKey').add(new Option(`${ABC[t]} (${SOL[t]})`, String(t)));
  PROGS.forEach(p => $('accProg').add(new Option(p.name + (p.minor ? ' (단조)' : ''), p.id)));
})();
function accSrcTrack() { return trk(+$('accSrc').value); }
function openAccomp() {
  if (mode !== 'idle') stop();
  closeCtx(); endPaste();
  const s = $('accSrc'); s.innerHTML = '';
  const cands = S.tracks.filter(t => !isDrumTrack(t) && !t.accomp && S.notes.some(n => n.t === t.id));
  cands.forEach(t => s.add(new Option(`${t.name} (노트 ${S.notes.filter(n => n.t === t.id).length})`, t.id)));
  if (!cands.length) s.add(new Option('멜로디가 있는 트랙이 없어요', ''));
  const at = activeTrack(); if (cands.includes(at)) s.value = at.id;
  $('accSKey').value = String(S.key !== 'off' ? +S.key : 0);
  accM.classList.add('show');
  setAccTab(cands.length ? 'rec' : 'sample');
}
function closeAccomp() { if (mode === 'play') stop(); accM.classList.remove('show'); }
function setAccTab(tab) {
  acc.tab = tab;
  if (mode === 'play') stop();
  accM.querySelectorAll('.atab[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('paneRec').style.display = tab === 'rec' ? '' : 'none'; $('paneSample').style.display = tab === 'sample' ? '' : 'none';
  const isBeat = tab === 'beat';
  $('paneBeat').style.display = isBeat ? '' : 'none'; $('beatSec').style.display = isBeat ? '' : 'none'; $('accParts').style.display = isBeat ? 'none' : '';
  $('tlTitle').innerHTML = isBeat ? '마디별 패턴 <span class="mhint">· 마디를 누르면 그 패턴(기본/필인)을 편집해요 · 편집 화면과 같이 스크롤돼요</span>' : '코드 진행 <span class="mhint">· 칩을 눌러 마디마다 코드를 바꿀 수 있어요 · 편집 화면과 같이 스크롤돼요</span>';
  $('accOk').textContent = isBeat ? '비트 추가' : '반주 추가';
  $('accChords').innerHTML = ''; $('accBeatRow').innerHTML = '';
  if (isBeat) { if (!bt.loaded) { loadBeatPreset(recommendBeat()); bt.loaded = true; } bt.seed = (Math.random() * 1e9) | 0; renderBeatStyles(); renderSeq(); renderBeatTimeline(); updateAccSum(); return; }
  if (tab === 'rec') analyzeRec(false); else buildSample();
  acc.rec = tab === 'rec' ? recommendStyle(accSrcTrack()) : acc.rec;
  if (!ACC_STYLES.some(s => s.id === acc.style) || tab === 'rec') acc.style = acc.rec;
  renderAccStyles(); renderChords();
}
function analyzeRec(keepKey) {
  const t = accSrcTrack(), ns = t ? S.notes.filter(n => n.t === t.id) : [];
  if (!ns.length) { acc.segs = []; $('accKeyInfo').innerHTML = '멜로디 트랙에 노트가 없어요. <b>샘플 반주</b> 탭을 써 보세요'; return; }
  if (!keepKey) { acc.key = detectKey(ns); $('accKey').value = keyVal(acc.key); }
  const per = $('accPer').value;
  acc.segs = analyzeChords(ns, acc.key, per === 'auto' ? 'auto' : +per);
  $('accKeyInfo').innerHTML = keepKey ? `조: <b>${keyName(acc.key)}</b>` : `추정 조: <b>${keyName(acc.key)}</b> · 확신 ${Math.round(acc.key.conf * 100)}%`;
}
function buildSample() {
  const prog = PROGS.find(p => p.id === $('accProg').value) || PROGS[0], t = +$('accSKey').value, n = prog.id === 'blues' ? Math.max(12, +$('accBars').value) : +$('accBars').value;
  acc.key = { t, minor: prog.minor, conf: 1 };
  const start = Math.floor(playhead / 16) * 16;
  acc.segs = Array.from({ length: n }, (_, i) => { const [d, q] = prog.ch[i % prog.ch.length]; return { s: start + i * 16, e: start + i * 16 + 16, chord: { r: (t + d) % 12, q } }; });
  $('accStartInfo').textContent = `${Math.floor(start / 16) + 1}마디부터 (재생 위치) · ${keyName(acc.key)}`;
  acc.rec = { pop: 'pop', ballad: 'ballad', canon: 'orch', fifties: 'kids', royal: 'chip', jazz: 'lofi', blues: 'band', epic: 'orch', medi: 'medieval', sad: 'ballad' }[prog.id] || 'ballad';
}
function chordOptions(sel, cur) {
  sel.innerHTML = '';
  const g1 = document.createElement('optgroup'); g1.label = '이 조의 코드'; const seen = new Set();
  keyVocab(acc.key).forEach(c => { const v = `${c.r}:${c.q}`; if (seen.has(v)) return; seen.add(v); g1.appendChild(new Option(chordName(c), v)); });
  const g2 = document.createElement('optgroup'); g2.label = '모든 코드';
  for (let r = 0; r < 12; r++) for (const q of ['maj', 'min', '7', 'maj7', 'm7', 'dim']) { const v = `${r}:${q}`; if (!seen.has(v)) g2.appendChild(new Option(chordName({ r, q }), v)); }
  sel.append(g1, g2, new Option('쉼 (N.C.)', 'nc'));
  sel.value = cur ? `${cur.r}:${cur.q}` : 'nc';
}
function renderChords() {
  const box = $('accChords'); box.innerHTML = '';
  if (acc.tab === 'beat') return;
  tlStart = acc.segs.length ? acc.segs[0].s : 0;
  if (!acc.segs.length) { box.appendChild(el('div', 'mhint', '코드가 없어요')); updateAccSum(); return; }
  acc.segs.forEach(sg => {
    const ch = el('div', 'cchip'), bar = Math.floor(sg.s / 16) + 1, half = sg.s % 16 ? '½' : '';
    ch.style.width = ((sg.e - sg.s) / 16 * BARW - 6) + 'px';
    ch.appendChild(el('span', 'cbar', `${bar}마디${half}`));
    const sel = document.createElement('select'); chordOptions(sel, sg.chord); ch.appendChild(sel);
    const rm = el('span', 'crom', roman(sg.chord, acc.key)); ch.appendChild(rm);
    sel.addEventListener('change', () => { sg.chord = sel.value === 'nc' ? null : { r: +sel.value.split(':')[0], q: sel.value.split(':')[1] }; rm.textContent = roman(sg.chord, acc.key); updateAccSum(); sel.blur(); });
    box.appendChild(ch);
  });
  syncTimelineFromEditor(); updateAccSum();
}
function renderAccStyles() {
  const row = $('accStyles'); row.innerHTML = '';
  ACC_STYLES.forEach(st => {
    const b = el('div', 'theme' + (acc.style === st.id ? ' on' : ''));
    b.style.background = `linear-gradient(135deg, ${st.grad[0]}, ${st.grad[1]})`;
    b.append(ico(st.icon, 'tIcon'), el('span', 'tName', st.name), el('span', 'tDesc', st.desc));
    if (acc.rec === st.id) b.appendChild((() => { const c = el('span', 'tCnt rec'); c.append(ico('sparkle'), el('span', null, '추천')); return c; })());
    b.title = st.layers.map(l => l.label).join(' · ');
    b.addEventListener('click', () => { acc.style = st.id; renderAccStyles(); });
    row.appendChild(b);
  });
  const on = row.querySelector('.theme.on');
  if (on) { const l = on.offsetLeft - row.offsetLeft, r = l + on.offsetWidth; if (l < row.scrollLeft || r > row.scrollLeft + row.clientWidth) row.scrollLeft = l - 20; }
  const st = ACC_STYLES.find(s => s.id === acc.style);
  accM.querySelectorAll('[data-part]').forEach(cb => { const has = st.layers.some(l => l.part === cb.dataset.part); cb.disabled = !has; cb.parentElement.classList.toggle('off', !has); });
  updateAccSum();
}
function accGenerate() {
  if (!acc.segs.length) return [];
  accKeyRef = acc.key;
  const parts = new Set([...accM.querySelectorAll('[data-part]')].filter(c => c.checked && !c.disabled).map(c => c.dataset.part));
  return buildAccomp(acc.segs, ACC_STYLES.find(s => s.id === acc.style), parts, +$('accGain').value);
}
function updateAccSum() {
  if (acc.tab === 'beat') {
    const nb = genBeat(), { bars } = beatRange(), P = BEATS.find(b => b.id === bt.preset);
    $('accSum').textContent = nb.length ? `${P.name} · ${bars}마디 · 타격 ${nb.length}개` : '패턴이 비어 있어요';
    $('accOk').disabled = !nb.length; return;
  }
  const g = accGenerate(), bars = acc.segs.length ? (acc.segs[acc.segs.length - 1].e - acc.segs[0].s) / 16 : 0;
  $('accSum').textContent = g.length ? `${bars}마디 · 트랙 ${g.length}개 (${g.map(x => x.layer.label).join(', ')}) · 노트 ${g.reduce((a, x) => a + x.notes.length, 0)}개` : '넣을 반주가 없어요';
  $('accOk').disabled = !g.length;
}
function accPreview() {
  if (acc.tab === 'beat') return beatPreview();
  const g = accGenerate(); if (!g.length) return;
  if (mode !== 'idle') stop();
  AC();
  const start = acc.segs[0].s, end = acc.segs[acc.segs.length - 1].e, ss = stepSec(), replace = $('accReplace').checked;
  const vox = S.notes.filter(n => isVocalTrack(trk(n.t)) && audible(trk(n.t)));
  prepVocals(vox, start); buildGlides(S.notes, start);
  T.startStep = start; T.t0 = ac.currentTime + (vox.length ? KV.PRE + 0.03 : 0.08); T.noMetro = true;
  for (const n of S.notes) {
    const t = trk(n.t); if (!audible(t) || (replace && t.accomp) || n.s < start || n.s >= end) continue;
    tone(n.p, timeAt(n.s), n.l * ss, t, n.v ?? 1, n);
  }
  g.forEach((x, i) => { const tt = mkTrack(-300 - i, x.layer.inst); tt.vol = 0.85; delete buses[tt.id]; x.notes.forEach(n => tone(n.p, timeAt(n.s), n.l * ss, tt, n.v)); });
  T.endStep = end + 4; playhead = start; mode = 'play'; setButtons(); loop();
}
function beatPreview() {
  const nb = genBeat(); if (!nb.length) return;
  if (mode !== 'idle') stop();
  AC();
  const { start, bars } = beatRange(), end = start + bars * 16, ss = stepSec(), replace = $('btReplace').checked;
  const vox = S.notes.filter(n => isVocalTrack(trk(n.t)) && audible(trk(n.t)));
  prepVocals(vox, start); buildGlides(S.notes, start);
  T.startStep = start; T.t0 = ac.currentTime + (vox.length ? KV.PRE + 0.03 : 0.08); T.noMetro = true;
  for (const n of S.notes) { const t = trk(n.t); if (!audible(t) || (replace && t.beat) || n.s < start || n.s >= end) continue; tone(n.p, timeAt(n.s), n.l * ss, t, n.v ?? 1, n); }
  const dt = tmpDrum(); delete buses[dt.id];
  nb.forEach(n => tone(n.p, timeAt(n.s), 0.2, dt, n.v));
  T.endStep = end + 4; playhead = start; mode = 'play'; setButtons(); loop();
}
function beatCommit() {
  const nb = genBeat(); if (!nb.length) return;
  if (mode !== 'idle') stop();
  pushUndo();
  if ($('btReplace').checked) {
    const old = new Set(S.tracks.filter(t => t.beat).map(t => t.id));
    S.notes = S.notes.filter(n => !old.has(n.t)); S.tracks = S.tracks.filter(t => !old.has(t.id));
  }
  const P = BEATS.find(b => b.id === bt.preset), t = mkTrack(S.nextId++, 'drums', `비트 · ${P.name}`);
  t.beat = true; t.vol = 0.9; S.tracks.push(t); t.color = pickColor('drums', t);
  let end = 0; nb.forEach(n => { S.notes.push({ p: n.p, s: n.s, l: n.l, v: n.v, t: t.id }); end = Math.max(end, n.s + n.l); });
  if (!S.tracks.some(x => x.id === S.active)) S.active = S.tracks[0].id;
  ensureLength(end); sel = new Set(); renderInspector(); save(); drawAll(); closeAccomp();
  toast(`'${t.name}' 트랙을 넣었어요 (되돌리기 가능)`);
}
function accCommit() {
  if (acc.tab === 'beat') return beatCommit();
  const g = accGenerate(); if (!g.length) return;
  if (mode !== 'idle') stop();
  pushUndo();
  const src = accSrcTrack();
  if ($('accReplace').checked) {
    const old = new Set(S.tracks.filter(t => t.accomp).map(t => t.id));
    S.notes = S.notes.filter(n => !old.has(n.t)); S.tracks = S.tracks.filter(t => !old.has(t.id));
  }
  let end = 0;
  g.forEach(x => {
    const t = mkTrack(S.nextId++, x.layer.inst, `반주 · ${x.layer.label}`);
    t.accomp = true; t.vol = 0.85; S.tracks.push(t); t.color = pickColor(t.inst, t);
    x.notes.forEach(n => { S.notes.push({ ...n, t: t.id }); end = Math.max(end, n.s + n.l); });
  });
  if (!S.tracks.some(t => t.id === S.active)) S.active = (src && trk(src.id)) ? src.id : S.tracks[0].id;
  ensureLength(end); sel = new Set(); renderInspector(); save(); drawAll(); closeAccomp();
  toast(`반주 트랙 ${g.length}개를 넣었어요 (되돌리기 가능)`);
}
accM.querySelectorAll('.atab[data-tab]').forEach(b => b.addEventListener('click', () => setAccTab(b.dataset.tab)));
accM.querySelectorAll('[data-pat]').forEach(b => b.addEventListener('click', () => { bt.edit = b.dataset.pat; renderSeq(); }));
['btStart', 'btBars', 'btFill'].forEach(id => $(id).addEventListener('change', e => { e.target.blur(); renderBeatTimeline(); updateAccSum(); }));
['btSwing', 'btGain', 'btHuman'].forEach(id => $(id).addEventListener('input', () => { btLabels(); updateAccSum(); }));
$('btCrash').addEventListener('change', updateAccSum);
$('btClear').onclick = () => { bt[bt.edit] = emptyPat(); renderSeq(); renderBeatTimeline(); updateAccSum(); };
$('btReset').onclick = () => { const e = bt.edit; loadBeatPreset(bt.preset); bt.edit = e; renderSeq(); renderBeatTimeline(); updateAccSum(); };
$('accTimeline').addEventListener('scroll', syncEditorFromTimeline);
$('accTimeline').addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); $('accTimeline').scrollLeft += e.deltaY; } }, { passive: false });
scroller.addEventListener('scroll', syncTimelineFromEditor);
$('accSrc').addEventListener('change', e => { e.target.blur(); analyzeRec(false); acc.rec = recommendStyle(accSrcTrack()); acc.style = acc.rec; renderAccStyles(); renderChords(); });
$('accPer').addEventListener('change', e => { e.target.blur(); analyzeRec(true); renderChords(); });
$('accKey').addEventListener('change', e => { e.target.blur(); const [t, m] = e.target.value.split(':'); acc.key = { t: +t, minor: m === '1', conf: 1 }; analyzeRec(true); renderChords(); });
['accSKey', 'accProg', 'accBars'].forEach(id => $(id).addEventListener('change', e => { e.target.blur(); buildSample(); acc.style = acc.rec; renderAccStyles(); renderChords(); }));
accM.querySelectorAll('[data-part]').forEach(cb => cb.addEventListener('change', updateAccSum));
$('accGain').addEventListener('input', updateAccSum);
$('accStyles').addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); $('accStyles').scrollLeft += e.deltaY; } }, { passive: false });
$('accPlay').onclick = accPreview;
$('accStop').onclick = () => { if (mode !== 'idle') stop(); };
$('accOk').onclick = accCommit;
$('accCancel').onclick = closeAccomp;
$('accClose').onclick = closeAccomp;
accM.addEventListener('pointerdown', e => { if (e.target === accM) closeAccomp(); });
$('accBtn').onclick = openAccomp;

// ───────── 스텝 입력 (Musical Typing) — 컴퓨터 키보드로 건반 연주 · 임시 보드에 쌓아서 내보내기 ─────────
// 창이 열려 있는 동안에는 모든 키 입력을 이 창이 가져가요 (다른 단축키는 동작하지 않음).
const stepM = $('stepModal');
const SI_KEY = 'hc-stepinput';
// 기본 배치: 아랫줄 Z~M = 도~시, 윗줄 Q~] = 한 옥타브 위 도 ~ 두 옥타브 위 솔, 그 사이 위의 키 = 검은건반
// (윗줄 [ ] 사이의 '=' 는 옥타브 + 키라서 파#은 비워 둠 — '연주 키 설정'에서 넣을 수 있어요)
const SI_DEF_MAP = { 0: 'KeyZ', 1: 'KeyS', 2: 'KeyX', 3: 'KeyD', 4: 'KeyC', 5: 'KeyV', 6: 'KeyG', 7: 'KeyB', 8: 'KeyH', 9: 'KeyN', 10: 'KeyJ', 11: 'KeyM',
  12: 'KeyQ', 13: 'Digit2', 14: 'KeyW', 15: 'Digit3', 16: 'KeyE', 17: 'KeyR', 18: 'Digit5', 19: 'KeyT', 20: 'Digit6', 21: 'KeyY', 22: 'Digit7', 23: 'KeyU',
  24: 'KeyI', 25: 'Digit9', 26: 'KeyO', 27: 'Digit0', 28: 'KeyP', 29: 'BracketLeft', 31: 'BracketRight' };
const SI_SPAN = 32;   // 아랫줄 도부터 31반음 위(두 옥타브 위 솔)까지
const SI_LENS = [[1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2'], [16, '1']];
const SI_RESERVED = /^(Enter|NumpadEnter|Space|Escape|Backspace|Delete|Tab|Arrow|Shift|Control|Alt|Meta|CapsLock|F\d|ContextMenu|Lang|Convert|NonConvert|KanaMode|HangulMode|Hanja)/;
const SI_KB_ROWS = [
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash']];
const SI_KB_INDENT = [0, 25, 37, 60];
const SI_CODE_LBL = { Minus: '-', Equal: '+', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\',
  Backquote: '`', IntlBackslash: '\\', NumpadAdd: 'Num+', NumpadSubtract: 'Num−', NumpadMultiply: 'Num*', NumpadDivide: 'Num/', NumpadDecimal: 'Num.' };
const siCodeLbl = c => !c ? '' : SI_CODE_LBL[c] || (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') ? 'Num' + c.slice(6) : c);
const SI_MQ = '(max-width:760px), (pointer:coarse) and (max-height:520px) and (orientation:landscape)';
const siMobile = () => window.matchMedia(SI_MQ).matches;
const siSpan = () => !siMobile() ? SI_SPAN : (window.innerWidth < 600 ? 17 : 25);   // 모바일: 세로 = 도~파(흰건반 11개) · 가로 = 도~높은 도(흰건반 15개)
const SI = {
  map: Object.assign({}, SI_DEF_MAP), octDn: 'Minus', octUp: 'Equal', oct: 4, len: 2, auto: false,
  notes: [], cursor: 0, pending: [], held: new Map(), sel: new Set(), undo: [], redo: [],
  remap: false, wait: null, drag: null, pan: null, span: 0, geo: null, playT: null, playing: false,
  steps: [], cur: 0, playIdx: -1, exBundle: false,
  metro: false, selTool: false, box: null, padOpen: false
};
(() => {
  const o = lsGet(SI_KEY);
  if (o && typeof o === 'object') {
    if (o.map && typeof o.map === 'object') SI.map = o.map;
    if (typeof o.octDn === 'string') SI.octDn = o.octDn;
    if (typeof o.octUp === 'string') SI.octUp = o.octUp;
    if (Number.isInteger(o.oct)) SI.oct = clamp(o.oct, 0, 6);
    if (SI_LENS.some(l => l[0] === o.len)) SI.len = o.len;
    SI.auto = !!o.auto;
    SI.metro = !!o.metro;
  }
  if (!(o && typeof o === 'object' && 'auto' in o) && siMobile()) SI.auto = true;   // 모바일 첫 사용: 건반에서 손을 떼면 바로 입력
})();
// ── 스텝 여러 개: 스텝마다 따로 임시 보드(노트 · 입력 위치 · 되돌리기)를 가져요. 브라우저에 저장돼서 새로고침해도 남아요 ──
const SI_STEPS_KEY = 'hc-stepboards';
const siNewStep = name => ({ name, notes: [], cursor: 0, ex: false, undo: [], redo: [] });
(() => {
  const o = lsGet(SI_STEPS_KEY), ok = n => n && Number.isFinite(n.p) && Number.isFinite(n.s) && Number.isFinite(n.l) && n.l > 0 && n.s >= 0;
  if (o && Array.isArray(o.steps) && o.steps.length) {
    SI.steps = o.steps.filter(st => st && typeof st === 'object').map((st, i) => ({
      name: String(st.name || `스텝 ${i + 1}`).slice(0, 30), ex: !!st.ex, undo: [], redo: [],
      notes: Array.isArray(st.notes) ? st.notes.filter(ok).map(n => ({ p: n.p, s: n.s, l: n.l })) : [],
      cursor: Number.isFinite(st.cursor) ? Math.max(0, st.cursor) : 0, mod: Number.isFinite(st.mod) ? st.mod : 0 }));
  }
  if (!SI.steps.length) SI.steps = [siNewStep('스텝 1')];
  SI.cur = clamp((o && o.cur) | 0, 0, SI.steps.length - 1);
  const st = SI.steps[SI.cur]; SI.notes = st.notes; SI.cursor = st.cursor; SI.undo = st.undo; SI.redo = st.redo;
})();
function siStash() { const st = SI.steps[SI.cur]; if (!st) return; st.notes = SI.notes; st.cursor = SI.cursor; st.undo = SI.undo; st.redo = SI.redo; }
function siLoad(i) { SI.cur = i; const st = SI.steps[i]; SI.notes = st.notes; SI.cursor = st.cursor; SI.undo = st.undo || []; SI.redo = st.redo || []; SI.sel = new Set(); }
let siSaveT = 0;
function siSaveSteps() {
  clearTimeout(siSaveT);
  siSaveT = setTimeout(() => { siStash(); lsSet(SI_STEPS_KEY, { cur: SI.cur, steps: SI.steps.map(st => ({ name: st.name, ex: st.ex, cursor: st.cursor, mod: st.mod || 0, notes: st.notes.map(n => ({ p: n.p, s: n.s, l: n.l })) })) }); }, 400);
}
const siStepNotes = i => i === SI.cur ? SI.notes : SI.steps[i].notes;
function siStepLen(st) { let e = st.cursor || 0; for (const n of st.notes) e = Math.max(e, n.s + n.l); return e; }
function siExportList() { siStash(); const l = SI.steps.filter(st => st.ex); return (l.length ? l : [SI.steps[SI.cur]]).filter(st => st.notes.length); }
// 스텝 입력 창에는 '지금 스텝' 버튼만 — 관리(정렬 · 배치 · 복제 · 삭제 · 이름)는 따로 「스텝 관리」 창(그리드)에서
function siRenderSteps() {
  const st = SI.steps[SI.cur]; if (!st || !$('siCurName')) return;
  $('siCurName').textContent = st.name;
  if (smOpen()) smRender();
}
function siSwitch(i) {
  if (i === SI.cur || !SI.steps[i]) return;
  if (SI.playing) siStopPlay();
  siStash(); siLoad(i);
  $('siBoardWrap').scrollLeft = 0;
  siRenderSteps(); siRefresh(); siScrollTo(SI.cursor); siSaveSteps();
}
function siNextName(base = '스텝') { let k = SI.steps.length + 1; while (SI.steps.some(st => st.name === `${base} ${k}`)) k++; return `${base} ${k}`; }
function siAddStep() {   // 맨 뒤에 새 스텝을 만들고 바로 편집
  if (SI.playing) siStopPlay();
  siStash(); const st = siNewStep(siNextName()); st.mod = Date.now();
  SI.steps.push(st); siLoad(SI.steps.length - 1);
  smClose(); siRenderSteps(); siRefresh(); siSaveSteps(); toast(`'${st.name}'을(를) 만들었어요 — 건반을 눌러 채워 보세요`);
}
function siDupStep(i) {   // 바로 뒤에 복사본 (지금 편집 중인 스텝은 그대로)
  if (SI.playing) siStopPlay();
  siStash(); const st = SI.steps[i], c = siNewStep(st.name.slice(0, 26) + ' 복사');
  c.notes = st.notes.map(n => ({ p: n.p, s: n.s, l: n.l })); c.cursor = st.cursor; c.mod = Date.now();
  SI.steps.splice(i + 1, 0, c); if (SI.cur > i) SI.cur++;
  siRenderSteps(); siSaveSteps(); toast(`'${c.name}'을(를) 만들었어요`);
}
async function siDelStep(i) {
  const st = SI.steps[i]; siStash();
  if (st.notes.length && !(await confirmBox(`'${st.name}' 스텝을 지울까요?`, `노트 ${st.notes.length}개가 함께 지워지고 되돌릴 수 없어요.`, '스텝 삭제'))) return;
  i = SI.steps.indexOf(st); if (i < 0) return;
  if (SI.playing) siStopPlay();
  const curSt = SI.steps[SI.cur];
  if (SI.steps.length === 1) { SI.steps = [siNewStep('스텝 1')]; siLoad(0); }
  else { SI.steps.splice(i, 1); if (curSt === st) siLoad(Math.min(i, SI.steps.length - 1)); else SI.cur = SI.steps.indexOf(curSt); }
  siRenderSteps(); siRefresh(); siSaveSteps(); toast(`'${st.name}' 스텝을 지웠어요`);
}
function siRenameStep(i) {
  if (!smOpen()) smOpenWin();
  const d = $('smGrid').querySelector(`.smc[data-i="${i}"]`); if (!d) return;
  const nm = d.querySelector('.smNm'), st = SI.steps[i], inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'sstIn'; inp.value = st.name; inp.maxLength = 30;
  ['click', 'pointerdown', 'dblclick'].forEach(t => inp.addEventListener(t, e => e.stopPropagation()));
  nm.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  inp.addEventListener('blur', () => {
    if (done) return; done = true;
    const v = inp.value.trim();
    if (inp.dataset.cancel !== '1' && v && v !== st.name) { st.name = v; st.mod = Date.now(); }
    siRenderSteps(); siSaveSteps();
  });
}
// ── 스텝 관리 창: 그리드 · 맨 앞 「새 스텝 추가」 · 카드를 누르면 편집 · 끌어서 배치 · 정렬 ──
const smOpen = () => $('stepMgr').classList.contains('show');
// pick = 스텝 입력을 처음 열 때: 새 스텝을 만들지, 기존 스텝을 이어서 만들지 먼저 고르기
const SM_TXT = {
  pick: ['새로 만들까요, 이어서 만들까요?', '「새 스텝 만들기」를 누르거나, 이어서 만들 스텝 카드를 눌러 주세요 · 닫으면 스텝 입력도 닫혀요'],
  mgr: ['스텝 관리', '카드를 누르면 편집 · 끌어서 순서 바꾸기<span class="smTouch">(터치는 꾹 누른 뒤)</span> · 체크한 스텝은 이 순서대로 내보내져요'],
};
function smOpenWin(pick) {
  siStash(); const m = $('stepMgr'), k = pick === true ? 'pick' : 'mgr';
  m.classList.toggle('pick', k === 'pick');
  $('smTitleT').textContent = SM_TXT[k][0]; $('smFoot').innerHTML = SM_TXT[k][1];
  m.classList.add('show'); smRender();
}
function smClose() { const m = $('stepMgr'); if (!m.classList.contains('show')) return; m.classList.remove('show', 'pick'); $('siTip').classList.remove('show'); }
function smCancel() { const pick = $('stepMgr').classList.contains('pick'); smClose(); if (pick) closeStepInput(); }   // 고르기 화면에서 닫기 = 스텝 입력도 닫기
function smThumb(cv, st) {
  const W = cv.clientWidth || 200, H = cv.clientHeight || 64, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const ns = st.notes;
  for (let x = 0; x < 8; x++) { c.fillStyle = x % 4 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.06)'; c.fillRect(Math.round(x * W / 8), 0, 1, H); }
  if (!ns.length) return;
  let end = 16, lo = 127, hi = 0; for (const n of ns) { end = Math.max(end, n.s + n.l); lo = Math.min(lo, n.p); hi = Math.max(hi, n.p); }
  lo -= 2; hi += 2; const sx = (W - 8) / end, rh = Math.min(7, (H - 8) / (hi - lo + 1));
  const y0 = (H - rh * (hi - lo + 1)) / 2, col = (siTrack() || {}).color || '#f2c230';
  c.fillStyle = col;
  for (const n of ns) { rr(c, 4 + n.s * sx, y0 + (hi - n.p) * rh, Math.max(2, n.l * sx - 1), Math.max(2, rh - 1), 1.5); c.fill(); }
}
function smRender() {
  const g = $('smGrid'); g.innerHTML = '';
  const pick = $('stepMgr').classList.contains('pick');
  const add = el('button', 'smc smAdd'); add.innerHTML = `<span class="smPlus">${svg('plus')}</span><b>${pick ? '새 스텝 만들기' : '새 스텝 추가'}</b>`;
  add.addEventListener('click', siAddStep); g.appendChild(add);
  SI.steps.forEach((st, i) => {
    const on = i === SI.cur, d = el('div', 'smc' + (on ? ' on' : '') + (st.ex ? ' ex' : '')); d.dataset.i = i;
    let end = 0; for (const n of st.notes) end = Math.max(end, n.s + n.l);
    d.innerHTML = `<div class="smTop"><span class="smNo">${i + 1}</span>${on ? `<span class="smCur">${pick ? '최근 작업' : '편집 중'}</span>` : ''}<span style="flex:1"></span></div>
      <div class="smThW"><canvas class="smTh"></canvas></div><div class="smNm"></div>
      <div class="smInfo">${st.notes.length ? `노트 ${st.notes.length}개 · ${Math.ceil(end / 16) || 1}마디` : '비어 있음'}</div>${pick ? '<div class="smGo">이어서 만들기 ›</div>' : ''}<div class="smActs"></div>`;
    d.querySelector('.smNm').textContent = st.name;
    const top = d.querySelector('.smTop'), acts = d.querySelector('.smActs');
    const btn = (box, cls, icon, tip, fn) => { const b = el('button', 'smB ' + cls); b.innerHTML = svg(icon); b.dataset.tip = tip; b.addEventListener('click', e => { e.stopPropagation(); b.blur(); fn(); }); b.addEventListener('pointerdown', e => e.stopPropagation()); box.appendChild(b); return b; };
    btn(top, 'smCk', 'check', st.ex ? '내보내기에서 빼기' : '내보낼 스텝으로 체크 — 체크한 스텝들이 이 순서대로 이어져요', () => { st.ex = !st.ex; siRenderSteps(); siInfo(); siSaveSteps(); });
    const pl = SI.playing && SI.playIdx === i;
    if (pl) d.classList.add('playing');
    if (st.notes.length) {   // 미리 듣기: 썸네일 위 큰 ▶ (카드를 고르지 않고 소리만 들어요)
      const pb = el('button', 'smThPlay' + (pl ? ' on' : '')); pb.innerHTML = svg(pl ? 'stop' : 'play') + `<span>${pl ? '정지' : '미리 듣기'}</span>`;
      pb.dataset.tip = '이 스텝 미리 듣기';
      pb.addEventListener('click', e => { e.stopPropagation(); pb.blur(); siPlayBoard(i); });
      pb.addEventListener('pointerdown', e => e.stopPropagation());
      d.querySelector('.smThW').appendChild(pb);
    }
    btn(acts, '', 'rename', '이름 바꾸기', () => siRenameStep(i));
    btn(acts, '', 'dup', '복제', () => siDupStep(i));
    btn(acts, 'danger', 'trash', '삭제', () => siDelStep(i));
    d.querySelector('.smNm').addEventListener('dblclick', e => { e.stopPropagation(); siRenameStep(i); });
    d.addEventListener('click', () => { if (smDrag && smDrag.moved) return; siSwitch(i); smClose(); });
    d.addEventListener('pointerdown', e => smDragStart(e, d, i));
    g.appendChild(d);
    requestAnimationFrame(() => smThumb(d.querySelector('.smTh'), st));
  });
  $('smCount').textContent = `${SI.steps.length}개`;
}
// 끌어서 배치: 마우스는 바로, 터치는 꾹 누른 뒤
let smDrag = null;
function smDragStart(e, d, i) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const D = smDrag = { id: e.pointerId, d, i, x0: e.clientX, y0: e.clientY, moved: false, live: e.pointerType !== 'touch', to: i, hold: 0 };
  if (!D.live) D.hold = setTimeout(() => { D.live = true; d.classList.add('lift'); if (navigator.vibrate) navigator.vibrate(8); }, 330);
  const mv = ev => {
    if (ev.pointerId !== D.id) return;
    const dx = ev.clientX - D.x0, dy = ev.clientY - D.y0;
    if (!D.live) { if (Math.hypot(dx, dy) > 8) { clearTimeout(D.hold); end(); } return; }
    if (!D.moved && Math.hypot(dx, dy) < 6) return;
    if (!D.moved) { D.moved = true; d.classList.add('dragging'); try { d.setPointerCapture(D.id); } catch (_) {} }
    ev.preventDefault();
    d.style.transform = `translate(${dx}px, ${dy}px) rotate(1.5deg)`;
    let to = D.i;
    $('smGrid').querySelectorAll('.smc:not(.smAdd)').forEach(c => {
      c.classList.remove('dropL', 'dropR'); if (c === d) return;
      const r = c.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
        const j = +c.dataset.i, left = ev.clientX < r.left + r.width / 2;
        c.classList.add(left ? 'dropL' : 'dropR');
        to = left ? j : j + 1; if (to > D.i) to--;
      }
    });
    D.to = to;
  };
  const end = () => {
    window.removeEventListener('pointermove', mv, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true);
    clearTimeout(D.hold); d.classList.remove('lift');
  };
  const up = ev => {
    if (ev.pointerId !== D.id) return;
    end();
    if (D.moved) {
      d.classList.remove('dragging'); d.style.transform = '';
      if (D.to !== D.i) smMove(D.i, D.to); else smRender();
      setTimeout(() => { if (smDrag === D) smDrag = null; }, 0);
    }
  };
  window.addEventListener('pointermove', mv, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
}
function smMove(from, to) {
  siStash(); const cur = SI.steps[SI.cur], [st] = SI.steps.splice(from, 1);
  SI.steps.splice(clamp(to, 0, SI.steps.length), 0, st); SI.cur = SI.steps.indexOf(cur);
  siRenderSteps(); siSaveSteps(); toast(`'${st.name}'을(를) ${SI.steps.indexOf(st) + 1}번째로 옮겼어요`);
}
function smSort(kind) {
  siStash(); const cur = SI.steps[SI.cur], coll = new Intl.Collator('ko', { numeric: true });
  const f = { name: (a, b) => coll.compare(a.name, b.name), notes: (a, b) => b.notes.length - a.notes.length, mod: (a, b) => (b.mod || 0) - (a.mod || 0) }[kind];
  SI.steps.sort(f); SI.cur = SI.steps.indexOf(cur);
  siRenderSteps(); siSaveSteps(); toast({ name: '이름순으로', notes: '노트가 많은 순으로', mod: '최근 고친 순으로' }[kind] + ' 정렬했어요 — 끌어서 직접 옮길 수도 있어요');
}
// 모두 한 칸 띄우기(dir=1) / 붙이기(dir=-1): 음(화음)과 음 사이 간격을 격자 한 칸씩 늘리거나 줄여요
function siShiftGaps(dir) {
  if (!SI.notes.length) { toast('보드가 비어 있어요'); return; }
  const G = S.grid, starts = [...new Set(SI.notes.map(n => n.s))].sort((a, b) => a - b);
  if (starts.length < 2) { toast('음이 두 개 이상 있어야 간격을 바꿀 수 있어요'); return; }
  const endAt = new Map(); for (const n of SI.notes) endAt.set(n.s, Math.max(endAt.get(n.s) || 0, n.s + n.l));
  const shift = new Map([[starts[0], 0]]); let acc = 0, changed = 0;
  for (let i = 1; i < starts.length; i++) {
    if (dir > 0) { acc += G; changed++; }
    else { const d = Math.min(G, Math.max(0, starts[i] - endAt.get(starts[i - 1]))); if (d > 0) { acc -= d; changed++; } }
    shift.set(starts[i], acc);
  }
  if (!changed) { toast('붙일 빈 칸이 없어요 — 이미 모두 붙어 있어요'); return; }
  siPush();
  let cs = 0; for (const s0 of starts) if (s0 <= SI.cursor) cs = shift.get(s0);
  for (const n of SI.notes) n.s += shift.get(n.s);
  SI.cursor = Math.max(0, SI.cursor + cs);
  const gl = (SI_LENS.find(l => l[0] === G) || [0, G + '/16'])[1];
  siRefresh(); toast(`음 사이를 한 칸(${gl})씩 ${dir > 0 ? '띄웠어요' : '붙였어요'} (Ctrl+Z로 되돌리기)`);
}
const siSaveCfg = () => lsSet(SI_KEY, { map: SI.map, octDn: SI.octDn, octUp: SI.octUp, oct: SI.oct, len: SI.len, auto: SI.auto, metro: SI.metro });
const siBase = () => 12 * (SI.oct + 1);
const siTrack = () => trk(+$('siTrack').value) || activeTrack();
const siIsBlack = p => [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);
function siCodeToOff(code) { for (const k in SI.map) if (SI.map[k] === code) return +k; return null; }
const siPName = p => isDrumTrack(siTrack()) ? noteLabel(p, siTrack()) || name(p) : name(p);

// ── 화면 그리기 ──
function siBuildLens() {
  const box = $('siLens'); box.innerHTML = '';
  SI_LENS.forEach(([v, t]) => { const b = el('button', 'atab' + (v === SI.len ? ' on' : '')); b.textContent = t; b.dataset.tip = `음 길이 ${t}`; b.dataset.key = '; / \''; b.onclick = () => siSetLen(v); box.appendChild(b); });
}
function siSetLen(v) { SI.len = v; siSaveCfg(); siBuildLens(); siInfo(); }
function siBuildPiano() {
  const pn = $('siPiano'); pn.innerHTML = ''; pn.classList.toggle('remap', SI.remap);
  const base = siBase(), span = siSpan(), whites = []; SI.span = span;
  for (let o = 0; o < span; o++) if (!siIsBlack(base + o)) whites.push(o);
  const W = 100 / whites.length;
  for (let o = 0; o < span; o++) {
    const p = base + o, blk = siIsBlack(p), code = SI.map[o];
    const k = el('div', 'pk ' + (blk ? 'b' : 'w'));
    k.dataset.off = o;
    if (blk) { const wi = whites.filter(x => x < o).length; k.style.left = `calc(${wi * W}% - ${W * 0.3}%)`; k.style.width = W * 0.6 + '%'; }
    else { k.style.left = whites.indexOf(o) * W + '%'; k.style.width = W + '%'; }
    if (p > HIGH || p < LOW) k.classList.add('off');
    k.innerHTML = (code ? `<kbd>${siCodeLbl(code)}</kbd>` : '') + `<span class="pn">${name(p)}</span>`;
    if (((p % 12) + 12) % 12 === 0) k.classList.add('c');
    pn.appendChild(k);
  }
  $('siOctV').textContent = `${name(base)} ~ ${name(Math.min(HIGH, base + span - 1))}`;
  $('siOctDnK').textContent = siCodeLbl(SI.octDn); $('siOctUpK').textContent = siCodeLbl(SI.octUp);
  siBuildKb(); siLights();
}
function siBuildKb() {   // 컴퓨터 키보드 모양 가이드 — 키마다 어떤 음인지
  const kb = $('siKb'); kb.innerHTML = '';
  const base = siBase();
  SI_KB_ROWS.forEach((row, ri) => {
    const r = el('div', 'kr'); r.style.paddingLeft = SI_KB_INDENT[ri] + 'px';
    row.forEach(code => {
      const off = siCodeToOff(code), c = el('div', 'kc');
      c.dataset.code = code;
      let n = '';
      if (off != null) { const p = base + off; c.classList.add(siIsBlack(p) ? 'b' : 'w'); n = p <= HIGH ? name(p) : '—'; }
      else if (code === SI.octDn) { c.classList.add('fn'); n = '옥타브−'; }
      else if (code === SI.octUp) { c.classList.add('fn'); n = '옥타브+'; }
      else if (code === 'Semicolon') { c.classList.add('fn'); n = '길이−'; }
      else if (code === 'Quote') { c.classList.add('fn'); n = '길이+'; }
      c.innerHTML = `<span class="k">${siCodeLbl(code)}</span><span class="n">${n}</span>`;
      r.appendChild(c);
    });
    if (ri === 2) { const e = el('div', 'kc fn wide'); e.dataset.code = 'Enter'; e.innerHTML = '<span class="k">Enter</span><span class="n">전체 재생 · 정지</span>'; r.appendChild(e); }
    if (ri === 0) { const e = el('div', 'kc fn wide'); e.dataset.code = 'Backspace'; e.innerHTML = '<span class="k">Back</span><span class="n">지우기</span>'; r.appendChild(e); }
    kb.appendChild(r);
  });
  const sp = el('div', 'kr'); sp.style.paddingLeft = '150px';
  const s = el('div', 'kc fn wide'); s.dataset.code = 'Space'; s.style.maxWidth = '260px'; s.innerHTML = '<span class="k">Space</span><span class="n">누른 채 = 넣기 · 빈손 = 한 칸 앞으로</span>'; sp.appendChild(s);
  kb.appendChild(sp);
  const lg = el('div', 'legend');
  lg.innerHTML = '<span><i style="background:#e9e7e1"></i>흰건반</span><span><i style="background:#24262c;border:1px solid #3a3d45"></i>검은건반</span><span><i style="background:#1b1d22;border:1px solid var(--accentLine)"></i>기능 키</span><span><i style="background:var(--accent)"></i>누르는 중</span>';
  kb.appendChild(lg);
}
function siLights() {   // 누르고 있는 키 · 건반 표시
  const heldCodes = new Set(SI.held.keys()), heldP = new Set(SI.held.values()), base = siBase();
  $('siKb').querySelectorAll('.kc').forEach(c => c.classList.toggle('on', heldCodes.has(c.dataset.code)));
  $('siPiano').querySelectorAll('.pk').forEach(k => {
    const p = base + +k.dataset.off;
    k.classList.toggle('on', heldP.has(p));
    k.classList.toggle('pend', SI.pending.includes(p) && !heldP.has(p));
    k.classList.toggle('wait', !!(SI.wait && SI.wait.type === 'note' && SI.wait.off === +k.dataset.off));
  });
}
function siFlash(code) { const c = $('siKb').querySelector(`.kc[data-code="${code}"]`); if (!c) return; c.classList.add('on'); setTimeout(() => { if (!SI.held.has(code)) c.classList.remove('on'); }, 140); }
function siShowNow() {
  const nm = $('siNowNm'), sub = $('siNowSub');
  if (SI.pending.length) {
    const ps = [...SI.pending].sort((a, b) => a - b);
    nm.classList.remove('idle'); nm.textContent = ps.map(siPName).join(' · ');
    const mob = siMobile(), codes = mob ? [] : ps.map(p => SI.map[p - siBase()]).filter(Boolean).map(siCodeLbl);
    sub.textContent = (ps.length > 1 ? `화음 ${ps.length}음` : S.labelMode === 'sol' ? ABC[ps[0] % 12] + (Math.floor(ps[0] / 12) - 1) : SOL[ps[0] % 12]) + (codes.length ? ` · 키 ${codes.join(' + ')}` : '');
  } else { nm.classList.add('idle'); nm.textContent = '♪'; sub.textContent = ''; }
}
const siBeat = s => `${Math.floor(s / 16) + 1}마디 ${Math.floor(s % 16 / 4) + 1}박${s % 4 ? ' +' + (s % 4) + '/16' : ''}`;
function siInfo() {
  $('siPos').innerHTML = `<i></i>${siBeat(SI.cursor)}`;
  let end = 0; SI.notes.forEach(n => end = Math.max(end, n.s + n.l));
  const ex = siExportList(), exN = ex.reduce((a, st) => a + st.notes.length, 0);
  $('siSum').textContent = (SI.notes.length ? `보드: 노트 ${SI.notes.length}개 · ${Math.ceil(end / 16) || 1}마디 분량` : '보드가 비어 있어요')
    + (SI.steps.some(st => st.ex) ? ` · 내보낼 스텝 ${ex.length}개 (노트 ${exN}개)` : '');
  $('siExport').disabled = $('siExportB').disabled = !ex.length;
  $('siUndo').disabled = !SI.undo.length;
  const pl = SI.playing && SI.playIdx === SI.cur;
  $('siPlay').innerHTML = svg(pl ? 'stop' : 'play') + (pl ? '정지' : '재생'); $('siPlay').classList.toggle('on', pl);
  siSaveSteps();
  if ($('siCurInfo')) $('siCurInfo').textContent = SI.notes.length ? `${SI.notes.length}음` : '빈 스텝';
}
function siRefresh() { siShowNow(); siLights(); siInfo(); siDraw(); }

// ── 소리 · 입력 ──
function siPlayP(p) { AC(); const t = siTrack(); tone(p, ac.currentTime + 0.005, clamp(SI.len * stepSec(), 0.3, 1.6), t); }
function siNoteOn(code, p) {
  if (p < LOW || p > HIGH) { toast('이 옥타브에서는 낼 수 없는 음이에요'); return; }
  // 화음 = 지금 '동시에 누르고 있는' 키들. 키를 뗀 뒤 이어서 누른 음은 누적되지 않아요.
  if (!SI.held.size) SI.consumed = false;
  SI.relSnap = null;
  SI.held.set(code, p); SI.last = p;
  siSyncPending();
  siPlayP(p); siShowNow(); siLights(); siDraw();   // 보드에도 누르고 있는 음 표시
}
// 누르고 있는 키가 있으면 그 키들, 없으면 마지막으로 누른 음 하나
function siHeldPitches() { return [...new Set(SI.held.values())]; }
function siSyncPending() { SI.pending = siHeldPitches(); }
function siNoteOff(code) {
  if (!SI.held.has(code)) return;
  if (!SI.consumed && SI.relSnap == null) SI.relSnap = siHeldPitches();   // 떼기 시작한 순간 눌려 있던 키 = 화음 (바로 입력용)
  SI.held.delete(code);
  if (!SI.held.size) {
    const snap = SI.relSnap, was = SI.consumed;
    SI.relSnap = null; SI.consumed = false; siSyncPending(); siShowNow(); siLights(); siDraw();
    if (SI.auto && !was && snap && snap.length) siCommitNotes(snap);
    return;
  }
  siSyncPending(); siShowNow(); siLights(); siDraw();
}
function siPush() { const st0 = SI.steps[SI.cur]; if (st0) st0.mod = Date.now(); SI.undo.push(JSON.stringify({ n: SI.notes, c: SI.cursor })); if (SI.undo.length > 200) SI.undo.shift(); SI.redo = []; }
function siRestore(j) { const d = JSON.parse(j); SI.notes = d.n; SI.cursor = d.c; SI.sel = new Set(); siRefresh(); }
function siUndo() { if (!SI.undo.length) return; SI.redo.push(JSON.stringify({ n: SI.notes, c: SI.cursor })); siRestore(SI.undo.pop()); }
function siRedo() { if (!SI.redo.length) return; SI.undo.push(JSON.stringify({ n: SI.notes, c: SI.cursor })); siRestore(SI.redo.pop()); }
function siCommit() {   // Space: 누르고 있는 키 전체(화음)를 입력 · 아무 건반도 안 누르고 있으면 음 길이만큼 한 칸 앞으로(쉼표)
  const ps = siHeldPitches();
  if (!ps.length) return siRest();
  siCommitNotes(ps);
}
function siCommitNotes(ps) {
  if (!ps.length) return;
  siPush();
  const nn = ps.map(p => ({ p, s: SI.cursor, l: SI.len }));
  SI.notes.push(...nn); SI.sel = new Set(nn);
  SI.cursor += SI.len; SI.last = null; SI.relSnap = null;
  SI.consumed = SI.held.size > 0;   // 아직 누르고 있는 키를 뗄 때 '바로 입력'이 또 넣지 않게
  siSyncPending();
  siRefresh(); siScrollTo(SI.cursor);
}
function siRest() { siPush(); SI.cursor += SI.len; SI.sel = new Set(); siRefresh(); siScrollTo(SI.cursor); }
function siBackspace() {
  if (SI.sel.size) return siDelSel();
  if (!SI.notes.length) { if (SI.cursor) { siPush(); SI.cursor = Math.max(0, SI.cursor - SI.len); siRefresh(); } return; }
  siPush();
  const last = Math.max(...SI.notes.map(n => n.s));
  if (SI.cursor > last + Math.max(...SI.notes.filter(n => n.s === last).map(n => n.l))) { SI.cursor = Math.max(last, SI.cursor - SI.len); }   // 맨 뒤 쉼표부터 지움
  else { SI.notes = SI.notes.filter(n => n.s !== last); SI.cursor = last; }
  siRefresh(); siScrollTo(SI.cursor);
}
function siDelSel() { if (!SI.sel.size) return; siPush(); SI.notes = SI.notes.filter(n => !SI.sel.has(n)); SI.sel = new Set(); siRefresh(); }
function siOct(d) {
  const o = clamp(SI.oct + d, 0, 6); if (o === SI.oct) { toast(d < 0 ? '가장 낮은 옥타브예요' : '가장 높은 옥타브예요'); return; }
  SI.oct = o; SI.held.clear(); SI.relSnap = null; SI.consumed = false; siSyncPending(); siSaveCfg(); siBuildPiano(); siShowNow();
  toast(`옥타브 ${d > 0 ? '올림' : '내림'} · 아랫줄 Z = ${name(siBase())}`);
}
function siMoveSel(ds, dp, dl) {
  const arr = [...SI.sel]; if (!arr.length) return;
  if (arr.some(n => n.s + ds < 0 || n.p + dp < LOW || n.p + dp > HIGH || n.l + dl < 1)) return;
  siPush(); arr.forEach(n => { n.s += ds; n.p += dp; n.l += dl; });
  if (dp) siPlayP(arr[0].p);
  siRefresh();
}

// ── 임시 보드 (미니 피아노 롤) ──
const SI_SW = 14;
function siDraw() {
  const cv = $('siBoard'), wrap = $('siBoardWrap'); if (!cv || !stepM.classList.contains('show')) return;
  let end = SI.cursor; SI.notes.forEach(n => end = Math.max(end, n.s + n.l));
  const steps = Math.max(64, Math.ceil((end + 24) / 16) * 16, Math.ceil(wrap.clientWidth / SI_SW / 16) * 16), base = siBase();
  const ps = SI.notes.map(n => n.p).concat(SI.pending, [base + 3, base + 14]);
  const lo = Math.max(LOW, Math.min(...ps) - 2), hi = Math.min(HIGH, Math.max(...ps) + 2), rows = hi - lo + 1;
  const H = wrap.clientHeight, W = steps * SI_SW, rowH = H / rows, dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  SI.geo = { lo, hi, rowH, W, H };
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#101114'; c.fillRect(0, 0, W, H);
  for (let p = lo; p <= hi; p++) {
    const y = (hi - p) * rowH;
    if (siIsBlack(p)) { c.fillStyle = '#0b0c0e'; c.fillRect(0, y, W, rowH); }
    if (p % 12 === 0) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, y + rowH - 1, W, 1); }
  }
  for (let s = 0; s <= steps; s += S.grid) {
    c.fillStyle = s % 16 === 0 ? 'rgba(255,255,255,.2)' : s % 4 === 0 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.03)';
    c.fillRect(s * SI_SW, 0, 1, H);
    if (s % 16 === 0) { c.fillStyle = '#6b707a'; c.font = '10px system-ui'; c.fillText(String(s / 16 + 1), s * SI_SW + 3, 11); }
  }
  // 옥타브 표시 (도 줄)
  c.font = '9px system-ui'; c.fillStyle = '#4d525b';
  for (let p = lo; p <= hi; p++) if (p % 12 === 0) c.fillText(name(p), (wrap.scrollLeft || 0) + 3, (hi - p + 1) * rowH - 2);
  const col = (siTrack() || {}).color || '#f2c230';
  for (const n of SI.notes) {
    const x = n.s * SI_SW + 1, y = (hi - n.p) * rowH + 1, w = n.l * SI_SW - 2, h = Math.max(3, rowH - 2), on = SI.sel.has(n);
    c.fillStyle = col; c.globalAlpha = on ? 1 : 0.78; rr(c, x, y, w, h, 3); c.fill(); c.globalAlpha = 1;
    if (on) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; rr(c, x, y, w, h, 3); c.stroke(); }
    if (h >= 9 && w >= 22) { c.fillStyle = 'rgba(0,0,0,.75)'; c.font = `bold ${Math.min(10, h - 2)}px system-ui`; c.fillText(siPName(n.p), x + 3, y + h / 2 + 3.5); }
  }
  // 다음 입력 위치 + 대기 중인 음
  const cx = SI.cursor * SI_SW;
  c.fillStyle = 'rgba(242,194,48,.10)'; c.fillRect(cx, 0, SI.len * SI_SW, H);
  for (const p of SI.pending) {
    if (p < lo || p > hi) continue;
    const y = (hi - p) * rowH, h = Math.max(4, rowH - 1), w = Math.max(SI.len * SI_SW - 2, 10);
    c.fillStyle = 'rgba(242,194,48,.12)'; c.fillRect(0, y, W, rowH);   // 그 음 줄 전체를 옅게
    c.fillStyle = 'rgba(242,194,48,.55)'; rr(c, cx + 1, y + .5, w, h, 3); c.fill();
    c.strokeStyle = '#ffe48a'; c.lineWidth = 1.5; rr(c, cx + 1, y + .5, w, h, 3); c.stroke();
    c.fillStyle = '#ffe48a'; c.font = `bold ${clamp(rowH - 1, 9, 12)}px system-ui`; c.fillText(siPName(p), cx + w + 5, y + h / 2 + 4);   // 오른쪽에 음 이름
  }
  c.fillStyle = '#f2c230'; c.fillRect(cx - 1, 0, 2, H);
  if (SI.playing && SI.playHead != null) { c.fillStyle = '#fff'; c.fillRect(SI.playHead * SI_SW, 0, 1.5, H); }
  if (SI.box && SI.box.on) {   // 선택 도구: 끌어서 그리는 사각형
    const b = SI.box, x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1), w = Math.abs(b.x1 - b.x0), h = Math.abs(b.y1 - b.y0);
    c.fillStyle = 'rgba(242,194,48,.12)'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#f2c230'; c.lineWidth = 1; c.setLineDash([4, 3]); c.strokeRect(x + .5, y + .5, w, h); c.setLineDash([]);
  }
  siPadPos();
}
// ── 모바일: 선택한 노트 위에 뜨는 '옮기기' 버튼 → 누르면 ◀ ▲ ▼ ▶ 컨트롤러가 펼쳐져서 한 칸씩 옮겨요 ──
function siPadPos() {
  const pad = $('siSelPad'); if (!pad) return;
  const g = SI.geo, show = (siMobile() || SI.selTool) && SI.sel.size > 0 && !SI.drag && !(SI.box && SI.box.on) && g;
  if (!show) { pad.classList.remove('show', 'open'); pad.dataset.fixed = ''; if (!SI.sel.size) SI.padOpen = false; return; }
  pad.classList.add('show'); pad.classList.toggle('open', SI.padOpen);
  if (!SI.padOpen) pad.dataset.fixed = '';
  else if (pad.dataset.fixed) return;   // 펼친 동안은 자리를 고정 — 누르는 손가락 아래에서 버튼이 도망가지 않게
  else pad.dataset.fixed = '1';
  const arr = [...SI.sel], box = pad.parentNode.getBoundingClientRect(), cr = $('siBoard').getBoundingClientRect(), wr = $('siBoardWrap').getBoundingClientRect();
  const s0 = Math.min(...arr.map(n => n.s)), s1 = Math.max(...arr.map(n => n.s + n.l)), p0 = Math.min(...arr.map(n => n.p)), p1 = Math.max(...arr.map(n => n.p));
  const ox = cr.left - box.left, oy = cr.top - box.top;
  const L = ox + s0 * SI_SW, R = ox + s1 * SI_SW, T = oy + (g.hi - p1) * g.rowH, B = oy + (g.hi - p0 + 1) * g.rowH;
  const pw = pad.offsetWidth, ph = pad.offsetHeight, minX = wr.left - box.left + 4, maxX = wr.right - box.left - pw - 4, minY = wr.top - box.top + 4, maxY = wr.bottom - box.top - ph - 4;
  // 선택 영역을 가리지 않는 자리: 위 → 아래 → 오른쪽 → 왼쪽 (다 안 되면 위쪽에 겹쳐서)
  const cx = (L + R) / 2 - pw / 2, cy = (T + B) / 2 - ph / 2;
  const spots = [[cx, T - ph - 6, 'y'], [cx, B + 6, 'y'], [R + 6, cy, 'x'], [L - pw - 6, cy, 'x']];
  const fit = spots.find(([x, y, k]) => k === 'y' ? y >= minY && y <= maxY : x >= minX && x <= maxX) || [cx, minY];
  pad.style.left = clamp(fit[0], minX, Math.max(minX, maxX)) + 'px'; pad.style.top = clamp(fit[1], minY, Math.max(minY, maxY)) + 'px';
}
function siSelVisible() {   // 옮긴 노트가 화면 밖으로 나가면 보드를 따라 스크롤
  if (!SI.sel.size) return;
  const w = $('siBoardWrap'), arr = [...SI.sel], x0 = Math.min(...arr.map(n => n.s)) * SI_SW, x1 = Math.max(...arr.map(n => n.s + n.l)) * SI_SW;
  if (x0 < w.scrollLeft + 10) w.scrollLeft = Math.max(0, x0 - 40);
  else if (x1 > w.scrollLeft + w.clientWidth - 10) w.scrollLeft = x1 - w.clientWidth + 40;
}
function siSetSelTool(on) {
  SI.selTool = !!on; $('siSelTool').classList.toggle('on', SI.selTool); stepM.classList.toggle('siSelOn', SI.selTool);
  SI.box = null; SI.padOpen = false;
  if (!SI.selTool && SI.sel.size) SI.sel = new Set();
  siDraw();
  const mob = siMobile();
  toast(SI.selTool ? (mob ? '선택 도구 — 노트를 톡 눌러 고르고, 빈 곳을 끌면 여러 개를 골라요' : '선택 도구 — 빈 곳을 끌면 여러 개 선택 · Shift+클릭 = 더하기 · 노란 버튼으로 옮기기')
    : (mob ? '선택 도구를 껐어요 — 톡 = 칠하기 · 지우기' : '선택 도구를 껐어요'));
}
function siScrollTo(s) {
  const w = $('siBoardWrap'), x = s * SI_SW;
  if (x < w.scrollLeft + 30 || x > w.scrollLeft + w.clientWidth - 80) w.scrollLeft = Math.max(0, x - w.clientWidth * 0.6);
}
function siHit(x, y, fat) {
  const g = SI.geo; if (!g) return null;
  const p0 = g.hi - Math.floor(y / g.rowH), s = x / SI_SW;
  const ps = fat && g.rowH < 16 ? [p0, p0 + 1, p0 - 1] : [p0];   // 터치: 줄이 얇으면 위아래 한 줄까지 인정
  for (const p of ps) for (let i = SI.notes.length - 1; i >= 0; i--) { const n = SI.notes[i]; if (n.p === p && s >= n.s && s < n.s + n.l) return n; }
  return null;
}
function siBoardXY(e) { const r = $('siBoard').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
$('siBoard').addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  const [x, y] = siBoardXY(e), touch = e.pointerType === 'touch', n = siHit(x, y, touch);
  if (SI.selTool) {   // 선택 도구(PC·모바일): 노트 톡/클릭 = 고르기 · 빈 곳 끌기 = 사각형으로 여러 개 · 고른 노트 끌기 = 옮기기
    if (SI.box || SI.drag) return;   // 이미 다른 손가락이 쓰는 중
    const add = !touch && (e.shiftKey || e.ctrlKey || e.metaKey);
    SI.box = { id: e.pointerId, x0: x, y0: y, x1: x, y1: y, cx: e.clientX, cy: e.clientY, n, on: false, moved: false, touch, add, base: add ? new Set(SI.sel) : new Set() };
    $('siBoard').setPointerCapture(e.pointerId); return;
  }
  if (touch) {   // 터치(모바일): 빈 칸 톡 = 칠하기(노트) · 칠한 노트 톡 = 지우기 · 빈 곳을 밀면 스크롤 · 노트를 끌면 옮기기
    if (SI.pan) return;   // 이미 다른 손가락이 보드를 잡고 있음
    SI.pan = { id: e.pointerId, cx: e.clientX, cy: e.clientY, sl: $('siBoardWrap').scrollLeft, x, y, moved: false, n: siHit(x, y) };
    $('siBoard').setPointerCapture(e.pointerId); return;
  }
  if (!n) { SI.sel = new Set(); SI.cursor = Math.max(0, Math.floor(x / SI_SW / S.grid) * S.grid); siRefresh(); return; }
  if (e.shiftKey) { SI.sel.has(n) ? SI.sel.delete(n) : SI.sel.add(n); siRefresh(); return; }
  if (!SI.sel.has(n)) SI.sel = new Set([n]);
  siPlayP(n.p);
  SI.drag = { x0: x, y0: y, orig: new Map([...SI.sel].map(m => [m, { s: m.s, p: m.p }])), pushed: false, dp: 0 };
  $('siBoard').setPointerCapture(e.pointerId); siRefresh();
});
$('siBoard').addEventListener('pointermove', e => {
  if (SI.box && SI.box.id === e.pointerId && !SI.drag) {
    const b = SI.box, [x, y] = siBoardXY(e);
    if (!b.moved && Math.hypot(e.clientX - b.cx, e.clientY - b.cy) > 8) {
      b.moved = true;
      if (b.n) {   // 노트를 잡고 끌기 → (고른 노트들) 옮기기
        if (!SI.sel.has(b.n)) SI.sel = new Set([b.n]);
        siPlayP(b.n.p); SI.box = null;
        SI.drag = { x0: b.x0, y0: b.y0, orig: new Map([...SI.sel].map(m => [m, { s: m.s, p: m.p }])), pushed: false, dp: 0 };
      } else b.on = true;
    }
    if (SI.box && SI.box.on) {
      b.x1 = x; b.y1 = y;
      const w = $('siBoardWrap'), wr = w.getBoundingClientRect();   // 끝에 닿으면 보드를 밀어줘요
      if (e.clientX > wr.right - 28) w.scrollLeft += 10; else if (e.clientX < wr.left + 28) w.scrollLeft -= 10;
      const g = SI.geo, sA = Math.min(b.x0, b.x1) / SI_SW, sB = Math.max(b.x0, b.x1) / SI_SW;
      const pA = g.hi - Math.floor(Math.max(b.y0, b.y1) / g.rowH), pB = g.hi - Math.floor(Math.min(b.y0, b.y1) / g.rowH);
      SI.sel = new Set([...b.base, ...SI.notes.filter(n => n.p >= pA && n.p <= pB && n.s + n.l > sA && n.s < sB)]);
      siDraw(); return;
    }
    if (SI.box) return;
  }
  if (SI.pan && SI.pan.id === e.pointerId) {
    const pn = SI.pan, dx = e.clientX - pn.cx, dy = e.clientY - pn.cy;
    if (!pn.moved && Math.hypot(dx, dy) > 8) {
      pn.moved = true;
      if (pn.n) {   // 노트를 잡고 끌기 → 옮기기
        SI.pan = null; SI.sel = new Set([pn.n]); siPlayP(pn.n.p);
        SI.drag = { x0: pn.x, y0: pn.y, orig: new Map([[pn.n, { s: pn.n.s, p: pn.n.p }]]), pushed: false, dp: 0 };
      }
    }
    if (SI.pan && SI.pan.moved) { $('siBoardWrap').scrollLeft = SI.pan.sl - dx; return; }
    if (SI.pan) return;
  }
  const [x, y] = siBoardXY(e);
  if (!SI.drag) { $('siBoard').style.cursor = siHit(x, y) ? 'grab' : SI.selTool ? 'default' : 'crosshair'; return; }
  const d = SI.drag, g = SI.geo, sn = e.altKey ? 1 : S.grid;
  let ds = Math.round((x - d.x0) / SI_SW / sn) * sn, dp = Math.round(-(y - d.y0) / g.rowH);
  const o = [...d.orig.values()];
  ds = Math.max(ds, -Math.min(...o.map(v => v.s)));
  dp = clamp(dp, LOW - Math.min(...o.map(v => v.p)), HIGH - Math.max(...o.map(v => v.p)));
  if (!d.pushed && (ds || dp)) { siPush(); d.pushed = true; }
  d.orig.forEach((v, m) => { m.s = v.s + ds; m.p = v.p + dp; });
  if (dp !== d.dp) { d.dp = dp; siPlayP([...d.orig.keys()][0].p); }
  $('siBoard').style.cursor = 'grabbing'; siDraw();
});
// 모바일 톡: 빈 칸이면 그 줄(음) · 그 칸에 지금 음 길이만큼 노트를 칠하고, 칠한 노트면 지워요
function siTapToggle(x, y, n) {
  if (n && SI.notes.includes(n)) { siPush(); SI.notes = SI.notes.filter(m => m !== n); SI.sel = new Set(); siRefresh(); return; }
  const g = SI.geo; if (!g) return;
  const p = g.hi - Math.floor(y / g.rowH); if (p < LOW || p > HIGH || p < g.lo) return;
  const s = Math.max(0, Math.floor(x / SI_SW / S.grid) * S.grid);
  siPush(); SI.notes.push({ p, s, l: SI.len }); SI.sel = new Set();
  SI.cursor = s + SI.len;   // 다음 입력 위치는 칠한 노트 바로 뒤
  siPlayP(p); siRefresh();
}
const siDragEnd = e => {
  if (SI.box) {
    if (e && e.pointerId !== SI.box.id) return;
    const b = SI.box; SI.box = null;
    if (!b.moved && e && e.type === 'pointerup') {   // 톡: 노트면 고르기/빼기, 빈 곳이면 선택 풀기
      if (b.n && !b.touch && !b.add) { SI.sel = new Set([b.n]); siPlayP(b.n.p); }   // 마우스 클릭 = 그 노트만 (Shift/Ctrl+클릭 = 더하기·빼기)
      else if (b.n) { SI.sel.has(b.n) ? SI.sel.delete(b.n) : (SI.sel.add(b.n), siPlayP(b.n.p)); }   // 터치 = 톡 할 때마다 더하기·빼기
      else if (!b.add) SI.sel = new Set();
    }
    siRefresh(); return;
  }
  if (SI.pan) {
    if (e && e.pointerId !== SI.pan.id) return;   // 다른 손가락
    const pn = SI.pan; SI.pan = null; if (!pn.moved && e && e.type === 'pointerup') siTapToggle(pn.x, pn.y, pn.n); return;
  }
  if (SI.drag) { SI.drag = null; siRefresh(); }
};
$('siBoard').addEventListener('pointerup', siDragEnd);
$('siBoard').addEventListener('pointercancel', siDragEnd);
$('siBoard').addEventListener('contextmenu', e => {
  e.preventDefault(); const [x, y] = siBoardXY(e), n = siHit(x, y); if (!n) return;
  siPush(); SI.notes = SI.notes.filter(m => m !== n); SI.sel.delete(n); siRefresh();
});
$('siBoardWrap').addEventListener('scroll', () => siDraw());

// ── 건반 클릭 (마우스로도 연주 · 연주 키 설정) ──
$('siPiano').addEventListener('pointerdown', e => {
  const k = e.target.closest('.pk'); if (!k) return;
  const off = +k.dataset.off;
  if (SI.remap) { SI.wait = { type: 'note', off }; siRemapMsg(); siLights(); return; }
  e.preventDefault();
  const code = 'ptr' + e.pointerId;   // 손가락(포인터)마다 따로 — 여러 손가락 = 화음
  siNoteOn(code, siBase() + off);
  if (e.pointerType === 'touch' && SI.held.has(code) && navigator.vibrate) navigator.vibrate(6);
  const up = ev => {
    if (ev.pointerId !== e.pointerId) return;
    siNoteOff(code);
    window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
  };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
});
$('siPiano').addEventListener('contextmenu', e => e.preventDefault());
function siRemapMsg() {
  const w = SI.wait, m = $('siRemapMsg');
  if (!w) m.innerHTML = '바꿀 <b>건반</b>이나 <b>옥타브 −/+ 버튼</b>을 누른 뒤, 연결할 키보드 키를 누르세요.';
  else if (w.type === 'note') m.innerHTML = `<b>${name(siBase() + w.off)}</b>에 연결할 키를 누르세요 · <kbd>Backspace</kbd> = 연결 해제 · <kbd>Esc</kbd> = 취소`;
  else m.innerHTML = `<b>옥타브 ${w.type === 'octUp' ? '+' : '−'}</b>에 연결할 키를 누르세요 · <kbd>Esc</kbd> = 취소`;
}
function siSetRemap(on) {
  SI.remap = on; SI.wait = null;
  $('siRemapBtn').classList.toggle('on', on); $('siRemapBar').classList.toggle('show', on);
  if (on) { $('siKbPop').classList.add('show'); $('siKbBtn').classList.add('on'); }
  siRemapMsg(); siBuildPiano();
}
function siAssign(code) {
  const w = SI.wait; if (!w) return;
  for (const k in SI.map) if (SI.map[k] === code) delete SI.map[k];   // 같은 키가 다른 곳에 있으면 빼기
  if (SI.octDn === code && w.type !== 'octDn') SI.octDn = '';
  if (SI.octUp === code && w.type !== 'octUp') SI.octUp = '';
  if (w.type === 'note') SI.map[w.off] = code; else SI[w.type] = code;
  toast(`${siCodeLbl(code)} 키 → ${w.type === 'note' ? name(siBase() + w.off) : w.type === 'octUp' ? '옥타브 +' : '옥타브 −'}`);
  SI.wait = null; siSaveCfg(); siRemapMsg(); siBuildPiano();
}

// ── 미리 듣기 ──
function siStopPlay() { if (!SI.playing) return; SI.playing = false; SI.playIdx = -1; cancelAnimationFrame(SI.playT); SI.playHead = null; killVoices(); siInfo(); siDraw(); siRenderSteps(); }
function siPlayBoard(idx) {   // idx = 미리 들을 스텝 (없으면 지금 스텝)
  if (typeof idx !== 'number') idx = SI.cur;
  if (SI.playing) { const was = SI.playIdx; siStopPlay(); if (was === idx) return; }
  const notes = siStepNotes(idx);
  if (!notes.length) { toast(idx === SI.cur ? '보드가 비어 있어요' : `'${SI.steps[idx].name}' 스텝이 비어 있어요`); return; }
  AC(); if (mode !== 'idle') stop();
  const t = siTrack(), ss = stepSec(), t0 = ac.currentTime + 0.06;
  let end = 0; for (const n of notes) end = Math.max(end, n.s + n.l);
  const q = notes.slice().sort((a, b) => a.s - b.s); let qi = 0;   // 노트는 앞으로 1.5초 분량씩만 예약 (많아도 소리가 안 깨지게)
  SI.playing = true; SI.playIdx = idx; siInfo(); siRenderSteps();
  let mNext = 0; const mEnd = Math.ceil(end / 4) * 4;   // 메트로놈: 4분음표마다 (마디 첫 박은 높은 소리)
  const tick = () => {
    if (!SI.playing) return;
    while (qi < q.length && t0 + q[qi].s * ss < ac.currentTime + PUMP_AHEAD) { const n = q[qi++]; tone(n.p, t0 + n.s * ss, n.l * ss, t, 1, n); }
    while (mNext < mEnd && t0 + mNext * ss < ac.currentTime + 0.15) { const t = t0 + mNext * ss; if (SI.metro && t >= ac.currentTime - 0.01) click(t, mNext % 16 === 0); mNext += 4; }
    const ph = (ac.currentTime - t0) / ss;
    SI.playHead = SI.playIdx === SI.cur ? ph : null;
    if (ph > end + 2) { SI.playing = false; SI.playIdx = -1; SI.playHead = null; siInfo(); siDraw(); siRenderSteps(); return; }
    if (SI.playHead != null) siDraw(); SI.playT = requestAnimationFrame(tick);
  };
  tick();
}

// ── 열기 · 닫기 · 내보내기 ──
const siApplyAutoClass = () => stepM.classList.toggle('siAutoOn', !!SI.auto);
function openStepInput() {
  if (mode !== 'idle') stop();
  closeCtx(); endPaste();
  if (pendingRec) closePreview(false);
  const s = $('siTrack'), keep = +s.value; s.innerHTML = '';
  S.tracks.forEach(t => s.add(new Option(t.name + (isDrumTrack(t) ? ' (드럼)' : ''), t.id)));
  s.value = String(S.tracks.some(t => t.id === keep) && SI.notes.length ? keep : S.active);
  $('siAuto').checked = SI.auto;
  SI.held.clear(); SI.pending = []; SI.last = null; SI.relSnap = null; SI.consumed = false;
  stepM.classList.add('show');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  $('siMetro').classList.toggle('on', SI.metro); $('siSelTool').classList.toggle('on', SI.selTool); stepM.classList.toggle('siSelOn', SI.selTool);
  siApplyAutoClass(); siBuildLens(); siBuildPiano(); siRenderSteps(); siRefresh();
  siStash(); if (SI.steps.length > 1 || SI.steps.some(st => st.notes.length)) smOpenWin(true);
}
function closeStepInput() { smClose(); siStopPlay(); SI.box = null; SI.padOpen = false; if (SI.remap) siSetRemap(false); SI.held.clear(); stepM.classList.remove('show'); $('siKbPop').classList.remove('show'); $('siKbBtn').classList.remove('on'); $('siHelpPop').classList.remove('show'); $('siTip').classList.remove('show'); }
function siExport(at0, bundle) {   // bundle: 스텝 하나 = 한 묶음 (편집 화면에서 통째로 선택)
  const list = siExportList();
  if (!list.length) { toast('내보낼 노트가 없어요'); return; }
  const t = siTrack(); if (!t) return;
  const where = $('siWhere').value;
  let at = 0;
  if (typeof at0 === 'number') at = Math.max(0, Math.round(at0 / S.grid) * S.grid);
  else if (where === 'head') at = Math.max(0, Math.round(playhead / S.grid) * S.grid);
  else if (where === 'end') { S.notes.forEach(n => { if (n.t === t.id) at = Math.max(at, n.s + n.l); }); at = Math.ceil(at / S.grid) * S.grid; }
  pushUndo();
  const nn = []; let off = at;
  for (const st of list) {
    const g = bundle ? newGid() : null;
    for (const n of st.notes) nn.push({ p: n.p, s: off + n.s, l: n.l, t: t.id, ...(g ? { g, gn: st.name } : {}) });
    off += Math.max(S.grid, Math.ceil(siStepLen(st) / S.grid) * S.grid);   // 다음 스텝은 바로 뒤에 이어서
  }
  S.notes.push(...nn);
  ensureLength(Math.max(...nn.map(n => n.s + n.l)));
  if (S.active !== t.id) setActive(t.id);
  sel = new Set(nn); save();
  closeStepInput(); drawAll();
  const x = at * STEP_W; if (x < scroller.scrollLeft || x > scroller.scrollLeft + scroller.clientWidth - 60) scroller.scrollLeft = Math.max(0, x - 80);
  const what = list.length > 1 ? `스텝 ${list.length}개(노트 ${nn.length}개)` : `'${list[0].name}' 노트 ${nn.length}개`;
  toast(`'${t.name}' 트랙 ${siBeat(at)}부터 ${what}를 ${bundle ? '묶음으로' : '따로'} 넣었어요${bundle ? ' — 하나만 눌러도 통째로 선택돼요' : ''} (Ctrl+Z로 되돌리기)`);
}
$('siOctDn').onclick = () => { if (SI.remap) { SI.wait = { type: 'octDn' }; siRemapMsg(); } else siOct(-1); };
$('siOctUp').onclick = () => { if (SI.remap) { SI.wait = { type: 'octUp' }; siRemapMsg(); } else siOct(1); };
$('siAuto').onchange = e => { SI.auto = e.target.checked; siSaveCfg(); siApplyAutoClass(); siShowNow(); e.target.blur(); };
$('siRemapBtn').onclick = () => siSetRemap(!SI.remap);
$('siRemapDone').onclick = () => siSetRemap(false);
$('siRemapReset').onclick = () => { SI.map = Object.assign({}, SI_DEF_MAP); SI.octDn = 'Minus'; SI.octUp = 'Equal'; SI.wait = null; siSaveCfg(); siRemapMsg(); siBuildPiano(); toast('기본 키 배치로 돌렸어요'); };
$('siCommit').onclick = siCommit;
$('siRest').onclick = siRest;
const siCur = d => { SI.cursor = Math.max(0, SI.cursor + d * SI.len); siRefresh(); siScrollTo(SI.cursor); };
$('siCurL').onclick = () => siCur(-1);
$('siCurR').onclick = () => siCur(1);
// 건반을 누른 채(다른 손가락) 버튼을 누르면 브라우저가 click을 안 만들어 줄 때가 있어서, 터치는 닿는 순간 바로 실행
function siTouchBtn(id, fn) {
  const b = $(id); let last = 0;
  b.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    e.preventDefault(); last = Date.now(); b.classList.add('tap'); setTimeout(() => b.classList.remove('tap'), 120);
    fn();
  });
  b.addEventListener('click', e => { if (Date.now() - last < 700) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
siTouchBtn('siCommit', siCommit); siTouchBtn('siRest', siRest); siTouchBtn('siBack', siBackspace);
siTouchBtn('siCurL', () => siCur(-1)); siTouchBtn('siCurR', () => siCur(1));
$('siDelBtn').onclick = () => { if (!SI.sel.size) { toast('지울 노트를 먼저 눌러 선택하세요'); return; } siDelSel(); };
$('siBack').onclick = siBackspace;
$('siPlay').onclick = siPlayBoard;
$('siUndo').onclick = siUndo;
$('siClear').onclick = () => { if (!SI.notes.length && !SI.cursor) return; siPush(); SI.notes = []; SI.cursor = 0; SI.sel = new Set(); siRefresh(); toast('보드를 비웠어요 (Ctrl+Z로 되돌리기)'); };
$('siClose').onclick = closeStepInput;
$('siCancel').onclick = closeStepInput;
$('siExport').onclick = () => siMobile() ? siStartPlace(false) : siExport(null, false);
$('siExportB').onclick = () => siMobile() ? siStartPlace(true) : siExport(null, true);
$('siCurStep').onclick = () => smOpenWin();
$('smClose').onclick = smCancel;
$('stepMgr').addEventListener('pointerdown', e => { if (e.target.id === 'stepMgr') smCancel(); });
$('siCurName').onclick = () => smOpenWin();
document.querySelectorAll('#smSort [data-sort]').forEach(b => b.onclick = () => smSort(b.dataset.sort));
$('siSpread').onclick = () => siShiftGaps(1);
$('siSelTool').onclick = () => siSetSelTool(!SI.selTool);
$('siMetro').onclick = () => {
  SI.metro = !SI.metro; siSaveCfg(); $('siMetro').classList.toggle('on', SI.metro);
  if (SI.metro && !SI.playing) { AC(); click(ac.currentTime + 0.02, true); }
  toast(SI.metro ? '메트로놈 켬 — 재생할 때 박자 소리가 나요' : '메트로놈 끔');
};
// 옮기기 컨트롤러: 누르면 한 칸 · 꾹 누르고 있으면 계속
{
  const pad = $('siSelPad'); let rt = 0;
  const stopRep = () => { clearTimeout(rt); rt = 0; };
  // ◀ ▶ = 고른 노트의 음 길이만큼 (길이가 섞여 있으면 가장 짧은 음 길이) · ▲ ▼ = 반음
  const stepLen = () => { const ls = [...SI.sel].map(n => n.l); return ls.length ? Math.max(1, Math.min(...ls)) : S.grid; };
  const mv = d => { const L = stepLen(), [ds, dp] = { left: [-L, 0], right: [L, 0], up: [0, 1], down: [0, -1] }[d]; siMoveSel(ds, dp, 0); siSelVisible(); };
  $('sspFab').addEventListener('click', () => { SI.padOpen = true; siPadPos(); });
  $('sspClose').addEventListener('click', () => { SI.padOpen = false; siPadPos(); });
  $('sspDel').addEventListener('click', () => siDelSel());
  pad.querySelectorAll('[data-mv]').forEach(b => {
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); stopRep(); const d = b.dataset.mv; mv(d);
      const again = () => { mv(d); rt = setTimeout(again, 90); };
      rt = setTimeout(again, 380);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => b.addEventListener(n, stopRep));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  pad.addEventListener('pointerdown', e => e.stopPropagation());
}
$('siTight').onclick = () => siShiftGaps(-1);
// 옥타브 버튼: 모바일에서는 '넣을 위치' 자리(아래 줄)로 옮기고, 넓은 화면에서는 원래 위치(위)로
{
  const g = $('siOctGrp'), home = { p: g.parentNode, n: g.nextSibling };
  const place = () => { if (siMobile()) $('siWhere').closest('label').before(g); else if (g.parentNode !== home.p) home.p.insertBefore(g, home.n); };
  place(); window.addEventListener('resize', place);
}
// 모바일: 스텝 관련(지금 스텝 · 붙이기/띄우기 · 삭제 · 되돌리기 · 비우기 · 재생)을 위 헤더로 올려서 보드를 넓게
{
  const bar = stepM.querySelector('.siStepBar'), tools = stepM.querySelector('.siBoardHead'), top = stepM.querySelector('.siBoardTop');
  const head = stepM.querySelector('.mhead'), title = head.querySelector('.siTitle');
  const place = () => {
    if (siMobile()) { if (bar.parentNode !== head) { title.after(bar); $('siFs').before(tools); } }
    else if (bar.parentNode !== top) top.append(bar, tools);
  };
  place(); window.addEventListener('resize', place);
}
// 모바일 내보내기: 창을 잠깐 숨기고 재생 위치(▼)를 옮겨 넣을 곳을 고름
let placeT = 0, placePrevTool = null, placeDims = [], rulerEdgeX = null;
function placeLayoutDims() {
  const r = $('rulerWrap').getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
  const box = [[0, 0, W, r.top], [0, r.bottom, W, H - r.bottom], [0, r.top, r.left, r.height], [r.right, r.top, W - r.right, r.height]];
  placeDims.forEach((d, i) => { const [x, y, w, h] = box[i]; Object.assign(d.style, { left: x + 'px', top: y + 'px', width: Math.max(0, w) + 'px', height: Math.max(0, h) + 'px' }); });
}
function siStartPlace(bundle) {
  SI.exBundle = !!bundle;
  if (!siExportList().length) { toast('내보낼 노트가 없어요'); return; }
  siStopPlay(); SI.held.clear(); stepM.classList.remove('show');
  document.body.classList.add('placing');
  placeDims = [0, 1, 2, 3].map(() => { const d = document.createElement('div'); d.className = 'placeDim'; d.addEventListener('pointerdown', e => e.preventDefault()); document.body.appendChild(d); return d; });
  placeLayoutDims(); window.addEventListener('resize', placeLayoutDims);
  placePrevTool = S.tool; setTool('hand', true);   // 화면을 밀어 이동 가능 · 실수로 노트가 찍히지 않게
  const sync = () => {
    const st = Math.max(0, Math.round(playhead / S.grid) * S.grid); $('plPos').textContent = siBeat(st);
    if (rulerEdgeX != null) {   // 눈금자 끝으로 끌면 화면도 따라 이동
      const r = $('rulerWrap').getBoundingClientRect();
      if (rulerEdgeX < r.left + 40) scroller.scrollLeft -= 10; else if (rulerEdgeX > r.right - 40) { if (scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4) ensureLength((scroller.scrollLeft + scroller.clientWidth) / STEP_W + 16); scroller.scrollLeft += 10; }
      playhead = Math.max(0, Math.round((rulerEdgeX - r.left + scroller.scrollLeft) / STEP_W / S.grid) * S.grid); drawAll();
    }
  };
  sync(); clearInterval(placeT); placeT = setInterval(sync, 40);
  const x = playhead * STEP_W; if (x < scroller.scrollLeft + 20 || x > scroller.scrollLeft + scroller.clientWidth - 20) scroller.scrollLeft = Math.max(0, x - scroller.clientWidth / 2);
  drawAll();
}
function siEndPlace(back) {
  clearInterval(placeT); rulerEdgeX = null; document.body.classList.remove('placing');
  placeDims.forEach(d => d.remove()); placeDims = []; window.removeEventListener('resize', placeLayoutDims);
  if (placePrevTool) { setTool(placePrevTool, true); placePrevTool = null; }
  if (back) { stepM.classList.add('show'); siRefresh(); }
}
$('plCancel').onclick = () => siEndPlace(true);
$('plStart').onclick = () => { playhead = 0; scroller.scrollLeft = 0; drawAll(); };
$('plOk').onclick = () => { const at = playhead; siEndPlace(false); siExport(at, SI.exBundle); };
// 눈금자를 끌어서 재생 위치 이동 (터치)
{
  let rid = null; const rw = $('rulerWrap');
  const mv = e => { rulerEdgeX = e.clientX; const r = rw.getBoundingClientRect(); playhead = Math.max(0, Math.round((e.clientX - r.left + scroller.scrollLeft) / STEP_W / S.grid) * S.grid); drawAll(); };
  rw.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && mode === 'idle') { rid = e.pointerId; rulerEdgeX = e.clientX; try { rw.setPointerCapture(rid); } catch (_) {} } });
  rw.addEventListener('pointermove', e => { if (rid === e.pointerId && mode === 'idle') mv(e); });
  const up = e => { if (rid === e.pointerId) { rid = null; rulerEdgeX = null; } };
  rw.addEventListener('pointerup', up); rw.addEventListener('pointercancel', up);
}

// ── 팝오버: 키보드 배치 (클릭으로 열고 닫기) · 단축키 도움말 (마우스를 올리는 동안) ──
function siKbPop(on) {
  if (on == null) on = !$('siKbPop').classList.contains('show');
  $('siKbPop').classList.toggle('show', on); $('siKbBtn').classList.toggle('on', on);
  if (!on && SI.remap) siSetRemap(false);
}
$('siKbBtn').onclick = () => siKbPop();
$('siKbClose').onclick = () => siKbPop(false);
{
  const hb = $('siHelpBtn'), hp = $('siHelpPop'); let t = 0;
  const show = () => { clearTimeout(t); const r = hb.getBoundingClientRect(), c = stepM.querySelector('.scard').getBoundingClientRect(); hp.style.top = (r.bottom - c.top + 8) + 'px'; hp.style.right = Math.max(10, c.right - r.right - 6) + 'px'; hp.classList.add('show'); };
  const hide = () => { clearTimeout(t); t = setTimeout(() => hp.classList.remove('show'), 120); };
  hb.addEventListener('pointerenter', show); hb.addEventListener('pointerleave', hide);
  hp.addEventListener('pointerenter', () => clearTimeout(t)); hp.addEventListener('pointerleave', hide);
  hb.addEventListener('click', () => hp.classList.contains('show') ? hp.classList.remove('show') : show());
}
// ── 말풍선 툴팁: [data-tip] 위에 마우스를 잠깐 올리면 설명 + 단축키 ──
{
  const tip = $('siTip'); let tT = 0, cur = null;
  const hide = () => { clearTimeout(tT); cur = null; tip.classList.remove('show'); };
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t === cur) return;
    hide(); if (!t || !t.closest('#stepModal, #stepMgr')) return;
    cur = t;
    tT = setTimeout(() => {
      if (cur !== t || !document.contains(t)) return;
      tip.innerHTML = ''; tip.appendChild(el('span', null, t.dataset.tip));
      if (t.dataset.key) { const k = el('kbd', null, t.dataset.key); tip.appendChild(k); }
      tip.classList.add('show');
      const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8;
      if (y < 6) y = r.bottom + 8;
      tip.style.left = clamp(x, 6, innerWidth - w - 6) + 'px'; tip.style.top = y + 'px';
    }, 380);
  });
  ['pointerdown', 'keydown', 'wheel', 'scroll'].forEach(ev => window.addEventListener(ev, hide, true));
}
$('siTrack').onchange = e => { e.target.blur(); siDraw(); };
$('siWhere').onchange = e => e.target.blur();
stepM.querySelectorAll('button').forEach(b => b.addEventListener('mouseup', () => b.blur()));   // 버튼에 포커스가 남아 Enter/Space가 눌리지 않게
$('stepBtn').onclick = openStepInput;

// 창이 열린 동안 키보드를 독점 (캡처 단계에서 먼저 받아서 다른 단축키로 안 넘어가게)
window.addEventListener('keydown', e => {
  if (!stepM.classList.contains('show')) return;
  if ($('confirm').classList.contains('show')) return;   // 확인창이 떠 있으면 그 창이 키를 받게
  if (smOpen()) {   // 스텝 관리 창: 이름 입력 · Esc 닫기만
    e.stopImmediatePropagation();
    if (e.target.classList && e.target.classList.contains('sstIn')) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.target.dataset.cancel = '1'; e.target.blur(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); smCancel(); }
    return;
  }
  if (/^F\d+$/.test(e.code) && e.code !== 'F1') return;   // F5·F11·F12 같은 브라우저 키는 그대로
  e.stopImmediatePropagation();
  const tg = (e.target.tagName || '').toLowerCase();
  if (e.target.classList && e.target.classList.contains('sstIn')) {   // 스텝 이름 바꾸는 중: 글자는 그대로 입력
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.target.dataset.cancel = '1'; e.target.blur(); }
    return;
  }
  if (tg === 'select' && /^(Arrow|Enter|Space|Home|End|Page)/.test(e.code)) return;   // 목록 고르는 중
  e.preventDefault();
  const code = e.code, mod = e.ctrlKey || e.metaKey;
  // 연주 키 설정: 다음 키를 연결
  if (SI.remap && SI.wait) {
    if (code === 'Escape') { SI.wait = null; siRemapMsg(); siLights(); return; }
    if ((code === 'Backspace' || code === 'Delete') && SI.wait.type === 'note') { delete SI.map[SI.wait.off]; SI.wait = null; siSaveCfg(); siRemapMsg(); siBuildPiano(); return; }
    if (SI_RESERVED.test(code) || mod) { toast('그 키는 기능 키라서 연결할 수 없어요'); return; }
    siAssign(code); return;
  }
  if (mod) {
    const k = code;
    if (k === 'Enter' || k === 'NumpadEnter') siExport(null, e.shiftKey);
    else if (k === 'BracketLeft') siShiftGaps(-1);
    else if (k === 'BracketRight') siShiftGaps(1);
    else if (k === 'KeyZ') e.shiftKey ? siRedo() : siUndo();
    else if (k === 'KeyY') siRedo();
    else if (k === 'KeyA') { SI.sel = new Set(SI.notes); siRefresh(); }
    return;
  }
  // 연주 키
  const off = siCodeToOff(code);
  if (off != null) { if (!e.repeat && !e.altKey) { siNoteOn(code, siBase() + off); } return; }
  if (code === SI.octDn || code === 'NumpadSubtract') { if (!e.repeat) { siOct(-1); siFlash(code); } return; }
  if (code === SI.octUp || code === 'NumpadAdd') { if (!e.repeat) { siOct(1); siFlash(code); } return; }
  if (e.repeat && !/^(Arrow|Backspace)/.test(code)) return;
  siFlash(code);
  switch (code) {
    case 'Space': e.shiftKey ? siRest() : siCommit(); break;
    case 'Enter': case 'NumpadEnter': siPlayBoard(); break;
    case 'Backspace': siBackspace(); break;
    case 'Delete': siDelSel(); break;
    case 'Semicolon': { const i = SI_LENS.findIndex(l => l[0] === SI.len); siSetLen(SI_LENS[Math.max(0, i - 1)][0]); break; }
    case 'Quote': { const i = SI_LENS.findIndex(l => l[0] === SI.len); siSetLen(SI_LENS[Math.min(SI_LENS.length - 1, i + 1)][0]); break; }
    case 'Escape':
      if (SI.playing) siStopPlay();
      else if (SI.remap) siSetRemap(false);
      else if ($('siKbPop').classList.contains('show')) siKbPop(false);
      else if (SI.sel.size) { SI.sel = new Set(); siRefresh(); }
      else closeStepInput();
      break;
    case 'ArrowLeft': case 'ArrowRight': {   // ←→ = 입력 위치를 지금 음 길이만큼 이동 · Shift = 선택 노트 이동 · Alt = 선택 노트 길이
      const dir = code === 'ArrowLeft' ? -1 : 1;
      if (SI.sel.size && e.altKey) siMoveSel(0, 0, dir * S.grid);
      else if (SI.sel.size && e.shiftKey) siMoveSel(dir * S.grid, 0, 0);
      else { SI.cursor = Math.max(0, SI.cursor + dir * SI.len); siRefresh(); siScrollTo(SI.cursor); }
      break;
    }
    case 'ArrowUp': case 'ArrowDown': {
      const d = (code === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 12 : 1);
      if (SI.sel.size) siMoveSel(0, d, 0); else siOct(d > 0 ? 1 : -1);
      break;
    }
  }
}, true);
window.addEventListener('keyup', e => {
  if (!stepM.classList.contains('show')) return;
  e.stopImmediatePropagation();
  if (e.target.classList && e.target.classList.contains('sstIn')) return;
  e.preventDefault();
  siNoteOff(e.code);
}, true);
window.addEventListener('blur', () => { if (stepM.classList.contains('show')) { SI.held.clear(); SI.relSnap = null; SI.consumed = false; siSyncPending(); siShowNow(); siLights(); } });
window.addEventListener('resize', () => { if (!stepM.classList.contains('show')) return; if (siSpan() !== SI.span) siBuildPiano(); siShowNow(); siDraw(); });

// ───────── 사운드 편집기 (인스펙터 · 트랙 창 공용) ─────────
const F = {
  pct: v => Math.round(v * 100) + '%', sec: v => v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's',
  num: v => (+v).toFixed(2), x: v => '×' + (+v).toFixed(2), cents: v => Math.round(v) + '¢', hz: v => (+v).toFixed(1) + 'Hz',
  st: v => (v > 0 ? '+' : '') + Math.round(v), oct: v => (v > 0 ? '+' : '') + v + '옥', pan: v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100),
};
const WAVES = [['harm','배음 합성'],['sine','사인 (맑음)'],['triangle','삼각 (부드러움)'],['sawtooth','톱니 (밝음)'],['square','사각 (속빈 소리)']];
const SYNTH_GROUPS = [
  ['음색', [
    { k: 'wave', label: '파형', type: 'select', opts: WAVES },
    { k: 'oct', label: '옥타브', min: -2, max: 2, step: 1, fmt: F.oct },
    { k: 'mix2', label: '레이어', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'wave2', label: '레이어 파형', type: 'select', opts: WAVES.slice(1) },
    { k: 'ratio2', label: '레이어 음정', min: .5, max: 6, step: .01, fmt: F.x },
    { k: 'det2', label: '디튠', min: 0, max: 30, step: 1, fmt: F.cents },
    { k: 'fm', label: '금속성 (FM)', min: 0, max: 8, step: .05, fmt: F.num },
    { k: 'fmRatio', label: 'FM 비율', min: .5, max: 8, step: .01, fmt: F.x },
    { k: 'fmDec', label: 'FM 감쇠', min: .02, max: 3, step: .01, fmt: F.sec },
  ]],
  ['엔벨로프', [
    { k: 'a', label: '어택', min: .001, max: 1.5, step: .001, fmt: F.sec },
    { k: 'd', label: '디케이', min: .02, max: 5, step: .01, fmt: F.sec },
    { k: 's', label: '서스테인', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'r', label: '릴리즈', min: .02, max: 3, step: .01, fmt: F.sec },
    { k: 'keytrack', label: '낮은음 여운', min: 0, max: 1, step: .01, fmt: F.pct },
  ]],
  ['필터', [
    { k: 'cut', label: '밝기', min: .5, max: 16, step: .1, fmt: F.x },
    { k: 'res', label: '공명', min: .1, max: 12, step: .1, fmt: F.num },
    { k: 'fenv', label: '어택 밝기', min: 0, max: 8, step: .1, fmt: F.num },
    { k: 'fdec', label: '밝기 감쇠', min: .01, max: 2, step: .01, fmt: F.sec },
  ]],
  ['표현', [
    { k: 'vib', label: '비브라토', min: 0, max: 60, step: 1, fmt: F.cents },
    { k: 'vibRate', label: '비브라토 속도', min: 1, max: 10, step: .1, fmt: F.hz },
    { k: 'vibDelay', label: '비브라토 지연', min: 0, max: 1, step: .01, fmt: F.sec },
    { k: 'trem', label: '트레몰로', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'tremRate', label: '트레몰로 속도', min: 1, max: 25, step: .1, fmt: F.hz },
    { k: 'noise', label: '숨소리·노이즈', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'formant', label: '보컬 느낌', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'bend', label: '피치 벤드', min: -24, max: 24, step: 1, fmt: F.st },
  ]],
];
const VOCAL_GROUPS = [
  ['목소리', [
    { k: 'vSex', label: '음색 (낮게↔어리게)', min: .7, max: 1.25, step: .01, fmt: v => v < .95 ? '낮게 ' + F.x(v) : v > 1.05 ? '어리게 ' + F.x(v) : '기본' },
    { k: 'vTense', label: '힘 (부드럽게↔또렷하게)', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'vBreath', label: '숨소리', min: 0, max: 1, step: .01, fmt: F.pct },
    { k: 'vCons', label: '자음 또렷함', min: .4, max: 1.6, step: .01, fmt: F.x },
    { k: 'vRobot', label: '기계음 (사람↔디지털)', min: 0, max: 1, step: .01, fmt: F.pct },
  ]],
  ['노래 표현', [
    { k: 'vPorta', label: '음 이동 (꺾기)', min: 0, max: 2.5, step: .01, fmt: F.x },
    { k: 'vib', label: '비브라토', min: 0, max: 80, step: 1, fmt: F.cents },
    { k: 'vibRate', label: '비브라토 속도', min: 3, max: 8, step: .1, fmt: F.hz },
    { k: 'vibDelay', label: '비브라토 시작', min: 0, max: 1, step: .01, fmt: F.sec },
  ]],
];
const DRUM_GROUPS = [['드럼 키트', [
  { k: 'tune', label: '튜닝', min: -12, max: 12, step: 1, fmt: F.st },
  { k: 'dlen', label: '울림 길이', min: .3, max: 2.5, step: .01, fmt: F.x },
]]];
function sliderRow(parent, label, get, set, min, max, step, fmt, onCommit) {
  const row = el('div', 'prow'), lab = el('span', 'plab', label), inp = document.createElement('input'), val = el('span', 'pval', fmt(get()));
  inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get();
  inp.addEventListener('input', () => { set(+inp.value); val.textContent = fmt(+inp.value); });
  inp.addEventListener('change', () => onCommit && onCommit());
  lab.title = label; row.append(lab, inp, val); parent.appendChild(row);
}
function selectRow(parent, label, opts, get, set, onCommit) {
  const row = el('div', 'prow'), lab = el('span', 'plab', label), s = document.createElement('select');
  opts.forEach(([v, l]) => s.add(new Option(l, v))); s.value = get(); s.style.gridColumn = '2/4';
  s.addEventListener('change', () => { set(s.value); onCommit && onCommit(); s.blur(); });
  row.append(lab, s); parent.appendChild(row);
}
// t: 트랙(또는 초안), onEdit: 값이 바뀔 때, onCommit: 손을 뗐을 때(미리 듣기)
// 접이식 섹션: 기본은 접힘, 펼친 섹션은 기억
const openSecs = new Set(S.openSecs || []);
function makeFold(secEl, key, summary) {
  const h = secEl.querySelector('.secT'), title = h.firstChild;
  const chev = el('span', 'chev'); chev.innerHTML = svg('chev'); chev.appendChild(title.nodeType === 3 ? el('span', null, title.textContent) : title);
  if (title.parentNode === h) title.remove();
  h.insertBefore(chev, h.firstChild);
  if (summary != null) { const sm = el('span', 'sum', summary); h.insertBefore(sm, chev.nextSibling); }
  secEl.classList.add('fold'); secEl.classList.toggle('open', openSecs.has(key));
  h.onclick = e => {
    if (e.target.closest('button,select,input')) return;
    const open = !secEl.classList.contains('open'); secEl.classList.toggle('open', open);
    open ? openSecs.add(key) : openSecs.delete(key); S.openSecs = [...openSecs]; saveSoon();
  };
}
// ───────── 사운드 시각화 ─────────
function prepCv(cv) {
  const w = cv.clientWidth || 260, h = cv.clientHeight || 100, r = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); }
  const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0);
  c.fillStyle = '#0d0e11'; c.fillRect(0, 0, w, h);
  return { c, w, h };
}
const ACC = '#f2c230', GRIDC = '#1f2126', TXT = '#7d828c';
function label(c, s, x, y, col = TXT, align = 'left') { c.fillStyle = col; c.font = '10px ui-monospace, Menlo, monospace'; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); c.textAlign = 'left'; }
function baseWave(type, harm, ph) {
  const s = Math.sin(ph);
  switch (type) {
    case 'sine': return s;
    case 'triangle': return 2 / Math.PI * Math.asin(s);
    case 'sawtooth': { const f = ph / (2 * Math.PI); return 2 * (f - Math.floor(f + 0.5)); }
    case 'square': return s >= 0 ? 1 : -1;
    case 'harm': { const h = harm || [1, .5, .33, .25]; let v = 0, n = 0; h.forEach((a, k) => { v += a * Math.sin((k + 1) * ph); n += Math.abs(a); }); return v / (n || 1) * 1.6; }
  }
  return s;
}
function drawWave(cv, P) {
  const { c, w, h } = prepCv(cv), top = h - 30;
  const cyc = 2, N = 360, ys = new Float32Array(N); let mx = 1e-6;
  for (let i = 0; i < N; i++) {
    const ph = i / N * cyc * 2 * Math.PI, ph1 = ph + P.fm * 0.55 * Math.sin(P.fmRatio * ph);
    let y = P.tone * baseWave(P.wave, P.harm, ph1) + P.mix2 * baseWave(P.wave2, null, P.ratio2 * ph1 * Math.pow(2, P.det2 / 1200));
    if (P.noise) y += (Math.sin(i * 12.9898) * 43758.5453 % 1) * P.noise * 0.7;
    ys[i] = y; mx = Math.max(mx, Math.abs(y));
  }
  c.strokeStyle = GRIDC; c.lineWidth = 1; c.beginPath(); c.moveTo(0, top / 2 + .5); c.lineTo(w, top / 2 + .5); c.stroke();
  for (let k = 1; k < cyc; k++) { c.beginPath(); c.moveTo(w * k / cyc + .5, 0); c.lineTo(w * k / cyc + .5, top); c.stroke(); }
  c.strokeStyle = ACC; c.lineWidth = 1.8; c.beginPath();
  for (let i = 0; i < N; i++) { const x = i / (N - 1) * w, y = top / 2 - ys[i] / mx * (top / 2 - 8); i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  // 배음 막대 (DFT)
  const H = 16, bw = (w - 16) / H, mags = [];
  for (let k = 1; k <= H; k++) { let re = 0, im = 0; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * k * cyc * i / N; re += ys[i] * Math.cos(a); im -= ys[i] * Math.sin(a); } mags.push(Math.hypot(re, im)); }
  const mm = Math.max(...mags) || 1;
  mags.forEach((m, k) => { const bh = Math.max(1, m / mm * 20); c.fillStyle = k ? 'rgba(242,194,48,.55)' : ACC; c.fillRect(8 + k * bw + 1, h - 4 - bh, bw - 2, bh); });
  label(c, '파형 2주기', 6, 12); label(c, '배음', w - 6, top + 10, TXT, 'right');
}
function envLevel(P, t, rel) {
  const A = Math.max(0.001, P.a), D = Math.max(0.01, P.d), S = clamp(P.s, 0, 1), R = Math.max(0.02, P.r);
  if (t < A) return t / A;
  const atRel = S + (1 - S) * Math.exp(-(Math.min(t, rel) - A) / (D / 3));
  if (t <= rel) return atRel;
  return atRel * Math.exp(-(t - rel) / (R / 3));
}
function drawEnv(cv, P) {
  const { c, w, h } = prepCv(cv), pad = 8, A = Math.max(0.001, P.a), D = Math.max(0.01, P.d), R = Math.max(0.02, P.r);
  const rel = A + Math.min(D * 1.2, 2.5) + 0.4, T = rel + Math.min(R * 1.8, 3);
  const X = t => pad + t / T * (w - pad * 2), Y = v => h - 16 - v * (h - 32);
  c.strokeStyle = GRIDC; [0, .5, 1].forEach(v => { c.beginPath(); c.moveTo(pad, Y(v) + .5); c.lineTo(w - pad, Y(v) + .5); c.stroke(); });
  const g = c.createLinearGradient(0, Y(1), 0, Y(0)); g.addColorStop(0, 'rgba(242,194,48,.35)'); g.addColorStop(1, 'rgba(242,194,48,.02)');
  c.beginPath(); c.moveTo(X(0), Y(0));
  for (let i = 0; i <= 200; i++) { const t = i / 200 * T; c.lineTo(X(t), Y(envLevel(P, t, rel))); }
  c.lineTo(X(T), Y(0)); c.closePath(); c.fillStyle = g; c.fill();
  c.strokeStyle = ACC; c.lineWidth = 1.8; c.beginPath();
  for (let i = 0; i <= 200; i++) { const t = i / 200 * T; const x = X(t), y = Y(envLevel(P, t, rel)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  c.setLineDash([3, 3]); c.strokeStyle = '#3a3d45';
  [A, rel].forEach(t => { c.beginPath(); c.moveTo(X(t) + .5, 8); c.lineTo(X(t) + .5, h - 14); c.stroke(); }); c.setLineDash([]);
  label(c, 'A', X(A / 2) - 3, h - 4, ACC); label(c, 'D·S', X((A + rel) / 2) - 8, h - 4, ACC); label(c, 'R', X((rel + T) / 2) - 3, h - 4, ACC);
  label(c, '노트 끝', X(rel) + 3, 12); label(c, `${T.toFixed(1)}s`, w - 6, 12, TXT, 'right');
}
function drawFilter(cv, P) {
  const { c, w, h } = prepCv(cv), f0 = 40, f1 = 16000, base = 261.6;
  const X = f => 8 + Math.log(f / f0) / Math.log(f1 / f0) * (w - 16), Y = db => 10 + (18 - db) / 54 * (h - 24);
  c.strokeStyle = GRIDC; [100, 1000, 10000].forEach(f => { c.beginPath(); c.moveTo(X(f) + .5, 6); c.lineTo(X(f) + .5, h - 14); c.stroke(); });
  c.beginPath(); c.moveTo(8, Y(0) + .5); c.lineTo(w - 8, Y(0) + .5); c.stroke();
  const q = Math.pow(10, P.res / 20);
  const curve = (fc, col, dash) => {
    c.strokeStyle = col; c.lineWidth = dash ? 1.2 : 1.8; c.setLineDash(dash ? [4, 3] : []); c.beginPath();
    for (let i = 0; i <= 160; i++) { const f = f0 * Math.pow(f1 / f0, i / 160), r = f / fc, db = -10 * Math.log10((1 - r * r) ** 2 + (r / q) ** 2); const y = Y(clamp(db, -36, 18)); i ? c.lineTo(X(f), y) : c.moveTo(X(f), y); }
    c.stroke(); c.setLineDash([]);
  };
  const fc = Math.min(18000, base * P.cut);
  if (P.fenv > 0) curve(Math.min(18000, fc * (1 + P.fenv)), 'rgba(242,194,48,.5)', true);
  curve(fc, ACC, false);
  label(c, '100', X(100) + 2, h - 3); label(c, '1k', X(1000) + 2, h - 3); label(c, '10k', X(10000) + 2, h - 3);
  label(c, `차단 ≈ ${fc >= 1000 ? (fc / 1000).toFixed(1) + 'k' : Math.round(fc)}Hz (도4 기준)`, 8, 12);
  if (P.fenv > 0) label(c, '점선 = 치는 순간', w - 8, 12, ACC, 'right');
}
function drawExpr(cv, P) {
  const { c, w, h } = prepCv(cv), T = 2, X = t => 8 + t / T * (w - 16), mid1 = h * 0.3, mid2 = h * 0.72;
  c.strokeStyle = GRIDC; [mid1, mid2].forEach(y => { c.beginPath(); c.moveTo(8, y + .5); c.lineTo(w - 8, y + .5); c.stroke(); });
  c.strokeStyle = ACC; c.lineWidth = 1.6; c.beginPath();
  const vmax = Math.max(30, P.vib, Math.abs(P.bend) * 100 > 0 ? 60 : 0);
  for (let i = 0; i <= 300; i++) {
    const t = i / 300 * T, ramp = clamp((t - P.vibDelay) / 0.25, 0, 1);
    let cents = P.vib * ramp * Math.sin(2 * Math.PI * P.vibRate * t) + P.bend * 100 * Math.exp(-t / 0.06);
    const y = mid1 - clamp(cents / vmax, -1.3, 1.3) * (h * 0.2); i ? c.lineTo(X(t), y) : c.moveTo(X(t), y);
  }
  c.stroke();
  c.strokeStyle = '#8ae6c6'; c.beginPath();
  for (let i = 0; i <= 300; i++) { const t = i / 300 * T, a = 1 - P.trem / 2 + P.trem / 2 * Math.sin(2 * Math.PI * P.tremRate * t); const y = mid2 + h * 0.16 - a * h * 0.3; i ? c.lineTo(X(t), y) : c.moveTo(X(t), y); }
  c.stroke();
  label(c, `음높이 ${P.vib ? `비브라토 ±${Math.round(P.vib)}¢` : '흔들림 없음'}${P.bend ? ` · 벤드 ${P.bend > 0 ? '+' : ''}${P.bend}` : ''}`, 8, 12);
  label(c, `음량 ${P.trem ? `트레몰로 ${Math.round(P.trem * 100)}%` : '일정'}`, 8, h * 0.52 + 4, '#8ae6c6');
  const tags = []; if (P.noise) tags.push(`숨소리 ${Math.round(P.noise * 100)}%`); if (P.formant) tags.push(`보컬 ${Math.round(P.formant * 100)}%`);
  if (tags.length) label(c, tags.join(' · '), w - 8, h - 4, TXT, 'right');
  label(c, '2초', w - 8, 12, TXT, 'right');
}
function drawMix(cv, t) {
  const { c, w, h } = prepCv(cv), P = t.snd;
  // 볼륨 게이지
  const gx = 14, gh = h - 30, vy = 10 + gh - Math.min(1, t.vol / 1.5) * gh;
  c.fillStyle = '#1b1d22'; c.fillRect(gx, 10, 10, gh); c.fillStyle = ACC; c.fillRect(gx, vy, 10, 10 + gh - vy);
  label(c, '볼륨', gx - 4, h - 6); 
  // 팬
  const px0 = 60, px1 = w * 0.58, py = h / 2 - 4, px = px0 + (P.pan + 1) / 2 * (px1 - px0);
  c.strokeStyle = '#2a2d34'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(px0, py); c.lineTo(px1, py); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = '#3a3d45'; c.fillRect((px0 + px1) / 2 - 1, py - 8, 2, 16);
  c.fillStyle = ACC; c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2); c.fill();
  label(c, 'L', px0 - 4, py + 22); label(c, 'R', px1 - 4, py + 22); label(c, `팬 ${F.pan(P.pan)}`, (px0 + px1) / 2, h - 6, TXT, 'center');
  // 리버브 꼬리
  const rx0 = w * 0.66, rx1 = w - 10, n = 14;
  for (let i = 0; i < n; i++) {
    const a = Math.exp(-i / (n * (0.15 + P.rev))), bh = (h - 34) * a * (i ? P.rev * 0.9 + 0.08 : 1);
    c.fillStyle = i ? `rgba(138,230,198,${0.25 + 0.6 * a})` : ACC;
    c.fillRect(rx0 + i * (rx1 - rx0) / n, h - 20 - bh, (rx1 - rx0) / n - 2, bh);
  }
  label(c, `리버브 ${Math.round(P.rev * 100)}%`, rx0, h - 6);
}
function drawKit(cv, P) {
  const { c, w, h } = prepCv(cv), tune = Math.pow(2, (P.tune || 0) / 12), dl = P.dlen || 1, T = 1.2 * Math.max(1, dl);
  const X = t => 8 + t / T * (w - 16);
  c.strokeStyle = GRIDC; c.beginPath(); c.moveTo(8, h - 16.5); c.lineTo(w - 8, h - 16.5); c.stroke();
  const env = (dec, col, sc) => { c.strokeStyle = col; c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200 * T, v = Math.exp(-t / (dec * dl / 4)); const y = h - 16 - v * sc * (h - 34); i ? c.lineTo(X(t), y) : c.moveTo(X(t), y); } c.stroke(); };
  env(0.38, ACC, 1); env(0.2, '#8ae6c6', 0.75); env(1.5, 'rgba(184,178,166,.7)', 0.45);
  label(c, `킥 ${Math.round(150 * tune)}→${Math.round(45 * tune)}Hz`, 8, 12, ACC); label(c, '스네어', 8, 24, '#8ae6c6'); label(c, '심벌', 8, 36, '#b8b2a6');
  label(c, `울림 ×${dl.toFixed(2)}`, w - 8, 12, TXT, 'right');
}

// ───────── 사운드 편집기 (블록 탭 · 시각화) ─────────
// tabsMode: 인스펙터 — 위쪽 블록을 눌러 항목을 하나씩 / 아니면 전부 펼쳐 보여줌(트랙 창)
function buildEditor(container, t, onEdit, onCommit, onReset, tabsMode = false) {
  const instSec = $('instSec');
  if (instSec && container.contains(instSec)) $('inspBody').insertBefore(instSec, container);
  container.innerHTML = '';
  const drum = isDrumTrack(t);
  const waveShort = { harm: '배음', sine: '사인', triangle: '삼각', sawtooth: '톱니', square: '사각' };
  const G2 = [];
  if (tabsMode) G2.push({ id: 'inst', icon: INSTS[t.inst].icon, title: '악기', sum: () => INSTS[t.inst].label, build: s => { instSec.style.display = ''; s.appendChild(instSec); } });
  G2.push({ id: 'mix', icon: 'sliders', title: '믹서', sum: () => `${F.pct(t.vol)} · ${F.pan(t.snd.pan)}`, viz: cv => drawMix(cv, t),
    build: (s, ed) => {
      sliderRow(s, '볼륨', () => t.vol, v => { t.vol = v; ed(); }, 0, 1.5, .01, F.pct, onCommit);
      sliderRow(s, '팬', () => t.snd.pan, v => { t.snd.pan = v; ed(); }, -1, 1, .01, F.pan, onCommit);
      sliderRow(s, '리버브', () => t.snd.rev, v => { t.snd.rev = v; ed(); }, 0, 1, .01, F.pct, onCommit);
    } });
  const vocal = isVocalTrack(t);
  if (vocal) G2.push({ id: 'lyric', icon: 'mic', title: '가사', sum: () => { const ns = S.notes.filter(n => n.t === t.id); return `${ns.filter(n => n.ly).length}/${ns.length}`; }, build: s => buildLyricPanel(s, t) });
  const groupDefs = drum ? [['kit', 'drum', DRUM_GROUPS[0], () => `튜닝 ${F.st(t.snd.tune || 0)}`, cv => drawKit(cv, t.snd)]]
    : vocal ? [['voice', 'choir', VOCAL_GROUPS[0], () => (t.snd.vSex ?? 1) < .95 ? '낮은 목소리' : (t.snd.vSex ?? 1) > 1.05 ? '어린 목소리' : '기본 목소리'],
               ['vexpr', 'vibrato', VOCAL_GROUPS[1], () => `비브 ${Math.round(t.snd.vib || 0)}¢`]]
    : [['tone', 'wave', SYNTH_GROUPS[0], () => waveShort[t.snd.wave] + (t.snd.fm > 0 ? ' · FM' : '') + (t.snd.mix2 > 0 ? ' · 레이어' : ''), cv => drawWave(cv, t.snd)],
       ['env', 'env', SYNTH_GROUPS[1], () => `A ${F.sec(t.snd.a)} · R ${F.sec(t.snd.r)}`, cv => drawEnv(cv, t.snd)],
       ['filt', 'filter', SYNTH_GROUPS[2], () => `밝기 ${F.x(t.snd.cut)}`, cv => drawFilter(cv, t.snd)],
       ['expr', 'vibrato', SYNTH_GROUPS[3], () => t.snd.vib > 0 ? `비브 ${Math.round(t.snd.vib)}¢` : t.snd.trem > 0 ? '트레몰로' : '기본', cv => drawExpr(cv, t.snd)]];
  groupDefs.forEach(([id, icon, [title, list], sum, viz], gi) => G2.push({ id, icon, title, sum, viz, reset: gi === 0,
    build: (s, ed) => { for (const d of list) {
      if (d.type === 'select') selectRow(s, d.label, d.opts, () => t.snd[d.k], v => { t.snd[d.k] = v; ed(); }, onCommit);
      else sliderRow(s, d.label, () => t.snd[d.k], v => { t.snd[d.k] = v; ed(); }, d.min, d.max, d.step, d.fmt, onCommit);
    } } }));
  if (instSec && tabsMode) instSec.style.display = 'none';
  let tabs = null, curId = null;
  const vizzes = [];
  const refresh = () => { vizzes.forEach(([g, cv]) => { if (cv.offsetParent) g.viz(cv); }); if (tabs) tabs.querySelectorAll('.itab').forEach(b => { const g = G2.find(x => x.id === b.dataset.id); b.querySelector('.sm').textContent = g.sum(); }); };
  let rq = 0; const ed = () => { onEdit(); if (!rq) rq = requestAnimationFrame(() => { rq = 0; refresh(); }); };
  if (tabsMode) { tabs = el('div', 'itabs'); container.appendChild(tabs); }
  const panels = {};
  G2.forEach(g => {
    const s = el('div', 'sec'), hd = el('div', 'secT'); { const h = el('span', 'secTi'); h.append(ico(g.icon, 'ic'), el('span', null, g.title)); hd.appendChild(h); }
    if (g.reset && onReset) { const b = el('button', 'mini', '프리셋으로'); b.addEventListener('click', onReset); hd.appendChild(b); }
    s.appendChild(hd);
    if (g.viz) { const cv = el('canvas', 'viz'); s.appendChild(cv); vizzes.push([g, cv]); }
    g.build(s, ed);
    container.appendChild(s); panels[g.id] = s;
    if (tabsMode) {
      const b = el('button', 'itab'); b.dataset.id = g.id;
      b.append(ico(g.icon, 'ic'), el('span', 'nm', g.title), el('span', 'sm', g.sum()));
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => show(g.id));
      tabs.appendChild(b);
    }
  });
  function show(id) {
    if (!panels[id]) id = panels.lyric ? 'lyric' : G2[tabsMode ? 1 : 0].id;
    curId = id; S.inspTab = id; saveSoon();
    Object.entries(panels).forEach(([k, s]) => s.style.display = k === id ? '' : 'none');
    tabs.querySelectorAll('.itab').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    requestAnimationFrame(refresh);
  }
  if (tabsMode) show(S.inspTab || 'tone'); else requestAnimationFrame(refresh);
}
const commitPreview = t => () => { AC(); tone(isDrumTrack(t) ? 38 : 64, ac.currentTime + 0.01, 0.45, t); };


// ───────── 가사 입력 (보컬 트랙) ─────────
// 노트 더블클릭 / Enter → 노트 위에 입력칸 · Tab 다음 노트 · Shift+Tab 이전 · 여러 글자를 쓰면 뒤 노트들로 이어서 들어감
const lyIn = document.createElement('input');
lyIn.id = 'lyInput'; lyIn.type = 'text'; lyIn.autocomplete = 'off'; lyIn.spellcheck = false; lyIn.placeholder = '가사';
document.body.appendChild(lyIn);
let lyBusy = false, lyPend = null;
const trackNotesSorted = tid => S.notes.filter(n => n.t === tid).sort((a, b) => a.s - b.s || b.p - a.p);
function placeLyIn() {
  const n = lyNote; if (!n) return;
  const r = scroller.getBoundingClientRect(), x = r.left + n.s * STEP_W - scroller.scrollLeft, y = r.top + (HIGH - n.p) * ROW_H - scroller.scrollTop;
  const h = Math.max(24, ROW_H + 8);
  Object.assign(lyIn.style, { left: Math.round(x) + 'px', top: Math.round(y + ROW_H / 2 - h / 2) + 'px', width: Math.round(Math.max(70, n.l * STEP_W + 8)) + 'px', height: h + 'px' });
}
function editLyric(n) {
  if (!n || mode !== 'idle') return;
  lyBusy = true;
  const x = n.s * STEP_W, y = (HIGH - n.p) * ROW_H;   // 화면 밖이면 보이게 스크롤
  if (x < scroller.scrollLeft + 20 || x + 80 > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = Math.max(0, x - scroller.clientWidth / 3);
  if (y < scroller.scrollTop || y + ROW_H > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = Math.max(0, y - scroller.clientHeight / 2);
  lyNote = n; sel = new Set([n]);
  placeLyIn(); lyIn.style.display = 'block'; lyIn.value = n.ly || ''; lyIn.focus(); lyIn.select();
  lyBusy = false; drawAll();
}
function setLyrics(list, start, tk) {   // tk 토큰을 list[start]부터 차례로, 노트보다 많으면 마지막 노트에 몰아 넣음
  let k = 0;
  for (; k < tk.length && start + k < list.length; k++) list[start + k].ly = tk[k];
  if (k < tk.length && list.length) list[list.length - 1].ly += tk.slice(k).join('');
  return start + k;
}
function commitLyric(move) {
  const n = lyNote; if (!n || lyBusy) return;
  lyBusy = true; lyNote = null; lyIn.style.display = 'none';
  const list = trackNotesSorted(n.t), i = list.indexOf(n);
  let nextI = i + 1;
  if (move !== 'cancel' && i >= 0) {
    const tk = KV.tokens(lyIn.value), before = JSON.stringify(list.map(m => m.ly || ''));
    const snap = snapshot();
    if (tk.length <= 1) { if (tk[0]) n.ly = tk[0]; else delete n.ly; }
    else nextI = setLyrics(list, i, tk);
    list.forEach(m => { if (m.ly === '') delete m.ly; });
    if (JSON.stringify(list.map(m => m.ly || '')) !== before) {
      undoStack.push(snap); if (undoStack.length > 200) undoStack.shift(); redoStack = [];
      save(); refreshLyricPanel();
      AC(); const t = trk(n.t); tone(n.p, ac.currentTime + 0.02, Math.min(n.l * stepSec(), 0.7), t, n.v ?? 1, { ...n, t: -1 });   // 넣은 글자 바로 들어 보기
    }
  }
  lyBusy = false;
  const go = move === 'next' ? list[nextI] : move === 'prev' ? list[i - 1] : null;
  if (go) editLyric(go); else { drawAll(); scroller.focus({ preventScroll: true }); }
}
lyIn.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.isComposing || e.keyCode === 229) {   // 한글 조합 중: 조합이 끝난 뒤에 처리 (마지막 글자가 다음 칸으로 넘어가는 문제 방지)
    if (e.code === 'Tab' || e.code === 'Enter' || e.code === 'NumpadEnter') {
      if (e.code === 'Tab') e.preventDefault();
      lyPend = e.code === 'Tab' ? (e.shiftKey ? 'prev' : 'next') : (e.shiftKey ? 'prev' : 'next-stop');
      setTimeout(() => { if (lyPend) { const m = lyPend; lyPend = null; commitLyric(m); } }, 80);
    }
    return;
  }
  if (e.key === 'Enter') { e.preventDefault(); commitLyric(e.shiftKey ? 'prev' : 'next-stop'); }
  else if (e.key === 'Tab') { e.preventDefault(); commitLyric(e.shiftKey ? 'prev' : 'next'); }
  else if (e.key === 'Escape') { e.preventDefault(); commitLyric('cancel'); }
});
lyIn.addEventListener('compositionend', () => { if (lyPend) { const m = lyPend; lyPend = null; setTimeout(() => commitLyric(m), 0); } });
lyIn.addEventListener('blur', () => setTimeout(() => { if (lyNote && document.activeElement !== lyIn) commitLyric('none'); }, 0));

// 인스펙터 '가사' 탭: 곡 전체 가사를 글로 붙여 넣기
function trackLyricText(t) {
  const list = trackNotesSorted(t.id); if (!list.some(n => n.ly)) return '';
  let out = '', prevEnd = null;
  for (const n of list) {
    if (prevEnd != null) out += n.s - prevEnd >= 16 ? '\n' : n.s - prevEnd > 0.01 ? ' ' : '';
    out += n.ly || '라'; prevEnd = n.s + n.l;
  }
  return out;
}
function applyLyricText(t, text) {
  const tk = KV.tokens(text); if (!tk.length) return toast('넣을 가사가 없어요 (한글 한 글자 = 노트 하나)');
  const selected = [...sel].filter(n => n.t === t.id);
  const list = (selected.length >= 2 ? selected : S.notes.filter(n => n.t === t.id)).sort((a, b) => a.s - b.s || b.p - a.p);
  if (!list.length) return toast('이 트랙에 노트가 없어요. 먼저 멜로디를 그려 주세요');
  pushUndo();
  let k = 0; for (; k < tk.length && k < list.length; k++) list[k].ly = tk[k];
  save(); drawAll(); refreshLyricPanel(true);
  const extra = tk.length - k, empty = list.length - k;
  toast(`노트 ${k}개에 가사를 넣었어요` + (extra > 0 ? ` · 가사 ${extra}글자가 남았어요` : empty > 0 ? ` · 노트 ${empty}개는 그대로 두었어요` : ''));
}
function buildLyricPanel(s, t) {
  const ta = el('textarea', 'lyTa'); ta.rows = 5; ta.spellcheck = false;
  ta.placeholder = '예) 반짝반짝 작은 별\n한 글자 = 노트 하나 · "-" = 앞 글자 늘이기';
  ta.value = trackLyricText(t); ta.dataset.tid = t.id; ta.dataset.dirty = '';
  ta.addEventListener('input', () => { ta.dataset.dirty = '1'; });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyLyricText(t, ta.value); } });
  const row = el('div', 'lyBtns'), ap = el('button', 'mini', '노트에 넣기'), hear = el('button', 'mini', '처음부터 듣기');
  ap.title = '선택한 노트(2개 이상)나 트랙 전체 노트에 앞에서부터 한 글자씩 넣어요 (Ctrl+Enter)';
  ap.addEventListener('click', () => applyLyricText(t, ta.value));
  hear.addEventListener('click', () => { if (mode !== 'idle') stop(); playhead = 0; play(); });
  row.append(ap, hear);
  const hint = el('div', 'lyHint');
  hint.innerHTML = '노트를 <b>더블클릭</b>하거나 노트를 고르고 <b>Enter</b> → 바로 입력<br><b>Tab</b> 다음 노트 · <b>Shift+Tab</b> 이전 노트 · <b>-</b> 앞 글자 늘이기';
  s.append(ta, row, hint);
}
function refreshLyricPanel(force) {
  document.querySelectorAll('textarea.lyTa').forEach(ta => {
    if (!force && (ta.dataset.dirty || document.activeElement === ta)) return;
    const t = trk(+ta.dataset.tid); if (t) { ta.value = trackLyricText(t); ta.dataset.dirty = ''; }
  });
  document.querySelectorAll('.itab[data-id="lyric"] .sm').forEach(sm => { const ns = S.notes.filter(n => n.t === S.active); sm.textContent = `${ns.filter(n => n.ly).length}/${ns.length}`; });
}

// ───────── 트랙 패널 ─────────
let trackSel = new Set();   // 트랙 목록에서 여러 개 선택 (폴더로 묶기용)
let lastClickTrack = null;
function renderList() {
  const list = $('trackList'); if (!list) return;
  const ae = document.activeElement;
  if (ae && ae.dataset && ae.dataset.editing === '1' && list.contains(ae)) return;   // 이름 입력 중이면 다시 그리지 않음
  list.innerHTML = '';
  [...trackSel].forEach(id => { if (!trk(id)) trackSel.delete(id); });
  const shown = new Set();
  for (const t of S.tracks) {
    const f = fldOf(t);
    if (f && !shown.has(f.id)) { shown.add(f.id); list.appendChild(folderRow(f)); }
    if (f && !f.open) continue;
    list.appendChild(trackRow(t, f));
  }
  for (const f of S.folders) if (!shown.has(f.id)) list.appendChild(folderRow(f));   // 빈 폴더
}
function trackRow(t, f) {
  const row = el('div', 'trk' + (t.id === S.active ? ' active' : '') + (trackSel.has(t.id) ? ' tsel' : '') + (f ? ' inF' : ''));
  const cnt = S.notes.reduce((a, n) => a + (n.t === t.id ? 1 : 0), 0);
  row.innerHTML = `<span class="sw"></span><span class="ti"></span><span class="tn"></span><span class="cnt">${cnt}</span>` +
    `<button class="ms m${t.mute ? ' on' : ''}" title="뮤트">M</button><button class="ms s${t.solo ? ' on' : ''}" title="솔로">S</button><button class="ed" title="트랙 설정">${svg('pen')}</button>`;
  row.querySelector('.sw').style.background = t.color;
  row.querySelector('.ti').innerHTML = svg(INSTS[t.inst].icon); row.querySelector('.ti').style.color = t.color;
  row.querySelector('.tn').textContent = t.name;
  row.title = `${t.name} — ${INSTS[t.inst].label}` + (f ? ` · 폴더 '${f.name}'` : '');
  row.dataset.id = t.id; row.dataset.kind = 't';
  row.addEventListener('pointerdown', e => { if (e.button !== 0 || e.target.closest('.ms,.ed,input')) return; startListDrag(e, { t }, row); });
  row.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (!trackSel.has(t.id)) { trackSel = new Set([t.id]); }
    setActive(t.id); renderList(); openCtx(e.clientX, e.clientY, t);
  });
  row.querySelector('.tn').addEventListener('dblclick', () => renameTrack(t));
  const m = row.querySelector('.m'), s = row.querySelector('.s'), ed = row.querySelector('.ed');
  [m, s, ed].forEach(b => b.addEventListener('mousedown', ev => ev.preventDefault()));
  m.onclick = () => { t.mute = !t.mute; save(); drawAll(); };
  s.onclick = () => { t.solo = !t.solo; save(); drawAll(); };
  ed.onclick = () => openTrackModal(t);
  return row;
}
function folderRow(f) {
  const kids = S.tracks.filter(t => t.folder === f.id);
  const cnt = S.notes.reduce((a, n) => a + (kids.some(t => t.id === n.t) ? 1 : 0), 0);
  const row = el('div', 'fld' + (f.open ? ' open' : ''));
  row.innerHTML = `<span class="fch">${svg('chev')}</span><span class="fic">${svg(f.open ? 'folderOpen' : 'folder')}</span><span class="tn"></span>` +
    `<span class="dots"></span><span class="cnt">${cnt}</span>` +
    `<button class="ms m${f.mute ? ' on' : ''}" title="폴더 전체 뮤트">M</button><button class="ms s${f.solo ? ' on' : ''}" title="폴더 전체 솔로">S</button>`;
  row.querySelector('.tn').textContent = f.name;
  const dots = row.querySelector('.dots');
  if (!f.open) kids.slice(0, 5).forEach(t => { const d = document.createElement('i'); d.style.background = t.color; dots.appendChild(d); });
  row.title = `폴더 '${f.name}' — 트랙 ${kids.length}개 · 클릭: 접기/펼치기 · 더블클릭: 이름 바꾸기 · 끌어서 폴더째 이동`;
  row.dataset.fid = f.id; row.dataset.kind = 'f';
  row.addEventListener('pointerdown', e => { if (e.button !== 0 || e.target.closest('.ms,input')) return; startListDrag(e, { f }, row); });
  row.addEventListener('contextmenu', e => { e.preventDefault(); openFolderCtx(e.clientX, e.clientY, f); });
  row.querySelector('.tn').addEventListener('dblclick', e => { e.stopPropagation(); renameFolder(f); });
  const m = row.querySelector('.m'), s = row.querySelector('.s');
  [m, s].forEach(b => b.addEventListener('mousedown', ev => ev.preventDefault()));
  m.onclick = () => { f.mute = !f.mute; save(); drawAll(); };
  s.onclick = () => { f.solo = !f.solo; save(); drawAll(); };
  return row;
}
function clickTrack(e, t) {
  if (e.ctrlKey || e.metaKey) {
    if (trackSel.has(t.id) && trackSel.size > 1) trackSel.delete(t.id); else trackSel.add(t.id);
  } else if (e.shiftKey && lastClickTrack != null && trk(lastClickTrack)) {
    const a = S.tracks.indexOf(trk(lastClickTrack)), b = S.tracks.indexOf(t);
    trackSel = new Set(S.tracks.slice(Math.min(a, b), Math.max(a, b) + 1).map(x => x.id));
  } else trackSel = new Set([t.id]);
  if (!e.shiftKey) lastClickTrack = t.id;
  if (S.active !== t.id) setActive(t.id); else renderList();
}
// 목록 끌기: 트랙(순서 변경 · 폴더 안/밖으로) 또는 폴더(폴더째 이동)
function startListDrag(e, what, row) {
  const list = $('trackList'), y0 = e.clientY; let dragging = false, drop = null;
  const clearMarks = () => list.querySelectorAll('.trk,.fld').forEach(r => r.classList.remove('dropBefore', 'dropAfter', 'dropInto'));
  const moving = what.t ? (trackSel.has(what.t.id) && trackSel.size > 1 ? S.tracks.filter(x => trackSel.has(x.id)) : [what.t])
                        : S.tracks.filter(x => x.folder === what.f.id);
  const mv = ev => {
    if (!dragging) { if (Math.abs(ev.clientY - y0) < 5) return; dragging = true; row.classList.add('dragging'); document.body.style.cursor = 'grabbing'; closeCtx(); }
    let rows = [...list.querySelectorAll('.trk,.fld')];
    if (what.f) rows = rows.filter(r => !r.classList.contains('inF') && r !== row);   // 폴더는 최상위 줄 사이에만
    else rows = rows.filter(r => !(r.dataset.kind === 't' && moving.some(m => m.id === +r.dataset.id)));
    clearMarks(); drop = null;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], b = r.getBoundingClientRect();
      if (ev.clientY > b.bottom) continue;
      if (what.t && r.dataset.kind === 'f' && ev.clientY > b.top + b.height * 0.28) { drop = { into: +r.dataset.fid }; r.classList.add('dropInto'); break; }
      if (ev.clientY < b.top + b.height / 2 || r.dataset.kind === 'f') { drop = { before: r }; r.classList.add('dropBefore'); break; }
    }
    if (!drop && rows.length) { drop = { end: true }; rows[rows.length - 1].classList.add('dropAfter'); }
  };
  const up = ev => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
    document.body.style.cursor = ''; clearMarks(); row.classList.remove('dragging');
    if (!dragging) {
      if (what.t) clickTrack(ev, what.t);
      else { what.f.open = !what.f.open; save(); }
      return;
    }
    if (!drop) return;
    pushUndo();
    let rest = S.tracks.filter(x => !moving.includes(x)), at = rest.length, folder = null;
    if (drop.into != null) {
      folder = drop.into;
      const kids = rest.filter(x => x.folder === folder);
      at = kids.length ? rest.indexOf(kids[kids.length - 1]) + 1 : rest.length;
      const f = S.folders.find(x => x.id === folder); if (f) f.open = true;
    } else if (drop.before) {
      const r = drop.before;
      if (r.dataset.kind === 'f') { const fid = +r.dataset.fid; at = rest.findIndex(x => x.folder === fid); }
      else { const tt = trk(+r.dataset.id); at = rest.indexOf(tt); folder = tt.folder ?? null; }
      if (at < 0) at = rest.length;
    }
    if (what.t) moving.forEach(x => { if (folder != null) x.folder = folder; else delete x.folder; });
    rest.splice(at, 0, ...moving); S.tracks = rest;
    const before = S.folders.length; normFolders();
    if (what.t && drop.into != null) toast(`${moving.length}개 트랙을 '${S.folders.find(x => x.id === folder).name}' 폴더에 넣었어요`);
    else if (S.folders.length < before) toast('빈 폴더는 정리했어요');
    save(); drawAll();
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function groupIntoFolder(ids) {
  ids = ids || (trackSel.size ? [...trackSel] : [S.active]);
  const ts = S.tracks.filter(t => ids.includes(t.id)); if (!ts.length) return;
  pushUndo();
  const id = S.nextId++, n = S.folders.length + 1;
  const f = { id, name: `폴더 ${n}`, open: true, mute: false, solo: false };
  S.folders.push(f);
  const first = S.tracks.indexOf(ts[0]), rest = S.tracks.filter(t => !ts.includes(t));
  let at = rest.indexOf(S.tracks.slice(first).find(t => !ts.includes(t))); if (at < 0) at = rest.length;
  // 첫 트랙이 있던 자리에 폴더를 둠
  at = Math.min(at, first);
  ts.forEach(t => t.folder = id);
  rest.splice(at, 0, ...ts); S.tracks = rest; normFolders();
  trackSel = new Set(ts.map(t => t.id));
  save(); drawAll(); renameFolder(f);
  toast(`트랙 ${ts.length}개를 새 폴더로 묶었어요 — 이름을 입력하세요`);
}
function createEmptyFolder() {
  pushUndo();
  const id = S.nextId++, f = { id, name: `폴더 ${S.folders.length + 1}`, open: true, mute: false, solo: false, keep: true };
  S.folders.push(f); save(); drawAll(); renameFolder(f);
  toast('빈 폴더를 만들었어요 — 트랙을 끌어서 넣어 보세요');
}
function moveToFolder(ids, fid) {
  pushUndo();
  const ts = S.tracks.filter(t => ids.includes(t.id)), rest = S.tracks.filter(t => !ts.includes(t));
  if (fid == null) {   // 폴더에서 빼기: 그 폴더 바로 뒤로
    const fids = new Set(ts.map(t => t.folder)); ts.forEach(t => delete t.folder);
    let at = -1; rest.forEach((t, i) => { if (fids.has(t.folder)) at = i; });
    if (at < 0) at = rest.findIndex(t => S.tracks.indexOf(t) > S.tracks.indexOf(ts[0])) - 1;
    rest.splice(at < 0 ? rest.length : at + 1, 0, ...ts);
  } else {
    ts.forEach(t => t.folder = fid);
    const kids = rest.filter(t => t.folder === fid);
    rest.splice(kids.length ? rest.indexOf(kids[kids.length - 1]) + 1 : rest.length, 0, ...ts);
    const f = S.folders.find(x => x.id === fid); if (f) f.open = true;
  }
  S.tracks = rest; normFolders(); save(); drawAll();
}
function renameFolder(f) {
  const row = $('trackList').querySelector(`.fld[data-fid="${f.id}"]`); if (!row) return;
  const tn = row.querySelector('.tn'), inp = document.createElement('input');
  inp.type = 'text'; inp.value = f.name; inp.maxLength = 24; inp.dataset.editing = '1';
  tn.textContent = ''; tn.appendChild(inp); inp.focus(); inp.select();
  inp.addEventListener('pointerdown', e => e.stopPropagation());
  let done = false;
  const commit = ok => { if (done) return; done = true; inp.dataset.editing = '0'; if (ok && inp.value.trim()) f.name = inp.value.trim(); save(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(true); else if (e.key === 'Escape') commit(false); e.stopPropagation(); });
  inp.addEventListener('blur', () => commit(true));
}
function ungroupFolder(f) {
  pushUndo(); S.tracks.forEach(t => { if (t.folder === f.id) delete t.folder; });
  S.folders = S.folders.filter(x => x !== f); normFolders(); save(); drawAll(); toast(`'${f.name}' 폴더를 풀었어요 (트랙은 그대로)`);
}
async function deleteFolder(f) {
  const kids = S.tracks.filter(t => t.folder === f.id);
  if (kids.length && kids.length >= S.tracks.length) return toast('트랙은 최소 1개가 필요해요 — 폴더 풀기를 사용하세요');
  const cnt = S.notes.filter(n => kids.some(t => t.id === n.t)).length;
  if (!await confirmBox(`'${f.name}' 폴더를 트랙째 삭제할까요?`, `트랙 ${kids.length}개${cnt ? `와 노트 ${cnt}개` : ''}가 함께 지워져요. 되돌리기로 복구할 수 있어요.`, '삭제')) return;
  pushUndo();
  const ids = new Set(kids.map(t => t.id));
  S.notes = S.notes.filter(n => !ids.has(n.t)); S.tracks = S.tracks.filter(t => !ids.has(t.id));
  S.folders = S.folders.filter(x => x !== f);
  if (ids.has(S.active)) S.active = S.tracks[0].id;
  normFolders(); sel = new Set(); renderInspector(); save(); drawAll(); toast('폴더를 삭제했어요 (되돌리기 가능)');
}
function openFolderCtx(x, y, f) {
  ctx.innerHTML = '';
  ctx.appendChild(el('div', 'ctxHead', f.name));
  const item = (icon, label, fn, cls = '') => {
    const d = el('div', 'ci ' + cls); d.innerHTML = svg(icon); d.appendChild(el('span', null, label));
    d.addEventListener('click', () => { closeCtx(); fn(); }); ctx.appendChild(d);
  };
  item('select', '이름 바꾸기', () => renameFolder(f));
  item(f.open ? 'folder' : 'folderOpen', f.open ? '접기' : '펼치기', () => { f.open = !f.open; save(); });
  item('select', '폴더 트랙 모두 선택', () => { trackSel = new Set(S.tracks.filter(t => t.folder === f.id).map(t => t.id)); f.open = true; renderList(); });
  item('folderOut', '폴더 풀기 (트랙은 유지)', () => ungroupFolder(f));
  ctx.appendChild(el('div', 'csep'));
  item('trash', '폴더와 트랙 모두 삭제', () => deleteFolder(f), 'danger');
  showCtxAt(x, y);
}
function showCtxAt(x, y) {
  ctx.classList.add('show');
  ctx.style.left = clamp(x, 4, innerWidth - ctx.offsetWidth - 4) + 'px';
  ctx.style.top = clamp(y, 4, innerHeight - ctx.offsetHeight - 4) + 'px';
}
function renderInspector() {
  const t = activeTrack(), ic = $('insIcon');
  ic.innerHTML = svg(INSTS[t.inst].icon); ic.style.color = t.color; ic.style.borderColor = t.color; ic.style.background = t.color + '22';
  $('insName').value = t.name; $('insInst').value = t.inst; $('insColor').value = t.color;
  buildEditor($('insSound'), t, saveSoon, commitPreview(t), () => {
    pushUndo(); t.snd = preset(t.inst); renderInspector(); save(); commitPreview(t)();
  }, true);
}
const scrollToDrums = () => { scroller.scrollTop = (HIGH - 52) * ROW_H; };
function setActive(id) {
  if (S.active === id) return;
  S.active = id; sel = new Set();
  if (pasting) $('pasteInfo').textContent = `노트 ${clip.items.length}개 → '${activeTrack().name}'`;
  renderInspector(); save();
  if (isDrumTrack(activeTrack())) scrollToDrums();
  drawAll();
}
function fillInstSelect(s) {
  s.innerHTML = '';
  for (const [f, label] of FAMS.slice(1)) {
    const g = document.createElement('optgroup'); g.label = label;
    for (const k in INSTS) if (INSTS[k].fam === f) g.appendChild(new Option(INSTS[k].label, k));
    s.appendChild(g);
  }
}
fillInstSelect($('insInst'));
$('insPreview').onclick = () => inspPreview();
$('insPlay').onclick = () => inspPreview();
$('addFolder').onclick = () => createEmptyFolder();
let inspPrevT = null;
function inspPreview() {
  const t = activeTrack(); previewPhrase(t);
  const b = $('insPlay'); b.classList.add('playing'); clearTimeout(inspPrevT);
  inspPrevT = setTimeout(() => b.classList.remove('playing'), isDrumTrack(t) ? 1200 : 1900);
}
$('insName').addEventListener('input', e => { activeTrack().name = e.target.value || '트랙'; saveSoon(); });
$('insColor').addEventListener('input', e => { activeTrack().color = e.target.value; renderInspectorIcon(); saveSoon(); drawAll(); });
function renderInspectorIcon() { const t = activeTrack(), ic = $('insIcon'); ic.style.borderColor = t.color; ic.style.background = t.color + '22'; }
$('insInst').addEventListener('change', e => {
  const t = activeTrack(), old = t.inst; pushUndo();
  if (t.name === INSTS[old].label) t.name = INSTS[e.target.value].label;
  t.inst = e.target.value; t.snd = preset(t.inst); t.color = pickColor(t.inst, t);
  renderInspector(); save(); drawAll();
  if (isDrumTrack(t)) scrollToDrums();
  previewPhrase(t); e.target.blur();
});

const ctx = $('ctx');
function openCtx(x, y, t) {
  const one = S.tracks.length <= 1;
  ctx.innerHTML = '';
  ctx.appendChild(el('div', 'ctxHead', t.name));
  const item = (icon, label, fn, cls = '') => {
    const d = el('div', 'ci ' + cls); d.innerHTML = svg(icon); d.appendChild(el('span', null, label));
    d.addEventListener('click', () => { closeCtx(); fn(); }); ctx.appendChild(d);
  };
  item('pen', '트랙 설정…', () => openTrackModal(t));
  item('select', '이름 바꾸기', () => renameTrack(t));
  item('copy', '트랙 복제', () => duplicateTrack(t));
  item('clear', '노트 모두 지우기', () => { setActive(t.id); $('clearBtn').click(); });
  ctx.appendChild(el('div', 'csep'));
  const ids = trackSel.has(t.id) ? [...trackSel] : [t.id], n = ids.length > 1 ? ` (${ids.length}개)` : '';
  item('folderPlus', '새 폴더로 묶기' + n, () => groupIntoFolder(ids));
  S.folders.filter(f => !ids.every(id => trk(id).folder === f.id)).forEach(f => item('folder', `'${f.name}' 폴더로 이동` + n, () => moveToFolder(ids, f.id)));
  if (ids.some(id => trk(id).folder != null)) item('folderOut', '폴더에서 빼기' + n, () => moveToFolder(ids, null));
  ctx.appendChild(el('div', 'csep'));
  item('trash', '트랙 삭제', () => deleteTrack(t), 'danger' + (one ? ' disabled' : ''));
  showCtxAt(x, y);
}
function closeCtx() { ctx.classList.remove('show'); }
window.addEventListener('pointerdown', e => { if (!ctx.contains(e.target)) closeCtx(); }, true);
window.addEventListener('blur', closeCtx);
function renameTrack(t) {
  const row = $('trackList').querySelector(`.trk[data-id="${t.id}"]`); if (!row) return;
  const tn = row.querySelector('.tn'), inp = document.createElement('input');
  inp.type = 'text'; inp.value = t.name; inp.maxLength = 24; inp.dataset.editing = '1';
  tn.textContent = ''; tn.appendChild(inp); inp.focus(); inp.select();
  let done = false;
  const commit = ok => { if (done) return; done = true; inp.dataset.editing = '0'; if (ok && inp.value.trim()) t.name = inp.value.trim(); renderInspector(); save(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(true); else if (e.key === 'Escape') commit(false); e.stopPropagation(); });
  inp.addEventListener('blur', () => commit(true));
}
function duplicateTrack(t) {
  pushUndo();
  const id = S.nextId++, nt = JSON.parse(JSON.stringify(t)); nt.id = id; nt.name = t.name + ' 복사'; nt.solo = false;
  nt.color = pickColor(nt.inst, nt);
  S.tracks.splice(S.tracks.indexOf(t) + 1, 0, nt);
  S.notes.push(...regroup(S.notes.filter(n => n.t === t.id).map(n => ({ ...n, t: id }))));
  setActive(id); save(); drawAll(); toast(`'${nt.name}' 트랙을 만들었어요`);
}
async function deleteTrack(t) {
  if (S.tracks.length <= 1) return toast('트랙은 최소 1개가 필요해요');
  const cnt = S.notes.filter(n => n.t === t.id).length;
  if (!await confirmBox(`'${t.name}' 트랙을 삭제할까요?`, cnt ? `노트 ${cnt}개도 함께 지워져요. 되돌리기로 복구할 수 있어요.` : '되돌리기로 복구할 수 있어요.', '삭제')) return;
  pushUndo();
  const i = S.tracks.indexOf(t);
  S.notes = S.notes.filter(n => n.t !== t.id); S.tracks = S.tracks.filter(x => x !== t);
  normFolders();
  if (S.active === t.id) S.active = S.tracks[Math.min(i, S.tracks.length - 1)].id;
  sel = new Set(); renderInspector(); save(); drawAll(); toast('트랙을 삭제했어요 (되돌리기 가능)');
}

// ───────── 확인창 ─────────
let confirmResolve = null;
function confirmBox(title, msg, okLabel = '확인') {
  $('cTitle').textContent = title; $('cMsg').textContent = msg || ''; $('cYes').textContent = okLabel;
  $('confirm').classList.add('show'); setTimeout(() => $('cYes').focus(), 20);
  return new Promise(res => { confirmResolve = res; });
}
function closeConfirm(v) { $('confirm').classList.remove('show'); if (confirmResolve) { confirmResolve(v); confirmResolve = null; } }
$('cYes').onclick = () => closeConfirm(true);
$('cNo').onclick = () => closeConfirm(false);
$('confirm').addEventListener('pointerdown', e => { if (e.target.id === 'confirm') closeConfirm(false); });

// ───────── 트랙 추가 / 설정 창 ─────────
const modal = $('modal');
let draft = null, editing = null, nameTouched = false, famSel = 'all', themeSel = 'all';
function openTrackModal(t) {   // t 없으면 새 트랙 (악기 고르기부터)
  closeCtx();
  editing = t || null; nameTouched = !!t;
  draft = t ? JSON.parse(JSON.stringify(t)) : null;
  modal.classList.add('show');
  if (t) showSetStep(); else showPickStep();
}
function closeModal() { modal.classList.remove('show'); draft = null; editing = null; }
function showPickStep() {
  $('stepPick').classList.add('show'); $('stepSet').classList.remove('show');
  $('instSearch').value = ''; pickKey = draft ? draft.inst : null; updatePickFoot(); renderThemes(); renderInstGrid();
  setTimeout(() => $('instSearch').focus(), 30);
}
function showSetStep() {
  $('stepPick').classList.remove('show'); $('stepSet').classList.add('show');
  $('mTitle').textContent = editing ? '트랙 설정' : '새 트랙';
  $('mOk').textContent = editing ? '적용' : '트랙 추가';
  renderSetStep();
}
function renderSetStep() {
  const I = INSTS[draft.inst];
  $('mEm').innerHTML = svg(I.icon); $('mEm').style.color = draft.color; $('mInstName').textContent = I.label; $('mBar').style.background = draft.color;
  $('mPrev').style.borderColor = draft.color + '88';
  $('mName').value = draft.name; $('mColor').value = draft.color;
  buildEditor($('mSound'), draft, () => {}, commitPreview(draft), () => { draft.snd = preset(draft.inst); renderSetStep(); commitPreview(draft)(); });
}
function chooseInst(k) {
  if (!draft) {
    draft = mkTrack(S.nextId, k); draft.color = pickColor(k);
  } else {
    if (!nameTouched || draft.name === INSTS[draft.inst].label) draft.name = INSTS[k].label;
    draft.inst = k; draft.snd = preset(k); draft.color = pickColor(k, editing || undefined);
  }
}
// 악기 창에서 바로 미리 듣기
let pickKey = null, auditionT = null;
function auditionInst(k, blkEl) {
  AC(); if (mode === 'idle') killVoices();
  const tmp = mkTrack(-1, k); tmp.color = INSTS[k].color; delete buses[-1];
  previewPhrase(tmp);
  document.querySelectorAll('#instGrid .blk.playing').forEach(x => x.classList.remove('playing'));
  if (blkEl) { blkEl.classList.add('playing'); clearTimeout(auditionT); auditionT = setTimeout(() => blkEl.classList.remove('playing'), 1800); }
}
function updatePickFoot() {
  $('pickSet').disabled = $('pickAdd').disabled = !pickKey;
  $('pickHint').textContent = pickKey ? `${INSTS[pickKey].label} 선택됨 · 다른 블록을 눌러 비교해 보세요` : '블록을 클릭하면 바로 들려줘요 · 더블클릭: 바로 추가';
}
$('pickSet').onclick = () => { if (pickKey) { chooseInst(pickKey); showSetStep(); } };
$('pickAdd').onclick = () => { if (pickKey) { chooseInst(pickKey); commitModal(); } };
function renderThemes() {
  const row = $('themeRow'); row.innerHTML = '';
  for (const th of THEMES) {
    const b = el('div', 'theme' + (themeSel === th.id ? ' on' : ''));
    b.style.background = `linear-gradient(135deg, ${th.grad[0]}, ${th.grad[1]})`;
    b.append(ico(th.icon, 'tIcon'), el('span', 'tCnt', `${th.list ? th.list.length : Object.keys(INSTS).length}개`), el('span', 'tName', th.name), el('span', 'tDesc', th.desc));
    b.title = th.list ? th.list.map(k => INSTS[k].label).join(', ') : '모든 악기';
    b.addEventListener('click', () => { themeSel = th.id; famSel = 'all'; renderThemes(); renderInstGrid(); });
    row.appendChild(b);
  }
  updateThemeNav();
}
function updateThemeNav() {
  const r = $('themeRow');
  $('thPrev').hidden = r.scrollLeft < 4;
  $('thNext').hidden = r.scrollLeft + r.clientWidth >= r.scrollWidth - 4;
}
$('themeRow').addEventListener('scroll', updateThemeNav);
$('themeRow').addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); $('themeRow').scrollLeft += e.deltaY; } }, { passive: false });
$('thPrev').onclick = () => { $('themeRow').scrollLeft -= 420; };
$('thNext').onclick = () => { $('themeRow').scrollLeft += 420; };
function renderInstGrid() {
  const q = $('instSearch').value.trim().toLowerCase();
  const theme = THEMES.find(t => t.id === themeSel);
  const bar = $('famBar'); bar.innerHTML = '';
  for (const [f, label] of FAMS) {
    const b = el('button', 'famBtn' + (famSel === f ? ' on' : ''), label);
    b.addEventListener('click', () => { famSel = f; renderInstGrid(); }); bar.appendChild(b);
  }
  const grid = $('instGrid'); grid.innerHTML = '';
  const filter = useTheme => (useTheme && theme && theme.list ? theme.list : Object.keys(INSTS)).filter(k => {
    const I = INSTS[k];
    if (famSel !== 'all' && I.fam !== famSel) return false;
    if (!q) return true;
    return (I.label + ' ' + I.alias + ' ' + famName(I.fam) + ' ' + k).toLowerCase().includes(q);
  });
  let list = filter(true);
  if (!list.length && q && theme && theme.list) {   // 테마 안에 없으면 전체에서 찾아 보여줌
    list = filter(false);
    if (list.length) { const n = el('div', 'empty', `'${theme.name}' 테마에는 없어서 전체 악기에서 찾았어요`); n.style.padding = '2px 0 4px'; grid.appendChild(n); }
  }
  if (!list.length) { grid.appendChild(el('div', 'empty', q ? `'${q}'에 맞는 악기가 없어요` : '이 조건에 맞는 악기가 없어요')); return; }
  for (const k of list) {
    const I = INSTS[k], b = el('div', 'blk' + (pickKey === k ? ' on' : ''));
    const emI = ico(I.icon, 'em'); emI.style.color = I.color; b.append(emI, el('span', 'nm', I.label), el('span', 'fm', famName(I.fam)));
    const barEl = el('span', 'bar'); barEl.style.background = I.color; b.appendChild(barEl);
    const pl = el('span', 'play'); pl.innerHTML = svg('play'); pl.title = '미리 듣기'; b.appendChild(pl);
    pl.addEventListener('click', e => { e.stopPropagation(); auditionInst(k, b); });
    b.addEventListener('click', () => { pickKey = k; grid.querySelectorAll('.blk.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); updatePickFoot(); auditionInst(k, b); });
    b.addEventListener('dblclick', () => { chooseInst(k); commitModal(); });
    grid.appendChild(b);
  }
}
function commitModal() {
  if (!draft) return;
  draft.name = (draft.name || '').trim() || INSTS[draft.inst].label;
  pushUndo();
  if (editing) {
    Object.assign(editing, draft); delete buses[editing.id];
    renderInspector(); save(); drawAll(); toast(`'${editing.name}' 설정을 적용했어요`);
  } else {
    draft.id = S.nextId++; S.tracks.push(draft);
    const id = draft.id; closeModal(); setActive(id); save(); drawAll(); toast(`'${trk(id).name}' 트랙을 추가했어요`);
    return;
  }
  closeModal();
}
$('instSearch').addEventListener('input', renderInstGrid);
$('instSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') { if (pickKey) $('pickSet').click(); else { const first = $('instGrid').querySelector('.blk'); if (first) first.click(); } }
  if (e.key === 'Escape') { closeModal(); }
  e.stopPropagation();
});
$('mName').addEventListener('input', e => { draft.name = e.target.value; nameTouched = true; });
$('mName').addEventListener('keydown', e => { if (e.key === 'Enter') commitModal(); e.stopPropagation(); });
$('mColor').addEventListener('input', e => { draft.color = e.target.value; $('mBar').style.background = draft.color; });
$('mPreview').onclick = () => previewPhrase(draft);
$('mBack').onclick = showPickStep;
$('mOk').onclick = commitModal;
$('mCancel').onclick = closeModal;
$('mClose1').onclick = closeModal;
$('mClose2').onclick = closeModal;
modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(); });
$('addTrack').onclick = () => openTrackModal();

// ───────── 도구 팔레트 ─────────
const pal = $('palette'), dockEl = $('toolDock'), topbar = $('topbar');
function setTool(t, temp = false) {
  S.tool = t; document.body.dataset.tool = t;
  document.querySelectorAll('#editBar [data-et]').forEach(b => b.classList.toggle('on', b.dataset.et === t));
  pal.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  scroller.style.cursor = CURSOR[t]; if (!temp) saveSoon();
}
// 스페이스를 누르고 있는 동안 손 도구 (짧게 톡 누르면 재생/정지)
let space = null;
function spaceDown() {
  if (space) return;
  space = { prev: S.tool, at: performance.now(), used: false };
  if (!drag) setTool('hand', true);
}
function spaceUp(cancel) {
  if (!space) return;
  const sp = space; space = null;
  if (drag) pendingRestore = sp.prev; else setTool(sp.prev, true);   // 끌던 중이면 끝난 뒤 복귀
  if (!cancel && !sp.used && performance.now() - sp.at < 250) mode === 'play' ? stop() : play();
}
let pendingRestore = null;
window.addEventListener('blur', () => spaceUp(true));
function placePal() {
  if (S.pal.docked) { dockEl.appendChild(pal); pal.classList.add('docked'); pal.style.left = pal.style.top = ''; }
  else {
    document.body.appendChild(pal); pal.classList.remove('docked');
    if (S.pal.x == null) { const r = $('rollWrap').getBoundingClientRect(); S.pal.x = r.left + 14; S.pal.y = r.top + 14; }
    S.pal.x = clamp(S.pal.x, 0, innerWidth - pal.offsetWidth); S.pal.y = clamp(S.pal.y, 0, innerHeight - pal.offsetHeight);
    pal.style.left = S.pal.x + 'px'; pal.style.top = S.pal.y + 'px';
  }
  $('dockBtn').innerHTML = svg(S.pal.docked ? 'dockDown' : 'dockUp');
  $('dockBtn').title = S.pal.docked ? '도구 패널 떼어내기' : '상단 바에 고정';
}
$('pgrip').addEventListener('pointerdown', e => {
  e.preventDefault();
  const grip = $('pgrip');
  if (S.pal.docked) { S.pal.docked = false; S.pal.x = e.clientX - 16; S.pal.y = e.clientY - 8; placePal(); }
  const r = pal.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
  grip.setPointerCapture(e.pointerId); grip.style.cursor = 'grabbing';
  const overBar = ev => { const tb = topbar.getBoundingClientRect(); return ev.clientY >= tb.top && ev.clientY <= tb.bottom + 6; };
  const mv = ev => { S.pal.x = ev.clientX - ox; S.pal.y = ev.clientY - oy; pal.style.left = S.pal.x + 'px'; pal.style.top = S.pal.y + 'px'; dockEl.classList.toggle('drop', overBar(ev)); };
  const up = ev => {
    grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up);
    grip.style.cursor = ''; dockEl.classList.remove('drop');
    if (overBar(ev)) S.pal.docked = true;
    placePal(); save();
  };
  grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
});
$('dockBtn').onclick = () => { S.pal.docked = !S.pal.docked; if (!S.pal.docked) S.pal.x = null; placePal(); save(); };
pal.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));

// ───────── 좌우 패널 크기 조절 / 숨기기 ─────────
S.ui = Object.assign({ lw: 214, rw: 288, lHide: false, rHide: false }, S.ui || {});
const isMobile = () => window.innerWidth <= 760 || (window.matchMedia('(pointer:coarse)').matches && window.innerHeight <= 520 && window.innerWidth > window.innerHeight);
if (isMobile()) { S.ui.lHide = true; S.ui.rHide = true; }   // 모바일은 처음엔 패널을 닫고 시작
function applyPanels() {
  const m = $('main');
  m.style.setProperty('--lw', S.ui.lw + 'px'); m.style.setProperty('--rw', S.ui.rw + 'px');
  $('side').style.display = S.ui.lHide ? 'none' : ''; $('insp').style.display = S.ui.rHide ? 'none' : '';
  $('rzL').classList.toggle('collapsed', S.ui.lHide); $('rzR').classList.toggle('collapsed', S.ui.rHide);
  $('toggleL').classList.toggle('on', !S.ui.lHide); $('toggleR').classList.toggle('on', !S.ui.rHide);
  layout();
  if (!S.pal.docked && S.pal.x != null) {   // 떠 있는 도구 패널이 건반/패널을 가리지 않게 따라 이동
    const r = $('rollWrap').getBoundingClientRect(), w = pal.offsetWidth;
    if (S.pal.x < r.left + 4 || S.pal.x + w > r.right - 4) { S.pal.x = clamp(S.pal.x, r.left + 14, r.right - w - 14); placePal(); }
  }
}
function togglePanel(side) {
  const k = side === 'L' ? 'lHide' : 'rHide', o = side === 'L' ? 'rHide' : 'lHide';
  S.ui[k] = !S.ui[k];
  if (isMobile() && !S.ui[k]) S.ui[o] = true;   // 모바일: 서랍은 한 번에 하나만
  applyPanels(); saveSoon();
}
// 모바일: 편집 영역을 누르면 열린 서랍 닫기
$('center').addEventListener('pointerdown', () => {
  if (isMobile() && (!S.ui.lHide || !S.ui.rHide)) { S.ui.lHide = true; S.ui.rHide = true; applyPanels(); }
}, true);
function startResize(e, side) {
  e.preventDefault();
  const rz = e.currentTarget, wKey = side === 'L' ? 'lw' : 'rw', hKey = side === 'L' ? 'lHide' : 'rHide';
  const x0 = e.clientX, w0 = S.ui[hKey] ? 0 : S.ui[wKey];
  rz.setPointerCapture(e.pointerId); rz.classList.add('drag'); document.body.classList.add('resizing');
  const mv = ev => {
    const w = w0 + (side === 'L' ? ev.clientX - x0 : x0 - ev.clientX);
    if (w < 110) S.ui[hKey] = true;            // 충분히 좁히면 숨김
    else { S.ui[hKey] = false; S.ui[wKey] = clamp(w, 160, Math.min(520, innerWidth * 0.4)); }
    applyPanels();
  };
  const up = () => {
    rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up);
    rz.classList.remove('drag'); document.body.classList.remove('resizing'); saveSoon();
  };
  rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up);
}
$('rzL').addEventListener('pointerdown', e => startResize(e, 'L'));
$('rzR').addEventListener('pointerdown', e => startResize(e, 'R'));
$('rzL').addEventListener('dblclick', () => togglePanel('L'));
$('rzR').addEventListener('dblclick', () => togglePanel('R'));
$('toggleL').onclick = () => togglePanel('L');
$('toggleR').onclick = () => togglePanel('R');

// ───────── 컨트롤 연결 ─────────
document.querySelectorAll('[data-icon]').forEach(e => e.innerHTML = svg(e.dataset.icon));
// 로고: ./Asset/icon.png (없으면 기본 아이콘 유지)
document.querySelectorAll('[data-logo]').forEach(box => {
  const img = new Image(); img.className = 'logo-img'; img.alt = ''; img.draggable = false;
  img.onload = () => { box.innerHTML = ''; box.appendChild(img); box.classList.add('has-img'); };
  img.src = './Asset/icon.png';
});
document.querySelectorAll('button').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
const keySel = $('key');
keySel.add(new Option('크로매틱', 'off'));
for (let i = 0; i < 12; i++) keySel.add(new Option(`${ABC[i]} 장조 (${SOL[i]})`, String(i)));
keySel.value = S.key; $('bpm').value = S.bpm; $('grid').value = String(S.grid); $('labelMode').value = S.labelMode;
$('recBtn').onclick = record;
$('playBtn').onclick = () => mode === 'play' ? stop() : play();
$('stopBtn').onclick = stop;
$('homeBtn').onclick = () => { if (mode !== 'idle') stop(); playhead = 0; scroller.scrollLeft = 0; drawAll(); };
$('monBtn').onclick = monitor;
$('fileBtn').onclick = () => $('fileIn').click();
$('fileIn').addEventListener('change', e => { importAudioFile(e.target.files[0]); e.target.value = ''; });
['rpChange', 'rpVoice', 'rpMin', 'rpOnset', 'rpDrop'].forEach(id => $(id).addEventListener('input', reanalyzeSoon));
$('rpMelody').addEventListener('change', () => reanalyze(false));
['rpMode', 'rpQ', 'rpOct', 'rpPoly'].forEach(id => $(id).addEventListener('change', e => { e.target.blur(); reanalyze(false); }));
$('rpPlayRes').onclick = () => previewPlay('res');
$('rpPlayOrig').onclick = () => previewPlay('orig');
$('rpPlayBoth').onclick = () => previewPlay('both');
$('rpStop').onclick = () => { if (mode !== 'idle') stop(); };
$('rpApply').onclick = () => closePreview(true);
$('rpCancel').onclick = () => closePreview(false);
$('rpRedo').onclick = () => { const st = pendingRec.startStep; closePreview(false); playhead = st; record(); };
$('metroBtn').onclick = () => { S.metro = !S.metro; setButtons(); save(); };
$('countBtn').onclick = () => { S.countin = !S.countin; setButtons(); save(); };
$('undoBtn').onclick = undo; $('redoBtn').onclick = redo;
$('midiBtn').onclick = () => openExport();
$('scoreBtn').onclick = openScore;
$('zoomIn').onclick = () => setZoom(STEP_W * 1.25, ROW_H);
$('zoomOut').onclick = () => setZoom(STEP_W / 1.25, ROW_H);
$('helpBtn').onclick = () => $('help').classList.add('show');
{ // PC 설정 버튼(다운로드 왼쪽) → 스케일 · 건반 표기 · 격자 · 메트로놈 · 카운트인
  const pop = $('setPop'), btn = $('setBtn');
  const sync = () => {
    $('spGrid').value = $('grid').value;
    $('spMetro').classList.toggle('on', $('metroBtn').classList.contains('on'));
    $('spCount').classList.toggle('on', $('countBtn').classList.contains('on'));
  };
  const place = () => {
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.top = (r.bottom + 8) + 'px'; pop.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  };
  const close = () => { pop.classList.remove('show'); btn.classList.remove('on'); };
  btn.onclick = () => { if (pop.classList.contains('show')) return close(); sync(); pop.classList.add('show'); btn.classList.add('on'); place(); };
  $('setClose').onclick = close;
  $('spGrid').onchange = e => { const g = $('grid'); g.value = e.target.value; g.dispatchEvent(new Event('change', { bubbles: true })); e.target.blur(); };
  $('spMetro').onclick = () => { $('metroBtn').click(); sync(); };
  $('spCount').onclick = () => { $('countBtn').click(); sync(); };
  $('grid').addEventListener('change', sync);
  window.addEventListener('pointerdown', e => { if (pop.classList.contains('show') && !pop.contains(e.target) && !btn.contains(e.target)) close(); }, true);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('show')) { e.stopPropagation(); close(); } }, true);
  window.addEventListener('resize', () => { if (pop.classList.contains('show')) place(); });
}
{ // 전체화면 (fullscreen.js 공용: 페이지를 옮겨도 첫 터치에 다시 전체화면으로 이어짐)
  const mine = [$('fsBtn'), $('mpFs'), $('siFs')].filter(Boolean);
  const ic = { iconIn: svg('fsEnter'), iconOut: svg('fsExit') };
  if (window.TSFS) { mine.forEach(b => TSFS.bind(b, { ...ic, notify: toast })); TSFS.onChange(() => setTimeout(layout, 60)); }
}
$('help').onclick = () => $('help').classList.remove('show');
$('clearBtn').onclick = async () => {
  const t = activeTrack(), cnt = S.notes.filter(n => n.t === t.id).length;
  if (!cnt) return toast('현재 트랙에 노트가 없어요');
  if (!await confirmBox(`'${t.name}' 트랙의 노트 ${cnt}개를 모두 지울까요?`, '되돌리기(Ctrl+Z)로 복구할 수 있어요.', '모두 지우기')) return;
  if (mode !== 'idle') stop();
  pushUndo(); S.notes = S.notes.filter(n => n.t !== t.id); trace = []; sel = new Set(); save(); drawAll();
  toast(`'${t.name}' 트랙을 비웠어요 (되돌리기 가능)`);
};
$('bpm').onchange = e => { if (mode !== 'idle') stop(); S.bpm = clamp(+e.target.value || 100, 40, 240); e.target.value = S.bpm; save(); drawAll(); };
$('grid').onchange = e => { S.grid = +e.target.value; save(); drawAll(); };
keySel.onchange = e => { S.key = e.target.value; save(); drawAll(); };
$('labelMode').onchange = e => { S.labelMode = e.target.value; save(); drawAll(); };
['bpm', 'grid', 'key', 'labelMode'].forEach(id => $(id).addEventListener('change', () => $(id).blur()));
const gateMark = () => $('gateMark').style.left = meterPct(+$('gate').value) + '%';
$('gate').oninput = gateMark;

document.addEventListener('keydown', e => {
  if (scoreM.classList.contains('show')) return;   // 악보 창이 열린 동안 편집 단축키는 꺼요
  if (expM.classList.contains('show')) { if (e.key === 'Escape') { e.preventDefault(); closeExport(); } else if (e.key === 'Enter' && !/^(button|select)$/i.test(e.target.tagName)) { e.preventDefault(); $('xGo').click(); } return; }
  if (stepM.classList.contains('show')) return;   // 스텝 입력 창이 키보드를 독점
  if (mp.classList.contains('show') && !$('confirm').classList.contains('show')) {
    const tg = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape' && tg !== 'input') { if (ctx.classList.contains('show')) closeCtx(); else if (mp.classList.contains('selmode')) setSelMode(false); else openProject(LIB.cur); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) { e.preventDefault(); openMyPage(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); if (ENG.on) engAskSave(); else toast('저장했어요 (자동 저장도 항상 켜져 있어요)'); return; }
  if ($('confirm').classList.contains('show')) { if (e.key === 'Escape') closeConfirm(false); if (e.key === 'Enter') { e.preventDefault(); closeConfirm(true); } return; }
  if (modal.classList.contains('show')) { if (e.key === 'Escape') closeModal(); return; }
  if (accM.classList.contains('show')) {
    if (e.key === 'Escape') { e.preventDefault(); if (mode !== 'idle') stop(); else closeAccomp(); }
    else if (e.code === 'Space' && !['input', 'select'].includes((e.target.tagName || '').toLowerCase())) { e.preventDefault(); mode === 'play' ? stop() : accPreview(); }
    return;
  }
  if (pendingRec && !['input', 'select'].includes((e.target.tagName || '').toLowerCase())) {
    if (e.key === 'Escape') { e.preventDefault(); mode !== 'idle' ? stop() : closePreview(false); return; }
    if (e.key === 'Enter') { e.preventDefault(); closePreview(true); return; }
  }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod) {
    const acts = { z: () => e.shiftKey ? redo() : undo(), y: redo, c: () => copySel(), x: () => { if (copySel()) deleteSel(); },
      v: () => startPaste(), d: duplicate, a: () => { sel = new Set(S.notes.filter(n => n.t === S.active)); drawAll(); },
      '[': () => togglePanel('L'), g: () => groupIntoFolder(), ']': () => togglePanel('R'), b: () => e.shiftKey ? ungroupSel() : groupSel(), l: () => linkSel(),
      '=': () => setZoom(STEP_W * 1.25, ROW_H), '+': () => setZoom(STEP_W * 1.25, ROW_H), '-': () => setZoom(STEP_W / 1.25, ROW_H) };
    if (acts[k]) { e.preventDefault(); acts[k](); }
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) spaceDown(); return; }
  if (e.key === 'Escape') {
    if (pasting) return endPaste();
    if (ctx.classList.contains('show')) return closeCtx();
    if ($('help').classList.contains('show')) return $('help').classList.remove('show');
    if (mode === 'idle' && sel.size) { sel = new Set(); drawAll(); } else stop();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); return; }
  const ad = !e.altKey && (k === 'a' || k === 'd') ? (k === 'a' ? 'ArrowLeft' : 'ArrowRight') : null;   // A/D = ←/→
  if (e.key.startsWith('Arrow') || ad) {
    const key = ad || e.key;
    e.preventDefault();
    if (pasting || !sel.size || mode !== 'idle') {   // 화면 이동
      const big = e.shiftKey ? 4 : 1;
      const dx = { ArrowLeft: -1, ArrowRight: 1 }[key] || 0, dy = { ArrowUp: -1, ArrowDown: 1 }[key] || 0;
      scroller.scrollLeft += dx * Math.max(60, STEP_W * 4) * big;
      scroller.scrollTop += dy * ROW_H * 3 * big;
      return;
    }
    const g = S.grid, oct = e.shiftKey ? 12 : 1;
    const [ds, dp] = { ArrowLeft: [-g, 0], ArrowRight: [g, 0], ArrowUp: [0, oct], ArrowDown: [0, -oct] }[key];
    pushUndo(); applyMove(snapOrig(), ds, dp);
    if (dp) preview([...sel][0].p);
    save(); drawAll(); return;
  }
  if (e.key === 'Enter' && isVocalTrack(activeTrack()) && mode === 'idle') {   // 보컬: 가사 입력
    e.preventDefault();
    const mine = trackNotesSorted(S.active), picked = mine.filter(n => sel.has(n));
    const n = picked[0] || mine.find(n => n.s + n.l > playhead) || mine[0];
    if (n) editLyric(n); else toast('먼저 멜로디 노트를 그려 주세요');
    return;
  }
  if (k === 'r' && e.shiftKey) { record(); return; }
  if (k === 'j') { openAccomp(); return; }
  if (k === 'k' || e.code === 'KeyK') { openStepInput(); return; }
  if (k === 'p' && !e.repeat) { inspPreview(); return; }
  const toolKeys = { q: 'hand', w: 'select', e: 'pen', r: 'eraser', t: 'range', y: 'picker' };
  if (toolKeys[k] && !e.altKey) { setTool(toolKeys[k]); return; }
});
document.addEventListener('keyup', e => { if (stepM.classList.contains('show')) return; if (e.code === 'Space') { e.preventDefault(); spaceUp(false); } });
window.addEventListener('resize', () => { layout(); placePal(); });
window.__relayout = () => { layout(); placePal(); };   // 스크립트 바깥(화면 고정 블록)에서도 레이아웃을 다시 잡을 수 있게

// ───────── Thaniya Engine 연동 (엔진 「음악 만들기」 창 안에서 ?engine=1 로 열렸을 때) ─────────
// 엔진 → 랩  thaniya-engine:hello · thaniya-engine:load-song {token,name,aid,project} · thaniya-engine:request-export {rid,loop} · thaniya-engine:saved {lib,id,name}
// 랩 → 엔진  soundlab:ready · soundlab:loaded {token,name} · soundlab:load-error {token,msg}
//            soundlab:export {rid,lib,name,project,wav,dur,size,mime,loop} · soundlab:export-error {rid,msg} · soundlab:save (엔진에 저장 버튼 · Ctrl+S)
// 엔진이 올라가 있는 주소만 받습니다. 엔진을 다른 주소에 올리면 여기에 추가하세요.
// 'null' = 내 컴퓨터에서 파일로 연 엔진 (file://) · localhost · 같은 네트워크(192.168.x.x 등)의 테스트 서버도 허용
const ENG_ORIGINS = [/^https:\/\/architect0509\.github\.io$/, /^https:\/\/(www\.)?thaniya\.co\.kr$/, /^null$/, /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/];
const ENG = { on: new URLSearchParams(location.search).has('engine') && window.parent !== window, origin: null, busy: false };
function engPost(msg, data = true) {
  if (!ENG.on) return false;
  if (data && !ENG.origin) return false;   // 곡 데이터는 연결이 확인된 엔진에게만
  try { window.parent.postMessage(msg, data && ENG.origin !== 'null' ? ENG.origin : '*'); return true; } catch (e) { return false; }
}
let engState = '';
function engTag(txt) { engState = txt; }
// 엔진에서 「음악 만들기」로 열 때마다 새 곡 (지난번에 열고 아무것도 안 쓴 빈 곡은 정리)
function engNewProject() {
  const empty = i => { const p = lsGet(PROJ(i.id)); return !p || !(p.notes || []).length; };
  LIB.items.filter(i => i.engNew && i.id !== LIB.cur && empty(i)).forEach(i => {
    LIB.items = LIB.items.filter(x => x !== i); try { localStorage.removeItem(PROJ(i.id)); } catch (e) {}
  });
  const cur = curItem();
  if (cur && !cur.eng && !S.notes.length) { cur.engNew = true; lsSet(LIB_KEY, LIB); updateSongTitle(); return; }   // 지금 곡이 비어 있으면 그대로 사용
  const id = addProject(blankProject(), '새 곡'); if (!id) return;
  LIB.items.find(i => i.id === id).engNew = true; lsSet(LIB_KEY, LIB);
  openProject(id, true);
}
// 엔진 프로젝트에 들어 있는 곡(오디오 에셋에 함께 저장된 SoundLab 데이터)을 열어 수정
function engLoadSong(d) {
  const token = d.token;
  try {
    let proj = d.project;
    if (proj && proj.format === 'thaniya-soundlab') proj = proj.project;
    if (!proj || !Array.isArray(proj.notes) || !Array.isArray(proj.tracks) || !proj.tracks.length) throw new Error('SoundLab 곡 데이터가 아니에요');
    const P = pickProject(Object.assign(blankProject(), JSON.parse(JSON.stringify(proj))));
    const name = String(d.name || '엔진 음악').slice(0, 40), aid = typeof d.aid === 'string' ? d.aid : null;
    if (mode !== 'idle') stop();
    if (pendingRec) closePreview(false);
    let it = aid && LIB.items.find(i => i.eng === aid);
    if (it) {   // 같은 엔진 오디오를 전에 연 적이 있으면 그 곡을 엔진 쪽 내용으로 덮어씀 (엔진에 저장된 쪽이 기준)
      if (it.id !== LIB.cur) save();
      if (!lsSet(PROJ(it.id), P)) throw new Error('브라우저 저장 공간이 부족해요');
      it.name = name; it.updated = Date.now(); delete it.engNew; lsSet(LIB_KEY, LIB);
    } else {
      const id = addProject(P, name); if (!id) throw new Error('브라우저 저장 공간이 부족해요');
      it = LIB.items.find(i => i.id === id); if (aid) it.eng = aid; lsSet(LIB_KEY, LIB);
    }
    openProject(it.id, true, true);
    engPost({ type: 'soundlab:loaded', token, lib: it.id, name: it.name });
    engTag('edit'); $('engSaveBtn').title = `Thaniya Engine의 '${name}'을(를) 수정하고 있어요 · 누르면 엔진의 원본 오디오가 바뀌어요 (Ctrl+S)`;
    toast(`엔진의 '${name}'을(를) 불러왔어요 · 고친 뒤 '엔진에 저장'`);
  } catch (e) {
    engPost({ type: 'soundlab:load-error', token, msg: e.message });
    toast('곡을 불러오지 못했어요: ' + e.message);
  }
}
// 곡 전체를 오프라인으로 렌더링 → WAV (뮤트 · 솔로 상태 그대로)
async function renderSongWav(loop, onProg, fmt, kbps) {
  const prog = p => { try { onProg && onProg(p); } catch (e) {} };
  const playable = S.notes.filter(n => audible(trk(n.t)));
  if (!playable.length) throw new Error('저장할 노트가 없어요 (뮤트/솔로 상태도 확인해 보세요)');
  const ss = stepSec(); let endStep = 0;
  for (const n of playable) endStep = Math.max(endStep, n.s + n.l);
  if (loop) endStep = Math.ceil(endStep / 16) * 16;   // 반복용: 마디 끝에서 자름
  const lead = loop ? 0 : playable.some(n => isVocalTrack(trk(n.t))) ? KV.PRE : 0.03, body = lead + endStep * ss, TAIL = 3, total = body + TAIL;
  if (total > 330) throw new Error('곡이 너무 길어요 (5분 정도까지 저장할 수 있어요)');
  const sr = fmt === 'mp3' || total <= 130 ? 44100 : total <= 200 ? 32000 : 22050;   // 엔진 오디오 한도(25MB) 안에 들어오게
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) throw new Error('이 브라우저에서는 오디오로 만들 수 없어요');
  const oc = new OAC(2, Math.ceil(total * sr), sr);
  const keep = { ac, master, revIn, noiseBuf, buses: Object.assign({}, buses) }, before = new Set(voices);
  try {   // 같은 신스 코드를 오프라인 컨텍스트로 잠깐 돌려서 예약
    ac = oc; ({ master, revIn } = mkMaster(oc)); noiseBuf = null;
    Object.keys(buses).forEach(k => delete buses[k]);
    buildGlides(playable, 0);
    for (const n of playable) tone(n.p, lead + n.s * ss, n.l * ss, trk(n.t), n.v ?? 1, n);
  } finally {
    ac = keep.ac; master = keep.master; revIn = keep.revIn; noiseBuf = keep.noiseBuf;
    Object.keys(buses).forEach(k => delete buses[k]); Object.assign(buses, keep.buses);
    for (const o of [...voices]) if (!before.has(o)) voices.delete(o);   // 정지 버튼이 렌더링을 끊지 않게
  }
  if (oc.suspend) {   // 렌더링 진행률: 20번 잠깐 멈춰서 알려 줌
    const N = 20, q = 128 / sr, done = new Set();
    for (let i = 1; i < N; i++) {
      const t = Math.round(total * i / N / q) * q; if (t <= 0 || t >= total || done.has(t)) continue; done.add(t);
      oc.suspend(t).then(() => { prog(i / N * 0.9); oc.resume(); }).catch(() => {});
    }
  }
  prog(0);
  const buf = await oc.startRendering();
  prog(0.9); await yieldUI();
  const chs = [buf.getChannelData(0), buf.getChannelData(1)];
  let len;
  if (loop) {   // 잔향 꼬리를 곡 앞쪽에 겹쳐서 반복할 때 끊김 없이
    len = Math.max(1, Math.round(body * sr));
    for (let c = 0; c < 2; c++) { const d = chs[c], o = new Float32Array(len); for (let i = 0; i < d.length; i++) o[i % len] += d[i]; chs[c] = o; }
  } else {      // 끝의 무음 잘라내기
    let last = 0; for (const d of chs) for (let i = d.length - 1; i > last; i--) if (Math.abs(d[i]) > 0.0005) { last = i; break; }
    len = Math.min(buf.length, Math.max(Math.round(body * sr), last + Math.round(0.15 * sr)));
  }
  let peak = 0; for (const d of chs) for (let i = 0; i < len; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
  const g = peak > 0.98 ? 0.98 / peak : 1;
  if (fmt === 'mp3') { const blob = await encodeMp3(chs, len, sr, g, prog, kbps); return { blob, dur: len / sr, size: blob.size }; }
  // 16비트 PCM WAV
  const bytes = 44 + len * 4, ab = new ArrayBuffer(bytes), v = new DataView(ab);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, len * 4, true);
  for (let i = 0, o = 44; i < len; i++) for (let c = 0; c < 2; c++, o += 2) { const x = clamp(chs[c][i] * g, -1, 1); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  prog(0.96); await yieldUI();
  const blob = new Blob([ab], { type: 'audio/wav' });
  const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('오디오를 읽지 못했어요')); r.readAsDataURL(blob); });
  return { url, dur: len / sr, size: blob.size };
}
// ───────── MP3 내보내기 (lamejs · 128kbps 스테레오) ─────────
let lamePromise = null;
function loadLame() {   // lame.min.js 또는 lame.min.js.txt (둘 중 있는 것)
  if (window.lamejs && window.lamejs.Mp3Encoder) return Promise.resolve();
  const V = '?v=20261119', ok = () => window.lamejs && window.lamejs.Mp3Encoder;
  const one = names => new Promise((res, rej) => {
    if (!names.length) return rej(new Error('lame.min.js 파일을 찾을 수 없어요 (edit.html과 같은 폴더에 두세요)'));
    const sc = document.createElement('script'); sc.src = names[0] + V;
    sc.onload = () => ok() ? res() : rej(new Error('MP3 인코더를 불러오지 못했어요'));
    sc.onerror = () => { sc.remove(); fetch(names[0] + V).then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(t => { const s2 = document.createElement('script'); s2.text = t; document.head.appendChild(s2); ok() ? res() : rej(new Error('MP3 인코더를 불러오지 못했어요')); })
      .catch(() => one(names.slice(1)).then(res, rej)); };
    document.head.appendChild(sc);
  });
  if (!lamePromise) lamePromise = one(['lame.min.js', 'lame.min.js.txt']).catch(e => { lamePromise = null; throw e; });
  return lamePromise;
}
async function encodeMp3(chs, len, sr, g, prog, kbps = 192) {
  await loadLame();
  const enc = new lamejs.Mp3Encoder(2, sr, kbps), parts = [], B = 1152 * 8, L = new Int16Array(B), R = new Int16Array(B);
  const cv = x => { x = x * g; x = x < -1 ? -1 : x > 1 ? 1 : x; return x < 0 ? x * 0x8000 : x * 0x7fff; };
  for (let i = 0, k = 0; i < len; i += B, k++) {
    const n = Math.min(B, len - i);
    for (let j = 0; j < n; j++) { L[j] = cv(chs[0][i + j]); R[j] = cv(chs[1][i + j]); }
    const out = enc.encodeBuffer(n < B ? L.subarray(0, n) : L, n < B ? R.subarray(0, n) : R);
    if (out.length) parts.push(out);
    if (k % 12 === 0) { prog(0.9 + 0.1 * i / len); await yieldUI(); }
  }
  const tail = enc.flush(); if (tail.length) parts.push(tail);
  prog(1);
  return new Blob(parts, { type: 'audio/mpeg' });
}
async function exportMp3(kbps = 192) {
  if (ENG.busy) return toast('이미 오디오로 만드는 중이에요');
  if (pendingRec) return toast('노트 변환 미리보기를 먼저 적용하거나 취소해 주세요');
  if (mode !== 'idle') stop();
  ENG.busy = true; $('midiBtn').classList.add('busy');
  try {
    save();
    const it = curItem(); let last = -1;
    toast('MP3로 만드는 중… 0%');
    const r = await renderSongWav(false, p => { const pct = Math.floor(p * 10) * 10; if (pct !== last) { last = pct; toast(`MP3로 만드는 중… ${pct}%`); } }, 'mp3', kbps);
    downloadBlob(r.blob, safeName(it ? it.name : '곡') + '.mp3');
    toast(`MP3(${kbps}kbps)를 저장했어요 (${Math.floor(r.dur / 60)}:${String(Math.round(r.dur % 60)).padStart(2, '0')} · ${(r.size / 1048576).toFixed(1)}MB)`);
  } catch (e) { toast(e.message || 'MP3로 만들지 못했어요'); }
  finally { ENG.busy = false; $('midiBtn').classList.remove('busy'); }
}

// ───────── 악보 만들기: 다중 악기 악보 / 피아노 악보(큰보표) · 드럼(비트) 트랙은 빼요 ─────────
const SC = { mode: 'multi', off: new Set(), pages: [] };
const SC_W = 900, SC_H = 1273, SC_SP = 8, SC_ML = 50, SC_MR = 50;   // A4 비율 페이지 · 줄 간격 8
const SC_FONT = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const SC_SYM = "'Segoe UI Symbol','Noto Music','DejaVu Sans',sans-serif";
const scEsc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SC_FLATKEYS = { 5: 1, 10: 2, 3: 3, 8: 4, 1: 5 }, SC_SHARPKEYS = { 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6 };
const SC_SHARP_ORD = [3, 0, 4, 1, 5, 2, 6], SC_FLAT_ORD = [6, 2, 5, 1, 4, 0, 3];   // 글자 번호 (C=0 … B=6)
const SC_SHARP_D = [38, 35, 39, 36, 33, 37, 34], SC_FLAT_D = [34, 37, 33, 36, 32, 35, 31];   // 높은음자리표 위치
function scKey() {   // 조표: {n, flat, alt[글자] = +1/-1}
  const k = S.key === 'off' ? -1 : +S.key, alt = [0, 0, 0, 0, 0, 0, 0];
  if (SC_SHARPKEYS[k]) { const n = SC_SHARPKEYS[k]; SC_SHARP_ORD.slice(0, n).forEach(l => alt[l] = 1); return { n, flat: false, alt }; }
  if (SC_FLATKEYS[k]) { const n = SC_FLATKEYS[k]; SC_FLAT_ORD.slice(0, n).forEach(l => alt[l] = -1); return { n, flat: true, alt }; }
  return { n: 0, flat: false, alt };
}
const SC_SP_SHARP = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
const SC_SP_FLAT = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
function scSpell(p, key) { const [l, a] = (key.flat ? SC_SP_FLAT : SC_SP_SHARP)[p % 12]; return { l, a, d: (Math.floor(p / 12) - 1) * 7 + l }; }

function scStaves(mode) {
  const tracks = S.tracks.filter(t => !isDrumTrack(t) && !SC.off.has(t.id));
  const q = n => ({ p: n.p, s: Math.max(0, Math.round(n.s)), l: Math.max(1, Math.round(n.l)), ly: n.ly });
  if (mode === 'piano') {
    const all = S.notes.filter(n => tracks.some(t => t.id === n.t)).map(q);
    if (!all.length) return [];
    return [{ name: '피아노', clef: 'g', notes: all.filter(n => n.p >= 60) }, { name: '', clef: 'f', notes: all.filter(n => n.p < 60) }];
  }
  return tracks.map(t => {
    const ns = S.notes.filter(n => n.t === t.id).map(q);
    return { name: t.name, clef: ns.length && median(ns.map(n => n.p)) < 57 ? 'f' : 'g', notes: ns, vocal: isVocalTrack(t) };
  }).filter(st => st.notes.length);
}
function scEvents(notes, total) {   // 같은 시점에 시작하는 음 = 화음, 다음 음이 나오면 끊어요
  const by = new Map(); notes.forEach(n => { if (!by.has(n.s)) by.set(n.s, []); by.get(n.s).push(n); });
  const on = [...by.keys()].sort((a, b) => a - b), ev = []; let t = 0;
  on.forEach((s, i) => {
    if (s > t) ev.push({ s: t, l: s - t, rest: true });
    const ch = by.get(s); let l = Math.max(...ch.map(n => n.l)); if (on[i + 1] != null) l = Math.min(l, on[i + 1] - s);
    ev.push({ s, l, ps: [...new Set(ch.map(n => n.p))].sort((a, b) => a - b), ly: (ch.find(n => n.ly) || {}).ly });
    t = s + l;
  });
  if (t < total) ev.push({ s: t, l: total - t, rest: true });
  return ev;
}
function scFit(v, pos, rest) {   // 마디 안 pos(16분음표 칸)에서 길이 v를 쓸 수 있는지 (박에 맞춰 나눔)
  if (pos + v > 16) return false;
  if (v === 12) return !rest && pos % 4 === 0;
  if (v === 6) return !rest && pos % 2 === 0 && (pos >= 8 || pos + 6 <= 8 || pos === 2);
  if (v === 3) return !rest;
  return pos % v === 0;
}
function scPieces(ev) {   // 마디 단위로 자르고 음표 길이로 나눔 (넘어가면 붙임줄)
  const out = [];
  ev.forEach(e => {
    let t = e.s; const end = e.s + e.l; let first = true;
    while (t < end) {
      const m = Math.floor(t / 16), pos = t % 16, chunk = Math.min(end - t, 16 - pos);
      if (e.rest && pos === 0 && chunk === 16) { out.push({ m, pos, v: 16, rest: true, whole: true }); t += 16; continue; }
      let c = 0;
      while (c < chunk) {
        const v = [16, 12, 8, 6, 4, 3, 2, 1].find(v => v <= chunk - c && scFit(v, pos + c, e.rest)) || 1;
        const last = t + c + v >= end;
        out.push({ m, pos: pos + c, v, rest: !!e.rest, ps: e.ps, tie: !e.rest && !last, ly: first ? e.ly : null });
        first = false; c += v;
      }
      t += chunk;
    }
  });
  return out;
}
// ── 그리기 도구 ──
const scLine = (x1, y1, x2, y2, w = 1, c = '#111') => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}"/>`;
function scClef(c, x, y0) {   // y0 = 맨 윗줄
  if (c === 'g') return `<g transform="translate(${x},${y0 - 9})" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11.5 48 C11 36 13.5 18 13 6 C12.8 0 16.5 -1 17 3 C17.8 9 11 14 7 20 C3 26 4 34 10 35.5 C16 37 19.5 31 17 27 C15 23 9.5 24 10 29" stroke-width="2.1"/>
    <circle cx="9.3" cy="46" r="2.3" fill="#111" stroke="none"/></g>`;
  return `<g transform="translate(${x},${y0})"><circle cx="5" cy="8" r="2.8" fill="#111"/>
    <path d="M5 8 C5 1.5 18 -0.5 18.5 9.5 C19 18 11 25 3 29" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="23" cy="4" r="1.5" fill="#111"/><circle cx="23" cy="12" r="1.5" fill="#111"/></g>`;
}
const scYof = (d, clef, y0) => y0 + ((clef === 'g' ? 38 : 26) - d) * SC_SP / 2;
function scKeySig(key, clef, x, y0) {
  let o = ''; const ds = key.flat ? SC_FLAT_D : SC_SHARP_D;
  for (let i = 0; i < key.n; i++) { const y = scYof(ds[i] - (clef === 'f' ? 14 : 0), clef, y0); o += `<text x="${x + i * 9}" y="${y + (key.flat ? 3 : 5)}" font-size="${key.flat ? 17 : 16}" font-family="${SC_SYM}" text-anchor="middle">${key.flat ? '♭' : '♯'}</text>`; }
  return o;
}
function scRest(v, x, y0) {
  const my = y0 + 16;
  if (v === 16) return `<rect x="${x - 6}" y="${y0 + 8}" width="12" height="4.5" fill="#111"/>`;
  if (v >= 8) return `<rect x="${x - 6}" y="${y0 + 11.5}" width="12" height="4.5" fill="#111"/>`;
  if (v >= 4) return `<path d="M${x - 2} ${my - 11} l5 6 l-5 5 l5 6 c-4 -2 -6 1 -2 5" fill="none" stroke="#111" stroke-width="2.3" stroke-linejoin="round"/>`;
  const one = (dy) => `<circle cx="${x - 2.5}" cy="${my - 4 + dy}" r="2" fill="#111"/><path d="M${x - 2.5} ${my - 3 + dy} Q${x + 1} ${my - 2 + dy} ${x + 4} ${my - 6 + dy}" fill="none" stroke="#111" stroke-width="1.4"/>`;
  return `<path d="M${x + 4} ${my - 6} L${x - 1} ${my + 10}" stroke="#111" stroke-width="1.5"/>` + one(0) + (v <= 1 ? one(7) : '');
}
// 한 보표의 한 마디
function scDrawMeasure(st, pcs, mx, mw, y0, key, ties) {
  let o = ''; const acc = {}, xOf = pos => mx + 14 + pos / 16 * (mw - 22);
  for (const pc of pcs) {
    const x = xOf(pc.pos);
    if (pc.rest) { o += scRest(pc.v, pc.whole ? mx + mw / 2 : x, y0); continue; }
    const heads = pc.ps.map(p => { const sp = scSpell(p, key); return { p, ...sp, y: scYof(sp.d, st.clef, y0) }; });
    const mid = st.clef === 'g' ? 34 : 22, avg = heads.reduce((a, h) => a + h.d, 0) / heads.length, up = avg < mid;
    const hollow = pc.v >= 8, dotted = pc.v === 12 || pc.v === 6 || pc.v === 3;
    heads.forEach((h, i) => {
      const cur = acc[h.d] ?? key.alt[h.l];   // 마디 안 임시표 기억
      if (cur !== h.a) { acc[h.d] = h.a; o += `<text x="${x - 12}" y="${h.y + (h.a < 0 ? 3 : 5)}" font-size="${h.a < 0 ? 16 : 15}" font-family="${SC_SYM}" text-anchor="middle">${h.a > 0 ? '♯' : h.a < 0 ? '♭' : '♮'}</text>`; }
      const top = st.clef === 'g' ? 38 : 26, bot = top - 8;   // 덧줄
      for (let d = bot - 2; d >= h.d; d -= 2) o += scLine(x - 8, scYof(d, st.clef, y0), x + 8, scYof(d, st.clef, y0), 1.2);
      for (let d = top + 2; d <= h.d; d += 2) o += scLine(x - 8, scYof(d, st.clef, y0), x + 8, scYof(d, st.clef, y0), 1.2);
      const second = i > 0 && heads[i - 1].d === h.d - 1 && !heads[i - 1].shift;   // 2도 화음은 옆으로 비켜서
      if (second) h.shift = true; const hx = x + (second ? (up ? 9 : -9) : 0);
      o += `<ellipse cx="${hx}" cy="${h.y}" rx="4.7" ry="3.4" transform="rotate(-22 ${hx} ${h.y})" ${hollow ? 'fill="#fff" stroke="#111" stroke-width="1.6"' : 'fill="#111"'}/>`;
      if (dotted) o += `<circle cx="${x + 9 + (heads.some(k => k.shift) ? 9 : 0)}" cy="${h.y - ((h.d % 2 === (st.clef === 'g' ? 0 : 0)) ? 0 : 0) - (((st.clef === 'g' ? 38 : 26) - h.d) % 2 === 0 ? SC_SP / 2 : 0)}" r="1.7" fill="#111"/>`;
      const key2 = h.p; if (ties[key2] && ties[key2].cont) { const t0 = ties[key2]; o += `<path d="M${x - 24} ${h.y + (t0.up ? 5 : -5)} Q${x - 15} ${h.y + (t0.up ? 11 : -11)} ${x - 6} ${h.y + (t0.up ? 5 : -5)}" fill="none" stroke="#111" stroke-width="1.3"/>`; delete ties[key2]; }
      if (ties[key2]) { const t0 = ties[key2]; o += `<path d="M${t0.x + 6} ${t0.y + (t0.up ? 5 : -5)} Q${(t0.x + x) / 2} ${t0.y + (t0.up ? 12 : -12)} ${x - 6} ${h.y + (t0.up ? 5 : -5)}" fill="none" stroke="#111" stroke-width="1.3"/>`; delete ties[key2]; }
      if (pc.tie) ties[h.p] = { x, y: h.y, up };
    });
    if (pc.v < 16) {   // 기둥 + 꼬리
      const ys = heads.map(h => h.y), lo = Math.max(...ys), hi = Math.min(...ys);
      const sx = up ? x + 4.4 : x - 4.4, sy0 = up ? lo : hi, sy1 = up ? Math.min(hi - 28, y0 + 16) : Math.max(lo + 28, y0 + 16);
      o += scLine(sx, sy0, sx, sy1, 1.3);
      const nf = pc.v === 1 ? 2 : (pc.v === 2 || pc.v === 3) ? 1 : 0;
      for (let f = 0; f < nf; f++) { const fy = sy1 + (up ? f * 7 : -f * 7); o += up ? `<path d="M${sx} ${fy} C${sx + 1} ${fy + 7} ${sx + 9} ${fy + 8} ${sx + 6} ${fy + 17}" fill="none" stroke="#111" stroke-width="1.8"/>` : `<path d="M${sx} ${fy} C${sx + 1} ${fy - 7} ${sx + 9} ${fy - 8} ${sx + 6} ${fy - 17}" fill="none" stroke="#111" stroke-width="1.8"/>`; }
    }
    if (st.vocal && pc.ly) o += `<text x="${x}" y="${y0 + 32 + 20}" font-size="11" font-family="${SC_FONT}" text-anchor="middle" fill="#222">${scEsc(pc.ly)}</text>`;
  }
  return o;
}
function scBuild(mode) {
  const staves = scStaves(mode); if (!staves.length) return [];
  const key = scKey(), piano = mode === 'piano';
  let total = 16; staves.forEach(st => st.notes.forEach(n => total = Math.max(total, n.s + n.l)));
  total = Math.ceil(total / 16) * 16; const M = total / 16;
  staves.forEach(st => { st.pcs = scPieces(scEvents(st.notes, total)); st.byM = Array.from({ length: M }, () => []); st.pcs.forEach(p => st.byM[p.m].push(p)); });
  // 마디 너비: 가장 짧은 음표에 맞춰서
  const mws = Array.from({ length: M }, (_, m) => { const mv = Math.min(16, ...staves.flatMap(st => st.byM[m].filter(p => !p.whole).map(p => p.v))); return 30 + 16 * (mv >= 4 ? 6 : mv >= 2 ? 9 : 12.5); });
  const nameW = piano ? 34 : 86, nameW2 = piano ? 34 : 46;
  const head = first => 12 + 32 + key.n * 9 + (first ? 26 : 6);
  const systems = []; let m = 0;
  while (m < M) {
    const first = !systems.length, x0 = SC_ML + (first ? nameW : nameW2), avail = SC_W - SC_MR - x0 - head(first);
    let w = 0, ms = [];
    while (m < M && (w + mws[m] <= avail || !ms.length)) { w += mws[m]; ms.push(m); m++; }
    const stretch = m < M || w / avail > 0.62 ? avail / w : 1;
    systems.push({ first, x0, ms, ws: ms.map(i => mws[i] * stretch) });
  }
  // 세로 배치
  const gap = piano ? 70 : 74, lyr = st => st.vocal ? 18 : 0;
  const sysH = staves.reduce((a, st, i) => a + 32 + (i < staves.length - 1 ? gap - 32 + lyr(st) : lyr(st)), 0);
  const pages = []; let cur = null, y = 0;
  const title = (curItem() || {}).name || '제목 없음';
  const newPage = () => { cur = { body: '' }; pages.push(cur); y = pages.length === 1 ? 150 : 60; };
  newPage();
  const ties = staves.map(() => ({}));
  systems.forEach((sy, si) => {
    if (y + sysH + 40 > SC_H - 50 && y > 160) newPage();
    let o = '', yy = y; const tops = [];
    staves.forEach((st, k) => {
      tops.push(yy);
      const xEnd = sy.x0 + head(sy.first) + sy.ws.reduce((a, b) => a + b, 0);
      for (let l = 0; l < 5; l++) o += scLine(sy.x0, yy + l * SC_SP, xEnd, yy + l * SC_SP, 1);
      o += scClef(st.clef, sy.x0 + 6, yy) + scKeySig(key, st.clef, sy.x0 + 42, yy);
      if (sy.first) o += `<text x="${sy.x0 + 46 + key.n * 9 + 6}" y="${yy + 15}" font-size="19" font-weight="800" font-family="Georgia,serif" text-anchor="middle">4</text><text x="${sy.x0 + 46 + key.n * 9 + 6}" y="${yy + 31}" font-size="19" font-weight="800" font-family="Georgia,serif" text-anchor="middle">4</text>`;
      if (!piano && st.name) o += `<text x="${sy.x0 - 10}" y="${yy + 20}" font-size="${sy.first ? 12 : 10.5}" font-family="${SC_FONT}" text-anchor="end" fill="#222">${scEsc(sy.first ? st.name : st.name.slice(0, 4))}</text>`;
      let mx = sy.x0 + head(sy.first);
      sy.ms.forEach((mi, j) => {
        const mw = sy.ws[j];
        o += scDrawMeasure(st, st.byM[mi], mx, mw, yy, key, ties[k]);
        mx += mw;
        if (!piano) o += scLine(mx, yy, mx, yy + 32, mi === M - 1 ? 3 : 1.1);
      });
      for (const p in ties[k]) { const t = ties[k][p]; if (t.cont) continue; o += `<path d="M${t.x + 6} ${t.y + (t.up ? 5 : -5)} Q${(t.x + mx) / 2} ${t.y + (t.up ? 12 : -12)} ${mx - 2} ${t.y + (t.up ? 6 : -6)}" fill="none" stroke="#111" stroke-width="1.3"/>`; ties[k][p] = { cont: true, up: t.up }; }   // 줄 끝으로 넘어가는 붙임줄
      yy += 32 + gap - 32 + lyr(st);
    });
    const yTop = tops[0], yBot = tops[tops.length - 1] + 32;
    o += scLine(sy.x0, yTop, sy.x0, yBot, 1.2);   // 줄 맨 앞 세로줄
    if (piano) {
      let mx = sy.x0 + head(sy.first);
      sy.ms.forEach((mi, j) => { mx += sy.ws[j]; o += scLine(mx, yTop, mx, yBot, mi === M - 1 ? 3 : 1.1); });
      const h = yBot - yTop;   // 중괄호
      o += `<path d="M${sy.x0 - 6} ${yTop} C${sy.x0 - 16} ${yTop + h * 0.08} ${sy.x0 - 4} ${yTop + h * 0.4} ${sy.x0 - 14} ${yTop + h / 2} C${sy.x0 - 4} ${yTop + h * 0.6} ${sy.x0 - 16} ${yTop + h * 0.92} ${sy.x0 - 6} ${yBot}" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>`;
    } else if (staves.length > 1) o += `<rect x="${sy.x0 - 6}" y="${yTop - 2}" width="3.2" height="${yBot - yTop + 4}" fill="#111"/>`;
    if (!sy.first) o += `<text x="${sy.x0 + 2}" y="${yTop - 10}" font-size="10" font-family="Georgia,serif" fill="#555">${sy.ms[0] + 1}</text>`;
    cur.body += o; y = yy - (gap - 32) + 44;
  });
  // 페이지 머리 · 번호
  return pages.map((pg, i) => {
    let hd = '';
    if (i === 0) hd = `<text x="${SC_W / 2}" y="78" font-size="26" font-weight="800" font-family="${SC_FONT}" text-anchor="middle">${scEsc(title)}</text>
      <text x="${SC_W / 2}" y="104" font-size="12" font-family="${SC_FONT}" text-anchor="middle" fill="#555">${piano ? '피아노 악보' : '다중 악기 악보'} · Thaniya-SoundLab</text>
      <text x="${SC_ML}" y="134" font-size="13" font-family="${SC_FONT}" fill="#222"><tspan font-family="${SC_SYM}">♩</tspan> = ${S.bpm}</text>`;
    const foot = pages.length > 1 ? `<text x="${SC_W / 2}" y="${SC_H - 24}" font-size="11" font-family="Georgia,serif" text-anchor="middle" fill="#777">${i + 1} / ${pages.length}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SC_W} ${SC_H}" width="${SC_W}" height="${SC_H}"><rect width="${SC_W}" height="${SC_H}" fill="#fff"/>${hd}${pg.body}${foot}</svg>`;
  });
}
// ── 창 ──
const scoreM = document.createElement('div'); scoreM.id = 'scoreM';
scoreM.innerHTML = `<div class="scCard" role="dialog" aria-label="악보 만들기">
  <div class="scHead"><b>악보 만들기</b><span class="scSong" id="scSong"></span><span style="flex:1"></span><button class="ib" id="scClose" title="닫기 (Esc)">✕</button></div>
  <div class="scBar">
    <div class="scSec">1. 악보 종류</div>
    <div class="scModes"><button class="scMode" data-m="multi" type="button">다중 악기 악보</button><button class="scMode" data-m="piano" type="button">피아노 악보</button></div>
    <div class="scSec">2. 악보에 넣을 트랙 <span class="scAll"><button type="button" id="scAllOn">모두</button><button type="button" id="scAllOff">모두 빼기</button></span></div>
    <div class="scTracks" id="scTracks"></div>
  </div>
  <div class="scNote" id="scNote"></div>
  <div class="scView" id="scView"></div>
  <div class="scFoot"><span class="scCnt" id="scCnt"></span><span style="flex:1"></span><button class="btn" id="scCancel" type="button">닫기</button><button class="btn primary" id="scPdf" type="button">PDF로 만들기</button></div>
</div>`;
document.body.appendChild(scoreM);
function scRender() {
  scoreM.querySelectorAll('.scMode').forEach(b => b.classList.toggle('on', b.dataset.m === SC.mode));
  const tr = $('scTracks'); tr.innerHTML = '';
  const cand = S.tracks.filter(t => !isDrumTrack(t) && S.notes.some(n => n.t === t.id));
  cand.forEach(t => {
    const b = el('button', 'scTr' + (SC.off.has(t.id) ? '' : ' on')); b.type = 'button'; b.style.setProperty('--c', t.color || '#5fa8ff');
    b.innerHTML = '<span class="scCk">' + svg('check') + '</span><span class="scTn"></span>'; b.querySelector('.scTn').textContent = t.name;
    b.title = SC.off.has(t.id) ? '악보에 넣기' : '악보에서 빼기';
    b.onclick = () => { SC.off.has(t.id) ? SC.off.delete(t.id) : SC.off.add(t.id); scRender(); };
    tr.appendChild(b);
  });
  const drums = S.tracks.filter(t => isDrumTrack(t) && S.notes.some(n => n.t === t.id)).length;
  $('scNote').textContent = [SC.mode === 'piano' ? '고른 트랙을 모아서 높은음자리표(가온 도 이상) · 낮은음자리표로 나눠요' : '트랙마다 보표 하나 · 음역에 맞춰 높은음/낮은음자리표', drums ? `비트(드럼) 트랙 ${drums}개는 악보에서 빠져요` : '', '조표는 곡 스케일을 따라요'].filter(Boolean).join(' · ');
  SC.pages = scBuild(SC.mode);
  const used = cand.filter(t => !SC.off.has(t.id)).length;
  $('scCnt').textContent = SC.pages.length ? `트랙 ${used}개 · ${SC.pages.length}쪽 · 아래는 미리 보기` : '';
  $('scPdf').disabled = !SC.pages.length;
  $('scView').innerHTML = SC.pages.length ? SC.pages.map(s => `<div class="scPage">${s}</div>`).join('') : `<div class="scEmpty">악보로 만들 노트가 없어요 (드럼 트랙은 빠져요)</div>`;
}
function openScore() {
  if (mode !== 'idle') stop();
  closeCtx(); $('scSong').textContent = (curItem() || {}).name || '';
  for (const id of [...SC.off]) if (!S.tracks.some(t => t.id === id)) SC.off.delete(id);
  scoreM.classList.add('show'); scRender();
}
function closeScore() { scoreM.classList.remove('show'); $('scView').innerHTML = ''; }
scoreM.querySelectorAll('.scMode').forEach(b => b.onclick = () => { SC.mode = b.dataset.m; scRender(); });
$('scClose').onclick = closeScore;
scoreM.addEventListener('pointerdown', e => { if (e.target === scoreM) closeScore(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && scoreM.classList.contains('show')) { e.stopPropagation(); e.preventDefault(); closeScore(); } }, true);
$('scCancel').onclick = closeScore;
$('scAllOn').onclick = () => { SC.off.clear(); scRender(); };
$('scAllOff').onclick = () => { S.tracks.forEach(t => SC.off.add(t.id)); scRender(); };
// ── PDF 만들기: 쪽마다 고해상도 그림으로 그려서 A4 PDF에 담아요 (외부 라이브러리 없이) ──
function scPageJpeg(svgText, scale) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' })), img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = SC_W * scale; cv.height = SC_H * scale;
      const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(b => b ? b.arrayBuffer().then(a => res({ w: cv.width, h: cv.height, data: new Uint8Array(a) })) : rej(new Error('그림 변환 실패')), 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('악보 그림을 만들지 못했어요')); };
    img.src = url;
  });
}
function scMakePdf(imgs, title) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const push = x => { const u = typeof x === 'string' ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  const PW = 595.28, PH = 841.89, n = imgs.length, pageIds = imgs.map((_, i) => 3 + i * 3);
  push('%PDF-1.4\n'); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${pageIds.map(i => i + ' 0 R').join(' ')}] /Count ${n} >>`));
  imgs.forEach((im, i) => {
    const p = 3 + i * 3, c = p + 1, x = p + 2, cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${x} 0 R >> >> /Contents ${c} 0 R >>`));
    obj(c, () => { push(`<< /Length ${cs.length} >>\nstream\n`); push(cs); push('\nendstream'); });
    obj(x, () => { push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`); push(im.data); push('\nendstream'); });
  });
  const infoId = 3 + n * 3, hex = s => '<FEFF' + [...s].map(ch => ch.charCodeAt(0).toString(16).padStart(4, '0')).join('') + '>';
  obj(infoId, () => push(`<< /Title ${hex(title)} /Producer (Thaniya-SoundLab) >>`));
  const xref = len, total = infoId + 1;
  let xr = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let i = 1; i < total; i++) xr += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(xr); push(`trailer\n<< /Size ${total} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
$('scPdf').onclick = async () => {
  if (!SC.pages.length) return toast('악보로 만들 노트가 없어요');
  const btn = $('scPdf'); if (btn.classList.contains('busy')) return;
  btn.classList.add('busy'); btn.disabled = true; const old = btn.textContent; btn.textContent = 'PDF 만드는 중…';
  try {
    const imgs = []; for (const s of SC.pages) imgs.push(await scPageJpeg(s, 2.2));
    const song = (curItem() || {}).name || '악보', nm = safeName(song) + (SC.mode === 'piano' ? ' (피아노 악보)' : ' (악보)') + '.pdf';
    downloadBlob(scMakePdf(imgs, song), nm); toast(`${nm} 저장 (${imgs.length}쪽)`);
  } catch (e) { toast(e.message || 'PDF를 만들지 못했어요'); }
  finally { btn.classList.remove('busy'); btn.disabled = false; btn.textContent = old; }
};

// ───────── 내보내기 창: 형식(프로젝트 · MIDI · MP3) + MP3 음질 선택 ─────────
const EXP_KEY = 'hc-export', KBPS = [[96, '가벼움', '용량 작게'], [128, '보통', '일반 재생용'], [192, '좋음', '추천'], [256, '높음', '음질 우선'], [320, '최고', '가장 큰 용량']];
const expPrefs = Object.assign({ fmt: 'mp3', kbps: 192 }, lsGet(EXP_KEY) || {});
const expM = document.createElement('div'); expM.id = 'exportM';
expM.innerHTML = `<div class="xcard" role="dialog" aria-label="내보내기">
  <div class="xhead"><b>내보내기</b><span class="xsong" id="xSong"></span><button class="ib" id="xClose" title="닫기 (Esc)">✕</button></div>
  <div class="xsec">형식</div>
  <div class="xfmts" id="xFmts"></div>
  <div id="xQ"><div class="xsec">MP3 음질</div><div class="xq" id="xQBtns"></div><div class="xinfo" id="xInfo"></div></div>
  <div class="xfoot"><button class="btn" id="xCancel">취소</button><button class="btn primary" id="xGo"><span id="xGoIc"></span>내보내기</button></div>
</div>`;
document.body.appendChild(expM);
let expId = null;
const EXP_FMT = [['mp3', 'MP3', '오디오 파일 · 어디서나 재생', 'music'], ['midi', 'MIDI', '트랙별 .mid · 다른 프로그램에서 편집', 'note'], ['json', '프로젝트 파일', '.json · 나중에 다시 불러와서 편집', 'download']];
function expSec(id) {   // 예상 길이(초)
  const p = id === LIB.cur && !ON_MYPAGE ? pickProject(S) : lsGet(PROJ(id)), notes = (p && p.notes) || [];
  const end = notes.reduce((a, n) => Math.max(a, n.s + n.l), 0);
  return end * 60 / ((p && p.bpm) || 100) / 4 + 1;
}
function expRefresh() {
  $('xFmts').querySelectorAll('.xf').forEach(b => b.classList.toggle('on', b.dataset.f === expPrefs.fmt));
  $('xQ').style.display = expPrefs.fmt === 'mp3' ? '' : 'none';
  $('xQBtns').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.k === expPrefs.kbps));
  const sec = expSec(expId), mb = sec * expPrefs.kbps * 1000 / 8 / 1048576;
  $('xInfo').textContent = `예상 길이 약 ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} · 예상 크기 약 ${mb < 0.1 ? '0.1' : mb.toFixed(1)}MB (${expPrefs.kbps}kbps 스테레오)`;
  $('xGoIc').innerHTML = svg((EXP_FMT.find(f => f[0] === expPrefs.fmt) || EXP_FMT[0])[3]);
}
EXP_FMT.forEach(([k, t, d, ic]) => {
  const b = el('button', 'xf'); b.dataset.f = k; b.type = 'button';
  b.innerHTML = svg(ic) + '<span class="xt"></span><span class="xd"></span>'; b.querySelector('.xt').textContent = t; b.querySelector('.xd').textContent = d;
  b.onclick = () => { expPrefs.fmt = k; expRefresh(); };
  $('xFmts').appendChild(b);
});
KBPS.forEach(([k, t, d]) => {
  const b = el('button', 'xk'); b.dataset.k = k; b.type = 'button'; b.innerHTML = `<b>${k}</b><span>${t}</span>`; b.title = `${k}kbps · ${d}`;
  b.onclick = () => { expPrefs.kbps = k; expRefresh(); };
  $('xQBtns').appendChild(b);
});
function closeExport() { expM.classList.remove('show'); }
function openExport(id) {
  id = id || LIB.cur; const it = LIB.items.find(i => i.id === id); if (!it) return;
  if (mode !== 'idle') stop();
  expId = id; $('xSong').textContent = it.name; closeCtx(); expRefresh(); expM.classList.add('show');
}
$('xClose').onclick = $('xCancel').onclick = closeExport;
expM.addEventListener('pointerdown', e => { if (e.target === expM) closeExport(); });
$('xGo').onclick = () => {
  const id = expId; lsSet(EXP_KEY, expPrefs); closeExport();
  if (expPrefs.fmt === 'json') exportProjectById(id, 'json');
  else if (expPrefs.fmt === 'midi') exportProjectById(id, 'midi');
  else if (id === LIB.cur && !ON_MYPAGE) exportMp3(expPrefs.kbps);
  else goPage(PG_EDIT, '?open=' + encodeURIComponent(id) + '&export=mp3&kbps=' + expPrefs.kbps);   // MP3는 편집 화면에서 만들어요
};
async function engExport(rid, loop) {
  const fail = msg => { engPost({ type: 'soundlab:export-error', rid, msg }); toast(msg); };
  if (ENG.busy) return fail('이미 오디오로 만드는 중이에요');
  if (pendingRec) return fail('노트 변환 미리보기를 먼저 적용하거나 취소해 주세요');
  if (mode !== 'idle') stop();
  ENG.busy = true; $('engSaveBtn').classList.add('busy'); toast('오디오로 만드는 중…');
  try {
    save();
    let last = -1;
    const lib = LIB.cur, it = curItem(), r = await renderSongWav(!!loop, p => { const pct = Math.round(p * 100); if (pct !== last) { last = pct; engPost({ type: 'soundlab:progress', rid, pct }); } });
    engPost({ type: 'soundlab:export', rid, lib, name: it ? it.name : '음악', project: JSON.parse(JSON.stringify(pickProject(S))), wav: r.url, dur: r.dur, size: r.size, mime: 'audio/wav', loop: !!loop });
  } catch (e) { fail(e.message || '오디오로 만들지 못했어요'); }
  finally { ENG.busy = false; $('engSaveBtn').classList.remove('busy'); }
}
function engAskSave() {
  if (!engPost({ type: 'soundlab:save' })) toast('엔진과 아직 연결되지 않았어요. 잠시 후 다시 눌러 주세요');
}
if (ENG.on) {
  document.body.classList.add('engine');
  engTag('wait');
  $('engSaveBtn').onclick = engAskSave;
  { const lg = $('logoBtn'); lg.onclick = null; lg.tabIndex = -1; lg.removeAttribute('title'); }   // 왼쪽 위 아이콘: 엔진 창 안에서는 링크 끔
  // 마이페이지의 '홈' 링크는 엔진 창 안에서 SoundLab 홈으로 넘어가지 않게
  document.querySelectorAll('.mpBrand').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openProject(LIB.cur); }));
  window.addEventListener('message', e => {
    // 엔진 안 창 · 또는 엔진 밖으로 꺼낸 창(부모를 연 엔진)에서 온 것만
    let fromEng = e.source === window.parent;
    if (!fromEng) try { fromEng = !!window.parent.opener && e.source === window.parent.opener; } catch (er) {}
    if (!fromEng) return;
    if (!(e.origin === location.origin || ENG_ORIGINS.some(r => r.test(e.origin)))) {   // 허용하지 않은 주소: 이유를 알려 줌 (데이터 없음)
      if (e.data && e.data.type === 'thaniya-engine:hello') try { window.parent.postMessage({ type: 'soundlab:reject', origin: e.origin }, '*'); } catch (er) {}
      return;
    }
    if (ENG.origin && e.origin !== ENG.origin) return;
    const d = e.data; if (!d || typeof d !== 'object' || typeof d.type !== 'string') return;
    if (d.type === 'thaniya-engine:hello') {
      const first = !ENG.origin; ENG.origin = e.origin;
      if (first) { engPost({ type: 'soundlab:ready', version: 1 }); if (engState === 'wait') engTag('on'); }
      return;
    }
    if (!ENG.origin) return;
    if (d.type === 'thaniya-engine:load-song') { engLoadSong(d); return; }
    if (d.type === 'thaniya-engine:pause') { if (mode !== 'idle') stop(); return; }   // 엔진에서 창을 닫으면 재생만 멈춤
    if (d.type === 'thaniya-engine:request-export') { engExport(d.rid, d.loop); return; }
    if (d.type === 'thaniya-engine:saved') {   // 엔진이 받아서 오디오 에셋으로 넣음 → 이 곡을 그 에셋과 연결
      const it = LIB.items.find(i => i.id === d.lib);
      if (it) { if (typeof d.id === 'string') it.eng = d.id; delete it.engNew; lsSet(LIB_KEY, LIB); }
      engTag('saved'); toast(`엔진에 '${String(d.name || '')}'(으)로 저장했어요`);
    }
  });
  engPost({ type: 'soundlab:hi', version: 1 }, false);   // 데이터 없는 신호 · 엔진이 hello로 답하면 주소를 확인하고 ready
}

// ───────── 입력창: 누르면 내용 전체 선택 (BPM 등 바로 새로 입력) ─────────
{
  const selectable = t => t && t.tagName === 'INPUT' && /^(number|text)$/.test(t.type) && !t.readOnly && !t.disabled;
  let justFocused = null;
  document.addEventListener('focusin', e => { const t = e.target; if (!selectable(t)) return; justFocused = t; try { t.select(); } catch (er) {} setTimeout(() => { if (justFocused === t) justFocused = null; }, 400); });
  // 클릭으로 들어왔을 때 마우스를 떼는 순간 선택이 풀리지 않게
  document.addEventListener('mouseup', e => { if (e.target === justFocused) { e.preventDefault(); justFocused = null; } }, true);
}
// ───────── 시작 ─────────
renderList(); renderInspector(); setButtons(); gateMark(); updateSongTitle();
applyPanels();
document.body.dataset.tool = S.tool;
document.querySelectorAll('#editBar [data-et]').forEach(b => b.classList.toggle('on', b.dataset.et === S.tool));
setTool(S.tool);
{ // 홈(index.html)에서 넘어온 요청: ?open=<id> · ?new=1 · #mypage
  const q = new URLSearchParams(location.search), oid = q.get('open');
  if (oid && LIB.items.some(i => i.id === oid) && oid !== LIB.cur) openProject(oid, true);
  if (q.get('export') === 'mp3' && oid) setTimeout(() => exportMp3(+q.get('kbps') || 192), 500);   // 마이페이지에서 'MP3 내보내기'로 넘어온 경우
  else if (q.has('new')) ENG.on ? engNewProject() : newProject();
  if (ON_MYPAGE || location.hash === '#mypage' || q.has('mypage')) setTimeout(openMyPage, 0);
  if (location.search || location.hash) try { history.replaceState(null, '', location.pathname); } catch (e) {}
}
$('zoomVal').textContent = Math.round(STEP_W / 22 * 100) + '%';
if (isDrumTrack(activeTrack())) scrollToDrums(); else scroller.scrollTop = (HIGH - 64) * ROW_H - scroller.clientHeight / 2;
placePal();
drawAll();
// ───────── 모바일: 편집 바 · 더보기 패널 ─────────
{
  document.querySelectorAll('#editBar [data-et]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.et)));
  $('ebZoomIn').onclick = () => $('zoomIn').click();
  $('ebZoomOut').onclick = () => $('zoomOut').click();
  const ED = {
    copy: () => { if (copySel(true)) toast(`노트 ${sel.size}개 복사했어요`); else toast('선택된 노트가 없어요'); },
    cut: () => { if (copySel(true)) { const n = sel.size; deleteSel(); toast(`노트 ${n}개 잘라냈어요`); } else toast('선택된 노트가 없어요'); },
    paste: () => { if (clip) toast('재생 위치에 붙여넣었어요 (눈금자를 눌러 위치 이동)'); paste(); },
    dup: () => duplicate(),
    del: () => { if (sel.size) deleteSel(); else toast('선택된 노트가 없어요'); },
    group: () => groupSel(),
    link: () => linkSel(),
    ungroup: () => ungroupSel(),
    all: () => { sel = new Set(S.notes.filter(n => n.t === S.active)); drawAll(); },
    none: () => { sel = new Set(); drawAll(); }
  };
  document.querySelectorAll('#editBar [data-ed]').forEach(b => b.addEventListener('click', () => { ED[b.dataset.ed](); closeFan(); }));
  // 가로모드: '편집' 버튼 → 아래 줄(재생 바 + 도구 줄) 전체를 덮는 가로 버튼 줄이 나타남
  const fab = $('ebFab'), bar = $('editBar'), acts = bar.querySelector('.ebActs');
  let fanBack = null;
  function closeFan() {
    if (fanBack) { fanBack.remove(); fanBack = null; }
    bar.classList.remove('fan'); fab.classList.remove('on');
    ['left', 'top', 'width', 'height'].forEach(k => acts.style[k] = '');
  }
  function openFan() {
    if (bar.classList.contains('fan')) return;
    fanBack = document.createElement('div'); fanBack.id = 'fanBack';
    fanBack.addEventListener('pointerdown', e => { e.preventDefault(); closeFan(); });
    document.body.appendChild(fanBack);
    const tr = $('transport').getBoundingClientRect(), br = bar.getBoundingClientRect();
    const l = Math.min(tr.left, br.left), r = Math.max(tr.right, br.right), t = Math.min(tr.top, br.top), bt = Math.max(tr.bottom, br.bottom);
    acts.style.left = l + 'px'; acts.style.top = t + 'px'; acts.style.width = (r - l) + 'px'; acts.style.height = (bt - t) + 'px';
    bar.classList.add('fan'); fab.classList.add('on');
  }
  $('ebClose').addEventListener('click', closeFan);
  fab.addEventListener('click', () => bar.classList.contains('fan') ? closeFan() : openFan());
  window.addEventListener('resize', () => { if (!window.__kbResize) closeFan(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeFan(); }, true);

  const more = $('moreM'), mbody = $('moreBody'), syncs = [];
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const closeMore = () => more.classList.remove('show');
  const section = t => { mbody.appendChild(mk('div', 'moreT', t)); const g = mk('div', 'moreGrid'); mbody.appendChild(g); return g; };
  const fire = (o, ...ev) => ev.forEach(n => o.dispatchEvent(new Event(n, { bubbles: true })));
  function actBtn(g, label, id, o = {}) {
    const b = mk('button', 'btn tile'), sv = $(id).querySelector('svg');
    b.innerHTML = (sv ? sv.outerHTML : '<span class="qm">?</span>') + '<span class="tl"></span>'; b.lastChild.textContent = label;
    b.addEventListener('mousedown', e => e.preventDefault());
    b.onclick = () => { if (!o.stay) closeMore(); $(id).click(); if (o.stay) syncs.forEach(f => f()); };
    syncs.push(() => { b.classList.toggle('on', !!o.toggle && $(id).classList.contains('on')); if (o.engOnly) b.style.display = document.body.classList.contains('engine') ? '' : 'none'; });
    g.appendChild(b);
  }
  function selBox(g, label, id) {
    const w = mk('label', 'moreF', label), s = mk('select'); w.appendChild(s); g.appendChild(w);
    syncs.push(() => { const o = $(id); s.innerHTML = o.innerHTML; s.value = o.value; });
    s.onchange = () => { const o = $(id); o.value = s.value; fire(o, 'input', 'change'); };
  }
  function inBox(g, label, id, rtl) {
    const w = mk('label', 'moreF', label), i = mk('input'); w.appendChild(i); g.appendChild(w);
    if (rtl) i.style.direction = 'rtl';
    syncs.push(() => { const o = $(id); ['type', 'min', 'max', 'step'].forEach(a => o.getAttribute(a) != null && i.setAttribute(a, o.getAttribute(a))); i.value = o.value; });
    i.oninput = () => { const o = $(id); o.value = i.value; if (i.type === 'range') fire(o, 'input'); };
    i.onchange = () => { const o = $(id); o.value = i.value; fire(o, 'input', 'change'); };
  }
  let g = section('곡 설정');
  selBox(g, '격자 (스냅)', 'grid'); selBox(g, '스케일', 'key'); selBox(g, '건반 표기', 'labelMode'); inBox(g, 'BPM', 'bpm');
  g = section('재생 · 녹음'); g.classList.add('g4');
  actBtn(g, '메트로놈', 'metroBtn', { stay: true, toggle: true }); actBtn(g, '카운트인', 'countBtn', { stay: true, toggle: true });
  actBtn(g, '마이크 테스트', 'monBtn'); actBtn(g, '오디오 파일에서 멜로디', 'fileBtn');
  inBox(g, '녹음 감도', 'gate', true); g.lastChild.style.gridColumn = '1/-1';
  { const lb = g.lastChild, inp = lb.querySelector('input'), row = mk('div', 'gRow');   // 슬라이더 양옆: 왼쪽 = 낮음, 오른쪽 = 높음
    inp.replaceWith(row); row.append(mk('span', 'gEnd', '낮음'), inp, mk('span', 'gEnd', '높음')); }
  g = section('만들기');
  actBtn(g, '반주 · 비트', 'accBtn'); actBtn(g, '스텝 입력', 'stepBtn'); actBtn(g, '악보 만들기 (PDF)', 'scoreBtn'); actBtn(g, '엔진에 저장', 'engSaveBtn', { engOnly: true });
  g = section('보기');
  const z = mk('div', 'moreF zoom'), zv = mk('span'); const zb = (t, id) => { const b = mk('button', 'btn', t); b.onclick = () => { $(id).click(); zv.textContent = $('zoomVal').textContent; }; return b; };
  z.append('확대 / 축소', zb('−', 'zoomOut'), zv, zb('+', 'zoomIn')); g.appendChild(z);
  syncs.push(() => zv.textContent = $('zoomVal').textContent);
  g = section('파일 · 기타'); g.classList.add('g4');
  actBtn(g, '내보내기', 'midiBtn'); actBtn(g, '노트 모두 지우기', 'clearBtn'); actBtn(g, '단축키 도움말', 'helpBtn'); actBtn(g, '튜토리얼', 'tutBtn');

  $('moreBtn').onclick = () => { syncs.forEach(f => f()); more.classList.add('show'); };
  $('moreClose').onclick = closeMore;
  more.addEventListener('pointerdown', e => { if (e.target === more) closeMore(); });
  window.addEventListener('resize', () => { if (!window.__kbResize && innerWidth > 760) closeMore(); });
}
// ───────── 튜토리얼 (PC · 모바일 따로) ─────────
{
  const box = $('tut');
  const TUT_KEY = 'hc-tutorial';
  const isMob = () => window.matchMedia(SI_MQ).matches;
  // ── 제스처 그림 (손가락 = 노란 원, 가운데 노트 묶음이 같이 늘어나고 줄어듦) ──
  const notesG = (anim, extra = '') => `<g class="tg-anim" style="animation-name:${anim}" ${extra}>
      <rect class="tg-n" x="118" y="52" width="16" height="7"/><rect class="tg-n" x="136" y="45" width="10" height="7"/>
      <rect class="tg-n" x="148" y="59" width="22" height="7"/><rect class="tg-n2" x="172" y="66" width="12" height="7"/>
      <rect class="tg-n" x="128" y="73" width="20" height="7"/><rect class="tg-n2" x="150" y="80" width="14" height="7"/></g>`;
  const stage = inner => `<svg viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="288" height="128" rx="12" fill="#101114" stroke="#2f3238"/>
      ${[30, 50, 70, 90, 110].map(y => `<line x1="10" x2="290" y1="${y}" y2="${y}" stroke="#1d1f24"/>`).join('')}
      ${[60, 110, 160, 210, 260].map(x => `<line y1="10" y2="130" x1="${x}" x2="${x}" stroke="#1d1f24"/>`).join('')}
      ${inner}</svg>`;
  const finger = (x, y, anim) => `<circle class="tg-f tg-anim" cx="${x}" cy="${y}" r="12" style="animation-name:${anim}"/>`;
  const label = t => `<text class="tg-l" x="150" y="127" text-anchor="middle">${t}</text>`;
  const ART = {
    pinchX: () => stage(notesG('tgSX') + `<path class="tg-a" d="M70 104 H230 M70 104 l7 -4 M70 104 l7 4 M230 104 l-7 -4 M230 104 l-7 4"/>` + finger(126, 70, 'tgL') + finger(174, 70, 'tgR') + label('좌우로 벌리기 → 가로(시간)만 확대')),
    pinchY: () => stage(notesG('tgSY') + `<path class="tg-a" d="M232 22 V112 M232 22 l-4 7 M232 22 l4 7 M232 112 l-4 -7 M232 112 l4 -7"/>` + finger(150, 52, 'tgU') + finger(150, 88, 'tgD') + label('위아래로 벌리기 → 세로(음 높이)만 확대')),
    pinchXY: () => stage(notesG('tgSXY') + `<path class="tg-a" d="M78 24 L222 108"/>` + finger(130, 56, 'tgUL') + finger(170, 84, 'tgDR') + label('비스듬히 벌리기 → 가로·세로 함께')),
    pinchIn: () => stage(notesG('tgSIn') + finger(132, 59, 'tgIn1') + finger(168, 81, 'tgIn2') + label('오므리기 → 축소 (방향 규칙은 같아요)')),
    pan2: () => stage(notesG('tgPan') + finger(160, 56, 'tgPan') + finger(160, 86, 'tgPan') + `<path class="tg-a" d="M120 106 H200 M120 106 l7 -4 M120 106 l7 4"/>` + label('두 손가락 그대로 끌기 → 화면 이동')),
    steps: () => `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <text class="tg-l" x="12" y="20">스텝 목록</text>
      <g><rect x="10" y="28" width="98" height="26" rx="8" fill="#1f1d14" stroke="#f2c230"/><rect x="17" y="35" width="12" height="12" rx="3" fill="#f2c230"/><text x="35" y="45" fill="#f2c230" font-size="11" font-weight="700">후렴 A</text><text x="84" y="45" fill="#8a8f99" font-size="12">▶</text></g>
      <g><rect x="114" y="28" width="86" height="26" rx="8" fill="#1a1c20" stroke="#2f3238"/><rect x="121" y="35" width="12" height="12" rx="3" fill="#f2c230"/><text x="139" y="45" fill="#c9ccd2" font-size="11" font-weight="700">후렴 B</text><text x="180" y="45" fill="#8a8f99" font-size="12">▶</text></g>
      <g><rect x="206" y="28" width="84" height="26" rx="8" fill="#1a1c20" stroke="#2f3238"/><rect x="213" y="35" width="12" height="12" rx="3" fill="none" stroke="#3a3d45"/><text x="231" y="45" fill="#c9ccd2" font-size="11" font-weight="700">간주</text><text x="270" y="45" fill="#8a8f99" font-size="12">▶</text></g>
      <text class="tg-l" x="12" y="78">✓ 체크 = 내보낼 스텝 · ▶ = 미리 듣기 · ✎ = 이름</text>
      <g transform="translate(12 88)"><rect width="82" height="22" rx="6" fill="#1a1c20" stroke="#2f3238"/><text x="41" y="15" text-anchor="middle" fill="#c9ccd2" font-size="10.5" font-weight="700">→← 한 칸 붙이기</text></g>
      <g transform="translate(100 88)"><rect width="82" height="22" rx="6" fill="#1a1c20" stroke="#2f3238"/><text x="41" y="15" text-anchor="middle" fill="#c9ccd2" font-size="10.5" font-weight="700">←→ 한 칸 띄우기</text></g>
      <g transform="translate(190 88)"><rect width="98" height="22" rx="6" fill="#f2c230"/><text x="49" y="15" text-anchor="middle" fill="#1a1500" font-size="10.5" font-weight="800">묶음으로 내보내기</text></g></svg>`,
    spread: () => `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <text class="tg-l" x="12" y="18">처음</text>
      ${[0, 1, 2, 3].map(i => `<rect class="tg-n" x="${50 + i * 30}" y="${10 + (i % 2) * 6}" width="28" height="7"/>`).join('')}
      <text class="tg-l" x="12" y="54">띄우기</text>
      ${[0, 1, 2, 3].map(i => `<rect class="tg-n" x="${50 + i * 45}" y="${46 + (i % 2) * 6}" width="28" height="7"/>`).join('')}
      <text class="tg-l" x="12" y="90">붙이기</text>
      ${[0, 1, 2, 3].map(i => `<rect class="tg-n2" x="${50 + i * 28}" y="${82 + (i % 2) * 6}" width="28" height="7"/>`).join('')}
      <text class="tg-l" x="150" y="114" text-anchor="middle">한 칸 = 지금 격자(스냅) 한 칸</text></svg>`,
    bundle: tap => stage(`<rect x="104" y="36" width="96" height="56" rx="6" fill="rgba(242,194,48,.06)" stroke="#f2c230" stroke-dasharray="5 4"/>
      <text x="106" y="31" fill="#f2c230" font-size="10" font-weight="700">▣ 후렴 A</text>
      <rect class="tg-n" x="110" y="44" width="22" height="7"/><rect class="tg-n" x="134" y="58" width="18" height="7"/><rect class="tg-n" x="154" y="51" width="20" height="7"/><rect class="tg-n" x="176" y="72" width="18" height="7"/><rect class="tg-n" x="120" y="79" width="26" height="7"/>
      <rect class="tg-n2" x="220" y="60" width="26" height="7"/><rect class="tg-n2" x="40" y="66" width="24" height="7"/>`
      + (tap ? `<circle class="tg-f tg-anim" cx="143" cy="62" r="12" style="animation-name:tgTap"/>` : `<path d="M143 62 l0 16 l4 -4 l3 7 l3 -1 l-3 -7 l6 0 z" fill="#fff" stroke="#000" stroke-width="1"/>`)
      + label(tap ? '묶음 안 아무 노트나 톡 → 통째로 선택' : '묶음 안 아무 노트나 클릭 → 통째로 선택')),
    keys: () => `<svg viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
      ${['Q', 'W', 'E', 'R', 'T', 'Y'].map((k, i) => `<g transform="translate(${20 + i * 44} 12)"><rect width="38" height="34" rx="6" fill="#1b1d22" stroke="rgba(242,194,48,.55)"/><text x="7" y="14" fill="#f2c230" font-size="11" font-weight="700" font-family="ui-monospace,monospace">${k}</text><text x="31" y="28" text-anchor="end" fill="#c9ccd2" font-size="9.5" font-weight="700">${['손', '선택', '펜', '지우개', '영역', '스포이트'][i]}</text></g>`).join('')}
      <g transform="translate(20 58)"><rect width="126" height="34" rx="6" fill="#1b1d22" stroke="#2f3238"/><text x="63" y="21" text-anchor="middle" fill="#c9ccd2" font-size="10.5" font-weight="700">Space 짧게 = 재생/정지</text></g>
      <g transform="translate(154 58)"><rect width="126" height="34" rx="6" fill="#1b1d22" stroke="#2f3238"/><text x="63" y="21" text-anchor="middle" fill="#c9ccd2" font-size="10.5" font-weight="700">Space 누른 채 = 손 도구</text></g></svg>`
  };
  const zoomPill = () => $('zoomVal') && $('zoomVal').parentElement;
  const PC = [
    { title: 'Thaniya-SoundLab에 오신 걸 환영해요', body: '허밍·노래·연주를 녹음해서 <b>노트로 바꾸고</b>, 다듬고, 반주를 얹어 곡을 만드는 작업실이에요.<br>이 튜토리얼은 <b>PC (마우스 · 키보드)</b> 기준이에요. <kbd>→</kbd> <kbd>Enter</kbd> 다음 · <kbd>←</kbd> 이전 · <kbd>Esc</kbd> 닫기' },
    { target: ['#palette', '#toolDock'], art: 'keys', title: '도구 고르기', body: '<b>Q W E R T Y</b> 키로 도구를 바꿔요 (도구 패널을 눌러도 돼요).<ul><li><b>손(Q)</b> 화면 끌어서 이동 · 휠 클릭 드래그도 가능</li><li><b>선택(W)</b> 빈 곳 드래그 = 사각형 선택 · Alt+드래그 = 복제</li><li><b>펜(E)</b> 클릭·드래그로 노트 그리기, 노트 오른쪽 끝을 끌면 길이</li><li><b>지우개(R)</b> · 우클릭 드래그도 지우개</li></ul>' },
    { target: '#center', title: '노트 편집', body: '<ul><li><kbd>Ctrl</kbd>+C / X / V / D — 복사 · 잘라내기 · 붙여넣기(마우스를 따라다니다 클릭하면 놓기) · 바로 뒤에 복제</li><li>방향키 / <kbd>A</kbd><kbd>D</kbd> — 선택한 노트 이동 (↑↓ 반음, Shift+↑↓ 옥타브)</li><li><kbd>Delete</kbd> 삭제 · <kbd>Ctrl</kbd>+Z 되돌리기</li></ul>' },
    { target: zoomPill, title: '확대 · 축소', body: '<ul><li><kbd>Ctrl</kbd>+휠 — 화면 전체</li><li><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+휠 — <b>가로(시간)만</b></li><li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+휠 — <b>세로(음 높이)만</b></li><li><kbd>Ctrl</kbd>+우클릭 드래그 — 좌우로 끌면 가로, 위아래로 끌면 세로</li><li>여기 <b>− / +</b> 버튼이나 <kbd>Ctrl</kbd>+<kbd>-</kbd> <kbd>=</kbd></li></ul>' },
    { target: '#recBtn', title: '녹음해서 노트 만들기', body: '<kbd>Shift</kbd>+<kbd>R</kbd>로 녹음을 시작하고 멈추면 <b>노트 변환 미리보기</b>가 열려요. 모드(악기·목소리·주선율)와 민감도를 바꿔 들어 보고 <kbd>Enter</kbd>로 적용해요. 옆의 업로드 버튼으로 오디오 파일에서 멜로디를 딸 수도 있어요.' },
    { target: '#side', title: '트랙', body: '트랙마다 악기를 따로 가져요. 클릭해서 고르고, 끌어서 순서를 바꾸고, <b>우클릭</b>으로 이름·복제·삭제·폴더 묶기를 해요. 드럼은 「드럼 키트」 악기 트랙으로 넣어요.' },
    { target: '#accBtn', title: '반주 · 비트 (J)', body: '멜로디의 조·코드를 분석해서 스타일별 <b>추천 반주</b>를 만들거나, 코드 진행을 골라 <b>샘플 반주</b>를 깔고, 장르 <b>비트</b>를 16칸으로 편집할 수 있어요.' },
    { target: '#stepBtn', title: '스텝 입력 (K)', body: '컴퓨터 키보드를 피아노처럼 써요. 아랫줄 <kbd>Z</kbd>~<kbd>M</kbd> = 도~시, 윗줄 <kbd>Q</kbd>부터 한 옥타브 위.<br>건반 키를 누른 채 <kbd>Space</kbd> = 보드에 넣기 · <b>아무것도 안 누르고</b> <kbd>Space</kbd> = 한 칸 앞으로(쉼표) · <kbd>Enter</kbd> = 재생<br>키 배치는 건반에 마우스를 올리거나 오른쪽 위 키보드 버튼으로 볼 수 있어요.' },
    { target: '#stepBtn', art: 'steps', title: '스텝을 여러 개 관리하기', body: '스텝 입력 창 보드 위 <b>← 스텝 목록</b>을 누르면 <b>스텝 관리 창</b>이 그리드로 열려요.<ul><li>맨 앞 <b>「새 스텝 추가」</b> 카드 = 새 스텝</li><li>카드를 누르면 그 스텝 편집 · <b>끌어서</b> 순서 바꾸기</li><li>정렬: 이름 · 노트 수 · 최근 수정</li><li>카드 위에 마우스를 올리면 ▶ 미리 듣기 · 이름 · 복제 · 삭제</li><li><b>체크</b>한 스텝들은 그 순서대로 이어서 내보내져요</li></ul>다른 스텝으로 가려면 보드 위 <b>← 스텝 목록</b>' },
    { target: '#stepBtn', art: 'spread', title: '모두 한 칸 띄우기 · 붙이기', body: '보드 위 <b>←→ 한 칸 띄우기</b>는 음(화음)과 음 사이를 격자 한 칸씩 벌리고, <b>→← 한 칸 붙이기</b>는 빈 칸을 한 칸씩 줄여요(겹치지는 않아요).<br>단축키 <kbd>Ctrl</kbd>+<kbd>]</kbd> 띄우기 · <kbd>Ctrl</kbd>+<kbd>[</kbd> 붙이기 · <kbd>Ctrl</kbd>+Z로 되돌리기' },
    { target: '#center', title: '이어 부르기 (한 음처럼 잇기)', body: '노트 여러 개를 선택하고 <kbd>Ctrl</kbd>+L — 음마다 새로 치지 않고 <b>한 음처럼 미끄러지듯</b> 이어져요(노트 사이에 흰 곡선 표시). 빈틈이 있으면 앞 노트가 늘어나서 붙어요.<br>보컬 트랙은 가사를 비워 두면 앞 글자를 끌어서 불러요. 다시 <kbd>Ctrl</kbd>+L = 풀기' },
    { art: 'bundle', title: '따로 내보내기 · 묶음으로 내보내기', body: '<ul><li><b>따로</b> (<kbd>Ctrl</kbd>+<kbd>Enter</kbd>) — 노트를 낱개로 넣어요. 하나씩 자유롭게 편집.</li><li><b>묶음</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd>) — 스텝 하나가 <b>점선 상자</b> 한 덩어리로 들어가요. 아무 노트나 클릭하면 <b>통째로 선택</b> → 끌어서 옮기기, <kbd>Ctrl</kbd>+C / X / V, <kbd>Delete</kbd>가 한 번에 돼요.</li><li><kbd>Ctrl</kbd>+B 선택한 노트 묶기 · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+B 묶음 풀기</li></ul>' },
    { target: '#midiBtn', title: '저장과 내보내기', body: '작업은 <b>자동 저장</b>돼요. 이 버튼으로 프로젝트(.json) · MIDI · MP3로 내보내고, 왼쪽 위 로고(<kbd>Ctrl</kbd>+O)로 마이페이지에서 곡을 관리해요.' },
    { target: ['#tutBtn', '#helpBtn'], title: '다 됐어요!', body: '<b>?</b> 버튼은 단축키 도움말, 그 옆 <b>책 버튼</b>으로 이 튜토리얼을 언제든 다시 볼 수 있어요. 즐겁게 만들어 보세요 🎵' }
  ];
  const MOB = [
    { title: 'Thaniya-SoundLab에 오신 걸 환영해요', body: '허밍·노래를 녹음해서 <b>노트로 바꾸고</b>, 다듬고, 반주를 얹어 곡을 만드는 작업실이에요.<br>이 튜토리얼은 <b>모바일 (터치)</b> 기준이에요. 아래 <b>다음</b> 버튼으로 넘겨 주세요.' },
    { target: ['#editBar .ebRow'], title: '편집 바 — 도구', body: '<ul><li><b>손</b> 한 손가락으로 밀어서 화면 이동</li><li><b>선택</b> 노트를 톡 = 선택, 끌어서 이동 · 빈 곳 끌기 = 여러 개 선택</li><li><b>펜</b> 빈 칸을 톡/끌기 = 노트 그리기</li><li><b>지우개 · 영역 · 스포이트</b></li></ul>' },
    { target: '#center', art: 'pinchX', title: '확대·축소 ① 좌우 = 가로만', body: '두 손가락을 <b>옆으로(좌우로)</b> 놓고 벌리면 <b>가로(시간축)만</b> 확대돼요 — 마디가 넓어져서 짧은 음을 다루기 좋아요. 좌우로 오므리면 가로만 축소.' },
    { target: '#center', art: 'pinchY', title: '확대·축소 ② 상하 = 세로만', body: '두 손가락을 <b>위아래로</b> 놓고 벌리면 <b>세로(음 높이)만</b> 확대돼요 — 건반 줄이 두꺼워져서 음을 정확히 찍기 쉬워요. 위아래로 오므리면 세로만 축소.' },
    { target: '#center', art: 'pinchXY', title: '확대·축소 ③ 비스듬히 = 전체', body: '두 손가락을 <b>대각선으로</b> 벌리면 가로·세로가 <b>함께</b> 커져요.<br>방향은 <b>처음 두 손가락을 놓은 모양</b>으로 정해져요 — 거의 수평이면 가로, 거의 수직이면 세로, 비스듬하면 전체. 바꾸려면 손을 뗐다가 다시 놓으세요.' },
    { target: '#center', art: 'pinchIn', title: '축소하기', body: '같은 규칙으로 <b>오므리면 축소</b>예요. 좌우로 오므리면 가로만, 위아래로 오므리면 세로만, 비스듬히 오므리면 전체가 작아져요. 확대·축소하는 동안 두 손가락 사이 가운데가 그 자리에 머물러요.' },
    { target: '#center', art: 'pan2', title: '두 손가락으로 이동', body: '두 손가락을 벌리지 않고 <b>그대로 끌면</b> 화면이 따라 움직여요. 펜·선택 도구를 쓰는 중에도 도구를 바꾸지 않고 이동할 수 있어요. 두 손가락을 대는 순간 한 손가락으로 하던 편집은 취소돼요.' },
    { target: ['#ebZoomIn', '#ebZoomOut'], title: '버튼으로 확대 · 축소', body: '손가락이 불편하면 편집 바의 <b>− / +</b> 버튼으로 가로·세로를 한 번에 확대·축소해요. 「더보기 → 보기」에도 같은 버튼이 있어요.' },
    { target: '#ebFab', title: '편집 메뉴', body: '<b>편집</b>을 누르면 복사 · 잘라내기 · 붙여넣기(재생 위치에) · 복제 · 삭제 · 전체선택 · <b>묶기 · 묶음 풀기</b> 버튼 줄이 열려요.' },
    { target: '#ebFab', title: '이어 부르기 (한 음처럼 잇기)', body: '노트를 여러 개 선택하고 「편집 → <b>이어 부르기</b>」를 누르면 음마다 새로 치지 않고 <b>한 음처럼 미끄러지듯</b> 이어져요. 한 번 더 누르면 풀려요.' },
    { target: '#transport', title: '재생 · 녹음', body: '▶ 재생, ● 녹음. 녹음이 끝나면 <b>노트 변환 미리보기</b>에서 결과를 들어 보고 <b>적용</b>을 눌러요. 위쪽 <b>눈금자</b>를 누르거나 끌면 재생 위치(▼)가 옮겨져요.' },
    { target: '#moreBtn', title: '더보기 → 스텝 입력', body: '「더보기 → 만들기 → <b>스텝 입력</b>」을 열면 화면 아래 <b>터치 건반</b>이 나와요. 여러 손가락 = 화음, 손을 떼면 바로 보드에 들어가요(「바로 입력」). ◀ ▶ 로 입력 위치를 옮겨요.<br>보드의 <b>빈 칸을 톡</b> = 노트 칠하기 · <b>칠한 노트를 다시 톡</b> = 지우기 · 노트를 끌면 옮기기' },
    { art: 'steps', title: '스텝 여러 개 관리하기', body: '스텝 입력을 열면 먼저 <b>새로 만들지, 이어서 만들지</b> 고르는 창이 떠요. 입력 중에는 위쪽 <b>스텝 이름 버튼</b>을 누르면 <b>스텝 관리 창</b>(그리드)이 열려요.<ul><li>맨 앞 <b>「새 스텝 추가」</b> 카드로 추가</li><li>카드를 톡 = 그 스텝 편집 · <b>꾹 누른 뒤 끌기</b> = 순서 바꾸기</li><li>카드 아래 버튼: ▶ 미리 듣기 · 이름 · 복제 · 삭제</li><li><b>체크</b>한 스텝들이 그 순서대로 내보내져요</li></ul>' },
    { art: 'bundle', artArg: true, title: '따로 · 묶음으로 내보내기', body: '아래 <b>따로</b> / <b>묶음</b> 버튼을 누르면 편집 화면이 보이고, <b>눈금자를 끌어 ▼ 위치를 고른 뒤 「여기에 넣기」</b>.<ul><li><b>따로</b> = 낱개 노트로</li><li><b>묶음</b> = 점선 상자 한 덩어리로. 아무 노트나 <b>톡 → 통째로 선택</b>되고, 편집 메뉴의 복사 · 잘라내기 · 붙여넣기 · 삭제가 한 번에 돼요.</li></ul>' },
    { target: '#moreBtn', title: '다 됐어요!', body: '「더보기 → 파일 · 기타 → <b>튜토리얼</b>」에서 언제든 다시 볼 수 있어요. 즐겁게 만들어 보세요 🎵' }
  ];
  box.innerHTML = '<div class="tutDim"></div><div class="tutHole"></div><div class="tutCard"></div>';
  const hole = box.querySelector('.tutHole'), card = box.querySelector('.tutCard');
  let list = PC, idx = 0, kind = 'pc';
  function findTarget(t) {
    if (!t) return null;
    for (const q of [].concat(t)) {
      const e = typeof q === 'function' ? q() : document.querySelector(q); if (!e) continue;
      const r = e.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden') return e;
    }
    return null;
  }
  function place() {
    if (!box.classList.contains('show')) return;
    const st = list[idx], tg = findTarget(st.target), W = innerWidth, H = innerHeight, pad = 6;
    box.classList.toggle('noHole', !tg);
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let x = (W - cw) / 2, y = (H - ch) / 2;
    if (tg) {
      const r = tg.getBoundingClientRect();
      const hx = Math.max(4, r.left - pad), hy = Math.max(4, r.top - pad), hw = Math.min(W - 4, r.right + pad) - hx, hh = Math.min(H - 4, r.bottom + pad) - hy;
      Object.assign(hole.style, { left: hx + 'px', top: hy + 'px', width: hw + 'px', height: hh + 'px' });
      const below = H - (hy + hh), above = hy, right = W - (hx + hw), left = hx;
      if (below >= ch + 14) { y = hy + hh + 10; x = hx + hw / 2 - cw / 2; }
      else if (above >= ch + 14) { y = hy - ch - 10; x = hx + hw / 2 - cw / 2; }
      else if (right >= cw + 14) { x = hx + hw + 10; y = hy + hh / 2 - ch / 2; }
      else if (left >= cw + 14) { x = hx - cw - 10; y = hy + hh / 2 - ch / 2; }
      else { x = (W - cw) / 2; y = H - ch - 12; }   // 큰 영역(편집 화면 등): 카드는 아래쪽에 겹쳐서
    }
    card.style.left = clamp(x, 10, Math.max(10, W - cw - 10)) + 'px';
    card.style.top = clamp(y, 10, Math.max(10, H - ch - 10)) + 'px';
  }
  function render() {
    const st = list[idx], n = list.length, last = idx === n - 1;
    card.innerHTML = `<div class="tutTop"><span class="tutBadge">${kind === 'mob' ? '모바일 튜토리얼' : 'PC 튜토리얼'}</span>`
      + `<button class="tutSw">${kind === 'mob' ? 'PC용으로 보기' : '모바일용으로 보기'}</button><button class="ib tutX" title="닫기 (Esc)">${svg('x')}</button></div>`
      + (st.art ? `<div class="tutArt">${ART[st.art](st.artArg)}</div>` : '')
      + `<h4></h4><div class="tutBody">${st.body}</div>`
      + `<div class="tutFoot"><span class="tutNum">${idx + 1}/${n}</span><div class="tutDots">${list.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')}</div>`
      + `<button class="btn sm tutPrev"${idx ? '' : ' disabled'}>이전</button><button class="btn sm primary tutNext">${last ? '시작하기' : '다음'}</button></div>`;
    card.querySelector('h4').textContent = st.title;
    card.querySelector('.tutPrev').onclick = () => go(-1);
    card.querySelector('.tutNext').onclick = () => go(1);
    card.querySelector('.tutX').onclick = () => endTut();
    card.querySelector('.tutSw').onclick = () => startTut(kind === 'mob' ? 'pc' : 'mob', true);
    card.scrollTop = 0;
    place(); requestAnimationFrame(place);
  }
  function go(d) { const i = idx + d; if (i < 0) return; if (i >= list.length) return endTut(); idx = i; render(); }
  function startTut(k, keepOpen) {
    if (stepM.classList.contains('show')) closeStepInput();
    $('help').classList.remove('show'); $('moreM').classList.remove('show'); closeCtx(); endPaste();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    kind = k === 'mob' || k === 'pc' ? k : (isMob() ? 'mob' : 'pc');
    list = kind === 'mob' ? MOB : PC; idx = 0;
    box.classList.add('show'); render();
  }
  function endTut() { box.classList.remove('show'); lsSet(TUT_KEY, { seen: true }); }
  window.addEventListener('resize', () => requestAnimationFrame(place));
  window.addEventListener('keydown', e => {
    if (!box.classList.contains('show')) return;
    if (/^F\d+$/.test(e.code)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.key === 'Escape') endTut();
    else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  }, true);
  box.addEventListener('contextmenu', e => e.preventDefault());
  $('tutBtn').onclick = () => startTut();
  $('helpTutPc').onclick = () => startTut('pc');
  $('helpTutMob').onclick = () => startTut('mob');
  // 처음 온 사람에게 한 번 자동으로 (마이페이지 · 다른 창이 떠 있으면 닫힐 때까지 기다림)
  if (!ON_MYPAGE && !lsGet(TUT_KEY)) {
    let tries = 0;
    const tryStart = () => {
      if (lsGet(TUT_KEY) || box.classList.contains('show')) return;
      const busy = ['myPage', 'modal', 'confirm', 'exportM', 'help', 'moreM', 'accModal'].some(id => $(id) && $(id).classList.contains('show')) || stepM.classList.contains('show') || mode !== 'idle';
      if (busy) { if (++tries < 120) setTimeout(tryStart, 1500); return; }
      startTut();
    };
    setTimeout(tryStart, 900);
  }
}
})();
{ // 화면 크기 고정: 전체화면 전환·키보드 열림/닫힘·주소창 변화 뒤에도 가장자리 빈 여백이 남지 않게
  const vv = window.visualViewport, root = document.documentElement;
  let lastH = 0;
  const typing = () => { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(range|checkbox|radio|color|button|file|submit)$/.test(a.type))); };
  const sync = () => {
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    if (document.scrollingElement) { document.scrollingElement.scrollTop = 0; document.scrollingElement.scrollLeft = 0; }
    const w = vv ? vv.width : window.innerWidth, h = vv ? vv.height : window.innerHeight;
    let useH = h;
    if (typing() && lastH && h < lastH - 80) useH = lastH;   // 키보드가 올라온 동안은 화면이 찌그러지지 않게 높이 유지
    else lastH = h;
    
    
    
    
  };
  let t = 0;
  const settle = () => { sync(); clearTimeout(t); t = setTimeout(() => { sync(); window.__relayout && window.__relayout(); }, 180); };
  if (vv) { vv.addEventListener('resize', settle); vv.addEventListener('scroll', sync); }
  window.addEventListener('resize', settle);
  window.addEventListener('orientationchange', () => { lastH = 0; setTimeout(settle, 250); });
  document.addEventListener('fullscreenchange', () => { lastH = 0; settle(); setTimeout(settle, 400); });
  document.addEventListener('webkitfullscreenchange', () => { lastH = 0; settle(); setTimeout(settle, 400); });
  document.addEventListener('focusout', () => setTimeout(() => { if (!typing()) { lastH = 0; settle(); } }, 120));
  window.addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); }, { passive: true });
  sync();
}
