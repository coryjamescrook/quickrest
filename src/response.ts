import { ServerResponse } from 'http'

export interface ResponseHeader {
  name: string
  value: string | number | string[]
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
