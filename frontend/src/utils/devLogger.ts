import { isDeveloper } from '../api/auth'

export const devLog = (...args: any[]): void => {
    if (isDeveloper()) {
        console.log('[DEV]', ...args)
    }
}

export const devError = (...args: any[]): void => {
    if (isDeveloper()) {
        console.error('[DEV ERROR]', ...args)
    }
}

export const devWarn = (...args: any[]): void => {
    if (isDeveloper()) {
        console.warn('[DEV WARN]', ...args)
    }
}
