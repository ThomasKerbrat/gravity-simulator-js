
class QuadNode {

    constructor(origin, width) {
        this.origin = origin;
        this.width = width;
        this.children = null;
        this.child = null;
        this._totalMass = null;
        this._centerOfMass = null;
    }

    get totalMass() {
        if (this._totalMass != null) {
            return this._totalMass;
        }

        if (this.child == null && this.children == null) {
            this._totalMass = 0;
        } else if (this.child != null) {
            this._totalMass = this.child.mass;
        } else if (this.children != null) {
            this._totalMass = 0;
            for (const node of this.children) {
                this._totalMass += node.totalMass;
            }
        } else {
            throw new Error('body should not be null');
        }

        return this._totalMass;
    }

    get centerOfMass() {
        if (this._centerOfMass != null) {
            return this._centerOfMass;
        }

        if (this.child != null) {
            this._centerOfMass = this.child.position;
        } else if (this.children != null) {
            const nodes = [];

            for (const node of this.children) {
                if (node.centerOfMass != null) {
                    nodes.push(node);
                }
            }

            const com_den = nodes.reduce((sum, node) => sum += node.totalMass, 0);
            const com_x_num = nodes.map(node => node.centerOfMass.x * node.totalMass).reduce((sum, node) => sum += node, 0);
            const com_y_num = nodes.map(node => node.centerOfMass.y * node.totalMass).reduce((sum, node) => sum += node, 0);

            if (isNaN(com_den) || isNaN(com_x_num) || isNaN(com_y_num)) {
                debugger;
            }

            this._centerOfMass = new Vector(com_x_num / com_den, com_y_num / com_den);
        } else {
            this._centerOfMass = null;
        }

        return this._centerOfMass;
    }

    get isEmpty() {
        return this.children == null && this.child == null;
    }

    add(child) {
        // Pristine, set only and first child.
        if (this.isEmpty) {
            this.child = child;
            return;
        }

        // Body already present, must divide.
        if (this.children == null && this.child != null) {
            const halfWidth = this.width / 2;

            this.children = [
                new QuadNode(new Vector(this.origin.x, this.origin.y), halfWidth),
                new QuadNode(new Vector(this.origin.x + halfWidth, this.origin.y), halfWidth),
                new QuadNode(new Vector(this.origin.x, this.origin.y + halfWidth), halfWidth),
                new QuadNode(new Vector(this.origin.x + halfWidth, this.origin.y + halfWidth), halfWidth),
            ];

            // Add current pending child, then the new one.
            const pendingChild = this.child;
            this.child = null;
            this.add(pendingChild);
            return this.add(child);
        }

        // Internal node, must route.
        if (this.children != null && this.child == null) {
            for (const _children of this.children) {
                if (
                    child.position.x >= _children.origin.x && child.position.x < _children.origin.x + _children.width
                    && child.position.y >= _children.origin.y && child.position.y < _children.origin.y + _children.width
                ) {
                    _children.add(child);
                    return;
                }
            }
            // debugger;
        }
    }

    getForceFor(body, theta) {
        const forceOnBody = Vector.null();
        const virtualBodies = this._getVirtualBodies(body, theta);

        for (const virtualBody of virtualBodies) {
            let angle;
            let distance = virtualBody.distance;
            let force = G * body.mass * virtualBody.mass / (distance * distance);

            angle = Math.atan2(virtualBody.position.y - body.position.y, virtualBody.position.x - body.position.x);
            forceOnBody.x += Math.cos(angle) * force;
            forceOnBody.y += Math.sin(angle) * force;
        }

        return forceOnBody;
    }

    _getVirtualBodies(body, theta) {
        if (this.child != null && this.children == null) {
            return [{
                position: this.child.position,
                mass: this.child.mass,
                distance: Universe.distance(this.child.position, body.position),
            }];
        }

        const virtualBodies = [];

        for (const child of this.children) {
            if (child.isEmpty) { continue; }
            if (child.child === body) { continue; }

            const distance = Universe.distance(child.centerOfMass, body.position);
            const localTheta = child.width / distance;

            if (localTheta >= theta) {
                const bodies = child._getVirtualBodies(body, theta);
                Array.prototype.push.apply(virtualBodies, bodies);
            } else {
                virtualBodies.push({
                    position: child.centerOfMass,
                    mass: child.totalMass,
                    distance: distance,
                });
            }
        }

        return virtualBodies;
    }

}
