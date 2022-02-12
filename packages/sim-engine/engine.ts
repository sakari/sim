import { AnyEntity, AnyProcess, assert, Choice, Ctx, Entity, EntityState, Option, Process, Spawn, Wait } from './types'
import {
  ChoiceEvent,
  DoneEvent,
  FinishEvent,
  PickEvent,
  RunEvent,
  ScheduleEvent,
  SleepEvent,
  SpawnEvent,
  StepEvent,
  WokeEvent
} from './step'

export type StepProcess = Generator<Spawn<any> | Choice<any> | Wait | undefined, any, any>

export type Initializer = (ctx: Ctx) => Process<any, AnyEntity>

function findEntities(value: EntityState, out: Set<AnyEntity>): void {
  if (value instanceof Entity) {
    if (!out.has(value)) {
      out.add(value)
      findEntities(value.state, out)
    }
    return
  }
  if (Array.isArray(value)) {
    return value.forEach(v => findEntities(v, out))
  }
  if (value && typeof value === 'object') {
    for (const [, v] of Object.entries(value)) {
      findEntities(v, out)
    }
    return
  }
}

function reachableEntities(root: AnyEntity, out: Set<AnyEntity>): void {
  findEntities(root, out)
}

export class Engine {
  private ctx: Ctx
  private live: Array<Process<any, AnyEntity>>
  private waiting: Array<{ wait: Wait; agent: AnyProcess }>
  private process?: Generator
  private onStep: Array<(step: StepEvent) => void> = []

  constructor(factories: Array<Initializer>) {
    this.ctx = {
      either: <Value>(...options: Array<Option<Value>>) => new Choice<Value>(options),
      spawn: <A extends AnyEntity>(
        kind: string,
        name: string,
        entity: A,
        factory: (entity: A, ctx: Ctx) => StepProcess
      ) => {
        return new Spawn(new Process<any, A>(kind, name, entity, factory(entity, this.ctx)))
      },
      wait: (label, fn) => new Wait(label, fn ?? (() => true))
    }
    this.live = factories.map(factory => factory(this.ctx))
    this.waiting = []
  }

  on(event: 'step', cb: (step: StepEvent) => void) {
    this.onStep.push(cb)
  }
  off(event: 'step', cb?: (step: StepEvent) => void) {
    if (cb) {
      this.onStep = this.onStep.filter(f => f != cb)
      return
    }
    this.onStep = []
  }
  processes(): Set<AnyProcess> {
    return new Set<AnyProcess>([...this.live, ...this.waiting.map(w => w.agent)])
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
    const step = this.process?.next(value).value
    this.onStep.forEach(cb => cb(step))
    return step
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
    const pickedAgent: AnyProcess | undefined = yield new ScheduleEvent(this.live)
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

