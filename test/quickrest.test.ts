import { Request, Response, QuickRest, QuickRestConfigOpts } from '../src/quickrest'

// define some helpers
const newServer = (opts?: QuickRestConfigOpts): QuickRest => {
  return new QuickRest(opts)
}

describe('quickrest', () => {
  it('successfully creates an instance of a quickrest server, with default values for configuration', () => {
    const server = newServer()

    expect(server).toBeInstanceOf(QuickRest)
    expect(server.port()).toEqual(3000)
    expect(server.loggingEnabled).toEqual(false)
  })

  it('successfully creates an instance of a quickrest server with the correct configuration', () => {
    const server = newServer({ port: 9997, enableLogging: true })

    expect(server.port()).toEqual(9997)
    expect(server.loggingEnabled).toEqual(true)
  })

  describe('.instance', () => {
    it('returns a single instance of a QuickRest class', () => {
      const server = QuickRest.instance()
      const serverTwo = QuickRest.instance()

      expect(server).toBeInstanceOf(QuickRest)
      expect(serverTwo).toBeInstanceOf(QuickRest)
      expect(serverTwo).toStrictEqual(server)
    })
  })
})
