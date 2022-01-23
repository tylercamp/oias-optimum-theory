// map: (cur, val) => newval
Array.prototype.accumulate = function accumulate(start, map) {
    let val = start
    for (let i = 0; i < this.length; i++) val = map(val, this[i])
    return val
}