(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            },
                    timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
//
//
(function () {
    Function.prototype.inheritsFrom = function (parentClassOrObject) {
        if (parentClassOrObject.constructor == Function)
        {
            //Normal Inheritance 
            this.prototype = new parentClassOrObject;
            this.prototype.constructor = this;
            this.prototype.parent = parentClassOrObject.prototype;
        }
        else
        {
            //Pure Virtual Inheritance 
            this.prototype = parentClassOrObject;
            this.prototype.constructor = this;
            this.prototype.parent = parentClassOrObject;
        }
        return this;
    };
})();
//
//
(function () {

    var STATE = {
            UNKNOWN: {value:0},
            NEW: { value:1},
            RUN:    {value:2},
            INACTIVE_PENDING:{value:4},
            INACTIVE:{value:8},
            UNMANAGED_PENDING: {value:16},
            UNMANAGED: {value:32}
        };
    var ManagedObject = function () {
        
        this.objectManager;
        this.idx;
        this.state = STATE.UNKNOWN;
        this.setManager = function (manager, idx) {
            this.objectManager = manager;
            this.idx = idx;
        };
        this.remove = function () {
            objectManager.remove(this);
            this.state = STATE.UNMANAGED_PENDING;
        };
        this.getState = function() {
            return this.state;
        };
        this.setState = function(state) {
            this.state = state;
        };
    };

    var ObjectManager = function () {
        this.counter = 0;
        this.animations = new Array();
        this.additions = new Array();
        this.deletions = new Array();
        this.add = function (animObj) {
            this.additions.push(animObj);
            if (typeof animObj.setManager === 'function') {
                animObj.setManager(this, this.counter++);
            }
        };
        this.remove = function (animObj) {
            this.deletions.push(animObj);
            animObj.setState(STATE.UNMANAGED_PENDING);
        };
        this.getAnimations = function () {
            return this.animations;
        };
        this.commit = function () {
            var len = this.deletions.length;
            for (var i = 0; i < len; i++) {
                var len2 = this.animations.length;
                for (var j = 0; j < len2; j++) {
                    if (this.animations[j].idx === this.deletions[i].idx) {
                        this.deletions[i].setState(STATE.UNMANAGED);
                        this.animations.splice(j, 1);
                        break;
                    }
                }
            }
            this.animations = this.animations.concat(this.additions);
            this.additions = new Array();
            this.deletions = new Array();
            //console.log(this.animations.length);
        };
    };

    var ObjectListener = function () {
        this.eventType = function () {
        };
        this.listen = function (eventType, event) {
        };
    };

    var ObjectListenerSupport = function () {
        ManagedObject.call(this);
        this.listeners = new Array();
        //console.log(this.listeners);
        this.addListener = function (listener) {
            this.listeners.push(listener);
            return this;
        };
        this.fire = function (eventType, event) {
            this.listeners.forEach(function (elem, idx, array) {
                fireSingel(elem, idx, array, eventType, event);
            });
        };
        this.fireAsync = function (eventType, event) {
            var len = this.listeners.length;
            for (var i = 0; i < len; i++) {
                timeout(function () {
                    fireSingle(this.listeners[i], i, this.listeners, eventType, event);
                }, 2);
            }
        };
        var fireSingel = function (listener, idx, array, eventType, event) {
            if (listener.eventType === eventType) {
                listener.listen(eventType, event);
            }
        };
    };
    ObjectListenerSupport.inheritsFrom(ManagedObject);
    //
    //
    var AnimationComponent = function () {
        ObjectListenerSupport.call(this);
        this.par = null;
        this.setParent = function (parent) {
            this.par = parent;
        };
        this.getParent = function () {
            return this.par;
        };
        this.init = function () {
            return this;
        };
    };
    AnimationComponent.inheritsFrom(ObjectListenerSupport);
    //
    //
    var CompositeAnimationComponent = function (componentA, componentB) {
        AnimationComponent.call(this);
        this.par = null;
        this.setParent = function (parent) {
            this.par = parent;
            if (typeof componentA.setParent === 'function') {
                componentA.setParent(parent);
            }
            if (typeof componentB.setParent === 'function') {
                componentB.setParent(parent);
            }
        };
        this.getParent = function () {
            return this.par;
        };
        this.init = function () {
            return this;
        };
    };
    CompositeAnimationComponent.inheritsFrom(AnimationComponent);
    //
    //
    var PaintableCombination = function (paintableA, paintableB) {
        CompositeAnimationComponent.call(this, paintableA, paintableB);
        this.init = function () {
            var self = this;
            paintableA.init();
            paintableB.init();
            if (typeof paintableA.setParent === 'function') {
                paintableA.setParent(self);
            }
            if (typeof paintableB.setParent === 'function') {
                paintableB.setParent(self);
            }
            return this;
        };
        this.update = function (current) {
            paintableA.update(current);
            paintableB.update(current);
        };
        this.paint = function (ctx) {
            paintableA.paint(ctx);
            paintableB.paint(ctx);
        };
    };
    PaintableCombination.inheritsFrom(CompositeAnimationComponent);
    //
    //
    var PaintableWithAnimation = function (paintable, xyPosition) {
        CompositeAnimationComponent.call(this, paintable, xyPosition);
        this.init = function () {
            var self = this;
            paintable.init();
            xyPosition.init();
            if (typeof paintable.setParent === 'function') {
                paintable.setParent(self);
            }
            if (typeof xyPosition.setParent === 'function') {
                xyPosition.setParent(self);
            }
            return this;
        };
        this.update = function (current) {
            paintable.update(current);
            xyPosition.update(current);
        };
        this.paint = function (ctx) {
            paintable.paint(ctx, xyPosition.getX(), xyPosition.getY());
        };
        this.getX = function () {
            return xyPosition.getX();
        };
        this.getY = function () {
            return xyPosition.getY();
        };
    };
    PaintableWithAnimation.inheritsFrom(CompositeAnimationComponent);
    //
    //
    var RelativeXYAnimation = function (relativeXYAnimation, baseXYAnimation) {
        CompositeAnimationComponent.call(this, relativeXYAnimation, baseXYAnimation);
        this.update = function (current) {
            relativeXYAnimation.update(current);
            baseXYAnimation.update(current);
        };
        this.getX = function () {
            return baseXYAnimation.getX() + relativeXYAnimation.getX();
        };
        this.getY = function () {
            return baseXYAnimation.getY() + relativeXYAnimation.getY();
        };
        this.setX = function (x) {
            baseXYAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            baseXYAnimation.setPos(y);
            return this;
        };
    };
    RelativeXYAnimation.inheritsFrom(CompositeAnimationComponent);
    //
    //
    var XYCorrection = function (xyAnimation, deltaX, deltaY) {
        AnimationComponent.call(this);
        this.init = function () {
            var self = this;
            xyAnimation.init().setParent(self);
            return this;
        };
        this.update = function (current) {
            xyAnimation.update(current);
        };
        this.getX = function () {
            return deltaX + xyAnimation.getX();
        };
        this.getY = function () {
            return deltaY + xyAnimation.getY();
        };
        this.setX = function (x) {
            xyAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            xyAnimation.setPos(y);
            return this;
        };
    };
    XYCorrection.inheritsFrom(AnimationComponent);
//
    //
    var XYAnimation = function (xAnimation, yAnimation) {
        CompositeAnimationComponent.call(this, xAnimation, yAnimation);
        this.init = function () {
            var self = this;
            xAnimation.init().setParent(self);
            yAnimation.init().setParent(self);
            return this;
        };
        this.update = function (current) {
            xAnimation.update(current);
            yAnimation.update(current);
        };
        this.getX = function () {
            return xAnimation.getPos();
        };
        this.getY = function () {
            return yAnimation.getPos();
        };
        this.setX = function (x) {
            xAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            yAnimation.setPos(y);
            return this;
        };
        this.setParent = function (par) {
            this.par = par;
            xAnimation.setParent(par);
            yAnimation.setParent(par);
        };
    };
    XYAnimation.inheritsFrom(CompositeAnimationComponent);

//
//
    var XYAnimationPath = function (startX, startY, animationParts) {
        AnimationComponent.call(this);
        this.currentPart = null;
        this.init = function () {
            this.currentPart = animationParts.pop();
            this.currentPart.setParent(this.getParent());
            this.currentPart.init().setX(startX).setY(startY);
            return this;
        };
        this.update = function (current) {
            var retVal = this.currentPart.update(current);
            if (retVal === XYAnimationPathPart.PART_STATE.STOP) {
                if (animationParts.length > 0) {
                    this.init();
                } else {
                    this.fire(EVENT_TYPES.OFF_SCREEN, this);
                }
            }
        };
        this.getX = function () {
            return currentPart.getPos();
        };
        this.getY = function () {
            return currentPart.getPos();
        };
    };
    XYAnimationPath.inheritsFrom(AnimationComponent);
//
//
    var XYAnimationPathPart = function () {
        this.PART_STATE = {
            CONTINUE: {},
            STOP: {}
        };
        this.init = function () {
            var self = this;
            xAnimation.init();
            yAnimation.init();
            xAnimation.setParent(self);
            yAnimation.setParent(self);
            return this;
        };
        this.update = function (current) {

        };
        this.getX = function () {
            return xAnimation.getPos();
        };
        this.getY = function () {
            return yAnimation.getPos();
        };

    }
    //==========================================================================
    //Conrete Animation Implementations
    //
    //
    var CirclePathAnimation = function (radius, startDeg, direction, degPerMs) {
        AnimationComponent.call(this);
        var PI_PER_DEG = Math.PI / 180;
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
        //current pos
        this.currentArc = startDeg * PI_PER_DEG;
        this.arcPerMs = degPerMs * PI_PER_DEG;
        this.init = function () {
            lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.currentArc = (this.currentArc + direction * delta * this.arcPerMs);
            this.lastUpdateTime = current;
        };
        this.getX = function () {
            return radius * Math.cos(this.currentArc);
        };
        this.getY = function () {
            return radius * Math.sin(this.currentArc);
        };
    };
    CirclePathAnimation.inheritsFrom(AnimationComponent);
    //
    //
    var BouncingPathAnimation = function (posMin, posMax, pixelPerMs) {
        AnimationComponent.call(this);
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
        //current pos
        this.currentPos = posMin;
        this.direction = (posMax - posMin) / Math.abs(posMax - posMin);
        this.init = function () {
            lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.currentPos = this.currentPos + this.direction * delta * pixelPerMs;
            if (this.currentPos >= posMax)
                this.direction = -1;
            if (this.currentPos <= posMin)
                this.direction = 1;
            this.lastUpdateTime = current;
        };
        this.getPos = function () {
            return this.currentPos;
        };
    };
    BouncingPathAnimation.inheritsFrom(AnimationComponent);
//
//
    var PathAnimation2 = function (from, to, pixelPerMs) {
        AnimationComponent.call(this);
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
        //current pos
        this.currentPos = from;
        this.direction = (to - from) / Math.abs(to - from);
        this.init = function () {
            this.currentPos = from;
            this.lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.lastUpdateTime = current;
            //console.log(delta);
            this.currentPos = this.currentPos + this.direction * delta * pixelPerMs;
            if (compare(this.currentPos, to)) {
                this.fire(EVENT_TYPES.OFF_SCREEN, this);
                this.currentPos = from;
                this.setState(STATE.INACTIVE_PENDING);
                return getState();
            }
        };
        this.getPos = function () {
            return this.currentPos;
        };
        var compareNeg = function (cur, to) {
            return cur <= to;
        };
        var comparePos = function (cur, to) {
            return cur >= to;
        };
        var compare = this.direction <= 0 ? compareNeg : comparePos;
    };
    PathAnimation2.inheritsFrom(AnimationComponent);
//
//
    var FixValueAnimation = function (value) {
        AnimationComponent.call(this);
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.getPos = function () {
            return value;
        };
        this.setPos = function (pos) {
            //use this for XYAnimationPathPart
            value = pos;
        };
    };
    FixValueAnimation.inheritsFrom(AnimationComponent);
//
//
    var SpriteAnimation = function (img, sx, sy, gridx, nosprites, direction, oneTime, updateDelay, alpha) {
        AnimationComponent.call(this);
        //current index into spritephases - nosprites is maximum
        this.currentPos = 0;
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
        //animBase is 0 if direction is +1 and nosprites if direction is -1
        //this allows for backward and forward animation
        this.animBase = direction === -1 ? nosprites - 1 : 0;
        this.init = function () {
            lastUpdateTime = performance.now();
        };
        this.update = function (current) {
            //only update if updateDelay has benn exceeded. this allows for different
            //update sppeds. but be aware that the delay may exceed one sprite-step
            //so we have to check if we have to do more than one step here
            var delay = current - this.lastUpdateTime;
            if (delay > updateDelay) {
                this.currentPos = this.currentPos + Math.floor(delay / updateDelay);
                if (oneTime) {
                    if (this.currentPos > nosprites || this.currentPos < 0) {
                        this.fire(EVENT_TYPES.OFF_SCREEN, this);
                    }
                }
                this.currentPos = this.currentPos % nosprites;
                this.lastUpdateTime = current;
            }
        };
        this.paint = function (ctx, px, py) {
            //compute idx based on animBase and direction - this allows for forward and backward animation
            var idx = (this.animBase + direction * this.currentPos);
            var y = Math.floor(idx / gridx);
            var x = Math.floor(idx % gridx);
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, x * sx, y * sy, sx, sy, px, py, sx, sy);
        };
    };
    SpriteAnimation.inheritsFrom(AnimationComponent);
//
//
    var ImgPainter = function (img, width, height) {
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.paint = function (ctx, px, py) {
            ctx.drawImage(img, px, py, width, height);
        };
    };
//
    var EVENT_TYPES = {
        OFF_SCREEN: {}
    };

    var CirclePainter = function (color, radius, position) {
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.paint = function (ctx, px, py) {
            ctx.beginPath();
            ctx.arc(position.getX(), position.getY(), radius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
        };
    };

    //==========================================================================
    //
    //  Now setup the animations and run it
    //
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
//
//http://freegameassets.blogspot.de/
    var asteroid1 = new Image();
    var asteroid3 = new Image();
    var asteroid4 = new Image();
    var explosion = new Image();
    var background = new Image();
//http://www.codeproject.com/Articles/677417/Shootem-Up-NET
    var explosion2 = new Image();
//
    asteroid1.src = "img/asteroid1_72x72.png";
    asteroid3.src = "img/asteroid3_32x32.png";
    asteroid4.src = "img/asteroid4_32x32.png";
    explosion.src = "img/explosion01_set_64x64.png";
    background.src = "img/maxresdefault.jpg";
    explosion2.src = "img/explosion02_96x96.png";

    objectManager = new ObjectManager();

    yCoords = new Array();
    dir = -1;
    //
    //background
    objectManager.add(
            new PaintableWithAnimation(
                    new ImgPainter(background, 1080, 1920),
                    new XYAnimation(
                            new FixValueAnimation(0),
                            new PathAnimation2(-1320, 0, 0.02)
                            )
                    ));

    //
    //A Listener which listens to OFF_SCREEN events
    var listener = {
        eventType: EVENT_TYPES.OFF_SCREEN,
        listen: function (eventType, event) {
            event.getParent().remove();
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
        var yAnimation = new PathAnimation2(-72, 600, 0.05 + 0.1 * Math.random()).addListener(listener);
        var xAnimation = new FixValueAnimation(Math.random() * 520);
        var xyBaseAnimation = new XYAnimation(xAnimation, yAnimation);

        var spriteAnimation;
        //
        if (idx >= 1 && idx < 24) {
            spriteAnimation = new SpriteAnimation(asteroid1, 72, 72, 5, 19, dir, false, 150 + 150 * Math.random(), 1);
        } else if (idx >= 24 && idx < 48) {
            spriteAnimation = new SpriteAnimation(asteroid3, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 48 && idx < 72) {
            spriteAnimation = new SpriteAnimation(asteroid4, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 72 && idx < 108) {
            spriteAnimation = new SpriteAnimation(explosion, 64, 64, 10, 100, 1, true, 50 + 50 * Math.random(), 0.5);
        } else {
            spriteAnimation = new SpriteAnimation(explosion2, 96, 96, 5, 20, 1, true, 100 + 200 * Math.random(), 0.7);
        }

        var compositeMain = new PaintableWithAnimation(
                spriteAnimation,
                xyBaseAnimation
                );

        if (idx >= 1 && idx < 24) {
            //build two circling sattelites around a asteroid
            var speed = 0.1 + 0.1 * Math.random();
            var circleAnimation1 = new CirclePathAnimation(65, 0, dir, speed);
            var circleAnimation2 = new CirclePathAnimation(65, 180, dir, speed);
            //not quite sure why the XYCorrection parameters have to be 16,16 here? it should be 36,36????
            var relativeXYAnimation1 = new XYCorrection(new RelativeXYAnimation(xyBaseAnimation, circleAnimation1),16,16);
            var relativeXYAnimation2 = new XYCorrection(new RelativeXYAnimation(xyBaseAnimation, circleAnimation2),16,16);
            var circlePainter = new CirclePainter(8,65, new XYCorrection(xyBaseAnimation,36,36));
            //now it gets funky - let's build a circeling satelite around a sattelite
            var circleAnimation1_1 = new CirclePathAnimation(32, 180, dir - 2 * dir, speed + 0.06);
            var relativeXYAnimation1_1 = new RelativeXYAnimation(relativeXYAnimation1, circleAnimation1_1);
            var circlePainter1_1 = new CirclePainter(8,32, new XYCorrection(relativeXYAnimation1,16,16));

            var satelliteAnimation = new SpriteAnimation(asteroid3, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
            var compositeSub1 = new PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1);
            var compositeSub2 = new PaintableWithAnimation(satelliteAnimation, relativeXYAnimation2);
            var compositeSub1_1 = new PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1_1);
            return new PaintableCombination(
                 compositeMain, 
                 new PaintableCombination(
                         circlePainter, 
                         new PaintableCombination(
                                 compositeSub2, 
                                 new PaintableCombination(
                                         compositeSub1, 
                                         new PaintableCombination(circlePainter1_1,compositeSub1_1)))));
        } else {
            return compositeMain;
        }
    };

    for (i = 1; i < 10; i++) {
        objectManager.add(createObject(i, dir));
        dir = dir - 2 * dir;
    }
    objectManager.commit();
    objectManager.getAnimations().forEach(function (elem) {
        elem.init();
    });

    context.font = '40pt Calibri';
    context.fillStyle = 'blue';

    var lastTime = performance.now();
    anim = function (current) {
        myCurrent = performance.now();
        window.requestAnimationFrame(anim, canvas);
        delta = current - lastTime;
        lastTime = performance.now();
        //context.clearRect(0, 0, canvas.width, canvas.height);
        objectManager.getAnimations().forEach(function (elem) {
            var retState = elem.update(myCurrent);
            if(retState && retState===ManagedObject.STATE.INACTIVE_PENDING) {
                objectManager.remove(elem);
            }
        });
        objectManager.getAnimations().forEach(function (elem) {
            elem.paint(context);
        });
        objectManager.commit();
    };
    window.requestAnimationFrame(anim, canvas);
})();

