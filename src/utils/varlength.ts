export const varlength = (value: number): number => {
  let length = 0
  while (value > 0x7f) {
    value = value >>> 7
    length++
  }
  return length + 1
}
