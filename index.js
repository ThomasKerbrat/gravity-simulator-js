const canvasElement = document.getElementById('canvas')
const ctx = canvasElement.getContext('2d')

const G = 6.674e-11
const steps = 30

const playground = {
    width: 1200,
    height: 700,
}
let isMoving = false
let mouseMoveOrigin = null
let userTranslation = { x: 0, y: 0 }

ctx.translate(0.5, 0.5)

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
    bodies.push({
        x: randomInt(0 / 4 * playground.width, 4 / 4 * playground.width),
        y: randomInt(0 / 4 * playground.height, 4 / 4 * playground.height),
        v_x: 0,
        v_y: 0,
        a_x: 0,
        a_y: 0,
        mass: randomInt(1e4, 1e7),
    })
}

render(ctx, bodies, playground)

setInterval(function () {
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        for (let j = 0; j < bodies.length; j++) {
            const bodyB = bodies[j]
            if (i !== j) {
                const distance = Math.sqrt(Math.pow(bodyB.x - bodyA.x, 2) + Math.pow(bodyB.y - bodyA.y, 2))
                if (distance < 2) {
                    bodyA.x = (bodyA.x + bodyB.x) / 2
                    bodyA.y = (bodyA.y + bodyB.y) / 2
                    bodyA.v_x = (bodyA.v_x + bodyB.v_x) / 2
                    bodyA.v_y = (bodyA.v_y + bodyB.v_y) / 2
                    bodyA.a_x = (bodyA.a_x + bodyB.a_x) / 2
                    bodyA.a_y = (bodyA.a_y + bodyB.a_y) / 2
                    bodies.splice(j, 1)
                    j -= 1
                }
            }
        }
    }

    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i]
        bodyA.a_x = 0
        bodyA.a_y = 0

        for (let j = 0; j < bodies.length; j++) {
            if (i !== j) {
                const bodyB = bodies[j]
                const distance = Math.sqrt(Math.pow(bodyB.x - bodyA.x, 2) + Math.pow(bodyB.y - bodyA.y, 2))
                const force = G * bodyA.mass * bodyB.mass / Math.pow(distance, 2)
                const angle = Math.atan2(bodyB.y - bodyA.y, bodyB.x - bodyA.x)
                const a_x = Math.cos(angle) * force
                const a_y = Math.sin(angle) * force
                bodyA.a_x += a_x
                bodyA.a_y += a_y
            }
        }
    }

    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i]
        body.v_x += body.a_x / steps
        body.v_y += body.a_y / steps
        body.x += body.v_x / steps
        body.y += body.v_y / steps
    }
}, 1000 / steps)

function render(ctx, bodies, playground) {
    requestAnimationFrame(function () {
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, playground.width, playground.height)

        for (let body, width, index = 0; index < bodies.length; index++) {
            body = bodies[index]
            width = Math.log10(body.mass) / 4

            // body
            ctx.beginPath()
            ctx.arc(body.x + userTranslation.x, body.y + userTranslation.y, width, 0, 2 * Math.PI)
            ctx.fillStyle = 'white'
            ctx.fill()
            ctx.closePath()

            // speed vector
            // ctx.strokeStyle = 'red'
            // ctx.beginPath()
            // ctx.moveTo((body.x) + userTranslation.x, (body.y) + userTranslation.y)
            // ctx.lineTo((body.x + body.v_x * 1e0) + userTranslation.x, (body.y + body.v_y * 1e0) + userTranslation.y)
            // ctx.stroke()
            // ctx.closePath()

            // acceleration vector
            // ctx.strokeStyle = 'green'
            // ctx.beginPath()
            // ctx.moveTo((body.x) + userTranslation.x, (body.y) + userTranslation.y)
            // ctx.lineTo((body.x + body.a_x * 1e0) + userTranslation.x, (body.y + body.a_y * 1e0) + userTranslation.y)
            // ctx.stroke()
            // ctx.closePath()
        }

        render(ctx, bodies, playground)
    })
}
