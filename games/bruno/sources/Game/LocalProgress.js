/** 单机进度存储：拒绝无效数据，禁用存储时仍可继续当前游戏。 */
export function readProgress(key, fallback, validate = () => true) {
    try {
        const value = JSON.parse(localStorage.getItem(`astra:bruno:${key}`))
        return value !== null && validate(value) ? value : fallback
    } catch { return fallback }
}
export function saveProgress(key, value) {
    try { localStorage.setItem(`astra:bruno:${key}`, JSON.stringify(value)) } catch {}
}
export const isCount = value => Number.isSafeInteger(value) && value >= 0
