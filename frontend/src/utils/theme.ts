const THEME_KEY = 'blog_theme'

export type Theme = 'light' | 'dark'

export const getTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const setTheme = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const toggleTheme = () => {
  const current = getTheme()
  const next = current === 'light' ? 'dark' : 'light'
  setTheme(next)
  return next
}

export const initTheme = () => {
  const theme = getTheme()
  applyTheme(theme)
  return theme
}