import * as engine from 'sim-engine'
import { Element, Update } from './element'
import { Labelled } from './label'
import { Text } from './text'
import { Circle } from './circle'
import { Arrow } from './arrow'

export class Process extends Element {
  label: Labelled
  arrow?: Arrow

  constructor(private readonly process: engine.AnyProcess) {
    super(undefined, true)
    this.label = new Labelled(this.process.name, new Circle(new Text('process')))
    this.addChild(this.label)
  }

  remove() {
    this.arrow?.remove()
    super.remove()
  }

  update(state: Update) {
    this.render()
    const to = state.entities.get(this.process.state)
    if (!to) {
      if (this.arrow) {
        this.arrow.remove()
        this.arrow = undefined
      }
      return
    }
    if (this.arrow) {
      if (this.arrow.to === to) {
        this.arrow.update(state)
        return
      }
      this.arrow.remove()
    }
    this.arrow = new Arrow(this, to, this.process.name)
    this.addRoot(this.arrow)
    this.arrow.update(state)
  }
}
