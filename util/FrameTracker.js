function FrameTracker() {
    this.numTicks = 0
    this.startTime = new Date().valueOf()
}
FrameTracker.prototype.tick = function(onLog) {
    this.numTicks++
    const now = new Date().valueOf()
    if (now - this.startTime >= 1000) {
        if (onLog) onLog(this.numTicks)
        else console.log(`${this.numTicks} fps`)
        this.numTicks = 0
        this.startTime = now
    }
}