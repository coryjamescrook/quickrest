import { Request } from './request'
import { Response } from './response'
import { Middleware, MiddlewareHandler } from './middleware'
import { HTTPMethods } from './common'

export type RouteHandler = (req: Request, res: Response) => void | Promise<void>

export class Route {
  private _method: HTTPMethods
  private _path: string
  private _middleware: Middleware[]
  private _handler: RouteHandler

  constructor(method: HTTPMethods, path: string, handler: RouteHandler, middlewareHandlers?: MiddlewareHandler[]) {
    this._method = method
    this._path = path
    this._handler = handler
    this._middleware = middlewareHandlers?.map(handler => new Middleware(method, path, handler)) || []
  }

  public get method() {
    return this._method
  }

  public get path() {
    return this._path
  }

  public get middleware() {
    return this._middleware
  }

  public get handler() {
    return this._handler
  }
}
