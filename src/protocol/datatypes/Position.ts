import { DataType } from '../DataType.js'
import { TypedBuffer } from '../TypedBuffer.js'

export type XYZPosition = { x: number, y: number, z: number }

export class Position extends DataType<XYZPosition> {
  read(buffer: TypedBuffer, offset: number): [XYZPosition, number] {
    const encoded = buffer.buffer.readBigUint64BE(offset)
    let x = Number(encoded >> 38n)
    let y = Number(encoded & 0xFFFn)
    let z = Number((encoded >> 12n) & 0x3FFFFFFn)
    if (x >= 1 << 25) x -= 1 << 26
    if (y >= 1 << 11) y -= 1 << 12
    if (z >= 1 << 25) z -= 1 << 26
    return [{ x, y, z }, 8]
  }

  write(buffer: TypedBuffer, value: XYZPosition): number {
    buffer.buffer.writeBigUint64BE(BigInt((((BigInt(value.x) & 0x3FFFFFFn) << 38n) | ((BigInt(value.z) & 0x3FFFFFFn) << 12n) | (BigInt(value.y) & 0xFFFn))), buffer.length)
    return 8
  }
}