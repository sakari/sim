import * as engine from 'sim-engine'
import * as entity from './src/entity'
import * as process from './src/process'
import * as stage from './src/stage'

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
  refresh({
    entities: entityGraphics,
    processes: processGraphics,
    currentProcesses: eng.processes(),
    currentEntities: eng.entities(),
    stage: app
  })
  eng.on('step', () => {
    refresh({
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
  return { app, tick, engine: eng }
}

function refresh(state: {
  entities: Map<engine.AnyEntity, entity.Entity>
  stage: stage.Stage
  processes: Map<engine.Process<engine.AnyEntity>, process.Process>
  currentEntities: Set<engine.AnyEntity>
  currentProcesses: Set<engine.Process<engine.AnyEntity>>
}) {
  console.group('refresh')
  console.time('refresh')
  for (const [existing, element] of state.entities) {
    if (!state.currentEntities.has(existing)) {
      state.stage.removeChild(element)
      state.entities.delete(existing)
    }
  }
  for (const [existing, element] of state.processes) {
    if (!state.currentProcesses.has(existing)) {
      state.stage.removeChild(element)
      state.processes.delete(existing)
    }
  }
  for (const e of state.currentEntities) {
    if (!state.entities.has(e)) {
      const g = new entity.Entity(e)
      state.entities.set(e, g)
      state.stage.addChild(g, Math.random() * 500, Math.random() * 500)
    }
  }
  for (const p of state.currentProcesses) {
    if (!state.processes.has(p)) {
      const g = new process.Process(p)
      state.processes.set(p, g)
      state.stage.addChild(g, Math.random() * 500, Math.random() * 500)
    }
  }
  console.timeEnd('refresh')
  console.groupEnd()
}
