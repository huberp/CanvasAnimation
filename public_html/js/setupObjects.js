//==============================================================================
// Now setup the animations and run it
(function (PKG, undefined) {
    var ANIM = window.ANIMATION;
    var GAME = window.GAME;

    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    
    var SCREEN_BOUNDS = BASE.Rectangle2D(0,0,600,600);
//
//http://freegameassets.blogspot.de/
    var asteroid1 = new ANIM.SpriteDescriptor(new Image(), 72, 72, 5, 19);
    var asteroid3 = new ANIM.SpriteDescriptor(new Image(), 32, 32, 5, 19);
    var asteroid4 = new ANIM.SpriteDescriptor(new Image(), 32, 32, 5, 19);
    var explosion = new ANIM.SpriteDescriptor(new Image(), 64, 64, 10, 100);
    var background = new Image();
//http://www.codeproject.com/Articles/677417/Shootem-Up-NET
    var explosion2 = new ANIM.SpriteDescriptor(new Image(), 96, 96, 5, 20);
    var ship = new Image();
//
    asteroid1.img.src = "img/asteroid1_72x72.png";
    asteroid3.img.src = "img/asteroid3_32x32.png";
    asteroid4.img.src = "img/asteroid4_32x32.png";
    explosion.img.src = "img/explosion01_set_64x64.png";
    explosion2.img.src = "img/explosion02_96x96.png";

    background.src = "img/maxresdefault.jpg";
    ship.src = "img/smallfighter0006.png";

    var objectManager = new ANIM.ObjectManager();

    var yCoords = new Array();
    var dir = -1;
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
    var listener = {
        eventType: ANIMATION.EVENT_TYPES.OFF_SCREEN,
        listen: function (eventType, event) {
            //console.log("listener remove: "+event.getRoot().toString());
            event.getRoot().remove();
            var idx = Math.floor(Math.random() * 120);
            dir = dir - 2 * dir;
            var composite = createObject(idx, dir);
            composite.init();
            objectManager.add(composite);
            objectManager.commit();
        }
    };

    var createObject = function (idx, dir) {
        //
        var xAnimation = new ANIM.FixValueAnimation(Math.random() * (SCREEN_BOUNDS.xmax - 80));
        var yAnimation = new ANIM.PathAnimation2(-72, SCREEN_BOUNDS.ymax, 0.05 + 0.1 * Math.random()).addListener(listener);
        var xyBaseAnimation = new ANIM.XYAnimation(xAnimation, yAnimation);

        var spriteAnimation;
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

        var compositeMain = new ANIM.PaintableWithAnimation(
                spriteAnimation,
                xyBaseAnimation
                );

        if (idx >= 1 && idx < 24) {
            //build two circling satellites around a asteroid
            var speed = 0.05 + 0.1 * Math.random();
            var circleAnimation1 = new ANIM.CirclePathAnimation(65, 0, dir, speed);
            var circleAnimation2 = new ANIM.CirclePathAnimation(65, 180, dir, speed);
            //not quite sure why the XYCorrection parameters have to be 16,16 here? it should be 36,36????
            var relativeXYAnimation1 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation1), 16, 16);
            var relativeXYAnimation2 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation2), 16, 16);
            var circlePainter = new ANIM.CirclePainter(8, 65, new ANIM.XYCorrection(xyBaseAnimation, 36, 36));
            //
            //now it gets funky - let's build a circeling satelite around a sattelite
            var circleAnimation1_1 = new ANIM.CirclePathAnimation(32, 180, dir - 2 * dir, speed + 0.06);
            var relativeXYAnimation1_1 = new ANIM.RelativeXYAnimation(relativeXYAnimation1, circleAnimation1_1);
            var circlePainter1_1 = new ANIM.CirclePainter(8, 32, new ANIM.XYCorrection(relativeXYAnimation1, 16, 16));
            //
            // make the satellite of the satellite shake from time to time (controlled by an OnOffIntervall)
            var onOffIntervall = new ANIM.OnOffIntervalls(2000, 400);
            var yShaker = new ANIM.PosShake(onOffIntervall, 2);
            var xShaker = new ANIM.PosShake(onOffIntervall, -2);
            var shakerAnimation = new ANIM.XYAnimation(xShaker, yShaker);
            var relativeXYAnimation1_2 = new ANIM.RelativeXYAnimation(shakerAnimation, relativeXYAnimation1_1);
            //
            var satelliteAnimation = new ANIM.SpriteAnimation(asteroid3, dir, false, 50 + 150 * Math.random(), 1);
            var compositeSub1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1);
            var compositeSub2 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation2);
            var compositeSub1_1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1_2);
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

    for (i = 1; i < 10; i++) {
        objectManager.add(createObject(i, dir).setOrder(50));
        dir = dir - 2 * dir;
    }
    objectManager.commit();
    objectManager.getAnimations().forEach(function (elem) {
        elem.init();
    });
    var keyboardControl = new GAME.KeyboardControl(37, 38, 39, 40);
    keyboardControl.activate(canvas, function (o, n) {
        if(o!==n) {
            shipControlAnimation.setDirection(BASE.UNIT_VECTORS_2D[n]);
        }
        console.log("old: " + o + "; new: " + n + "; isLeft: " + GAME.KeyboardControl.is(n, BASE.DIRECTION.LEFT));
    });

    
    //==========================================================================
    //Setup the control button
    //
    var animationToggle = 1; //running
    var toggleAnimation = function (event) {
        animationToggle = 1 - animationToggle;
        var elem = document.getElementById("toggleAnimation");
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
    var lastTime = performance.now();
    var anim = function (current) {
        myCurrent = performance.now();
        delta = current - lastTime;
        lastTime = myCurrent;
        //context.clearRect(0, 0, canvas.width, canvas.height);
        objectManager.getAnimations().forEach(function (elem) {
            var retState = elem.update(myCurrent);
            if (retState && retState === ANIM.STATE.INACTIVE_PENDING) {
                //console.log("loop remove: "+elem.getRoot().toString());
                objectManager.remove(elem.getRoot());
            }
        });
        objectManager.getAnimations().forEach(function (elem) {
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
    var lastTrigger = Date.now();
    //var accumulatedDelay = 0;
    var fps = 65; //use 15, 30, 65
    var timeOutDelay = 6;
    var twoThirds = 2 * timeOutDelay / 3;
    var accumulatedDelay = twoThirds; //empirical start value, it makes accumulatedDelay reach faster frsPerSecondDelay
    var frsPerSecondDelay = 1000 / fps; //60 frames per second
    var triggerAnimationFrameWithTimeOut = function () {
        var current = Date.now();
        var delay = (current - lastTrigger); // allready elapsed time
        accumulatedDelay += delay;
        if (accumulatedDelay >= frsPerSecondDelay) {
            triggerAnimationFrame();
            accumulatedDelay = twoThirds;
        } else {
            setTimeout(triggerAnimationFrameWithTimeOut, timeOutDelay);
        }
        lastTrigger = current;
    };

    var triggerAnimationFrame = function () {
        window.requestAnimationFrame(anim, canvas);
    };

    //triggerAnimationFrame();
    triggerAnimationFrameWithTimeOut();
})(window.SETUP = window.SETUP || {});

