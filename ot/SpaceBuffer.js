/*

A "SpaceBuffer" is a wrapper object for managing data in a simulation space.

The SpaceBuffer has helpers for working with data, and defers to an underlying "buffspec" for actual
storage. This allows us to easily work with multiple buffers of different types.

SpaceBuffer is mostly written for a generic number of dimensions, some logic is hard-coded for 2
dimensions.

Create a SpaceBuffer with `new SpaceBuffer(buffspecs.spec, [w, h, ...])`.

Methods of format `methodN` (eg `valueAtN`) accept an array of values as position.
`valueAtN([x,y])`

Other methods use variadic args as position.
`valueAt(x, y)`

Setters take a value as first arg, and position as remaining arg(s).
`setValueAtN(val, [x,y])`
`setValueAt(val, x, y)`

*/

const _arraySpec = (type) => ({
    gen: (_, size) => new type(size),
    getv: (arr, offset) => arr[offset],
    setv: (arr, offset, val) => arr[offset] = val,
    fill: (arr, val) => arr.fill(val)
})
const buffspecs = {
    float32Array: _arraySpec(Float32Array),
    int8Array: _arraySpec(Int8Array),
    charArray: {
        gen: (_, size) => new Int8Array(size),
        getv: (arr, offset) => String.fromCharCode(arr[offset]),
        setv: (arr, offset, val) => arr[offset] = val.charCodeAt(0),
        fill: (arr, val) => arr.fill(val.charCodeAt(0))
    },
    vec2Array: {
        gen: (_, size) => new Float32Array(2*size),
        getv: (arr, offset) => [arr[offset*2], arr[offset*2+1]],
        setv: (arr, offset, val) => { arr[offset*2] = val[0]; arr[offset*2+1] = val[1] },
        fill: (arr, val) => {
            if (val instanceof Array) {
                for (let i = 0; i < arr.length / 2; i++) {
                    arr[i*2] = val[0]
                    arr[i*2+1] = val[1]
                }
            } else {
                arr.fill(val)
            }
        }
    },
    // for writing to canvas
    imageData: (ctx) => ({
        dims: 2,
        gen: (dims) => ctx.createImageData(...dims),
        getv: (imgData, offset) => imgData.slice(offset, 4),
        setv: (imgData, offset, val) => {
            const pixOffset = offset*4
            if (val instanceof Array) {
                imgData.data[pixOffset+0] = val[0]
                imgData.data[pixOffset+1] = val[1]
                imgData.data[pixOffset+2] = val[2]
            } else {
                imgData.data[pixOffset+0] = val
                imgData.data[pixOffset+1] = val
                imgData.data[pixOffset+2] = val
            }   
            imgData.data[pixOffset + 3] = 255                 
        },
        fill: (imgData, val) => {
            if (val instanceof Array) {
                for (let offset = 0; offset < canvas.width * canvas.height; offset++) {
                    const base = offset * 4;
                    imgData.data[base+0] = val[0]
                    imgData.data[base+1] = val[1]
                    imgData.data[base+2] = val[2]
                    imgData.data[base+3] = 255
                }
            }
            else {
                imgData.data.fill(val)
            }
        }
    })
}

// buffspec: { gen, get, set }
//   gen: (dims, size) => Storage[T]
//   getv: (buff, offset) => T
//   setv: (buff, offset, T) => void
//   fill: (buff) => void
class SpaceBuffer {
    // dims: [w,h,..]
    constructor(buffspec, dims) {
        this.buffspec = buffspec
        this.dims = dims

        this.numDims = dims.length
        this.size = dims.accumulate(1, (c,v) => c*v)
        this.buffer = buffspec.gen(dims, this.size)

        if (buffspec.dims && buffspec.dims != this.numDims)
            throw new Error(`buffspec requires ${buffspec.dims} dims, got ${this.numDims}`)

        this.strides = [1]
        for (let d = 0; d < this.numDims - 1; d++) {
            this.strides.push(this.strides[d]*this.dims[d])
        }

        this._sampleCache = {}
        this._tmppos = new Array(this.numDims)
    }

    get width() { this.dims[0] }
    get height() { this.dims[1] }

    get stats() {
        let min = 10000, max = -10000, sum = 0
        for (let i = 0; i < this.size; i++) {
            const v = this.buffspec.getv(this.buffer, i)
            min = Math.min(min, v)
            max = Math.max(max, v)
            sum += v
        }
        const avg = sum / this.size
        return { max, min, avg }
    }

    _assert_sz(arr) {
        if (arr.length != this.dims.length) console.warn("unexpected dims ", arr, ", expected like ", this.dims)
        // NOTE - slow
        // arr.forEach(v => { if (v != Math.round(v)) debugger })
    }

    _offsetFor(pos) {
        let offset = 0
        for (let d = 0; d < this.numDims; d++) {
            let wrapped =
                pos[d] < 0 ? this.dims[d] + pos[d] :
                pos[d] >= this.dims[d] ? pos[d] - this.dims[d] :
                pos[d]
            
            offset += wrapped * this.strides[d]
        }

        return offset

        /*
        o = x | slice = 1
        o = x + y(w) | slice = w
        o = x + y(w) + z(w*h) | slice = w*h


        o = n1 + n2(b1) + n3(b1*b2)
        */
    }

    fill(val) { this.buffspec.fill(this.buffer, val) }

    offsetFor(pos) {
        this._assert_sz(pos)
        return this._offsetFor(pos)
    }

    valueAt(...pos) { return this.valueAtN(pos) }

    valueAtN(pos) {
        this._assert_sz(pos)
        const offset = this._offsetFor(pos)
        return this.buffspec.getv(this.buffer, offset)
    }

    setValueAt(val, ...pos) { return this.setValueAtN(val, pos) }

    setValueAtN(val, pos) {
        this._assert_sz(pos)
        const offset = this._offsetFor(pos)
        return this.buffspec.setv(this.buffer, offset, val)
    }

    // list of values for self and immediate neighbors. values are ascending order by dimension,
    // then position.
    // (eg for 2D, elements returned in order of appearance for a square block, top->down and left->right.)
    // (           eg cell above, then cell left, cell current, cell right, cell below)
    sampleN(pos, { diag = false, dist = 1, incpos = false } = {}) {
        // hard-coded for 2D
        const resultSize = diag ? 9 : 5
        const result = (this._sampleCache[resultSize] = this._sampleCache[resultSize] || new Array(resultSize))
        const tmppos = this._tmppos
        for (let x = 0; x < this.numDims; x++) tmppos[x] = pos[x]
        let i = 0

        tmppos[1] -= 1
        if (diag) {
            tmppos[0] -= 1
            result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
            tmppos[0] += 1
        }
        result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        if (diag) {
            tmppos[0] += 1
            result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
            tmppos[0] -= 1
        }
        tmppos[1] += 1

        tmppos[0] -= 1
        result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        tmppos[0] += 1
        result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        tmppos[0] += 1
        result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        tmppos[0] -= 1

        tmppos[1] += 1
        if (diag) {
            tmppos[0] -= 1
            result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
            tmppos[0] += 1
        }
        result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        if (diag) {
            tmppos[0] += 1
            result[i++] = this.buffspec.getv(this.buffer, this._offsetFor(tmppos))
        }
        return result
    }
}