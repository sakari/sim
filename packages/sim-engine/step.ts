import { AnyProcess, Option, Wait } from './types'

export class SleepEvent {
  public readonly kind = 'sleep'

  constructor(public readonly agent: AnyProcess, public readonly wait: Wait) {}
}

export class FinishEvent {
  public readonly kind = 'finish'

  constructor(public readonly error?: string) {}
}

export class ChoiceEvent {
  public readonly kind = 'choice'

  constructor(public readonly options: Option<any>[]) {}
}

export class WokeEvent {
  public readonly kind = 'woke'

  constructor(public readonly agent: AnyProcess) {}
}

export class ScheduleEvent {
  public readonly kind = 'schedule'

  constructor(public readonly live: Array<AnyProcess>) {}
}

export class RunEvent {
  public readonly kind = 'run'

  constructor(public readonly agent: AnyProcess) {}
}

export class PickEvent {
  public readonly kind = 'pick'

  constructor(public readonly pick: Option<any>) {}
}

export class DoneEvent {
  public readonly kind = 'done'

  constructor(public readonly agent: AnyProcess) {}
}

export class SpawnEvent {
  public readonly kind = 'spawn'

  constructor(public readonly agent: AnyProcess, public readonly created: AnyProcess) {}
}

export type StepEvent =
  | SpawnEvent
  | DoneEvent
  | PickEvent
  | RunEvent
  | SleepEvent
  | FinishEvent
  | ChoiceEvent
  | WokeEvent
  | ScheduleEvent

export function processStr(process: AnyProcess) {
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
