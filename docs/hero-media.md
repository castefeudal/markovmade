# Hero portrait delivery

The author's local `hero-head2.mp4` is 1660 × 1244, 24 fps. The previous site asset was a 960 × 648 encode. The current video uses a 1600 × 1080 crop at x=30, y=0, retaining the 40:27 composition and excluding the complete lower watermark region before encoding.

Reproduce the video from the author's source:

```powershell
ffmpeg -i hero-head2.mp4 -vf "crop=1600:1080:30:0" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -g 12 -an -movflags +faststart hero-portrait.mp4
```

The short keyframe interval supports exact seeking. The file is approximately 4.44 MB and loads after the initial page on devices with a mouse. Touch, Save-Data and reduced-motion settings retain the responsive poster without downloading the video.

Poster variants at 320, 640, 960 and 1600 pixels use the 0.1-second frame from the cropped encode (WebP quality 90; AVIF CRF 24). `tests/hero-crop.json` seals the approved assets by SHA-256. Changing media requires reviewing the crop and updating the visual references.

The mouse controls the authored turn and nod sequences, plus a small spatial offset. Frame extraction uses displayed pixel density, between 960 and 1600 pixels, with a bounded bank of 24 turn frames and two eight-frame nod sequences. Devices reporting limited memory use the full-resolution video with direct seeking instead. The browser contract checks distinct rendered pixels for turn, nod and neutral in Chromium, Firefox and WebKit, plus full video dimensions, crop, pointer return, decoder fallback and reduced-motion behavior.

Always coerce the static-mode predicate to a Boolean: Firefox/WebKit can omit `navigator.connection`, yielding `undefined`. Passing that value as `classList.toggle`'s optional force can toggle the poster on while still loading the video. The cross-browser pointer checks cover this failure.
