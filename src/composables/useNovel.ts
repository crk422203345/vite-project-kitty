import { ref } from 'vue'
import type { Chapter } from '../utils/parser'
import { parseTxtContent } from '../utils/parser'

export function useNovel() {
  const bookName = ref('未命名小说')
  const chapters = ref<Chapter[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const parseWithWorker = (text: string): Promise<Chapter[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/parser.worker.ts', import.meta.url),
          { type: 'module' }
        )

        worker.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.chapters)
          } else {
            reject(new Error(e.data.error || 'Worker parsing failed'))
          }
          worker.terminate()
        }

        worker.onerror = (err) => {
          reject(err)
          worker.terminate()
        }

        worker.postMessage(text)
      } catch (err) {
        reject(err)
      }
    })
  }

  const parseText = async (text: string) => {
    isLoading.value = true
    error.value = null
    try {
      // Try Web Worker parser first
      chapters.value = await parseWithWorker(text)
    } catch (err) {
      console.warn('Worker parsing failed or not supported, falling back to sync parser:', err)
      try {
        // Fallback to synchronous parsing
        chapters.value = parseTxtContent(text)
      } catch (syncErr) {
        error.value = '解析小说失败，文本格式可能存在问题。'
        console.error(syncErr)
      }
    } finally {
      isLoading.value = false
    }
  }

  const loadDefaultNovel = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch('/txt/novel.txt')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()
      bookName.value = '我的模拟长生路'
      await parseText(text)
    } catch (err) {
      console.error('Failed to load default novel:', err)
      error.value = '加载默认小说失败，请检查网络或点击重新加载'
      isLoading.value = false
    }
  }

  const handleImportFile = async (file: File) => {
    bookName.value = file.name.replace('.txt', '')
    isLoading.value = true
    error.value = null

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      await parseText(text)
    }
    reader.onerror = () => {
      error.value = '读取本地文件失败。'
      isLoading.value = false
    }
    reader.readAsText(file)
  }

  return {
    bookName,
    chapters,
    isLoading,
    error,
    loadDefaultNovel,
    handleImportFile,
  }
}
