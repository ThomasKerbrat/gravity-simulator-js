
class QuadTree {

    constructor(origin, width) {
        this.origin = origin;
        this.width = width;
        this.nodes = null;
        this.child = null;
        this._totalMass = null;
        this._centerOfMass = null;
    }

    get totalMass() {
        if (this._totalMass != null) {
            return this._totalMass;
        }

        if (this.child == null && this.nodes == null) {
            this._totalMass = 0;
        } else if (this.child != null) {
            this._totalMass = this.child.mass;
        } else if (this.nodes != null) {
            this._totalMass = 0;
            for (const node of this.nodes) {
                this._totalMass += node.totalMass;
            }
        } else {
            throw new Error('body should not be null');
        }

        return this._totalMass;
    }

    get centerOfMass() {
        if (this.isEmpty) {
            return null;
        }

        if (this._centerOfMass != null) {
            return this._centerOfMass;
        }

        if (this.child != null) {
            this._centerOfMass = this.child.position;
        } else if (this.nodes != null) {
            const nodes = [];

            for (const node of this.nodes) {
                if (node.centerOfMass != null) {
                    nodes.push(node);
                }
            }

            let com_den = 0;
            for (const node of nodes) {
                com_den += node.totalMass;
            }

            let com_x_num = 0;
            for (const node of nodes) {
                com_x_num += (node.centerOfMass.x * node.totalMass);
            }

            let com_y_num = 0;
            for (const node of nodes) {
                com_y_num += (node.centerOfMass.y * node.totalMass);
            }

            this._centerOfMass = new Vector(com_x_num / com_den, com_y_num / com_den);
        } else {
            this._centerOfMass = null;
        }

        return this._centerOfMass;
    }

    get isEmpty() {
        return this.nodes == null && this.child == null;
    }

    /**
     * @param {*} child 
     * @param {*} enableCollisions 
     * @return {boolean} Returns if the child being added collided width a body already present in the tree.
     */
    add(child, enableCollisions) {
        // Pristine, set only and first child.
        if (this.isEmpty) {
            this.child = child;
            return null;
        }

        // Body already present, must divide.
        if (this.nodes == null && this.child != null) {

            // TODO: Verify if there is a collision.
            if (enableCollisions) {
                // const distanceX = Math.abs((child.position.x + child.radius) - (this.child.position.x + this.child.radius));
                // const distanceY = Math.abs((child.position.y + child.radius) - (this.child.position.y + this.child.radius));
                // if (distanceX < 0 || distanceY < 0) {
                // }
                const distance = Universe.distance(child.position, this.child.position);
                if (distance <= (child.radius + this.child.radius)) {
                    return this.child;
                }
            }

            const halfWidth = this.width / 2;
            this.nodes = [
                new QuadTree(new Vector(this.origin.x, this.origin.y), halfWidth),
                new QuadTree(new Vector(this.origin.x + halfWidth, this.origin.y), halfWidth),
                new QuadTree(new Vector(this.origin.x, this.origin.y + halfWidth), halfWidth),
                new QuadTree(new Vector(this.origin.x + halfWidth, this.origin.y + halfWidth), halfWidth),
            ];

            // Add current pending child, then the new one.
            const pendingChild = this.child;
            this.child = null;
            const result = this.add(pendingChild, enableCollisions);
            if (result != null) { debugger; }
            return this.add(child, enableCollisions);
        }

        // Internal node, must route.
        if (this.nodes != null && this.child == null) {
            for (const _children of this.nodes) {
                if (
                    child.position.x >= _children.origin.x && child.position.x < _children.origin.x + _children.width
                    && child.position.y >= _children.origin.y && child.position.y < _children.origin.y + _children.width
                ) {
                    return _children.add(child, enableCollisions);
                }
            }
        }
    }

    getVirtualBodies(body, theta, excludeBody) {
        if (this.child != null && this.nodes == null) {
            return [{
                position: this.child.position,
                mass: this.child.mass,
                distance: Universe.distance(this.child.position, body.position),
            }];
        }

        const virtualBodies = [];

        for (const child of this.nodes) {
            if (!(child.nodes == null && child.child == null) && child.child !== body && child.child !== excludeBody) {
                const distance = Universe.distance(child.centerOfMass, body.position);
                const localTheta = child.width / distance;

                if (localTheta >= theta) {
                    const bodies = child.getVirtualBodies(body, theta, excludeBody);
                    Array.prototype.push.apply(virtualBodies, bodies);
                } else {
                    virtualBodies.push({
                        position: child.centerOfMass,
                        mass: child.totalMass,
                        distance: distance,
                    });
                }
            }
        }

        return virtualBodies;
    }

}
