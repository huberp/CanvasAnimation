/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
((PKG) => {

    PKG.Rectangle2D = (xmin, ymin, xmax, ymax) => {
        return { xmin, ymin, xmax, ymax };
    };

    PKG.Vector2D = (x, y) => {
        return { x, y };
    };
    PKG.Vector3D = (x, y, z) => {
        return { x, y, z };
    };

    PKG.NULL_VECTOR2D = PKG.Vector2D(0, 0);

    PKG.DIRECTION = {
        LEFT: {bit: 1, x: -1, y: 0},
        UP: {bit: 2, x: 0, y: -1},
        RIGHT: {bit: 4, x: +1, y: 0},
        DOWN: {bit: 8, x: 0, y: +1}
    };
    PKG.DIRECTION_ALL = [PKG.DIRECTION.LEFT, PKG.DIRECTION.UP, PKG.DIRECTION.RIGHT, PKG.DIRECTION.DOWN];
    
    PKG.SQ1_2 = Math.sqrt(0.5); //Use for unit vector which moves along x and y at same time
    
    PKG.UNIT_VECTORS_2D = [];
    for (let dir = 0; dir < 16; dir++) {
        let vecX = 0;
        let vecY = 0;
        //add up all directions for a direction bit-field
        for (let j = 0; j < 4; j++) {
            if ((dir & PKG.DIRECTION_ALL[j].bit) !== 0) {
                vecX = vecX + PKG.DIRECTION_ALL[j].x;
                vecY = vecY + PKG.DIRECTION_ALL[j].y;
            }
        }
        //now normalize length to 1, but only in case we have a vector that moves in two directions at same time
        //we know that the vector components are only -1, 0 or 1; thus normalization is simple
        //otherwise we would have to compute unit vector based on L2 norm.
        if ((vecX !== 0) && (vecY !== 0)) {
            vecX = (vecX < 0 ? -1 : 1) * PKG.SQ1_2;
            vecY = (vecY < 0 ? -1 : 1) * PKG.SQ1_2;
        }
        PKG.UNIT_VECTORS_2D.push(PKG.Vector2D(vecX, vecY));
    }
    for (let dir = 0; dir < 16; dir++) {
        console.log(PKG.UNIT_VECTORS_2D[dir]);
    }  
})(window.BASE = window.BASE || {});