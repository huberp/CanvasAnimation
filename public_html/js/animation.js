//==============================================================================
// Animation Classes

var STATE = {
    UNKNOWN: {value: 0},
    NEW: {value: 1},
    RUN: {value: 2},
    INACTIVE_PENDING: {value: 4},
    INACTIVE: {value: 8},
    UNMANAGED_PENDING: {value: 16},
    UNMANAGED: {value: 32}
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
    this.getState = function () {
        return this.state;
    };
    this.setState = function (state) {
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
/**
 * PaintableWithStateIndicator combines a Paintable with a StateIndicator
 * @param {type} paintable
 * @param {type} objectStateIndicator optional state indicator. If provided this state indicators
 *                  getState method is called to provide return values for this.getState() and this.update()
 *                  State should be on of values of enum STATE. Such a StateIndicator could be a deaply nested PathAnimation which
 *                  triggers when if falls off the screen. Keep in mind - even if StateIndicator is a PathAnimatzion it won't be updated here!
 * @returns {animation_L50.PaintableWithStateIndicator}
 */
var PaintableWithStateIndicator = function (paintable, objectStateIndicator) {
    AnimationComponent.call(this);
    this.init = function () {
        var self = this;
        paintable.init();
        if (typeof paintable.setParent === 'function') {
            paintable.setParent(self);
        }
        return this;
    };
    this.update = function (current) {
        paintable.update(current);
        return this.getState();
    };
    this.paint = function (ctx) {
        paintable.paint(ctx);
    };
    this.getState = function () {
        if (objectStateIndicator && typeof objectStateIndicator.getState === 'function') {
            return objectStateIndicator.getState();
        } else {
            return this.state;
        }
    };
};
PaintableWithStateIndicator.inheritsFrom(AnimationComponent);
/**
 * PaintableCombination combines two paintables (top level objects)
 * @param {type} paintableA 1st paintable object 
 * @param {type} paintableB 2nd paintable object
 * @param {type} objectStateIndicator 
 * @returns {animation_L50.PaintableCombination}
 */
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
        return this.getState();
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
//TODO
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
            return this.getState();
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