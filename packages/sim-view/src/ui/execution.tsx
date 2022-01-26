import React from 'react'
import { Engine, stepEventStr, StepEvent } from 'sim-engine'
import { Stage } from '../stage'

let stopped = true
export function executionController(props: { engine: Engine; stage: Stage }) {
  function logStep(step: StepEvent) {
    console.log('STEP\n    ' + stepEventStr(step))
  }
  function step() {
    if (!props.engine.isRunning()) {
      props.engine.start()
    }
    const step = props.engine.step()
    logStep(step)
  }
  function stop() {
    stopped = true
  }
  function run() {
    stopped = false
    let step
    if (!props.engine.isRunning()) {
      props.engine.start()
    }
    function go() {
      if (stopped) {
        return
      }
      console.group('step')
      console.time('step')
      step = props.engine.step()
      logStep(step)
      console.timeEnd('step')
      console.groupEnd()
      if (step.kind !== 'finish') {
        setTimeout(go, 100)
      }
    }
    go()
  }

  return (
    <div>
      <button onClick={step}>Step</button>
      <button onClick={run}>Run</button>
      <button onClick={stop}>Stop</button>
    </div>
  )
}
