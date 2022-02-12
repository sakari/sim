import {
  Implementation,
  Stage,
  Ctx,
  entityFactory,
  processFactory,
  prop,
  array,
  entity,
  number,
  Entity
} from 'sim-engine'

const message = entityFactory(prop({ to: entity<Party>('party'), data: number() }), 'message')

type Message = Entity<'message', { to: Party; data: number }>

const party = entityFactory(
  prop({
    connection: entity<Network>('network'),
    data: number(),
    counter: number()
  }),
  'party'
)
type Party = Entity<'party', { connection: Network; data: number; counter: number }>

const network = entityFactory(
  prop({
    messages: array(entity<Message>('message')),
    parties: array(entity<Party>('party'))
  }),
  'network'
)
type Network = Entity<'network', { messages: Message[]; parties: Party[] }>

function receiveMessage(local: Party) {
  const index = local.state.connection.state.messages.findIndex(
    message => message.state.to === local
  )
  if (index >= 0) {
    const [received] = local.state.connection.state.messages.splice(index, 1)
    return received
  }
}

export function* partyProcess(local: Party, ctx: Ctx) {
  yield ctx.wait('register')
  local.state.connection.state.parties.push(local)
  while (local.state.data < 10) {
    yield ctx.wait('main loop')
    const send: 'send' | 'receive' = yield ctx.either({ label: 'send' }, { label: 'receive' })
    switch (send) {
      case 'send':
        const peer: Party = yield ctx.either(
          ...local.state.connection.state.parties.map(party => ({
            label: party.name,
            value: party
          }))
        )
        local.state.connection.state.messages.push(
          message.factory(`msg:${local.name}:${local.state.counter++}`, {
            to: peer,
            data: local.state.data
          })
        )
        break
      case 'receive':
        const msg = receiveMessage(local)
        if (msg) {
          local.state.data += msg.state.data
        }
    }
  }
}

export const stage: Stage = {
  entities: [
    {
      kind: 'party',
      name: 'e1',
      state: { connection: { $ref: 'network:network' }, data: 1, counter: 0 }
    },
    {
      kind: 'party',
      name: 'e2',
      state: { connection: { $ref: 'network:network' }, data: 2, counter: 0 }
    },
    {
      kind: 'party',
      name: 'e3',
      state: { connection: { $ref: 'network:network' }, data: 3, counter: 0 }
    },
    { kind: 'network', name: 'network', state: { messages: [], parties: [] } }
  ],
  processes: [
    { kind: 'party', name: 'p1', entity: 'party:e1' },
    { kind: 'party', name: 'p2', entity: 'party:e2' },
    { kind: 'party', name: 'p3', entity: 'party:e3' }
  ]
}
export const impl: Implementation = new Implementation()
  .defineEntity(network)
  .defineEntity(party)
  .defineEntity(message)
  .defineProcess(processFactory('party', partyProcess))
