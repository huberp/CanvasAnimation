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
    return old ^ keyValue.bit;
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
            return value & direction !== 0;
        }
        
        activate(onObject, changeCallback) {
            const self = this.self;
            const func = (e) => {
                self.handleKeyPress(e);
            };
            onObject.addEventListener('keypress', func);
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