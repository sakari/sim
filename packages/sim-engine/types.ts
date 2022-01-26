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

export type AnyEntity = Entity<EntityState>

export interface Ctx {
  wait: (label: string, condition?: () => boolean) => Wait
  spawn: <A extends AnyEntity>(
    kind: string,
    name: string,
    entity: A,
    factory: (local: A, ctx: Ctx) => Generator
  ) => Spawn<A>
  either: <Value>(...options: Array<Option<Value>>) => Choice<Value>
}

export class Entity<State> {
  public constructor(
    public readonly kind: string,
    public readonly name: string,
    public readonly state: State
  ) {}
}

export class Process<E extends AnyEntity> {
  constructor(
    public readonly kind: string,
    public readonly name: string,
    public readonly state: E,
    public readonly body: Generator
  ) {}
}

export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export class Spawn<A extends AnyEntity> {
  constructor(public readonly agent: Process<A>) {}
}
