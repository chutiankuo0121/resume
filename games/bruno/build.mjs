import { build } from 'vite'
import { readFile, writeFile, mkdir, copyFile, cp } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { prepareWorld } from './prepare-world.mjs'

const root = dirname(fileURLToPath(import.meta.url))
process.chdir(root)
const manifest = JSON.parse(await readFile('assets.json', 'utf8'))
const output = resolve(root, '../../public/games/bruno')
const cache = process.env.BRUNO_ASSET_CACHE || join(tmpdir(), 'astra-bruno-assets', manifest.commit)

// 只在构建时下载固定提交的资源，并逐个校验 Git blob 摘要；运行时全部同源。
function valid(buffer, asset) {
    return buffer.length === asset.size && createHash('sha1')
        .update(`blob ${buffer.length}\0`).update(buffer).digest('hex') === asset.sha
}
await build()
const runtimePaths = new Set(manifest.files.map(asset => asset.path))
const pending = [...manifest.files, ...manifest.modelSources]
await Promise.all(Array.from({ length: 8 }, async () => {
    for(let asset; (asset = pending.pop());) {
        const cached = join(cache, asset.path)
        let data
        try { data = await readFile(cached) } catch {}
        if(!data || !valid(data, asset)) {
            const url = `https://raw.githubusercontent.com/brunosimon/folio-2025/${manifest.commit}/static/${asset.path.split('/').map(encodeURIComponent).join('/')}`
            const response = await fetch(url)
            if(!response.ok) throw new Error(`资源下载失败 ${response.status}: ${asset.path}`)
            data = Buffer.from(await response.arrayBuffer())
            if(!valid(data, asset)) throw new Error(`资源校验失败: ${asset.path}`)
            await mkdir(dirname(cached), { recursive: true })
            await writeFile(cached, data)
        }
        // 建模源文件只进入缓存；发布目录仅接收清理后的模型。
        if(runtimePaths.has(asset.path)) {
            const target = join(output, asset.path)
            await mkdir(dirname(target), { recursive: true })
            await copyFile(cached, target)
        }
    }
}))
await prepareWorld(cache, output)
await cp(join(root, 'static'), output, { recursive: true })
await copyFile(join(root, 'LICENSE'), join(output, 'LICENSE.txt'))
console.log(`已构建中文单机版：${manifest.files.length} 个本地场景资源。`)
