import {
  readdir,
  readFile as fsReadFile,
  stat,
  rename as fsRename,
  mkdir,
} from 'fs/promises'
import { join } from 'path'

async function ping<T>(msg?: T): Promise<['pong', T | undefined]> {
  return ['pong', msg]
}

export async function filesList(directory: string) {
  const files = await readdir(join(directory))
  return files
}

export type UplinkFile =
  | {
      type: 'binary'
      encoding: 'base64'
      mimeType: string
      data: string
    }
  | {
      type: 'text'
      data: string
    }
  | {
      type: 'directory'
      data: string[]
    }

async function readFile(fileName: string): Promise<UplinkFile> {
  const filePath = join('.', fileName)
  const stats = await stat(filePath)
  if (stats.isDirectory()) {
    const files = await readdir(filePath)
    return {
      type: 'directory',
      data: files,
    }
  } else {
    const file = await Bun.file(filePath)

    // Check if it's a binary file based on extension (you can improve this)
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf']
    const isBinary = binaryExtensions.some((ext) => filePath.endsWith(ext))

    if (isBinary) {
      // Read file as binary and encode as Base64
      const buffer = await fsReadFile(filePath)
      const base64 = buffer.toString('base64')

      return {
        type: 'binary',
        encoding: 'base64',
        mimeType: file.type, // Auto-detect MIME type (if Bun.file supports it)
        data: base64,
      }
    } else {
      return {
        type: 'text',
        data: await file.text(),
      }
    }
  }
}

async function writeFile(fileName: string, content: UplinkFile) {
  const filePath = join('.', fileName)
  if (content.type === 'text') {
    await Bun.write(filePath, content.data)
  }
  return true
}

async function renameFrameComponent(name: string, newName: string) {
  const framesDir = 'frames'

  // Build absolute/relative paths once.
  const oldSvelte = join(framesDir, `${name}.svelte`)
  const newSvelte = join(framesDir, `${newName}.svelte`)
  const oldMeta = join(framesDir, `${name}.meta.json`)
  const newMeta = join(framesDir, `${newName}.meta.json`)

  // ── 1. Guard: bail if new component already exists ───────────────
  const exists = async (p: string) =>
    stat(p)
      .then(() => true)
      .catch((e) => e.code !== 'ENOENT' && Promise.reject(e))

  if ((await exists(newSvelte)) || (await exists(newMeta))) {
    throw new Error(`A frame called “${newName}” already exists.`)
  }

  // ── 2. Rename both artefacts (this will throw if originals missing) ─
  await fsRename(oldSvelte, newSvelte)
  await fsRename(oldMeta, newMeta)

  // ── 3. Patch meta file if it hard-codes the old name ───────────────
  try {
    const raw = await fsReadFile(newMeta, 'utf8')
    const meta = JSON.parse(raw)

    let changed = false
    if (meta.name === name) {
      meta.name = newName
      changed = true
    }
    if (meta.component === name) {
      meta.component = newName
      changed = true
    }

    if (changed) {
      await Bun.write(newMeta, JSON.stringify(meta, null, 2))
    }
  } catch {
    /* if parsing fails we simply leave the file untouched */
  }

  return true // keeps the command API consistent with writeFile()
}

async function createFrameComponent(
  name: string,
  meta: string,
  component: string,
) {
  const framesDir = 'frames'
  const sveltePath = join(framesDir, `${name}.svelte`)
  const metaPath = join(framesDir, `${name}.meta.json`)

  // 1. Ensure frames/ exists.
  await mkdir(framesDir, { recursive: true })

  // 2. Guard: abort if either target file already exists.
  const exists = async (p: string) =>
    stat(p)
      .then(() => true)
      .catch((e) => e.code !== 'ENOENT' && Promise.reject(e))

  if ((await exists(sveltePath)) || (await exists(metaPath))) {
    throw new Error(`A frame called “${name}” already exists.`)
  }

  // 3. Write both files.
  await Bun.write(sveltePath, component)
  await Bun.write(metaPath, meta.endsWith('\n') ? meta : `${meta}\n`)

  return true
}

export const cmds = {
  ping,
  filesList,
  readFile,
  writeFile,
  renameFrameComponent,
  createFrameComponent,
}

export type UplinkCmd =
  | ['ping', ...Parameters<typeof ping>]
  | ['filesList', ...Parameters<typeof filesList>]
  | ['readFile', ...Parameters<typeof readFile>]
  | ['writeFile', ...Parameters<typeof writeFile>]
  | ['renameFrameComponent', ...Parameters<typeof renameFrameComponent>]
  | ['createFrameComponent', ...Parameters<typeof createFrameComponent>]

export type UplinkReturn<T extends UplinkCmd> = T extends [
  infer K extends keyof typeof cmds,
  ...infer Args,
]
  ? Awaited<ReturnType<(typeof cmds)[K]>>
  : never

export async function run(cmd: UplinkCmd) {
  // @ts-ignore
  return await cmds[cmd[0]](...cmd.slice(1))
}
