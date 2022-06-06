import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export class UUID extends DataType<Uint8Array> {
  read(buffer: TypedBuffer, offset: number): [Uint8Array, number] {
    return [buffer.buffer.slice(offset, offset + 16), 16]
  }

  write(buffer: TypedBuffer, value: Uint8Array): number {
    buffer.buffer.set(value.slice(0, 16), buffer.length)
    return 16
  }
}