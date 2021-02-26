import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Window, Header, Input, Button, Modal, Footer, useResize } from '@iq/iq-ui-kit'
import { Stage, Layer, Line, Rect, Group } from 'react-konva'
import { times, repeat, update, path } from 'ramda'
import ls from 'local-storage'
import pkg from '../package.json'

const R = ({ x, y, s, color }) => {
  const d = Math.round(s * 0.9)

  return <Rect
    x={ x * s + d }
    y={ y * s + d }
    width={ s - d * 2 }
    height={ s - d * 2 }
    fill={ color }
  />
}


const OPTIONS_KEY = 'options_v2'

function App() {
  const stageRef = useRef(undefined)
  const cache = useRef({
    x: 0,
    y: 0,
    lastLetter: undefined,
  })
  const colors = useMemo(() => ({
    divider: getComputedStyle(document.documentElement).getPropertyValue('--iq-divider'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--iq-accent'),
  }), [])
  const [isModalOpened, setModalOpened] = useState(false)
  const { ref, width, height } = useResize()
  const [options, setOptions] = useState(ls(OPTIONS_KEY) || {
    width: 8,
    height: 8,
    fontName: 'default',
    letters: '0123456789',
    scale: 1,
  })
  const [size, setSize] = useState({
    w: 1,
    h: 1,
    s: 1,
  })
  const [mPos, setMPos] = useState({ x: 0, y: 0 })
  const [touched, setTouched] = useState(false)
  const [letterIndex, setLetterIndex] = useState(0)
  const [font, setFont] = useState([])

  useEffect(() => {
    const s = Math.ceil((Math.min(width, height - 68 * 2) * 0.8) / Math.max(options.width, options.height) * options.scale)
    const w = s * options.width
    const h = s * options.height

    console.log(s, w, h)
    setSize({
      s, w, h,
    })
  }, [width, height, options])

  useEffect(() => {
    setFont(times(() => times(() => repeat(0, options.width), options.height), options.letters.length))
    setLetterIndex(0)

    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          setLetterIndex((v) => Math.min(v + 1, options.letters.length - 1))
          break
        case 'ArrowLeft':
          setLetterIndex((v) => Math.max(v - 1, 0))
          break
        default:
          if (e.key.length === 1) {
            const index = options.letters.indexOf(e.key)
            if (index !== -1) setLetterIndex(index)
          }
          break
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [options])

  const updateSymbol = useCallback((x, y) => {
    const line = update(x, cache.current.val, font[letterIndex][y])
    const symbol = update(y, line, font[letterIndex])
    setFont(update(letterIndex, symbol, font))
  }, [letterIndex, font])

  const onDown = useCallback((e) => {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    setTouched(true)

    const { x, y } = stageRef.current.getPointerPosition()
    const sx = Math.max(0, Math.floor(x / size.s))
    const sy = Math.max(0, Math.floor(y / size.s))

    cache.current.val = font[letterIndex][sy][sx] ? 0 : 1
    updateSymbol(sx, sy)
  }, [font, size, updateSymbol, letterIndex])

  const onUp = useCallback((e) => {
    e.evt.preventDefault()
    e.evt.stopPropagation()

    setTouched(false)
  }, [])

  const onMove = useCallback((e) => {
    e.evt.preventDefault()
    e.evt.stopPropagation()

    const { x, y } = stageRef.current.getPointerPosition()
    const sx = Math.max(0, Math.floor(x / size.s))
    const sy = Math.max(0, Math.floor(y / size.s))

    if (cache.current.x === sx && cache.current.y === sy) return
    cache.current.x = sx
    cache.current.y = sy
    setMPos({ x: sx, y: sy })

    if (!touched) return

    updateSymbol(sx, sy)
  }, [touched, size, updateSymbol])

  return (
    <Window
      header={ <Header
        title={ <span>Font editor <small style={ {
          opacity: 0.7,
          fontSize: '60%',
        } }>v{ pkg.version }</small></span> }
        backIcon={ <Button className={ 'header-button' } flat icon={ 'edit' }/> }
        onBack={ () => setModalOpened(true) }
      /> }
      footer={ <Footer>{ mPos.x }, { mPos.y }</Footer> }
      style={ {
        padding: 0,
        display: 'flex',
        flex: 1,
      } }
    >

      <div ref={ ref } className={ 'konva-wrapper' }>
        <div className={ 'konva-container' } style={ {
          width: size.w,
          height: size.h + 68 * 2,
        } }>
          <div className='letter'>
            <Button
              flat
              disabled={ letterIndex === 0 }
              icon='chevron'
              onClick={ () => setLetterIndex((v) => v - 1) }
            />
            <code className='symbol'>
              {
                options.letters.charAt(letterIndex) || ' '
              } {
              ' 0x' + options.letters.charCodeAt(letterIndex).toString(16).toLocaleUpperCase()
            }
            </code>
            <Button
              flat
              icon='chevron'
              disabled={ letterIndex === options.letters.length - 1 }
              onClick={ () => setLetterIndex((v) => v + 1) }
            />
          </div>

          <Stage
            ref={ stageRef }
            width={ size.w }
            height={ size.h }
            onContentTouchStart={ onDown }
            onContentTouchMove={ onMove }
            onContentTouchEnd={ onUp }
            onContentMouseDown={ onDown }
            onContentMouseMove={ onMove }
            onContentMouseUp={ onUp }
          >
            <Layer>
              { times((i) => {
                return <Line
                  key={ i }
                  points={ [i * size.s, 0, i * size.s, size.h] }
                  stroke={ colors.divider }
                  tension={ 1 }
                  strokeWidth={ 0.5 }
                  interactive={ false }
                />
              }, options.width + 1) }

              { times((i) => {
                return <Line
                  key={ i }
                  points={ [0, i * size.s, size.w, i * size.s] }
                  stroke={ colors.divider }
                  tension={ 1 }
                  strokeWidth={ 0.5 }
                  interactive={ false }
                />
              }, options.height + 1) }

              { path([letterIndex, 0, 0], font) !== undefined && font[letterIndex]
                .map((line, y) => <Group y={ y * size.s } key={ y }>
                  { line.map((v, x) => v ? <R
                    key={ `${ x }-${ y }` }
                    x={ x } y={ 0 } s={ size.s } color={ colors.accent }
                  /> : false) }
                </Group>)
              }

            </Layer>
          </Stage>

          <div className='footer'>
            <Button flat>Save</Button>
            <Button flat>Load</Button>
          </div>
        </div>
      </div>

      <Modal
        children={ undefined }
        content={ <>
          <Input
            required
            type='text'
            name='fontName'
            value={ options.fontName }
            placeholder='Font name'
          />

          <Input
            required
            type='text'
            name='letters'
            value={ options.letters }
            placeholder='Used letters'
          />

          <Input
            required
            type='number'
            name='width'
            value={ options.width }
            placeholder='Letter width'
          />

          <Input
            required
            type='number'
            name='height'
            value={ options.height }
            placeholder='Letter height'
          />

          <Input
            required
            type='float'
            name='scale'
            value={ options.scale }
            placeholder='Scale'
          />
        </> }
        isOpened={ isModalOpened }
        onApply={ (data) => {
          ls(OPTIONS_KEY, data)
          setLetterIndex(0)
          setOptions(data)
        } }
        onClose={ () => setModalOpened(false) }
        title={ 'Settings' }
        footerActions={ [{
          key: 'apply',
          title: 'Apply',
          submit: true,
        }] }
      />
    </Window>
  )
}

export default App
