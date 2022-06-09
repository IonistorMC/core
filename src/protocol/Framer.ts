import varint from 'varint'

export interface FrameData {
  data: Buffer,
  length: number,
}

export class Framer {
  private frames: FrameData[] = []
  private currentFrameIndex = 0

  push(data: Buffer): void {
    const nextFrame = this.frames[this.currentFrameIndex]
    if (nextFrame) {
      nextFrame.length += data.copy(nextFrame.data, nextFrame.length, 0, nextFrame.data.length)
      const residue = data.length - nextFrame.data.length
      if (residue >= 0) {
        this.currentFrameIndex++
        if (residue !== 0) this.push(data.slice(nextFrame.data.length))
      }
    } else {
      const length = varint.decode(data)
      const lastFrame = this.frames[this.frames.push({
        length: 0,
        data: Buffer.alloc(length),
      }) - 1]
      lastFrame.length += data.copy(lastFrame.data, 0, varint.decode.bytes, length + varint.decode.bytes)
      const residue = data.length - (varint.decode.bytes + length)
      if (residue >= 0) {
        this.currentFrameIndex++
        if (residue !== 0) this.push(data.slice(length + varint.decode.bytes))
      }
    }
  }

  ejectFrames(): Buffer[] {
    const frames = this.frames.filter(v => v.length === v.data.length).map(frame => frame.data)
    this.frames = []
    this.currentFrameIndex = 0
    return frames as Buffer[]
  }

  hasFrames(): boolean {
    return this.frames.filter(v => v.length === v.data.length).length > 0
  }
}
