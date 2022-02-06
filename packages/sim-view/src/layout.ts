import * as cola from 'webcola'

type NodeId = string
type EdgeId = string

class Bag<Key, Value> {
  map: Map<Key, Value[]> = new Map()
  set(k: Key, v: Value): this {
    const vs = this.map.get(k)
    if (vs) {
      vs.push(v)
    } else {
      this.map.set(k, [v])
    }
    return this
  }
  get(k: Key): Value[] {
    return this.map.get(k) ?? []
  }
  pull(k: Key, value: Value): this {
    const vs = this.map.get(k)
    if (!vs) {
      return this
    }
    const ix = vs.findIndex(v => v === value)
    if (ix >= 0) {
      vs.splice(ix, 1)
    }
    return this
  }
  remove(k: Key): Value[] {
    const vs = this.map.get(k)
    if (!vs) {
      return []
    }
    this.map.delete(k)
    return vs
  }
}

export class Layout {
  private layout: cola.Layout
  private nodes: Array<cola.InputNode>
  private links: Array<cola.Link<cola.Node | number>>
  private nodeMap: Map<NodeId, any>
  private edgeMap: Map<EdgeId, { link: any; source: EdgeId; target: EdgeId }>
  private nodeToEdge: Bag<NodeId, EdgeId>

  constructor() {
    this.layout = new cola.Layout().linkDistance(200).nodes([]).links([]).avoidOverlaps(true)
    this.links = this.layout.links()
    this.nodes = this.layout.nodes()
    this.nodeMap = new Map()
    this.edgeMap = new Map()
    this.nodeToEdge = new Bag()
  }

  getNodePosition(id: NodeId): { x: number; y: number } {
    const mapped = this.nodeMap.get(id)
    return mapped
  }

  addLink(id: EdgeId, from: NodeId, to: NodeId): this {
    if (this.edgeMap.has(id)) {
      return this
    }
    const source = this.nodeMap.get(from)
    const target = this.nodeMap.get(to)
    if (source && target) {
      this.nodeToEdge.set(from, id)
      this.nodeToEdge.set(to, id)
      const link = { source, target }
      this.edgeMap.set(id, { link, source: from, target: to })
      this.links.push(link)
    }
    return this
  }

  removeLinksFromSource(id: NodeId): this {
    const sourceEdges = this.nodeToEdge
      .get(id)
      .filter(edge => this.edgeMap.get(edge)?.source === id)
    for (const e of sourceEdges) {
      this.removeLink(e)
    }
    return this
  }

  removeLink(id: EdgeId): this {
    const link = this.edgeMap.get(id)
    if (link) {
      this.edgeMap.delete(id)
      const ix = this.links.findIndex(l => l === link.link)
      if (ix >= 0) {
        this.links.splice(ix, 1)
      }
      this.nodeToEdge.pull(link.source, id)
      this.nodeToEdge.pull(link.target, id)
    }
    return this
  }

  addNode(node: {
    id: NodeId
    x?: number
    y?: number
    width: number
    height: number
    fixed?: boolean
  }): this {
    if (this.nodeMap.has(node.id)) {
      return this
    }
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
    const edges = this.nodeToEdge.remove(id)
    for (const edge of edges) {
      this.removeLink(edge)
    }
    return this
  }
  fix() {
    this.layout.start()
  }
}
