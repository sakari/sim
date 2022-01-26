import { Element } from './element'

const svgNS = 'http://www.w3.org/2000/svg'

export class Box extends Element {
  body: SVGGraphicsElement

  constructor(private readonly element: Element) {
    super(undefined, false)
    this.body = document.createElementNS(svgNS, 'rect')
    this.body.setAttributeNS(null, 'width', '' + 50)
    this.body.setAttributeNS(null, 'height', '' + 50)
    this.body.setAttributeNS(null, 'fill', '#b9f3e7')
    this.body.setAttributeNS(null, 'stroke', 'none')
    this.draw.appendChild(this.body)
    this.addChild(this.element)
  }

  onRender() {
    const bounds = this.element.draw.getBBox()
    this.body.setAttributeNS(null, 'width', '' + bounds.width)
    this.body.setAttributeNS(null, 'height', '' + bounds.height)
  }
}
