import { DataType } from '../DataType.js'
import { decode, encode } from '../../nbt/nbt.js'
import { TypedBuffer } from '../TypedBuffer.js'
import { BuildNBT, NBTModel, TagToPlain } from '../../nbt/model.js'

export class NBT<T> extends DataType<T> {
  constructor(private name: string | null = 'root', private model?: NBTModel<T>) {
    super()
  }

  read(buffer: TypedBuffer, offset: number): [T, number] {
    const readData = decode(buffer.buffer, offset, {
      unnamed: !this.name
    })
    return [typeof readData.value !== 'object' ? readData.value as unknown as T : TagToPlain<{ [P in keyof T]: T[P] }>(readData.value ?? {}), readData.length]
  }

  write(buffer: TypedBuffer, value: T): number {
    if(!this.model) throw new Error('NBT model required')
    return encode(buffer.buffer, buffer.length, this.name, BuildNBT<T>(value, this.model))
  }
}