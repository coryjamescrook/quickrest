import { ServerResponse } from 'http'

export interface ResponseHeader {
  name: string
  value: string | number | string[]
}

// TODO: make this type better to make it json safe
export type JSONResponseBody = Record<string, unknown>
export type StringResponseBody = string
export type ResponseBody = JSONResponseBody | StringResponseBody

export interface ResponseMessageMap {
  notFound: string
  unauthorized: string
  forbidden: string
  badRequest: string
  conflict: string
  unprocessableEntity: string
  tooManyRequests: string
  default: string
}

export class Response {
  private serverResponse: ServerResponse
  private responseMessageMap: ResponseMessageMap

  constructor(res: ServerResponse, responseMessageMap: ResponseMessageMap) {
    this.serverResponse = res
    this.responseMessageMap = responseMessageMap
    this.statusCode = 200
  }

  private get isEnded(): boolean {
    return this.serverResponse.writableFinished
  }

  private get statusCode() {
    return this.serverResponse.statusCode
  }

  private set statusCode(code: number) {
    if (this.isEnded) { return }

    this.serverResponse.statusCode = code
  }

  private write(body: StringResponseBody) {
    if (this.isEnded) { return }
    
    this.serverResponse.write(body)
  }

  private end(body?: ResponseBody) {
    if (this.isEnded) { return }

    this.serverResponse.end(body)
  }

  public setHeader(name: string, value: string | number | string[]) {
    if (this.isEnded) { return }
    
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
    if (this.isEnded) { return }
    
    if (body === undefined) {
      this.end()
    } else if (typeof body === 'string') {
      this.end(body)
    } else {
      this.json(body)
    }
  }

  // helpers
  public notFound = (message: ResponseBody = this.responseMessageMap.notFound): void => {
    this.status(404).send(message)
  }

  public unauthorized = (message: ResponseBody = this.responseMessageMap.unauthorized): void => {
    this.status(401).send(message)
  }

  public forbidden = (message: ResponseBody = this.responseMessageMap.forbidden): void => {
    this.status(403).send(message)
  }

  public badRequest = (message: ResponseBody = this.responseMessageMap.badRequest): void => {
    this.status(400).send(message)
  }

  public conflict = (message: ResponseBody = this.responseMessageMap.conflict): void => {
    this.status(409).send(message)
  }

  public unprocessableEntity = (message: ResponseBody = this.responseMessageMap.unprocessableEntity): void => {
    this.status(422).send(message)
  }

  public tooManyRequests = (message: ResponseBody = this.responseMessageMap.tooManyRequests): void => {
    this.status(429).send(message)
  }
}
