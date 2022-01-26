import { Element } from './element'

const svgNS = 'http://www.w3.org/2000/svg'

export class Circle extends Element {
  body: SVGGraphicsElement

  constructor(private readonly element: Element) {
    super()
    this.body = document.createElementNS(svgNS, 'circle')
    this.body.setAttributeNS(null, 'fill', 'cyan')
    this.body.setAttributeNS(null, 'stroke', 'none')
    this.draw.appendChild(this.body)
    this.addChild(this.element)
  }

  onRender() {
    const bounds = this.element.draw.getBBox()
    const r = Math.max(bounds.width, bounds.height) / 2
    this.element.moveRelative(0, r - bounds.height / 2)
    this.body.setAttributeNS(null, 'cx', '' + r)
    this.body.setAttributeNS(null, 'cy', '' + r)
    this.body.setAttributeNS(null, 'r', '' + r)
  }
}
