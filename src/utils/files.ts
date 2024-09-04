import crypto from "crypto"
import * as path from "path"

export function generateFileName(originalName: string): string {
  const time = Date.now().toString()
  const hash = crypto
    .createHash("md5")
    .update(originalName + time)
    .digest("hex")
  const ext = path.extname(originalName)
  return `${time}-${hash}${ext}`
}
