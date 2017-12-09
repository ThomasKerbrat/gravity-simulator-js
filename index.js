
/**
 * TODO:
 * - Camera zoom
 * - Camera follow
 * - Separation computation/replay
 */

// #region Classes

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
        return this._radius = Math.pow(3 / 4 * this._mass / Math.PI, 1 / 3) / (1 * 1e4)
        // log10
        // return this._radius = Math.log10(this._mass) / 2
        // return this._radius = 2
    }
}

// #endregion Classes



// #region Global variables

const canvasElement = document.getElementById('canvas')
const ctx = canvasElement.getContext('2d')

const G = 6.674e-11
const calculationsPerSeconds = 30

const playground = {
    width: 1100,
    height: 700,
}

let isMoving = false
let mouseMoveOrigin = null
let cameraTranslation = {
    x: 0,
    y: 0,
    zoom: 1,
}

const config = {
    simulation: {
        collisions: true,
    },
    graphics: {
        velocity: false,
        acceleration: false,
        barycenter: false,
        intervalID: null,
    }
}

ctx.translate(0.5, 0.5)

// #endregion Global variables



// #region Event handlers

document.getElementById('button-start').addEventListener('click', buttonStartEventHandler)
document.getElementById('button-pause').addEventListener('click', buttonPauseEventHandler)
document.getElementById('button-step').addEventListener('click', buttonStepEventHandler)
document.getElementById('button-clear').addEventListener('click', buttonClearEventHandler)

function buttonStartEventHandler(event) {
    if (config.graphics.intervalID == null) {
        config.graphics.intervalID = setInterval(tick, 1000 / calculationsPerSeconds)
    }
}

function buttonPauseEventHandler(event) {
    clearInterval(config.graphics.intervalID)
    config.graphics.intervalID = null
}

function buttonStepEventHandler(event) {
    tick()
}

function buttonClearEventHandler(event) {
    buttonPauseEventHandler()
    bodies = []
}

canvasElement.addEventListener('mousedown', function (event) {
    isMoving = true
    mouseMoveOrigin = {
        x: event.clientX - cameraTranslation.x,
        y: event.clientY - cameraTranslation.y,
    }
})

canvasElement.addEventListener('mousemove', function (event) {
    if (isMoving) {
        cameraTranslation.x = event.clientX - mouseMoveOrigin.x
        cameraTranslation.y = event.clientY - mouseMoveOrigin.y
    }
})

canvasElement.addEventListener('mouseup', function (event) {
    isMoving = false
})

document.addEventListener('keydown', function (event) {
    // event.preventDefault()
})

canvasElement.addEventListener('dblclick', function (event) {
    cameraTranslation.x = 0
    cameraTranslation.y = 0
    cameraTranslation.zoom = 1
})

document.getElementById('input-collisions').addEventListener('click', function (event) {
    config.simulation.collisions = event.target.checked
})

document.getElementById('button-velocity-vector').addEventListener('click', function (event) {
    config.graphics.velocity = event.target.checked
})

document.getElementById('button-acceleration-vector').addEventListener('click', function (event) {
    config.graphics.acceleration = event.target.checked
})

document.getElementById('button-barycenter').addEventListener('click', function (event) {
    config.graphics.barycenter = event.target.checked
})

// #endregion Event handlers



// #region Initialization

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

let bodies = []

// SEED: Random full screen
// for (let index = 0; index < 1000; index++) {
//     bodies.push(new Body(
//         new Vector(
//             randomInt(0 / 4 * playground.width, 4 / 4 * playground.width),
//             randomInt(0 / 4 * playground.height, 4 / 4 * playground.height),
//         ),
//         Vector.null(),
//         Vector.null(),
//         5 * 1e11,
//     ))
// }

// SEED: Planet rings
bodies.push(new Body(
    new Vector(playground.width / 2, playground.height / 2),
    Vector.null(),
    Vector.null(),
    1e16,
))
const dMax = 400, dMin = 50, mMax = 1 * 1e11, mMin = 1 * 1e12
for (let index = 0; index < 500; index++) {
    const tetha = Math.random() * 2 * Math.PI
    const distance = Math.random() * (dMax - dMin) + dMin
    const velocity = Math.sqrt((G * 1e16) / distance) / 1.05 * 1e0
    const mass = randomInt(mMin, mMax)

    bodies.push(new Body(
        new Vector(
            Math.cos(tetha) * distance + playground.width / 2,
            Math.sin(tetha) * distance + playground.height / 2,
        ),
        new Vector(
            Math.cos(tetha - 0.5 * Math.PI) * velocity * 0.95,
            Math.sin(tetha - 0.5 * Math.PI) * velocity * 0.95,
        ),
        Vector.null(),
        mass,
    ))
}

// SEED: Heterogeneous distribution
// const numberOfCells = 4
// for (let i = 0; i < numberOfCells; i++) {
//     for (let j = 0; j < numberOfCells; j++) {
//         const numberOfBodies = Math.floor(Math.random() * 2) * 128
//         for (let k = 0; k < numberOfBodies; k++) {
//             bodies.push(new Body(
//                 new Vector(
//                     Math.random() * (playground.width / numberOfCells) + (i * playground.width / numberOfCells),
//                     Math.random() * (playground.height / numberOfCells) + (j * playground.height / numberOfCells),
//                 ),
//                 Vector.null(),
//                 Vector.null(),
//                 randomInt(1e10, 1e11),
//             ))
//         }
//     }
// }

// #endregion Initialization



// #region Computations

function tick() {
    let distances

    if (config.simulation.collisions) {
        // Collisions
        distances = computeDistances(bodies)
        for (let i = 0; i < bodies.length; i++) {
            const bodyA = bodies[i]
            for (let j = 0; j < bodies.length; j++) {
                const bodyB = bodies[j]
                if (i === j || bodyA === null || bodyB === null) { continue }

                const distance = i < j ? distances[j][i] : distances[i][j]
                if (distance >= (bodyA.radius + bodyB.radius)) { continue }

                // Weighted arithmetic mean, the heaviest body will proportionally conserve more of its properties.
                bodyA.position.x =
                    (bodyA.position.x * bodyA.mass + bodyB.position.x * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)
                bodyA.position.y =
                    (bodyA.position.y * bodyA.mass + bodyB.position.y * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)

                bodyA.speed.x =
                    (bodyA.speed.x * bodyA.mass + bodyB.speed.x * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)
                bodyA.speed.y =
                    (bodyA.speed.y * bodyA.mass + bodyB.speed.y * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)

                bodyA.acceleration.x =
                    (bodyA.acceleration.x * bodyA.mass + bodyB.acceleration.x * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)
                bodyA.acceleration.y =
                    (bodyA.acceleration.y * bodyA.mass + bodyB.acceleration.y * bodyB.mass) /
                    (bodyA.mass + bodyB.mass)

                bodyA.mass += bodyB.mass
                bodies[j] = null
            }
        }

        // Clean null bodies
        for (let index = 0; index < bodies.length; index++) {
            if (bodies[index] === null) {
                bodies.splice(index--, 1)
            }
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
            let force = G * bodyA.mass * bodyB.mass / (distance * distance)

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
}

function computeDistances(bodies) {
    const distances = {}
    for (let a, i = 1; i < bodies.length; i++) {
        a = bodies[i]
        distances[i] = {}
        for (let b, j = 0; j <= i - 1; j++) {
            b = bodies[j]
            distances[i][j] = Math.sqrt(
                Math.pow(b.position.x - a.position.x, 2) + Math.pow(b.position.y - a.position.y, 2)
            )
            // distances[i][j] = Math.max(
            //     Math.abs(b.position.x - a.position.x),
            //     Math.abs(b.position.y - a.position.y)
            // )
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
    for (let index = 0; index < bodies.length; index++) {
        let body = bodies[index]
        let width = body.radius

        // body
        ctx.beginPath()
        ctx.arc(scaleX(body.position.x), scaleY(body.position.y), scale(width), 0, 2 * Math.PI)
        // ctx.rect(
        //     scaleX(body.position.x) - body.radius / 2,
        //     scaleY(body.position.y) - body.radius / 2,
        //     body.radius,
        //     body.radius,
        // )
        ctx.fillStyle = 'white'
        // ctx.fillStyle = 'rgb(255, ' + (1 / body.mass * 255) + ', ' + (1 / body.mass * 255) + ' + '
        ctx.fill()
        ctx.closePath()

        // speed vector
        if (config.graphics.velocity) {
            ctx.strokeStyle = 'red'
            ctx.beginPath()
            ctx.moveTo(
                scaleX(body.position.x),
                scaleY(body.position.y),
            )
            ctx.lineTo(
                scaleX(body.position.x + body.speed.x * 1e0),
                scaleY(body.position.y + body.speed.y * 1e0),
            )
            ctx.stroke()
            ctx.closePath()
        }

        // acceleration vector
        if (config.graphics.acceleration) {
            ctx.strokeStyle = 'green'
            ctx.beginPath()
            ctx.moveTo(
                scaleX(body.position.x),
                scaleY(body.position.y),
            )
            ctx.lineTo(
                scaleX(body.position.x + body.acceleration.x * 1e0),
                scaleY(body.position.y + body.acceleration.y * 1e0),
            )
            ctx.stroke()
            ctx.closePath()
        }
    }

    // Compute barycenter
    if (config.graphics.barycenter) {
        const barycenter_x_num = bodies.map(body => body.position.x * body.mass).reduce((sum, body) => sum + body, 0)
        const barycenter_x_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
        const barycenter_x = barycenter_x_num / barycenter_x_den

        const barycenter_y_num = bodies.map(body => body.position.y * body.mass).reduce((sum, body) => sum + body, 0)
        const barycenter_y_den = bodies.map(body => body.mass).reduce((sum, body) => sum + body, 0)
        const barycenter_y = barycenter_y_num / barycenter_y_den

        ctx.strokeStyle = 'blue'
        ctx.beginPath()
        ctx.moveTo(scaleX(barycenter_x), scaleY(barycenter_y - 10))
        ctx.lineTo(scaleX(barycenter_x), scaleY(barycenter_y + 10))
        ctx.stroke()
        ctx.closePath()

        ctx.beginPath()
        ctx.moveTo(scaleX(barycenter_x - 10), scaleY(barycenter_y))
        ctx.lineTo(scaleX(barycenter_x + 10), scaleY(barycenter_y))
        ctx.stroke()
        ctx.closePath()
    }

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

function scale(number) {
    return number * cameraTranslation.zoom
}

function scaleX(number) {
    return (number + cameraTranslation.x) * cameraTranslation.zoom
}

function scaleY(number) {
    return (number + cameraTranslation.y) * cameraTranslation.zoom
}

// #endregion Computations
