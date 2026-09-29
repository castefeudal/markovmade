(function () {
    'use strict';

    function initMarkovmadeHeroHead2Natural() {
        var hero = document.getElementById('hero');
        var media = hero ? hero.querySelector('.mm-hero-media') : null;
        var video = document.getElementById('hero-head-video');
        var canvas = document.getElementById('hero-head-canvas');

        if (!hero || !media || !video || !canvas || media.dataset.mmHeadV8Ready === 'true') {
            return;
        }

        media.dataset.mmHeadV8Ready = 'true';
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.controls = false;

        var settings = {
            referenceDuration: 8.041667,
            neutralTime: 0.10,
            turnStartTime: 0.08,
            turnEndTime: 2.42,
            nod1StartTime: 2.72,
            nod1PeakTime: 3.72,
            nod1EndTime: 4.58,
            nod2StartTime: 5.06,
            nod2PeakTime: 6.24,
            nod2EndTime: 7.72,

            desktopWidth: 520,
            mobileWidth: 360,
            lowMemoryWidth: 300,
            desktopTurnFrames: 16,
            desktopNodFrames: 8,
            mobileTurnFrames: 12,
            mobileNodFrames: 7,
            lowMemoryTurnFrames: 8,
            lowMemoryNodFrames: 5,

            smoothingDesktop: 0.19,
            smoothingMobile: 0.25,
            pointerTurnNeutralX: 0.76,
            pointerTurnFullX: 0.06,
            pointerNodStartY: 0.58,
            pointerNodFullY: 0.92,
            desktopShiftX: 7,
            desktopShiftY: 4,
            mobileShiftX: 5,
            mobileShiftY: 3,
            directSeekInterval: 42,
            directSeekEpsilon: 0.022,
            touchReturnDelay: 760,
            introDelay: 1050,
            clickNodPause: 140
        };

        var reducedMotion = !!(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var coarsePointer = !!(window.matchMedia &&
            window.matchMedia('(hover: none), (pointer: coarse)').matches);
        var lowMemory = (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
            (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4);

        var context = canvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!context) return;

        var captureCanvas = document.createElement('canvas');
        var captureContext = captureCanvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!captureContext) return;

        var bank = {
            neutral: null,
            turn: [],
            nod1: [],
            nod2: [],
            nod1PeakIndex: 0,
            nod2PeakIndex: 0
        };

        var duration = 0;
        var timeScale = 1;
        var frameWidth = 0;
        var frameHeight = 0;
        var cacheReady = false;
        var directReady = false;
        var destroyed = false;
        var heroVisible = true;
        var decoder = null;
        var observer = null;
        var animationFrame = 0;
        var lastFrameTime = 0;
        var lastRenderKey = '';
        var lastSeekAt = 0;
        var seekBusy = false;
        var pendingSeekTime = null;
        var targetTurn = 0;
        var targetNod = 0;
        var currentTurn = 0;
        var currentNod = 0;
        var pointerX = 0.78;
        var pointerY = 0.48;
        var displayPointerX = pointerX;
        var displayPointerY = pointerY;
        var autoPlaying = false;
        var userInteracted = false;
        var introTimer = 0;
        var returnTimer = 0;
        var touchActive = false;
        var touchStartX = 0;
        var touchStartY = 0;
        var touchLastX = 0;
        var touchLastY = 0;
        var touchDirection = 'pending';

        function clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        }

        function lerp(start, end, amount) {
            return start + (end - start) * amount;
        }

        function easeInOutCubic(value) {
            return value < 0.5
                ? 4 * value * value * value
                : 1 - Math.pow(-2 * value + 2, 3) / 2;
        }

        function smoothStep(value) {
            value = clamp(value, 0, 1);
            return value * value * (3 - 2 * value);
        }

        function wait(milliseconds) {
            return new Promise(function (resolve) {
                window.setTimeout(resolve, milliseconds);
            });
        }

        function waitForEvent(target, eventName, timeout) {
            return new Promise(function (resolve, reject) {
                var timer = window.setTimeout(function () {
                    cleanup();
                    reject(new Error('Timeout: ' + eventName));
                }, timeout || 9000);

                function cleanup() {
                    window.clearTimeout(timer);
                    target.removeEventListener(eventName, onEvent);
                    target.removeEventListener('error', onError);
                }

                function onEvent(event) {
                    cleanup();
                    resolve(event);
                }

                function onError() {
                    cleanup();
                    reject(new Error('Video loading error'));
                }

                target.addEventListener(eventName, onEvent, { once: true });
                target.addEventListener('error', onError, { once: true });
            });
        }

        async function ensureMetadata(targetVideo) {
            if (Number.isFinite(targetVideo.duration) && targetVideo.duration > 0 && targetVideo.readyState >= 1) {
                return;
            }
            try { targetVideo.load(); } catch (error) {}
            await waitForEvent(targetVideo, 'loadedmetadata', 14000);
        }

        async function waitForDecodedFrame(targetVideo) {
            if (typeof targetVideo.requestVideoFrameCallback !== 'function') {
                await wait(26);
                return;
            }

            await Promise.race([
                new Promise(function (resolve) {
                    try {
                        targetVideo.requestVideoFrameCallback(function () { resolve(); });
                    } catch (error) {
                        resolve();
                    }
                }),
                wait(220)
            ]);
        }

        async function seekVideo(targetVideo, time) {
            var maxTime = Math.max(0.002, (targetVideo.duration || duration || 0.01) - 0.002);
            var safeTime = clamp(time, 0.001, maxTime);

            if (Math.abs(targetVideo.currentTime - safeTime) < 0.007 && targetVideo.readyState >= 2) {
                await waitForDecodedFrame(targetVideo);
                return;
            }

            var seeked = waitForEvent(targetVideo, 'seeked', 6500);
            if (typeof targetVideo.fastSeek === 'function') {
                try { targetVideo.fastSeek(safeTime); }
                catch (error) { targetVideo.currentTime = safeTime; }
            } else {
                targetVideo.currentTime = safeTime;
            }
            await seeked;
            await waitForDecodedFrame(targetVideo);
        }

        function scaledTime(referenceSeconds) {
            return clamp(referenceSeconds * timeScale, 0.001, Math.max(0.001, duration - 0.002));
        }

        function makeTimes(start, end, count) {
            var result = [];
            var total = Math.max(2, count);
            for (var i = 0; i < total; i += 1) {
                result.push(lerp(start, end, i / (total - 1)));
            }
            return result;
        }

        function getGeometry() {
            var sourceWidth = Math.max(1, video.videoWidth || 1660);
            var sourceHeight = Math.max(1, video.videoHeight || 1244);
            var width;
            var turnCount;
            var nodCount;

            if (lowMemory) {
                width = settings.lowMemoryWidth;
                turnCount = settings.lowMemoryTurnFrames;
                nodCount = settings.lowMemoryNodFrames;
            } else if (coarsePointer || window.innerWidth <= 1024) {
                width = settings.mobileWidth;
                turnCount = settings.mobileTurnFrames;
                nodCount = settings.mobileNodFrames;
            } else {
                width = settings.desktopWidth;
                turnCount = settings.desktopTurnFrames;
                nodCount = settings.desktopNodFrames;
            }

            return {
                width: width,
                height: Math.max(1, Math.round(width * sourceHeight / sourceWidth)),
                turnCount: turnCount,
                nodCount: nodCount
            };
        }

        async function captureFrame(targetVideo, time) {
            await seekVideo(targetVideo, time);
            captureContext.setTransform(1, 0, 0, 1, 0, 0);
            captureContext.clearRect(0, 0, frameWidth, frameHeight);
            captureContext.drawImage(targetVideo, 0, 0, frameWidth, frameHeight);

            if (typeof window.createImageBitmap === 'function') {
                try {
                    return await window.createImageBitmap(captureCanvas);
                } catch (error) {}
            }

            var copy = document.createElement('canvas');
            copy.width = frameWidth;
            copy.height = frameHeight;
            var copyContext = copy.getContext('2d', { alpha: false });
            copyContext.drawImage(captureCanvas, 0, 0);
            return copy;
        }

        async function captureCurrentFrame(targetVideo) {
            var copy = document.createElement('canvas');
            copy.width = frameWidth;
            copy.height = frameHeight;
            var copyContext = copy.getContext('2d', { alpha: false, desynchronized: true });
            copyContext.drawImage(targetVideo, 0, 0, frameWidth, frameHeight);
            return copy;
        }

        async function cacheFrames() {
            var geometry = getGeometry();
            frameWidth = geometry.width;
            frameHeight = geometry.height;

            canvas.width = frameWidth;
            canvas.height = frameHeight;
            captureCanvas.width = frameWidth;
            captureCanvas.height = frameHeight;

            decoder = document.createElement('video');
            decoder.muted = true;
            decoder.defaultMuted = true;
            decoder.playsInline = true;
            decoder.preload = 'metadata';
            decoder.disablePictureInPicture = true;
            decoder.src = video.currentSrc ||
                ((video.querySelector('source') && video.querySelector('source').src) || './hero-head2.mp4');
            decoder.style.cssText = 'position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:-10px;bottom:-10px;';
            document.body.appendChild(decoder);

            await ensureMetadata(decoder);

            var turnTimes = makeTimes(
                scaledTime(settings.turnStartTime),
                scaledTime(settings.turnEndTime),
                geometry.turnCount
            );
            var nod1Times = makeTimes(
                scaledTime(settings.nod1StartTime),
                scaledTime(settings.nod1EndTime),
                geometry.nodCount
            );
            var nod2Times = makeTimes(
                scaledTime(settings.nod2StartTime),
                scaledTime(settings.nod2EndTime),
                geometry.nodCount
            );

            bank.turn = new Array(turnTimes.length);
            bank.nod1 = new Array(nod1Times.length);
            bank.nod2 = new Array(nod2Times.length);

            var targets = [{ group: 'neutral', index: 0, time: scaledTime(settings.neutralTime) }];
            turnTimes.forEach(function (time, index) { targets.push({ group: 'turn', index: index, time: time }); });
            nod1Times.forEach(function (time, index) { targets.push({ group: 'nod1', index: index, time: time }); });
            nod2Times.forEach(function (time, index) { targets.push({ group: 'nod2', index: index, time: time }); });
            targets.sort(function (a, b) { return a.time - b.time; });

            function assignTarget(target, frame) {
                if (target.group === 'neutral') bank.neutral = frame;
                else bank[target.group][target.index] = frame;
            }

            var sequentialWorked = false;

            if (typeof decoder.requestVideoFrameCallback === 'function') {
                try {
                    await seekVideo(decoder, 0.001);
                    decoder.playbackRate = 2.5;

                    await new Promise(function (resolve, reject) {
                        var nextTarget = 0;
                        var finished = false;
                        var timeout = window.setTimeout(function () {
                            if (finished) return;
                            finished = true;
                            reject(new Error('Sequential frame cache timeout'));
                        }, 12000);

                        function finish() {
                            if (finished) return;
                            finished = true;
                            window.clearTimeout(timeout);
                            try { decoder.pause(); } catch (error) {}
                            resolve();
                        }

                        function onFrame(now, metadata) {
                            if (finished || destroyed) return;
                            var mediaTime = Number.isFinite(metadata.mediaTime)
                                ? metadata.mediaTime
                                : decoder.currentTime;

                            if (nextTarget < targets.length && mediaTime + 0.035 >= targets[nextTarget].time) {
                                var snapshot = null;
                                while (nextTarget < targets.length && mediaTime + 0.035 >= targets[nextTarget].time) {
                                    if (!snapshot) {
                                        var frameCanvas = document.createElement('canvas');
                                        frameCanvas.width = frameWidth;
                                        frameCanvas.height = frameHeight;
                                        var frameContext = frameCanvas.getContext('2d', { alpha: false, desynchronized: true });
                                        frameContext.drawImage(decoder, 0, 0, frameWidth, frameHeight);
                                        snapshot = frameCanvas;
                                    }
                                    assignTarget(targets[nextTarget], snapshot);
                                    nextTarget += 1;
                                }
                            }

                            if (nextTarget >= targets.length || decoder.ended || mediaTime >= duration - 0.03) {
                                finish();
                                return;
                            }

                            decoder.requestVideoFrameCallback(onFrame);
                        }

                        decoder.requestVideoFrameCallback(onFrame);
                        var playPromise = decoder.play();
                        if (playPromise && typeof playPromise.catch === 'function') {
                            playPromise.catch(function (error) {
                                if (finished) return;
                                finished = true;
                                window.clearTimeout(timeout);
                                reject(error);
                            });
                        }
                    });

                    sequentialWorked = !!bank.neutral &&
                        bank.turn.every(Boolean) &&
                        bank.nod1.every(Boolean) &&
                        bank.nod2.every(Boolean);
                } catch (sequentialError) {
                    sequentialWorked = false;
                }
            }

            /* Запасной путь для старых браузеров или пропущенных кадров. */
            if (!sequentialWorked) {
                bank.neutral = bank.neutral || await captureFrame(decoder, scaledTime(settings.neutralTime));

                for (var i = 0; i < turnTimes.length; i += 1) {
                    if (!bank.turn[i]) bank.turn[i] = await captureFrame(decoder, turnTimes[i]);
                }
                for (var j = 0; j < nod1Times.length; j += 1) {
                    if (!bank.nod1[j]) bank.nod1[j] = await captureFrame(decoder, nod1Times[j]);
                }
                for (var k = 0; k < nod2Times.length; k += 1) {
                    if (!bank.nod2[k]) bank.nod2[k] = await captureFrame(decoder, nod2Times[k]);
                }
            }

            bank.nod1PeakIndex = Math.round(clamp(
                (scaledTime(settings.nod1PeakTime) - nod1Times[0]) /
                Math.max(0.001, nod1Times[nod1Times.length - 1] - nod1Times[0]),
                0,
                1
            ) * (bank.nod1.length - 1));

            bank.nod2PeakIndex = Math.round(clamp(
                (scaledTime(settings.nod2PeakTime) - nod2Times[0]) /
                Math.max(0.001, nod2Times[nod2Times.length - 1] - nod2Times[0]),
                0,
                1
            ) * (bank.nod2.length - 1));

            try { decoder.pause(); } catch (error) {}
            if (decoder.parentNode) decoder.parentNode.removeChild(decoder);
        }

        function drawFrame(frame, key, force) {
            if (!frame || destroyed) return;
            if (!force && key === lastRenderKey) return;

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, frameWidth, frameHeight);
            context.drawImage(frame, 0, 0, frameWidth, frameHeight);
            lastRenderKey = key;
        }

        function drawBlendedFrame(frameA, frameB, mix, key, force) {
            if (!frameA || destroyed) return;
            mix = smoothStep(clamp(mix || 0, 0, 1));
            var quantized = Math.round(mix * 24) / 24;
            var renderKey = key + ':' + quantized.toFixed(3);
            if (!force && renderKey === lastRenderKey) return;

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.globalCompositeOperation = 'source-over';
            context.globalAlpha = 1;
            context.clearRect(0, 0, frameWidth, frameHeight);

            if (!frameB || frameB === frameA || quantized <= 0.001) {
                context.drawImage(frameA, 0, 0, frameWidth, frameHeight);
            } else if (quantized >= 0.999) {
                context.drawImage(frameB, 0, 0, frameWidth, frameHeight);
            } else {
                /* Paint A as the opaque base, then alpha-composite B.
                   This produces a true A→B crossfade without darkening an opaque canvas. */
                context.globalAlpha = 1;
                context.drawImage(frameA, 0, 0, frameWidth, frameHeight);
                context.globalAlpha = quantized;
                context.drawImage(frameB, 0, 0, frameWidth, frameHeight);
                context.globalAlpha = 1;
            }
            lastRenderKey = renderKey;
        }

        function drawInteractivePose(force) {
            if (!cacheReady) {
                requestDirectPose();
                return;
            }

            if (currentNod > 0.018 && bank.nod1.length) {
                var nodPosition = currentNod * bank.nod1PeakIndex;
                var nodA = clamp(Math.floor(nodPosition), 0, bank.nod1PeakIndex);
                var nodB = clamp(nodA + 1, 0, bank.nod1PeakIndex);
                drawBlendedFrame(bank.nod1[nodA], bank.nod1[nodB], nodPosition - nodA, 'manual-nod:' + nodA + '-' + nodB, force);
                media.dataset.mmPose = 'nod';
                return;
            }

            if (bank.turn.length) {
                var turnPosition = currentTurn * (bank.turn.length - 1);
                var turnA = clamp(Math.floor(turnPosition), 0, bank.turn.length - 1);
                var turnB = clamp(turnA + 1, 0, bank.turn.length - 1);
                drawBlendedFrame(bank.turn[turnA], bank.turn[turnB], turnPosition - turnA, 'turn:' + turnA + '-' + turnB, force);
                media.dataset.mmPose = turnPosition > 0.12 ? 'turn' : 'neutral';
                return;
            }

            drawFrame(bank.neutral, 'neutral', force);
            media.dataset.mmPose = 'neutral';
        }

        function directTimeForPose() {
            if (currentNod > 0.025) {
                return lerp(
                    scaledTime(settings.nod1StartTime),
                    scaledTime(settings.nod1PeakTime),
                    currentNod
                );
            }

            return lerp(
                scaledTime(settings.turnStartTime),
                scaledTime(settings.turnEndTime),
                currentTurn
            );
        }

        function requestDirectPose() {
            if (!directReady || destroyed || cacheReady) return;
            pendingSeekTime = directTimeForPose();
            processPendingSeek();
        }

        async function processPendingSeek() {
            if (seekBusy || pendingSeekTime === null || destroyed || cacheReady) return;

            var now = performance.now();
            if (now - lastSeekAt < settings.directSeekInterval) {
                window.setTimeout(processPendingSeek, settings.directSeekInterval - (now - lastSeekAt));
                return;
            }

            var targetTime = pendingSeekTime;
            pendingSeekTime = null;

            if (Math.abs(video.currentTime - targetTime) < settings.directSeekEpsilon) {
                return;
            }

            seekBusy = true;
            lastSeekAt = performance.now();
            try {
                await seekVideo(video, targetTime);
            } catch (error) {}
            seekBusy = false;

            if (pendingSeekTime !== null) {
                processPendingSeek();
            }
        }

        function updateParallax() {
            var shiftX = (displayPointerX - 0.5) * (coarsePointer ? settings.mobileShiftX : settings.desktopShiftX);
            var shiftY = (displayPointerY - 0.5) * (coarsePointer ? settings.mobileShiftY : settings.desktopShiftY);
            media.style.setProperty('--mm-hero-x', shiftX.toFixed(2) + 'px');
            media.style.setProperty('--mm-hero-y', shiftY.toFixed(2) + 'px');
        }

        function scheduleRender(force) {
            if (destroyed || autoPlaying || !heroVisible) return;
            if (force) lastRenderKey = '';
            if (!animationFrame) {
                animationFrame = window.requestAnimationFrame(renderLoop);
            }
        }

        function renderLoop(timestamp) {
            animationFrame = 0;
            if (destroyed || autoPlaying || !heroVisible) return;

            var dt = lastFrameTime ? clamp(timestamp - lastFrameTime, 8, 42) : 16.7;
            var poseTau = coarsePointer ? 78 : 104;
            var pointerTau = coarsePointer ? 92 : 118;
            var poseAlpha = 1 - Math.exp(-dt / poseTau);
            var pointerAlpha = 1 - Math.exp(-dt / pointerTau);

            currentTurn += (targetTurn - currentTurn) * poseAlpha;
            currentNod += (targetNod - currentNod) * poseAlpha;
            displayPointerX += (pointerX - displayPointerX) * pointerAlpha;
            displayPointerY += (pointerY - displayPointerY) * pointerAlpha;

            if (Math.abs(targetTurn - currentTurn) < 0.0006) currentTurn = targetTurn;
            if (Math.abs(targetNod - currentNod) < 0.0006) currentNod = targetNod;
            if (Math.abs(pointerX - displayPointerX) < 0.0006) displayPointerX = pointerX;
            if (Math.abs(pointerY - displayPointerY) < 0.0006) displayPointerY = pointerY;

            updateParallax();
            drawInteractivePose(false);
            lastFrameTime = timestamp;

            if (Math.abs(targetTurn - currentTurn) > 0.0006 ||
                Math.abs(targetNod - currentNod) > 0.0006 ||
                Math.abs(pointerX - displayPointerX) > 0.0006 ||
                Math.abs(pointerY - displayPointerY) > 0.0006) {
                animationFrame = window.requestAnimationFrame(renderLoop);
            }
        }

        function setFromPointer(clientX, clientY, immediate) {
            if (autoPlaying) return;

            var rect = hero.getBoundingClientRect();
            pointerX = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
            pointerY = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);

            var turnRange = Math.max(0.01, settings.pointerTurnNeutralX - settings.pointerTurnFullX);
            targetTurn = clamp((settings.pointerTurnNeutralX - pointerX) / turnRange, 0, 1);

            var nodRange = Math.max(0.01, settings.pointerNodFullY - settings.pointerNodStartY);
            targetNod = clamp((pointerY - settings.pointerNodStartY) / nodRange, 0, 1);

            /* При выраженном кивке горизонтальный поворот ослабляется. */
            targetTurn *= (1 - targetNod * 0.68);

            if (immediate) {
                currentTurn = targetTurn;
                currentNod = targetNod;
                drawInteractivePose(true);
            } else {
                scheduleRender(false);
            }

            updateParallax();
        }

        function returnToNeutral(delay) {
            window.clearTimeout(returnTimer);
            returnTimer = window.setTimeout(function () {
                if (autoPlaying || destroyed) return;
                pointerX = 0.78;
                pointerY = 0.48;
                targetTurn = 0;
                targetNod = 0;
                updateParallax();
                scheduleRender(false);
            }, Math.max(0, delay || 0));
        }

        function markInteracted() {
            userInteracted = true;
            hero.classList.add('mm-head-interacted');
            window.clearTimeout(introTimer);
        }

        async function playFrameSequence(frames, prefix, frameDuration) {
            if (!frames || !frames.length || destroyed) return;
            if (frames.length === 1) {
                drawFrame(frames[0], prefix + ':0', true);
                return;
            }

            for (var i = 0; i < frames.length - 1; i += 1) {
                if (destroyed || !heroVisible) break;
                await new Promise(function (resolve) {
                    var fromIndex = i;
                    var started = performance.now();
                    function step(now) {
                        if (destroyed || !heroVisible) { resolve(); return; }
                        var progress = clamp((now - started) / Math.max(24, frameDuration), 0, 1);
                        drawBlendedFrame(frames[fromIndex], frames[fromIndex + 1], progress, prefix + ':' + fromIndex, true);
                        if (progress < 1) window.requestAnimationFrame(step);
                        else resolve();
                    }
                    window.requestAnimationFrame(step);
                });
            }
            if (!destroyed && heroVisible) drawFrame(frames[frames.length - 1], prefix + ':last', true);
        }

        async function playTurnDemo() {
            if (!cacheReady || autoPlaying || destroyed || reducedMotion) return;
            autoPlaying = true;
            media.dataset.mmPose = 'turn';

            var forward = bank.turn.slice();
            var backward = bank.turn.slice(0, -1).reverse();
            await playFrameSequence(forward, 'demo-turn-f', 34);
            await playFrameSequence(backward, 'demo-turn-b', 34);

            autoPlaying = false;
            currentTurn = targetTurn = 0;
            currentNod = targetNod = 0;
            drawInteractivePose(true);
        }

        async function playDoubleNod(markAsInteraction) {
            if (!cacheReady || autoPlaying || destroyed || reducedMotion) return;
            if (markAsInteraction) markInteracted();

            autoPlaying = true;
            media.dataset.mmPose = 'nod';
            await playFrameSequence(bank.nod1, 'nod1', 42);
            await wait(settings.clickNodPause);
            await playFrameSequence(bank.nod2, 'nod2', 42);

            autoPlaying = false;
            currentTurn = targetTurn = 0;
            currentNod = targetNod = 0;
            pointerX = 0.78;
            pointerY = 0.48;
            displayPointerX = pointerX;
            displayPointerY = pointerY;
            updateParallax();
            drawInteractivePose(true);
        }

        async function playIntro() {
            if (userInteracted || autoPlaying || destroyed || reducedMotion || !heroVisible || !cacheReady) return;
            await playTurnDemo();
            if (userInteracted || destroyed) return;
            await wait(160);
            await playDoubleNod(false);
        }

        function scheduleIntro() {
            window.clearTimeout(introTimer);
            introTimer = window.setTimeout(playIntro, settings.introDelay);
        }

        function handleVideoError(error) {
            media.classList.add('mm-video-error');
            media.classList.remove('mm-direct-ready', 'mm-frames-ready');
            console.warn('[MARKOVMADE] hero-head2.mp4 не загрузился:', error || 'unknown error');
        }

        async function boot() {
            try {
                await ensureMetadata(video);
                duration = Number.isFinite(video.duration) && video.duration > 0
                    ? video.duration
                    : settings.referenceDuration;
                timeScale = duration / settings.referenceDuration;

                await seekVideo(video, scaledTime(settings.neutralTime));
                directReady = true;
                media.classList.add('mm-direct-ready');
                media.classList.remove('mm-video-error');

                /* Keep the poster and direct-seek fallback on reduced-motion and low-memory devices. */
                if (reducedMotion || lowMemory) return;

                try {
                    await cacheFrames();
                    cacheReady = true;
                    media.classList.add('mm-frames-ready');
                    media.classList.remove('mm-direct-ready');
                    currentTurn = targetTurn = 0;
                    currentNod = targetNod = 0;
                    drawInteractivePose(true);
                    scheduleIntro();
                } catch (cacheError) {
                    console.warn('[MARKOVMADE] Кэш цельных кадров недоступен; используется прямая перемотка:', cacheError);
                    cacheReady = false;
                    media.classList.add('mm-direct-ready');
                    requestDirectPose();
                }
            } catch (error) {
                handleVideoError(error);
            }
        }

        window.addEventListener('pointermove', function (event) {
            if (event.pointerType === 'touch' || !heroVisible) return;
            var rect = hero.getBoundingClientRect();
            if (event.clientY < rect.top || event.clientY > rect.bottom) return;
            markInteracted();
            setFromPointer(event.clientX, event.clientY, false);
        }, { passive: true });

        hero.addEventListener('pointerleave', function (event) {
            if (event.pointerType === 'touch') return;
            returnToNeutral(320);
        }, { passive: true });

        hero.addEventListener('click', function (event) {
            if (event.target.closest && event.target.closest('a, button, input, select, textarea, label')) return;
            if (coarsePointer) return;
            playDoubleNod(true);
        });

        hero.addEventListener('touchstart', function (event) {
            if (!event.touches || !event.touches.length) return;
            var touch = event.touches[0];
            touchActive = true;
            touchStartX = touchLastX = touch.clientX;
            touchStartY = touchLastY = touch.clientY;
            touchDirection = 'pending';
            markInteracted();
        }, { passive: true });

        hero.addEventListener('touchmove', function (event) {
            if (!touchActive || !event.touches || !event.touches.length) return;
            var touch = event.touches[0];
            touchLastX = touch.clientX;
            touchLastY = touch.clientY;
            var deltaX = touch.clientX - touchStartX;
            var deltaY = touch.clientY - touchStartY;

            if (touchDirection === 'pending' && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8) {
                touchDirection = Math.abs(deltaX) > Math.abs(deltaY) * 1.10 ? 'horizontal' : 'vertical';
            }

            if (touchDirection === 'vertical') {
                touchActive = false;
                return;
            }

            if (touchDirection === 'horizontal') {
                event.preventDefault();
                setFromPointer(touch.clientX, hero.getBoundingClientRect().top + hero.clientHeight * 0.47, false);
            }
        }, { passive: false });

        function finishTouch() {
            if (!touchActive) return;
            var movedX = Math.abs(touchLastX - touchStartX);
            var movedY = Math.abs(touchLastY - touchStartY);
            var wasTap = touchDirection === 'pending' && movedX < 9 && movedY < 9;
            touchActive = false;
            touchDirection = 'pending';

            if (wasTap) {
                playDoubleNod(true);
            } else {
                returnToNeutral(settings.touchReturnDelay);
            }
        }

        hero.addEventListener('touchend', finishTouch, { passive: true });
        hero.addEventListener('touchcancel', finishTouch, { passive: true });

        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    heroVisible = entry.isIntersecting && entry.intersectionRatio > 0.02;
                    if (heroVisible && !autoPlaying) {
                        scheduleRender(true);
                    }
                });
            }, { threshold: [0, 0.02, 0.25] });
            observer.observe(hero);
        }

        window.addEventListener('resize', function () {
            updateParallax();
        }, { passive: true });

        window.addEventListener('pagehide', function () {
            destroyed = true;
            window.clearTimeout(introTimer);
            window.clearTimeout(returnTimer);
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            if (observer) observer.disconnect();

            [bank.neutral].concat(bank.turn, bank.nod1, bank.nod2).forEach(function (frame) {
                if (frame && typeof frame.close === 'function') {
                    try { frame.close(); } catch (error) {}
                }
            });
        }, { once: true });

        updateParallax();
        boot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarkovmadeHeroHead2Natural, { once: true });
    } else {
        initMarkovmadeHeroHead2Natural();
    }
})();
