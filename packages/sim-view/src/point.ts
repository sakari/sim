import { Elemental } from './elemental'

export type Point = DOMPointReadOnly

enum Relative {}
enum World {}

export type RelativePoint = { p: Point; element: Elemental } & Relative
export type WorldPoint = Point & World

export function pointTostr(p: RelativePoint | WorldPoint): string {
  if ('element' in p) {
    return `local(${p.p.x}, ${p.p.y})`
  }
  return `world(${p.x}, ${p.y})`
}

function isRelative(p: RelativePoint | WorldPoint): p is RelativePoint {
  return 'element' in p
}

export function pointEqual<P extends WorldPoint | RelativePoint>(a?: P, b?: P) {
  if (!a || !b) {
    return a === b
  }
  if (isRelative(a)) {
    if (!isRelative(b)) {
      return false
    }
    return a.p.x === b.p.x && a.p.y === b.p.y && b.element === a.element
  }
  if (isRelative(b)) {
    return false
  }
  return a.x === b.x && a.y === b.y
}

export function toLocal(element: Elemental, p: WorldPoint): RelativePoint {
  return { p: p.matrixTransform(element.draw.getCTM()!.inverse()), element } as RelativePoint
}

export function toWorld(p: RelativePoint): WorldPoint {
  return p.p.matrixTransform(p.element.draw.getCTM()!) as WorldPoint
}

export function relativePoint(element: Elemental, x: number, y: number): RelativePoint {
  return { p: new DOMPoint(x, y), element } as RelativePoint
}

export function worldPoint(x: number, y: number): WorldPoint {
  return new DOMPoint(x, y) as WorldPoint
}
