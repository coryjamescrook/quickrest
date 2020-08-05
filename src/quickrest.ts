import http, { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http'
import { HTTPMethods } from './common'

export class Request extends IncomingMessage {
  public readonly method: HTTPMethods
  public readonly headers: IncomingHttpHeaders
  public readonly url: string

  constructor(incoming: IncomingMessage) {
    super(incoming.socket)

    this.method = incoming.method as HTTPMethods
    this.headers = incoming.headers
    this.url = incoming.url!
  }
}

export class Response {
  private serverResponse: ServerResponse

  constructor(res: ServerResponse) {
    this.serverResponse = res
    this.statusCode = 200
  }

  private get statusCode() {
    return this.serverResponse.statusCode
  }

  private set statusCode(code: number) {
    this.serverResponse.statusCode = code
  }

  private write(body: any) {
    this.serverResponse.write(body)
  }

  private end(body?: any) {
    this.serverResponse.end(body)
  }

  public setHeader(name: string, value: string | number | string[]) {
    this.serverResponse.setHeader(name, value)
  }

  public status = (code: number): Response => {
    this.statusCode = code

    return this
  }

  public json = (body: any): void => {
    this.write(JSON.stringify(body))
    this.end()
  }

  public send = (body: any): void => {
    if (typeof body === 'string') {
      this.write(body)
      this.end()
    } else {
      this.json(body)
    }
  }

  // helpers
  public notFound = (): void => {
    this.status(404).end()
  }
}

export interface QuickRestConfigOpts {
  port?: number
  enableLogging?: boolean
}

export type RouteHandler = (req: Request, res: Response) => void
export type RouteMiddleware = (req: Request, res: Response) => void
export interface Route {
  method: HTTPMethods | '*'
  path: string
  handler?: RouteHandler
  middleware: RouteMiddleware[]
}

interface ResponseHeader {
  name: string
  value: string | number | string[]
}

class QuickRest {
  private static _instance: QuickRest
  private readonly _server: Server
  private _port: number
  private _routes: Route[]
  private _defaultHeaders: ResponseHeader[]
  public readonly loggingEnabled: boolean

  constructor(configOpts?: QuickRestConfigOpts) {
    this.loggingEnabled = configOpts?.enableLogging || false
    this._port = Number(configOpts?.port) || 3000
    this._server = http.createServer()
    this._routes = []
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
      return (route.path === req.url || route.path === '*')
        && (route.method === req.method || route.method === '*')
    })
  }

  private initServerListeners(): void {
    this._server.on('request', (incoming: IncomingMessage, outgoing: ServerResponse) => {
      const [req, res] = this.genReqAndRes(incoming, outgoing)
      const routes = this.findRoutesForRequest(req)

      if (routes.length) {
        const handlerRoute = routes.find(r => r.handler)

        routes.forEach(route => {
          route.middleware.forEach(m => m(req, res))
        })

        if (handlerRoute && handlerRoute.handler) {
          handlerRoute.handler(req, res)
        } else {
          res.notFound()
        }
      } else {
        res.notFound()
      }
    })
  }

  // mount endpoints
  private mount(method: HTTPMethods | '*', path: string, handler?: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this._routes.push({
      method,
      path,
      handler,
      middleware
    })
  }

  private _use(path: string, ...middleware: RouteMiddleware[]): void {
    this.mount('*', path, undefined, ...middleware)
  }

  // public methods
  public static instance(configOpts?: QuickRestConfigOpts): QuickRest {
    if (!this._instance) {
      this._instance = new QuickRest(configOpts)
    }

    return this._instance
  }

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

  public get(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this.mount(HTTPMethods.GET, path, handler, ...middleware)
  }

  public put(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this.mount(HTTPMethods.PUT, path, handler, ...middleware)
  }

  public post(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this.mount(HTTPMethods.POST, path, handler, ...middleware)
  }

  public options(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this.mount(HTTPMethods.OPTIONS, path, handler, ...middleware)
  }

  public delete(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[]): void {
    this.mount(HTTPMethods.DELETE, path, handler, ...middleware)
  }

  public use(path: string = '*', ...middleware: RouteMiddleware[]): void {
    this._use(path, ...middleware)
  }

  // used to start the server
  public serve(callbackFn: (server: Server) => any): void {
    this._server.listen(this._port, callbackFn(this._server))
  }
}

export default QuickRest.instance
