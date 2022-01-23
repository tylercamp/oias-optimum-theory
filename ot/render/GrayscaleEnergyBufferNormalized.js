window.prepareCanvasBuffer = RenderGrayscaleEnergyBufferNormalized
function RenderGrayscaleEnergyBufferNormalized(sim) {
    const { min, max } = sim.energy_now.stats

    applyKernel(sim.canvas_buffer, (pos) => {
        if (min == max) return 0
        
        const val = sim.energy_now.valueAtN(pos)
        const norm = (val - min) / (max - min)
        return Math.round(norm * 255)
    })
}