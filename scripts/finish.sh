#!/bin/zsh
# Render, mix and QC a narrated film in one call (references/math.md, step 5). Run it in the background.
#   scripts/finish.sh <project> <name>               full film: --det, --jobs 2, events, audio, mix -> output/<name>.mp4, QC
#   scripts/finish.sh <project> <name> --clip A B    film time A..B only (a sample) -> output/<name>.mp4, QC without the length gate
#   scripts/finish.sh <project> <name> --mix-only    reuse film/renders/raw.mp4: events, audio, mix, QC (after sound or mix edits)
# <project> is projects/<slug> (film/, src/mix.sh, output/). The outro start (OUTRO for mix.sh) comes from film/timing.js:
# last spoken line + 0.6 s, when the timeline ends more than 10 s after it; set OUTRO=... to override. JOBS=2 by default.
# Log: <project>/logs/<name>.log. Sheet: film/review/<name>_sheet.jpg. QC JSON: logs/<name>_qc.json.
# The last line is FINISH_OK or FINISH_FAILED. Holds caffeinate for the whole run.
set -uo pipefail
SKILL=${0:A:h:h}; PY=$SKILL/.venv/bin/python; R=$SKILL/engine/render.py
P=${1:?usage: finish.sh <project> <name> [--clip A B | --mix-only]}; NAME=${2:?name}; shift 2
P=${P:A}; MODE=full; CA=0; CB=0
case "${1:-}" in
  --clip) MODE=clip; CA=$2; CB=$3;;
  --mix-only) MODE=mix;;
  "") ;;
  *) echo "unknown option $1"; exit 2;;
esac
[[ -f $P/film/film.js && -f $P/src/mix.sh ]] || { echo "$P has no film/film.js or src/mix.sh"; exit 2; }
mkdir -p $P/logs $P/output
LOG=$P/logs/$NAME.log; : > $LOG
caffeinate -dimsu -w $$ &
say() { print -r -- "== $(date +%T) $*" | tee -a $LOG; }
fail() { print -r -- "FAILED: $*" | tee -a $LOG; print FINISH_FAILED | tee -a $LOG; exit 1; }
run() { "$@" >> $LOG 2>&1 || fail "$* (see $LOG)"; }

T0=$SECONDS
if [[ $MODE == full ]]; then
  say "determinism check"
  out=$($PY $R $P/film --det 2>&1); print -r -- "$out" >> $LOG
  [[ $out == *"NOT deterministic"* || $out != *deterministic* ]] && fail "render.py --det: ${out##*$'\n'}"
  say "render, ${JOBS:-2} jobs"
  run $PY $R $P/film --jobs ${JOBS:-2}
  VID=film/renders/raw.mp4; SS=0
elif [[ $MODE == clip ]]; then
  say "render clip $CA-$CB"
  run $PY $R $P/film --clip $CA $CB _finish_clip
  VID=film/renders/_finish_clip.mp4; SS=$CA
else
  VID=film/renders/raw.mp4; SS=0
  [[ -f $P/$VID ]] || fail "no $VID to reuse"
fi
say "sound events + score"
run $PY $R $P/film --events
run $PY $SKILL/engine/audio.py $P/film --wav-only
O=${OUTRO:-$(node -e "global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));const T=window.TL,
b=Math.max(...T.order.filter(k=>T.lines[k].sub).map(k=>T.lines[k].b));console.log(T.dur-b>10?(b+.6).toFixed(2):0)" $P/film/timing.js)}
say "mix (OUTRO=$O)"
run env OUTRO=$O zsh $P/src/mix.sh $VID $SS output/$NAME.mp4
say "QC"
QA=(--film $P/film --sheet $P/film/review/${NAME}_sheet.jpg --json $P/logs/${NAME}_qc.json)
[[ $MODE == clip ]] && QA+=(--sample)
$PY $SKILL/scripts/qc_film.py $P/output/$NAME.mp4 $QA 2>&1 | tee -a $LOG
QCRC=${pipestatus[1]}
say "took $(( (SECONDS - T0) / 60 )) min"
print "video: $P/output/$NAME.mp4" | tee -a $LOG
(( QCRC == 0 )) && print FINISH_OK | tee -a $LOG || { print FINISH_FAILED | tee -a $LOG; exit 1; }
