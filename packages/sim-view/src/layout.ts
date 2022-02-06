import * as cola from 'webcola'

type NodeId = string
export class Layout {
  private layout: cola.Layout
  private nodes: Array<cola.InputNode>
  private links: Array<cola.Link<any>>
  private nodeMap: Map<NodeId, any>

  constructor() {
    this.layout = new cola.Layout().nodes([]).links([]).avoidOverlaps(true)
    this.links = this.layout.links()
    this.nodes = this.layout.nodes()
    this.nodeMap = new Map()
  }

  getNodePosition(id: NodeId): { x: number; y: number } {
    const mapped = this.nodeMap.get(id)
    return mapped
  }

  addNode(node: {
    id: NodeId
    x?: number
    y?: number
    width: number
    height: number
    fixed?: boolean
  }): this {
    const { id, fixed, ...rest } = node
    const colaNode: cola.InputNode = { ...rest, fixed: node.fixed ? 1 : 0 }
    this.nodeMap.set(id, colaNode)
    this.nodes.push(colaNode)
    return this
  }
  removeNode(id: NodeId): this {
    const node = this.nodeMap.get(id)
    if (node) {
      this.nodeMap.delete(id)
      const index = this.nodes.findIndex(n => n === node)
      if (index >= 0) {
        this.nodes.splice(index, 1)
      }
    }
    return this
  }
  fix() {
    this.layout.start()
  }
}
