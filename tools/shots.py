"""Renders README screenshots, the Lively thumbnail and a day-long timelapse GIF.

Serve the folder first (python -m http.server 8766), then:
    python tools/shots.py [http://localhost:8766]
Uses Microsoft Edge in headless mode and Pillow.
"""

import os
import subprocess
import sys
import tempfile
import time

from PIL import Image

EDGE = next(
    p
    for p in [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    if os.path.exists(p)
)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766"
DOCS = os.path.join(ROOT, "docs")


def shot(query, path, size=(1280, 720), budget=3000):
    # A fresh profile each time, so Edge never serves a stale cached script.
    # It also now and then captures before the page has drawn; a blank capture is tiny, so retry.
    for attempt in range(8):
        if attempt:
            time.sleep(1)
        if os.path.exists(path):
            os.remove(path)
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
            subprocess.run(
                [
                    EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
                    f"--window-size={size[0]},{size[1]}", f"--virtual-time-budget={budget}",
                    f"--screenshot={path}", f"{BASE}/?{query}",
                ],
                capture_output=True,
            )
            # On Windows the launcher can return before the capture is written: wait for it to settle.
            last = -1
            for _ in range(60):
                size_now = os.path.getsize(path) if os.path.exists(path) else -1
                if size_now > 0 and size_now == last:
                    break
                last = size_now
                time.sleep(0.25)
        if os.path.exists(path) and os.path.getsize(path) > 10_000:
            return
    raise RuntimeError(f"blank screenshot for {query}")


def main():
    os.makedirs(DOCS, exist_ok=True)
    scenes = {
        "day": "time=2026-10-22T13:30&weather=clouds&wind=18",
        "sunset": "time=2026-10-22T18:30&weather=clear&wind=12",
        "night": "time=2026-10-22T22:30&weather=clear&wind=8",
        "rain": "time=2026-10-22T16:45&weather=rain&wind=30",
        "storm": "time=2026-10-22T21:15&weather=storm&wind=55",
        "winter": "time=2027-01-15T11:00&weather=snow&wind=10&frozen&season=winter",
        "fog": "time=2026-10-22T08:40&weather=fog&wind=3",
        "december": "time=2026-12-12T17:30&weather=clear&wind=5&season=winter&event=december",
    }
    for name, q in scenes.items():
        shot(q, os.path.join(DOCS, f"{name}.png"))
        print("docs/" + name + ".png")

    # Around the world: each city looked up by name, its skyline fetched live.
    cities = [
        ("paris", "city=Paris&time=2026-10-22T21:02&weather=clear&wind=10"),
        ("london", "city=London&time=2026-10-22T16:00&weather=drizzle&wind=20"),
        ("newyork", "city=New%20York&time=2026-10-22T18:10&weather=clear&wind=10"),
        ("tokyo", "city=Tokyo&time=2026-04-05T12:00&weather=clouds&wind=10"),
        ("sanfrancisco", "city=San%20Francisco&time=2026-10-22T12:00&weather=fog&wind=10"),
        ("rio", "city=Rio%20de%20Janeiro&time=2026-10-22T11:00&weather=clear&wind=10"),
        ("dubai", "city=Dubai&time=2026-10-22T19:00&weather=clear&wind=10"),
        ("stockholm", "city=Stockholm&time=2027-01-12T14:00&weather=snow&wind=8"),
        ("chicago", "city=Chicago&time=2026-10-22T13:00&weather=clouds&wind=20"),
    ]
    os.makedirs(os.path.join(DOCS, "cities"), exist_ok=True)
    tiles = []
    for name, q in cities:
        path = os.path.join(DOCS, "cities", f"{name}.png")
        shot(q, path, budget=12000)
        tiles.append(Image.open(path).convert("RGB").resize((640, 360), Image.NEAREST))
        print(f"docs/cities/{name}.png")
    grid = Image.new("RGB", (640 * 3, 360 * 3))
    for i, tile in enumerate(tiles):
        grid.paste(tile, ((i % 3) * 640, (i // 3) * 360))
    grid.save(os.path.join(DOCS, "cities.png"), optimize=True)
    print("docs/cities.png")

    Image.open(os.path.join(DOCS, "sunset.png")).convert("RGB").resize((640, 360), Image.NEAREST).save(
        os.path.join(ROOT, "thumbnail.jpg"), quality=92
    )
    print("thumbnail.jpg")

    # A day in Leiden: every 30 minutes from 06:30 to 23:30.
    frames = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, minutes in enumerate(range(6 * 60 + 30, 23 * 60 + 31, 30)):
            weather = "clouds" if 10 * 60 <= minutes < 15 * 60 else "clear"
            q = f"time=2026-10-22T{minutes // 60:02d}:{minutes % 60:02d}&weather={weather}&wind=15"
            path = os.path.join(tmp, f"{i:03d}.png")
            try:
                shot(q, path)
            except RuntimeError as err:
                print(f"  skipped a timelapse frame: {err}")  # one missing frame doesn't hurt a timelapse
                continue
            frames.append(Image.open(path).convert("RGB").resize((640, 360), Image.NEAREST))
    frames[0].save(
        os.path.join(ROOT, "preview.gif"), save_all=True, append_images=frames[1:], duration=180, loop=0, optimize=True
    )
    print(f"preview.gif ({len(frames)} frames)")


if __name__ == "__main__":
    main()
