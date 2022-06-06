// ====================================================
// Forked from https://github.com/janispritzkau/nbt-ts
// Author: janispritzkau
// ====================================================
import { Tag, TagType, Byte, Float, Int, Short, getTagType, TagObject, TagMap } from './tag.js'

export interface DecodeResult {
  name: string | null
  value: Tag | null
  length: number
}

export interface DecodeOptions {
  /** Use ES6 `Map`s for compound tags instead of plain objects. */
  useMaps?: boolean
  /** Whether the root tag has a name. */
  unnamed?: boolean
}

/**
 * Decode a nbt tag from buffer.
 *
 * The result contains the decoded nbt value, the tag's name, if present,
 * and the length of how much was read from the buffer.
 */
export function decode(buffer: Buffer, readOffset: number, options: DecodeOptions = {}): DecodeResult {
  const tagType = buffer.readUInt8(readOffset)

  if (tagType == TagType.End) return { name: null, value: null, length: 1 }

  let name: string | null = null
  let offset = readOffset + 1

  if (!options.unnamed) {
    const len = buffer.readUInt16BE(offset)
    offset += 2
    name = buffer.toString('utf-8', offset, offset += len)
  }

  const result = decodeTagValue(tagType, buffer, offset, !!options.useMaps)
  return { name, value: result.value, length: result.offset }
}

/**
 * Encode a nbt tag into a buffer.
 *
 * @param buffer The buffer to write to.
 * @param start - The offset to start writing at.
 * @param name Resulting tag will be unnamed if name is `null`.
 * @param tag If tag is `null`, only a zero byte is returned.
 */
export function encode(buffer: Buffer, start: number,  name: string | null, tag: Tag | null) {
  let offset = start

  // write tag type
  offset = buffer.writeUInt8(tag == null ? TagType.End : getTagType(tag), offset)

  // write tag name
  if (tag != null && name != null) offset = writeString(name, buffer, offset)

  // write tag value
  if (tag != null) offset = encodeTagValue(tag, buffer, offset)

  return offset
}

/** Encode a string with it's length prefixed as unsigned 16 bit integer */
function writeString(text: string, buffer: Buffer, offset: number) {
  const length = Buffer.byteLength(text, 'utf-8')
  offset = buffer.writeUInt16BE(length, offset)
  buffer.write(text, offset)
  offset += length
  return offset
}

function decodeTagValue(type: number, buffer: Buffer, offset: number, useMaps: boolean) {
  let value: Tag
  switch (type) {
  case TagType.Byte:
    value = new Byte(buffer.readInt8((offset += 1) - 1))
    break
  case TagType.Short:
    value = new Short(buffer.readInt16BE((offset += 2) - 2))
    break
  case TagType.Int:
    value = new Int(buffer.readInt32BE((offset += 4) - 4))
    break
  case TagType.Long:
    value = buffer.readBigInt64BE((offset += 8) - 8)
    break
  case TagType.Float:
    value = new Float(buffer.readFloatBE((offset += 4) - 4))
    break
  case TagType.Double:
    value = buffer.readDoubleBE((offset += 8) - 8)
    break
  case TagType.ByteArray: {
    const len = buffer.readUInt32BE(offset)
    offset += 4
    value = buffer.slice(offset, offset += len)
    break
  }
  case TagType.String: {
    const len = buffer.readUInt16BE(offset)
    offset += 2
    value = buffer.toString('utf-8', offset, offset += len)
    break
  }
  case TagType.List: {
    const type = buffer.readUInt8(offset)
    const len = buffer.readUInt32BE(offset + 1)
    offset += 5
    const items: Tag[] = []
    for (let i = 0; i < len; i++) {
      ({ value, offset } = decodeTagValue(type, buffer, offset, useMaps))
      items.push(value)
    }
    value = items
    break
  }
  case TagType.Compound: {
    const object = useMaps ? new Map : {}
    while (true) {
      const type = buffer.readUInt8(offset)
      offset += 1
      if (type == TagType.End) break
      const len = buffer.readUInt16BE(offset)
      offset += 2
      const name = buffer.toString('utf-8', offset, offset += len);
      ({ value, offset } = decodeTagValue(type, buffer, offset, useMaps))
      if (useMaps) (<TagMap>object).set(name, value)
      else (<TagObject>object)[name] = value
    }
    value = object
    break
  }
  case TagType.IntArray: {
    const length = buffer.readUInt32BE(offset)
    offset += 4
    const array = value = new Int32Array(length)
    for (let i = 0; i < length; i++) {
      array[i] = buffer.readInt32BE(offset + i * 4)
    }
    offset += array.buffer.byteLength
    break
  }
  case TagType.LongArray: {
    const length = buffer.readUInt32BE(offset)
    offset += 4
    const array = value = new BigInt64Array(length)
    for (let i = 0; i < length; i++) {
      array[i] = buffer.readBigInt64BE(offset + i * 8)
    }
    offset += array.buffer.byteLength
    break
  }
  default:
    throw new Error(`Tag type ${type} not implemented`)
  }
  return { value: <Tag>value, offset }
}

function encodeTagValue(tag: Tag, buffer: Buffer, offset: number) {
  if (tag instanceof Byte) {
    offset = tag.value < 0
      ? buffer.writeInt8(tag.value, offset)
      : buffer.writeUInt8(tag.value, offset)
  } else if (tag instanceof Short) {
    offset = tag.value < 0
      ? buffer.writeInt16BE(tag.value, offset)
      : buffer.writeUInt16BE(tag.value, offset)
  } else if (tag instanceof Int) {
    offset = tag.value < 0
      ? buffer.writeInt32BE(tag.value, offset)
      : buffer.writeUInt32BE(tag.value, offset)
  } else if (typeof tag == 'bigint') {
    new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).setBigInt64(offset, tag)
    offset += 8
  } else if (tag instanceof Float) {
    offset = buffer.writeFloatBE(tag.value, offset)
  } else if (typeof tag == 'number') {
    offset = buffer.writeDoubleBE(tag, offset)
  } else if (tag instanceof Buffer || tag instanceof Int8Array) {
    offset = buffer.writeUInt32BE(tag.length, offset)
    buffer.set(tag, offset)
    offset += tag.length
  } else if (tag instanceof Array) {
    const type = tag.length > 0 ? getTagType(tag[0]) : TagType.End
    offset = buffer.writeUInt8(type, offset)
    offset = buffer.writeUInt32BE(tag.length, offset)
    for (const item of tag) {
      if (getTagType(item) != type) throw new Error('Odd tag type in list');
      offset = encodeTagValue(item, buffer, offset)
    }
  } else if (typeof tag == 'string') {
    (offset = writeString(tag, buffer, offset))
  } else if (tag instanceof Int32Array) {
    offset = buffer.writeUInt32BE(tag.length, offset)
    for (let i = 0; i < tag.length; i++) {
      buffer.writeInt32BE(tag[i], offset + i * 4)
    }
    offset += tag.byteLength
  } else if (tag instanceof BigInt64Array) {
    offset = buffer.writeUInt32BE(tag.length, offset)
    for (let i = 0; i < tag.length; i++)
      buffer.writeBigInt64BE(tag[i], offset + i * 8)
    offset += tag.byteLength
  } else {
    for (const [key, value] of tag instanceof Map ? tag : Object.entries(tag)
      .filter(([_, v]) => v != null)) {
      offset = buffer.writeUInt8(getTagType(value!), offset)
      offset = writeString(key, buffer, offset)
      offset = encodeTagValue(value!, buffer, offset)
    }
    offset = buffer.writeUInt8(0, offset)
  }

  return offset
}