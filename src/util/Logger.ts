import * as fs from 'fs'

enum LoggerTypes {
  Log = 'log',
  Info = 'info',
  Error = 'error'
}

export default class Logger {
  private readonly appName: string
  private readonly logPath = '../../log'
  private static _instance: Logger

  constructor(appName: string = 'app') {
    this.appName = appName

    const bound: { [key in LoggerTypes]: (...args: any[]) => any } = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      error: console.error.bind(console)
    }

    Object.entries(bound).map(([key, fn]) => {
      console[key as LoggerTypes] = (...args: any[]) => {
        // some internal logging
        this[key as LoggerTypes](...args)

        // and then do the original console call
        fn(...args)
      }
    })
  }

  public static instance(appName?: string): Logger {
    if (!this._instance) {
      this._instance = new Logger(appName)
    }

    return this._instance
  }

  public log(...args: any[]) {
    this.writeToLog(LoggerTypes.Log, ...args)
  }

  public info(...args: any[]) {
    this.writeToLog(LoggerTypes.Info, ...args)
  }

  public error(...args: any[]) {
    this.writeToLog(LoggerTypes.Error, ...args)
  }

  // private methods
  private writeToLog(type: LoggerTypes, ...args: any[]) {
    const fileName = `${this.logPath}/${this.appName}.${type}.log`

    if (!fs.existsSync(fileName)) {

    }
  }
}
