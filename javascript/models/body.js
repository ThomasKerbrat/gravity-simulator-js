
class Body {
    constructor(position, speed, acceleration, mass) {
        this.position = position
        this.speed = speed
        this.acceleration = acceleration
        this._mass = mass
        this._radius = null
    }

    get radius() {
        return this._radius === null ? this.computeRadius() : this._radius
    }

    get mass() {
        return this._mass
    }

    set mass(value) {
        this._mass = value
        this.computeRadius()
    }

    computeRadius() {
        // Compute the radius for a sphere from volume = mass
        return this._radius = Math.pow(3 / 4 * this._mass / Math.PI, 1 / 3) / 1e4
        // log10
        // return this._radius = Math.log10(this._mass) / 2
        // return this._radius = 2
    }
}
