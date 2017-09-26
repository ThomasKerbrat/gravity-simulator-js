
/**
 * TODO:
 * - Fixed body position
 * - Camera zoom
 * - Camera follow
 */

// Classes

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

class Body {
    constructor(position, speed, acceleration, mass) {
        this.p = this.position = position
        this.s = this.speed = speed
        this.a = this.acceleration = acceleration
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
        return this._radius = Math.pow(3 / 4 * this._mass / Math.PI, 1 / 3) / (1 * 1e3)
        // log10
        // return this._radius = Math.log10(this._mass) / 2
        // return this._radius = 2
    }
}



// Global variables

const canvasElement = document.getElementById('canvas')
const ctx = canvasElement.getContext('2d')

const G = 6.674e-11
const calculationsPerSeconds = 25

const playground = {
    width: 1200,
    height: 700,
}

let isMoving = false
let mouseMoveOrigin = null
let userTranslation = { x: 0, y: 0 }

ctx.translate(0.5, 0.5)



// Event handlers

canvasElement.addEventListener('mousedown', function (event) {
    isMoving = true
    mouseMoveOrigin = {
        x: event.clientX - userTranslation.x,
        y: event.clientY - userTranslation.y,
    }
})

canvasElement.addEventListener('mousemove', function (event) {
    if (isMoving) {
        userTranslation.x = event.clientX - mouseMoveOrigin.x
        userTranslation.y = event.clientY - mouseMoveOrigin.y
    }
})

canvasElement.addEventListener('mouseup', function (event) {
    isMoving = false
})

canvasElement.addEventListener('dblclick', function (event) {
    userTranslation.x = 0
    userTranslation.y = 0
})

// TODO: Implement
document.addEventListener('keypress', function (evnet) {
    console.info(event)
})



// Initialization

function randomInt(minOrMax, max) {
    const number = Math.random()
    if (arguments.length === 1) {
        const max = minOrMax
        return Math.floor(number * max)
    } else if (arguments.length === 2) {
        const min = minOrMax
        return Math.floor(number * (max - min)) + min
    }
}

const bodies = []

// SEED: Random full screen
for (let index = 0; index < 1000; index++) {
    bodies.push(new Body(
        new Vector(
            randomInt(0 / 4 * playground.width, 4 / 4 * playground.width),
            randomInt(0 / 4 * playground.height, 4 / 4 * playground.height),
        ),
        Vector.null(),
        Vector.null(),
        randomInt(1e8, 1e9),
    ))
}

// SEED: Accretion disk
// const radius = 300
// for (let tetha, distance, index = 0; index < 500; index++) {
//     tetha = Math.random() * 2 * Math.PI
//     distance = Math.random()
//     bodies.push(new Body(
//         new Vector(
//             Math.cos(tetha) * distance * radius + playground.width / 2,
//             Math.sin(tetha) * distance * radius + playground.height / 2,
//         ),
//         new Vector(
//             Math.cos(tetha - 1 / 2 * Math.PI) * 2 * 1e1,
//             Math.sin(tetha - 1 / 2 * Math.PI) * 2 * 1e1,
//         ),
//         Vector.null(),
//         (1 - distance) * (2 * 1e9 - 2 * 1e2) + 2 * 1e2,
//     ))
// }

// SEED: Two-body system
// bodies.push(new Body(
//     new Vector(playground.width / 2, playground.height / 2),
//     Vector.null(),
//     Vector.null(),
//     1e10,
// ))
// bodies.push(new Body(
//     new Vector(playground.width * 11 / 16, playground.height / 2),
//     new Vector(0, -10),
//     Vector.null(),
//     1e7,
// ))

// SEED: Planet rings
// bodies.push(new Body(
//     new Vector(playground.width / 2, playground.height / 2),
//     Vector.null(),
//     Vector.null(),
//     1e12,
// ))
// const dMax = 300, dMin = 100, mMax = 2 * 1e8, mMin = 2 * 1e7
// for (let tetha, distance, index = 0; index < 999; index++) {
//     tetha = Math.random() * 2 * Math.PI
//     distance = Math.random() * (dMax - dMin) + dMin
//     bodies.push(new Body(
//         new Vector(
//             Math.cos(tetha) * distance + playground.width / 2,
//             Math.sin(tetha) * distance + playground.height / 2,
//         ),
//         new Vector(
//             Math.cos(tetha - 1 / 2 * Math.PI) * (2 * 1e2),
//             Math.sin(tetha - 1 / 2 * Math.PI) * (2 * 1e2),
//         ),
//         Vector.null(),
//         (mMax - mMin) + mMin,
//     ))
// }



// Computations

setInterval(function tick() {
    let distances

    // Collisions
    distances = computeDistances(bodies)
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        for (let j = 0; j < bodies.length; j++) {
            const bodyB = bodies[j]
            if (i !== j && bodyA !== null && bodyB !== null) {
                const distance = i < j ? distances[j][i] : distances[i][j]
                if (distance < (bodyA.radius + bodyB.radius)) {
                    // Weighted arithmetic mean, the heaviest body will proportionally conserve more of its properties.
                    bodyA.p.x = (bodyA.p.x * bodyA.mass + bodyB.p.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.p.y = (bodyA.p.y * bodyA.mass + bodyB.p.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.s.x = (bodyA.s.x * bodyA.mass + bodyB.s.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.s.y = (bodyA.s.y * bodyA.mass + bodyB.s.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.a.x = (bodyA.a.x * bodyA.mass + bodyB.a.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.a.y = (bodyA.a.y * bodyA.mass + bodyB.a.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.mass += bodyB.mass
                    bodies[j] = null
                }
            }
        }
    }

    // Clean null bodies
    for (let index = 0; index < bodies.length; index++) {
        if (bodies[index] === null) {
            bodies.splice(index--, 1)
        }
    }

    // Initialize null vectors for the sum of the forces
    let forces = []
    for (let index = 0; index < bodies.length; index++) {
        // bodies[index].acceleration.x = 0
        // bodies[index].acceleration.y = 0
        forces.push(Vector.null())
    }

    distances = computeDistances(bodies)

    // Force computation
    for (let bodyA, forcesOnA, i = 1; i < bodies.length; i++) {
        bodyA = bodies[i]
        forcesOnA = forces[i]
        for (let bodyB, forcesOnB, j = 0; j <= i - 1; j++) {
            bodyB = bodies[j]
            forcesOnB = forces[j]

            let angle
            let distance = distances[i][j]
            let force = G * bodyA.mass * bodyB.mass / distance * distance

            // Sum force on a
            angle = Math.atan2(bodyB.position.y - bodyA.position.y, bodyB.position.x - bodyA.position.x)
            forcesOnA.x += Math.cos(angle) * force
            forcesOnA.y += Math.sin(angle) * force

            // Sum force on b
            angle = Math.atan2(bodyA.position.y - bodyB.position.y, bodyA.position.x - bodyB.position.x)
            forcesOnB.x += Math.cos(angle) * force
            forcesOnB.y += Math.sin(angle) * force
        }
    }

    // Bodies shifting
    for (let index = 0; index < bodies.length; index++) {
        const body = bodies[index]

        body.acceleration.x = forces[index].x / body.mass
        body.acceleration.y = forces[index].y / body.mass

        body.speed.x += body.acceleration.x / calculationsPerSeconds
        body.speed.y += body.acceleration.y / calculationsPerSeconds

        body.position.x += body.speed.x / calculationsPerSeconds
        body.position.y += body.speed.y / calculationsPerSeconds
    }
}, 1000 / calculationsPerSeconds)

function computeDistances(bodies) {
    const distances = {}
    for (let a, i = 1; i < bodies.length; i++) {
        a = bodies[i]
        distances[i] = {}
        for (let b, j = 0; j <= i - 1; j++) {
            b = bodies[j]
            distances[i][j] = Math.sqrt(
                Math.pow(b.p.x - a.p.x, 2) + Math.pow(b.p.y - a.p.y, 2)
            )
        }
    }
    return distances
}



requestAnimationFrame(render)
let lastRenderTime = Date.now()
let lastDisplay = { time: Date.now(), value: 0 }

function render() {
    requestAnimationFrame(render)

    // Clean
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, playground.width, playground.height)

    // Bodies
    for (let body, width, index = 0; index < bodies.length; index++) {
        body = bodies[index]
        width = body.radius

        // body
        ctx.beginPath()
        ctx.arc(body.p.x + userTranslation.x, body.p.y + userTranslation.y, width, 0, 2 * Math.PI)
        ctx.fillStyle = 'white'
        // ctx.fillStyle = 'rgb(255, ' + (1 / body.mass * 255) + ', ' + (1 / body.mass * 255) + ' + '
        ctx.fill()
        ctx.closePath()

        // // speed vector
        // ctx.strokeStyle = 'red'
        // ctx.beginPath()
        // ctx.moveTo((body.p.x) + userTranslation.x, (body.p.y) + userTranslation.y)
        // ctx.lineTo((body.p.x + body.s.x * 1e0) + userTranslation.x, (body.p.y + body.s.y * 1e0) + userTranslation.y)
        // ctx.stroke()
        // ctx.closePath()

        // // acceleration vector
        // ctx.strokeStyle = 'green'
        // ctx.beginPath()
        // ctx.moveTo((body.p.x) + userTranslation.x, (body.p.y) + userTranslation.y)
        // ctx.lineTo((body.p.x + body.a.x * 1e0) + userTranslation.x, (body.p.y + body.a.y * 1e0) + userTranslation.y)
        // ctx.stroke()
        // ctx.closePath()
    }

    // Compute barycenter
    // const barycenter_x_num = bodies.map(body => body.p.x * body.mass).reduce((sum, body) => sum + body, 0)
    // const barycenter_x_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
    // const barycenter_x = barycenter_x_num / barycenter_x_den

    // const barycenter_y_num = bodies.map(body => body.p.y * body.mass).reduce((sum, body) => sum + body, 0)
    // const barycenter_y_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
    // const barycenter_y = barycenter_y_num / barycenter_y_den

    // ctx.strokeStyle = 'blue'
    // ctx.beginPath()
    // ctx.moveTo(barycenter_x + userTranslation.x, barycenter_y - 10 + userTranslation.y)
    // ctx.lineTo(barycenter_x + userTranslation.x, barycenter_y + 10 + userTranslation.y)
    // ctx.stroke()
    // ctx.closePath()

    // ctx.beginPath()
    // ctx.moveTo(barycenter_x - 10 + userTranslation.x, barycenter_y + userTranslation.y)
    // ctx.lineTo(barycenter_x + 10 + userTranslation.x, barycenter_y + userTranslation.y)
    // ctx.stroke()
    // ctx.closePath()

    // FPS
    if (Date.now() - lastDisplay.time > 1000) {
        lastDisplay.time = Date.now()
        lastDisplay.value = Math.floor(1000 / (Date.now() - lastRenderTime))
    }
    lastRenderTime = Date.now()

    ctx.font = '16px Arial'
    ctx.fillStyle = 'rgba(255, 0, 0, 1)'
    ctx.fillText('' + lastDisplay.value + ' FPS', 5, 21)
    ctx.fillText('' + bodies.length + ' Bodies', 5, 42)
}
