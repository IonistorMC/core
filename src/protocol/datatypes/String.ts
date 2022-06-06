import { DataType, NewTransformer } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'
import { Varint } from './Varint.js'

export class String extends DataType<string> {
  read(buffer: TypedBuffer, offset: number): [string, number] {
    const [length, metaLength] = NewTransformer(Varint).read(buffer, offset)
    return [buffer.buffer.toString('utf8', offset + metaLength, offset + metaLength + length), metaLength + length]
  }

  write(buffer: TypedBuffer, value: string): number {
    const stringLength = Buffer.byteLength(value, 'utf8')
    const metaLength = NewTransformer(Varint).write(buffer, stringLength)
    buffer.buffer.write(value, buffer.length + metaLength, stringLength, 'utf8')
    return stringLength + metaLength
  }
}
