import * as engine from 'sim-engine'
import { Element, Update } from './element'
import { Grid } from './grid'
import { Text } from './text'
import { Labelled } from './label'
import { Box } from './box'
import { Arrow } from './arrow'
import { AnyEntity } from 'sim-engine'

export class Entity extends Element {
  private readonly entity: engine.AnyEntity
  private label: Labelled
  private grid: Grid
  private arrows: Map<string, { element: Arrow; entity: AnyEntity }> = new Map()

  constructor(entity: engine.AnyEntity) {
    super(undefined, true)

    this.grid = new Grid(
      Object.entries(entity.state as any).map(([label, value]) => ({
        label: new Text(label),
        value: new Text('' + value)
      }))
    )
    const box = new Box(this.grid)
    this.label = new Labelled(entity.name, box)
    this.addChild(this.label)

    this.entity = entity
  }

  remove() {
    for (const [, arrow] of this.arrows) {
      arrow.element.remove()
    }
    super.remove()
  }

  update(update: Update) {
    this.render()
    const refs = new Map()
    const text = separateReferences(this.entity.state, refs, [])
    this.grid.set(
      Object.entries(text as any).map(([label, value]) => ({
        label: new Text(label),
        value: new Text('' + value)
      }))
    )
    for (const [label, arr] of this.arrows) {
      const to = refs.get(label)
      if (!to || arr.entity !== to) {
        arr.element.remove()
        this.arrows.delete(label)
      }
    }
    for (const [label, to] of refs) {
      const arr = this.arrows.get(label)
      const toElement = update.entities.get(to)
      if (!arr) {
        if (toElement) {
          const a = new Arrow(this, toElement, label)
          this.addRoot(a)
          this.arrows.set(label, { element: a, entity: to })
          a.update(update)
        }
      }
    }
  }
}

function separateReferences(
  state: engine.EntityState,
  map: Map<string, engine.AnyEntity>,
  prop: string[]
): engine.EntityState {
  if (Array.isArray(state)) {
    const mapped = state.map((e, i) => separateReferences(e, map, [...prop, '' + i]))
    if (mapped.some(m => m === undefined)) {
      return undefined
    }
    return mapped
  }
  if (state instanceof engine.Entity) {
    map.set(prop.join('.'), state)
    return undefined
  }

  if (state && typeof state === 'object') {
    const newState: engine.EntityState = {}
    Object.entries(state).forEach(([p, value]) => {
      const r = separateReferences(value, map, [...prop, p])
      if (r !== undefined) {
        newState[p] = r
      }
    })
    return newState
  }
  return state
}
