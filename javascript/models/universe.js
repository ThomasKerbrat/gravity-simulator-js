
class Universe {

    constructor({
        computationsPerSecond,
        gravitationalConstant,
        enableCollisions,
    }) {
        this._computationsPerSecond = computationsPerSecond;
        this._gravitationalConstant = gravitationalConstant;
        this._enableCollisions = enableCollisions;
        this.theta = 0.25;
        this.bodies = [];
        this.node = null;
    }

    tick() {
        if (this._enableCollisions) {
            Universe.resolveCollisions(this.bodies);
        }

        // const forces = Universe.computeForces(this.bodies, this._gravitationalConstant);
        const forces = this.computeForcesBarnesHut(this.bodies, this._gravitationalConstant, this.theta);
        Universe.shiftBodies(this.bodies, forces);
    }

    static shiftBodies(bodies, forces) {
        for (let index = 0; index < bodies.length; index++) {
            const body = bodies[index];

            body.acceleration.x = forces[index].x / body.mass
            body.acceleration.y = forces[index].y / body.mass

            body.speed.x += body.acceleration.x / calculationsPerSeconds
            body.speed.y += body.acceleration.y / calculationsPerSeconds

            body.position.x += body.speed.x / calculationsPerSeconds
            body.position.y += body.speed.y / calculationsPerSeconds
        }
    }

    static resolveCollisions(bodies) {
        const distances = Universe.computeDistances(bodies);

        for (let i = 0; i < bodies.length; i++) {
            const bodyA = bodies[i];
            for (let j = 0; j < bodies.length; j++) {
                const bodyB = bodies[j];
                if (i === j || bodyA === null || bodyB === null) { continue; }

                const distance = i < j ? distances[i][j] : distances[j][i];
                if (distance >= (bodyA.radius + bodyB.radius)) { continue; }

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
                bodies[j] = null;
            }
        }

        // Clean null bodies
        for (let index = 0; index < bodies.length; index++) {
            if (bodies[index] === null) {
                bodies.splice(index--, 1)
            }
        }
    }

    static computeDistances(bodies) {
        const distances = [];

        for (let i = 0; i < bodies.length; i++) {
            let a = bodies[i];
            distances[i] = [];
            for (let j = i + 1; j < bodies.length; j++) {
                let b = bodies[j];
                distances[i][j] = Universe.distance(a.position, b.position);
                if (Number.isNaN(distances[i][j])) {
                    debugger;
                }
            }
        }

        return distances;
    }

    static distance(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }

    static computeForces(bodies, G) {
        const distances = Universe.computeDistances(bodies);
        const forces = [];

        for (let index = 0; index < bodies.length; index++) {
            forces.push(Vector.null());
        }

        for (let i = 0; i < bodies.length; i++) {
            let bodyA = bodies[i];
            let forcesOnA = forces[i];
            for (let j = i + 1; j < bodies.length; j++) {
                let bodyB = bodies[j];
                let forcesOnB = forces[j];

                let angle;
                let distance = distances[i][j];
                let force = G * bodyA.mass * bodyB.mass / (distance * distance);

                // Sum force on a
                angle = Math.atan2(bodyB.position.y - bodyA.position.y, bodyB.position.x - bodyA.position.x);
                forcesOnA.x += Math.cos(angle) * force;
                forcesOnA.y += Math.sin(angle) * force;

                // Sum force on b
                angle = Math.atan2(bodyA.position.y - bodyB.position.y, bodyA.position.x - bodyB.position.x);
                forcesOnB.x += Math.cos(angle) * force;
                forcesOnB.y += Math.sin(angle) * force;
            }
        }

        return forces;
    }

    computeForcesBarnesHut(bodies, G, theta) {
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

        this.node = new QuadNode(new Vector(minX, minY), maxDelta);
        for (const body of bodies) {
            this.node.add(body);
        }

        const forces = [];
        for (const body of bodies) {
            forces.push(this.node.getForceFor(body, theta));
        }

        return forces;
    }

}
