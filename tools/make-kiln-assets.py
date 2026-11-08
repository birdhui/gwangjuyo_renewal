"""가마 장면(js/fire.js)에 쓰는 그림을 만든다 — img/kiln/.

  plate.webp  이천 수광리 오름가마 사진(tools/kiln/source.png)에서 선반 위 그릇 세 개를 지우고
              (옆의 불길·선반을 옮겨 와 부드럽게 덮음) 가운데 소리잔 하나만 놓일 자리를 남긴 바탕.
  mask.png    1/4 크기 보조 지도 — R: 가마 안(아치 입구 안쪽), G: 불길(일렁임·불꽃을 그릴 곳),
              B: 불빛이 닿는 정도(입구에서 멀어질수록 0).
  cup.webp, cup-bisque.webp
              선반 위 소리잔(무늬 없이 유약을 입힌 잔 / 초벌 잔). tools/kiln/cup-sprite.html로
              실제 3D 잔(assets/models/sori-60th-doraji.glb)을 투명 배경으로 그린 것을 잘라 줄인다.

사용: python3 tools/make-kiln-assets.py   (opencv-python, numpy, Pillow)
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'tools/kiln'
OUT = ROOT / 'img/kiln'
OUT.mkdir(exist_ok=True)

# ---------- 바탕: 그릇 지우기 ----------
im = cv2.imread(str(SRC / 'source.png')).astype(np.float32)
H, W = im.shape[:2]
out = im.copy()


def cover(draw, dx, blur=9, clip_y=None):
    """draw로 그린 자리를 dx만큼 옆의 내용으로 덮는다(가장자리는 흐리게 섞음)."""
    global out
    m = np.zeros((H, W), np.float32)
    draw(m)
    m = np.clip(cv2.GaussianBlur(m, (0, 0), blur) * 1.6, 0, 1)
    if clip_y:
        m *= np.clip((clip_y - np.arange(H)[:, None]) / 4.0, 0, 1)
    src = cv2.warpAffine(im, np.float32([[1, 0, dx], [0, 1, 0]]), (W, H), borderMode=cv2.BORDER_REFLECT)
    out = out * (1 - m[..., None]) + src * m[..., None]


cover(lambda m: (cv2.ellipse(m, (671, 522), (54, 40), 0, 0, 360, 1, -1), cv2.rectangle(m, (618, 522), (724, 556), 1, -1)), -118, clip_y=553)
cover(lambda m: cv2.rectangle(m, (622, 549), (720, 560), 1, -1), -230, blur=3)   # 그릇이 있던 윗 선반 면
cover(lambda m: (cv2.ellipse(m, (662, 633), (56, 40), 0, 0, 360, 1, -1), cv2.rectangle(m, (606, 633), (718, 666), 1, -1)), -130)
cover(lambda m: (cv2.ellipse(m, (972, 638), (36, 34), 0, 0, 360, 1, -1), cv2.rectangle(m, (938, 638), (1004, 664), 1, -1)), 95)
plate = Image.fromarray(cv2.cvtColor(out.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))
plate.save(OUT / 'plate.webp', quality=86, method=6)

# ---------- 보조 지도 ----------
MOUTH = (790, 600)
inside = np.zeros((H, W), np.float32)
cv2.ellipse(inside, (790, 560), (214, 168), 0, 180, 360, 1, -1)   # 아치
cv2.rectangle(inside, (576, 560), (1004, 742), 1, -1)
inside = cv2.GaussianBlur(inside, (0, 0), 5)
rgb = out[..., ::-1] / 255.0
lum = rgb @ np.array([.2126, .7152, .0722])
warm = np.clip((rgb[..., 0] - rgb[..., 2]) * 2.2, 0, 1)
fire = inside * np.clip((lum - .30) / .30, 0, 1) * warm
fire = cv2.GaussianBlur(fire.astype(np.float32), (0, 0), 3)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
light = np.exp(-(((xx - MOUTH[0]) / 430) ** 2 + ((yy - MOUTH[1]) / 300) ** 2))
light = np.maximum(light, np.exp(-(((xx - 790) / 380) ** 2 + ((yy - 800) / 120) ** 2)))   # 입구 앞 바닥
light = np.maximum(light, inside)
mask = np.dstack([inside, fire, light])
small = cv2.resize(mask, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
Image.fromarray((small.clip(0, 1) * 255).astype(np.uint8)).save(OUT / 'mask.png', optimize=True)

# ---------- 소리잔 ----------
for name, dst in [('cup-plain.png', 'cup.webp'), ('cup-bisque.png', 'cup-bisque.webp')]:
    cup = Image.open(SRC / name).convert('RGBA')
    cup = cup.crop(cup.split()[3].getbbox())
    cup = cup.resize((round(cup.width * 300 / cup.height), 300), Image.LANCZOS)
    cup.save(OUT / dst, quality=90, alpha_quality=100, method=6)
    print(dst, cup.size)

for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size)
