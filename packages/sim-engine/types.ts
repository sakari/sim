import { StepProcess } from './engine'
import { AnyProps } from './schema'

export class Wait implements Wait {
  constructor(public readonly label: string, public readonly condition: () => boolean) {}
}

export interface Wait {
  readonly label: string
  readonly condition: () => boolean
}

export interface Option<Value = string> {
  label: string
  value?: Value
  weigth?: number
}

export class Choice<Value> {
  constructor(public readonly options: Array<Option<Value>>) {}
}

export interface Props {
  [key: string]: EntityState
}

export type EntityState =
  | number
  | boolean
  | string
  | null
  | undefined
  | Array<EntityState>
  | Props
  | AnyEntity

export type AnyEntity = Entity<string, Props>
export type AnyProcess = Process<string, AnyEntity>

export interface Ctx {
  wait: (label: string, condition?: () => boolean) => Wait
  spawn: <A extends AnyEntity>(
    kind: string,
    name: string,
    entity: A,
    factory: (local: A, ctx: Ctx) => StepProcess
  ) => Spawn<A>
  either: <Value>(...options: Array<Option<Value>>) => Choice<Value>
}

export type EntityId = string
export class Entity<K, State extends Props> {
  id: EntityId
  public constructor(
    public readonly kind: K,
    public readonly schema: AnyProps,
    public readonly name: string,
    public readonly state: State
  ) {
    this.id = `${kind}:${name}`
  }
}

export type ProcessId = string
export class Process<Kind, E extends AnyEntity> {
  id: ProcessId
  constructor(
    public readonly kind: Kind,
    public readonly name: string,
    public readonly state: E,
    public readonly body: StepProcess
  ) {
    this.id = `${kind}:${name}`
  }
}

export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export class Spawn<A extends AnyEntity> {
  constructor(public readonly agent: Process<any, A>) {}
}
