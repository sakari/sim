import { pointTostr, relativePoint, RelativePoint, toLocal, WorldPoint } from './point'
import { Elemental } from './elemental'

let elementIds = 0
function getElementId() {
  return `element-${elementIds++}`
}

export class Element implements Elemental {
  draw: SVGGraphicsElement
  parent?: Elemental
  elementId: string
  children: Set<Element> = new Set()

  constructor(graph: SVGGraphicsElement | undefined, public draggable: boolean) {
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

  removeChild(child: Element) {
    child.draw.remove()
    this.children.delete(child)
    return this
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

  // recalculate entity contents
  update() {
    // nop
  }

  // implement to recalculate rendering if needed
  onRender() {
    // nop
  }

  render() {
    for (const child of this.children) {
      child.render()
    }
    this.onRender()
  }

  center(): RelativePoint {
    const box = this.draw.getBBox()
    return relativePoint(this, box.width / 2, box.height / 2)
  }

  hit(worldX: number, worldY: number): RelativePoint | null {
    const rect = this.draw.getBoundingClientRect()
    const hit =
      rect.x < worldX &&
      rect.y < worldY &&
      rect.x + rect.width > worldX &&
      rect.y + rect.height > worldY
    if (!hit) {
      return null
    }
    const offset = relativePoint(this, worldX - rect.x, worldY - rect.y)
    return offset
  }

  moveRelative(x: number, y: number) {
    this.draw.setAttributeNS(null, 'transform', `translate(${x}, ${y})`)
  }

  move(point: WorldPoint) {
    const to = toLocal(this.parent!, point)
    this.draw.setAttributeNS(null, 'transform', `translate(${to.p.x}, ${to.p.y})`)
  }
}
