import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export class ULong extends DataType<bigint> {
  read(buffer: TypedBuffer, offset: number): [bigint, number] {
    return [buffer.buffer.readBigUInt64BE(offset), 8]
  }

  write(buffer: TypedBuffer, value: bigint): number {
    buffer.buffer.writeBigUInt64BE(value, buffer.length)
    return 8
  }
}
