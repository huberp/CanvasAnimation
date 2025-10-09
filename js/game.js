/* 
 * Game module - ES6 version
 */
import * as BASE from './base.js';

//bit field operator for pressing a key
const press = (old, keyValue) => {
    return old | keyValue.bit;
};
//bit field operator for releaseing a key
const up = (old, keyValue) => {
    return old & ~keyValue.bit;
};

export class KeyboardControl {
        constructor(leftKey, upKey, rightKey, downKey) {
            this.pressedKeysBitField = 0;
            this.leftKey = leftKey;
            this.rightKey = rightKey;
            this.upKey = upKey;
            this.downKey = downKey;
            this.onObject = null;
            this.changeCallback = null;
            this.self = this;
        }
        
        static is(value, direction) {
            return (value & direction.bit) !== 0;
        }
        
        activate(onObject, changeCallback) {
            const self = this.self;
            const func = (e) => {
                self.handleKeyPress(e);
            };
            onObject.addEventListener('keydown', func);
            onObject.addEventListener('keyup', func);
            this.onObject = onObject;
            this.changeCallback = changeCallback;
        }
        
        handleKeyPress(e) {
            const oldfield = this.pressedKeysBitField;
            const code = e.keyCode;
            //select the bit field operator according to event type
            let funct = press; 
            if (e.type === "keyup") {
                funct = up;
            }
            switch (code) {
                case this.leftKey:
                    //alert("Left");
                    this.pressedKeysBitField = funct(this.pressedKeysBitField, BASE.DIRECTION.LEFT);
                    break; //Left key
                case this.upKey:
                    //alert("Up");
                    this.pressedKeysBitField = funct(this.pressedKeysBitField, BASE.DIRECTION.UP);
                    break; //Up key
                case this.rightKey:
                    //alert("Right");
                    this.pressedKeysBitField = funct(this.pressedKeysBitField, BASE.DIRECTION.RIGHT);
                    break; //Right key
                case this.downKey:
                    //alert("Down");
                    this.pressedKeysBitField = funct(this.pressedKeysBitField, BASE.DIRECTION.DOWN);
                    break; //Down key
                default:
                    //alert(code); //Everything else
            }
            if (this.changeCallback && oldfield !== this.pressedKeysBitField) {
                this.changeCallback(oldfield, this.pressedKeysBitField);
            }
        }
    }

export class TouchControl {
        constructor(trackElement, thumbElement) {
            this.trackElement = trackElement;
            this.thumbElement = thumbElement;
            this.isActive = false;
            this.currentPosition = 0.5; // 0 = left, 0.5 = center, 1 = right
            this.changeCallback = null;
            this.currentDirection = 0; // bitfield for current direction
        }

        activate(changeCallback) {
            this.changeCallback = changeCallback;
            const self = this;

            // Touch events
            this.trackElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                self.handleTouchStart(e);
            });

            this.trackElement.addEventListener('touchmove', (e) => {
                e.preventDefault();
                self.handleTouchMove(e);
            });

            this.trackElement.addEventListener('touchend', (e) => {
                e.preventDefault();
                self.handleTouchEnd(e);
            });

            // Mouse events for desktop testing
            this.trackElement.addEventListener('mousedown', (e) => {
                e.preventDefault();
                self.handleTouchStart(e);
            });

            document.addEventListener('mousemove', (e) => {
                if (self.isActive) {
                    e.preventDefault();
                    self.handleTouchMove(e);
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (self.isActive) {
                    e.preventDefault();
                    self.handleTouchEnd(e);
                }
            });
        }

        handleTouchStart(e) {
            this.isActive = true;
            this.thumbElement.classList.add('active');
            this.updatePosition(e);
        }

        handleTouchMove(e) {
            if (this.isActive) {
                this.updatePosition(e);
            }
        }

        handleTouchEnd(e) {
            this.isActive = false;
            this.thumbElement.classList.remove('active');
            // Return to center
            this.currentPosition = 0.5;
            this.updateThumbPosition();
            this.updateDirection();
        }

        updatePosition(e) {
            const rect = this.trackElement.getBoundingClientRect();
            let clientX;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
            } else {
                clientX = e.clientX;
            }

            // Calculate position relative to track (0 to 1)
            let relativeX = (clientX - rect.left) / rect.width;
            relativeX = Math.max(0, Math.min(1, relativeX)); // Clamp between 0 and 1

            this.currentPosition = relativeX;
            this.updateThumbPosition();
            this.updateDirection();
        }

        updateThumbPosition() {
            // Position thumb along the track
            const percentage = this.currentPosition * 100;
            this.thumbElement.style.left = percentage + '%';
        }

        updateDirection() {
            const oldDirection = this.currentDirection;
            let newDirection = 0;

            // Define dead zone in the center (45% to 55%)
            const deadZoneMin = 0.45;
            const deadZoneMax = 0.55;

            if (this.currentPosition < deadZoneMin) {
                // Left
                newDirection = BASE.DIRECTION.LEFT.bit;
            } else if (this.currentPosition > deadZoneMax) {
                // Right
                newDirection = BASE.DIRECTION.RIGHT.bit;
            } else {
                // Center - no movement
                newDirection = 0;
            }

            if (newDirection !== oldDirection) {
                this.currentDirection = newDirection;
                if (this.changeCallback) {
                    this.changeCallback(oldDirection, newDirection);
                }
            }
        }
    }