import varint from 'varint'
import { Logger } from '../logger/Logger.js'

export interface FrameData {
  data: Buffer,
  length: number,
}

export class Framer {
  private frames: FrameData[] = []
  private currentFrameIndex = 0

  constructor(private readonly logger: Logger) {}

  push(data: Buffer): void {
    try {
      const nextFrame = this.frames[this.currentFrameIndex]
      if (nextFrame) {
        data.slice(nextFrame.length).copy(nextFrame.data, nextFrame.length)
        const residue = data.length - nextFrame.length
        if (residue >= 0) {
          this.currentFrameIndex++
          if (residue !== 0) this.push(data.slice(nextFrame.length))
        }
      } else {
        const length = varint.decode(data)
        const lastFrame = this.frames[this.frames.push({
          length,
          data: Buffer.alloc(length),
        }) - 1]
        data.slice(varint.decode.bytes, length + varint.decode.bytes).copy(lastFrame.data)
        const residue = data.length - (varint.decode.bytes + length)
        if (residue >= 0) {
          this.currentFrameIndex++
          if (residue !== 0) this.push(data.slice(length + varint.decode.bytes))
        }
      }
    } catch (e: any) {
      this.logger.debug(`Failed to frame chunk: ${e.message}`)
    }
  }

  ejectFrames(): Buffer[] {
    const frames = this.frames.filter(v => v.length === v.data.length).map(frame => frame.data)
    this.currentFrameIndex = 0
    return frames as Buffer[]
  }

  hasFrames(): boolean {
    return this.frames.length > 0
  }
}
