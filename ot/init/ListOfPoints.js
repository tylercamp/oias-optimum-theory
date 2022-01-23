// set of points
window.initSim = InitListOfPoints
function InitListOfPoints(sim, range, midx, midy) {
    const { energy_prev, energy_now } = sim
    energy_prev.fill(0)
    energy_now.fill(0)
    const pts = [[midx, midy, -range]]
    // const pts = [[midx*.75, midy*.75, -range], [midx*1.25, midy*.75, range], [midx*1.25, midy*1.25, -range], [midx*.75, midy*1.25, range]]
    pts.forEach(([x, y, val]) => energy_prev.setValueAt(val, Math.floor(x), Math.floor(y)))
}