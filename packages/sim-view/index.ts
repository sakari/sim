import * as engine from 'sim-engine'
import * as entity from './src/entity'
import * as process from './src/process'
import * as arrow from './src/arrow'
import * as stage from './src/stage'

export { executionController } from './src/ui/execution'
export function app(opts: {
  container: any
  implementation?: engine.Implementation
  stage?: engine.Stage
}) {
  const entityGraphics = new Map()
  const app = new stage.Stage()
  const eng = new engine.Engine(
    opts.stage && opts.implementation ? engine.toInitializer(opts.stage, opts.implementation) : []
  )
  eng.entities().forEach(e => {
    const g = new entity.Entity(e)
    entityGraphics.set(e, g)
    app.addChild(g, 200, 200)
  })
  const arrows: Array<arrow.Arrow> = []
  eng.processes().forEach(p => {
    const g = new process.Process(p)
    app.addChild(g, Math.random() * 500, Math.random() * 500)
    const e = entityGraphics.get(p.state)
    const arr = new arrow.Arrow(g, e)
    arrows.push(arr)
    app.addChild(arr, 0, 0)
  })
  function tick() {
    arrows.forEach(a => a.update())
    requestAnimationFrame(tick)
  }
  return { app, tick, engine: eng }
}
