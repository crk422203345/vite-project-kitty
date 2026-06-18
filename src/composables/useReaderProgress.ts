import { ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'

export function useReaderProgress() {
  const currentChapterIndex = ref(0)

  // Throttled save function to prevent high-frequency localStorage writes
  const throttledSave = useThrottleFn((bookName: string, index: number) => {
    localStorage.setItem(`progress_${bookName}`, index.toString())
  }, 1000)

  const saveProgress = (bookName: string) => {
    throttledSave(bookName, currentChapterIndex.value)
  }

  const loadProgress = (bookName: string, chaptersLength: number) => {
    const saved = localStorage.getItem(`progress_${bookName}`)
    if (saved) {
      const index = parseInt(saved)
      if (index >= 0 && index < chaptersLength) {
        currentChapterIndex.value = index
        return index
      }
    }
    currentChapterIndex.value = 0
    return 0
  }

  const changeChapter = (index: number, chaptersLength: number, bookName: string) => {
    if (index >= 0 && index < chaptersLength) {
      currentChapterIndex.value = index
      saveProgress(bookName)
      return true
    }
    return false
  }

  return {
    currentChapterIndex,
    saveProgress,
    loadProgress,
    changeChapter,
  }
}
