import * as engine from 'sim-engine'
import * as entity from './src/entity'
import * as process from './src/process'
import * as stage from './src/stage'
import { Layout } from './src/layout'

export { executionController } from './src/ui/execution'
export function app(opts: {
  container: any
  implementation?: engine.Implementation
  stage?: engine.Stage
}) {
  const entityGraphics = new Map()
  const processGraphics = new Map()
  const app = new stage.Stage()
  const eng = new engine.Engine(
    opts.stage && opts.implementation ? engine.toInitializer(opts.stage, opts.implementation) : []
  )

  const layout = new Layout()
  refresh({
    layout,
    entities: entityGraphics,
    processes: processGraphics,
    currentProcesses: eng.processes(),
    currentEntities: eng.entities(),
    stage: app
  })
  eng.on('step', () => {
    refresh({
      layout,
      entities: entityGraphics,
      processes: processGraphics,
      currentProcesses: eng.processes(),
      currentEntities: eng.entities(),
      stage: app
    })
  })
  function tick() {
    app.update({ entities: entityGraphics })
    requestAnimationFrame(tick)
  }
  app.update({ entities: entityGraphics })
  refresh({
    layout,
    entities: entityGraphics,
    processes: processGraphics,
    currentProcesses: eng.processes(),
    currentEntities: eng.entities(),
    stage: app
  })
  return { app, tick, engine: eng }
}

function refresh(state: {
  layout: Layout
  entities: Map<engine.AnyEntity, entity.Entity>
  stage: stage.Stage
  processes: Map<engine.AnyProcess, process.Process>
  currentEntities: Set<engine.AnyEntity>
  currentProcesses: Set<engine.AnyProcess>
}) {
  console.group('refresh')
  console.time('refresh')
  for (const [existing, element] of state.entities) {
    if (!state.currentEntities.has(existing)) {
      state.stage.removeChild(element)
      state.entities.delete(existing)
      state.layout.removeNode(existing.id)
    }
  }
  for (const [existing, element] of state.processes) {
    if (!state.currentProcesses.has(existing)) {
      state.stage.removeChild(element)
      state.processes.delete(existing)
      state.layout.removeNode(existing.id)
    }
  }
  for (const e of state.currentEntities) {
    if (!state.entities.has(e)) {
      const g = new entity.Entity(e)
      state.entities.set(e, g)
      state.stage.addChild(g, 0, 0)
      state.layout.addNode({ id: e.id, width: 50, height: 50 })
    }
  }
  for (const p of state.currentProcesses) {
    if (!state.processes.has(p)) {
      const g = new process.Process(p)
      state.processes.set(p, g)
      state.stage.addChild(g, 0, 0)
      state.layout.addNode({ id: p.id, width: 50, height: 50 })
    }
  }
  for (const [p, g] of state.processes) {
    state.layout.removeLinksFromSource(p.id)
    if (g.arrow) {
      state.layout.addLink(g.arrow.id, p.id, p.state.id)
    }
  }
  for (const [e, g] of state.entities) {
    state.layout.removeLinksFromSource(e.id)
    for (const [, arr] of g.arrows) {
      state.layout.addLink(arr.element.id, e.id, arr.entity.id)
    }
  }
  console.group('layout')
  console.time('layout')
  state.layout.fix()
  for (const [p, g] of state.processes) {
    const layoutNode = state.layout.getNodePosition(p.id)
    g.moveRelative(layoutNode.x, layoutNode.y)
  }
  for (const [e, g] of state.entities) {
    const layoutNode = state.layout.getNodePosition(e.id)
    g.moveRelative(layoutNode.x, layoutNode.y)
  }
  console.timeEnd('layout')
  console.groupEnd()
  console.timeEnd('refresh')
  console.groupEnd()
}
