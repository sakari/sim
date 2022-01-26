import * as engine from 'sim-engine'
import { Element } from './element'
import { Grid } from './grid'
import { Text } from './text'
import { Labelled } from './label'
import { Box } from './box'

export class Entity extends Element {
  private readonly entity: engine.AnyEntity
  private label: Labelled
  private grid: Grid

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

  update() {
    this.grid.set(
      Object.entries(this.entity.state as any).map(([label, value]) => ({
        label: new Text(label),
        value: new Text('' + value)
      }))
    )
  }
}
