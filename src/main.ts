import * as http from "http"
import * as formidable from "formidable"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import mongoose from "mongoose"
import crypto from "crypto"
import File from "./models/File"
import { logUpload, logError, logServer } from "./logger"

dotenv.config()

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "10", 10)
const MONGODB_URI = process.env.MONGODB_URI || ""

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    logServer("Connected to MongoDB")
    console.log("Connected to MongoDB")
  } catch (err) {
    logServer(`MongoDB connection error: ${err}`)
    console.error("MongoDB connection error:", err)
  }
}
const generateFileName = (originalName: string) => {
  const time = Date.now().toString()
  const hash = crypto
    .createHash("md5")
    .update(originalName + time)
    .digest("hex")
  const ext = path.extname(originalName)
  return `${time}-${hash}${ext}`
}

const handleFileUpload = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    const form = new formidable.IncomingForm({
      maxFileSize: MAX_UPLOAD_SIZE * 1024 * 1024,
      multiples: true,
    })
  
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logError(`File upload failed: ${err.message}`)
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({ message: "File upload failed", error: err.message })
        )
        return
      }
  
      try {
        const fileArray = Array.isArray(files.file) ? files.file : [files.file]
        const fileDetails: { name: string; location: string }[] = []
  
        for (const file of fileArray) {
          const oldPath = (file as formidable.File).filepath
          const date = new Date()
          const year = date.getFullYear()
          const month = `0${date.getMonth() + 1}`.slice(-2)
          const day = `0${date.getDate()}`.slice(-2)
          const uploadDir = path.join(
            "storages",
            "uploads",
            `${year}-${month}-${day}`
          )
  
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
          }
  
          const newFileName = generateFileName((file as formidable.File).originalFilename || "")
          const newPath = path.join(uploadDir, newFileName)
          fs.renameSync(oldPath, newPath)
  
          const newFile = new File({
            filename: newFileName,
            path: newPath,
            type: (file as formidable.File).mimetype,
            size: (file as formidable.File).size,
            alt: fields.alt as string[],
            description: fields.description as string[],
            uploadedAt: new Date(),
          })
  
          await newFile.save()
  
          fileDetails.push({
            name: newFileName,
            location: newPath,
          })
          logUpload(`File uploaded: ${newFile.filename}, path: ${newFile.path}`)
        }
  
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            message: "Files uploaded successfully",
            files: fileDetails,
          })
        )
      } catch (err: any) {
        logError(`File processing error: ${err.message}`)
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            message: "File processing error",
            error: err.message,
          })
        )
      }
    })
  }

const handleFileDeletion = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const id = req.url?.split("/").pop()
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "File ID is required" }))
    return
  }

  try {
    const file = await File.findByIdAndDelete(id)
    if (!file) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "File not found" }))
      return
    }

    fs.unlink(file.path, (err) => {
      if (err) {
        logError(`File unlink failed: ${err.message}`)
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({ message: "File unlink failed", error: err.message })
        )
        return
      }
      logUpload(`File deleted: ${file.filename}, path: ${file.path}`)
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "File deleted successfully", file }))
    })
  } catch (err: any) {
    logError(`File deletion err: ${err.message}`)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({ message: "File deletion failed", error: err.message })
    )
  }
}

const handleFileRetrieval = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const filePath = req.url?.replace("/files/", "")
  const absolutePath = path.join("storages", "uploads", filePath || "")

  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      logError(`File retrieval err: ${err.message}`)
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "File not found", error: err.message }))
      return
    }

    const ext = path.extname(absolutePath)
    let contentType = "application/octet-stream"
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
    else if (ext === ".png") contentType = "image/png"
    else if (ext === ".gif") contentType = "image/gif"
    else if (ext === ".pdf") contentType = "application/pdf"

    res.writeHead(200, { "Content-Type": contentType })
    res.end(data)
  })
}

const handleFileList = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  try {
    const files = await File.find().exec()
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ files }))
  } catch (err: any) {
    logError(`File list retrieval err: ${err.message}`)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        message: "Failed to retrieve files",
        error: err.message,
      })
    )
  }
}

const server = http.createServer((req, res) => {
  switch (true) {
    case req.method?.toLowerCase() === "post" && req.url === "/upload":
      handleFileUpload(req, res)
      break
    case req.method?.toLowerCase() === "delete" &&
      req.url?.startsWith("/delete"):
      handleFileDeletion(req, res)
      break
    case req.method?.toLowerCase() === "get" && req.url?.startsWith("/files/"):
      handleFileRetrieval(req, res)
      break
    case req.method?.toLowerCase() === "get" && req.url === "/list":
      handleFileList(req, res)
      break
    default:
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "Not Found" }))
      break
  }
})

const PORT = 3000
server.listen(PORT, () => {
  logServer(`Server is running on port ${PORT}`)
  console.log(`Server is running on port ${PORT}`)
})

// Initialize database connection
connectToDatabase()
