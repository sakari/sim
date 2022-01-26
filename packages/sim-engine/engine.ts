import { assert, Option, Spawn, Ctx, Process, Wait, AnyEntity, Choice, Entity } from './types'

export type Initializer = (ctx: Ctx) => Process<AnyEntity>

function reachableEntities(root: AnyEntity, out: Set<AnyEntity>): void {
  if (out.has(root)) {
    return
  }
  out.add(root)
  assert(
    root.state && typeof root.state === 'object' && !Array.isArray(root.state),
    'expected a record'
  )
  Object.values(root.state).forEach(value => {
    if (value instanceof Entity) {
      reachableEntities(value, out)
    } else if (Array.isArray(value)) {
      value.forEach(v => reachableEntities(v, out))
    }
  })
}

export class Engine {
  private ctx: Ctx
  private live: Array<Process<AnyEntity>>
  private waiting: Array<{ wait: Wait; agent: Process<AnyEntity> }>
  private process?: Generator

  constructor(factories: Array<Initializer>) {
    this.ctx = {
      either: <Value>(...options: Array<Option<Value>>) => new Choice<Value>(options),
      spawn: <A extends AnyEntity>(
        kind: string,
        name: string,
        entity: A,
        factory: (entity: A, ctx: Ctx) => Generator
      ) => {
        return new Spawn(new Process<A>(kind, name, entity, factory(entity, this.ctx)))
      },
      wait: (label, fn) => new Wait(label, fn ?? (() => true))
    }
    this.live = factories.map(factory => factory(this.ctx))
    this.waiting = []
  }

  processes(): Set<Process<AnyEntity>> {
    return new Set<Process<AnyEntity>>([...this.live, ...this.waiting.map(w => w.agent)])
  }

  entities(): Set<AnyEntity> {
    const es = new Set<AnyEntity>()
    for (const p of this.live) {
      reachableEntities(p.state, es)
    }
    for (const p of this.waiting) {
      reachableEntities(p.agent.state, es)
    }
    return es
  }

  start(): this {
    this.process = this.createProcess()
    return this
  }

  isRunning() {
    return !!this.process
  }

  step(value?: any): StepEvent {
    assert(this.process, 'Process has not been started yet')
    return this.process?.next(value).value
  }

  toFinish(eventHandler: (step: StepEvent) => any) {
    let next = this.step()
    while (true) {
      const result = eventHandler(next)
      if (next instanceof FinishEvent) {
        break
      }
      next = this.step(result)
    }
  }

  private *wakeup() {
    for (let i = 0; i < this.waiting.length; i++) {
      if (this.waiting[i].wait.condition()) {
        const agent = this.waiting[i].agent
        this.live.push(agent)
        this.waiting.splice(i, 1)
        yield new WokeEvent(agent)
      }
    }
  }

  private *run() {
    const pickedAgent: Process<AnyEntity> | undefined = yield new ScheduleEvent(this.live)
    const cursor = pickedAgent
      ? this.live.indexOf(pickedAgent)
      : Math.floor(Math.random() * this.live.length)
    const agent = this.live[cursor]

    let result = agent.body.next()
    while (true) {
      yield new RunEvent(agent)
      if (result.value instanceof Choice) {
        const pickedChoice: Option<any> | undefined = yield new ChoiceEvent(result.value.options)
        const pick = pickedChoice
          ? result.value.options.indexOf(pickedChoice)
          : Math.floor(Math.random() * result.value.options.length)
        const picked = result.value.options[pick]
        yield new PickEvent(picked)
        result = agent.body.next(picked.value ?? picked.label)
        continue
      }
      if (result.value instanceof Spawn) {
        this.live.push(result.value.agent)
        yield new SpawnEvent(agent, result.value.agent)
      }
      if (result.done) {
        this.live.splice(cursor, 1)
        yield new DoneEvent(agent)
      }
      if (result.value instanceof Wait) {
        this.waiting.push({ wait: result.value, agent })
        this.live.splice(cursor, 1)
        yield new SleepEvent(agent, result.value)
      }
      break
    }
  }

  private *createProcess(): Generator<StepEvent, any, any> {
    while (true) {
      for (const woke of this.wakeup()) {
        yield woke
      }
      if (this.live.length == 0) {
        if (this.waiting.length > 0) {
          yield new FinishEvent('deadlock')
        } else {
          yield new FinishEvent()
        }
        continue
      }
      for (const step of this.run()) {
        yield step
      }
    }
  }
}

class SleepEvent {
  public readonly kind = 'sleep'
  constructor(public readonly agent: Process<AnyEntity>, public readonly wait: Wait) {}
}
class FinishEvent {
  public readonly kind = 'finish'
  constructor(public readonly error?: string) {}
}
class ChoiceEvent {
  public readonly kind = 'choice'
  constructor(public readonly options: Option<any>[]) {}
}
class WokeEvent {
  public readonly kind = 'woke'
  constructor(public readonly agent: Process<AnyEntity>) {}
}
class ScheduleEvent {
  public readonly kind = 'schedule'
  constructor(public readonly live: Array<Process<AnyEntity>>) {}
}
class RunEvent {
  public readonly kind = 'run'
  constructor(public readonly agent: Process<AnyEntity>) {}
}
class PickEvent {
  public readonly kind = 'pick'
  constructor(public readonly pick: Option<any>) {}
}
class DoneEvent {
  public readonly kind = 'done'
  constructor(public readonly agent: Process<AnyEntity>) {}
}

class SpawnEvent {
  public readonly kind = 'spawn'
  constructor(
    public readonly agent: Process<AnyEntity>,
    public readonly created: Process<AnyEntity>
  ) {}
}

type StepEvent =
  | SpawnEvent
  | DoneEvent
  | PickEvent
  | RunEvent
  | SleepEvent
  | FinishEvent
  | ChoiceEvent
  | WokeEvent
  | ScheduleEvent

export function processStr(process: Process<AnyEntity>) {
  return `<${process.kind}:${process.name}>`
}

export function stepEventStr(event: StepEvent) {
  const agentStr = 'agent' in event && event.agent ? processStr(event.agent) : 'system'
  let str = ''
  switch (event.kind) {
    case 'spawn':
      str = `created ${processStr(event.created)}`
      break
    case 'pick':
      str = event.pick.label
      break
    case 'choice':
      str = `${event.options.map(opt => opt.label).join(', ')}`
      break
    case 'schedule':
      str = `live ${event.live.length}`
      break
    case 'finish':
      str = event.error ?? ''
      break
  }
  return `${agentStr} ${event.kind}${str == '' ? '' : `: ${str}`}`
}
