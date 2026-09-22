import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const artwork = join(dirname(fileURLToPath(import.meta.url)), 'artwork')

/** 构建阶段改模：移除整棵展示节点及其碰撞，导出包中不保留被删几何。 */
export async function prepareWorld(cache, output) {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
    })
    const save = async (doc, path) => {
        // 空节点承载出生点、触发区和实例位置，必须保留；只清理无引用资源。
        await doc.transform(prune({ keepLeaves: true, keepAttributes: true }), draco())
        const target = join(output, path)
        await mkdir(dirname(target), { recursive: true })
        await io.write(target, doc)
    }
    const removeTree = node => {
        for (const child of [...node.listChildren()]) removeTree(child)
        node.dispose()
    }
    const renames = {
        career: 'grove', social: 'plaza', projects: 'workshop',
        lab: 'machinery', behindTheScene: 'lightGarden', timeMachine: 'oldTelevision',
    }
    const areasPath = 'areas/areas-compressed.glb'
    const areas = await io.read(join(cache, areasPath))
    const area = name => {
        const node = areas.getRoot().listScenes()[0].listChildren().find(node => node.getName() === name)
        if (!node) throw new Error(`缺少场景区域：${name}`)
        return node
    }
    const retain = (name, allowed) => {
        for (const child of [...area(name).listChildren()]) {
            if (!allowed.test(child.getName())) removeTree(child)
        }
    }
    // 原作展示设施与碰撞同属这些节点；不以 visible=false 隐藏旧内容。
    for (const child of [...area('landing').listChildren()]) {
        if (child.getName().startsWith('refLetters')) removeTree(child)
    }
    retain('career', /^refZone/)
    retain('social', /^refZone/)
    retain('projects', /^(blowerPhysicalDynamic|carpet$|grinderPhysicalDynamic|mainTablePhysicalDynamic|quenchPhysicalDynamic|table\.|refAnvil|refOven|refZone)/)
    retain('lab', /^(cauldronPhysicalDynamic|chainPulleyArrayReference|mainTablePhysicalDynamic|sideTablePhysicalDynamic|ref(?:Carpet|Chain|Fire|Gear|Mecanism|Wood|Zone))/)
    for (const name of ['behindTheScene', 'timeMachine']) {
        for (const child of [...area(name).listChildren()]) {
            if (child.getName().startsWith('refInteractivePoint')) removeTree(child)
        }
    }
    for (const [from, to] of Object.entries(renames)) area(from).setName(to)

    // 标牌保留原来的几何、UV 与碰撞，只替换嵌入图像；旧贴图由 prune 真正移除。
    const decals = [
        ['stylizedMap', 'islandMap', 'kiosk-map.png'],
        ['projectsCarpet', 'workshopRug', 'woven-rug.png'],
        ['labCarpet', 'machineryRug', 'woven-rug.png'],
        ['cookieBanner', 'cookieSign', 'cookie-sign.png'],
        ['circuitBrand', 'trackBanner', 'track-banner.png'],
        ['circuitWebgl', 'trackChevrons', 'track-chevrons.png'],
        ['circuitWebgpu', 'trackArrow', 'track-arrow.png'],
        ['circuitThreejs', 'trackCheckers', 'track-checkers.png'],
    ]
    const textures = new Map()
    for (const [previousName, name, file] of decals) {
        const material = areas.getRoot().listMaterials().find(item => item.getName() === previousName)
        if (!material) throw new Error(`缺少待替换的标牌材质：${previousName}`)
        if (!textures.has(file)) {
            textures.set(file, areas.createTexture(file.replace('.png', ''))
                .setImage(await readFile(join(artwork, file))).setMimeType('image/png'))
        }
        material.setName(name).setBaseColorTexture(textures.get(file))
    }
    await save(areas, areasPath)

    // 出生点名称与地图统一，删除原风扇推广入口的额外传送位置。
    const respawnsPath = 'respawns/respawnsReferences-compressed.glb'
    const respawns = await io.read(join(cache, respawnsPath))
    for (const node of [...respawns.getRoot().listScenes()[0].listChildren()]) {
        if (node.getName() === 'respawnOnlyFans') { removeTree(node); continue }
        for (const [from, to] of Object.entries(renames)) {
            if (node.getName() === `respawn${from[0].toUpperCase()}${from.slice(1)}`)
                node.setName(`respawn${to[0].toUpperCase()}${to.slice(1)}`)
        }
    }
    await save(respawns, respawnsPath)

    // 复用同一份网格和材质，增加实例；长椅等物件也带上原来的碰撞子节点。
    const cloneTree = (doc, source) => {
        const node = doc.createNode(source.getName())
            .setTranslation(source.getTranslation()).setRotation(source.getRotation())
            .setScale(source.getScale()).setExtras({ ...source.getExtras() })
        if (source.getMesh()) node.setMesh(source.getMesh())
        for (const child of source.listChildren()) node.addChild(cloneTree(doc, child))
        return node
    }
    const plant = async (path, placements, height) => {
        const doc = await io.read(join(cache, path))
        const scene = doc.getRoot().listScenes()[0]
        const template = scene.listChildren()[0]
        placements.forEach(([x, z, angle = 0, scale = 1, y = height], index) => {
            const node = cloneTree(doc, template)
            node.setName(`${template.getName().split('.')[0]}Garden${index}`)
            node.setTranslation([x, y, z])
            node.setRotation([0, Math.sin(angle / 2), 0, Math.cos(angle / 2)])
            node.setScale([scale, scale, scale])
            scene.addChild(node)
        })
        await save(doc, path)
    }
    // 中央保持通行，植物分布于通道两侧与广场边缘，避开地图传送落点。
    await plant('cherryTrees/cherryTreesReferences-compressed.glb', [
        [21, 5, .4, .85], [31, 0, 2, .85], [21, -7, 1.2, .8],
        [31, -12, .7, .8], [22, -23, 2.8, 1], [33, -25, 1.5, .9],
        [18, -17, .5, .75], [35, -17, 2, .7],
    ], 0)
    await plant('benches/benches-compressed.glb', [
        [23, -19, -1.1], [30, -20, 1.1], [30, 4, 1.57], [43, 45, -.4],
    ], .756)
    await plant('poleLights/poleLights-compressed.glb', [
        [21, -15], [32, -18], [28, -25], [22, 1], [30, -7], [46, 43],
    ], 1.749)
    await plant('bushes/bushesReferences-compressed.glb', [
        [20, 3, 0, .75], [20, -1, .3, .7], [32, 2, .8, .7],
        [32, -5, 1, .75], [20, -11, 2, .75], [21, -25, 1, .7],
        [29, -26, 0, .8], [35, -22, 1, .75], [34, -13, 2, .75],
    ], .7)
    await plant('bricks/bricks-compressed.glb', [
        [40, 43, .3], [41.4, 43.2, .4], [40.7, 43.1, .35, 1, 1.125],
        [48, 40, -.4], [49.3, 39.5, -.4], [48.6, 39.8, -.4, 1, 1.125],
    ], .375)
    console.log('已导出清理后的场景、碰撞与花园道具。')
}
