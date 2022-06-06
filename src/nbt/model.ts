import {
  Byte as NBTByte,
  Float as NBTFloat,
  Int as NBTInt,
  Short as NBTShort,
  Tag,
} from './tag.js'
import Constructable = jest.Constructable

export const NBTLong = 0n
export const NBTDouble = 0.0
export const NBTString = ''

export {
  NBTInt,
  NBTByte,
  NBTFloat,
  NBTShort,
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NBTModel<T> = { [P in keyof T]: T[P] extends object ? NBTModel<T[P]> : any }

export const BuildNBT = <T>(obj: T, model: NBTModel<T>): Tag & T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nbt: Record<any, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number' || typeof value === 'string') {
      if (model[key as keyof NBTModel<T>] instanceof Function)
        nbt[key] = new (model[key as never] as Constructable)(value)
      else nbt[key] = value
    } else if (typeof value === 'boolean') {
      nbt[key] = new (model[key as never] as Constructable)(+value)
    } else if (Array.isArray(value)) {
      nbt[key] = value.map(v => typeof v === 'object' ? BuildNBT(v, model[key as never][0]) : v)
    } else {
      nbt[key] = BuildNBT(value, model[key as keyof NBTModel<T>])
    }
  }
  return nbt
}

export const TagToPlain = <T extends object>(tag: Tag): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newObj: any = {}
  Object.entries(tag).map(([key, value]) => {
    if(
      value instanceof NBTByte
      || value instanceof NBTShort
      || value instanceof NBTFloat
      || value instanceof NBTInt
    ) newObj[key] = value.value
    else if(typeof value === 'object') newObj[key] = TagToPlain(value)
    else newObj[key] = value
  })
  return newObj
}