"""Set up a new narrated maths film (references/math.md) in one call, and print a short brief.

    python3 scripts/new_math_film.py <slug> --title "The Ellipse" [--id ELLIPSE] [--from ellipse] [--force]

Builds projects/<slug>/ with the standard folders (output film src narration docs logs archive) and:
  src/   build_timeline.py and mix.sh copied from the --from project (default: ellipse, the newest approved film),
         cues.py from scripts/math_template (hook, a chapter stub, recap, 3-question quiz, farewell)
  film/  common.js and mascot.js from the --from project, kit.js = engine/vk-math.js, and from the template:
         film.js (subtitles, end card, 26 s music outro, draw order), ch_a.js (hook stub), ch_quiz.js, ch_cameo.js; index.html
  docs/plan.md skeleton, logs/<slug>_progress.md, and the topics.md row (by --id) marked "in progress".
Chapter files ch_b.js ... are written fresh for each film: nothing visual is copied.
"""

import datetime
import re
import shutil
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TPL = SKILL / "scripts" / "math_template"


def arg(a: list, key: str, default=None):
    """Value after a --flag, or the default."""
    return a[a.index(key) + 1] if key in a else default


def index_html(src: Path, chapters: list) -> str:
    """The --from project's index.html (fonts, styles) with this film's script list."""
    s = src.read_text()
    head = s[:s.index('<script src="timing.js"></script>')]
    tags = ["timing.js", "common.js", "kit.js", "mascot.js", *chapters, "ch_quiz.js", "ch_cameo.js", "film.js"]
    return head + "".join(f'<script src="{t}"></script>\n' for t in tags) + "</body></html>\n"


def main() -> None:
    """Create the project, then print the brief."""
    a = sys.argv[1:]
    if not a or a[0].startswith("-") or "--title" not in a:
        sys.exit(__doc__)
    slug, title = a[0].lower(), arg(a, "--title")
    tid, frm = arg(a, "--id", a[0].upper()), arg(a, "--from", "ellipse")
    P, S = SKILL / "projects" / slug, SKILL / "projects" / frm
    if not (S / "src" / "build_timeline.py").exists():
        sys.exit(f"--from {frm}: {S}/src/build_timeline.py not found")
    if (P / "film" / "film.js").exists() and "--force" not in a:
        sys.exit(f"{P}/film/film.js exists. Add --force to overwrite the scaffold files.")
    for d in ("output", "film", "src", "narration", "docs", "logs", "archive"):
        (P / d).mkdir(parents=True, exist_ok=True)

    old = re.search(r'for the film "([^"]+)"', (S / "src" / "build_timeline.py").read_text())
    bt = (S / "src" / "build_timeline.py").read_text()
    (P / "src" / "build_timeline.py").write_text(bt.replace(old[1], title) if old else bt)
    shutil.copy2(S / "src" / "mix.sh", P / "src" / "mix.sh")
    for f in ("common.js", "mascot.js"):
        shutil.copy2(S / "film" / f, P / "film" / f)
    shutil.copy2(SKILL / "engine" / "vk-math.js", P / "film" / "kit.js")
    for f, dest in (("cues.py", "src"), ("film.js", "film"), ("ch_a.js", "film"), ("ch_quiz.js", "film"), ("ch_cameo.js", "film")):
        (P / dest / f).write_text((TPL / f).read_text().replace("__TITLE__", title))
    (P / "film" / "index.html").write_text(index_html(S / "film" / "index.html", ["ch_a.js"]))

    today = datetime.date.today().isoformat()
    plan = P / "docs" / "plan.md"
    if not plan.exists():
        plan.write_text(f"""# {tid} — {title}

Made the Taylor-study way (`references/math.md`), template copied from `projects/{frm}/` on {today}.
Decided with Adam: TODO (subtitles, Cutty, quiz). Target: timeline dur >= 8:15 (incl. the 26 s outro).

## Thesis
TODO: one sentence.

## The gauges the viewer watches
- TODO: the quantity on screen that changes and shows each step worked.

## The opening (design first; show Adam a motion sample: opening-scene)
TODO

## Fact table (numbers computed in code; facts web-checked)

| Claim | Value | Source / check |
|---|---|---|

## Chapters
1. **Hook** (`h*`).
""")
    note = SKILL / "logs" / f"{slug}_progress.md"
    if not note.exists():
        note.write_text(f"# {tid} progress (job: {title})\nGoal: projects/{slug}/ film, math.md method, >= 8:15.\n"
                        f"Done: scaffold (scripts/new_math_film.py, {today}).\nNext: thesis + fact table in docs/plan.md, then src/cues.py.\n")
    topics = SKILL / "topics.md"
    row = ""
    if topics.exists():
        lines = topics.read_text().splitlines()
        for i, L in enumerate(lines):
            if re.match(rf"\| \[ \] \| {re.escape(tid)} \|", L):
                lines[i] = L.replace("| [ ] |", f"| [ ] in progress (started {today}) |", 1)
                topics.write_text("\n".join(lines) + "\n")
                row = "marked in progress"
                break
            if f"| {tid} |" in L:
                row = "row found, status left as is"
                break
        else:
            row = f"no row for {tid}: add one"

    py = "/Users/adam/project_video/local_pipeline/.venv/bin/python"
    print(f"""Made projects/{slug}/ ("{title}", from {frm}); topics.md: {row}; progress note logs/{slug}_progress.md.

Cue format (src/cues.py): (id, subtitle, pause_before_s, {{say, marks, big}}); sub=None + {{"snd": ("clock", [], 4.0)}} is a sound slot.
  {{a}} gold / {{!a}} red in subtitles. Quiz cues q0..q3a are in place: edit QZ in film/ch_quiz.js to match.
Scenes: one chapter per file film/ch_<x>.js, functions on window.CH, add the name to SCENES in film.js and the file to index.html.
  Anchors: SB.A(id) start, SB.B(id) end, SB.at(id, frac), W(id, word) from marks. Kit: KIT.formula/plot/curve/errFill/
  fitWin/brackets/probe/scoreboard/digits/magnifier/surf3d/fit2 (references/math.md). Cutty: CAMEOS in ch_cameo.js.
Commands (from {SKILL}):
  cd projects/{slug} && caffeinate -dimsu {py} src/build_timeline.py   # TTS + timing.js; printed dur (incl. the 26 s outro) >= 495 s (8:15)
  .venv/bin/python engine/render.py projects/{slug}/film --stills 1 5 9     # full-size stills -> film/review/
  .venv/bin/python engine/render.py projects/{slug}/film --motion 0 10      # 12-frame motion sheet
  scripts/finish.sh projects/{slug} {slug}_opening_v1 --clip 0 34           # opening sample: render, mix, QC (background)
  scripts/finish.sh projects/{slug} {slug}_v1                               # full film: --det, --jobs 2, mix, QC (background)
Before Adam sees a frame: math.md review checklist + layout-lessons on full-size stills; every number checked in code.
Then the package: cutaway/src/vibe_package.py {tid} (config in cutaway/results/{tid}/package.py).""")


if __name__ == "__main__":
    main()
