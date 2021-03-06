import { without, indexBy, prop } from 'ramda'

class Letter {
  constructor(symbol, width, height, buffer = undefined) {
    this._symbol = symbol
    this._width = width
    this._height = height
    this._listeners = {}

    this.buffer = new Uint8Array(buffer ? buffer : Math.ceil(width * height / 8))
  }

  get title() { return this._symbol }
  get width() { return this._width }
  get height() { return this._height }

  set width(value) {
    this._width = value
    this.buffer = new Uint8Array(Math.ceil(value * this._height / 8))
    this.emit('resize')
  }

  setBit(x, y, value) {
    if (this.getBit(x, y) === value) return
    const bitIndex = y * this._width + x

    if (value) {
      this.buffer[Math.floor(bitIndex / 8)] |= 1 << (7 - (bitIndex % 8))
    } else {
      this.buffer[Math.floor(bitIndex / 8)] &= ~(1 << (7 - (bitIndex % 8)))
    }

    this.emit('update')
  }

  getBit(x, y) {
    const bitIndex = y * this._width + x
    return this.buffer[Math.floor(bitIndex / 8)] & (1 << (7 - (bitIndex % 8)))
  }

  like(symbol) {
    return symbol.width === this._width && symbol.height === this._height
  }

  mapEachBit(cb) {
    const out = []

    for (let j = 0; j < this.buffer.length; j++) {
      const byte = this.buffer[j]

      for (let i = 0; i < 8; i++) {
        const idx = j * 8 + i
        const y = Math.floor(idx / this._width)
        const x = idx - y * this._width

        out.push(cb(x, y, (byte & (1 << (7 - i))), idx))
      }
    }

    return out
  }

  toString(radix, glue = '\n', prefix = '') {
    let minLen = 0
    if (radix === 2) minLen = 8
    if (radix === 16) minLen = 2
    if (radix === 3) minLen = 2

    let s = ''
    for (const byte of this.buffer) {
      let ss = byte.toString(radix)
      while (ss.length < minLen) ss = '0' + ss
      s += prefix + ss + glue
    }

    return s
  }

  emit(event) {
    if (this._listeners[event]) {
      for (const cb of this._listeners[event]) {
        cb()
      }
    }
  }

  on(event, cb) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }

    this._listeners[event].push(cb)
  }

  off(event, cb) {
    if (!event) {
      this._listeners = {}
    } else if (!cb) {
      this._listeners[event] = []
    } else if (this._listeners[event]) {
      this._listeners[event] = without(cb, this._listeners[event])
    }
  }
}

function strToLetters(width, height, letters, current = []) {
  const oldSymbols = indexBy(prop('title'), current)

  return letters.split('').map((v) => {
    const symbol = new Letter(v, width, height)
    return (oldSymbols[v] && oldSymbols[v].like(symbol)) ? oldSymbols[v] : symbol
  })
}

export {
  strToLetters
}

export default Letter
