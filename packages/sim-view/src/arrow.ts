import { Element, Update } from './element'
import { Text } from './text'
import { pointEqual, Rect, rectEqual, toLocal, toWorld, WorldPoint, worldPoint } from './point'
import { intersection, Shape, toPath } from './intersect'

class ArrowHandle extends Element {
  text: Text
  dragPoint?: WorldPoint
  moved = false
  constructor(label: string) {
    super(undefined, true, false)
    this.text = new Text(label)
    this.addChild(this.text)
  }
  set(label: string) {
    this.text.set(label)
  }
  dragStart() {
    this.moved = true
  }
}

let arrowIds = 0

export class Arrow extends Element {
  private readonly from: Element
  to: Element
  private cache?: {
    label: WorldPoint
    from: Rect<WorldPoint>
    to: Rect<WorldPoint>
  }
  private line: SVGGraphicsElement
  private label: ArrowHandle
  id: string

  constructor(from: Element, to: Element, label: string) {
    super(undefined, false)
    const svgNS = 'http://www.w3.org/2000/svg'
    const line = document.createElementNS(svgNS, 'path')
    line.setAttributeNS(null, 'stroke', '#000')
    line.setAttributeNS(null, 'fill', 'none')
    line.setAttributeNS(null, 'stroke-width', '1')
    line.setAttributeNS(null, 'marker-end', 'url(#arrowhead)')
    this.line = line
    this.from = from
    this.to = to
    this.draw.appendChild(this.line)
    this.label = new ArrowHandle(label)
    this.addChild(this.label)
    this.id = '' + arrowIds++
  }

  withMargin(rectBox: Rect<WorldPoint>, padding = 10) {
    return {
      kind: 'rect' as const,
      at: { x: rectBox.p.x - padding, y: rectBox.p.y - padding },
      width: rectBox.width + padding * 2,
      height: rectBox.height + padding * 2
    }
  }

  set(props: { label?: string; to?: Element }): this {
    if (props.to) {
      this.to = props.to
    }

    if (props.label) {
      if (!this.label) {
        this.label = new ArrowHandle(props.label)
        const center = this.center()
        this.addChild(this.label, center.p.x, center.p.y)
      } else {
        this.label.set(props.label)
      }
    }
    return this
  }

  update(_update: Update) {
    this.onRender()
  }

  onRender() {
    const toBounds = this.to.bounds()
    const fromBounds = this.from.bounds()
    const label = this.label.position()
    if (this.cache) {
      if (
        rectEqual(this.cache.to, toBounds) &&
        rectEqual(this.cache.from, fromBounds) &&
        pointEqual(this.cache.label, label)
      ) {
        return
      }
    }
    this.cache = { to: toBounds, from: fromBounds, label }

    const toCenter = worldPoint(
      toBounds.p.x + toBounds.width / 2,
      toBounds.p.y + toBounds.height / 2
    )
    const fromCenter = worldPoint(
      fromBounds.p.x + fromBounds.width / 2,
      fromBounds.p.y + fromBounds.height / 2
    )
    const toRect = this.withMargin(toBounds)
    const fromRect = this.withMargin(fromBounds, 0)

    if (!this.label.moved) {
      const start = toLocal(this, fromCenter)
      const end = toLocal(this, toCenter)
      this.label.moveRelative((start.p.x + end.p.x) / 2, (start.p.y + end.p.y) / 2)
    }
    const controlPoint = quadControlPoint(fromCenter, toCenter, this.label!.position())
    const line: Shape = {
      kind: 'quad',
      from: fromCenter,
      to: toCenter,
      control: controlPoint
    }
    const [toPoint] = intersection(line, toRect)
    const [fromPoint] = intersection(line, fromRect)

    if (!toPoint || !fromPoint) {
      return
    }

    const arrowStart = toLocal(this, worldPoint(fromPoint.x, fromPoint.y))
    const arrowEnd = toLocal(this, worldPoint(toPoint.x, toPoint.y))

    const arrowControlPoint = quadControlPoint(
      toWorld(arrowStart),
      toWorld(arrowEnd),
      this.label!.position()
    )
    const arrow: Shape = {
      kind: 'quad',
      from: arrowStart.p,
      to: arrowEnd.p,
      control: toLocal(this, arrowControlPoint).p
    }
    this.line.setAttributeNS(null, 'd', toPath(arrow))
  }
}

function quadControlPoint(a: WorldPoint, b: WorldPoint, midpoint: WorldPoint): WorldPoint {
  return worldPoint((midpoint.x * 4 - a.x - b.x) / 2, (midpoint.y * 4 - a.y - b.y) / 2)
}
