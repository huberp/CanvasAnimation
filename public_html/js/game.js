/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function (PKG, undefined) {
    
    PKG.KeyboardControl = function (leftKey, upKey, rightKey, downKey) {
        this.pressedKeysBitField = 0;
        this.leftKey = leftKey;
        this.rightKey = rightKey;
        this.upKey = upKey;
        this.downKey = downKey;
        this.onObject = null;
        this.changeCallback = null;
        this.self = this;
    };
    PKG.KeyboardControl.is = function (value, direction) {
        return value & direction !== 0;
    };
    PKG.KeyboardControl.prototype.activate = function (onObject, changeCallback) {
        var self = this.self;
        var func = function (e) {
            self.handleKeyPress(e);
        };
        onObject.addEventListener('keypress', func);
        onObject.addEventListener('keyup', func);
        this.onObject = onObject;
        this.changeCallback = changeCallback;
    };
    //
    //bit field operator for pressing a key
    var press = function (old, keyValue) {
        return old | keyValue.bit;
    };
    //bit field operator for releaseing a key
    var up = function (old, keyValue) {
        return old ^ keyValue.bit;
    };
    PKG.KeyboardControl.prototype.handleKeyPress = function (e) {
        var oldfield = this.pressedKeysBitField;
        var code = e.keyCode;
        //select the bit field operator according to event type
        var funct = press; 
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
        if(this.changeCallback && oldfield !== this.pressedKeysBitField) {
            this.changeCallback(oldfield, this.pressedKeysBitField);
        }
    };
})(window.GAME = window.GAME || {});