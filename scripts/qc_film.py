"""QC a mixed film in one call and print a short report (used by scripts/finish.sh).

    python scripts/qc_film.py <video.mp4> [--film <project>/film] [--sample] [--sheet <out.jpg>] [--json <out.json>]

Gates (exit 1 if any fails): 1920x1080, 30 fps, integrated loudness -15..-13 LUFS, true peak <= -1 dBTP,
no black segment >= 0.5 s, and for a full film (not --sample) length >= 8:00 and within 0.5 s of the timeline.
Info lines: loudness of a narrated window and of the music outro, and the score bed against the -16 LUFS voice.
Needs only ffmpeg/ffprobe and node (to read film/timing.js).
"""

import json
import re
import subprocess
import sys
from pathlib import Path

MIN_S = 480.0          # Cutaway QC: mid-roll ads need 8:00 (cutaway-min-length)
LUFS = (-15.0, -13.0)  # Cutaway QC range around -14
TP_MAX = -1.0


def ff(args: list) -> str:
    """Run ffmpeg with a null output and return its stderr."""
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args, "-f", "null", "-"],
                          capture_output=True, text=True).stderr


def loud(path: str, ss: float = 0, t: float = 0) -> tuple:
    """Integrated loudness and true peak of a file or a window of it."""
    win = (["-ss", str(ss)] if ss else []) + (["-t", str(t)] if t else [])
    err = ff([*win, "-i", path, "-vn", "-af", "ebur128=peak=true"])
    summ = err[err.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ)[1]), float(re.search(r"Peak:\s+(-?[\d.inf]+) dBFS", summ)[1])


def timeline(film: Path) -> dict:
    """Read window.TL from film/timing.js."""
    js = "global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(window.TL))"
    return json.loads(subprocess.run(["node", "-e", js, str(film / "timing.js")], capture_output=True, text=True, check=True).stdout)


def main() -> None:
    """Measure, check the gates, write the sheet and JSON, print the report."""
    a = sys.argv[1:]
    if not a or a[0].startswith("-"):
        sys.exit(__doc__)
    vid = a[0]
    opt = lambda k: a[a.index(k) + 1] if k in a else None  # noqa: E731
    film, sample, sheet, out_json = opt("--film"), "--sample" in a, opt("--sheet"), opt("--json")

    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                                    "stream=width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", vid],
                                   capture_output=True, text=True, check=True).stdout)
    st, dur = pr["streams"][0], float(pr["format"]["duration"])
    num, den = map(int, st["r_frame_rate"].split("/"))
    fps = num / den
    err = ff(["-i", vid, "-vf", "blackdetect=d=0.5:pix_th=0.05", "-af", "ebur128=peak=true"])
    black = re.findall(r"black_start:(\S+) black_end:(\S+)", err)
    summ = err[err.rindex("Summary:"):]
    lufs = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ)[1])
    tp = float(re.search(r"Peak:\s+(-?[\d.inf]+) dBFS", summ)[1])

    rep = {"file": vid, "width": st["width"], "height": st["height"], "fps": round(fps, 3), "frames": int(st.get("nb_frames", 0)),
           "duration": round(dur, 2), "integrated_lufs": lufs, "true_peak_dbtp": tp, "black_segments": black}
    fails = []
    if (st["width"], st["height"]) != (1920, 1080):
        fails.append(f"size {st['width']}x{st['height']}")
    if abs(fps - 30) > .01:
        fails.append(f"fps {fps:g}")
    if not LUFS[0] <= lufs <= LUFS[1]:
        fails.append(f"loudness {lufs} LUFS (want -14)")
    if tp > TP_MAX:
        fails.append(f"true peak {tp} dBTP > {TP_MAX}")
    if black:
        fails.append(f"black segments {black}")

    info, warns = [], []
    if film:
        tl = timeline(Path(film))
        rep["timeline"] = tl["dur"]
        if not sample:
            if dur < MIN_S:
                fails.append(f"length {dur:.1f}s < {MIN_S:.0f}s (lengthen with a real scene, never waive)")
            if abs(dur - tl["dur"]) > .5:
                fails.append(f"length {dur:.1f}s but timeline {tl['dur']:.1f}s")
            spoken = [tl["lines"][k] for k in tl["order"] if tl["lines"][k]["sub"]]
            last = max(L["b"] for L in spoken)
            w0 = round(dur * .3, 1)
            nI, _ = loud(vid, w0, 20)
            info.append(f"narrated {w0:g}-{w0 + 20:g}s {nI} LUFS")
            rep["narrated_window_lufs"] = nI
            if tl["dur"] - last > 10:                                   # a music-only outro
                o0 = round(last + 1, 1)
                oI, _ = loud(vid, o0, min(20, dur - o0 - 1))
                info.append(f"outro from {o0:g}s {oI} LUFS")
                rep["outro_lufs"] = oI
                if oI < nI - 6:
                    warns.append(f"outro {nI - oI:.1f} LU quieter than the narration (raise OUTRO_GAIN in mix.sh)")
        score = Path(film) / "audio" / "score.wav"
        if score.exists():
            sI, _ = loud(str(score))
            bed = round(sI - 12.04, 1)                                   # mix.sh plays the score at x0.25 before ducking
            info.append(f"score bed {bed} LUFS vs voice -16")
            rep["score_bed_lufs"] = bed
            if bed > -22:
                warns.append("score bed within 6 LU of the voice: the narration may sound buried")
    if sheet:
        Path(sheet).parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", vid, "-vf",
                        f"fps=16/{dur:.2f},scale=480:-1,tile=4x4", "-frames:v", "1", sheet], check=True)
    rep["failures"], rep["warnings"], rep["pass"] = fails, warns, not fails
    if out_json:
        Path(out_json).write_text(json.dumps(rep, indent=1))

    m, s = divmod(dur, 60)
    print(f"QC {Path(vid).name}: {'PASS' if not fails else 'FAIL'}")
    print(f"  {st['width']}x{st['height']} {fps:g}fps {int(m)}:{s:04.1f}" + (f" (timeline {rep['timeline']:.1f})" if film else "")
          + f" · {lufs} LUFS · TP {tp} dBTP · black: {'none' if not black else len(black)}")
    if info:
        print("  " + " · ".join(info))
    for f in fails:
        print("  FAIL", f)
    for w in warns:
        print("  WARN", w)
    if sheet:
        print("  sheet:", sheet)
    sys.exit(0 if not fails else 1)


if __name__ == "__main__":
    main()
