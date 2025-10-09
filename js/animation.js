//==============================================================================
// Animation Classes - ES6 Module

export const EVENT_TYPES = {
    OFF_SCREEN: {}
};

export const STATE = {
    UNKNOWN: {value: 0},
    NEW: {value: 1},
    RUN: {value: 2},
    INACTIVE_PENDING: {value: 4},
    INACTIVE: {value: 8},
    UNMANAGED_PENDING: {value: 16},
    UNMANAGED: {value: 32}
};

export const PART_STATE = {
    CONTINUE: {},
    STOP: {}
};

const fireSingel = (listener, idx, array, eventType, event) => {
    if (listener.eventType === eventType) {
        listener.listen(eventType, event);
    }
};

const compareNeg = (cur, to) => {
    return cur <= to;
};
const comparePos = (cur, to) => {
    return cur >= to;
};

/**
 * Base Class for a object managed by ObjectManager.
 */
export class ManagedObject {
        constructor() {
            this.objectManager = undefined;
            this.idx = undefined;
            this.state = STATE.UNKNOWN;
            //something like a z-order, order in which objects are about to be painted
            //pbjects that are painted "later" might hide parts of objects that have been
            //painted earlier
            this.order = 0;
        }
        
        setManager(manager, idx) {
            this.objectManager = manager;
            this.idx = idx;
        }
        
        remove() {
            this.objectManager.remove(this);
            this.state = STATE.UNMANAGED_PENDING;
        }
        
        getState() {
            return this.state;
        }
        
        setState(state) {
            this.state = state;
        }
        
        setOrder(order) {
            this.order = order;
            return this;
        }
        
        getOrder() {
            return this.order;
        }
        
        static sortComparator(a, b) {
            return a.order - b.order;
        }
    }

/**
 * Manages the Objects, mostly this should be Paintable top level objects.
 */
export class ObjectManager {
        constructor() {
            this.counter = 0;
            this.animations = [];
            this.additions = [];
            this.deletions = [];
        }
        
        add(animObj) {
            this.additions.push(animObj);
            if (typeof animObj.setManager === 'function') {
                animObj.setManager(this, this.counter++);
            }
        }
        
        remove(animObj) {
            this.deletions.push(animObj);
            animObj.setState(STATE.UNMANAGED_PENDING);
        }
        
        getAnimations() {
            return this.animations;
        }
        
        pause() {
        }
        
        resume() {
            const len = this.animations.length;
            for (let i = 0; i < len; i++) {
                if (typeof this.animations[i].resume === 'function') {
                    this.animations[i].resume();
                }
            }
        }
        
        /**
         * add and remove will store changes in seperate array
         * only until a call to commit at the end of each game loop.
         * This is sort of a transaction.
         */
        commit() {
            const len = this.deletions.length;
            for (let i = 0; i < len; i++) {
                const len2 = this.animations.length;
                for (let j = 0; j < len2; j++) {
                    if (this.animations[j].idx === this.deletions[i].idx) {
                        this.deletions[i].setState(STATE.UNMANAGED);
                        this.animations.splice(j, 1);
                        break;
                    }
                }
            }
            this.animations = this.animations.concat(this.additions);
            this.animations.sort(ManagedObject.sortComparator);
            this.additions = [];
            this.deletions = [];
            //console.log(this.animations.length);
        }
    }

/**
 * Defines interface for an Object Listener
 */
export class ObjectListener {
        constructor() {
            this.eventType = () => {
            };
            this.listen = (eventType, event) => {
            };
        }
    }

/**
 * Base Class for objects that emit events and support listeners.
 * Subclass of ManagedObject
 */
export class ObjectListenerSupport extends ManagedObject {
        constructor() {
            super();
            this.listeners = [];
        }
        
        addListener(listener) {
            this.listeners.push(listener);
            return this;
        }
        
        fire(eventType, event) {
            this.listeners.forEach((elem, idx, array) => {
                fireSingel(elem, idx, array, eventType, event);
            });
        }
        
        fireAsync(eventType, event) {
            const len = this.listeners.length;
            for (let i = 0; i < len; i++) {
                timeout(() => {
                    fireSingel(this.listeners[i], i, this.listeners, eventType, event);
                }, 2);
            }
        }
    }

/**
 * Base Class for an AnimationComponent. It's only purpose is
 * to manage a relationship to a parent of a composition tree.
 * Subclass of ObjectListenerSupport
 */
export class AnimationComponent extends ObjectListenerSupport {
        constructor() {
            super();
            this.root = null;
            //last update time - we do updates only each "updateDelay" milliseconds
            this.lastUpdateTime = 0;
        }
        
        init() {
            this.lastUpdateTime = performance.now();
            return this;
        }
        
        update(current) {
            this.lastUpdateTime = current;
        }
        
        pause() {
            //nothing to do here
        }
        
        resume() {
            this.lastUpdateTime = performance.now();
        }
        
        setRoot(parent) {
            this.root = parent;
        }
        
        getRoot() {
            return this.root;
        }
    }

/**
 * AnimationComponentDelegate
 */
export class AnimationComponentDelegate extends ObjectListenerSupport {
        constructor(delegate) {
            super();
            this.delegate = delegate;
        }
        
        init() {
            this.delegate.init().setRoot(this);
        }
        
        update(current) {
            return this.delegate.update(current);
        }
        
        pause() {
            this.delegate.pause();
        }
        
        resume() {
            this.delegate.resume();
        }
        
        setRoot(parent) {
            this.delegate.setRoot(parent);
        }
        
        getRoot() {
            return this.delegate.getRoot();
        }
        
        setOrder(order) {
            this.delegate.setOrder(order);
            return this;
        }
        
        getOrder() {
            return this.delegate.getOrder();
        }
    }

/**
 * Composition of two or more AnimationComponent object. This CompositionObject
 * is itself a AnimationComponent
 */
export class CompositeAnimationComponent extends AnimationComponent {
        constructor(components) {
            super();
            this.components = components;
        }
        
        init() {
            const len = this.components.length;
            for (let i = 0; i < len; i++) {
                this.components[i].init();
            }
            this.setRoot(this);
            return this;
        }
        
        update(current) {
            const len = this.components.length;
            for (let i = 0; i < len; i++) {
                this.components[i].update(current);
            }
            return super.update(current);
        }
        
        setRoot(parent) {
            this.root = parent;
            const len = this.components.length;
            for (let i = 0; i < len; i++) {
                if (typeof this.components[i].setRoot === 'function') {
                    this.components[i].setRoot(parent);
                }
            }
        }
        
        getRoot() {
            return this.root;
        }
        
        resume() {
            const len = this.components.length;
            for (let i = 0; i < len; i++) {
                if (typeof this.components[i].resume === 'function') {
                    this.components[i].resume();
                }
            }
        }
    }

/**
 * PaintableWithStateIndicator combines a Paintable with a StateIndicator
 */
export class PaintableWithStateIndicator extends AnimationComponentDelegate {
        constructor(paintable, objectStateIndicator) {
            super(paintable);
            this.paintable = paintable;
            this.objectStateIndicator = objectStateIndicator;
        }
        
        update(current) {
            this.paintable.update(current);
            return this.getState();
        }
        
        paint(ctx) {
            this.paintable.paint(ctx);
        }
        
        getState() {
            if (this.objectStateIndicator && typeof this.objectStateIndicator.getState === 'function') {
                return this.objectStateIndicator.getState();
            } else {
                return this.state;
            }
        }
    }

/**
 * PaintableCombination combines two or more paintables (top level objects)
 */
export class PaintableCombination extends CompositeAnimationComponent {
        constructor(paintables) {
            super(paintables);
        }
        
        paint(ctx) {
            const len = this.components.length;
            for (let i = 0; i < len; i++) {
                this.components[i].paint(ctx);
            }
        }
    }

/**
 * PaintableWithAnimation
 */
export class PaintableWithAnimation extends CompositeAnimationComponent {
        constructor(paintable, xyPosition) {
            super([paintable, xyPosition]);
            this.paintable = paintable;
            this.xyPosition = xyPosition;
        }
        
        paint(ctx) {
            this.paintable.paint(ctx, this.xyPosition.getX(), this.xyPosition.getY());
        }
        
        getX() {
            return this.xyPosition.getX();
        }
        
        getY() {
            return this.xyPosition.getY();
        }
    }

/**
 * Combines two XY animations.
 * Might be used to combine a simple base animation, let's say to move an object
 * from to of screen to bottom (XYAnimation) and make a second object circle around it (CirclePathAnimation).
 */
export class RelativeXYAnimation extends CompositeAnimationComponent {
        constructor(relativeXYAnimation, baseXYAnimation) {
            super([relativeXYAnimation, baseXYAnimation]);
            this.baseXYAnimation = baseXYAnimation;
            this.relativeXYAnimation = relativeXYAnimation;
        }
        
        getX() {
            return this.baseXYAnimation.getX() + this.relativeXYAnimation.getX();
        }
        
        getY() {
            return this.baseXYAnimation.getY() + this.relativeXYAnimation.getY();
        }
        
        setX(x) {
            this.baseXYAnimation.setPos(x);
            return this;
        }
        
        setY(y) {
            this.baseXYAnimation.setPos(y);
            return this;
        }
    }

/**
 * XYCorrection
 */
export class XYCorrection extends AnimationComponent {
        constructor(xyAnimation, deltaX, deltaY) {
            super();
            this.xyAnimation = xyAnimation;
            this.deltaX = deltaX;
            this.deltaY = deltaY;
        }
        
        init() {
            const self = this;
            this.xyAnimation.init().setRoot(self);
            return this;
        }
        
        update(current) {
            return this.xyAnimation.update(current);
        }
        
        getX() {
            return this.deltaX + this.xyAnimation.getX();
        }
        
        getY() {
            return this.deltaY + this.xyAnimation.getY();
        }
        
        setX(x) {
            this.xyAnimation.setPos(x);
            return this;
        }
        
        setY(y) {
            this.xyAnimation.setPos(y);
            return this;
        }
        
        resume() {
            this.xyAnimation.resume();
        }
    }

/**
 * Computes a relative position based on a changeable direction "direction2D"
 * and a speed "pixelPerMs". It will start with position (0,0). The direction can
 * be updated with "setDirection".
 * Best use: Use any Unit Vector as "direction2D". To start with a position other
 * than (0,0) please combine it with a RelativeXYAnimation;
 * Intention: Use for controling objects with key strokes.
 */
export class Vector2DAnimation extends AnimationComponent {
        constructor(direction2D, pixelPerMs, boundsRectangle2D) {
            super();
            this.direction2D = direction2D;
            this.boundsRectangle2D = boundsRectangle2D;
            this.pixelPerMs = pixelPerMs;
            this.x = 0;
            this.y = 0;
        }
        
        getX() {
            return this.x;
        }
        
        getY() {
            return this.y;
        }
        
        setDirection(newDirection2D) {
            return this.direction2D = newDirection2D;
        }
        
        update(current) {
            const delta = current - this.lastUpdateTime;
            this.lastUpdateTime = current;
            //console.log(delta);
            this.x = this.x + this.direction2D.x * delta * this.pixelPerMs;
            this.y = this.y + this.direction2D.y * delta * this.pixelPerMs;
            //
            //think about emitting a bounds reached event?
            if (this.x < this.boundsRectangle2D.xmin) {
                this.x = this.boundsRectangle2D.xmin;
            } else if (this.x > this.boundsRectangle2D.xmax) {
                this.x = this.boundsRectangle2D.xmax;
            }
            if (this.y < this.boundsRectangle2D.ymin) {
                this.y = this.boundsRectangle2D.ymin;
            } else if (this.y > this.boundsRectangle2D.ymax) {
                this.y = this.boundsRectangle2D.ymax;
            }
            return this.getState();
        }
    }

/**
 * Combines 2 basic animation objects to get a XYAnimation
 * which updates coordinates along both principal directions.
 */
export class XYAnimation extends CompositeAnimationComponent {
        constructor(xAnimation, yAnimation) {
            super([xAnimation, yAnimation]);
            this.xAnimation = xAnimation;
            this.yAnimation = yAnimation;
        }
        
        getX() {
            return this.xAnimation.getValue();
        }
        
        getY() {
            return this.yAnimation.getValue();
        }
        
        setX(x) {
            this.xAnimation.setPos(x);
            return this;
        }
        
        setY(y) {
            this.yAnimation.setPos(y);
            return this;
        }
    }

/**
 * XYAnimationPath
 */
export class XYAnimationPath extends AnimationComponent {
        constructor(startX, startY, animationParts) {
            super();
            this.startX = startX;
            this.startY = startY;
            this.animationParts = animationParts;
            this.currentPart = null;
        }
        
        init() {
            this.currentPart = this.animationParts.pop();
            this.currentPart.setRoot(this.getRoot());
            this.currentPart.init().setX(this.startX).setY(this.startY);
            return this;
        }
        
        update(current) {
            const retVal = this.currentPart.update(current);
            if (retVal === PART_STATE.STOP) {
                if (this.animationParts.length > 0) {
                    this.init();
                } else {
                    this.fire(EVENT_TYPES.OFF_SCREEN, this);
                }
            }
        }
        
        getX() {
            return this.currentPart.getValue();
        }
        
        getY() {
            return this.currentPart.getValue();
        }
    }

/**
 * XYAnimationPathPart - TODO
 */
export class XYAnimationPathPart {
        constructor() {
            this.PART_STATE = {
                CONTINUE: {},
                STOP: {}
            };
        }
        
        init() {
            const self = this;
            xAnimation.init();
            yAnimation.init();
            xAnimation.setRoot(self);
            yAnimation.setRoot(self);
            return this;
        }
        
        update(current) {
        }
        
        getX() {
            return xAnimation.getValue();
        }
        
        getY() {
            return yAnimation.getValue();
        }
    }

//==============================================================================
//Conrete Animation Implementations

/**
 * OnOffIntervalls
 */
export class OnOffIntervalls extends AnimationComponent {
        constructor(eachMsec, forMsec) {
            super();
            this.elapsed = 0;
            this.addedMsec = eachMsec + forMsec;
            this.on = false;
            this.eachMsec = eachMsec;
        }
        
        update(current) {
            this.elapsed += (current - this.lastUpdateTime);
            if (this.elapsed > this.eachMsec) {
                if (this.elapsed > this.addedMsec) {
                    this.elapsed = 0;
                    this.value = 0;
                    this.on = false;
                } else {
                    this.on = true;
                }
            }
            return super.update(current);
        }
        
        isOn() {
            return this.on;
        }
    }

/**
 * PosShake
 */
export class PosShake extends CompositeAnimationComponent {
        constructor(onOffControl, shakeValue) {
            super([onOffControl]);
            this.value = 0;
            this.mult = 1;
            this.onOffControl = onOffControl;
            this.shakeValue = shakeValue;
        }
        
        update(current) {
            if (this.onOffControl.isOn()) {
                this.mult = this.mult - 2 * this.mult;
                this.value = this.mult * this.shakeValue;
            } else {
                this.value = 0;
            }
            return super.update(current);
        }
        
        getValue() {
            return this.value;
        }
    }

/**
 * SumPosition
 */
export class SumPosition extends CompositeAnimationComponent {
        constructor(positionA, positionB) {
            super([positionA, positionB]);
            this.positionA = positionA;
            this.positionB = positionB;
        }
        
        getValue() {
            return this.positionA.getValue() + this.positionB.getValue();
        }
    }

/**
 * Accellerator
 */
export class Accellerator extends AnimationComponent {
        constructor(lowSpeed, highSpeed, speedIncPerMs) {
            super();
            this.currentSpeed = lowSpeed;
            this.lowSpeed = lowSpeed;
            this.highSpeed = highSpeed;
            this.speedIncPerMs = speedIncPerMs;
        }
        
        init() {
            this.lastUpdateTime = performance.now();
            return this;
        }
        
        update(current) {
            const delta = current - this.lastUpdateTime;
            this.currentSpeed += delta * this.speedIncPerMs;
            if (this.currentSpeed > this.highSpeed) {
                this.currentSpeed = this.highSpeed;
            }
        }
        
        getValue() {
            return this.currentSpeed;
        }
    }

/**
 * Provides an Arc Value computed based on the time elapsed and a
 * Degree-Per-Millisecond velocity value;
 */
export class ArcBaseAnmimation extends AnimationComponent {
        constructor(startDeg, direction, degPerMs) {
            super();
            const PI_PER_DEG = Math.PI / 180;
            //current pos
            this.currentArc = startDeg * PI_PER_DEG;
            //multiply direction in, so go forward or backward according to given parameter
            this.arcPerMs = direction * degPerMs * PI_PER_DEG;
            this.direction = direction;
        }
        
        update(current) {
            const delta = current - this.lastUpdateTime;
            this.currentArc = (this.currentArc + delta * this.arcPerMs);
            return super.update(current);
        }
        
        getValue() {
            return this.currentArc;
        }
    }

/**
 * SinValue
 */
export class SinValue {
        constructor(radius, arcValueFct) {
            this.arcValueFct = arcValueFct;
            this.radius = radius;
        }
        
        getValue() {
            return this.radius * Math.sin(this.arcValueFct.getValue());
        }
    }

/**
 * CosValue
 */
export class CosValue {
        constructor(radius, arcValueFct) {
            this.arcValueFct = arcValueFct;
            this.radius = radius;
        }
        
        getValue() {
            return this.radius * Math.cos(this.arcValueFct.getValue());
        }
    }

/**
 * DeltaValue
 */
export class DeltaValue {
        constructor(delta, inputValueFct) {
            this.inputValueFct = inputValueFct;
            this.delta = delta;
        }
        
        getValue() {
            return this.inputValueFct.getValue() + this.delta;
        }
    }

/**
 * CirclePathAnimation
 */
export class CirclePathAnimation extends AnimationComponent {
        constructor(radius, startDeg, direction, degPerMs) {
            super();
            this.arcValueFct = new ArcBaseAnmimation(startDeg, direction, degPerMs);
            this.cos = new CosValue(radius, this.arcValueFct);
            this.sin = new SinValue(radius, this.arcValueFct);
        }
        
        update(current) {
            this.arcValueFct.update(current);
            return super.update(current);
        }
        
        getX() {
            return this.cos.getValue();
        }
        
        getY() {
            return this.sin.getValue();
        }
    }

/**
 * BouncingPathAnimation
 */
export class BouncingPathAnimation extends AnimationComponent {
        constructor(posMin, posMax, pixelPerMs) {
            super();
            //current pos
            this.currentPos = posMin;
            this.direction = (posMax - posMin) / Math.abs(posMax - posMin);
            this.pixelPerMs = pixelPerMs;
            this.posMax = posMax;
            this.posMin = posMin;
        }
        
        init() {
            this.lastUpdateTime = performance.now();
            return this;
        }
        
        update(current) {
            const delta = current - this.lastUpdateTime;
            this.currentPos = this.currentPos + this.direction * delta * this.pixelPerMs;
            if (this.currentPos >= this.posMax)
                this.direction = -1;
            if (this.currentPos <= this.posMin)
                this.direction = 1;
            this.lastUpdateTime = current;
        }
        
        getValue() {
            return this.currentPos;
        }
    }

/**
 * Computes a path from "from" to "to" with velocity of "pixelPerMs" pixels per millisecond.
 */
export class PathAnimation2 extends AnimationComponent {
        constructor(from, to, pixelPerMs) {
            super();
            //current pos
            this.currentPos = from;
            this.direction = (to - from) / Math.abs(to - from);
            this.pixelPerMs = pixelPerMs;
            this.to = to;
            this.from = from;
            this.compare = this.direction <= 0 ? compareNeg : comparePos;
        }
        
        init() {
            this.currentPos = this.from;
            this.lastUpdateTime = performance.now();
            return this;
        }
        
        update(current) {
            const delta = current - this.lastUpdateTime;
            this.lastUpdateTime = current;
            //console.log(delta);
            this.currentPos = this.currentPos + this.direction * delta * this.pixelPerMs;
            if (this.compare(this.currentPos, this.to)) {
                if (this.getState() !== STATE.INACTIVE_PENDING) {
                    this.fire(EVENT_TYPES.OFF_SCREEN, this);
                }
                this.setState(STATE.INACTIVE_PENDING);
            }
            return this.getState();
        }
        
        getValue() {
            return this.currentPos;
        }
    }

/**
 * FixValueAnimation
 */
export class FixValueAnimation extends AnimationComponent {
        constructor(value) {
            super();
            this.value = value;
        }
        
        getValue() {
            return this.value;
        }
        
        setPos(pos) {
            //use this for XYAnimationPathPart
            this.value = pos;
        }
    }

/**
 * SpriteDescriptor
 */
export class SpriteDescriptor {
        constructor(img, sx, sy, gridWidth, noSprites) {
            this.img = img;
            this.sx = sx;
            this.sy = sy;
            this.gridWidth = gridWidth;
            this.noSprites = noSprites;
        }
    }

/**
 * SpriteAnimation
 */
export class SpriteAnimation extends AnimationComponent {
        constructor(spriteDescriptor, direction, oneTime, updateDelay, alpha) {
            super();
            this.spriteDescriptor = spriteDescriptor;
            //current index into spritephases - nosprites is maximum
            this.currentPos = 0;
            //animBase is 0 if direction is +1 and nosprites if direction is -1
            //this allows for backward and forward animation
            this.animBase = direction === -1 ? spriteDescriptor.noSprites - 1 : 0;
            this.oneTime = oneTime;
            this.updateDelay = updateDelay;
            this.alpha = alpha;
            this.direction = direction;
        }
        
        update(current) {
            //reference shortcuts for better performance and shorter expressions
            const noSprites = this.spriteDescriptor.noSprites;
            //only update if updateDelay has benn exceeded. this allows for different
            //update sppeds. but be aware that the delay may exceed one sprite-step
            //so we have to check if we have to do more than one step here
            const delay = current - this.lastUpdateTime;
            if (delay > this.updateDelay) {
                this.currentPos = this.currentPos + Math.floor(delay / this.updateDelay);
                if (this.oneTime) {
                    //console.log("Sprite: "+nosprites+"; "+this.currentPos+"; "+(direction)+"; "+delay+"; "+updateDelay);
                    if ((this.direction === 1 && this.currentPos >= noSprites) || (this.direction === -1 && this.currentPos <= 0)) {
                        if (this.getState() !== STATE.INACTIVE_PENDING) {
                            this.fire(EVENT_TYPES.OFF_SCREEN, this);
                        }
                        this.setState(STATE.INACTIVE_PENDING);
                    }
                }
                this.currentPos = this.currentPos % noSprites;
                this.lastUpdateTime = current;
            }
        }
        
        paint(ctx, px, py) {
            //reference shortcuts for better performance and shorter expressions
            const spriteDesc = this.spriteDescriptor;
            const sx = spriteDesc.sx;
            const sy = spriteDesc.sy;
            //compute idx based on animBase and direction - this allows for forward and backward animation
            const idx = (this.animBase + this.direction * this.currentPos);
            const y = Math.floor(idx / spriteDesc.gridWidth);
            const x = Math.floor(idx % spriteDesc.gridWidth);
            const currentAlpha = ctx.globalAlpha;
            ctx.globalAlpha = this.alpha;
            ctx.drawImage(spriteDesc.img, x * sx, y * sy, sx, sy, px, py, sx, sy);
            ctx.globalAlpha = currentAlpha;
        }
    }

/**
 * ImgPainter
 */
export class ImgPainter extends AnimationComponent {
        constructor(img, width, height) {
            super();
            this.img = img;
            this.width = width;
            this.height = height;
        }
        
        paint(ctx, px, py) {
            ctx.drawImage(this.img, px, py, this.width, this.height);
        }
    }

/**
 * CirclePainter
 */
export class CirclePainter extends AnimationComponent {
        constructor(color, radius, position) {
            super();
            this.color = color;
            this.radius = radius;
            this.position = position;
        }
        
        init() {
            return this;
        }
        
        update(current) {
        }
        
        paint(ctx, px, py) {
            ctx.beginPath();
            ctx.arc(this.position.getX(), this.position.getY(), this.radius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
        }
    }

/**
 * FPSRenderer
 */
export class FPSRenderer extends AnimationComponent {
        constructor() {
            super();
            this.paints = 0;
            this.accumulatedDelay = 0;
            this.fps = 0;
            this.msec = 2000;
        }
        
        init() {
            return this;
        }
        
        update(current) {
        }
        
        paint(ctx) {
            this.paints++;
            const current = performance.now();
            const elapsed = current - this.lastUpdateTime;
            this.accumulatedDelay += elapsed;
            this.lastUpdateTime = current;
            if (this.accumulatedDelay >= this.msec) {
                this.fps = (this.paints / this.accumulatedDelay) * 1000;
                this.accumulatedDelay = 0;
                this.paints = 0;
            }
            ctx.font = '20pt Calibri';
            ctx.fillStyle = 'red';
            ctx.fillText(this.fps.toFixed(1)/*+"; "+elapsed.toFixed(2)*/, 50, 50);
        }
    }

// All classes are now exported as ES6 modules above
