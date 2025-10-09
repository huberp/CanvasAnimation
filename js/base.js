/* 
 * Base utilities module - ES6 version
 */

export const Rectangle2D = (xmin, ymin, xmax, ymax) => {
    return { xmin, ymin, xmax, ymax };
};

export const Vector2D = (x, y) => {
    return { x, y };
};

export const Vector3D = (x, y, z) => {
    return { x, y, z };
};

export const DIRECTION = {
    LEFT: {bit: 1, x: -1, y: 0},
    UP: {bit: 2, x: 0, y: -1},
    RIGHT: {bit: 4, x: +1, y: 0},
    DOWN: {bit: 8, x: 0, y: +1}
};

export const DIRECTION_ALL = [DIRECTION.LEFT, DIRECTION.UP, DIRECTION.RIGHT, DIRECTION.DOWN];

export const SQ1_2 = Math.sqrt(0.5); //Use for unit vector which moves along x and y at same time

export const NULL_VECTOR2D = Vector2D(0, 0);

// Build UNIT_VECTORS_2D array
const buildUnitVectors = () => {
    const vectors = [];
    for (let dir = 0; dir < 16; dir++) {
        let vecX = 0;
        let vecY = 0;
        //add up all directions for a direction bit-field
        for (let j = 0; j < 4; j++) {
            if ((dir & DIRECTION_ALL[j].bit) !== 0) {
                vecX = vecX + DIRECTION_ALL[j].x;
                vecY = vecY + DIRECTION_ALL[j].y;
            }
        }
        //now normalize length to 1, but only in case we have a vector that moves in two directions at same time
        //we know that the vector components are only -1, 0 or 1; thus normalization is simple
        //otherwise we would have to compute unit vector based on L2 norm.
        if ((vecX !== 0) && (vecY !== 0)) {
            vecX = (vecX < 0 ? -1 : 1) * SQ1_2;
            vecY = (vecY < 0 ? -1 : 1) * SQ1_2;
        }
        vectors.push(Vector2D(vecX, vecY));
    }
    return vectors;
};

export const UNIT_VECTORS_2D = buildUnitVectors();

// Log unit vectors for debugging
for (let dir = 0; dir < 16; dir++) {
    console.log(UNIT_VECTORS_2D[dir]);
}