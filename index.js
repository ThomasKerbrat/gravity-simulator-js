
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
        // return this._radius = Math.pow(3 / 4 * this._mass / Math.PI, 1 / 3) / 1e1
        // log10
        return Math.log10(this._mass) / 2
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

// Random full screen
// for (let index = 0; index < 500; index++) {
//     bodies.push(new Body(
//         new Vector(randomInt(0, playground.width), randomInt(0, playground.height)),
//         Vector.null(),
//         Vector.null(),
//         1e6,
//     ))
// }

// Accretion disk
const radius = 300
for (let tetha, distance, index = 0; index < 500; index++) {
    tetha = Math.random() * 2 * Math.PI
    distance = Math.random()
    bodies.push(new Body(
        new Vector(
            Math.cos(tetha) * distance * radius + playground.width / 2,
            Math.sin(tetha) * distance * radius + playground.height / 2,
        ),
        new Vector(
            Math.cos(tetha - 1 / 2 * Math.PI) * 0,
            Math.sin(tetha - 1 / 2 * Math.PI) * 0,
        ),
        Vector.null(),
        (1 - distance) * 1e6,
    ))
}



// Computations

setInterval(function computeForces() {
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
        } else {
            continue
        }
    }

    // Force computation
    distances = computeDistances(bodies)
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        bodyA.a.x = 0
        bodyA.a.y = 0

        for (let j = 0; j < bodies.length; j++) {
            if (i !== j) {
                const bodyB = bodies[j]
                const distance = i < j ? distances[j][i] : distances[i][j]
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
        // if (body.p.x < 0) body.p.x += playground.width // , resetSpeed(body)
        // if (body.p.x >= playground.width) body.p.x -= playground.width // , resetSpeed(body)
        // if (body.p.y < 0) body.p.y += playground.height // , resetSpeed(body)
        // if (body.p.y >= playground.height) body.p.y -= playground.height // , resetSpeed(body)
    }

    function resetSpeed(body) {
        body.s.x = 0
        body.s.y = 0
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
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.fillText('' + lastDisplay.value + ' FPS', 5, 21)
    ctx.fillText('' + bodies.length + ' Bodies', 5, 42)
}
