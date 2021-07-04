import http, { IncomingMessage, ServerResponse, Server } from 'http'
import { mapSeries } from 'bluebird'

import { Request } from './request'
import { Response, ResponseHeader, ResponseMessage, ResponseMessageMap } from './response'
import { Route, RouteHandler } from './route'
import { Middleware, MiddlewareHandler } from './middleware'

import { HTTPMethods } from './common'

const DEFAULT_NOT_FOUND_MESSAGE = 'Not found'
const DEFAULT_UNAUTHORIZED_MESSAGE = 'Unauthorized'
const DEFAULT_FORBIDDEN_MESSAGE = 'Forbidden'
const DEFAULT_BAD_REQUEST_MESSAGE = 'Bad request'
const DEFAULT_CONFLICT_MESSAGE = 'Conflict'
const DEFAULT_UNPROCESSABLE_ENTITY_MESSAGE = 'Unprocessable entity'
const DEFAULT_TOO_MANY_REQUESTS_MESSAGE = 'Too many requests'
const DEFAULT_FALLBACK_MESSAGE = 'Unknown error'

export interface QuickRestConfigOpts {
  port?: number
  enableLogging?: boolean
}

export class QuickRest {
  private readonly _server: Server
  private _port: number
  private _routes: Route[]
  private _middleware: Middleware[]
  private _defaultHeaders: ResponseHeader[]
  public readonly loggingEnabled: boolean

  public notFoundMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public unauthorizedMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public forbiddenMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public badRequestMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public conflictMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public unprocessableEntityMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public tooManyRequestsMessage: ResponseMessage = DEFAULT_NOT_FOUND_MESSAGE
  public defaultMessage: ResponseMessage = DEFAULT_FALLBACK_MESSAGE

  constructor(configOpts?: QuickRestConfigOpts) {
    this.loggingEnabled = configOpts?.enableLogging || false
    this._port = Number(configOpts?.port) || 3000
    this._server = http.createServer()
    this._routes = []
    this._middleware = []
    this._defaultHeaders = []

    this.initServerListeners()
  }

  private messageMap = (req: IncomingMessage): ResponseMessageMap => {
    return {
      notFound: typeof this.notFoundMessage === 'string' ? this.notFoundMessage : this.notFoundMessage(req),
      default: typeof this.defaultMessage === 'string' ? this.defaultMessage : this.defaultMessage(req),
    }
  }

  private genReqAndRes(req: IncomingMessage, res: ServerResponse): [Request, Response] {
    return [
      new Request(req),
      this.setHeadersForRes(new Response(res, this.messageMap(req)))
    ]
  }

  private setHeadersForRes(res: Response): Response {
    this._defaultHeaders.forEach(h => {
      res.setHeader(h.name, h.value)
    })

    return res
  }

  private findRoutesForRequest(req: Request) {
    return this._routes.filter(route => {
      return (route.path === req.url || route.path === '*') && route.method === req.method
    })
  }

  private findMiddlewareForRequest(req: Request) {
    return this._middleware.filter(middleware => {
      return (middleware.path === req.url || middleware.path === '*')
        && (middleware.method === req.method || middleware.method === '*')
    })
  }

  private initServerListeners(): void {
    this._server.on('request', async (incoming: IncomingMessage, outgoing: ServerResponse) => {
      const [req, res] = this.genReqAndRes(incoming, outgoing)
      const routes = this.findRoutesForRequest(req)
      const middlewares = this.findMiddlewareForRequest(req)

      await mapSeries(middlewares, async (middleware: Middleware) => {
        await middleware.handler(req, res)
      })

      if (!routes.length) {
        res.notFound(`No route defined for ${req.method} ${req.url}`)
        return
      }

      await mapSeries(routes, async (route: Route) => {
        await route.handler(req, res)
      })
    })
  }

  // mount endpoints
  private mount(method: HTTPMethods, path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this._routes.push(new Route(method, path, handler, middleware))
  }

  private _use(path: string, ...middleware: MiddlewareHandler[]): void {
    const middlewareObjs = middleware.map(handler => new Middleware('*', path, handler))
    this._middleware.push(...middlewareObjs)
  }

  // public methods
  // set, and/or get the server port number
  public port(portNumber?: number): number {
    if (portNumber !== undefined) {
      this._port = portNumber
    }

    return this._port
  }

  public setDefaultHeaders(...headers: ResponseHeader[]): QuickRest {
    this._defaultHeaders = headers

    return this
  }

  public get(path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this.mount(HTTPMethods.GET, path, handler, ...middleware)
  }

  public put(path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this.mount(HTTPMethods.PUT, path, handler, ...middleware)
  }

  public post(path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this.mount(HTTPMethods.POST, path, handler, ...middleware)
  }

  public options(path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this.mount(HTTPMethods.OPTIONS, path, handler, ...middleware)
  }

  public delete(path: string, handler: RouteHandler, ...middleware: MiddlewareHandler[]): void {
    this.mount(HTTPMethods.DELETE, path, handler, ...middleware)
  }

  public use(path: string = '*', ...middleware: MiddlewareHandler[]): void {
    this._use(path, ...middleware)
  }

  // used to start the server
  public serve(callbackFn?: (server: Server) => any): void {
    if (callbackFn) {
      this._server.listen(this._port, callbackFn(this._server))
    } else {
      this._server.listen(this._port)
    }
  }
}
