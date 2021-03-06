import React, { useMemo, useReducer, useEffect } from 'react'
import { Input, Form } from '@iq/iq-ui-kit'
import Editor from './Editor'

export default function Segment({
  letter, shape, dotSize, dotSpacing,
  backgroundColor, activePixelColor, inactivePixelColor,
}) {
  const [, forceUpdate] = useReducer(x => x + 1, 0, undefined)

  const { width, height } = useMemo(() => {
    return {
      width: letter.width * (dotSize + dotSpacing) + dotSpacing,
      height: letter.height * (dotSize + dotSpacing) + dotSpacing,
    }
  }, [letter.width, letter.height, dotSize, dotSpacing])

  useEffect(() => {
    letter.on('resize', forceUpdate)
    return () => letter.off('resize', forceUpdate)
  }, [letter])

  return <div
    className={ 'segment' }
  >
    <div className={ 'header' }>
      <span className={ 'title' }>
        { letter.title ? letter.title : <span>&nbsp;</span> }
        <small>&nbsp;{ '0x' + letter.title.charCodeAt(0).toString(16).toLocaleUpperCase() }</small>
      </span>

      <div className={ 'preview' }>
        <div style={{
          width: letter.width,
          height: letter.height,
        }} className={ 'img' }>
          <Editor
            editable={ false }
            letter={ letter }
            width={ letter.width }
            height={ letter.height }
            shape={ shape }
            dotSize={ 1 }
            dotSpacing={ 0 }
            primaryColor={ activePixelColor }
            secondaryColor={ 'transparent' }
          />
        </div>
      </div>

      <Form onSubmit={({ width }) => letter.width = width}>
        <Input
          name={ 'width' }
          useKeyboardAction
          checkValidity={ (v) => v > 0 }
          type={ 'number' }
          value={ letter.width }
          onFocus={(e) => e.target.select() }
        />
      </Form>
    </div>

    <div
      className={ 'konva-wrap' }
      style={ {
        background: backgroundColor,
        padding: dotSpacing,
      } }
    >
      <div
        className={ 'konva' }
        style={ { width, height, } }
      >
        <Editor
          letter={ letter }
          width={ width }
          height={ height }
          shape={ shape }
          dotSize={ dotSize }
          dotSpacing={ dotSpacing }
          primaryColor={ activePixelColor }
          secondaryColor={ inactivePixelColor }
        />
      </div>
    </div>
  </div>
}
