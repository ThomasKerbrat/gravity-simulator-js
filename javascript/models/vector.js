
class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    angle() {
        return Math.atan2(this.y, this.x)
    }

    add(vector) {
        this.x += vector.x
        this.y += vector.y
    }

    static angle(vector1, vector2) {
        if (arguments.length === 1)
            return Math.atan2(vector1.y, vector1.x)
        else if (arguments.length === 2) {
            return Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x)
        }
    }

    static null() {
        return new Vector(0, 0)
    }
}
