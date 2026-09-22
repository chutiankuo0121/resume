"""从中文单机源码重建 Ooqo 资源包；Godot 编辑器与构建缓存不进入代码库。"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
from urllib.parse import quote
from urllib.request import urlopen

from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
UPSTREAM = "https://raw.githubusercontent.com/aznoqmous/fish-storm/a8300c94aa891da93f950a568d10c0ed06d6ee5f/"
FONT_URL = "https://raw.githubusercontent.com/lxgw/LxgwWenKai/50f4b182415a8c33d9a456df220b66a284e2509b/fonts/TTF/LXGWWenKai-Regular.ttf"
FONT_HASH = "39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009"


def strip_audio_metadata(data):
    """移除 WAV 描述标签；采样、格式、循环点原样保留，音乐来源记在说明文件。"""
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError("音频不是 RIFF/WAVE，不能安全清理标签")
    end = struct.unpack_from("<I", data, 4)[0] + 8
    if end != len(data):
        raise ValueError("WAV 长度不完整")
    chunks = []
    offset = 12
    while offset < end:
        if offset + 8 > end:
            raise ValueError("WAV chunk 头不完整")
        name, size = struct.unpack_from("<4sI", data, offset)
        next_offset = offset + 8 + size + (size & 1)
        if next_offset > end:
            raise ValueError("WAV chunk 内容不完整")
        is_info = name == b"LIST" and data[offset + 8:offset + 12] == b"INFO"
        if not is_info and name.lower() not in (b"bext", b"ixml", b"axml", b"_pmx", b"id3 ", b"disp"):
            chunks.append(data[offset:next_offset])
        offset = next_offset
    body = b"WAVE" + b"".join(chunks)
    return b"RIFF" + struct.pack("<I", len(body)) + body


def cached_file(url, target, expected, git_blob=False):
    def valid(data):
        # 上游资产使用 Git blob SHA-1，字体使用 SHA-256，防止下载到错误页面。
        if git_blob:
            return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest() == expected
        return hashlib.sha256(data).hexdigest() == expected

    if target.exists() and valid(target.read_bytes()):
        return target
    with urlopen(url, timeout=120) as response:
        data = response.read()
    if not valid(data):
        raise RuntimeError(f"资源校验失败：{url}")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return target


def build(godot):
    version = subprocess.check_output([godot, "--headless", "--version"], text=True).strip()
    if not version.startswith("4.5.1.stable"):
        raise RuntimeError("请使用 Godot 4.5.1 stable，与本站 Web 引擎保持一致。")

    cache = Path(tempfile.gettempdir()) / "ooqo-build-cache"
    manifest = json.loads((HERE / "upstream-assets.json").read_text("utf8"))
    source = HERE / "project"
    # 仅检查运行脚本与场景；SVG 的 XML 命名空间是格式声明，不是网络请求。
    text = "\n".join(p.read_text("utf8") for p in source.rglob("*")
                     if p.suffix in (".gd", ".tscn", ".tres", ".godot", ".cfg", ".gdshader"))
    if re.search(r"HTTPRequest|HTTPClient|WebSocket|leader.?board|username|https?://", text, re.I):
        raise RuntimeError("单机源码中出现联网模块，请先检查。")

    # 大体积原作音乐和贴图只缓存在系统临时目录；仓库保留可读源码和成品包。
    with tempfile.TemporaryDirectory(prefix="ooqo-build-") as directory:
        work = Path(directory)

        def asset(item):
            name, digest = item
            downloaded = cached_file(UPSTREAM + quote(name), cache / "assets" / name, digest, True)
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.suffix.lower() == ".wav":
                dest.write_bytes(strip_audio_metadata(downloaded.read_bytes()))
            else:
                shutil.copy2(downloaded, dest)

        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(asset, manifest.items()))

        # 汉字由霞鹜文楷补齐，只打包当前文案需要的字形；原作英文字母和数字不变。
        font_path = cached_file(FONT_URL, cache / "LXGWWenKai-Regular.ttf", FONT_HASH)
        font = TTFont(font_path)
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_legacy = True
        subsetter = subset.Subsetter(options=options)
        glyphs = "".join(sorted({c for c in text if ord(c) > 127}))
        missing = {ord(c) for c in glyphs} - set(font.getBestCmap())
        if missing:
            raise RuntimeError(f"中文字体缺少字形：{missing}")
        subsetter.populate(text=glyphs)
        subsetter.subset(font)
        for record in font["name"].names:
            if record.nameID in (1, 2, 3, 4, 6, 16, 17):
                name = "Regular" if record.nameID in (2, 17) else "Ooqo Han"
                record.string = name.encode(record.getEncoding())
        (work / "fonts").mkdir()
        font.save(work / "fonts/ooqo-han.ttf")
        font.close()

        def run(*args):
            result = subprocess.run(
                [godot, "--headless", "--path", str(work), *args],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                encoding="utf8", errors="replace",
            )
            if result.returncode or re.search(r"^(?:SCRIPT )?ERROR:", result.stdout, re.M):
                raise RuntimeError(result.stdout)

        # 先导入字体和音画资产，再加载带自动场景的项目，避免首次导入引用未就绪。
        (work / "project.godot").write_text("config_version=5\n", "utf8")
        run("--editor", "--import")
        shutil.copytree(source, work, dirs_exist_ok=True)
        run("--editor", "--import")
        packed = work / "ooqo.pck"
        run("--export-pack", "Web", str(packed))

        # 整包覆盖，确保已删除的网络脚本不残留；启动页的加载字节数同步更新。
        destination = REPO / "public/games/ooqo"
        shutil.copy2(packed, destination / "runtime/index.pck")
        shutil.copy2(source / "icon.svg", destination / "icon.svg")
        boot = destination / "boot.js"
        boot.write_text(re.sub(
            r'("runtime/index.pck": )\d+',
            lambda match: match[1] + str(packed.stat().st_size),
            boot.read_text("utf8"),
        ), "utf8", newline="\n")
        print(f"Ooqo 中文单机包：{packed.stat().st_size:,} bytes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--godot", required=True, help="Godot 4.5.1 控制台可执行文件路径")
    build(parser.parse_args().godot)
