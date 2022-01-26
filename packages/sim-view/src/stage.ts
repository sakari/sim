import { Element, Update } from './element'
import { RelativePoint, worldPoint } from './point'
import { Elemental } from './elemental'

const ns = 'http://www.w3.org/2000/svg'

export class Stage implements Elemental {
  view: SVGElement
  draw: SVGGraphicsElement
  dragging?: {
    offset: RelativePoint
    entity: Element
  }
  panning?: { startX: number; startY: number }
  window = { x: 0, y: 0 }
  dragPoint?: { x: number; y: number }
  elements: Set<Element> = new Set()

  constructor() {
    this.view = document.createElementNS(ns, 'svg') as any
    this.view.setAttributeNS(null, 'width', '' + window.innerWidth)
    this.view.setAttributeNS(null, 'height', '' + window.innerHeight)
    this.view.setAttributeNS(null, 'style', 'background-color:#fafafa')
    this.view.addEventListener('mousedown', this.mousedown.bind(this))
    this.view.addEventListener('mouseup', this.dragStop.bind(this))
    this.view.addEventListener('mouseleave', this.dragStop.bind(this))
    this.view.addEventListener('mousemove', this.mousemove.bind(this))
    this.draw = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    const arrowDefs = document.createElementNS(ns, 'defs')
    const arrowHead = document.createElementNS(ns, 'marker')
    arrowHead.setAttributeNS(null, 'id', 'arrowhead')
    arrowHead.setAttributeNS(null, 'markerWidth', '10')
    arrowHead.setAttributeNS(null, 'markerHeight', '7')
    arrowHead.setAttributeNS(null, 'refX', '0')
    arrowHead.setAttributeNS(null, 'refY', '3.5')
    arrowHead.setAttributeNS(null, 'orient', 'auto')
    const arrowPoly = document.createElementNS(ns, 'polygon')
    arrowPoly.setAttributeNS(null, 'points', '0 0, 10 3.5, 0 7')
    arrowHead.appendChild(arrowPoly)
    arrowDefs.appendChild(arrowHead)
    this.view.appendChild(arrowDefs)

    this.view.appendChild(this.draw)
  }

  addChild(element: Element, atX = 0, atY = 0) {
    this.elements.add(element)
    element.add(this, atX, atY)
  }

  onRemoveChild(e: Element) {
    this.elements.delete(e)
  }

  removeChild(element: Element) {
    element.remove()
    this.elements.delete(element)
  }

  update(update: Update) {
    for (const element of this.elements) {
      element.update(update)
    }
  }

  addRoot(e: Element) {
    this.addChild(e)
  }

  mousemove(event: MouseEvent) {
    if (this.dragging) {
      const w = worldPoint(
        event.offsetX - this.dragging.offset.p.x,
        event.offsetY - this.dragging.offset.p.y
      )
      if (
        this.dragging.entity.draw !== this.draw.lastElementChild &&
        this.dragging.entity.dragToTop
      ) {
        this.draw.insertBefore(this.dragging.entity.draw, null)
      }
      this.dragging.entity.drag(w)
    } else if (this.panning) {
      this.window.x += event.offsetX - this.panning.startX
      this.window.y += event.offsetY - this.panning.startY
      this.panning.startX = event.offsetX
      this.panning.startY = event.offsetY
      this.draw.setAttributeNS(null, 'transform', `translate(${this.window.x}, ${this.window.y})`)
    }
  }

  mousedown(event: MouseEvent) {
    const drag = hitDraggable(this.elements, event)
    if (drag) {
      this.dragging = drag
      this.dragging.entity.dragStart(worldPoint(event.offsetX, event.offsetY))
      return
    }
    this.panning = { startX: event.offsetX, startY: event.offsetY }
  }
  dragStop() {
    if (this.dragging) {
      this.dragging.entity.dragStop()
      this.dragging = undefined
    }
    this.panning = undefined
  }
}

function hitDraggable(
  elements: Set<Element>,
  event: MouseEvent
): undefined | { offset: RelativePoint; entity: Element } {
  for (const element of elements) {
    const hit = element.hit(event.offsetX, event.offsetY)
    if (hit) {
      if (element.draggable) {
        return { offset: hit, entity: element }
      } else {
        const child = hitDraggable(element.children, event)
        if (child) {
          return child
        }
      }
    }
  }
}
