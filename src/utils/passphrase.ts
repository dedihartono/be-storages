import * as fs from "fs"
import * as path from "path"

export function generatePassphrase(): string {
  const filePath = path.join(__dirname, "../data/passphrase-wordlist.txt")
  const wordlist = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean)

  let phrase: string[] = []

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * wordlist.length)
    phrase.push(wordlist[randomIndex])
  }

  return phrase.join(" ")
}
