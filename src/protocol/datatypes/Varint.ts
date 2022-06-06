import { TypedBuffer } from '../TypedBuffer.js'
import { DataType } from '../DataType.js'

export class Varint extends DataType<number> {
  private readonly SEGMENT_BITS = 0x7f
  private readonly CONTINUE_BIT = 0x80

  read(buffer: TypedBuffer, offset: number): [number, number] {
    let result = 0
    let localOffset = 0
    let position = 0
    let currentByte = 0
    const exit = () => (currentByte & this.CONTINUE_BIT) === 0
    do {
      currentByte = buffer.buffer.readInt8(localOffset + offset)
      localOffset++
      result |= (currentByte & this.SEGMENT_BITS) << position
      if (exit()) break
      position += 7
      if (position >= 32)
        throw new Error('Varint is too big')
    } while (!exit())
    return [result, localOffset]
  }

  write(buffer: TypedBuffer, value: number): number {
    let length = 0
    while ((value & ~this.SEGMENT_BITS) != 0) {
      buffer.buffer.writeUInt8((value & this.SEGMENT_BITS) | this.CONTINUE_BIT, buffer.length + length)
      value >>>= 7
      length++
    }
    buffer.buffer.writeUInt8(value, buffer.length + length)
    return length + 1
  }
}
