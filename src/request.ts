import { IncomingMessage, IncomingHttpHeaders } from 'http'
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
