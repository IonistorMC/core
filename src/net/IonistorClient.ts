import { createConnection, Socket } from 'net'
import { Framer } from '../protocol/Framer.js'
import { Logger } from '../logger/Logger.js'
import { PacketState } from '../protocol/PacketState.js'
import { TypedEmitter } from 'tiny-typed-emitter'
import { getPacketMetadata, PacketConstructor, ProtocolPacket } from '../protocol/Packet.js'
import { prettybuf } from '../utils/prettybuf.js'
import { LogLevel } from '../logger/LogLevel.js'
import { Awaitable } from '../utils/awaitable.js'

export type SendPacketFunction = (packet: ProtocolPacket) => void
export type SetStateFunction = (state: PacketState) => void
export type SetCompressionFunction = (compression: boolean) => void

export interface IonistorClientEvents {
  connect: () => void
  disconnect: () => void
  error: (error: Error) => void
  frame: (frame: { id: number, payload: Buffer }) => void
  timeout: () => void
}

export interface IonistorClientOptions<T extends ProtocolPacket> {
  socket: Socket
  framer: Framer
  logger: Logger
  state: PacketState
  send: SendPacketFunction
  setState: SetStateFunction
  setCompression: SetCompressionFunction
  compression: boolean
  packet: T
}

export type PacketListener<T extends ProtocolPacket> = (options: IonistorClientOptions<T>) => Awaitable<void>

export class IonistorClient extends TypedEmitter<IonistorClientEvents> {
  #socket?: Socket
  readonly #framer: Framer = new Framer()
  readonly logger: Logger
  private state: PacketState = PacketState.Handshaking
  private compression = false

  constructor(logLevel?: LogLevel) {
    super()
    this.logger = new Logger(logLevel)
  }

  get socket() {
    if (!this.#socket) throw new Error('Socket requested before connected')
    return this.#socket
  }

  connect(host = 'localhost', port = 25565) {
    this.logger.info(`Connecting to ${host}:${port}`)
    try {
      this.#socket = createConnection({ host, port }, () => {
        this.logger.info(`Connected to ${host}:${port}`)
        this.emit('connect')
      })
    } catch (e: any) {
      this.logger.error(`Failed to connect to ${host}:${port}: ${e.message}`)
      this.emit('error', e)
      return
    }
    this.socket.on('data', data => {
      try {
        this.#framer.push(data)
        if (this.#framer.hasFrames())
          this.#framer.ejectFrames().forEach(frame => this.emit('frame', ProtocolPacket.parseFrame(frame, this.compression)))
      } catch (e: any) {
        this.logger.warn(`Failed to frame chunk: ${e.message}. Chunk starts with: ${prettybuf(data.slice(0, 10))}`)
      }
    })
    this.socket.on('error', (e: any) => {
      this.emit('error', e)
      this.logger.error(`Socket error: ${e.message}`)
    })
    this.socket.on('close', (hadError) => {
      hadError ? this.logger.error('Socket closed with error') : this.logger.info('Socket closed')
      this.emit('disconnect')
    })
    this.socket.on('timeout', () => {
      this.logger.error('Socket timed out')
      this.emit('timeout')
      this.disconnect()
    })
    this.setupProcess()
  }

  disconnect() {
    if (this.#socket) {
      this.logger.info('Disconnecting')
      this.#socket.end()
      this.#socket.destroy()
      this.#socket = undefined
      this.emit('disconnect')
    }
  }

  private setupProcess() {
    process.on('SIGINT', () => {
      this.disconnect()
      process.exit(0)
    })
  }

  async send(packet: ProtocolPacket) {
    const packetName = packet.constructor.name
    try {
      packet.encode()
    } catch (e: any) {
      this.logger.error(`Failed to encode ${packetName} packet: ${e.message}`)
      return
    }
    this.socket.write(await packet.data(this.compression), (err: any) => err && this.logger.warn(`Failed to send ${packetName} packet: ${err.message}`))
  }

  setState(state: PacketState) {
    this.state = state
  }

  setCompression(compression: boolean) {
    this.compression = compression
  }

  onPacket<T extends ProtocolPacket>(Packet: PacketConstructor<T>, listener: PacketListener<T>) {
    this.on('frame', async frame => {
      try {
        const { id, state } = getPacketMetadata(Packet)
        if (!id || !state) throw new Error('Packet metadata required')
        this.logger.debug(`Received packet with id ${frame.id.toString(16).padStart(2,'0').toUpperCase()} on ${PacketState[this.state]} state`)
        if (frame.id === id && this.state === state) {
          const packet = new Packet()
          packet.setPayload(frame.payload)
          try {
            packet.decode()
          } catch (e: any) {
            this.logger.error(`Failed to decode ${Packet.name} packet: ${e.message}`)
            return
          }
          this.logger.debug(`Emitting ${Packet.name} packet`)
          await listener({
            framer: this.#framer,
            logger: this.logger,
            state: this.state,
            send: this.send.bind(this),
            setState: this.setState.bind(this),
            setCompression: this.setCompression.bind(this),
            compression: this.compression,
            socket: this.socket,
            packet,
          })
        }
      } catch (e: any) {
        this.logger.error(e.message)
      }
    })
  }
}