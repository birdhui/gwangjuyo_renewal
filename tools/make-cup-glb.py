"""히어로·시리즈·구슬 소리 장면이 함께 쓰는 소리잔 모델(assets/models/sori-60th-doraji.glb)을 만든다.

원본(tools/models/sori-60th-doraji.glb, 3.3MB)의 텍스처 세 장(PNG 2048×1024, 1.3MB)을 WebP로 바꾼다.
  sori_normal     무손실(픽셀 그대로)
  sori_glaze      품질 94(PSNR 47dB, 화면에서 구별되지 않음)
  sori_roughness  품질 94
형태(정점·법선·UV·인덱스)와 재질은 그대로다. 알파는 모두 255라 버린다(불투명 재질).
three.js의 GLTFLoader는 이미지를 mimeType 그대로 브라우저에 넘겨 풀기 때문에 WebP를 그대로 읽는다.

사용: python3 tools/make-cup-glb.py   (Pillow 필요)
"""
import io
import json
import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'tools/models/sori-60th-doraji.glb'
OUT = ROOT / 'assets/models/sori-60th-doraji.glb'
WEBP = {'sori_normal': {'lossless': True}, 'sori_glaze': {'quality': 94}, 'sori_roughness': {'quality': 94}}

data = SRC.read_bytes()
json_len = struct.unpack('<I', data[12:16])[0]
gltf = json.loads(data[20:20 + json_len])
bin_start = 20 + json_len + 8
bin_len = struct.unpack('<I', data[20 + json_len:24 + json_len])[0]
blob = data[bin_start:bin_start + bin_len]


def view_bytes(view):
    start = view.get('byteOffset', 0)
    return blob[start:start + view['byteLength']]


images = {img['bufferView']: img for img in gltf['images']}
chunks = []
for index, view in enumerate(gltf['bufferViews']):
    raw = view_bytes(view)
    if index in images:
        img = images[index]
        buf = io.BytesIO()
        Image.open(io.BytesIO(raw)).convert('RGB').save(buf, 'WEBP', method=6, **WEBP[img['name']])
        raw = buf.getvalue()
        img['mimeType'] = 'image/webp'
    chunks.append(raw)

out = bytearray()
for view, raw in zip(gltf['bufferViews'], chunks):
    out += b'\0' * (-len(out) % 4)
    view['byteOffset'] = len(out)
    view['byteLength'] = len(raw)
    out += raw
out += b'\0' * (-len(out) % 4)
gltf['buffers'][0]['byteLength'] = len(out)

js = json.dumps(gltf, separators=(',', ':')).encode()
js += b' ' * (-len(js) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
OUT.write_bytes(glb)
print(f'{SRC.stat().st_size:,} → {OUT.stat().st_size:,} bytes')
