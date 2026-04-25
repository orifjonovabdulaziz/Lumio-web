// Chat-specific lucide-style icons (extend the dashboard set).
import React from 'react';

const base = {
  viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

const make = (path) => function Ico({ width = 18, height = 18, ...p }) {
  return <svg {...base} width={width} height={height} {...p}>{path}</svg>;
};

export const ChatIco = {
  search:    make(<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
  edit:      make(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></>),
  pin:       make(<><path d="M12 17v5"/><path d="M9 11V4l-2 2 5-2 5 2-2-2v7l3 4H6z"/></>),
  pinSlash:  make(<><path d="m4 4 16 16"/><path d="M9 11V4l-2 2 5-2 5 2-2-2v7l1 1.4"/><path d="M8.5 14.5 6 17.4h7.6"/><path d="M12 17v5"/></>),
  bellOff:   make(<><path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="m4.5 4.5 15 15"/><path d="M19 17h-1c0-2-.4-3.7-1-5"/><path d="M5 17c1.6-1.6 2-3.6 2-6 0-1.4.4-2.7 1.1-3.8"/><path d="M9 4.5A6 6 0 0 1 18 9c0 1 0 2 .2 3"/></>),
  archive:   make(<><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></>),
  trash:     make(<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></>),
  more:      make(<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>),
  moreV:     make(<><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></>),
  paperclip: make(<path d="m21 12-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>),
  smile:     make(<><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></>),
  mic:       make(<><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></>),
  send:      make(<><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>),
  x:         make(<><path d="M18 6 6 18M6 6l12 12"/></>),
  check:     make(<path d="M5 12l5 5L20 7"/>),
  doubleCheck: make(<><path d="M2 13l4 4L14 7"/><path d="M10 13l4 4L22 7"/></>),
  alertCircle: make(<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>),
  clock:     make(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  rotate:    make(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  reply:     make(<><path d="M9 17 4 12l5-5"/><path d="M4 12h11a5 5 0 0 1 5 5v3"/></>),
  download:  make(<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>),
  file:      make(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>),
  image:     make(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>),
  play:      make(<path d="M6 4v16l14-8z"/>),
  pause:     make(<><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>),
  video:     make(<><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/></>),
  chevronLeft: make(<path d="M15 18l-6-6 6-6"/>),
  chevronDown: make(<path d="M6 9l6 6 6-6"/>),
  chevronRight: make(<path d="M9 6l6 6-6 6"/>),
  inbox:     make(<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11"/></>),
  users:     make(<><circle cx="9" cy="9" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="8" r="3"/><path d="M17 14a5 5 0 0 1 5 6"/></>),
  user:      make(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>),
  zap:       make(<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>),
  bookmark:  make(<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>),
  template:  make(<><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="13" width="11" height="8" rx="1"/><rect x="17" y="13" width="4" height="8" rx="1"/></>),
  wifiOff:   make(<><path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8A15 15 0 0 1 6 6.5"/><path d="M22 8.8a15 15 0 0 0-4-2.4"/><path d="M5 12.5a10 10 0 0 1 4-2.3"/><path d="M19 12.5a10 10 0 0 0-4-2.3"/><path d="M12 20h.01"/></>),
  moon:      make(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>),
};
