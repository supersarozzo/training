# Redesign A: media sources and licences

Date: 2026-11-17.

## Exercise photos
- Source: free-exercise-db, https://github.com/yuhonas/free-exercise-db (The Unlicense = public domain; licence checked on the GitHub API).
- 88 photos for 44 moves (36 exercises, 6 warm-up moves, the walk, the pec deck), saved unchanged at `app/media/exercises/<plan id>/0.jpg` (start) and `1.jpg` (end). Total 5.3 MB.
- The plan-id-to-library mapping is in `app/js/plan/media.js` (`lib` field). Close matches, not exact: romanian_deadlift uses Stiff-Legged_Dumbbell_Deadlift; hip_thrust uses Barbell_Hip_Thrust; cable_lateral_raise uses Cable_Seated_Lateral_Raise; db_glute_bridge uses Barbell_Glute_Bridge; arm_swings uses Dynamic_Chest_Stretch; lat_pulldown_machine uses Close-Grip_Front_Lat_Pulldown.
- hip_hinge has no library photo: an original two-frame stick-figure drawing (`app/js/ui/drawings.js`).
- Machine cards reuse the start photo of an exercise done on that machine. Area icons and all UI icons are original SVG (`app/js/ui/icons.js`).

## Form videos
- One YouTube link per move (44), stored in `app/js/plan/media.js` (`VIDEOS`), opened as a plain link in Safari (no embed, no third-party script).
- Each checked on 2026-11-17: the watch page answered HTTP 200 and YouTube's oEmbed answer confirmed the title and channel (recorded in the file).
- Weaker picks (smaller channels or not a plain demo): arm_swings, rear_delt_raise, calf_raise_standing, uphill_walk, plank, cable_lateral_raise; pulldown is 5:42 long. Worth a human look.
