window.prepareCanvasBuffer = RenderGrayscaleEnergyBufferRaw
function RenderGrayscaleEnergyBufferRaw(sim) {
    const range = 10 // note - should be synced with the max used in sim init / UI interaction

    const min = -range
    const max = range

    applyKernel(sim.canvas_buffer, (pos) => {
        const val = sim.energy_now.valueAtN(pos)
        const norm = (val - min) / (max - min)
        return Math.round(norm * 255)
    })
}