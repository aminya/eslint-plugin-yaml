import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

export function getPackageJson(): { name: string; version: string } {
  try {
    const dirname = typeof __dirname === "string" ? __dirname : path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.join(path.dirname(dirname), "package.json")
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"))
  } catch (err) {
    console.error(err)
    return {
      name: "eslint-plugin-yaml",
      version: "1.0.3",
    }
  }
}
