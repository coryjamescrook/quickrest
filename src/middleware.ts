import { Request } from './request'
import { Response } from './response'
import { HTTPMethods } from './common'

export type MiddlewareHandler = (req: Request, res: Response) => void | Promise<void>

export class Middleware {
  private _method: HTTPMethods | '*'
  private _path: string
  private _handler: MiddlewareHandler

  constructor(method: HTTPMethods | '*', path: string, handler: MiddlewareHandler) {
    this._method = method
    this._path = path
    this._handler = handler
  }

  public get method() {
    return this._method
  }

  public get path() {
    return this._path
  }

  public get handler() {
    return this._handler
  }
}
