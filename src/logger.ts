import fs from "fs"
import path from "path"

const logDir = path.join(__dirname, "..", "storages", "logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

export function logUpload(message: string): void {
  const logPath = path.join(
    logDir,
    `${new Date().toISOString().split("T")[0]}-upload.log`
  )
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`)
}

export function logServer(message: string): void {
  const logPath = path.join(
    logDir,
    `${new Date().toISOString().split("T")[0]}-server.log`
  )
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`)
}

export function logError(message: string): void {
  const logPath = path.join(
    logDir,
    `${new Date().toISOString().split("T")[0]}-error.log`
  )
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`)
}
