import { parseTxtContent } from '../utils/parser'

self.addEventListener('message', (e: MessageEvent<string>) => {
  try {
    const text = e.data
    const chapters = parseTxtContent(text)
    self.postMessage({ success: true, chapters })
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})
