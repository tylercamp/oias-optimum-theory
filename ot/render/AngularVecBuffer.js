/*

Rendering for step_diff buffer which outputs smooth colors based on average gradient direction.

Colors are configured in DirColors.js. Interpolates values in LAB space (using chroma.js) for smoother
and more accurate color mixing. Very slow due to this extra calculation.

*/

window.prepareCanvasBuffer = RenderAngularVecBuffer
function RenderAngularVecBuffer(sim) {
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

        /* (WIP attempts at optimization by pre-generating mixed colors and indexing by angle) */
        // let angle = Math.atan2(avg[1], avg[0])
        // if (angle < 0) angle += 2*Math.PI

        // const angleIndex = Math.floor(angle / dirColorsLabAngleInc)
        // return dirColorsLabByAngle[angleIndex]

        const percUp = Math.max(0, -avg[1])
        const percDown = Math.max(0, avg[1])
        const percLeft = Math.max(0, -avg[0])
        const percRight = Math.max(0, avg[0])

        let [colx, percx] = percLeft > percRight
            ? [dirColorsLab[dirs.left], percLeft]
            : [dirColorsLab[dirs.right], percRight]
        
        let [coly, percy] = percUp > percRight
            ? [dirColorsLab[dirs.up], percUp]
            : [dirColorsLab[dirs.down], percDown]

        const sum = percx + percy
        percx /= sum
        percy /= sum
        
        const scale = chroma.scale([colx, coly]).mode('lab')
        return scale(percy).rgb()
    })
}