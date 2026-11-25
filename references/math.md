# 数学讲解片：让每张图都是一块仪表

有旁白的数学讲解片（不是本 skill 主打的无旁白字幕片）用这一页。做法学自 Aion 的《The Math Trick That Turns Any Function Into a Polynomial》，
在 `projects/taylor_study/`（私用学习片，不上传）里完整做过一遍，又按审片意见改过一轮。件在 `engine/vk-math.js`（`window.KIT`）。

## 做法

1. **图是仪表，不是插图。** 真曲线白色，冒牌货（近似）发光的金色，两者之间的误差填紫色。误差能看见，才谈得上"更好了"。
2. **活的读数。** 好用区间 `[ ]` 带 ± 读数（`fitWin` + `brackets`）、某一点的差值探针（`probe`）、条件记分板（`scoreboard`）、
   对上的位数变绿（`digits`）、小到看不见的部分用放大镜（`magnifier`）。观众盯着一个数在变，就知道这一步有没有用。
3. **先失败，再修。** 先试最笨的版本，让它当场露馅，每一步只修一处，看懂以后才给名字。
4. **一张画布到底。** 不切黑、不做章节卡；东西留在屏上、变形成下一个。
5. **开头列承诺，后面一项项兑现**；回到开头那个物件（计算器芯片）收尾；留一章"图上看不出原因"的反转（复平面）；结尾回顾 + 预告。
6. **全片一套颜色**：参考白、冒牌金、误差紫、正确绿、阶乘品红、变量蓝。
7. 约 150 词/分钟，屏上字少；不烧字幕。

## 公式：`formula(fr, parts, cx, y, {size, align, a, alphas})`

部件可以嵌套，排版按盒子算（上沿、下沿），分数、根号、上标不会互相压：

| 部件 | 写法 |
|---|---|
| 普通字 | `'f(0) + '`，上标 `'x^{2}'`，下标 `'a_{n}'` |
| 着色 | `{ t: 'x^{2}', c: COL.VAR }`（变量色默认斜体；`i: true/false` 强制） |
| 分数 | `{ n: 分子, d: 分母, nc, dc }`，分子分母可以是任意部件或部件列表；`dc` 默认阶乘品红 |
| 根号 | `{ r: [ '1 − ', { n: …, d: … } ] }`：横线按内容长度画，盖住整个被开方式 |

返回 `{w, asc, desc, xs}`，`xs[i]` 是第 i 个顶层部件的横向范围，用来在它下面标字。

**字号门槛**（1080p）：主角公式 100–130；常驻在角上的公式 ≥ 60；副式 ≥ 52。画面有空就放大——审片时"公式太小、看不清"是第一条意见。
字体用 Lora（`FONT.up/it`），Cormorant 在 60 以下太细。**一个公式占一条带子**：别的图、记分板、轮盘让开它的上下沿，不要叠在图上。

## 3D 曲面：`surf3d(fr, cam, layers)` + `fit2(f, a, b)`

讲"地形""多变量""优化"时画一张打光的曲面，比平面曲线有说服力得多：

- `cam = { cx, cy, scale, yaw, elev, zs, o }`：`o` 是放在画面中心的世界坐标点（对准山谷），`yaw` 随时间慢慢转一点（每秒 0.05）出立体感。
- 地面层 `{ f, x0, x1, y0, y1, n: 76, rgb: [62, 104, 196], spec: .3 }`：网格 ≥ 70，高光弱一点，否则看得出方块。
- 拟合层（二阶泰勒的"碗"）`{ f: fit2(f, a, b).q, polar: { c: [a, b], R }, rgb: [235, 180, 80], a: .55, spec: .12, seeThrough: true }`：
  用圆盘网格，边是圆的；`R` 从 0 长出来。
- `fit2` 还给出碗底 `min`（一步牛顿）和 `convex`。选起点前在 node 里把整条路径验一遍，每一步都要是凸的。
- 返回 `P(x, y, z) → [sx, sy]`，用来放球、虚线路径、标签。上方留一条标题带，曲面的远角不要顶到字。

## 说到哪个，哪个就亮

旁白说"加、减、乘、除"时，屏上的四个键要一个个亮，不是一起亮。`build_timeline.py` 支持在 cue 里写
`{"marks": ["add", "subtract", …]}`：TTS 时取 Kokoro 的词时间戳，写进 `TL.lines[id].m = {词: 句内秒数}`。场景里：

```js
const W = (id, w) => SB.A(id) + SB.L(id).m[w];
const pulse = (tw, keep) => ss(t, tw - .06, tw + .1) * (1 - (1 - keep) * ss(t, tw + .55, tw + .95));   // 亮起，再落到 keep
```

亮的样子：放大约 16%、填上自己的颜色、加一圈辉光、字变白，并配一声很轻的 `tick`。实现在 `projects/taylor_study/src/build_timeline.py`。

## 数字

屏上每个算式都要算对。第一版写了 `12 − 4 + 5 = 17`（应为 13），是手写进文案和画面的，没有验算。规矩：

- 文案和画面里的每个结果，要么由代码算出来，要么在 node/python 里验算一遍，再把核算写进章节文件头的注释（`Numbers: …`）。
- 改文案时连 `say`（念出来的那一句）一起改，两处的数要一致。

## 从零做一条（照 taylor_study v2 的流程，已过审）

建工程用一条命令：`python3 scripts/new_math_film.py <slug> --title "片名" --id <ID> [--from ellipse]`。它建好标准目录，从 `--from` 工程（默认 `projects/ellipse/`，最新过审的一条）复制 `build_timeline.py` `mix.sh` `common.js` `mascot.js`，`kit.js` 取 `engine/vk-math.js`，再从 `scripts/math_template/` 放进 `cues.py` 骨架、`film.js`（字幕、片尾卡、26 秒音乐尾声）、`ch_a.js`（钩子空壳）、`ch_quiz.js`、`ch_cameo.js`，写好 `docs/plan.md` 骨架、进度记录，并把 `topics.md` 那一行标成 in progress。画面一行都不复制：章节文件 `ch_*.js` 每条片重写。

1. **文案**：`src/cues.py` 一行一句，`(id, 字幕, 句前停顿, {say, marks})`。约 150 词/分钟。写完把每个数在 python 里算一遍。
2. **配音和时间轴**：`build_timeline.py` 用 Kokoro 合成，写出 `film/timing.js`（`TL`，含 `m` 词时间）和 `narration/narration.wav`。改文案后重跑，场景自动重排时间。
3. **场景**：每章一个文件，场景按 `SB.A(id)` 定位。先挑"观众盯着看的那个量"，再画。公式一律用 `formula`，按字号门槛定大小，先给每个公式划好自己的带子。
4. **自审静帧**（交给审片人之前）：`render.py film --stills t1,t2,…`，每个场景取最挤的一刻和每个公式第一次出现的一刻，原尺寸看，逐条过下面的清单。
5. **渲染和合成**：`scripts/finish.sh projects/<slug> <slug>_v1`（放后台跑，自带 caffeinate）一次做完 `--det`、`--jobs 2`、`--events`、`audio.py --wav-only`、`src/mix.sh`（尾声起点从 `timing.js` 自动算），再出 QC：1920×1080、30 fps、−14 LUFS、真峰值、无黑场、≥ 8:00 且和时间轴对得上、旁白段和尾声段的响度、配乐垫底和人声的差，外加一张 `film/review/<名字>_sheet.jpg`。最后一行是 `FINISH_OK` 或 `FINISH_FAILED`。开头样片用 `--clip 0 34`，只改了音效或混音用 `--mix-only`。
6. 新版本另存为 `output/<slug>_v2.mp4`，旧版留着对比。
7. **上传包**：在 `cutaway/results/<ID>/package.py` 写配置（标题、章节、简介、标签、候选帧、缩略图、置顶问题，字段见 `cutaway/src/vibe_package.py` 的文件头），先 `vibe_package.py <ID> --frames` 看候选帧，再 `vibe_package.py <ID>` 一次出齐硬链接视频、srt、简介、标签、缩略图、`pinned.txt`、`qc.json` 和 `UPLOAD.md`。

## 审片清单（第一轮审片的意见）

| 看到 | 改法 |
|---|---|
| 旁白说到的东西屏上没反应 | 用 `marks` 按词点亮 |
| 屏上算式算错 | 代码算或验算，写进注释 |
| 公式小、细、难读 | 按字号门槛放大，换 Lora |
| 公式之间、公式和图叠在一起 | 一式一带，其他东西让位 |
| 根号横线没盖住被开方式 | 用 `{ r: … }`，不要写 `√(…)` |
| 多维的东西用平面画 | `surf3d` + `fit2` |
| 主角公式不够大 | 参考片的主公式约占画面高度的 1/4 |
