import {
  Implementation,
  Stage,
  Ctx,
  Entity,
  StepProcess,
  entityFactory,
  prop,
  number,
  processFactory
} from 'sim-engine'

class CounterEntity extends Entity<'counter', { counter: number }> {}

export function* tester(local: CounterEntity, ctx: Ctx) {
  yield ctx.wait('wait for counter', () => local.state.counter > 10)
}

export function* counter(local: CounterEntity, ctx: Ctx): StepProcess {
  while (local.state.counter < 20) {
    const choice: string = yield ctx.either({ label: 'inc' }, { label: 'dec' })
    switch (choice) {
      case 'inc':
        local.state.counter += 3
        break
      case 'dec':
        local.state.counter--
        break
    }
    yield
  }
}

export const stage: Stage = {
  entities: [{ kind: 'counter', name: 'count', state: { counter: 0 } }],
  processes: [
    { kind: 'counter', name: 'counter', entity: 'counter:count' },
    { kind: 'tester', name: 'tester', entity: 'counter:count' }
  ]
}
export const impl: Implementation = new Implementation()
  .defineEntity(entityFactory(prop({ counter: number() }), 'counter'))
  .defineProcess(processFactory('counter', counter))
  .defineProcess(processFactory('tester', tester))
