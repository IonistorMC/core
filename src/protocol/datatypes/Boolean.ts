import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export class Boolean extends DataType<boolean> {
  read(buffer: TypedBuffer, offset: number): [boolean, number] {
    return [buffer.buffer.readUInt8(offset) !== 0, 1]
  }

  write(buffer: TypedBuffer, value: boolean): number {
    buffer.buffer.writeUInt8(value ? 1 : 0, buffer.length)
    return 1
  }
}