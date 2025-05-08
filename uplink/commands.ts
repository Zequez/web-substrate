import { readdir, readFile as fsReadFile, stat } from 'fs/promises'
import { join } from 'path'

export async function ping<T>(msg?: T): Promise<['pong', T | undefined]> {
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

export async function readFile(fileName: string): Promise<UplinkFile> {
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

export async function writeFile(fileName: string, content: UplinkFile) {
  const filePath = join('.', fileName)
  if (content.type === 'text') {
    await Bun.write(filePath, content.data)
  }
  return true
}

export const cmds = {
  ping,
  filesList,
  readFile,
  writeFile,
}

export type UplinkCmd =
  | ['ping', ...Parameters<typeof ping>]
  | ['filesList', ...Parameters<typeof filesList>]
  | ['readFile', ...Parameters<typeof readFile>]
  | ['writeFile', ...Parameters<typeof writeFile>]

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
