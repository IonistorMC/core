import { DataTypeTransformer, NewTransformer } from './DataType.js'
import {
  Byte,
  Double,
  Float,
  Int,
  Long,
  Short,
  String,
  UByte,
  UInt,
  ULong,
  UShort,
  Varint,
  Boolean,
  UUID,
  Position, NBT,
} from '../datatypes.js'
import { XYZPosition } from './datatypes/Position'
import { NBTModel } from '../nbt/model'

/**
 * <h1> TypedBuffer </h1>
 * TypedBuffer is a buffer that can be used to read and write values of the specified type.
 */
export class TypedBuffer {
  #buffer: Buffer
  private bufferLength = 0
  private readIndex = 0
  private writeSessions: Record<string, number> = {}

  constructor(readonly alloc: number = +(process.env.PACKET_ALLOC ?? 8 * 1024 * 1024)) {
    this.#buffer = Buffer.alloc(alloc)
  }

  /**
   * Returns the length of the actual buffer.
   * @return {number} - length of the buffer
   */
  get length(): number {
    return this.bufferLength
  }

  /**
   * Returns the actual buffer.
   */
  get payload(): Buffer {
    return this.#buffer.slice(0, this.bufferLength)
  }

  /**
   * Returns a full buffer.
   */
  get buffer() {
    return this.#buffer
  }

  /**
   * Writes a value of the specified type to buffer.
   * @param Transformer
   * @param value
   */
  write<T>(Transformer: DataTypeTransformer<T>, ...value: T[]): this {
    const transformer = NewTransformer(Transformer)
    for (const v of value) {
      const writed = transformer.write(this, v)
      this.bufferLength += writed
      for (const s of Object.keys(this.writeSessions)) this.writeSessions[s] += writed
    }
    return this
  }

  /**
   * Reads a value of the specified type from buffer.
   * @param Transformer - transformer to use
   * @return T - value
   */
  read<T>(Transformer: DataTypeTransformer<T>): T {
    const [result, offset] = NewTransformer(Transformer).read(this, this.readIndex)
    this.readIndex += offset
    return result as T
  }

  /**
   * Reads a array of values of the specified type from buffer.
   * @param Transformer - transformer to use
   * @param length - count of values to read
   */
  readArray<T>(Transformer: DataTypeTransformer<T>, length: number): T[] {
    const result: T[] = []
    for (let i = 0; i < length; i++) result.push(this.read(Transformer))
    return result
  }

  resetRead(): void {
    this.readIndex = 0
  }

  clear(): void {
    this.bufferLength = 0
    this.readIndex = 0
    this.#buffer = Buffer.alloc(this.alloc)
  }

  /**
   * Starts write session.
   * @param id - session id
   */
  startWriteSession(id: string): void {
    this.writeSessions[id] = 0
  }

  /**
   * Returns write session.
   * @param id - session id
   */
  endWriteSession(id: string): number {
    const written = this.writeSessions[id]
    this.writeSessions[id] = 0
    return written ?? 0
  }

  // Read methods
  writeBoolean = (...value: boolean[]): this => this.write(Boolean, ...value)
  writeByte = (...value: number[]): this => this.write(Byte, ...value)
  writeUByte = (...value: number[]): this => this.write(UByte, ...value)
  writeShort = (...value: number[]): this => this.write(Short, ...value)
  writeUShort = (...value: number[]): this => this.write(UShort, ...value)
  writeInt = (...value: number[]): this => this.write(Int, ...value)
  writeUInt = (...value: number[]): this => this.write(UInt, ...value)
  writeVarint = (...value: number[]): this => this.write(Varint, ...value)
  writeFloat = (...value: number[]): this => this.write(Float, ...value)
  writeLong = (...value: bigint[]): this => this.write(Long, ...value)
  writeULong = (...value: bigint[]): this => this.write(ULong, ...value)
  writeDouble = (...value: number[]): this => this.write(Double, ...value)
  writeString = (...value: string[]): this => this.write(String, ...value)
  writePosition = (...value: XYZPosition[]): this => this.write(Position, ...value)
  writeUUID = (...value: Uint8Array[]): this => this.write(UUID, ...value)
  writeNBT = <T>(model: NBTModel<T>, value: T, name: string | null = null) => this.write(new NBT<T>(name, model), value)

  // Read methods
  readBoolean = (): boolean => this.read(Boolean)
  readByte = (): number => this.read(Byte)
  readUByte = (): number => this.read(UByte)
  readShort = (): number => this.read(Short)
  readUShort = (): number => this.read(UShort)
  readInt = (): number => this.read(Int)
  readUInt = (): number => this.read(UInt)
  readVarint = (): number => this.read(Varint)
  readFloat = (): number => this.read(Float)
  readLong = (): bigint => this.read(Long)
  readULong = (): bigint => this.read(ULong)
  readDouble = (): number => this.read(Double)
  readString = (): string => this.read(String)
  readPosition = (): XYZPosition => this.read(Position)
  readUUID = (): Uint8Array => this.read(UUID)
  readNBT = <T>(name: string | null = null) => this.read(new NBT<T>(name))

  // Array read methods
  readBooleanArray = (length: number): boolean[] => this.readArray(Boolean, length)
  readByteArray = (length: number): number[] => this.readArray(Byte, length)
  readUByteArray = (length: number): number[] => this.readArray(UByte, length)
  readShortArray = (length: number): number[] => this.readArray(Short, length)
  readUShortArray = (length: number): number[] => this.readArray(UShort, length)
  readIntArray = (length: number): number[] => this.readArray(Int, length)
  readUIntArray = (length: number): number[] => this.readArray(UInt, length)
  readVarintArray = (length: number): number[] => this.readArray(Varint, length)
  readFloatArray = (length: number): number[] => this.readArray(Float, length)
  readLongArray = (length: number): bigint[] => this.readArray(Long, length)
  readULongArray = (length: number): bigint[] => this.readArray(ULong, length)
  readDoubleArray = (length: number): number[] => this.readArray(Double, length)
  readStringArray = (length: number): string[] => this.readArray(String, length)
  readPositionArray = (length: number): XYZPosition[] => this.readArray(Position, length)
  readUUIDArray = (length: number): Uint8Array[] => this.readArray(UUID, length)
}

