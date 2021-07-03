import { ServerResponse } from 'http'

export interface ResponseHeader {
  name: string
  value: string | number | string[]
}

// TODO: make this type better to make it json safe
export type JSONResponseBody = Record<string, unknown>
export type StringResponseBody = string
export type ResponseBody = JSONResponseBody | StringResponseBody

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

  private write(body: StringResponseBody) {
    this.serverResponse.write(body)
  }

  private end(body?: ResponseBody) {
    this.serverResponse.end(body)
  }

  public setHeader(name: string, value: string | number | string[]) {
    this.serverResponse.setHeader(name, value)
  }

  public status = (code: number): Response => {
    this.statusCode = code

    return this
  }

  public json = (body: JSONResponseBody): void => {
    this.end(JSON.stringify(body))
  }

  public send = (body?: ResponseBody): void => {
    if (body === undefined) {
      this.end()
    } else if (typeof body === 'string') {
      this.end(body)
    } else {
      this.json(body)
    }
  }

  // helpers
  public notFound = (message: ResponseBody = 'Not found'): void => {
    this.status(404).send(message)
  }

  public unauthorized = (message: ResponseBody = 'Unauthorized'): void => {
    this.status(403).send(message)
  }
}
