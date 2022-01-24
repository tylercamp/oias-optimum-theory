class RenderScheduler {
    constructor({
        mode = RenderScheduler.MODE.PAUSED,
        slowSpeed = 500 // ms per frame
    } = {}) {
        this.mode = mode
        this.slowSpeed = slowSpeed

        this.fns = []

        this._timeout = null
        this._animationFrame = null
    }

    onFrame(cb) {
        this.fns.push(cb)
    }

    _doWork() {
        const start = new Date()
        this.fns.forEach(f => f())
        return new Date() - start
    }

    _runFrame() {
        const timeSpent = this._doWork()
        this._queueFrame(this.slowSpeed - timeSpent)
    }

    _queueFrame(delay = 0) {
        if (delay < 0) delay = 0
        if (this.mode == RenderScheduler.MODE.PAUSED) return
        
        const self = this
        const run = () => self._runFrame()
        if (this.mode == RenderScheduler.MODE.RUN_SLOW) {
            this._timeout = setTimeout(run, delay)
        } else {
            this._animationFrame = requestAnimationFrame(run)
        }
    }

    _clearPendingFrame() {
        this._timeout && clearTimeout(this._timeout)
        this._animationFrame && cancelAnimationFrame(this._animationFrame)

        this._timeout = this._animationFrame = null
    }

    get isRunning() { return this.mode != RenderScheduler.MODE.PAUSED }

    start(slow = false) {
        this._clearPendingFrame()
        this.mode = slow
            ? RenderScheduler.MODE.RUN_SLOW
            : RenderScheduler.MODE.RUN_FAST
        this._queueFrame()
    }

    pause() {
        this.mode = RenderScheduler.MODE.PAUSED
        this._clearPendingFrame()
    }

    step() {
        this.pause()
        this._runFrame()
    }
}

RenderScheduler.MODE = {
    RUN_FAST: "run fast",
    RUN_SLOW: "run slow",
    PAUSED: "pause",
}