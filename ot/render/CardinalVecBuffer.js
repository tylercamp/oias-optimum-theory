function prepareCanvasBuffer(sim) {
    // prepare from vec color coding
    applyKernel(sim.canvas_buffer, (pos) => {
        const dir = sim.vecmax_encoding.valueAtN(pos)
        if (!dirColors[dir]) debugger
        return dirColors[dir]
    })
}