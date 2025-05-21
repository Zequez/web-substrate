import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join } from 'path'

type Box = {
  x: number
  y: number
  w: number
  h: number
}
type Old = {
  bodies: {
    main: {
      box: Box
      visible: boolean
    }
    code: {
      box: Box
      visible: boolean
    }
  }
  updatedAt: number
  data: any
}

type New = {
  bodies: {
    main: {
      box: Box
      visible: boolean
    }
    code: {
      box: Box
      visible: boolean
    }
    inner: {
      box: Box
      visible: boolean
    }
  }
  updatedAt: number
  data: any
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(dir, entry.name)
      return entry.isDirectory() ? walk(fullPath) : fullPath
    }),
  )
  return files.flat()
}

async function updateMetaFiles(root: string) {
  const allFiles = await walk(root)
  const metaFiles = allFiles.filter((f) => f.endsWith('.meta.json'))

  for (const file of metaFiles) {
    try {
      const content = await readFile(file, 'utf-8')
      const oldData: Old = JSON.parse(content)

      if ((oldData.bodies as any).inner) {
        continue
      }

      const newData: New = {
        ...oldData,
        bodies: { ...oldData.bodies, inner: oldData.bodies.main },
      }

      await writeFile(file, JSON.stringify(newData, null, 2), 'utf-8')
      console.log(`✅ Updated: ${file}`)
    } catch (err) {
      console.error(`❌ Failed to update ${file}:`, err)
    }
  }
}

// Run the script
const rootDir = Bun.argv[2] ?? '.'
updateMetaFiles(rootDir)
