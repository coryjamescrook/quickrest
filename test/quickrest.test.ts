import { Request, Response, QuickRest, QuickRestConfigOpts } from '../src/quickrest'
import { getPrivate } from './helpers'

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
    const port = 9997
    const enableLogging = true
    const server = newServer({ port, enableLogging })

    expect(getPrivate(server, '_port')).toEqual(port)
    expect(server.loggingEnabled).toEqual(enableLogging)
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

  describe('#port', () => {
    describe('when no argument is provided', () => {
      it('returns the server port correctly', () => {
        const port = 9093
        const server = newServer({ port })

        expect(server.port()).toEqual(port)
      })
    })

    describe('when an argument is provided', () => {
      const portArg = 9093

      it('sets the server port correctly', () => {
        const server = newServer()

        expect(server.port(portArg)).toEqual(portArg)
        expect(server.port()).toEqual(portArg)
      })
    })
  })

  describe('#setDefaultHeaders', () => {
    it('sets the server\'s default headers correctly', () => {
      const server = newServer()
      const contentTypeHeader = { name: 'Content-Type', value: 'application/json' }

      // sanity check - should be an empty array
      expect(getPrivate(server, '_defaultHeaders')).toEqual([])

      const setHeadersReturnValue = server.setDefaultHeaders(contentTypeHeader)

      // returns the QuickRest instance
      expect(setHeadersReturnValue).toBeInstanceOf(QuickRest)

      // sets the default headers
      expect(getPrivate(server, '_defaultHeaders'))
        .toEqual([contentTypeHeader])
    })
  })
})
