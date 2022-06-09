import { TypedBuffer } from '../TypedBuffer.js'
import { DataType } from '../DataType.js'
import varint from 'varint'

export class Varint extends DataType<number> {
  read(buffer: TypedBuffer, offset: number): [number, number] {
    return [varint.decode(buffer.buffer, offset), varint.decode.bytes]
  }

  write(buffer: TypedBuffer, value: number): number {
    varint.encode(value, buffer.buffer, buffer.length)
    return varint.encode.bytes
  }
}
