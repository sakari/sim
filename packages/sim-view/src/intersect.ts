import intersect from 'path-intersection'

export type Point = { x: number; y: number }
export type Line = { kind: 'line'; from: Point; to: Point }
export type Quad = { kind: 'quad'; from: Point; to: Point; control: Point }
export type Rect = { kind: 'rect'; at: Point; width: number; height: number }
export type Shape = Line | Rect | Quad

export function toPath(shape: Shape) {
  switch (shape.kind) {
    case 'quad':
      return `M ${shape.from.x} ${shape.from.y} Q ${shape.control.x} ${shape.control.y}, ${shape.to.x}, ${shape.to.y}`
    case 'line':
      return `M ${shape.from.x} ${shape.from.y} L ${shape.to.x} ${shape.to.y}`
    case 'rect':
      return `M ${shape.at.x} ${shape.at.y} h ${shape.width} v ${shape.height} h ${-shape.width} z`
  }
}

export function intersection(a: Shape, b: Shape): Array<Point> {
  return intersect(toPath(a), toPath(b))
}
