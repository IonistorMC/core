import { DataType } from '../DataType.js'
import { JSONChatComponent } from '@ionistor/jcc'
import { TypedBuffer } from '../TypedBuffer.js'

export class Chat extends DataType<JSONChatComponent> {
  read(buffer: TypedBuffer): [JSONChatComponent, number] {
    return [JSONChatComponent.parse(buffer.readString()), 0]
  }

  write(buffer: TypedBuffer, value: JSONChatComponent): number {
    buffer.writeString(value.toJSON())
    return 0
  }
}
