import { Rect, relativePoint, RelativePoint, toLocal, worldPoint, WorldPoint } from './point'
import { Elemental } from './elemental'
import * as engine from 'sim-engine'

let elementIds = 0
function getElementId() {
  return `element-${elementIds++}`
}

export type Update = {
  entities: Map<engine.AnyEntity, Element>
}

export class Element implements Elemental {
  draw: SVGGraphicsElement
  parent?: Elemental
  elementId: string
  children: Set<Element> = new Set()

  constructor(
    graph: SVGGraphicsElement | undefined = undefined,
    public draggable = false,
    public dragToTop = true
  ) {
    const svgNS = 'http://www.w3.org/2000/svg'
    const draw = document.createElementNS(svgNS, 'g')
    if (graph) {
      draw.appendChild(graph)
    }
    this.draw = draw
    this.draw.setAttributeNS(null, 'transform', `translate(0,0)`)
    this.elementId = getElementId()
    this.draw.setAttributeNS(null, 'id', this.elementId)
  }

  add(parent: Elemental, relativeX: number, relativeY: number) {
    this.parent = parent
    this.draw.setAttributeNS(null, 'transform', `translate(${relativeX}, ${relativeY})`)
    this.parent.draw.appendChild(this.draw)
  }

  remove() {
    this.removeAllChildren()
    this.draw.remove()
    this.parent?.onRemoveChild(this)
  }

  render() {
    for (const child of this.children) {
      child.render()
    }
    this.onRender()
  }

  onRender() {
    // nop
  }

  onRemoveChild(child: Element) {
    this.children.delete(child)
  }

  removeChild(child: Element) {
    child.remove()
    this.children.delete(child)
    return this
  }

  addRoot(element: Element) {
    this.parent?.addRoot(element)
  }

  removeAllChildren() {
    for (const child of this.children) {
      this.removeChild(child)
    }
  }

  addChild(child: Element, relativeX = 0, relativeY = 0) {
    child.add(this, relativeX, relativeY)
    this.children.add(child)
    return this
  }

  update(_update: Update) {
    this.render()
  }

  center(): RelativePoint {
    const box = this.draw.getBBox()
    return relativePoint(this, box.width / 2, box.height / 2)
  }

  bounds(): Rect<WorldPoint> {
    const b = this.draw.getBBox()
    const ctm = this.draw.getCTM()!
    const point = new DOMPoint(b.x, b.y)
    const viewPortPoint = point.matrixTransform(ctm)
    return { p: worldPoint(viewPortPoint.x, viewPortPoint.y), width: b.width, height: b.height }
  }

  position(): WorldPoint {
    return this.bounds().p
  }

  hit(worldX: number, worldY: number): RelativePoint | null {
    const rect = this.bounds()
    const hit =
      rect.p.x < worldX &&
      rect.p.y < worldY &&
      rect.p.x + rect.width > worldX &&
      rect.p.y + rect.height > worldY
    if (!hit) {
      return null
    }
    const offset = relativePoint(this, worldX - rect.p.x, worldY - rect.p.y)
    return offset
  }

  moveRelative(x: number, y: number) {
    this.draw.setAttributeNS(null, 'transform', `translate(${x}, ${y})`)
  }

  dragStart(_point: WorldPoint) {
    // nop
  }

  dragStop() {
    // nop
  }

  drag(point: WorldPoint) {
    const to = toLocal(this.parent!, point)
    this.moveRelative(to.p.x, to.p.y)
  }
}
