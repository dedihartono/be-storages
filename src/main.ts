import * as dotenv from "dotenv"
import * as http from "http"
import mongoose from "mongoose"
import {
  handleFileDeletion,
  handleFileDeletionPassphraseCode,
  handleFileList,
  handleFileRetrieval,
  handleFileUpload,
} from "./controllers"
import { logServer } from "./logger"

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
