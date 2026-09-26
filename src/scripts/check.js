import { readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import SwaggerParser from '@apidevtools/swagger-parser'
import spec from '../openapi.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return javascriptFiles(fullPath)
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : []
  }))
  return nested.flat()
}

for (const file of await javascriptFiles(root)) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--check', file], { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Syntax check failed: ${file}`)))
  })
}

await SwaggerParser.validate(spec)
console.log(`Validated ${Object.keys(spec.paths).length} OpenAPI paths and all backend JavaScript files.`)
