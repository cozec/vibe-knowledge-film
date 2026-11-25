"""Script of the film "__TITLE__" (grade 9; made the Taylor-study way, references/math.md, plus Cutty cameos).
A cue is (id, subtitle, pause before in s, options). Options: say (spoken text when it differs, '|' = 0.6 s pause),
marks (words to time-stamp, for on-screen lighting), big (bigger subtitle). sub = None makes a sound slot: {"snd": (kind, args, secs)}.
Numbers: verify every value in python/node and record it in docs/plan.md (fact table) and in the chapter file header.
Length: build_timeline prints dur, which includes the 26 s END_CARD outro; aim for dur >= 495 s (8:15), QC fails under 8:00."""

TITLE_GAP = 2.0
CH = 2.4                        # continuous canvas: short breaths between sections, no chapter dips

CUES = [
    # Hook: 3 s of picture and sound before the first word (opening-scene rule)
    ("h1", "TODO: the hook line, said over the opening image.", 3.2, {}),
    # Chapters: one id prefix per chapter (a1, a2, ... b1, ...), one chapter file per prefix group in film/ch_*.js
    ("a1", "TODO: first chapter line.", CH, {}),
    # Recap
    ("z1", "TODO: recap.", CH, {}),
    # Quiz (options split by '|' = 0.6 s pauses; keep options free of hints). Edit QZ in film/ch_quiz.js to match.
    ("q0", "Quiz time! Three quick questions. Pause the video if you need more time.", CH, {}),
    ("q1", "Question one: TODO?", 0.8, {}),
    ("q1o", "A: TODO · B: TODO · C: TODO", 0.4, {"say": "[A](/ˈA/): TODO. | B: TODO. | C: TODO.", "big": 1}),
    ("q1w", None, 0.3, {"snd": ("clock", [], 4.0)}),
    ("q1a", "TODO: answer and why.", 0.3, {}),
    ("q2", "Question two: TODO?", 1.4, {}),
    ("q2o", "A: TODO · B: TODO · C: TODO", 0.4, {"say": "[A](/ˈA/): TODO. | B: TODO. | C: TODO.", "big": 1}),
    ("q2w", None, 0.3, {"snd": ("clock", [], 4.0)}),
    ("q2a", "TODO: answer and why.", 0.3, {}),
    ("q3", "Question three: TODO?", 1.4, {}),
    ("q3o", "A: TODO · B: TODO · C: TODO", 0.4, {"say": "[A](/ˈA/): TODO. | B: TODO. | C: TODO.", "big": 1}),
    ("q3w", None, 0.3, {"snd": ("clock", [], 4.0)}),
    ("q3a", "TODO: answer and why.", 0.3, {}),
    # Farewell: back to the hook object; the 26 s music outro follows (END_CARD in build_timeline.py)
    ("z5", "TODO: farewell line that returns to the hook.", 1.4, {}),
]
