import wasm from 'vite-plugin-wasm'

// 与主站依赖隔离，所有路径相对当前游戏目录。
export default {
    root: 'sources', publicDir: false, base: './',
    build: { target: 'es2022', outDir: '../../../public/games/bruno', emptyOutDir: true, sourcemap: false },
    plugins: [wasm()],
}
