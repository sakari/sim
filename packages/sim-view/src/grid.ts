import { Element } from './element'

export type Row = { label: Element; value: Element }

export class Grid extends Element {
  items: Row[] = []

  constructor(items: Row[]) {
    super(undefined, false)
    this.set(items)
  }

  onRender() {
    const maxLabelWidth = this.items.reduce((max, item) => {
      return Math.max(item.label.draw.getBBox().width, max)
    }, 0)
    let y = 0
    this.items.forEach(item => {
      item.label.moveRelative(0, y)
      item.value.moveRelative(maxLabelWidth + 5, y)
      y += Math.max(item.label.draw.getBBox().height, item.value.draw.getBBox().height)
    })
  }

  set(items: Row[]) {
    this.removeAllChildren()
    this.items = items
    items.forEach(item => {
      this.addChild(item.label, 0, 0)
      this.addChild(item.value, 0, 0)
    })
  }
}
