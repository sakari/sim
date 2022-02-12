import React from 'react'
import * as view from 'sim-view'
import * as test from 'sim-test'

export default function App() {
  const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight })
  React.useEffect(() => {
    function set() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', set)
    return () => {
      window.removeEventListener('resize', set)
    }
  }, [])
  const ref = React.useRef<any>(null)
  const [app] = React.useState(
    view.app({
      container: { width: window.innerWidth, height: window.innerHeight },
      stage: test.messaging.stage,
      implementation: test.messaging.impl
    })
  )
  React.useEffect(() => {
    ref?.current?.appendChild(app.app.view)
    app.tick()
  }, [])
  return (
    <div style={size}>
      <div style={{ height: '30px', width: '100%' }}>
        <view.executionController engine={app.engine} stage={app.app} />
      </div>
      <div className="App" ref={ref} style={{ height: size.height - 30, width: '100%' }}></div>
    </div>
  )
}
