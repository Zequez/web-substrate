import { AI_PORT } from '../ports'

/**
 * A simple Bun server that:
 * 1) Handles CORS for dev convenience.
 * 2) Expects a POST /api/stream with JSON { prompt: string }.
 * 3) Streams the ChatCompletion response from OpenAI to the client.
 */

export default () =>
  Bun.serve({
    port: AI_PORT,
    async fetch(req: Request) {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        })
      }

      // Parse URL
      const url = new URL(req.url)

      // Our streaming route
      if (req.method === 'POST' && url.pathname === '/api/stream') {
        try {
          // Grab the { prompt } from the request
          const { prompt } = (await req.json()) as { prompt?: string }
          if (!prompt) {
            return new Response("Missing 'prompt' field", { status: 400 })
          }

          // Hit the OpenAI ChatCompletion endpoint
          const openaiRes = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo', // or any other GPT model
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                stream: true,
              }),
            },
          )

          if (!openaiRes.ok || !openaiRes.body) {
            const errText = await openaiRes.text()
            console.error('OpenAI error response:', errText)
            return new Response('OpenAI API error', { status: 500 })
          }

          // We'll pipe the stream from OpenAI to a TransformStream,
          // which we return to the client.
          const { readable, writable } = new TransformStream()
          const writer = writable.getWriter()

          // Read the response body in chunks
          const reader = openaiRes.body.getReader()
          const decoder = new TextDecoder()
          const encoder = new TextEncoder()

          ;(async () => {
            try {
              while (true) {
                const { value, done } = await reader.read()
                if (done) {
                  await writer.close()
                  break
                }

                // Convert chunk to text
                const text = decoder.decode(value, { stream: true })
                // Each chunk may contain one or more "data: ..." lines
                const lines = text
                  .split('\n')
                  .filter((line) => line.trim() !== '')

                for (const line of lines) {
                  // OpenAI sends data like: "data: { ...json... }"
                  if (line.startsWith('data: ')) {
                    const jsonStr = line.replace(/^data:\s*/, '')
                    if (jsonStr === '[DONE]') {
                      // Stream finished
                      await writer.close()
                      break
                    }
                    try {
                      const data = JSON.parse(jsonStr)
                      const content = data.choices?.[0]?.delta?.content
                      if (content) {
                        // Write the chunk to our TransformStream
                        await writer.write(encoder.encode(content))
                      }
                    } catch (err) {
                      console.error('Stream JSON parse error:', err, line)
                      // Non-fatal; continue reading
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error reading stream:', e)
              await writer.abort(e)
            }
          })()

          // Return the readable side of the TransformStream
          return new Response(readable, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
              'Access-Control-Allow-Origin': '*',
            },
          })
        } catch (err: any) {
          console.error('Error in /api/stream:', err)
          return new Response(String(err), { status: 500 })
        }
      }

      // Otherwise, 404
      return new Response('Not Found', { status: 404 })
    },
  })
