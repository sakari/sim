import { toInitializer, Engine, stepEventStr } from 'sim-engine'
import { stage, impl } from './index'

export const engine = new Engine(toInitializer(stage, impl))
// eslint-disable-next-line no-console
engine.start().toFinish(event => console.log(stepEventStr(event)))
