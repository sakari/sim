import * as engine from 'sim-engine'
import { Element } from './element'
import { Labelled } from './label'
import { Text } from './text'
import { Circle } from './circle'

export class Process extends Element {
  label: Labelled

  constructor(private readonly entity: engine.Process<engine.AnyEntity>) {
    super(undefined, true)
    this.label = new Labelled(this.entity.name, new Circle(new Text('process')))
    this.addChild(this.label)
  }
}
