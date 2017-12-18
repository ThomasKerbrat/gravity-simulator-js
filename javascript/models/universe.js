
class Universe {

    constructor({
        computationsPerSecond,
        gravitationalConstant,
        enableCollisions,
        theta,
    }) {
        this._computationsPerSecond = computationsPerSecond;
        this._gravitationalConstant = gravitationalConstant;
        this._enableCollisions = enableCollisions;
        this.theta = theta;

        this.bodies = [];
        this.tree = null;
        this.outwardBoundLimit = 2e3;
    }

    tick() {
        this.deleteOutOfBoundBodies(this.bodies, this.outwardBoundLimit);
        this.computeBarnesHutTree(this.bodies);
        const forces = this.computeBarnesHutForces({ bodies: this.bodies, G: this._gravitationalConstant, enableCollisions: this._enableCollisions });
        this.shiftBodies(this.bodies, forces);
    }

    deleteOutOfBoundBodies(bodies, outwardBoundLimit) {
        for (let index = 0; index < bodies.length; index++) {
            const body = bodies[index];
            if (Universe.distance(Vector.null(), body.position) > outwardBoundLimit) {
                bodies[index] = null;
                bodies.splice(index, 1);
                index = index - 1;
            }
        }
    }

    shiftBodies(bodies, forces) {
        for (let index = 0; index < bodies.length; index++) {
            const body = bodies[index];

            body.acceleration.x = forces[index].x / body.mass;
            body.acceleration.y = forces[index].y / body.mass;

            body.speed.x += body.acceleration.x / this._computationsPerSecond;
            body.speed.y += body.acceleration.y / this._computationsPerSecond;

            body.position.x += body.speed.x / this._computationsPerSecond;
            body.position.y += body.speed.y / this._computationsPerSecond;
        }
    }

    computeBarnesHutForces({ bodies, G, enableCollisions }) {
        const collisions = enableCollisions ? new Map() : null;
        for (const body of bodies) {
            const collidedBody = this.tree.add(body, enableCollisions);
            if (enableCollisions && collidedBody != null) {
                if (!collisions.has(collidedBody)) {
                    collisions.set(collidedBody, []);
                }
                collisions.get(collidedBody).push(body);
            }
        }

        if (enableCollisions && collisions.size > 0) {
            for (const [bodyA, collidedBodies] of collisions.entries()) {
                for (const bodyB of collidedBodies) {
                    // Weighted arithmetic mean, the heaviest body will proportionally conserve more of its properties.
                    bodyA.position.x =
                        (bodyA.position.x * bodyA.mass + bodyB.position.x * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);
                    bodyA.position.y =
                        (bodyA.position.y * bodyA.mass + bodyB.position.y * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);

                    bodyA.speed.x =
                        (bodyA.speed.x * bodyA.mass + bodyB.speed.x * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);
                    bodyA.speed.y =
                        (bodyA.speed.y * bodyA.mass + bodyB.speed.y * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);

                    bodyA.acceleration.x =
                        (bodyA.acceleration.x * bodyA.mass + bodyB.acceleration.x * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);
                    bodyA.acceleration.y =
                        (bodyA.acceleration.y * bodyA.mass + bodyB.acceleration.y * bodyB.mass) /
                        (bodyA.mass + bodyB.mass);

                    bodyA.mass += bodyB.mass;
                    bodies.splice(bodies.indexOf(bodyB), 1);
                }
            }
        }

        const forces = [];
        for (const body of bodies) {
            const forceOnBody = Vector.null();
            const virtualBodies = this.tree.getVirtualBodies(body, this.theta);

            for (const virtualBody of virtualBodies) {
                let distance = virtualBody.distance;
                let force = G * ((body.mass * virtualBody.mass) / (distance * distance));

                const angle = Math.atan2(virtualBody.position.y - body.position.y, virtualBody.position.x - body.position.x);
                forceOnBody.x += Math.cos(angle) * force;
                forceOnBody.y += Math.sin(angle) * force;
            }

            forces.push(forceOnBody);
        }

        return forces;
    }

    computeBarnesHutTree(bodies) {
        let minX = +Infinity;
        let maxX = -Infinity;
        let minY = +Infinity;
        let maxY = -Infinity;

        for (const body of bodies) {
            if (body.position.x < minX) { minX = body.position.x; }
            if (body.position.x > maxX) { maxX = body.position.x; }
            if (body.position.y < minY) { minY = body.position.y; }
            if (body.position.y > maxY) { maxY = body.position.y; }
        }

        const margin = 5e1;
        const deltaX = Math.abs(maxX - minX);
        const deltaY = Math.abs(maxY - minY);
        let maxDelta = Math.max(deltaX, deltaY);

        minX = Math.floor(minX - (maxDelta - deltaX) / 2) - 0.5 * margin;
        minY = Math.floor(minY - (maxDelta - deltaY) / 2) - 0.5 * margin;
        maxDelta = Math.ceil(Math.max(deltaX, deltaY)) + margin;

        this.tree = new QuadTree(new Vector(minX, minY), maxDelta);
    }

    getProjectedPath(body) {
        const path = [];
        const clone = body.clone();

        while (path.length < 500) {
            const forces = Vector.null();
            const virtualBodies = this.tree.getVirtualBodies(clone, this.theta, body);

            for (const virtualBody of virtualBodies) {
                let distance = virtualBody.distance;
                let force = G * ((clone.mass * virtualBody.mass) / (distance * distance));

                const angle = Math.atan2(virtualBody.position.y - clone.position.y, virtualBody.position.x - clone.position.x);
                forces.x += Math.cos(angle) * force;
                forces.y += Math.sin(angle) * force;
            }

            clone.acceleration.x = forces.x / clone.mass;
            clone.acceleration.y = forces.y / clone.mass;
            clone.speed.x += clone.acceleration.x / this._computationsPerSecond;
            clone.speed.y += clone.acceleration.y / this._computationsPerSecond;
            clone.position.x += clone.speed.x / this._computationsPerSecond;
            clone.position.y += clone.speed.y / this._computationsPerSecond;

            path.push(clone.position.clone());
        }

        return path;
    }

    static distance(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }

}
