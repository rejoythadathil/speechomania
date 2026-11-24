import sys, os
from PIL import Image
src, out, size = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 320
names = sys.stdin.read().split()
os.makedirs(out, exist_ok=True)
for name in names:
    im = Image.open(f'{src}/{name}.webp').convert('RGBA')
    im.thumbnail((size, size), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(f'{out}/{name}.png', optimize=True)
print(len(names), 'pictures written to', out)
