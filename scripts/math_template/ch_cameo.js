/* Cutty's cameos: where it jumps in, what it points at, and what it says (mascot-cutty).
 * Each cameo sits in empty space beside the scene and points at the key or surprising thing. Add the film's own above the quiz ones. */
(function () {
'use strict';
const { A, B, at } = SB;
const W = (id, w) => A(id) + SB.L(id).m[w];
const CAMEOS = [
  // { a: at('a3', .8), b: B('a3') + .6, x: 1680, y: 730, from: 'r', point: [1740, 440], mood: 'wow', side: 'l', say: [[at('a3', .82), 'Wow!']] },
  { a: A('q0') + .2, b: B('q0') + .4, x: 1500, y: 700, from: 'b', wave: 1, say: [[A('q0') + .4, 'Quiz time!']] },
  { a: A('q1a') - .2, b: B('q1a') + .3, x: 1780, y: 800, from: 'r', point: [1160, 620], s: 1.05, side: 'l', say: [[A('q1a'), 'Yes!']] },
  { a: A('q2a') - .2, b: B('q2a') + .3, x: 1780, y: 800, from: 'r', point: [1160, 620], s: 1.05, side: 'l', say: [[A('q2a'), 'Right!']] },
  { a: A('q3a') - .2, b: B('q3a') + .3, x: 1780, y: 800, from: 'r', point: [1160, 620], s: 1.05, side: 'l', say: [[A('q3a'), 'Nailed it!']] },
  { a: B('z5') + 1.4, b: SB.TL.dur - .6, x: 1130, y: 905, s: .95, from: 'b', wave: 1, say: [[B('z5') + 1.8, 'See you next time!'], [B('z5') + 9, 'Subscribe for more!']] },
];
function cameos(fr, t) { CAMEOS.forEach(c => MASCOT.cameo(fr, t, c)); }
function cameoSfx(fr) { CAMEOS.forEach(c => { fr.sfx(c.a, 'rise', { dur: .5, gain: .18 }); fr.sfx(c.a + .55, 'tock', { gain: .3 }); }); }
window.CH = window.CH || {};
Object.assign(window.CH, { cameos, cameoSfx, CAMEOS });
})();
