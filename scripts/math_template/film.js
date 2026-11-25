/* __TITLE__ — grade 9. Taylor-study method (one continuous canvas, live gauges, no chapter marks)
 * plus Cutty cameos, burned-in subtitles, a 3-question quiz and the 26 s music outro. Timeline: timing.js (src/build_timeline.py).
 * This file: subtitles, end card, draw order. Scenes live in ch_*.js and hang their functions on window.CH. */
(function () {
'use strict';
const { ss } = VK;
const K = VKit, { A, B, TL, C } = SB;

/* subtitles: one line per cue, split in two when longer than 70 characters */
Object.assign(K.SUB.night, { font: 'lorar', size: 38, big: 46, huge: 52, track: .005, y: 985 });
const plainLen = s => s.replace(/[{}!]/g, '').length;
function split(sub) {
  if (plainLen(sub) <= 70) return [sub];
  const tok = sub.match(/\{!?[^}]*\}\S*|\S+/g), tot = plainLen(sub); let best = 1, score = 1e9, acc = 0;
  for (let i = 0; i < tok.length - 1; i++) { acc += plainLen(tok[i]) + 1; const sc = Math.abs(acc - tot / 2) - (/[,.:;—]$/.test(tok[i]) ? 14 : 0); if (sc < score) { score = sc; best = i + 1; } }
  return [tok.slice(0, best).join(' '), tok.slice(best).join(' ')];
}
const SPOKEN = TL.order.filter(id => TL.lines[id].sub), SUBS = [];
SPOKEN.forEach((id, i) => {
  const l = TL.lines[id], nx = SPOKEN[i + 1] ? TL.lines[SPOKEN[i + 1]].a : TL.dur, end = Math.min(l.b + .4, nx - .14), parts = split(l.sub);
  if (parts.length === 1) { SUBS.push({ a: l.a - .12, b: end, zh: l.sub, big: l.big, tone: l.tone }); return; }
  const f = plainLen(parts[0]) / plainLen(l.sub), mid = l.a + (l.b - l.a) * f;
  SUBS.push({ a: l.a - .12, b: mid - .06, zh: parts[0], tone: l.tone }, { a: mid, b: end, zh: parts[1], tone: l.tone });
});

/* Outro (26 s, end-screen-outro): YouTube's end screen covers the last 20 s, with the "watch next" video box bottom-left
 * (x 0-650, y 440-800) and the Subscribe circle on the right edge (x 1600-1920, y 470-790). Nothing goes there:
 * title and sources in the top band, the hook object looping in the centre column (x 700-1560, y 420-820) with Cutty,
 * two small labels that point at the end-screen elements. Music: I-vi-IV-V twice (3 s bars). */
const CARD = B('z5') + .6;                                    // scripts/finish.sh starts the outro score boost here too
const TITLE = '__TITLE__';
const SOURCES = ['TODO source · source · source', 'TODO source · source'];   // one line each, about 110 characters at most
const NOTE = 'TODO WHAT IS COMPUTED · WHAT IS ILLUSTRATIVE';
function outroLoop(fr, t, a) {
  /* TODO: the hook object once more, looping once per 3 s bar (ELLIPSE: the light burst meeting at the far focus) */
}
function endCard(fr, t) {
  const a = ss(t, CARD, CARD + 1.2) * (1 - ss(t, TL.dur - 1.2, TL.dur - .1)); if (a <= 0) return;
  fr.text(TITLE, 960, 120, { font: 'latinl', size: 84, track: 4, color: C.INK, a, glow: 12, glowColor: '#FFD9A0', glowA: .3 });
  fr.line(760, 178, 1160, 178, { w: 1, color: '#B09973', a: .6 * a, cap: 'butt' });
  SOURCES.forEach((s, i) => fr.text(s, 960, 232 + i * 38, { font: 'latin', size: 24, color: C.INK2, a: a * ss(t, CARD + .4 + .25 * i, CARD + 1 + .25 * i) }));
  fr.text(NOTE, 960, 232 + SOURCES.length * 38 + 14, { font: 'mono', size: 13, track: 2, color: C.DIM, a });
  outroLoop(fr, t, a);
  /* labels pointing at the end-screen elements (from 3 s in, when YouTube shows them) */
  const la = a * ss(t, CARD + 3, CARD + 4);
  if (la > 0) { fr.text('watch next', 760, 480, { font: 'latini', size: 38, color: KIT.COL.SOFT, align: 'l', a: la }); SB.arrow(fr, 750, 520, 680, 560, { color: KIT.COL.SOFT, a: la, head: 14 });
    fr.text('subscribe', 1540, 480, { font: 'latini', size: 38, color: KIT.COL.SOFT, align: 'r', a: la }); SB.arrow(fr, 1550, 520, 1620, 560, { color: KIT.COL.SOFT, a: la, head: 14 }); }
}
/* the outro music: 8 bars of 3 s (I, vi, IV, V) × 2, a 4-note music-box line per bar, a bloom to close */
function outroMusic(fr) {
  const roots = [0, -3, 5, 7, 0, -3, 5, 7], mel = [[4, 2, 3, 1], [2, 0, 1, 4], [3, 1, 2, 0], [1, 3, 4, 6], [4, 2, 3, 5], [2, 0, 1, 4], [3, 5, 4, 2], [1, 2, 3, 0]];
  roots.forEach((r, i) => { const t0 = CARD + .4 + 3 * i;
    fr.sfx(t0, 'chord', { root: r, gain: .9 });
    mel[i].forEach((p, j) => fr.sfx(t0 + .75 * j, 'tick', { pitch: p, gain: .8 })); });
  fr.sfx(CARD + .4 + 24 - .2, 'bloom', { gain: .6 });
}

const SCENES = ['hook'];                                      // chapter functions in draw order (add as ch_*.js files define them)
VK.film({
  dur: TL.dur, theme: 'night', meta: { title: TITLE },
  draw(fr, t) {
    fr.look.bloom = .45;
    fr.look.bgo = { stars: .2, core: 1.4 };
    SCENES.forEach(n => CH[n](fr, t));
    CH.quiz(fr, t); endCard(fr, t); outroMusic(fr);
    CH.cameos(fr, t); CH.cameoSfx(fr);
    K.subs(fr, t, SUBS, 'night');
  },
});
})();
