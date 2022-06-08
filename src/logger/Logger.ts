import { LogLevel } from './LogLevel.js'
import chalk from 'chalk'
import figures from 'figures'
import inject from 'flinject'
import { StackFrame } from 'stack-trace'
import { ProtocolPacket } from '../protocol/Packet.js'

export class Logger {
  constructor(public level = LogLevel.Info) {
    if(this.level <= LogLevel.Trace) this.setupTrace(this)
    if(this.level <= LogLevel.Debug) this.setupDebug(this)
  }

  log(level: LogLevel, message: string) {
    if (level < this.level) return
    const date = new Date()
    message.split('\n').forEach(line => console.log(`${chalk.gray(`[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}::${date.getMilliseconds().toString().padStart(3, '0')}]`)} ${Logger.coloredLevel(level)} ${chalk.gray(figures.pointer)} ${Logger.levelMessage(level, line)}`))
  }

  info(message: string) {
    this.log(LogLevel.Info, message)
  }

  warn(message: string) {
    this.log(LogLevel.Warn, message)
  }

  error(message: string) {
    this.log(LogLevel.Error, message)
  }

  debug(message: string) {
    this.log(LogLevel.Debug, message)
  }

  trace(message: string, trace: StackFrame[]) {
    const at = trace[0]
    const filename = at.getFileName().replace('file://', '').replace(process.cwd(), '').substring(1)
    const position = `${at.getLineNumber()}:${at.getColumnNumber()}`
    this.log(LogLevel.Trace, chalk.blueBright(`${chalk.bold('At')} ${filename} ${position} > ${message}`))
  }

  private static coloredLevel(level: LogLevel): string {
    switch (level) {
    case LogLevel.Info:
      return chalk.reset(`${figures.info} `)
    case LogLevel.Warn:
      return chalk.yellow(`${figures.warning} `)
    case LogLevel.Error:
      return chalk.red(`${figures.cross} `)
    case LogLevel.Debug:
      return chalk.cyan(`${figures.lineDashed1} `)
    case LogLevel.Trace:
      return chalk.magenta(`${figures.identical} `)
    default:
      return '?'
    }
  }

  private static levelMessage(level: LogLevel, message: string): string {
    switch (level) {
    case LogLevel.Info:
      return chalk.reset(message)
    case LogLevel.Warn:
      return chalk.yellow(message)
    case LogLevel.Error:
      return chalk.red(message)
    case LogLevel.Debug:
      return chalk.cyan(message)
    case LogLevel.Trace:
      return chalk.magenta(message)
    default:
      return message
    }
  }

  private setupTrace(logger: Logger) {
    Buffer.alloc = inject(Buffer.alloc, ({ stacktrace }, size) => this.trace(`Buffer allocated with ${size} bytes`, stacktrace))
    Buffer.concat = inject(Buffer.concat, ({ stacktrace }, buffers) => this.trace(`${buffers.length} Buffers concatenated`, stacktrace))
  }

  private setupDebug(logger: Logger) {
    inject(ProtocolPacket.prototype, 'data', ({object, target}, ...args) => {
      const start = performance.now()
      const result = target(...args)
      logger.debug(`Packet ${object.constructor.name} encoded in ${performance.now() - start}ms`)
      return result
    })
  }
}

export const logger = new Logger()