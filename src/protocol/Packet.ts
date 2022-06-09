import { PacketState } from './PacketState.js'
import { TypedBuffer } from './TypedBuffer.js'
import 'reflect-metadata'
import * as zlib from 'zlib'
import * as util from 'util'
import { varlength } from '../utils/varlength.js'
import varint from 'varint'

const deflate = util.promisify(zlib.deflate)

export interface PacketMetadata {
  readonly isPacket: true
  readonly id: number
  readonly state: PacketState
}

export interface PacketConstructor<T extends ProtocolPacket> {
  new(): T
}

export abstract class ProtocolPacket extends TypedBuffer {
  constructor(alloc?: number) {
    super(alloc)
  }

  abstract encode(): void

  abstract decode(): void

  async data(compression?: boolean, compressionThreshold: number = +(process.env.COMPRESSION_TH ?? 256)): Promise<Buffer> {
    const payload = this.payload
    const meta = new TypedBuffer(4 + 4 + 4 + payload.length)
    const { id } = getPacketMetadata(this)
    if (id === undefined) throw new Error('Packet metadata required')
    const idVarlength = varlength(id)
    if (compression) {
      if (payload.length + idVarlength >= compressionThreshold) {
        meta.writeVarint(id).push(payload)
        const compressionMeta = meta.payload
        const compressed = await deflate(compressionMeta)
        meta.clear()
        return meta.writeVarint(compressed.length + varlength(compressionMeta.length), compressionMeta.length).push(compressed).payload
      } else return meta.writeVarint(payload.length + idVarlength + 1, 0, id).push(payload).payload
    } else return meta.writeVarint(payload.length + idVarlength, id).push(payload).payload
  }

  setPayload(payload: Buffer) {
    this.resetRead()
    payload.copy(this.buffer)
  }

  static parseFrame(frame: Buffer, compression?: boolean) {
    if (compression) varint.decode(frame)
    const id = varint.decode(frame, compression ? varint.decode.bytes : 0)
    const payload = frame.slice(varint.decode.bytes + (compression ? varint.decode.bytes : 0))
    return { id, payload }
  }
}

export function getPacketMetadata<T extends ProtocolPacket>(packet: PacketConstructor<T>): PacketMetadata
export function getPacketMetadata(packet: ProtocolPacket): PacketMetadata
export function getPacketMetadata<T extends ProtocolPacket>(packet: ProtocolPacket | PacketConstructor<T>): PacketMetadata {
  return Reflect.getMetadata('packet', packet instanceof ProtocolPacket ? packet : packet.prototype) ?? {}
}

export const Packet = (type: number, state: PacketState = PacketState.Play): ClassDecorator => target =>
  Reflect.defineMetadata('packet', { isPacket: true, id: type, state }, target.prototype)