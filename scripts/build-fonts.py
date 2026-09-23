"""生成本站 WOFF2 字体：pip install fonttools brotli；python scripts/build-fonts.py。

原字体只缓存到系统临时目录，不进入作品资产。中文按 src 中的文字提取字形，
以后新增文案后重新执行本脚本；英文保留完整字符集，避免音乐作者名缺少重音符号。
"""

from hashlib import sha256
from io import BytesIO
from pathlib import Path
from tempfile import gettempdir
from urllib.parse import quote
from urllib.request import urlopen
from zipfile import ZipFile
import json
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(gettempdir()) / "astra-type-sources"
OUTPUT = Path(gettempdir()) / "astra-font-build"
# 固定校验值，防止上游文件更新后无意间改变已选定的字形。
SOURCES = [
    ("kinghwa", "kinghwa.ttf", "Astra KingHwa",
     "https://raw.githubusercontent.com/KonghaYao/chinese-free-web-font-storage/branch/packages/jhlst/fonts/京華老宋体v2.002.ttf",
     "35d92af5ac4e9485e8e7749098e67211da5885d2697d95aea979fe4acd19ee2a"),
    ("zhuque", "zhuque/ZhuqueFangsong-Regular.ttf", "Astra Zhuque",
     "https://github.com/TrionesType/zhuque/releases/download/v0.212/ZhuqueFangsong-v0.212.zip",
     "558c62730844fe54ba220146ed62f859d4e2880188d92d985f8921c6e3743bc4"),
    ("cinzel", "cinzel.ttf", "Astra Cinzel",
     "https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf",
     "f4d83d34d1f6c741193e4acf4b3dff9531e5a67b6aa65228d00a7db72a4e0f34"),
    ("cormorant", "cormorant.ttf", "Astra Cormorant",
     "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
     "b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0"),
]


def build():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    text = subprocess.check_output(["node", str(ROOT / "scripts/font-text.mjs")], cwd=ROOT).decode("utf-8")
    characters = set(map(ord, text)) | set(range(32, 256))
    manifest = {}
    faces = []
    for slug, filename, family, url, checksum in SOURCES:
        path = CACHE / filename
        if not path.exists():
            data = urlopen(quote(url, safe=":/%"), timeout=120).read()
            if url.endswith(".zip"):
                data = ZipFile(BytesIO(data)).read("ZhuqueFangsong-Regular.ttf")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        if sha256(path.read_bytes()).hexdigest() != checksum:
            raise ValueError(f"字体来源校验失败：{path}")
        font = TTFont(path, recalcTimestamp=False)
        if "fvar" in font:
            font = instantiateVariableFont(font, {"wght": 400}, inplace=True)
        if slug in {"kinghwa", "zhuque"}:
            options = subset.Options()
            options.name_IDs = ["*"]
            options.name_legacy = True
            options.name_languages = ["*"]
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(unicodes=characters)
            subsetter.subset(font)
        # 保留版权和许可元数据，只把衍生网页字体的族名与原字体区分开。
        names = {1: family, 2: "Regular", 3: family + " Regular", 4: family + " Regular",
                 6: family.replace(" ", "") + "-Regular", 16: family, 17: "Regular"}
        for record in font["name"].names:
            if record.nameID in names:
                record.string = names[record.nameID].encode(record.getEncoding())
        font.flavor = "woff2"
        target = OUTPUT / f"astra-{slug}.woff2"
        font.save(target)
        version = sha256(target.read_bytes()).hexdigest()[:12]
        versioned = OUTPUT / f"astra-{slug}.{version}.woff2"
        target.replace(versioned)
        manifest[slug] = f"/fonts/{versioned.name}"
        faces.append(f'''@font-face {{
  font-family: "{family}";
  src: url("{manifest[slug]}") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}}''')
        print(f"{versioned.name}: {versioned.stat().st_size:,} bytes, {len(font.getBestCmap())} glyphs")
    (ROOT / "src/content/fonts.generated.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (ROOT / "src/app/font-faces.generated.css").write_text("/* 由 scripts/build-fonts.py 生成；上传版本化字体后再发布代码。 */\n" + "\n".join(faces) + "\n", encoding="utf-8")
    print(f"字体输出：{OUTPUT}；请上传到 R2 fonts/，使用 immutable 长缓存。")


if __name__ == "__main__":
    build()
