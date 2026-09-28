# How the friends' song was made

The friends' song (`docs/music/friends.mp3`) is "Pehli Nazar Mein" with the singing replaced by a small violin
section playing the same melody. None of this runs at build time; it is here so the song can be remade or changed.

1. Separate the singing from the music (Python venv with `audio-separator[cpu]`; its model downloads from GitHub):
   `audio-separator pn.wav -m UVR-MDX-NET-Inst_HQ_3.onnx --output_format WAV`, renamed to `voc.wav` / `ins.wav`
   (`pn.wav` = the uploaded song at 44.1 kHz).
2. `track2.py`: trace the sung pitch (librosa pYIN, 128-sample hop) into `pitch2.npz`.
3. `guitar.py`: split the melody into notes (`notes.pkl`); it also renders a guitar take, not used.
4. `snap.py`: pitch each note from its steady middle and snap it to A major (the song's key, read from the held
   sung notes); very short passing notes join the one before (`notes_snap.pkl`).
5. `violin.py`: four slightly detuned violins an octave up, gliding between the snapped notes, with a little of the
   singer's own expression and a violin body EQ (`violin.wav`).
6. Mix with ffmpeg: violin 3 LU under the music with echo, then the lounge treatment (10% slower, reverb, bass,
   low-pass, -14 LUFS, fades), 4:00, 128 kbps. The full command is in HANDOFF.md ("Music").
