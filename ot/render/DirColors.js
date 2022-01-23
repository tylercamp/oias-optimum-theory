var dirColors = {}
dirColors[dirs.left] = [17, 168, 101]
dirColors[dirs.right] = [17, 71, 168]
dirColors[dirs.up] = [12, 245, 142]
dirColors[dirs.down] = [12, 96, 245]
dirColors[dirs.none] = [245, 108, 0]

// https://paletton.com/#uid=70a1q0kk+mf3qvmbWq+twhNOxd2
var dirColorsLab = {}
dirColorsLab[dirs.left] = '#B1553D'
dirColorsLab[dirs.up] = '#B1A33D'
dirColorsLab[dirs.right] = '#2B7E4F'
dirColorsLab[dirs.down] = '#4B3179'

var dirColorsLabRes = 180
var dirColorsLabAngleInc = (Math.PI*2) / dirColorsLabRes
var dirColorsLabByAngle = new Array(dirColorsLabRes);
dirColorsLabByAngle.fill(0)
dirColorsLabByAngle = dirColorsLabByAngle.map((_, i) => {
    let x = Math.cos(dirColorsLabAngleInc * i)
    let y = -Math.cos(dirColorsLabAngleInc * i)
    const sum = x + y
    x /= sum
    y /= sum

    const xcol = x < 0 ? dirColorsLab[dirs.left] : dirColorsLab[dirs.right]
    const ycol = y < 0 ? dirColorsLab[dirs.up] : dirColorsLab[dirs.down]
    const scale = chroma.scale([xcol, ycol]).mode('lab')
    return scale(ycol).rgb()
})