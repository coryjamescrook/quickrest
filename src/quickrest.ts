import http, { IncomingMessage, ServerResponse, Server } from 'http'

import { Request } from './request'
import { Response, ResponseHeader } from './response'
import { Route, RouteHandler } from './route'
import { Middleware, MiddlewareHandler } from './middleware'

import { HTTPMethods } from './common'

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

  constructor(configOpts?: QuickRestConfigOpts) {
    this.loggingEnabled = configOpts?.enableLogging || false
    this._port = Number(configOpts?.port) || 3000
    this._server = http.createServer()
    this._routes = []
    this._middleware = []
    this._defaultHeaders = []

    this.initServerListeners()
  }

  private genReqAndRes(req: IncomingMessage, res: ServerResponse): [Request, Response] {
    return [
      new Request(req),
      this.setHeadersForRes(new Response(res))
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
    this._server.on('request', (incoming: IncomingMessage, outgoing: ServerResponse) => {
      const [req, res] = this.genReqAndRes(incoming, outgoing)
      const routes = this.findRoutesForRequest(req)
      const middlewares = this.findMiddlewareForRequest(req)

      if (middlewares.length) {
        middlewares.forEach(middleware => {
          middleware.handler(req, res)
        })
      }

      if (routes.length) {
        routes.forEach(route => route.handler(req, res))
      } else {
        res.notFound(`No route defined for ${req.method} ${req.url}`)
      }
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
