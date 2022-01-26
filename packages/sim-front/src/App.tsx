import React from 'react'
import * as view from 'sim-view'
import * as test from 'sim-test'

export default function App() {
  const ref = React.useRef<any>(null)
  const [app] = React.useState(
    view.app({ container: window, stage: test.stage, implementation: test.impl })
  )
  React.useEffect(() => {
    ref?.current?.appendChild(app.app.view)
    app.app.render()
    app.tick()
  }, [])
  return (
    <div>
      <div>
        <view.executionController engine={app.engine} stage={app.app} />
      </div>
      <div className="App" ref={ref}></div>
    </div>
  )
}
