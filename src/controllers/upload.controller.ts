import * as dotenv from "dotenv"
import * as formidable from "formidable"
import * as fs from "fs"
import * as http from "http"
import * as path from "path"
import { logError, logUpload } from "../logger"
import File from "../models/File"
import { generateFileName, generatePassphrase } from "../utils"

dotenv.config()

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "10", 10)

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
      const fileDetails: {
        name: string
        location: string
        passphraseCode: string
      }[] = []

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

        const newFileName = generateFileName(
          (file as formidable.File).originalFilename || ""
        )
        const newPath = path.join(uploadDir, newFileName)

        fs.copyFileSync(oldPath, newPath)
        fs.unlinkSync(oldPath)

        const newFile = new File({
          filename: newFileName,
          path: newPath,
          type: (file as formidable.File).mimetype,
          size: (file as formidable.File).size,
          alt: fields.alt as string[],
          passphraseCode: generatePassphrase(),
          description: fields.description as string[],
          uploadedAt: new Date(),
        })

        await newFile.save()

        fileDetails.push({
          name: newFileName,
          location: newPath,
          passphraseCode: newFile.passphraseCode!,
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
  const absolutePath = path.join(filePath || "")

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

const handleFileDeletionPassphraseCode = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  // Extract passphraseCode from the query parameters or request body
  const passphraseCode = new URL(
    req.url || "",
    `http://${req.headers.host}`
  ).searchParams.get("code")
  if (!passphraseCode) {
    res.writeHead(400, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "Passphrase code is required" }))
    return
  }

  try {
    // Find the file by passphrase code
    const file = await File.findOneAndDelete({ passphraseCode })
    if (!file) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "File not found" }))
      return
    }

    // Delete the file from the filesystem
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
    logError(`File deletion error: ${err.message}`)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({ message: "File deletion failed", error: err.message })
    )
  }
}

const handleGetFileById = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const id = req.url?.split("/").pop()
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "File ID is required" }))
    return
  }

  try {
    const fileRecord = await File.findOne({_id: id});

    if (!fileRecord) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "File not found" }))
      return
    }

    const result = {
      "_id": fileRecord._id,
      "filename": fileRecord.filename,
      "path": fileRecord.path,
    }
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ file: result }))
  
  } catch (err: any) {
    console.error(`Error retrieving file: ${err.message}`)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({ message: "Internal Server Error", error: err.message })
    )
  }
}

export {
  handleFileUpload,
  handleFileList,
  handleFileRetrieval,
  handleFileDeletion,
  handleFileDeletionPassphraseCode,
  handleGetFileById
}
