import { toInitializer, Engine, stepEventStr } from 'sim-engine'
import * as counter from './counter'
import * as messaging from './messaging'

export const counterEngine = new Engine(toInitializer(counter.stage, counter.impl))
// eslint-disable-next-line no-console
counterEngine.start().toFinish(event => console.log(stepEventStr(event)))

export const messagingEngine = new Engine(toInitializer(messaging.stage, messaging.impl))
// eslint-disable-next-line no-console
messagingEngine.start().toFinish(event => console.log(stepEventStr(event)))
