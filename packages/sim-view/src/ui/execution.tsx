import React from 'react'
import { Engine, stepEventStr } from 'sim-engine'
import { Stage } from '../stage'

export function executionController(props: { engine: Engine, stage: Stage }) {
  function step() {
    if (!props.engine.isRunning()) {
      props.engine.start()
    }
    console.log('STEP')
    const step = props.engine.step()
    console.log('    ' + stepEventStr(step))
    props.stage.update()
    props.stage.render()
  }
  return (
    <div>
      <button onClick={step}>Step</button>
    </div>
  )
}
