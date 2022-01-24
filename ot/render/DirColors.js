var dirColors = {}
dirColors[dirs.left] = [17, 168, 101]
dirColors[dirs.right] = [17, 71, 168]
dirColors[dirs.up] = [12, 245, 142]
dirColors[dirs.down] = [12, 96, 245]
dirColors[dirs.none] = [245, 108, 0]

// originally blended with LAB, changed to use LCH
// https://gist.github.com/Myndex/47c793f8a054041bd2b52caa7ad5271c
// (LAB has smoother blending, but LCH allows a larger range of colors)

// https://paletton.com/#uid=70a1q0kk+mf3qvmbWq+twhNOxd2
var dirColorsLab = {}
dirColorsLab[dirs.left] = '#B1553D'
dirColorsLab[dirs.up] = '#B1A33D'
dirColorsLab[dirs.right] = '#2B7E4F'
dirColorsLab[dirs.down] = '#4B3179'

// how many angles to pre-calculate colors for
// (low number selected as an easy way to produce iso-lines)
var dirColorsLabRes = 30
var dirColorsLabAngleInc = (Math.PI*2) / dirColorsLabRes
var dirColorsLabByAngle = new Array(dirColorsLabRes + 1);
dirColorsLabByAngle.fill(0)
dirColorsLabByAngle = dirColorsLabByAngle.map((_, i) => {
    // angle calc done by Math.atan2 which returns range from [-Math.PI Math.PI]
    const angle = -Math.PI + dirColorsLabAngleInc * i

    let x = Math.cos(angle)
    let y = Math.sin(angle)

    // not sure whether this step should be done
    //
    // `y` is used as a percent value, effectively "how much of this angle is in Y axis".
    // anything else is "how much angle is x axis", so sum should be 1.
    //
    // removing it makes blending smoother. using it introduces banding around cardinal directions,
    // which pronounces those regions.
    // const sum = Math.abs(x) + Math.abs(y)
    // x /= sum
    // y /= sum

    const xcol = x < 0 ? dirColorsLab[dirs.left] : dirColorsLab[dirs.right]
    const ycol = y < 0 ? dirColorsLab[dirs.up] : dirColorsLab[dirs.down]
    const scale = chroma.scale([xcol, ycol]).mode('lch')
    return scale(Math.abs(y)).rgb()
})