/*

Rendering for step_diff buffer which outputs smooth colors based on average gradient direction.

Colors are configured in DirColors.js. Interpolates values in LAB space (using chroma.js) for smoother
and more accurate color mixing. (This interpolation is precomputed for a set of vector angles; angle
is calculated here and used to index into the precomputed array.)

*/

window.prepareCanvasBuffer = RenderAngularVecBufferFast
function RenderAngularVecBufferFast(sim) {
    const { canvas_buffer, step_diff } = sim

    const C_BLACK = [0,0,0]
    const vecs = [
        [[0,-1], 0],
        [[0,1], 0],
        [[-1,0], 0],
        [[1,0], 0]
    ]
    const vecZero = [0,0]
    const vecAccum = (c, v) => {
        c[0] += v[0][0] * v[1]
        c[1] += v[0][1] * v[1]
        return c
    };

    // vec gradient
    applyKernel(canvas_buffer, (pos) => {
        const [     up,
            left, curVal, right,
                   down
        ] = step_diff.sampleN(pos)

        let dl = curVal - left
        let dr = curVal - right
        let du = curVal - up
        let dd = curVal - down

        const min = Math.min(dl, dr, du, dd)
        const max = Math.max(dl, dr, du, dd)

        if (max == min) {
            return C_BLACK
        }
        const invrange = 1 / (max - min)

        dl -= min
        dr -= min
        du -= min
        dd -= min

        dl *= invrange
        dr *= invrange
        du *= invrange
        dd *= invrange

        vecs[0][1] = du
        vecs[1][1] = dd
        vecs[2][1] = dl
        vecs[3][1] = dr

        vecZero[0] = vecZero[1] = 0
        const avg = vecs.accumulate(vecZero, vecAccum)

        const mag = Math.sqrt(avg[0]*avg[0] + avg[1]*avg[1])
        if (mag == 0) return C_BLACK

        avg[0] /= mag
        avg[1] /= mag

        let angle = Math.atan2(avg[1], avg[0]) + Math.PI

        const angleIndex = Math.floor(angle / dirColorsLabAngleInc)
        return dirColorsLabByAngle[angleIndex]
    })
}