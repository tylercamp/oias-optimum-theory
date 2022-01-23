// circle
function initSim(sim, range, midx, midy) {
    const { energy_prev } = sim
    const radius = Math.round((midx + midy) / 4)
    for (let y = midy - radius; y < midy + radius; y++) {
        for (let x = midx - radius; x < midx + radius; x++) {
            const dx = x - midx;
            const dy = y - midy;
            const dist = Math.sqrt(dx*dx + dy*dy)
            energy_prev.setValueAt(dist, x, y)
        }
    }
}