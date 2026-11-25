/* Hook (h*): TODO one line each: what it is (an everyday word) / what it does (one verb) / what the viewer learns.
 * Numbers: TODO (computed in code or checked in node/python). */
(function () {
'use strict';
const { lerp, seg, ss, E } = VK;
const { A, B, at } = SB;
const { COL, formula } = KIT;
const W = (id, w) => A(id) + SB.L(id).m[w];          // time of a marked word

function hook(fr, t) {
  if (t > A('a1')) return;
}

window.CH = window.CH || {};
Object.assign(window.CH, { hook });
})();
