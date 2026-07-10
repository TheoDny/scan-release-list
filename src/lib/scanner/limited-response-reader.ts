type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs: number
}

export async function fetchWithTimeout(
  input: string | URL,
  { timeoutMs, signal, ...init }: FetchWithTimeoutOptions
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  signal?.addEventListener("abort", () => controller.abort(), { once: true })

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("La requête a expiré.")
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function readResponseBytesWithLimit(
  response: Response,
  maxBytes: number,
  tooLargeMessage: string
) {
  const reader = response.body?.getReader()

  if (!reader) {
    throw new Error("Réponse illisible.")
  }

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalBytes += value.byteLength

      if (totalBytes > maxBytes) {
        await reader.cancel()
        throw new Error(tooLargeMessage)
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return concatenateBytes(chunks, totalBytes)
}

function concatenateBytes(chunks: Uint8Array[], totalBytes: number) {
  const bytes = new Uint8Array(totalBytes)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return bytes
}
