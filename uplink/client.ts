import type { UplinkCmd, UplinkReturn, UplinkFile } from './commands'

// type UplinkCmd = any[]
// type UplinkReturn<T> = any

export { type UplinkFile }

async function uplink<T extends UplinkCmd>(
  ...cmd: T
): Promise<UplinkReturn<T>> {
  console.log('🔻 Uplink:\n', cmd)

  const response = await fetch(`http://localhost:18215/${cmd}`, {
    method: 'POST',
    body: JSON.stringify(cmd),
  })

  const data = await response.json()

  console.log('🟩 Uplink:\n', data)
  return data as UplinkReturn<T> // Ensures TypeScript correctly maps return type
}

export { uplink }

// if (data && data.type === 'binary' && data.encoding === 'base64') {
//   data.blob = new Blob(
//     [Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0))],
//     { type: data.mimeType },
//   )
// }
