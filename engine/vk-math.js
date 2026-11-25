/* vk-math.js — maths gauges for narrated explainer films (Aion method: every graph is a live measuring instrument).
 * Load after vk.js:  <script src="engine/vk-math.js"></script>   →  window.KIT
 * Self-contained copy of projects/taylor_study/film/kit.js (2026-11-22, after review). Taylor-specific helpers
 * (TC, stepper) are kept because they are generic polynomial tools. See references/math.md.
 */
/* Study kit: Aion-style "animation as a measuring instrument".
 *   plot(box, x0, x1, y0, y1)             a coordinate frame: X(x), Y(y), draw axes
 *   curve / errFill / fitWin / brackets   reference vs candidate, shaded error, live good-fit window
 *   probe / scoreboard / formula (fractions, roots, nesting) / digits / magnifier
 *   surf3d / fit2                         a lit 3D landscape and its second-order (bowl) fit
 * Fixed colour code for the whole film: reference white, candidate gold, error purple, correct green,
 * factorials magenta, the variable x blue. */
(function () {
'use strict';
const { lerp, seg, ss, E } = VK;
/* maths text: 'a^{b}' raises b, 'a_{n}' lowers n (smaller). Returns the width. o: font, supFont, size, color, align, a, glow */
function mtext(fr, str, x, y, o = {}) {
  const segs = []; let i = 0, m; const re = /([\^_])\{([^}]*)\}/g;
  while ((m = re.exec(str))) { if (m.index > i) segs.push([str.slice(i, m.index), 0]); segs.push([m[2], m[1] === '^' ? 1 : -1]); i = re.lastIndex; }
  if (i < str.length) segs.push([str.slice(i), 0]);
  const S = o.size || 48, so = s => Object.assign({}, o, { size: s ? S * .58 : S, align: 'l' }, s && o.supFont ? { font: o.supFont } : {});
  const ws = segs.map(([t, s]) => fr.measure(t, so(s)) + (s ? S * .04 : 0)), al = o.align || 'c';
  /* a superscript right after a subscript (x_{old}^{2}) stacks over it instead of following it */
  const stk = k => k > 0 && segs[k][1] === 1 && segs[k - 1][1] === -1;
  const adv = ws.map((w, k) => stk(k) ? Math.max(0, w - ws[k - 1]) : w), tot = adv.reduce((p, q) => p + q, 0);
  let cx = al === 'c' ? x - tot / 2 : al === 'r' ? x - tot : x;
  segs.forEach(([t, s], k) => { const x0 = stk(k) ? cx - adv[k - 1] : cx; fr.text(t, x0 + (s ? S * .02 : 0), y + (s === 1 ? -S * .42 : s === -1 ? S * .2 : 0), so(s)); cx += adv[k]; });
  return tot;
}
const COL = { REF: '#E9EDF3', FAKE: '#FFD36E', ERR: '#6E52B5', OK: '#9BF07A', FAC: '#FF4FA8', VAR: '#7CC4FF', DIM: '#5E6B77', AX: '#3E4A58', SOFT: '#AEB8C2', RED: '#FF5A6A', ORANGE: '#FF9E40' };

function plot(box, x0, x1, y0, y1) {
  const [L, T, R, B] = box;
  const P = { L, T, R, B, x0, x1, y0, y1 };
  P.X = x => L + (R - L) * (x - x0) / (x1 - x0);
  P.Y = y => B - (B - T) * (y - y0) / (y1 - y0);
  P.axes = (fr, a, o = {}) => {
    if (a <= .003) return;
    if (y0 < 0 && y1 > 0) fr.line(L, P.Y(0), R, P.Y(0), { w: 1.4, color: COL.AX, a });
    if (x0 < 0 && x1 > 0) fr.line(P.X(0), T, P.X(0), B, { w: 1.4, color: COL.AX, a });
    (o.xt || []).forEach(v => { fr.line(P.X(v), P.Y(0) - 6, P.X(v), P.Y(0) + 6, { w: 1.4, color: COL.AX, a }); fr.text(String(v).replace('-', '−'), P.X(v), P.Y(0) + 32, { font: 'latin', size: 22, color: COL.DIM, a }); });
  };
  return P;
}
/* sample a function across the plot (clipped to the plot box by the caller) */
function pts(P, f, n = 360, xa, xb) {
  const a = xa == null ? P.x0 : xa, b = xb == null ? P.x1 : xb, out = [];
  for (let i = 0; i <= n; i++) { const x = lerp(a, b, i / n), y = f(x); out.push([P.X(x), P.Y(Math.max(P.y0 - 5, Math.min(P.y1 + 5, y)))]); }
  return out;
}
function curve(fr, P, f, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= .003) return;
  fr.g({ clip: [P.L - 2, P.T - 2, P.R - P.L + 4, P.B - P.T + 4] }, () => fr.poly(pts(P, f, o.n || 360, o.xa, o.xb), { color: o.color || COL.REF, w: o.w || 2.4, a, glow: o.glow, k: o.k }));
}
function errFill(fr, P, f, g, a, xa, xb) {
  if (a <= .003) return;
  const top = pts(P, f, 240, xa, xb), bot = pts(P, g, 240, xa, xb).reverse();
  fr.g({ clip: [P.L, P.T, P.R - P.L, P.B - P.T] }, () => fr.poly(top.concat(bot), { fill: COL.ERR, close: true, a: .38 * a }));
}
/* half-width of the symmetric window around c where |f − g| < tol */
function fitWin(f, g, tol = .01, c = 0, lim = 12, step = .002) {
  let w = 0;
  while (w < lim && Math.abs(f(c + w) - g(c + w)) < tol && Math.abs(f(c - w) - g(c - w)) < tol) w += step;
  return w;
}
function brackets(fr, P, w, a, o = {}) {
  if (a <= .003) return;
  const c = o.c || 0, y = P.Y(o.y || 0), xa = Math.max(P.L + 6, P.X(c - w)), xb = Math.min(P.R - 6, P.X(c + w)), h = 22, col = COL.FAKE;
  [[xa, 1], [xb, -1]].forEach(([x, s]) => fr.poly([[x + 10 * s, y - h], [x, y - h], [x, y + h], [x + 10 * s, y + h]], { color: col, w: 3, a, glow: 6 }));
  if (o.label !== false) fr.text('±' + w.toFixed(2), (xa + xb) / 2, y - h - 14, { font: 'mono', size: 22, color: col, a });
}
/* a dot on the reference, a bar to the candidate, and the gap as a number */
function probe(fr, P, f, g, x, a) {
  if (a <= .003) return;
  const yf = f(x), yg = g(x), X = P.X(x);
  fr.line(X, P.Y(yf), X, P.Y(Math.max(P.y0, Math.min(P.y1, yg))), { w: 3, color: '#B49BFF', a, glow: 6 });
  fr.circle(X, P.Y(yf), 9, { fill: '#9FE6FF', a }); fr.glow(X, P.Y(yf), 26, '#9FE6FF', .5 * a);
  fr.text(Math.abs(yf - yg).toFixed(2), X + 18, (P.Y(yf) + P.Y(Math.max(P.y0, Math.min(P.y1, yg)))) / 2 + 8, { font: 'latin', size: 30, color: '#B49BFF', align: 'l', a });
}
/* rows: [label (mtext), value string or null, matched 0..1] */
function scoreboard(fr, x, y, rows, a) {
  if (a <= .003) return;
  fr.line(x - 20, y - 40, x - 20, y + rows.length * 62 - 30, { w: 1, color: COL.AX, a });
  rows.forEach(([lab, val, k], i) => {
    const yy = y + i * 62;
    mtext(fr, lab, x, yy, { font: 'latin', size: 34, color: COL.SOFT, align: 'l', a });
    fr.line(x, yy + 20, x + 360, yy + 20, { w: 1, color: COL.AX, a: .6 * a });
    if (val != null && k > 0) { fr.text(val, x + 330, yy, { font: 'latin', size: 34, color: COL.ORANGE, align: 'r', a: a * k });
      fr.glow(x - 34, yy - 10, 14, COL.FAKE, .8 * a * k); fr.circle(x - 34, yy - 10, 5, { fill: COL.FAKE, a: a * k }); }
  });
}
/* Formula layout (a small box model, so stacked pieces never collide).
 * A part is: 'text' (mtext: x^{2}, a_{n}) · {t, c, i} coloured text (i: italic; the variable colour is italic by default) ·
 * {n, d, nc, dc, k} a fraction (n, d: any part or list of parts; dc defaults to the factorial colour) ·
 * {r, c} a square root whose bar covers the whole content · or a list of parts.
 * Boxes are {w, asc, desc} measured from y, the text middle line (fr.text draws with textBaseline 'middle').
 * Formulas use Lora (sturdier than Cormorant at small sizes); FONT changes it for the whole film. */
const FONT = { up: 'lorar', it: 'lora' };
function lay(fr, p, s, col, x, y, a, draw) {
  if (Array.isArray(p)) { let w = 0, asc = 0, desc = 0; p.forEach(q => { const b = lay(fr, q, s, col, x + w, y, a, draw); w += b.w; asc = Math.max(asc, b.asc); desc = Math.max(desc, b.desc); }); return { w, asc, desc }; }
  if (typeof p === 'string' || p.t != null) {
    const str = typeof p === 'string' ? p : p.t, c = (typeof p === 'object' && p.c) || col, it = typeof p === 'object' && (p.i || (p.i !== false && p.c === COL.VAR));
    const w = mtext(fr, str, x, y, { font: it ? FONT.it : FONT.up, supFont: FONT.up, size: s, color: c, align: 'l', a: draw ? a : 0, glow: p.glow, glowA: .35 }) + (it ? s * .04 : 0);
    return { w, asc: (/\^\{/.test(str) ? .7 : .47) * s, desc: .34 * s };
  }
  if (p.n != null) {
    const k = p.k || .8, gap = .13 * s, dc = p.dc || COL.FAC, nc = p.nc || col;
    const n = lay(fr, p.n, s * k, nc, 0, 0, 0, false), d = lay(fr, p.d, s * k, dc, 0, 0, 0, false), w = Math.max(n.w, d.w) + .26 * s;
    if (draw) {
      lay(fr, p.n, s * k, nc, x + (w - n.w) / 2, y - gap - n.desc, a, true);
      fr.line(x + .07 * s, y, x + w - .07 * s, y, { w: Math.max(1.6, s * .045), color: col, a });
      lay(fr, p.d, s * k, dc, x + (w - d.w) / 2, y + gap + d.asc, a, true);
    }
    return { w, asc: gap + n.desc + n.asc, desc: gap + d.asc + d.desc };
  }
  if (p.r != null) {
    const c = p.c || col, in_ = lay(fr, p.r, s, c, 0, 0, 0, false), yv = y - in_.asc - .1 * s, yb = y + in_.desc, sw = .5 * s, w = sw + in_.w + .2 * s;
    if (draw) {
      fr.poly([[x, lerp(yv, yb, .6)], [x + .1 * s, lerp(yv, yb, .5)], [x + .25 * s, yb], [x + sw, yv], [x + w - .04 * s, yv]], { color: col, w: Math.max(1.8, s * .05), a });
      lay(fr, p.r, s, c, x + sw + .08 * s, y, a, true);
    }
    return { w, asc: in_.asc + .14 * s, desc: in_.desc + .04 * s };
  }
  throw new Error('formula: unknown part ' + JSON.stringify(p));
}
/* formula(fr, parts, cx, y, {size, color, a, align, alphas}): alphas fade the top-level parts one by one.
 * Returns {w, asc, desc, xs: [[x0, x1], …]} so scenes can point at a part. */
function formula(fr, parts, cx, y, o = {}) {
  const S = o.size || 52, base = o.color || COL.REF, A = o.a == null ? 1 : o.a, al = o.alphas || [];
  const boxes = parts.map(p => lay(fr, p, S, base, 0, 0, 0, false)), tot = boxes.reduce((p, q) => p + q.w, 0);
  let x = o.align === 'l' ? cx : o.align === 'r' ? cx - tot : cx - tot / 2; const xs = [];
  parts.forEach((p, i) => { const a = A * (al[i] == null ? 1 : al[i]); if (a > .003) lay(fr, p, S, base, x, y, a, true); xs.push([x, x + boxes[i].w]); x += boxes[i].w; });
  return { w: tot, asc: Math.max(...boxes.map(b => b.asc)), desc: Math.max(...boxes.map(b => b.desc)), xs };
}
/* a number whose leading correct digits glow green against the true value */
function digits(fr, str, truth, x, y, a, o = {}) {
  if (a <= .003) return;
  let k = 0; while (k < str.length && str[k] === truth[k]) k++;
  const S = o.size || 76, f = { font: 'mono', size: S }, w = fr.measure(str, f), x0 = x - w / 2;
  fr.text(str.slice(0, k), x0, y, Object.assign({}, f, { color: COL.OK, align: 'l', a, glow: 10, glowA: .4 }));
  fr.text(str.slice(k), x0 + fr.measure(str.slice(0, k), f), y, Object.assign({}, f, { color: '#8A94A6', align: 'l', a }));
}
/* a round magnifier at (cx, cy) radius r, showing draw() in a zoomed frame, with a leader line to (tx, ty) */
function magnifier(fr, cx, cy, r, tx, ty, a, label, draw) {
  if (a <= .003) return;
  fr.line(tx, ty, cx + (tx - cx) * r / Math.hypot(tx - cx, ty - cy), cy + (ty - cy) * r / Math.hypot(tx - cx, ty - cy), { w: 1.2, color: COL.SOFT, a: .6 * a });
  fr.circle(cx, cy, r, { fill: '#05080C', a: .92 * a });
  fr.g({ a }, () => { fr.x.beginPath(); fr.x.arc(cx, cy, r, 0, Math.PI * 2); fr.x.clip(); draw(); });   /* round clip: nothing pokes out of the lens */
  fr.circle(cx, cy, r, { color: COL.SOFT, w: 2, a });
  if (label) fr.text(label, cx - r - 14, cy + 8, { font: 'mono', size: 20, color: COL.SOFT, align: 'r', a });
}
/* polynomial from a coefficient list; morph(c0, c1, k) blends two coefficient lists */
const poly = cs => x => { let s = 0, p = 1; for (const c of cs) { s += c * p; p *= x; } return s; };
const morph = (c0, c1, k) => { const n = Math.max(c0.length, c1.length), out = []; for (let i = 0; i < n; i++) out.push(lerp(c0[i] || 0, c1[i] || 0, k)); return out; };
const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
/* Taylor coefficients at 0 for the film's functions, up to degree n */
const TC = {
  cos: n => { const c = []; for (let k = 0; k <= n; k++) c.push(k % 2 ? 0 : (k % 4 === 0 ? 1 : -1) / fact(k)); return c; },
  sin: n => { const c = []; for (let k = 0; k <= n; k++) c.push(k % 2 === 0 ? 0 : (k % 4 === 1 ? 1 : -1) / fact(k)); return c; },
  exp: n => { const c = []; for (let k = 0; k <= n; k++) c.push(1 / fact(k)); return c; },
  hill: n => { const c = []; for (let k = 0; k <= n; k++) c.push(k % 2 ? 0 : (k % 4 === 0 ? 1 : -1)); return c; },
};
/* step through a list of degrees at given times, with a smooth morph between them */
function stepper(times, degs, t, coef, dur = .8) {
  let i = 0; times.forEach((tk, j) => { if (t >= tk) i = j; });
  const k = E.io3(seg(t, times[i], times[i] + dur)), prev = i > 0 ? coef(degs[i - 1]) : coef(degs[0]);
  return { c: i > 0 ? morph(prev, coef(degs[i]), k) : coef(degs[0]), deg: degs[i], i, k };
}
/* A 3D surface z = f(x, y), drawn as lit quads in painter's order (far first), like a rendered landscape.
 * cam: {cx, cy, scale, yaw, elev, zs, persp, o: [x, y] world point at the centre}. layers drawn in order (translucent fits after the ground):
 * {f, x0, x1, y0, y1, n, rgb: [r, g, b], a, spec, seeThrough} on a square grid, or {f, polar: {c: [x, y], R}, n, …} on a disc (a smooth round edge). Returns P(x, y, z) → [sx, sy] for balls, labels and paths on the surface. */
function surf3d(fr, cam, layers, a = 1) {
  const { cx, cy, scale, yaw, elev } = cam, zs = cam.zs || 1, pp = cam.persp == null ? .05 : cam.persp;
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), ce = Math.cos(elev), se = Math.sin(elev);
  const ox = cam.o ? cam.o[0] : 0, oy = cam.o ? cam.o[1] : 0;
  const rot = (x, y, z) => { x -= ox; y -= oy; const X = x * cy_ - y * sy_, Y = x * sy_ + y * cy_, Z = z * zs; return [X, Y, Z]; };
  const proj = ([X, Y, Z]) => { const up = Z * ce + Y * se, dp = Y * ce - Z * se, k = 1 / (1 + dp * pp); return [cx + scale * X * k, cy - scale * up * k, dp]; };
  const P = (x, y, z) => proj(rot(x, y, z));
  if (a <= .003) return P;
  const L = norm3([-.45, -.55, .75]), V = [0, -ce, se], H = norm3([L[0] + V[0], L[1] + V[1], L[2] + V[2]]), g = fr.x;
  layers.forEach(ly => {
    const n = ly.n || 44, la = (ly.a == null ? 1 : ly.a) * a; if (la <= .003) return;
    const R = [], S = [];
    for (let j = 0; j <= n; j++) { R.push([]); S.push([]); for (let i = 0; i <= n; i++) {
      let x, y; if (ly.polar) { const q = j / n * TAU2, rr = ly.polar.R * i / n; x = ly.polar.c[0] + rr * Math.cos(q); y = ly.polar.c[1] + rr * Math.sin(q); }
      else { x = lerp(ly.x0, ly.x1, i / n); y = lerp(ly.y0, ly.y1, j / n); }
      const r = rot(x, y, ly.f(x, y)); R[j].push(r); S[j].push(proj(r)); } }
    const quads = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p0 = R[j][i], p1 = R[j][i + 1], p2 = R[j + 1][i + 1], p3 = R[j + 1][i];
      const u = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]], v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
      let nn = norm3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]); if (nn[2] < 0) nn = nn.map(q => -q);
      const dif = Math.max(0, dot3(nn, L)), spec = (ly.spec == null ? .35 : ly.spec) * Math.pow(Math.max(0, dot3(nn, H)), 14), sh = .22 + .78 * dif;
      quads.push([(S[j][i][2] + S[j][i + 1][2] + S[j + 1][i + 1][2] + S[j + 1][i][2]) / 4, [S[j][i], S[j][i + 1], S[j + 1][i + 1], S[j + 1][i]], sh, spec]);
    }
    quads.sort((q, w) => w[0] - q[0]);
    g.save(); g.globalAlpha *= la; g.lineJoin = 'round';
    const [r0, g0, b0] = ly.rgb || [80, 125, 215];
    quads.forEach(([, pts, sh, sp]) => {
      const c = `rgb(${Math.min(255, r0 * sh + 255 * sp) | 0},${Math.min(255, g0 * sh + 255 * sp) | 0},${Math.min(255, b0 * sh + 255 * sp) | 0})`;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q < 4; q++) g.lineTo(pts[q][0], pts[q][1]); g.closePath();
      g.fillStyle = c; g.fill(); if (!ly.seeThrough) { g.strokeStyle = c; g.lineWidth = 1; g.stroke(); }
    });
    g.restore();
  });
  return P;
}
const TAU2 = Math.PI * 2, dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2], norm3 = p => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
/* second-order Taylor fit of f(x, y) at (a, b): value, gradient, Hessian, the bowl q(x, y), and its lowest point (one Newton step) */
function fit2(f, a, b, h = 1e-3) {
  const f0 = f(a, b), gx = (f(a + h, b) - f(a - h, b)) / 2 / h, gy = (f(a, b + h) - f(a, b - h)) / 2 / h;
  const xx = (f(a + h, b) - 2 * f0 + f(a - h, b)) / h / h, yy = (f(a, b + h) - 2 * f0 + f(a, b - h)) / h / h, xy = (f(a + h, b + h) - f(a + h, b - h) - f(a - h, b + h) + f(a - h, b - h)) / 4 / h / h;
  const q = (x, y) => { const dx = x - a, dy = y - b; return f0 + gx * dx + gy * dy + .5 * (xx * dx * dx + 2 * xy * dx * dy + yy * dy * dy); };
  const det = xx * yy - xy * xy, mx = a - (yy * gx - xy * gy) / det, my = b - (-xy * gx + xx * gy) / det;
  return { q, min: [mx, my], convex: det > 0 && xx > 0 };
}
window.KIT = { mtext, COL, FONT, plot, pts, curve, errFill, fitWin, brackets, probe, scoreboard, formula, surf3d, fit2, digits, magnifier, poly, morph, fact, TC, stepper };
})();
