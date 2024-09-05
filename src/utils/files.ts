import crypto from "crypto"
import * as fs from "fs"
import * as http from "http"
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

export const serveStaticFile = (
  filePath: string,
  contentType: string,
  res: http.ServerResponse
) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" })
      res.end("File not found")
      return
    }
    res.writeHead(200, { "Content-Type": contentType })
    res.end(data)
  })
}

export function getMimeType(ext: string): string {
  switch (ext) {
    case ".ico":
      return "image/x-icon"
    case ".html":
      return "text/html"
    case ".css":
      return "text/css"
    case ".js":
      return "application/javascript"
    case ".png":
      return "image/png"
    case ".json":
      return "application/json"
    default:
      return "application/octet-stream"
  }
}
