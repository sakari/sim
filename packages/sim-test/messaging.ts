import { Implementation, Stage, Ctx, Process, Entity } from 'sim-engine'

class Message extends Entity<'message', { to: Party; data: number }> {}
class Party extends Entity<'party', { connection: Network; data: number; counter: number }> {}
class Network extends Entity<'network', { messages: Message[]; parties: Party[] }> {}

function receiveMessage(local: Party) {
  const index = local.state.connection.state.messages.findIndex(
    message => message.state.to === local
  )
  if (index >= 0) {
    const [received] = local.state.connection.state.messages.splice(index, 1)
    return received
  }
}

export function* party(local: Party, ctx: Ctx) {
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
          new Message('message', `msg:${local.name}:${local.state.counter++}`, {
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
export const impl: Implementation = {
  entities: {
    network: (name, state) => {
      return new Network('network', name, state)
    },
    party: (name, state) => {
      return new Party('party', name, state)
    }
  },
  processes: {
    party: (name, state: any, ctx) => {
      return new Process('party', name, state, party(state, ctx))
    }
  }
}
