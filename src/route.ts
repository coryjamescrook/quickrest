import { Request } from './request'
import { Response } from './response'
import { HTTPMethods } from './common'

export type RouteHandler = (req: Request, res: Response) => void

export type RouteMiddleware = (req: Request, res: Response) => void

interface RouteOpts {
  method: HTTPMethods | '*'
  path: string
  handler?: RouteHandler
  middleware?: RouteMiddleware[]
}

class Route {
  private _method: HTTPMethods | '*'
  private _path: string
  private _middleware: RouteMiddleware[]
  private _handler?: RouteHandler
  
  constructor(opts: RouteOpts) {
    this._method = opts.method
    this._path = opts.path
    this._middleware = opts.middleware || []
    this._handler = opts.handler
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

export default Route
