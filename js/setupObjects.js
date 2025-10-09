//==============================================================================
// Setup the animations and run it - ES6 Module
import * as ANIM from './animation.js';
import * as BASE from './base.js';
import { KeyboardControl, TouchControl } from './game.js';

(() => {
    const canvas = document.getElementById('myCanvas');
    const context = canvas.getContext('2d');

    const SCREEN_BOUNDS = BASE.Rectangle2D(0, 0, 600, 600);
//
//http://freegameassets.blogspot.de/
    const asteroid1 = new ANIM.SpriteDescriptor(new Image(), 72, 72, 5, 19);
    const asteroid3 = new ANIM.SpriteDescriptor(new Image(), 32, 32, 5, 19);
    const asteroid4 = new ANIM.SpriteDescriptor(new Image(), 32, 32, 5, 19);
    const explosion = new ANIM.SpriteDescriptor(new Image(), 64, 64, 10, 100);
    const background = new Image();
//http://www.codeproject.com/Articles/677417/Shootem-Up-NET
    const explosion2 = new ANIM.SpriteDescriptor(new Image(), 96, 96, 5, 20);
    const ship = new Image();
//
    asteroid1.img.src = "img/asteroid1_72x72.png";
    asteroid3.img.src = "img/asteroid3_32x32.png";
    asteroid4.img.src = "img/asteroid4_32x32.png";
    explosion.img.src = "img/explosion01_set_64x64.png";
    explosion2.img.src = "img/explosion02_96x96.png";

    background.src = "img/maxresdefault.jpg";
    ship.src = "img/smallfighter0006.png";

    const objectManager = new ANIM.ObjectManager();

    const yCoords = [];
    let dir = -1;
    //
    //background
    objectManager.add(
            new ANIM.PaintableWithAnimation(
                    new ANIM.ImgPainter(background, 1080, 1920),
                    new ANIM.XYAnimation(
                            new ANIM.FixValueAnimation(0),
                            new ANIM.PathAnimation2(-1320, 0, 0.02)
                            )
                    ).setOrder(0)
            );
    //ship size is x:95, y:151
    var shipControlAnimation = new ANIM.Vector2DAnimation(BASE.NULL_VECTOR2D, 0.25, BASE.Rectangle2D(-300,-600+151,300-95,0));
    objectManager.add(
            new ANIM.PaintableWithAnimation(
                    new ANIM.ImgPainter(ship, 95, 151),
                    new ANIM.XYCorrection(
                            shipControlAnimation,300,600-151
                    )
            ).setOrder(100)
    );
    objectManager.add(
            new ANIM.FPSRenderer().setOrder(100)
            );
    //
    //A Listener which listens to OFF_SCREEN events
    const listener = {
        eventType: ANIM.EVENT_TYPES.OFF_SCREEN,
        listen: (eventType, event) => {
            //console.log("listener remove: "+event.getRoot().toString());
            event.getRoot().remove();
            const idx = Math.floor(Math.random() * 120);
            dir = dir - 2 * dir;
            const composite = createObject(idx, dir);
            composite.init();
            objectManager.add(composite);
            objectManager.commit();
        }
    };

    const createObject = (idx, dir) => {
        //
        const xAnimation = new ANIM.FixValueAnimation(Math.random() * (SCREEN_BOUNDS.xmax - 80));
        const yAnimation = new ANIM.PathAnimation2(-72, SCREEN_BOUNDS.ymax, 0.05 + 0.1 * Math.random()).addListener(listener);
        const xyBaseAnimation = new ANIM.XYAnimation(xAnimation, yAnimation);

        let spriteAnimation;
        //
        if (idx >= 1 && idx < 24) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid1, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 24 && idx < 48) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid3, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 48 && idx < 72) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid4, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 72 && idx < 108) {
            spriteAnimation = new ANIM.SpriteAnimation(explosion, 1, true, 15 + 35 * Math.random(), 0.5).addListener(listener);
        } else {
            spriteAnimation = new ANIM.SpriteAnimation(explosion2, 1, true, 50 + 150 * Math.random(), 0.7).addListener(listener);
        }

        const compositeMain = new ANIM.PaintableWithAnimation(
                spriteAnimation,
                xyBaseAnimation
                );

        if (idx >= 1 && idx < 24) {
            //build two circling satellites around a asteroid
            const speed = 0.05 + 0.1 * Math.random();
            const circleAnimation1 = new ANIM.CirclePathAnimation(65, 0, dir, speed);
            const circleAnimation2 = new ANIM.CirclePathAnimation(65, 180, dir, speed);
            //not quite sure why the XYCorrection parameters have to be 16,16 here? it should be 36,36????
            const relativeXYAnimation1 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation1), 16, 16);
            const relativeXYAnimation2 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation2), 16, 16);
            const circlePainter = new ANIM.CirclePainter(8, 65, new ANIM.XYCorrection(xyBaseAnimation, 36, 36));
            //
            //now it gets funky - let's build a circeling satelite around a sattelite
            const circleAnimation1_1 = new ANIM.CirclePathAnimation(32, 180, dir - 2 * dir, speed + 0.06);
            const relativeXYAnimation1_1 = new ANIM.RelativeXYAnimation(relativeXYAnimation1, circleAnimation1_1);
            const circlePainter1_1 = new ANIM.CirclePainter(8, 32, new ANIM.XYCorrection(relativeXYAnimation1, 16, 16));
            //
            // make the satellite of the satellite shake from time to time (controlled by an OnOffIntervall)
            const onOffIntervall = new ANIM.OnOffIntervalls(2000, 400);
            const yShaker = new ANIM.PosShake(onOffIntervall, 2);
            const xShaker = new ANIM.PosShake(onOffIntervall, -2);
            const shakerAnimation = new ANIM.XYAnimation(xShaker, yShaker);
            const relativeXYAnimation1_2 = new ANIM.RelativeXYAnimation(shakerAnimation, relativeXYAnimation1_1);
            //
            const satelliteAnimation = new ANIM.SpriteAnimation(asteroid3, dir, false, 50 + 150 * Math.random(), 1);
            const compositeSub1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1);
            const compositeSub2 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation2);
            const compositeSub1_1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1_2);
            return new ANIM.PaintableWithStateIndicator(
                    new ANIM.PaintableCombination(
                            [compositeMain,
                                circlePainter,
                                compositeSub2,
                                compositeSub1,
                                circlePainter1_1,
                                compositeSub1_1]), yAnimation);
        } else {
            return compositeMain;
        }
    };

    for (let i = 1; i < 10; i++) {
        objectManager.add(createObject(i, dir).setOrder(50));
        dir = dir - 2 * dir;
    }
    objectManager.commit();
    objectManager.getAnimations().forEach((elem) => {
        elem.init();
    });
    const keyboardControl = new KeyboardControl(37, 38, 39, 40);
    keyboardControl.activate(canvas, (o, n) => {
        if (o !== n) {
            shipControlAnimation.setDirection(BASE.UNIT_VECTORS_2D[n]);
        }
        console.log("old: " + o + "; new: " + n + "; isLeft: " + KeyboardControl.is(n, BASE.DIRECTION.LEFT));
    });

    // Setup touch control
    const touchControlTrack = document.getElementById('touch-control-track');
    const touchControlThumb = document.getElementById('touch-control-thumb');
    if (touchControlTrack && touchControlThumb) {
        const touchControl = new TouchControl(touchControlTrack, touchControlThumb);
        touchControl.activate((o, n) => {
            if (o !== n) {
                shipControlAnimation.setDirection(BASE.UNIT_VECTORS_2D[n]);
            }
            console.log("Touch: old: " + o + "; new: " + n);
        });
    }

    
    //==========================================================================
    //Setup the control button
    //
    let animationToggle = 1; //running
    const toggleAnimation = (event) => {
        animationToggle = 1 - animationToggle;
        const elem = document.getElementById("toggleAnimation");
        if (animationToggle === 1) {
            elem.innerHTML = "Stop Animation";
            objectManager.resume();
            window.requestAnimationFrame(anim, canvas);
        } else {
            objectManager.pause();
            elem.innerHTML = "Start Animation";

        }
    };
    document.getElementById("toggleAnimation").onclick = toggleAnimation;

    //==========================================================================
    // Run everything now
    //
    let lastTime = performance.now();
    const anim = (current) => {
        const myCurrent = performance.now();
        const delta = current - lastTime;
        lastTime = myCurrent;
        //context.clearRect(0, 0, canvas.width, canvas.height);
        objectManager.getAnimations().forEach((elem) => {
            const retState = elem.update(myCurrent);
            if (retState && retState === ANIM.STATE.INACTIVE_PENDING) {
                //console.log("loop remove: "+elem.getRoot().toString());
                objectManager.remove(elem.getRoot());
            }
        });
        objectManager.getAnimations().forEach((elem) => {
            elem.paint(context);
        });
        objectManager.commit();
        if (animationToggle === 1) {
            //triggerAnimationFrame();
            triggerAnimationFrameWithTimeOut();
            //window.requestAnimationFrame(anim, canvas);
        }
    };
    //Frames per second control
    //
    let lastTrigger = Date.now();
    //let accumulatedDelay = 0;
    const fps = 65; //use 15, 30, 65
    const timeOutDelay = 6;
    const twoThirds = 2 * timeOutDelay / 3;
    let accumulatedDelay = twoThirds; //empirical start value, it makes accumulatedDelay reach faster frsPerSecondDelay
    const frsPerSecondDelay = 1000 / fps; //60 frames per second
    const triggerAnimationFrameWithTimeOut = () => {
        const current = Date.now();
        const delay = (current - lastTrigger); // allready elapsed time
        accumulatedDelay += delay;
        if (accumulatedDelay >= frsPerSecondDelay) {
            triggerAnimationFrame();
            accumulatedDelay = twoThirds;
        } else {
            setTimeout(triggerAnimationFrameWithTimeOut, timeOutDelay);
        }
        lastTrigger = current;
    };

    const triggerAnimationFrame = () => {
        window.requestAnimationFrame(anim, canvas);
    };

    //triggerAnimationFrame();
    triggerAnimationFrameWithTimeOut();
})();
