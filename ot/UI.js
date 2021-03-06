/* UI */

// init-select options
(() => {
    let initOptions = [
        window.InitListOfPoints || null,
        window.InitRandom || null,
        window.InitSquare || null
    ]
    initOptions = initOptions.filter(x => !!x)

    const initSelect = document.querySelector('#init-select')
    const initApply = document.querySelector('#init-apply')

    initOptions.forEach((fn, i) => {
        const opt = document.createElement('option')
        opt.value = i
        opt.textContent = fn.name
        initSelect.appendChild(opt)
    })

    const selectedInitIndex = initOptions.indexOf(window.initSim)
    initSelect.value = selectedInitIndex

    initApply.addEventListener('click', () => {
        window.initSim = initOptions[parseInt(initSelect.value)]
        applyInitSim()
    })
})();

// sim size options
(() => {
    const inputWidth = document.querySelector('#sim-size-x')
    const inputHeight = document.querySelector('#sim-size-y')
    const applyButton = document.querySelector('#sim-size-apply')

    const canvas = document.querySelector('canvas')
    inputWidth.value = canvas.width
    inputHeight.value = canvas.height

    // when sim size changes, update canvas to the same aspect ratio,
    // preserve original size via diagonal length
    const pixelSizePattern = /(\d+)/
    const referenceDiagLen = (() => {
        let width = canvas.style.width.match(pixelSizePattern)[1]
        let height = canvas.style.height.match(pixelSizePattern)[1]
        console.log(width, height)

        width = parseInt(width)
        height = parseInt(height)

        return Math.sqrt(width*width + height*height)
    })();

    applyButton.addEventListener('click', () => {
        const newWidth = inputWidth.value
        const newHeight = inputHeight.value
        
        if (newWidth <= 0 || newHeight <= 0) {
            alert('Invalid size!')
            return
        }

        const newDiag = Math.sqrt(newWidth*newWidth + newHeight*newHeight)
        const ratio = referenceDiagLen / newDiag
        const newScreenWidth = newWidth * ratio
        const newScreenHeight = newHeight * ratio

        console.log(newScreenWidth, newScreenHeight)
        canvas.style.width = newScreenWidth + 'px'
        canvas.style.height = newScreenHeight + 'px'

        canvas.width = newWidth
        canvas.height = newHeight

        rebuildSimState()
        applyInitSim()
    })
})();

// render-select options
(() => {
    const renderOptions = {
        energy_now: [
            window.RenderGrayscaleEnergyBufferRaw,
            window.RenderGrayscaleEnergyBufferNormalized,
        ],
        // energy_prev: [],
        step_diff: [
            window.RenderGrayscaleDiffBufferNormalized,
        ],
        vecmax_encoding: [
            window.RenderCardinalVecBuffer,
            window.RenderAngularVecBuffer,
            window.RenderAngularVecBufferFast,
        ],
    };

    const bufferSelect = document.querySelector('#buffer-select')
    const visSelect = document.querySelector('#vis-select')
    const applyVisButton = document.querySelector('#vis-apply')

    bufferSelect.addEventListener('change', () => updateVisSelect(bufferSelect.value))
    applyVisButton.addEventListener('click', updateSelectedVis)

    const bufferOpts = Object.keys(renderOptions)
    bufferOpts.forEach(name => {
        const opt = document.createElement('option')
        opt.value = name
        opt.textContent = name
        bufferSelect.appendChild(opt)
    })

    bufferOpts.forEach(name => {
        // ignore null values
        renderOptions[name] = renderOptions[name].filter(x => !!x)
    })

    // opts filled, update UI based on current vis
    const { visBuffer, visIndex } = (() => {
        let visBuffer = null, visIndex = null
        Object.keys(renderOptions).forEach(buf => {
            const idx = renderOptions[buf].indexOf(window.prepareCanvasBuffer)
            if (idx >= 0) {
                visBuffer = buf
                visIndex = idx
            }
        })
        return { visBuffer, visIndex }
    })()

    bufferSelect.value = visBuffer
    updateVisSelect(visBuffer)
    visSelect.value = visIndex

    function updateVisSelect(buffer) {
        console.log('Updating opts to ', buffer)
        const visOpts = renderOptions[buffer]
        while (visSelect.children.length) visSelect.removeChild(visSelect.children[0])
        visOpts.forEach((fn, i) => {
            const opt = document.createElement('option')
            opt.value = i
            opt.textContent = fn.name
            visSelect.appendChild(opt)
        })
    }

    function updateSelectedVis() {
        if (!visSelect.children.length) return

        const selectedBuffer = bufferSelect.value
        const selectedVis = parseInt(visSelect.value)
        const func = renderOptions[selectedBuffer][selectedVis]
        console.log('setting vis to ', func.name)
        window.prepareCanvasBuffer = func
    }
})();

// sim speed options
(() => {
    const slowSimInput = document.querySelector('#slow-queueframe')
    slowSimInput.addEventListener('click', () => {
        const useSlow = slowSimInput.checked
        if (window.scheduler.isRunning) {
            window.scheduler.start(useSlow)
        }
    })

    document.querySelector('#sim-start').addEventListener('click', () => {
        window.scheduler.start(slowSimInput.checked)
    })

    document.querySelector('#sim-stop').addEventListener('click', () => {
        window.scheduler.pause()
    })

    document.querySelector('#sim-step').addEventListener('click', () => {
        window.scheduler.step()
    })

    document.querySelector('#sim-renormalize').addEventListener('click', () => {
        /* renormalize */
        // constantly averaging brings values
        // closer to float epsilon, renormalize by rescaling
        // to a range of 10 and offset by the average (to keep values
        // near 0 for better precision)
        const { energy_prev } = window.sim
        const stats = energy_prev.stats
        const curRange = stats.max - stats.min

        console.log('renormalizing')
        const fix = 10 / curRange
        applyKernel(energy_prev, (pos) => {
            const val = energy_prev.valueAtN(pos)
            return val * fix
        })
        console.log(energy_prev.stats)
    })
})();


// catch click events, set value in sim
const events = []
var isDragging = false
function handleMouseEvent(ev) {
    console.log(ev)
    const rect = ev.target.getBoundingClientRect()
    let { clientX, clientY } = ev
    clientX -= rect.left
    clientY -= rect.top
    const simx = (clientX / canvas.clientWidth) * canvas.width
    const simy = (clientY / canvas.clientHeight) * canvas.height

    console.log(simx, simy)
    const { energy_now } = sim
    events.push(() => energy_now.setValueAt(-10, Math.floor(simx), Math.floor(simy)))
}
canvas.addEventListener('mousedown', ev => {
    handleMouseEvent(ev)
    isDragging = true
})
canvas.addEventListener('mousemove', ev => {
    if (isDragging) handleMouseEvent(ev)
})
canvas.addEventListener('mouseup', ev => {
    isDragging = false
})