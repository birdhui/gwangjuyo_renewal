"""'쓰임으로 이어지는 아름다움' 글자 윤곽 데이터(js/beauty-glyphs.js)를 만든다.

oryzo 'sustainability' 제목처럼 빛이 글자 윤곽선을 따라 흐르게 하려면 글자의 바깥 윤곽(겹친 획을 합친 선)이 필요하다.
Pretendard 가변 글꼴은 획이 겹친 채 저장되어 있어, 굵기 800 인스턴스를 고해상도로 칠한 뒤(nonzero) 윤곽을 다시 따서 합친다.

실행: python3 tools/make-beauty-glyphs.py  (fontTools, opencv-python, numpy, Pillow, woff2용 brotli 필요)
"""
import json
from pathlib import Path

import cv2
import numpy as np
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
TEXT = '쓰임으로 이어지는 아름다움'
WEIGHT = 800          # .beauty-title font-weight
PAD = 64              # 래스터 여백(글꼴 단위)
EPS = 2.5             # 윤곽 단순화 허용 오차(글꼴 단위, 1em = 2048)


class FlattenPen(BasePen):
    """곡선을 잘게 나눈 다각형 윤곽 목록으로 만든다."""
    def __init__(self, glyph_set, steps=16):
        super().__init__(glyph_set)
        self.contours, self.cur, self.steps = [], None, steps

    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, self.steps + 1)[1:]:
            a = 1 - t
            self.cur.append(tuple(a * a * np.array(p0) + 2 * a * t * np.array(p1) + t * t * np.array(p2)))

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, self.steps + 1)[1:]:
            a = 1 - t
            self.cur.append(tuple(a ** 3 * np.array(p0) + 3 * a * a * t * np.array(p1) + 3 * a * t * t * np.array(p2) + t ** 3 * np.array(p3)))

    def _closePath(self):
        self.contours.append(self.cur)
        self.cur = None

    _endPath = _closePath


def signed_area(c):
    x, y = np.array(c).T
    return (np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y)) / 2


def union_outline(contours, width):
    """겹친 획을 합친 바깥·안쪽 윤곽(글꼴 단위, y는 아래로)을 돌려준다."""
    top = max(y for c in contours for _, y in c) + PAD
    bottom = min(y for c in contours for _, y in c) - PAD
    w, h = int(width + PAD * 2), int(top - bottom)
    winding = np.zeros((h, w), np.int16)
    for c in contours:
        im = Image.new('L', (w, h), 0)
        ImageDraw.Draw(im).polygon([(x + PAD, top - y) for x, y in c], fill=1)
        winding += np.array(im, np.int16) * (1 if signed_area(c) < 0 else -1)  # TrueType: 바깥 윤곽은 시계 방향
    filled = (winding != 0).astype(np.uint8) * 255
    found, _ = cv2.findContours(filled, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in found:
        c = cv2.approxPolyDP(c, EPS, True)[:, 0, :].astype(float)
        if len(c) < 3:
            continue
        pts = [(x - PAD, y - top) for x, y in c]  # 원점 = 글자 시작점·기준선, y는 아래로(SVG)
        perimeter = cv2.arcLength(c.astype(np.float32), True)
        out.append({'d': 'M' + 'L'.join(f'{x:.0f} {y:.0f}' for x, y in pts) + 'Z', 'p': round(perimeter)})
    return out


def main():
    font = TTFont(ROOT / 'fonts/PretendardVariable.woff2')
    font = instancer.instantiateVariableFont(font, {'wght': WEIGHT})
    glyph_set, cmap = font.getGlyphSet(), font.getBestCmap()
    glyphs = {}
    for ch in dict.fromkeys(TEXT.replace(' ', '')):
        name = cmap[ord(ch)]
        pen = FlattenPen(glyph_set)
        glyph_set[name].draw(pen)
        glyphs[ch] = union_outline(pen.contours, glyph_set[name].width)
    data = {'upm': font['head'].unitsPerEm, 'glyphs': glyphs}
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'js/beauty-glyphs.js').write_text(
        '// tools/make-beauty-glyphs.py가 만든 파일: \'쓰임으로 이어지는 아름다움\'의 글자 윤곽(Pretendard 800, 겹친 획 합침)\n'
        f'export default {body};\n', encoding='utf-8')


if __name__ == '__main__':
    main()
