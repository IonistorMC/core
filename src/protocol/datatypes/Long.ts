import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export class Long extends DataType<bigint> {
  read(buffer: TypedBuffer, offset: number): [bigint, number] {
    return [buffer.buffer.readBigInt64BE(offset), 8]
  }

  write(buffer: TypedBuffer, value: bigint): number {
    buffer.buffer.writeBigInt64BE(value, buffer.length)
    return 8
  }
}
