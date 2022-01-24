
/*

Handles simulation init and simulation time-step.

Provides the `applyKernel` helper, which fills the value of a `SpaceBuffer` based on some function, eg
`applyKernel(myBuffer, (pos) => myBuffer.setValueAtN(0, pos))`

Note: Creates the canvas_buffer, but this buffer is populated in `ot/render` files.

*/

var dirs = {
    up: 'u',
    down: 'd',
    left: 'l',
    right: 'r',
    none: 'n'
}

function maxBy(vals, outputs, ifeq) {
    let max = -10000
    let result = null
    for (let i = 0; i < vals.length; i++) {
        if (vals[i] > max) {
            max = vals[i]
            result = outputs[i]
        }
    }
    if (max == vals[0] && max == vals[vals.length - 1]) return ifeq
    else return result
}

function prepareSimulation(canvas, ctx) {
    var canvasDims = [canvas.width, canvas.height]
    var canvas_buffer = new SpaceBuffer(buffspecs.imageData(ctx), canvasDims)
    var energy_now = new SpaceBuffer(buffspecs.float32Array, canvasDims)
    var energy_prev = new SpaceBuffer(buffspecs.float32Array, canvasDims)

    // for vis
    var step_diff = new SpaceBuffer(buffspecs.float32Array, canvasDims)
    var vecmax_encoding = new SpaceBuffer(buffspecs.charArray, canvasDims)

    energy_now.fill(0)
    energy_prev.fill(0)

    const obj = {
        canvas_buffer, energy_now, energy_prev, step_diff, vecmax_encoding,
    }

    obj.ops = {
        swapBuffers: () => {
            const energy_now = obj.energy_now
            obj.energy_now = obj.energy_prev
            obj.energy_prev = energy_now
        }
    }

    return obj
}

function bufferForEach(buffer, fn) {
    // 2d-only (Nd too expensive)
    let curpos = []
    for (curpos[1] = 0; curpos[1] < buffer.dims[1]; curpos[1]++) {
        for (curpos[0] = 0; curpos[0] < buffer.dims[0]; curpos[0]++) {
            fn(curpos)
        }
    }
}

function applyKernel(target, kernel) {
    const update = (curpos) => target.setValueAtN(kernel(curpos), curpos)
    bufferForEach(target, update)
}

function runTimeStep(sim, events) {
    /* base process */

    const {
        energy_now, energy_prev, step_diff, vecmax_encoding
    } = sim

    // blur kernel (von-neumman)
    applyKernel(energy_now, (pos) => {
        // 4 neighbors + self
        const neighborhood = energy_prev.sampleN(pos)
        return neighborhood.accumulate(0, (c, v) => c+v) / neighborhood.length
    })

    // // blur kernel (unit circle)
    // applyKernel(energy_now, (pos) => {
    //     // 
    //     // sample on unit circle instead of 4 adjacent neighbors. adjacent neighbors
    //     // have weight of 1, diagonal neighbors have weight (1-)
    // })

    events.forEach(e => e())
    events.splice(0, events.length)

    /* post-process */

    // diff kernel
    applyKernel(step_diff, (pos) => Math.abs(energy_now.valueAtN(pos) - energy_prev.valueAtN(pos)))

    // vecmax kernel
    applyKernel(vecmax_encoding, (pos) => {
        const [x, y] = [pos]
        const [     up,
            left, curVal, right,
                    down
        ] = step_diff.sampleN(pos)

        const dl = curVal - left
        const dr = curVal - right
        const du = curVal - up
        const dd = curVal - down

        // note: gradient op is reversed 
        const maxdir = maxBy(
            [dl,        dr,         du,      dd],
            [dirs.left, dirs.right, dirs.up, dirs.down],
            dirs.none
        )

        if (!maxdir) debugger

        return maxdir
    })
}