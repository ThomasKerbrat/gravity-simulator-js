
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
        this.m = this.mass = mass
    }

    get radius() {
        return Math.sqrt(this.mass / Math.PI) / 1e3
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



// Events handlers

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

for (let index = 0; index < 500; index++) {
    bodies.push(new Body(
        new Vector(randomInt(0, playground.width), randomInt(0, playground.height)),
        Vector.null(),
        Vector.null(),
        1e6,
    ))
}

bodies.push(new Body(
    new Vector(playground.width / 2, playground.height / 2),
    Vector.null(),
    Vector.null(),
    1e7,
))



// Computations

setInterval(function computeForces() {
    // Collisions
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        for (let j = 0; j < bodies.length; j++) {
            const bodyB = bodies[j]
            if (i !== j) {
                const distance = Math.sqrt(Math.pow(bodyB.p.x - bodyA.p.x, 2) + Math.pow(bodyB.p.y - bodyA.p.y, 2))
                if (distance < (bodyA.radius + bodyB.radius)) {
                    bodyA.p.x = (bodyA.p.x * bodyA.mass + bodyB.p.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.p.y = (bodyA.p.y * bodyA.mass + bodyB.p.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.s.x = (bodyA.s.x * bodyA.mass + bodyB.s.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.s.y = (bodyA.s.y * bodyA.mass + bodyB.s.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.a.x = (bodyA.a.x * bodyA.mass + bodyB.a.x * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.a.y = (bodyA.a.y * bodyA.mass + bodyB.a.y * bodyB.mass) / (bodyA.mass + bodyB.mass)
                    bodyA.mass += bodyB.mass
                    bodies.splice(j, 1)
                    j -= 1
                }
            }
        }
    }

    // Force computation
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        bodyA.a.x = 0
        bodyA.a.y = 0

        for (let j = 0; j < bodies.length; j++) {
            if (i !== j) {
                const bodyB = bodies[j]
                const distance = Math.sqrt(Math.pow(bodyB.p.x - bodyA.p.x, 2) + Math.pow(bodyB.p.y - bodyA.p.y, 2))
                const force = G * bodyA.mass * bodyB.mass / Math.pow(distance, 2)
                const angle = Math.atan2(bodyB.p.y - bodyA.p.y, bodyB.p.x - bodyA.p.x)
                const a_x = Math.cos(angle) * force
                const a_y = Math.sin(angle) * force
                bodyA.a.x += a_x
                bodyA.a.y += a_y
            }
        }
    }

    // Bodies shifting
    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i]
        body.s.x += body.a.x / calculationsPerSeconds
        body.s.y += body.a.y / calculationsPerSeconds
        body.p.x += body.s.x / calculationsPerSeconds
        body.p.y += body.s.y / calculationsPerSeconds
        // if (body.p.x < 0) body.p.x += playground.width, resetVelocity(body)
        // if (body.p.x >= playground.width) body.p.x -= playground.width, resetVelocity(body)
        // if (body.p.y < 0) body.p.y += playground.height, resetVelocity(body)
        // if (body.p.y >= playground.height) body.p.y -= playground.height, resetVelocity(body)
    }

    function resetVelocity(body) {
        body.s.x = 0
        body.s.y = 0
    }
}, 1000 / calculationsPerSeconds)



requestAnimationFrame(render)

function render() {
    requestAnimationFrame(render)

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, playground.width, playground.height)

    for (let body, width, index = 0; index < bodies.length; index++) {
        body = bodies[index]
        width = body.radius

        // body
        ctx.beginPath()
        ctx.arc(body.p.x + userTranslation.x, body.p.y + userTranslation.y, width, 0, 2 * Math.PI)
        ctx.fillStyle = 'white'
        ctx.fill()
        ctx.closePath()

        // speed vector
        ctx.strokeStyle = 'red'
        ctx.beginPath()
        ctx.moveTo((body.p.x) + userTranslation.x, (body.p.y) + userTranslation.y)
        ctx.lineTo((body.p.x + body.s.x * 1e0) + userTranslation.x, (body.p.y + body.s.y * 1e0) + userTranslation.y)
        ctx.stroke()
        ctx.closePath()

        // acceleration vector
        ctx.strokeStyle = 'green'
        ctx.beginPath()
        ctx.moveTo((body.p.x) + userTranslation.x, (body.p.y) + userTranslation.y)
        ctx.lineTo((body.p.x + body.a.x * 1e0) + userTranslation.x, (body.p.y + body.a.y * 1e0) + userTranslation.y)
        ctx.stroke()
        ctx.closePath()
    }

    const weighted_mean_x_num = bodies.map(body => body.p.x * body.mass).reduce((sum, body) => sum + body, 0)
    const weighted_mean_x_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
    const weighted_mean_x = weighted_mean_x_num / weighted_mean_x_den

    const weighted_mean_y_num = bodies.map(body => body.p.y * body.mass).reduce((sum, body) => sum + body, 0)
    const weighted_mean_y_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
    const weighted_mean_y = weighted_mean_y_num / weighted_mean_y_den

    ctx.strokeStyle = 'blue'
    ctx.beginPath()
    ctx.moveTo(weighted_mean_x + userTranslation.x, weighted_mean_y - 10 + userTranslation.y)
    ctx.lineTo(weighted_mean_x + userTranslation.x, weighted_mean_y + 10 + userTranslation.y)
    ctx.stroke()
    ctx.closePath()

    ctx.beginPath()
    ctx.moveTo(weighted_mean_x - 10 + userTranslation.x, weighted_mean_y + userTranslation.y)
    ctx.lineTo(weighted_mean_x + 10 + userTranslation.x, weighted_mean_y + userTranslation.y)
    ctx.stroke()
    ctx.closePath()
}
