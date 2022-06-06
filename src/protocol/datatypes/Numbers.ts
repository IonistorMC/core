import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export abstract class Numbers extends DataType<number> {
  protected constructor(protected size: number, protected signed: boolean = true, protected isFloat: boolean = false) {
    super()
  }

  read(buffer: TypedBuffer, offset: number): [number, number] {
    let read = 0
    if(this.isFloat) this.size === 4 ? read = buffer.buffer.readFloatBE(offset) : read = buffer.buffer.readDoubleBE(offset)
    else switch (this.size) {
    case 1:
      this.signed ? read = buffer.buffer.readInt8(offset) : read = buffer.buffer.readUInt8(offset)
      break
    case 2:
      this.signed ? read = buffer.buffer.readInt16BE(offset) : read = buffer.buffer.readUInt16BE(offset)
      break
    case 4:
      this.signed ? read = buffer.buffer.readInt32BE(offset) : read = buffer.buffer.readUInt32BE(offset)
      break
    }
    return [read, this.size]
  }

  write(buffer: TypedBuffer, value: number): number {
    if(this.isFloat) this.size === 4 ? buffer.buffer.writeFloatBE(value, buffer.length) : buffer.buffer.writeDoubleBE(value, buffer.length)
    else switch (this.size) {
    case 1:
      this.signed ? buffer.buffer.writeInt8(value, buffer.length) : buffer.buffer.writeUInt8(value, buffer.length)
      break
    case 2:
      this.signed ? buffer.buffer.writeInt16BE(value, buffer.length) : buffer.buffer.writeUInt16BE(value, buffer.length)
      break
    case 4:
      this.signed ? buffer.buffer.writeInt32BE(value, buffer.length) : buffer.buffer.writeUInt32BE(value, buffer.length)
      break
    }
    return this.size
  }
}
