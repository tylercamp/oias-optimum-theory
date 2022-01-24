/*

Rendering for step_diff buffer which outputs smooth colors based on average gradient direction.

Colors are configured in DirColors.js. Interpolates values in LAB space (using chroma.js) for smoother
and more accurate color mixing. (This interpolation is precomputed for a set of vector angles; angle
is calculated here and used to index into the precomputed array.)

*/

window.prepareCanvasBuffer = RenderAngularVecBufferFast
function RenderAngularVecBufferFast(sim) {
    const { canvas_buffer, step_diff } = sim
    // vec gradient
    applyKernel(canvas_buffer, (pos) => {
        const [x, y] = [pos]
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
            return [0,0,0]
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

        const vecs = [
            [[0,-1], du],
            [[0, 1], dd],
            [[-1, 0], dl],
            [[1, 0], dr]
        ]

        const avg = vecs.accumulate([0,0], (c, v) => {
            const [vec, str] = v
            c[0] += vec[0] * str
            c[1] += vec[1] * str
            return c
        })

        const mag = Math.sqrt(avg[0]*avg[0] + avg[1]*avg[1])
        if (mag == 0) return [0,0,0,0]

        avg[0] /= mag
        avg[1] /= mag

        let angle = Math.atan2(avg[1], avg[0]) + Math.PI

        const angleIndex = Math.floor(angle / dirColorsLabAngleInc)
        return dirColorsLabByAngle[angleIndex]
    })
}