import { snakeCase } from "change-case"
import fd from 'js-file-download'

/**
 * @param letters {Letter[]}
 * @param options {Object}
 */
export default function lettersToCCode(letters, { fontName }) {
  let maxBytes = 0
  let maxWidth = letters[0].width
  let maxHeight = letters[0].height
  let fixedWidth = true
  let bytesCount = 0

  const widths = []
  const meta = []

  for (const letter of letters) {
    widths.push(letter.width)
    meta.push([bytesCount, letter.buffer.length])
    bytesCount += letter.buffer.length

    if (maxWidth !== letter.width) fixedWidth = false
    maxWidth = Math.max(maxWidth, letter.width)
    maxBytes = Math.max(maxBytes, letter.buffer.length)
  }
  bytesCount -= letters[letters.length - 1].buffer.length

  const f = snakeCase(`${fontName}_${maxWidth}x${maxHeight}`)

  let content = `/** 
 * ${ maxWidth }x${ maxHeight } monochrome bitmap font for rendering
 * Author: {TODO add author from account}
 * 
 * License: Public Domain
 * 
 * Generated on:
 * https://make-font.yaroslav.uz
 **/

// ${ fixedWidth ? 'Fixed' : 'Dynamic' } width font ${ f }
`

  // TODO generate comments like:
  // Constant: font8x8_basic
  // Contains an 8x8 font map for unicode points U+0000 - U+007F (basic latin)

  if (!fixedWidth) {
    content += `const unsigned char ${ f }_widths[${ letters.length }] = { ${ widths.join(', ') } }; \n`
    content += `const unsigned char ${ f }_meta[${ letters.length }][2] = { ${ meta.map(([a, b]) => `{ ${a}, ${b} }`).join(', ') } }; \n`
  }

  content += `const unsigned char ${ f }[${ bytesCount }] = {\n`

  const sLen = maxBytes * '0x00, '.length
  for (const l of letters) {
    const char = l.title.charCodeAt(0)
    let hex = char.toString(16)
    if (hex.length < 2) hex = '0' + hex
    let s = l.toString(16, ', ', '0x')
    while (s.length < sLen) s += ' '

    content += `  ${s}// ${ l.title.length ? l.title : ' ' } 0x${ hex } ${ char }\n`
  }

  content += '};\n'

  fd(content, f + '.c')
}
