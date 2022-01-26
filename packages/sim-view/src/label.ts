import { Element } from './element'
import { Text } from './text'

export class Labelled extends Element {
  label: Text
  constructor(text: string, private readonly element: Element) {
    super()
    this.label = new Text(text)
    this.addChild(this.label, 0, 0)
    this.addChild(element, 0, 0)
  }

  onRender() {
    const labelHeight = this.label.draw.getBBox().height
    this.element.moveRelative(0, labelHeight + 2)
  }
}
