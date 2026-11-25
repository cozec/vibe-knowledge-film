/* Quiz (q0-q3a): three questions, options lit one by one as they are spoken, a 4 s clock, the answer glows.
 * Quiz numbers: TODO (check each answer in python). Options never hint at the answer (layout lesson 5); spoken with pauses (lesson 9).
 * QZ text: the question split into two lines; opts: the three options as drawn; size: 96 for numbers, 46 for words. */
(function () {
'use strict';
const { lerp, seg, ss, E } = VK;
const { A, B, L, at, check } = SB;
const { COL, formula } = KIT;
const PI2 = Math.PI * 2;

const QZ = [
  { q: 'q1', o: 'q1o', w: 'q1w', a: 'q1a', text: ['TODO first line', 'TODO second line?'], opts: ['A', 'B', 'C'], right: 1, size: 96 },
  { q: 'q2', o: 'q2o', w: 'q2w', a: 'q2a', text: ['TODO first line', 'TODO second line?'], opts: ['A', 'B', 'C'], right: 1, size: 96 },
  { q: 'q3', o: 'q3o', w: 'q3w', a: 'q3a', text: ['TODO first line', 'TODO second line?'], opts: ['A', 'B', 'C'], right: 1, size: 46 },
];
const KT = { in: A('q0') - .4, out: B('q3a') + 1.2 };
function quiz(fr, t) {
  if (t < KT.in - .2 || t > KT.out + .4) return;
  const vis = ss(t, KT.in, KT.in + .8) * (1 - ss(t, KT.out - .6, KT.out + .3));
  fr.g({ a: vis }, () => {
    const ha = ss(t, A('q0'), A('q0') + .6) * (1 - ss(t, A('q1') - .6, A('q1')));
    if (ha > 0) { fr.text('QUIZ', 960, 420, { font: 'latinl', size: 150, track: 20, color: COL.FAKE, a: ha, glow: 16, glowA: .35 }); fr.text('three quick questions', 960, 520, { font: 'latini', size: 40, color: COL.SOFT, a: ha }); }
    QZ.forEach((z, qi) => {
      const next = QZ[qi + 1] ? A(QZ[qi + 1].q) : KT.out, a = ss(t, A(z.q) - .3, A(z.q) + .3) * (1 - ss(t, next - .6, next)); if (a <= 0) return;
      const os = L(z.o).os || [0, .35, .7];
      fr.g({ a }, () => {
        fr.text('QUESTION ' + (qi + 1), 960, 150, { font: 'mono', size: 18, track: 6, color: COL.FAKE });
        z.text.forEach((s, i) => fr.text(s, 960, 250 + i * 64, { font: 'lorar', size: 46, color: COL.REF }));
        const oa = ss(t, A(z.o) - .2, A(z.o) + .3), ans = ss(t, A(z.a), A(z.a) + .4);
        z.opts.forEach((s, i) => {
          const cx = 480 + 480 * i, cy = 580, ok = i === z.right, col = ans > 0 ? (ok ? COL.FAKE : '#5E6B77') : '#C9D4DE', oi = oa * ss(t, at(z.o, os[i]) - .1, at(z.o, os[i]) + .25);
          fr.rect(cx - 200, cy - 100, 400, 230, { r: 16, fill: '#0F1620', color: col, w: ok && ans ? 3 : 1.6, a: oi * (ans > 0 && !ok ? .5 : 1) });
          fr.text('ABC'[i], cx - 165, cy - 55, { font: 'latin', size: 44, color: col, a: oi });
          fr.text(s, cx, cy + 30, { font: z.size > 60 ? 'lorar' : 'latini', size: z.size, color: col, a: oi });
          if (ok && ans > 0) { fr.glow(cx, cy, 220, COL.FAKE, .25 * ans); check(fr, cx + 150, cy - 55, 40, COL.FAKE, ss(t, A(z.a), A(z.a) + .5)); }
        });
        const w0 = A(z.w), w1 = B(z.w), wk = seg(t, w0, w1);
        if (t > w0 - .2 && t < w1 + .3) { const left = Math.max(1, Math.ceil(w1 - t)), fa = 1 - ss(t, w1, w1 + .3);
          fr.arc(960, 815, 40, -Math.PI / 2, -Math.PI / 2 + PI2 * (1 - wk), { color: COL.FAKE, w: 5, a: fa }); fr.text(String(left), 960, 817, { font: 'latin', size: 40, color: COL.FAKE, a: fa }); }
      });
    });
  });
  QZ.forEach(z => fr.sfx(A(z.a), 'bloom', { gain: .45 }));
  fr.sfx(A('q0'), 'chord', { gain: .35 });
}

window.CH = window.CH || {};
Object.assign(window.CH, { quiz });
})();
