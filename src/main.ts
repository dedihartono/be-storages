import * as dotenv from "dotenv"
import * as http from "http"
import mongoose from "mongoose"
import * as path from "path"
import {
  handleFileDeletion,
  handleFileDeletionPassphraseCode,
  handleFileList,
  handleFileRetrieval,
  handleFileUpload,
  handleGetFileById,
} from "./controllers"
import { logServer } from "./logger"
import { validateApiKey } from "./middlewares"
import { getMimeType, serveStaticFile } from "./utils"

dotenv.config()

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

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, PUT, OPTIONS"
  )
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Requested-With, Authorization, x-api-key"
  )

  if (req.method?.toLowerCase() === "options") {
    res.writeHead(204)
    res.end()
    return
  }

  const publicFolder = path.join(__dirname, "../public")

  if (req.url === "/favicon.ico") {
    serveStaticFile(
      path.join(__dirname, "../public/favicon.ico"),
      "image/x-icon",
      res
    )
    return
  }

  if (req.url === "/site.webmanifest") {
    serveStaticFile(
      path.join(__dirname, "../public/site.webmanifest"),
      "application/manifest+json",
      res
    )
    return
  }

  // Serve index.html on root path without requiring API key
  if (req.method?.toLowerCase() === "get" && req.url === "/") {
    const filePath = path.join(publicFolder, "index.html")
    serveStaticFile(filePath, "text/html", res)
    return
  }
  if (req.method?.toLowerCase() === "get" && req.url?.startsWith("/files/")) {
    handleFileRetrieval(req, res)
    return
  }

  // Serve static files (e.g., images) from public/static/
  if (req.url?.startsWith("/static/")) {
    const filePath = path.join(__dirname, "../public", req.url)
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = getMimeType(ext)
    serveStaticFile(filePath, mimeType, res)
    return
  }

  if (!validateApiKey(req, res)) return

  switch (true) {
    case req.method?.toLowerCase() === "post" && req.url === "/upload":
      handleFileUpload(req, res)
      break
    case req.method?.toLowerCase() === "delete" &&
      req.url?.startsWith("/delete-passphrase?code="):
      handleFileDeletionPassphraseCode(req, res)
      break
    case req.method?.toLowerCase() === "delete" &&
      req.url?.startsWith("/delete"):
      handleFileDeletion(req, res)
      break
    case req.method?.toLowerCase() === "get" && req.url !== "/list":
      handleGetFileById(req, res) // Pass the file ID to the handler
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
