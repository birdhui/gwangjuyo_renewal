"""Pretendard 가변 글꼴을 사이트에 쓰는 글자만 남겨 줄인다(fonts/PretendardSubset.woff2).

원본(fonts/PretendardVariable.woff2, 약 2MB)은 한글 11,172자를 모두 담아 첫 접속이 느렸다.
남기는 글자: KS X 1001 한글 2,350자 + 한글 자모 + 기본 라틴·숫자·문장부호
          + 사이트(index.html, js, css, hero-scene.js)에 실제로 쓰인 모든 글자.
굵기 축(100~900)과 글자 모양·간격·커닝은 그대로라 화면에 그려지는 모양은 원본과 같다.

사용: python3 tools/make-font-subset.py   (fontTools와 brotli 필요)
"""
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent


def site_chars():
    text = ''
    files = [ROOT / 'index.html', *ROOT.glob('js/*.js'), *ROOT.glob('css/*.css')]
    for f in files:
        s = f.read_text(encoding='utf-8', errors='ignore')
        # hero-scene.js는 묶음 빌드라 한글만 뽑는다
        text += ''.join(re.findall(r'[가-힣ㄱ-ㆎ]', s)) if f.name == 'hero-scene.js' else s
    return {c for c in text if ord(c) >= 0x80}


def ksx1001_hangul():
    out = set()
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                out.add(bytes([hi, lo]).decode('euc-kr'))
            except UnicodeDecodeError:
                pass
    return out


chars = ({chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0x3131, 0x318F)}
         | set('·…‘’“”–—•→←↑↓×÷°₩※「」『』《》〈〉ㆍ') | ksx1001_hangul() | site_chars())
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
font = subset.load_font(str(ROOT / 'fonts/PretendardVariable.woff2'), opts)
sub = subset.Subsetter(opts)
sub.populate(text=''.join(sorted(chars)))
sub.subset(font)
subset.save_font(font, str(ROOT / 'fonts/PretendardSubset.woff2'), opts)
print(len(chars), 'chars →', (ROOT / 'fonts/PretendardSubset.woff2').stat().st_size, 'bytes')
