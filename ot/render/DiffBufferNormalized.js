window.prepareCanvasBuffer = RenderGrayscaleDiffBufferNormalized
function RenderGrayscaleDiffBufferNormalized(sim) {
    const { min, max } = sim.step_diff.stats

    applyKernel(sim.canvas_buffer, (pos) => {
        if (min == max) return 0

        const val = sim.step_diff.valueAtN(pos)
        const norm = (val - min) / (max - min)
        return Math.round(norm * 255)
    })
}