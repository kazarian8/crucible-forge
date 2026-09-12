# CrucibleStar quality grading

The legacy `score` and database `analysis_score` remain technical checklist values for compatibility. They must never be marketed as sound-quality percentages. New reports explicitly return `quality.score: null` and `calibration: not-calibrated`; no placeholder 93, 99 cap, or inferred perfect score is assigned.

## Implemented measurements

Every decoded sample is scanned. Reports include sample peak, unweighted RMS, peak-to-average range, near-full-scale sample count, DC offset, approximate tonal-band energies, left/right energy balance, global stereo correlation and local 100 ms phase checks. Review findings include their first occurrence where relevant. Clipping, strong local phase opposition, and substantial DC offset require technical review. Other heuristics are contextual observations, not automatic quality deductions.

Quiet-section RMS includes quiet musical content and must not be called a noise-floor measurement. Broad first-order tonal filters do not supply genre-independent mix targets. Neither LUFS nor oversampled true peak is implemented. Baked-in distortion and perceptual clarity are explicitly unassessed.

For an accepted forged master, compare original and saved-version measurements. Display newly triggered and resolved review checks and level/dynamics deltas. Do not equate louder output with better quality.

New analyses and comparisons are saved in the existing analysis JSON; old rows retain their historical results and are labelled legacy technical assessments. No historical track is silently regraded.

## Before enabling a numerical quality grade

1. Assemble consented original/master pairs, including clean recordings and examples of clipping, codec damage, noise, over-limiting and phase problems. Include different genres, speech, stems and short samples. No audio fixtures were available for perceptual calibration in this workspace.
2. Collect independent, level-matched listening reviews with written reasons. Justice's 93/100 is a proposed reference for his exact master, not a training label for all tracks. Track provenance and recording hashes so each review refers to the correct version.
3. Use a fixed rubric for recording cleanliness, intelligibility, dynamics, tonal balance and mono compatibility. Keep taste and composition ratings separate. Record disagreement rather than averaging away uncertainty.
4. Validate standards-based loudness/true-peak implementations and perceptual noise/distortion estimators against trusted measurement fixtures before claiming those capabilities.
5. Fit and evaluate any numeric mapping on held-out recordings. Check whether controlled degradations lower its assessment and mere gain changes avoid increasing quality. Publish calibration version, measurement coverage and uncertainty with every grade.
6. Require demonstrated agreement and repeatability before replacing null quality scores. Listening review remains periodic quality control, not a mandatory review of every upload.

Browser and live database save verification are still required in a configured environment. The checkout has no Supabase environment variables; no deployment or live regrading was performed.
