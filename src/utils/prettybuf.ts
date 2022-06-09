export const prettybuf = (buf: Buffer): string => {
  const str = buf.toString('hex')
  const strs = str.match(/.{1,2}/g) ?? []
  return strs.join(' ').toUpperCase()
}