import { Element } from './element'
import { pointEqual, RelativePoint, toLocal, toWorld, worldPoint } from './point'
import { intersection, Line, Rect } from './intersect'

export class Arrow extends Element {
  private readonly from: Element
  private readonly to: Element
  private cachedFrom?: RelativePoint
  private cachedTo?: RelativePoint
  private line: SVGGraphicsElement

  constructor(from: Element, to: Element) {
    super(undefined, false)
    const svgNS = 'http://www.w3.org/2000/svg'
    const line = document.createElementNS(svgNS, 'line')
    line.setAttributeNS(null, 'stroke', '#000')
    line.setAttributeNS(null, 'stroke-width', '1')
    line.setAttributeNS(null, 'marker-end', 'url(#arrowhead)')
    this.line = line
    this.from = from
    this.to = to
    this.draw.appendChild(this.line)
  }

  add(parent: Element, _atX: number, _atY: number) {
    super.add(parent, 0, 0)
    this.update()
  }

  move() {
    // nop
  }

  withMargin(draw: SVGGraphicsElement): Rect {
    const padding = 10
    const rectBox = draw.getBoundingClientRect()
    return {
      kind: 'rect',
      at: { x: rectBox.x - padding, y: rectBox.y - padding },
      width: rectBox.width + padding * 2,
      height: rectBox.height + padding * 2
    }
  }

  update() {
    const toCenter = toWorld(this.to.center())
    const fromCenter = toWorld(this.from.center())
    const toRect = this.withMargin(this.to.draw)
    const fromRect = this.withMargin(this.from.draw)

    const line: Line = { kind: 'line', from: fromCenter, to: toCenter }
    const [toPoint] = intersection(line, toRect)
    const [fromPoint] = intersection(line, fromRect)

    if (!toPoint || !fromPoint) {
      return
    }

    const arrowStart = toLocal(this, worldPoint(fromPoint.x, fromPoint.y))
    const arrowEnd = toLocal(this, worldPoint(toPoint.x, toPoint.y))

    if (pointEqual(arrowEnd, this.cachedTo) && pointEqual(arrowStart, this.cachedFrom)) {
      return
    }
    this.cachedFrom = arrowStart
    this.cachedTo = arrowEnd
    this.line.setAttributeNS(null, 'x1', '' + arrowStart.p.x)
    this.line.setAttributeNS(null, 'y1', '' + arrowStart.p.y)
    this.line.setAttributeNS(null, 'x2', '' + arrowEnd.p.x)
    this.line.setAttributeNS(null, 'y2', '' + arrowEnd.p.y)
  }
}
