import * as http from "http"

import * as dotenv from "dotenv"

dotenv.config()

const API_KEY = process.env.API_KEY || ""

const validateApiKey = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const apiKey = req.headers["x-api-key"]

  if (!apiKey || apiKey !== API_KEY) {
    res.writeHead(401, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "Unauthorized: Invalid API Key" }))
    return false
  }
  return true
}

export {
  validateApiKey
}