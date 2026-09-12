#!/usr/bin/env python3
"""
Normalises extracted video frames and compiles them into an optimized sprite sheet
with coordinate metadata for ultra-smooth 60fps canvas scroll animation.
"""

import os
import glob
import math
import json
from PIL import Image

def generate_sprite_sheet(
    frames_dir="web/public/landing/frames",
    output_dir="web/public/landing",
    base_name="aircraft_spritesheet",
    cols=5,
    quality=90
):
    frames = sorted(
        glob.glob(os.path.join(frames_dir, "*.png")),
        key=lambda x: int(os.path.splitext(os.path.basename(x))[0])
    )
    total_frames = len(frames)
    if total_frames == 0:
        print(f"No frames found in {frames_dir}")
        return

    # Crop bottom clouds: keep top 365px (remove 115px of excess bottom clouds)
    CROP_HEIGHT = 365
    with Image.open(frames[0]) as first_img:
        frame_w = first_img.width
    frame_h = CROP_HEIGHT

    rows = math.ceil(total_frames / cols)
    sheet_w = cols * frame_w
    sheet_h = rows * frame_h

    print(f"Compiling {total_frames} cropped frames ({frame_w}x{frame_h}) into {cols}x{rows} sheet ({sheet_w}x{sheet_h})...")
    sheet = Image.new("RGB", (sheet_w, sheet_h), (255, 255, 255))
    frame_metadata = []

    for idx, fpath in enumerate(frames):
        with Image.open(fpath) as img:
            # Crop to eliminate bottom clouds
            cropped = img.crop((0, 0, frame_w, frame_h))
            img_rgb = cropped.convert("RGB")
            c = idx % cols
            r = idx // cols
            x = c * frame_w
            y = r * frame_h
            sheet.paste(img_rgb, (x, y))
            frame_metadata.append({
                "frame": idx,
                "x": x,
                "y": y,
                "w": frame_w,
                "h": frame_h
            })

    os.makedirs(output_dir, exist_ok=True)

    # WebP output
    webp_path = os.path.join(output_dir, f"{base_name}.webp")
    sheet.save(webp_path, "WEBP", quality=quality, method=6)
    print(f"Created {webp_path} ({os.path.getsize(webp_path) / 1024:.1f} KB)")

    # PNG output
    png_path = os.path.join(output_dir, f"{base_name}.png")
    sheet.save(png_path, "PNG", optimize=True)
    print(f"Created {png_path} ({os.path.getsize(png_path) / 1024:.1f} KB)")

    # JSON metadata
    meta_path = os.path.join(output_dir, f"{base_name}.json")
    with open(meta_path, "w") as f:
        json.dump({
            "totalFrames": total_frames,
            "cols": cols,
            "rows": rows,
            "frameWidth": frame_w,
            "frameHeight": frame_h,
            "sheetWidth": sheet_w,
            "sheetHeight": sheet_h,
            "frames": frame_metadata
        }, f, indent=2)
    print(f"Created {meta_path}")

if __name__ == "__main__":
    generate_sprite_sheet()
