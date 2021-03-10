import { Stage, Layer, Rect, Circle } from 'react-konva'
import React, { useRef, useCallback, useReducer, useEffect } from 'react'

function Shape({ x, y, s, color, shape }) {
  if (s < 3) {
    return <Rect
      listening={ false }
      fill={ color }
      x={ x }
      y={ y }
      width={ s }
      height={ s }
    />
  }

  if (shape === 'circle') {
    return <Circle
      listening={ false }
      fill={ color }
      radius={s / 2}
      x={ x + s / 2 }
      y={ y + s / 2 }
    />
  }

  return <Rect
    listening={ false }
    fill={ color }
    x={ x }
    y={ y }
    width={ s }
    height={ s }
    cornerRadius={ 2 }
  />
}

let drawMode = false
let bit = false

export default function Editor({
  width, height, letter, shape, primaryColor, secondaryColor, dotSize, dotSpacing, editable
}) {
  const [, forceUpdate] = useReducer(x => x + 1, 0, undefined);
  const stageRef = useRef(undefined)

  const onUp = useCallback((e) => {
    if (e.evt) {
      e.evt.preventDefault()
      e.evt.stopPropagation()
    }

    drawMode = false
    document.removeEventListener("mouseup", onUp)
    document.removeEventListener("touchcancel", onUp);
  }, [])

  const getLetterCoords = useCallback(() => {
    // noinspection JSUnresolvedFunction
    const { x, y } = stageRef.current.getPointerPosition()

    return {
      x: Math.min(Math.max(Math.floor((x / width) * letter.width), 0), letter.width - 1),
      y: Math.min(Math.max(Math.floor((y / height) * letter.height), 0), letter.height - 1),
    }
  }, [letter, width, height])

  const onDown = useCallback(() => {
    const { x, y } = getLetterCoords()
    letter.setBit(x, y, bit = !letter.getBit(x, y))
    drawMode = true;
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchcancel", onUp);
  }, [letter, getLetterCoords, onUp])

  const onMove = useCallback((e) => {
    if (!drawMode) return;
    e.evt.preventDefault()
    e.evt.stopPropagation()

    const { x, y } = getLetterCoords()
    letter.setBit(x, y, bit)
  }, [letter, getLetterCoords])

  useEffect(() => {
    letter.on('update', forceUpdate)
    return () => letter.off('update', forceUpdate)
  }, [letter])

  return <Stage
    ref={ stageRef }
    width={ width }
    height={ height }
    onContentTouchStart={ onDown }
    onContentTouchMove={ onMove }
    onContentTouchEnd={ onUp }
    onContentMouseDown={ onDown }
    onContentMouseMove={ onMove }
    onContentMouseUp={ onUp }
  >
    <Layer>
      { letter.mapEachBit((x, y, isSet, index) => <Shape
        key={ index }
        color={ isSet ? primaryColor : secondaryColor }
        x={ dotSpacing + (x * (dotSize + dotSpacing)) }
        y={ dotSpacing + (y * (dotSize + dotSpacing)) }
        s={ dotSize }
        shape={ shape }
      />) }
    </Layer>
  </Stage>
}
