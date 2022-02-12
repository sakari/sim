import * as types from './types'
import * as engine from './engine'
import { assert, Entity } from './types'
import { PropSchema, Schema, TypeOf } from './schema'

interface Rec {
  [key: string]: State
}

interface Ref {
  $ref: EntityId
}

type State = string | number | boolean | null | undefined | Array<State> | Rec | Ref

export interface Stage {
  entities: Array<{ kind: Kind; name: string; state: State }>
  processes: Array<{ kind: Kind; name: string; entity: EntityId }>
}

export function factory<K extends string, S extends PropSchema<Record<string, Schema>>>(
  _schema: S,
  kind: K
) {
  return (name: string, state: TypeOf<S>): Entity<K, TypeOf<S>> => {
    return new Entity(kind, name, state)
  }
}

type Kind = string
type EntityId = string
export interface Implementation {
  entities: Record<Kind, (name: string, state: any) => types.AnyEntity>
  processes: Record<
    Kind,
    (name: string, entity: types.AnyEntity, ctx: types.Ctx) => types.Process<types.AnyEntity>
  >
}

function entityKey(kind: Kind, name: string): EntityId {
  return `${kind}:${name}`
}

function isRef(state: State): state is Ref {
  return !!(
    !Array.isArray(state) &&
    state &&
    typeof state === 'object' &&
    typeof state.$ref === 'string'
  )
}

function resolveState(
  preEntities: Map<EntityId, types.AnyEntity>,
  configuration: State
): types.EntityState {
  if (Array.isArray(configuration)) {
    return configuration.map(item => resolveState(preEntities, item))
  }
  if (configuration && typeof configuration === 'object') {
    if (isRef(configuration)) {
      return preEntities.get(configuration.$ref)
    }
    const fresh: Record<string, types.EntityState> = {}
    for (const key in configuration) {
      fresh[key] = resolveState(preEntities, configuration[key])
    }
    return fresh
  }
  return configuration
}

export function toInitializer(stage: Stage, impl: Implementation): Array<engine.Initializer> {
  // we need to initialize entities in two stages to allow cycles
  // 1. create entities
  const preEntities = stage.entities.reduce((memo, entity) => {
    memo.set(entityKey(entity.kind, entity.name), impl.entities[entity.kind](entity.name, {}))
    return memo
  }, new Map<EntityId, types.AnyEntity>())

  // 2. assign the references to those pre created entities
  stage.entities.map(entity => {
    const preEntity = preEntities.get(entityKey(entity.kind, entity.name))
    assert(preEntity, 'missing entity for resolution')
    const resolved = resolveState(preEntities, entity.state)
    assert(typeof resolved === 'object' && resolved, 'Root state should be an object')
    Object.entries(resolved).forEach(([key, value]) => {
      assert(preEntity.state, '')
      // @ts-ignore
      preEntity.state[key] = value
    })
  }, new Map())
  return stage.processes.map(process => {
    const f = impl.processes[process.kind]
    assert(f, `missing process kind ${process.kind}`)
    const entity = preEntities.get(process.entity)
    assert(entity, 'missing entity for process')
    return ctx => f(process.name, entity, ctx)
  })
}
