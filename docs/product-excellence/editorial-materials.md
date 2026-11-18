# Editorial materials and release checks

The methodology and contact sections use a shared material series. Aurum Noir combines basalt and brass. Event Horizon uses cold graphite and machined steel. Clarity uses limestone and pale ceramic. The three square compositions use 320 px and 640 px AVIF and WebP derivatives selected by the active theme, viewport and pixel density.

The raster layer belongs to the existing deferred section styles and uses an absolute positioning box independent of layout. Hero uses CSS geometry around the original portrait composition. The contact material responds to focus only when the device has a fine pointer and the user permits motion.

## Generation prompt

Built-in ImageGen produced a single editorial triptych. The prompt requested equal-width panels filling the image, respectively black basalt planes with a narrow brushed-gold rim and grazing light, graphite precision-machined spatial geometry with steel-blue light, and ivory limestone with white ceramic planes under directional daylight. It specified diagonal joints and sculptural relief, with no people, text, logos, decorative grid or screens. The three panels were cropped and encoded individually.

## Performance evidence

The previous main Quality run measured a Performance median of 92 for RU / Event Horizon mobile. Its three Chrome traces show four early renderer tasks lasting 77.71 to 109.76 ms wall time and 0.260 to 0.422 ms thread CPU. Most of each interval falls between BeginMainThreadFrame and PrePaint. LCP was 1.80 to 1.81 s and CLS was zero in those samples. This reproduces the off-CPU wait documented in the earlier performance investigation. The measurements do not identify a source-level operation that accounts for the delay.

[Previous main Quality run](https://github.com/castefeudal/markovmade/actions/runs/42927437739)
