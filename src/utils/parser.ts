export interface Chapter {
  title: string
  content: string
}

/**
 * Parses raw TXT novel content into structured chapters.
 * @param text The full raw text of the novel.
 * @returns Array of structured chapters.
 */
export function parseTxtContent(text: string): Chapter[] {
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n')

  // Regex to match chapter headings: e.g. "第一章 ...", "第1章 ...", "第一节 ...", "第1回 ..."
  const chapterRegex = /^\s*(第[零一二三四五六七八九十百千万\d]+[章节回集部卷].*)$/gm
  const result: Chapter[] = []
  const matches = [...normalizedText.matchAll(chapterRegex)]

  if (matches.length > 0) {
    // If there is introductory text before the first chapter, capture it as "前言"
    if (matches[0].index! > 0) {
      result.push({
        title: '前言',
        content: normalizedText.substring(0, matches[0].index).trim(),
      })
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!
      const end = i < matches.length - 1 ? matches[i + 1].index! : normalizedText.length
      const fullMatch = matches[i][0]
      const title = fullMatch.trim()
      // Extract the content between this match and the start of the next match
      const content = normalizedText.substring(start + fullMatch.length, end).trim()

      result.push({ title, content })
    }
  } else {
    // Fallback: If no chapter matches, treat the entire text as a single chapter
    result.push({ title: '正文', content: normalizedText.trim() })
  }

  return result
}
