import React, { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react'
import { Window, Header, Input, Button, Modal, Select } from '@iq/iq-ui-kit'
import ls from 'local-storage'
import lz from 'lz-string'
import Letter, { strToLetters } from './Letter'
import pkg from '../package.json'
import Segment from './Segment'
import lettersToCCode from './utils/lettersToCCode'

const OPTIONS_KEY = 'options_v3.5'

const optionsScheme = [
  ['Font Name', 'default', 'fontName', 'text'],
  ['Default letter width', 8, 'width', 'number'],
  ['Letter height', 8, 'height', 'number'],
  ['Letters', ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}', 'letters', 'text'],
  ['Dot size (in pixels)', 32, 'dotSize', 'number'],
  ['Dot spacing (in pixels)', 4, 'dotSpacing', 'number'],
  ['Shape', 'square', 'shape', 'choose', { 'square': 'Square', 'circle': 'Circle' }],
  ['Active Pixel color', '#58AC30', 'activePixelColor', 'choose', {
    '#58AC30': 'Green',
    '#F44336': 'Red',
    '#FF9800': 'Orange',
    '#14B0F0': 'Blue',
    '#FFFFFF': 'White',
    'hsla(0,0%,49.4%,0.8)': 'Gray',
  }],
]

const defaultOptions = {}
optionsScheme.forEach(([, value, key]) => defaultOptions[key] = value)

function generateFont(letters, options) {
  switch (options.type) {
    case 'C':
      lettersToCCode(letters, options)
      break;
    case 'Espruino':

      break;
    default:
      break;
  }
}

function App() {
  const [, forceUpdate] = useReducer(x => x + 1, 0, undefined);
  const [isModalOpened, setModalOpened] = useState(false)
  const [isDownloadModalOpened, setDownloadModalOpened] = useState(false)
  const [options, setOptions] = useState(ls(OPTIONS_KEY) || defaultOptions)
  const cache = useRef({})
  /** @type { MutableRefObject<Letter[]> } */
  const letters = useRef([])

  const optionsKey = useMemo(() => {
    clearTimeout(cache.current.store)
    return lz.compressToBase64(options.fontName + options.width + options.height + options.letters)
  }, [options])

  const store = useCallback(() => {
    clearTimeout(cache.current.store)

    cache.current.store = setTimeout(() => {
      const data = letters.current.map((l) => [
        l.title,
        l.width,
        l.height,
        l.buffer
      ])

      // noinspection JSUnresolvedFunction
      ls(optionsKey, lz.compressToBase64(JSON.stringify(data)))
    }, 1000)
  }, [optionsKey])

  useEffect(() => {
    let newLetters = []
    const c = cache.current, o = options
    if (c.letters !== o.letters || c.width !== o.width || c.height !== o.height) {
      c.letters = o.letters
      c.width = o.width
      c.height = o.height

      try {
        // noinspection JSUnresolvedFunction
        newLetters = JSON
          .parse(lz.decompressFromBase64(ls(optionsKey)))
          .map(([symbol, width, height, buffer]) => new Letter(symbol, width, height, Object.values(buffer)))
      } catch (ignored) {
        newLetters = strToLetters(options.width, options.height, options.letters, letters.current, 'UPD')
      }

      letters.current = newLetters

      newLetters.forEach((l) => {
        l.on('update', store)
        l.on('resize', store)
      })
      forceUpdate()
      return () => {
        newLetters.forEach((l) => {
          l.off('update', store)
          l.off('resize', store)
        })
      }
    }
  }, [optionsKey, options, store])

  useEffect(() => {
    // setFont(times(() => times(() => repeat(0, options.width), options.height), options.letters.length))
    // setLetterIndex(0)

    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          // setLetterIndex((v) => Math.min(v + 1, options.letters.length - 1))
          break
        case 'ArrowLeft':
          // setLetterIndex((v) => Math.max(v - 1, 0))
          break
        default:
          if (e.key.length === 1) {
            // const index = options.letters.indexOf(e.key)
            // if (index !== -1) setLetterIndex(index)
          }
          break
      }
    }

    // TODO scroll to letter
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [options.letters])

  return (
    <Window
      header={ <Header
        title={ <span>Font editor <small style={ {
          opacity: 0.7,
          fontSize: '60%',
        } }>v{ pkg.version }</small></span> }
        backIcon={ <Button className={ 'header-button' } flat icon={ 'menu' }/> }
        onBack={ () => setModalOpened(true) }
        extra={ <Button flat title={"Download"} onClick={() => setDownloadModalOpened(true)} /> }
      /> }
      style={ {
        padding: 0,
        display: 'flex',
        flex: 1,
      } }
    >

      <div className={ 'segments-wrapper' }>
        { letters.current.map((letter, i) => <Segment
          key={ i }
          letter={ letter }
          shape={ options.shape }
          dotSize={ options.dotSize }
          dotSpacing={ options.dotSpacing }
          backgroundColor={ 'rgba(0, 0, 0, 0.3)' }
          activePixelColor={ options.activePixelColor }
          inactivePixelColor={ 'hsla(0, 0%, 49.4%, 0.3)' }
        />) }
      </div>

      <Modal
        children={ undefined }
        content={ <>
          { optionsScheme.map(([title, , key, type, values], i) => {
            if (type === 'choose') {
              return <Select
                key={ i }
                required
                entries={ Object.keys(values) }
                render={ (key) => ({ key, title: values[key] }) }
                name={ key }
                value={ options[key] }
                placeholder={ title }
              />
            }

            return <Input
              required
              key={ i }
              type={ type }
              name={ key }
              value={ options[key] }
              placeholder={ title }
            />
          }) }
        </> }
        isOpened={ isModalOpened }
        onApply={ (data) => {
          ls(OPTIONS_KEY, data)
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

      <Modal
        children={ undefined }
        content={ <>
          <Select
            required
            entries={['C', 'Espruino']}
            value={ls('last_export_type') || 'C'}
            render={(key) => ({ key, title: key })}
            name={ 'type' } />
        </> }
        isOpened={ isDownloadModalOpened }
        onApply={ (data) => {
          ls('last_export_type', data.type)
          generateFont(letters.current, {
            ...data,
            ...options,
          })
        } }
        onClose={ () => setDownloadModalOpened(false) }
        title={ 'Download' }
        footerActions={ [{
          key: 'apply',
          title: 'Download',
          submit: true,
        }] }
      />
    </Window>
  )
}

export default App
