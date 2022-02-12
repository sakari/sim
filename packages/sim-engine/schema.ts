import { AnyEntity } from './types'

export type StringSchema = { type: 'string' }
export function string(): StringSchema {
  return { type: 'string' }
}
export type NumberSchema = { type: 'number' }
export function number(): NumberSchema {
  return { type: 'number' }
}
export type BooleanSchema = { type: 'boolean' }
export function boolean(): BooleanSchema {
  return { type: 'boolean' }
}
export interface ArraySchema<Item extends Schema> {
  type: 'array'
  items: Item
}
export function array<I extends Schema>(item: I): ArraySchema<I> {
  return { type: 'array', items: item }
}
export interface PropSchema<Fields extends Record<string, Schema>> {
  type: 'object'
  fields: Fields
}
export function prop<Fs extends Record<string, Schema>>(fs: Fs): PropSchema<Fs> {
  return { type: 'object', fields: fs }
}
export type EntityKind = string
export interface EntitySchema<E extends AnyEntity> {
  type: 'entity'
  kind: EntityKind
  _phantom?: E
}
export function entity(kind: EntityKind) {
  return { type: 'entity', kind }
}

export type Schema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ArraySchema<Schema>
  | EntitySchema<AnyEntity>
  | PropSchema<Record<string, Schema>>

export type TypeOf<S extends Schema> = S extends StringSchema
  ? string
  : S extends NumberSchema
  ? number
  : S extends BooleanSchema
  ? boolean
  : S extends ArraySchema<infer I>
  ? Array<TypeOf<I>>
  : S extends EntitySchema<infer E>
  ? E
  : S extends PropSchema<infer Fs>
  ? { [P in keyof Fs]: TypeOf<Fs[P]> }
  : never
