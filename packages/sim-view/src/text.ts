import { Element } from './element'

const svgNS = 'http://www.w3.org/2000/svg'

export function text(str: string): SVGGraphicsElement {
  const text = document.createElementNS(svgNS, 'text')
  text.setAttributeNS(null, 'dominant-baseline', 'hanging')
  text.setAttributeNS(null, 'fill', 'black')
  text.textContent = str
  return text
}
export class Text extends Element {
  text: SVGGraphicsElement
  constructor(t: string, draggable = false) {
    const label = text(t)
    super(label, draggable)
    this.text = label
  }
  set(t: string) {
    this.text.textContent = t
  }
}
