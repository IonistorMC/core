import varint from 'varint'
import { logger } from '../logger/Logger.js'
import * as zlib from 'zlib'

export interface FrameData {
  data: Buffer,
  length: number,
}

export class Framer {
  private frames: FrameData[] = []
  private currentFrameIndex = 0

  push(data: Buffer, compression?: boolean): void {
    try {
      const nextFrame = this.frames[this.currentFrameIndex]
      if (nextFrame) {
        data.slice(nextFrame.length).copy(nextFrame.data, nextFrame.length)
        if (data.length - nextFrame.length > 0) {
          this.currentFrameIndex++
          this.push(data.slice(nextFrame.length))
        }
      } else {
        const length = varint.decode(data)
        const lastFrame = this.frames[this.frames.push({
          length,
          data: Buffer.alloc(length),
        }) - 1]
        data.slice(varint.decode.bytes, length + varint.decode.bytes).copy(lastFrame.data)
        if (data.length - varint.decode.bytes - length > 0) {
          this.currentFrameIndex++
          this.push(data.slice(length + varint.decode.bytes))
        }
      }
      try {
        if(compression) nextFrame.data = Framer.decompress(nextFrame.data)
      }catch (e: any) {
        logger.debug(`Failed to decompress frame: ${e.message}`)
      }
    } catch (e: any) {
      logger.debug(`Failed to frame chunk: ${e.message}`)
    }
  }

  private static decompress(data: Buffer): Buffer {
    const payloadLength = varint.decode(data)
    if (payloadLength > 0) {
      const decompressed = zlib.unzipSync(data.slice(varint.decode.bytes))
      if (decompressed.length === payloadLength) return decompressed
    } else return data.slice(varint.decode.bytes)
    throw new Error('Failed to decompress')
  }

  ejectFrames(): Buffer[] {
    const frames = this.frames.filter(v => v.length === v.data.length).map(frame => frame.data)
    this.currentFrameIndex = 0
    return frames as Buffer[]
  }
}
