function FrameTracker() {
    this.numTicks = 0
    this.startTime = new Date().valueOf()
}
FrameTracker.prototype.tick = function() {
    this.numTicks++
    const now = new Date().valueOf()
    if (now - this.startTime >= 1000) {
        console.log(`${this.numTicks} fps`)
        this.numTicks = 0
        this.startTime = now
    }
}