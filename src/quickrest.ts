import http, { IncomingMessage, ServerResponse, Server } from 'http'
import { mapSeries } from 'bluebird'

import { Request } from './request'
import { Response, ResponseHeader, ResponseMessageMap } from './response'
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

  public notFoundMessage: string = DEFAULT_NOT_FOUND_MESSAGE
  public unauthorizedMessage: string = DEFAULT_UNAUTHORIZED_MESSAGE
  public forbiddenMessage: string = DEFAULT_FORBIDDEN_MESSAGE
  public badRequestMessage: string = DEFAULT_BAD_REQUEST_MESSAGE
  public conflictMessage: string = DEFAULT_CONFLICT_MESSAGE
  public unprocessableEntityMessage: string = DEFAULT_UNPROCESSABLE_ENTITY_MESSAGE
  public tooManyRequestsMessage: string = DEFAULT_TOO_MANY_REQUESTS_MESSAGE
  public defaultMessage: string = DEFAULT_FALLBACK_MESSAGE

  constructor(configOpts?: QuickRestConfigOpts) {
    this.loggingEnabled = configOpts?.enableLogging || false
    this._port = Number(configOpts?.port) || 3000
    this._server = http.createServer()
    this._routes = []
    this._middleware = []
    this._defaultHeaders = []

    this.initServerListeners()
  }

  private get messageMap(): ResponseMessageMap {
    return {
      notFound: this.notFoundMessage,
      unauthorized: this.unauthorizedMessage,
      forbidden: this.forbiddenMessage,
      badRequest: this.badRequestMessage,
      conflict: this.conflictMessage,
      unprocessableEntity: this.unprocessableEntityMessage,
      tooManyRequests: this.tooManyRequestsMessage,
      default: this.defaultMessage,
    }
  }

  private genReqAndRes(req: IncomingMessage, res: ServerResponse): [Request, Response] {
    return [
      new Request(req),
      this.setHeadersForRes(new Response(res, this.messageMap))
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
    this._server.listen(this._port, callbackFn?.(this._server))
  }
}
