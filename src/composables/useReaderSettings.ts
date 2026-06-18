import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type ThemeType = 'light' | 'green' | 'dark'

export function useReaderSettings() {
  const fontSize = useLocalStorage('reader_font_size', 18)
  const theme = useLocalStorage<ThemeType>('reader_theme', 'light')
  const isControlsVisible = ref(false)
  const isFullscreen = ref(false)

  const applyTheme = (newTheme: ThemeType) => {
    theme.value = newTheme
    document.body.className = newTheme
  }

  const initTheme = () => {
    document.body.className = theme.value
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          isFullscreen.value = true
        })
        .catch((err) => {
          console.error('Failed to enter fullscreen:', err)
        })
    } else {
      document.exitFullscreen()
        .then(() => {
          isFullscreen.value = false
        })
        .catch((err) => {
          console.error('Failed to exit fullscreen:', err)
        })
    }
  }

  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  return {
    fontSize,
    theme,
    isControlsVisible,
    isFullscreen,
    applyTheme,
    initTheme,
    toggleFullscreen,
    handleFullscreenChange,
  }
}
