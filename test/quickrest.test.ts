import { Server } from 'http'

import QuickRest, { QuickRestConfigOpts } from '../src/quickrest'
import Request from '../src/request'
import Response from '../src/response'
import { HTTPMethods } from '../src/common'
import { getPrivate } from './helpers'

// define some helpers
const newServer = (opts?: QuickRestConfigOpts): QuickRest => {
  return new QuickRest(opts)
}

describe('quickrest', () => {
  it('successfully sets a server value as an http server instance', () => {
    const server = newServer()

    expect(getPrivate(server, '_server')).toBeInstanceOf(Server)
  })

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

  describe('http method handler methods', () => {
    Object.values(HTTPMethods).forEach(method => {
      describe(`#${method.toLowerCase()}`, () => {
        const handler = (_req: Request, _res: Response) => { }
        const path = '/v1/something_testy'

        describe('without middleware', () => {
          const server = newServer()

          it('adds the route for the GET http method, with the correct handler, without middleware', () => {
            (server as any)[method.toLowerCase()](path, handler)

            expect(getPrivate(server, '_routes')).toEqual([
              {
                method,
                path,
                handler,
                middleware: []
              }
            ])
          })
        })

        describe('with middleware', () => {
          const server = newServer()
          const middleware = [
            (_req: Request, _res: Response) => { },
            (_req: Request, _res: Response) => { }
          ]

          it('adds the route for the GET http method, with the correct handler, with middleware', () => {
            (server as any)[method.toLowerCase()](path, handler, ...middleware)

            expect(getPrivate(server, '_routes')).toEqual([{ method, path, handler, middleware }])
          })
        })
      })
    })
  })

  describe('#use', () => {
    const method = '*'
    const path = '/v1/something_testy'
    const server = newServer()
    const middleware = [
      (_req: Request, _res: Response) => {},
      (_req: Request, _res: Response) => {}
    ]

    it('mounts the middleware with the correct method and path', () => {
      // sanity
      expect(getPrivate(server, '_routes')).toEqual([])

      server.use(path, ...middleware)

      expect(getPrivate(server, '_routes'))
        .toEqual([{ method, path, handler: undefined, middleware }])
    })
  })

  describe('#serve', () => {
    it('listens to the provided port, and calls the callback fn', async () => {
      const port = 8364
      const server = newServer({ port })
      const httpServer = getPrivate(server, '_server')
      const httpServerSpy = jest.spyOn(httpServer, 'listen')
      Object.defineProperty(server, '_server', httpServerSpy)

      const mockCallback = jest.fn()

      await server.serve(mockCallback)
      expect(httpServerSpy).toHaveBeenCalledWith(port, mockCallback(httpServer))
    })
  })
})
