export interface Size {
  width: number
  height: number
  type: "jpeg" | "png" | "webp" | "gif"
}

function jpeg(b: Uint8Array): Size | null {
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const marker = b[i + 1]!
    if (marker === 0xff) {
      i++
      continue
    }
    const len = (b[i + 2]! << 8) | b[i + 3]!
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isSof) {
      return { height: (b[i + 5]! << 8) | b[i + 6]!, width: (b[i + 7]! << 8) | b[i + 8]!, type: "jpeg" }
    }
    i += 2 + len
  }
  return null
}

function webp(b: Uint8Array, dv: DataView): Size | null {
  const chunk = String.fromCharCode(...b.subarray(12, 16))
  if (chunk === "VP8X")
    return {
      width: 1 + (dv.getUint32(24, true) & 0xffffff),
      height: 1 + (dv.getUint32(27, true) & 0xffffff),
      type: "webp",
    }
  if (chunk === "VP8 ")
    return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff, type: "webp" }
  if (chunk === "VP8L") {
    const bits = dv.getUint32(21, true)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, type: "webp" }
  }
  return null
}

export function imageSize(bytes: Uint8Array): Size | null {
  if (bytes.length < 30) return null
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpeg(bytes)
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { width: dv.getUint32(16), height: dv.getUint32(20), type: "png" }
  if (
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return webp(bytes, dv)
  if (String.fromCharCode(...bytes.subarray(0, 3)) === "GIF")
    return { width: dv.getUint16(6, true), height: dv.getUint16(8, true), type: "gif" }
  return null
}
