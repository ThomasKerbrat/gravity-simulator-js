
/**
 * TODO:
 * - Camera zoom
 * - Camera follow
 * - Separation computation/replay
 */



// #region Global variables

const canvasElement = document.getElementById('canvas');
const ctx = canvasElement.getContext('2d');

const G = 6.67408e-11;
const calculationsPerSeconds = 30;

let universe = null;
const playground = {
    width: 800,
    height: 800,
};

let isMoving = false;
let mouseMoveOrigin = null;
let cameraTranslation = {
    x: playground.width / 2,
    y: playground.height / 2,
    zoom: 1,
};

const config = {
    simulation: {
        collisions: true,
    },
    graphics: {
        velocity: false,
        acceleration: false,
        barnesHutTree: false,
        intervalID: null,
    }
};

ctx.translate(0.5, 0.5);

// const seeders = [
//     { name: 'Random', handler: seedRandom },
//     { name: 'Planet Rings', handler: seedPlanetRings },
//     { name: 'Heterogeneous Distribution', handler: seedHeterogeneousDistribution },
// ];

// #endregion Global variables



// #region Event handlers

document.getElementById('button-start').addEventListener('click', buttonStartEventHandler);
document.getElementById('button-pause').addEventListener('click', buttonPauseEventHandler);
document.getElementById('button-step').addEventListener('click', buttonStepEventHandler);
document.getElementById('button-clear').addEventListener('click', buttonClearEventHandler);

document.getElementById('input-collisions').addEventListener('click', inputCollisionsEventHandler);
document.getElementById('button-seed').addEventListener('click', buttonSeedEventHandler);

document.getElementById('button-velocity-vector').addEventListener('click', buttonVelocityVectorEventHandler);
document.getElementById('button-acceleration-vector').addEventListener('click', buttonAccelerationVectorEventHandler);
document.getElementById('button-barnes-hut-tree').addEventListener('click', buttonBarnesHutTreeEventHandler);



function buttonStartEventHandler(event) {
    if (config.graphics.intervalID == null) {
        config.graphics.intervalID = setInterval(() => universe.tick(), 1000 / calculationsPerSeconds);
    }
}

function buttonPauseEventHandler(event) {
    clearInterval(config.graphics.intervalID);
    config.graphics.intervalID = null;
}

function buttonStepEventHandler(event) {
    if (config.graphics.intervalID == null) {
        universe.tick();
    }
}

function buttonClearEventHandler(event) {
    buttonPauseEventHandler();
    universe.bodies = [];

    const inputGroupControlsElement = document.getElementById('input-group-controls');
    const inputGroupSimulationParametersElement = document.getElementById('input-group-simulation-parameters');
    inputGroupControlsElement.disabled = true;
    inputGroupSimulationParametersElement.disabled = false;
}



function inputCollisionsEventHandler(event) {
    config.simulation.collisions = event.target.checked;
}

function buttonSeedEventHandler(event) {
    const inputSeedElement = Array.apply(null, document.querySelectorAll('input[name=input-seed]')).filter(element => element.checked)[0];
    const inputBodyNumber = parseInt(document.getElementById('input-body-number').value);
    const inputTheta = parseFloat(document.getElementById('input-theta').value);
    const inputCollisions = document.getElementById('input-collisions').checked;

    if (inputSeedElement != null && !Number.isNaN(inputBodyNumber)) {
        universe = new Universe({
            computationsPerSecond: calculationsPerSeconds,
            gravitationalConstant: G,
            enableCollisions: inputCollisions,
            theta: inputTheta,
        });

        switch (inputSeedElement.id) {
            case 'input-seed-random': universe.bodies = seedRandom(inputBodyNumber); break;
            case 'input-seed-planet-rings': universe.bodies = seedPlanetRings(inputBodyNumber); break;
            case 'input-seed-star-system': universe.bodies = seedStarSystem(inputBodyNumber); break;
            case 'input-seed-heterogeneous-distribution': universe.bodies = seedHeterogeneousDistribution(inputBodyNumber); break;
            case 'input-seed-two-clouds': universe.bodies = seedTwoClouds(inputBodyNumber); break;
            default: throw new Error('Unexpected input-seed element id: ' + inputSeedElement.id); break;
        }

        const inputGroupControlsElement = document.getElementById('input-group-controls');
        const inputGroupSimulationParametersElement = document.getElementById('input-group-simulation-parameters');
        inputGroupControlsElement.disabled = false;
        inputGroupSimulationParametersElement.disabled = true;
    }
}



function buttonVelocityVectorEventHandler(event) {
    config.graphics.velocity = event.target.checked;
}

function buttonAccelerationVectorEventHandler(event) {
    config.graphics.acceleration = event.target.checked;
}

function buttonBarnesHutTreeEventHandler(event) {
    config.graphics.barnesHutTree = event.target.checked;
}



// #region Camera Translation

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

canvasElement.addEventListener('dblclick', function (event) {
    cameraTranslation.x = playground.width / 2
    cameraTranslation.y = playground.height / 2
    cameraTranslation.zoom = 1
    event.preventDefault();
})

canvasElement.addEventListener('wheel', function (event) {
    let fixedX;
    let fixedY;

    if (event.altKey) {
        fixedX = playground.width / 2;
        fixedY = playground.height / 2;
    } else {
        fixedX = event.clientX;
        fixedY = event.clientY;
    }

    // NOTE: I do not understand why this works.
    const newZoom = cameraTranslation.zoom * (event.deltaY > 0 ? 0.9 : 1.1);
    const x = (cameraTranslation.x - fixedX) / cameraTranslation.zoom;
    const y = (cameraTranslation.y - fixedY) / cameraTranslation.zoom;
    cameraTranslation.x = (x * newZoom) + fixedX;
    cameraTranslation.y = (y * newZoom) + fixedY;
    cameraTranslation.zoom = newZoom;
    event.preventDefault();
})

// #endregion

document.addEventListener('keydown', function (event) {
    switch (event.key) {
        case ' ': config.graphics.intervalID == null ? buttonStartEventHandler(event) : buttonPauseEventHandler(event); break;
        case 's': buttonStepEventHandler(event); break;
        case 'c': buttonClearEventHandler(event); break;
        // TODO
        // case 'v': buttonVelocityVectorEventHandler(event); break;
        // case 'a': buttonAccelerationVectorEventHandler(event); break;
        // case 'b': buttonBarycenterEventHandler(event); break;
        default: break;
    }
})

// #endregion Event handlers



// #region Seed functions

function seedRandom(bodyNumber) {
    const bodies = [];

    for (let index = 0; index < bodyNumber; index++) {
        bodies.push(new Body(
            new Vector(
                randomInt(-0.5 * playground.width, 0.5 * playground.width),
                randomInt(-0.5 * playground.height, 0.5 * playground.height),
            ),
            Vector.null(),
            Vector.null(),
            randomInt(1e10, 1e11),
        ));
    }

    return bodies;
}

function seedPlanetRings(bodyNumber) {
    const bodies = [];

    bodies.push(new Body(
        new Vector(0, 0),
        Vector.null(),
        Vector.null(),
        1e16,
    ));

    seedRing(bodyNumber, 2e2, 4e2, 1e10, 1e11);

    function seedRing(bodyNumber, dMin, dMax, mMin, mMax) {
        for (let index = 0; index < (bodyNumber - 1); index++) {
            const tetha = Math.random() * 2 * Math.PI;
            const distance = Math.random() * (dMax - dMin) + dMin;
            const velocity = Math.sqrt((G * 1e16) / distance) * 0.99e0;
            const mass = randomInt(mMin, mMax);

            bodies.push(new Body(
                new Vector(
                    Math.cos(tetha) * distance,
                    Math.sin(tetha) * distance,
                ),
                new Vector(
                    Math.cos(tetha - 0.5 * Math.PI) * velocity,
                    Math.sin(tetha - 0.5 * Math.PI) * velocity,
                ),
                Vector.null(),
                mass,
            ));
        }
    }

    return bodies;
}

function seedStarSystem(bodyNumber) {
    const bodies = [];
    if (bodyNumber > 10) {
        bodyNumber = 10;
    }

    bodies.push(new Body(
        new Vector(0, 0),
        Vector.null(),
        Vector.null(),
        1e16,
    ));

    const dMax = 400;
    const dMin = 100;

    for (let index = 0; index < (bodyNumber - 1); index++) {
        const tetha = 0; // Math.random() * 2 * Math.PI;
        const distance = ((index + 1) / bodyNumber) * (dMax - dMin) + dMin;
        const velocity = Math.sqrt((G * 1e16) / distance) * 1e0;
        const mass = 1e12;

        bodies.push(new Body(
            new Vector(
                Math.cos(tetha) * distance,
                Math.sin(tetha) * distance,
            ),
            new Vector(
                Math.cos(tetha - 0.5 * Math.PI) * velocity,
                Math.sin(tetha - 0.5 * Math.PI) * velocity,
            ),
            Vector.null(),
            mass,
        ));
    }

    return bodies;
}

function seedHeterogeneousDistribution(bodyNumber) {
    const bodies = [];

    const numberOfCells = 8
    for (let i = 0; i < numberOfCells; i++) {
        for (let j = 0; j < numberOfCells; j++) {
            const numberOfBodies = Math.floor(Math.random() * (bodyNumber * 2 / Math.pow(numberOfCells, 2)));
            for (let k = 0; k < numberOfBodies; k++) {
                bodies.push(new Body(
                    new Vector(
                        Math.random() * (playground.width / numberOfCells) + (i * playground.width / numberOfCells) - playground.width / 2,
                        Math.random() * (playground.height / numberOfCells) + (j * playground.height / numberOfCells) - playground.height / 2,
                    ),
                    Vector.null(),
                    Vector.null(),
                    randomInt(1e10, 1e11),
                ));
            }
        }
    }

    return bodies;
}

function seedTwoClouds(bodyNumber) {
    const bodies = [];

    seedCloud(bodyNumber / 4, -500, -500, 250);
    seedCloud(bodyNumber / 4, -500, 500, 250);
    seedCloud(bodyNumber / 4, 500, -500, 250);
    seedCloud(bodyNumber / 4, 500, 500, 250);

    return bodies;

    function seedCloud(bodyNumber, centerX, centerY, radius) {
        for (let i = 0; i < bodyNumber; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const distance = Math.random() * radius;

            bodies.push(new Body(
                new Vector(
                    Math.cos(theta) * distance + centerX,
                    Math.sin(theta) * distance + centerY,
                ),
                Vector.null(),
                Vector.null(),
                randomInt(1e10, 1e11),
            ));
        }
    }
}

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

// #endregion Initialization



// #region Drawing

render();
let lastRenderTime = Date.now()
let lastDisplay = { time: Date.now(), value: 0 }

function render() {
    requestAnimationFrame(render);

    if (universe == null) { return; }

    // Clean
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, playground.width, playground.height)

    // Bodies
    for (const body of universe.bodies) {
        const minimumRadius = 0.5;
        let screenRadius = scale(body.radius);
        if (screenRadius < minimumRadius) {
            screenRadius = minimumRadius;
        }

        // body
        ctx.beginPath()
        ctx.arc(scaleX(body.position.x), scaleY(body.position.y), screenRadius, 0, 2 * Math.PI)
        ctx.fillStyle = 'white'
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

    // Nodes
    if (config.graphics.barnesHutTree && universe.tree != null) {
        renderTree(universe.tree);
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
    ctx.fillText('' + universe.bodies.length + ' Bodies', 5, 42)
}

function renderTree(tree) {
    // Box
    ctx.strokeStyle = '#040';
    ctx.strokeRect(scaleX(tree.origin.x), scaleY(tree.origin.y), scale(tree.width), scale(tree.width));

    // Center of mass
    if (tree.child == null && tree.nodes != null) {
        ctx.beginPath()
        ctx.arc(scaleX(tree.centerOfMass.x), scaleY(tree.centerOfMass.y), 1, 0, 2 * Math.PI)
        ctx.fillStyle = '#08f'
        ctx.fill()
        ctx.closePath()
    }

    // Children (recursive)
    if (tree.nodes != null) {
        for (const subNode of tree.nodes) {
            if (subNode.child != null || subNode.nodes != null) {
                renderTree(subNode);

                ctx.strokeStyle = subNode.child == null ? '#048' : '#084';
                ctx.beginPath();
                ctx.moveTo(
                    scaleX(tree.centerOfMass.x),
                    scaleY(tree.centerOfMass.y),
                );
                ctx.lineTo(
                    scaleX(subNode.centerOfMass.x),
                    scaleY(subNode.centerOfMass.y),
                );
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function scale(number) {
    return number * cameraTranslation.zoom
}

function scaleX(number) {
    return (number * cameraTranslation.zoom) + cameraTranslation.x
}

function scaleY(number) {
    return (number * cameraTranslation.zoom) + cameraTranslation.y
}

// #endregion Drawing
