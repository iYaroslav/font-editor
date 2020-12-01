import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Window, Header, Input, Button, Modal, Footer, useResize } from '@iq/iq-ui-kit'
import { Stage, Layer, Line, Rect, Group } from 'react-konva'
import { times, repeat } from 'ramda'
import ls from 'local-storage'

const R = ({ x, y, s, color }) => <Rect
  x={ x * s + 3 }
  y={ y * s + 3 }
  width={ s - 6 }
  height={ s - 6 }
  fill={ color }
/>

function App() {
  const colors = useMemo(() => ({
    divider: getComputedStyle(document.documentElement).getPropertyValue('--iq-divider'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--iq-accent'),
  }), [])
  const [isModalOpened, setModalOpened] = useState(false)
  const { ref, width, height } = useResize()
  const [options, setOptions] = useState(ls('options') || {
    width: 8,
    height: 8,
  })
  const [size, setSize] = useState({
    w: 1,
    h: 1,
    s: 1,
  })
  const [letter, setLetter] = useState(times(() => repeat(0, options.width), options.height))
  const [mPos, setMPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const s = Math.ceil((Math.min(width, height) * 0.8) / Math.max(options.width, options.height))
    const w = s * options.width
    const h = s * options.height
    setSize({
      s, w, h,
    })
  }, [width, height, options])

  useEffect(() => {
    setLetter(times(() => repeat(0, options.width), options.height))
  }, [options])

  const handleClick = useCallback((e) => {
    const newL = letter.map((v) => [...v])
    const mouseX = Math.floor(e.evt.layerX / size.s)
    const mouseY = Math.floor(e.evt.layerY / size.s)

    newL[mouseY][mouseX] = newL[mouseY][mouseX] ? 0 : 1
    setLetter(newL)
  }, [size, letter])

  const handleMouseMove = useCallback((e) => {
    const mouseX = Math.floor(e.evt.layerX / size.s)
    const mouseY = Math.floor(e.evt.layerY / size.s)

    setMPos({ x: mouseX, y: mouseY })
  }, [size])

  return (
    <Window
      header={ <Header
        title='Font editor'
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
          height: size.h,
        } }>
          <Stage
            width={ size.w }
            height={ size.h }
            onContentClick={ handleClick }
            onContentMouseMove={ handleMouseMove }
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

              { letter.map((line, y) => <Group y={ y * size.s } key={ y }>
                { line.map((v, x) => v ? <R
                  x={ x } y={ 0 } s={ size.s } color={ colors.accent }
                /> : false) }
              </Group>) }

            </Layer>
          </Stage>
        </div>
      </div>

      <Modal
        children={ undefined }
        content={ <>
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
        </> }
        isOpened={ isModalOpened }
        onApply={ (data) => {
          ls('options', data)
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
