import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export class Double extends DataType<number> {
  read(buffer: TypedBuffer, offset: number): [number, number] {
    return [buffer.buffer.readDoubleBE(offset), 8]
  }

  write(buffer: TypedBuffer, value: number): number {
    buffer.buffer.writeDoubleBE(value, buffer.length)
    return 8
  }
}
