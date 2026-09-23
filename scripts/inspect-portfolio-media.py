"""素材更新后读取封面尺寸；普通开发和部署无需下载媒体。python 需要 Pillow。"""
import concurrent.futures
import hashlib
import json
import subprocess
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def inspect(source):
    with urlopen(source, timeout=40) as response:
        data = response.read()
    with Image.open(BytesIO(data)) as image:
        width, height = image.size
    from urllib.parse import urlparse
    return urlparse(source).path.lstrip("/"), {
        "width": width, "height": height, "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def main():
    # 通过同一注册表列举资源，不能只扫描目录并把未注册作品带回页面。
    script = """
      import './scripts/source-loader.mjs';
      const {works}=await import('./src/content/works/index.ts');
      console.log(JSON.stringify([...new Set(works.flatMap(w=>w.kind==='audio'?[]:
        [w.cover,...(w.kind==='image'?w.images.slice(1).map(i=>i.src):[])]))]));
    """
    output = subprocess.check_output(["node", "--input-type=module", "-e", script], cwd=ROOT)
    sources = json.loads(output)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        metadata = dict(pool.map(inspect, sources))
    path = ROOT / "src/content/works/media.json"
    path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"已校验 {len(metadata)} 张封面；尺寸清单已更新。")


if __name__ == "__main__":
    main()
