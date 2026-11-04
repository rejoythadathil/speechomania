import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def slice_sheet(path, names, out_dir, gap=40, tol=28, size=512, min_area=1500, preview=None):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    white = (a.min(axis=2) > 255 - tol)
    bg_seed = np.zeros_like(white)
    bg_seed[0, :] = bg_seed[-1, :] = bg_seed[:, 0] = bg_seed[:, -1] = True
    labels, _ = ndimage.label(white)
    edge = np.unique(labels[bg_seed & white])
    bg = np.isin(labels, edge[edge > 0])
    fg = ~bg
    fg = ndimage.binary_opening(fg, iterations=2)
    grouped, n = ndimage.label(ndimage.binary_dilation(fg, iterations=gap))
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(grouped), 1):
        part = fg[sl] & (grouped[sl] == i)
        if part.sum() < min_area:
            continue
        ys, xs = np.nonzero(part)
        y0, y1, x0, x1 = sl[0].start + ys.min(), sl[0].start + ys.max(), sl[1].start + xs.min(), sl[1].start + xs.max()
        boxes.append((y0, y1, x0, x1, i))
    boxes.sort(key=lambda b: (b[0] + b[1]) / 2)
    rows, current = [], []
    for b in boxes:
        if current and (b[0] + b[1]) / 2 - np.mean([(c[0] + c[1]) / 2 for c in current]) > (b[1] - b[0]) * 0.6:
            rows.append(current)
            current = []
        current.append(b)
    if current:
        rows.append(current)
    ordered = [b for row in rows for b in sorted(row, key=lambda b: b[2])]
    report = {'sheet': path.split('/')[-1], 'found': len(ordered), 'expected': len(names)}
    if len(ordered) != len(names):
        report['boxes'] = [(int(b[0]), int(b[2])) for b in ordered]
        print(json.dumps(report))
        return False
    rgba = np.dstack([a.astype(np.uint8), np.where(fg, 255, 0).astype(np.uint8)])
    soft = ndimage.gaussian_filter(rgba[..., 3].astype(float), 0.8)
    rgba[..., 3] = np.clip(soft, 0, 255).astype(np.uint8)
    for name, (y0, y1, x0, x1, i) in zip(names, ordered):
        if name is None:
            continue
        mask = (grouped[y0:y1 + 1, x0:x1 + 1] == i)
        crop = rgba[y0:y1 + 1, x0:x1 + 1].copy()
        crop[..., 3] = np.where(mask, crop[..., 3], 0)
        sprite = Image.fromarray(crop, 'RGBA')
        side = max(sprite.size)
        square = Image.new('RGBA', (int(side * 1.08), int(side * 1.08)), (0, 0, 0, 0))
        square.paste(sprite, ((square.width - sprite.width) // 2, (square.height - sprite.height) // 2))
        square.resize((size, size), Image.LANCZOS).save(f'{out_dir}/{name}.webp', 'WEBP', quality=86, method=6)
    print(json.dumps(report))
    return True

if __name__ == '__main__':
    plan = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    ok = all([slice_sheet(p['path'], p['names'], out, gap=p.get('gap', 40)) for p in plan])
    sys.exit(0 if ok else 1)
