// random
window.initSim = InitRandom
function InitRandom(sim, range, midx, midy) {
    const { energy_prev } = sim
    applyKernel(energy_prev, () => (Math.random() - 0.5) * range)
}