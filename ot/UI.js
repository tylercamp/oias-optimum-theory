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

    applyButton.addEventListener('click', () => {
        const newWidth = inputWidth.value
        const newHeight = inputHeight.value
        
        if (newWidth <= 0 || newHeight <= 0) {
            alert('Invalid size!')
            return
        }

        canvas.width = newWidth
        canvas.height = newHeight

        rebuildSimState()
        applyInitSim()
    })
})();

// sim speed options
(() => {
    const input = document.querySelector('#slow-queueframe')
    input.addEventListener('click', () => {
        const useSlow = input.checked
        if (useSlow) window.queueFrame = queueFrameSlow
        else window.queueFrame = queueFrameFast
    })
})();

// render-select options
(() => {
    const renderOptions = {
        energy_now: [
            window.RenderGrayscaleEnergyBufferRaw || null,
            window.RenderGrayscaleEnergyBufferNormalized || null,
        ],
        // energy_prev: [],
        step_diff: [
            window.RenderGrayscaleDiffBufferNormalized || null,
        ],
        vecmax_encoding: [
            window.RenderCardinalVecBuffer || null,
            window.RenderAngularVecBuffer || null,
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

// catch click events, set value in sim
const events = []
canvas.addEventListener('click', (ev) => {
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
})