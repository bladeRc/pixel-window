// The sky (gradient, stars, sun, moon, clouds), the water, the weather
// (rain, snow, fog, lightning, falling leaves) and the lights of the town.
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js'), scene: require('./scene.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).effects = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px
  const { H, STREET, WATER, HORIZON } = PW.scene

  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ]

  function create(W) {
    return { W, clouds: [], cloudKey: -1, drops: [], flakes: [], splashes: [], leaves: [], bolt: null, flash: 0, nextFlash: 3 }
  }

  /** The sky gradient, banded and dithered like pixel art, as image data. */
  function paintSky(ctx, W, colors) {
    const img = ctx.createImageData(W, WATER)
    const BANDS = 14
    for (let y = 0; y < WATER; y++) {
      const t = Math.min(1, y / HORIZON) ** 1.25 * BANDS
      const lo = Math.floor(t)
      const frac = t - lo
      const a = px.mix(colors.top, colors.bottom, lo / BANDS)
      const b = px.mix(colors.top, colors.bottom, Math.min(BANDS, lo + 1) / BANDS)
      for (let x = 0; x < W; x++) {
        const c = BAYER[y % 4][x % 4] / 16 < frac ? b : a
        const i = (y * W + x) * 4
        img.data[i] = c[0]
        img.data[i + 1] = c[1]
        img.data[i + 2] = c[2]
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  function drawStars(ctx, W, t, alpha) {
    if (alpha <= 0.02) return
    for (let i = 0; i < 110; i++) {
      const x = Math.floor(px.hash(i, 1, 0) * W)
      const y = Math.floor(px.hash(i, 2, 0) * 92)
      const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + px.hash(i, 3, 0) * 2.5) + i)
      const a = alpha * tw * (0.4 + px.hash(i, 4, 0) * 0.6)
      px.rect(ctx, x, y, 1, 1, px.css(px.hash(i, 5, 0) < 0.2 ? '#cfe0ff' : '#ffffff', a.toFixed(2)))
      if (px.hash(i, 6, 0) < 0.06) {
        px.rect(ctx, x - 1, y, 3, 1, px.css('#ffffff', (a * 0.5).toFixed(2)))
        px.rect(ctx, x, y - 1, 1, 3, px.css('#ffffff', (a * 0.5).toFixed(2)))
      }
    }
  }

  function drawSun(ctx, W, sun, clouds) {
    if (sun.elevation < -3 || clouds > 0.9) return
    const x = ((sun.azimuth - 90) / 180) * W
    const y = HORIZON - 2 - sun.elevation * 2.3
    if (x < -10 || x > W + 10 || y < -10) return
    const low = px.clamp(1 - sun.elevation / 10, 0, 1)
    const color = px.mix('#fff6d2', '#ff9d4d', low)
    const a = 1 - clouds * 0.9
    px.disc(ctx, x, y, 10, px.css(color, (0.12 * a).toFixed(2)))
    px.disc(ctx, x, y, 7, px.css(color, (0.22 * a).toFixed(2)))
    px.disc(ctx, x, y, 5, px.css(color, a.toFixed(2)))
  }

  function drawMoon(ctx, moon, phase, skyTop, clouds) {
    if (!moon || clouds > 0.92) return
    const a = 1 - clouds * 0.85
    const r = 5
    px.disc(ctx, moon.x, moon.y, r + 3, px.css('#f3edd4', (0.08 * a).toFixed(2)))
    px.disc(ctx, moon.x, moon.y, r, px.css('#f3edd4', a.toFixed(2)))
    px.rect(ctx, moon.x - 2, moon.y - 1, 2, 2, px.css('#cfc8ac', a.toFixed(2)))
    px.rect(ctx, moon.x + 1, moon.y + 2, 1, 1, px.css('#cfc8ac', a.toFixed(2)))
    // The dark part: a sky-coloured disc slid across by the phase.
    const lit = 1 - Math.abs(phase - 0.5) * 2
    const shift = Math.round(lit * (2 * r + 1))
    if (shift < 2 * r + 1) px.disc(ctx, moon.x + (phase < 0.5 ? -shift : shift), moon.y, r, skyTop)
  }

  // ------------------------------------------------------------------ clouds

  function makeClouds(fx, amount) {
    const W = fx.W
    const r = px.rng(Math.round(amount * 100) + 3)
    const count = Math.round(amount * 9 * (W / 320)) + (amount > 0.85 ? 6 : 0)
    const old = fx.clouds
    fx.clouds = []
    for (let i = 0; i < count; i++) {
      const w = 26 + r() * 46
      const puffs = []
      const n = 4 + Math.floor(r() * 4)
      for (let k = 0; k < n; k++) {
        const along = k / (n - 1)
        const bulge = Math.sin(along * Math.PI)
        puffs.push({ dx: along * w, dy: -2 - bulge * (3 + r() * 5), r: Math.round(4 + bulge * (3 + r() * 4)) })
      }
      fx.clouds.push({ x: old[i] ? old[i].x : r() * (W + 80) - 40, y: (amount > 0.85 ? 4 : 12) + r() * 50, w, puffs, speed: 0.5 + r() * 0.7 })
    }
  }

  function updateClouds(fx, dt, w) {
    const key = Math.round(w.clouds * 20)
    if (key !== fx.cloudKey) {
      fx.cloudKey = key
      makeClouds(fx, w.clouds)
    }
    const v = (w.wind / 9 + 0.6) * dt
    for (const c of fx.clouds) {
      c.x += v * c.speed
      if (c.x > fx.W + 20) c.x = -c.w - 20
    }
  }

  function drawClouds(ctx, fx, colors, amount) {
    if (amount > 0.85) {
      const depth = 24 + amount * 18
      px.rect(ctx, 0, 0, fx.W, depth, colors.shade)
      for (let x = 0; x < fx.W; x += 6) px.disc(ctx, x, depth + Math.round(px.hash(x, 9, 0) * 4) - 2, 5, colors.shade)
    }
    // Cumulus: overlapping puffs on a flat base, lit from above.
    for (const c of fx.clouds) {
      for (const p of c.puffs) px.disc(ctx, c.x + p.dx, c.y + p.dy, p.r, colors.shade)
      px.rect(ctx, c.x - 2, c.y, c.w + 4, 4, colors.shade)
    }
    for (const c of fx.clouds) {
      for (const p of c.puffs) px.disc(ctx, c.x + p.dx - 1, c.y + p.dy - 2, Math.max(1, p.r - 2), colors.light)
      px.rect(ctx, c.x, c.y - 2, c.w, 2, colors.light)
    }
  }

  // ------------------------------------------------------------------ weather

  function updateWeather(fx, dt, w, env) {
    const W = fx.W
    // Rain.
    const wantDrops = w.precip === 'rain' ? Math.round(w.intensity * 240 * (W / 320)) : 0
    while (fx.drops.length < wantDrops) fx.drops.push({ x: Math.random() * (W + 60) - 30, y: Math.random() * H, vy: 130 + Math.random() * 50, len: 2 + Math.floor(Math.random() * 3), floor: WATER + Math.random() * (H - WATER) })
    fx.drops.length = Math.min(fx.drops.length, wantDrops)
    for (const d of fx.drops) {
      d.y += d.vy * dt
      d.x += (w.wind * 0.9 + 4) * dt
      if (d.y > d.floor) {
        if (Math.random() < 0.5) fx.splashes.push({ x: d.x, y: Math.round(d.floor), life: 0.3 })
        d.y = -Math.random() * 20
        d.x = Math.random() * (W + 60) - 40
        d.floor = Math.random() < 0.7 ? WATER + Math.random() * (H - WATER) : STREET + Math.random() * 5
      }
    }
    for (const s of fx.splashes) s.life -= dt
    fx.splashes = fx.splashes.filter((s) => s.life > 0).slice(-200)

    // Snow.
    const wantFlakes = w.precip === 'snow' ? Math.round(w.intensity * 220 * (W / 320)) : 0
    while (fx.flakes.length < wantFlakes) fx.flakes.push({ x: Math.random() * W, y: Math.random() * H, vy: 10 + Math.random() * 16, phase: Math.random() * 6, big: Math.random() < 0.2 })
    fx.flakes.length = Math.min(fx.flakes.length, wantFlakes)
    for (const f of fx.flakes) {
      f.y += f.vy * dt
      f.x += (Math.sin(env.t * 1.2 + f.phase) * 7 + w.wind * 0.35) * dt
      if (f.y > H) {
        f.y = -2
        f.x = Math.random() * W
      }
      if (f.x > W + 2) f.x -= W + 4
    }

    // Falling autumn leaves when it's windy.
    if (env.season === 'autumn' && w.wind > 6 && fx.leaves.length < 14 && Math.random() < dt * (0.5 + w.wind / 20)) {
      const tree = env.trees[Math.floor(Math.random() * env.trees.length)]
      fx.leaves.push({ x: tree.x + (Math.random() - 0.5) * 16, y: tree.base - 30 + Math.random() * 10, vy: 6 + Math.random() * 6, phase: Math.random() * 6, color: ['#e0602c', '#f0a030', '#c4621c', '#f2c94c'][Math.floor(Math.random() * 4)] })
    }
    for (const l of fx.leaves) {
      l.y += l.vy * dt
      l.x += (w.wind * 0.6 + Math.sin(env.t * 2 + l.phase) * 6) * dt
    }
    fx.leaves = fx.leaves.filter((l) => l.y < H && l.x < W + 4)

    // Lightning.
    fx.flash = Math.max(0, fx.flash - dt * 2.5)
    if (w.storm) {
      fx.nextFlash -= dt
      if (fx.nextFlash <= 0) {
        fx.nextFlash = 4 + Math.random() * 10
        fx.flash = 1
        const pts = []
        let x = 20 + Math.random() * (W - 40)
        for (let y = 0; y < HORIZON - 10; y += 5) {
          pts.push([x, y])
          x += (Math.random() - 0.5) * 9
        }
        fx.bolt = pts
      }
    }
  }

  function drawWeather(ctx, fx, w, t, skyColors) {
    const W = fx.W
    if (w.fog > 0) {
      const fog = px.mix(skyColors.bottom, '#c8cdd2', 0.6)
      for (let i = 0; i < 6; i++) {
        const y = 55 + i * 15 + Math.sin(t * 0.15 + i) * 4
        px.rect(ctx, 0, y, W, 16, px.css(fog, (w.fog * 0.16).toFixed(3)))
      }
      px.rect(ctx, 0, 0, W, H, px.css(fog, (w.fog * 0.26).toFixed(3)))
    }
    const rain = px.css(px.mix(skyColors.bottom, '#dfe8f0', 0.6), 0.6)
    for (const d of fx.drops) {
      px.rect(ctx, d.x, d.y, 1, d.len, rain)
      if (w.wind > 25) px.rect(ctx, d.x + 1, d.y + d.len, 1, 1, rain)
    }
    for (const s of fx.splashes) {
      const a = (s.life / 0.3).toFixed(2)
      const spread = s.life > 0.15 ? 1 : 2
      px.rect(ctx, s.x - spread, s.y, 1, 1, px.css('#dfe8f0', a))
      px.rect(ctx, s.x + spread, s.y, 1, 1, px.css('#dfe8f0', a))
    }
    for (const f of fx.flakes) px.rect(ctx, f.x, f.y, f.big ? 2 : 1, f.big ? 2 : 1, 'rgba(250,252,255,0.9)')
    for (const l of fx.leaves) px.rect(ctx, l.x, l.y, Math.sin(t * 5 + l.phase) > 0 ? 2 : 1, 1, l.color)
    if (fx.flash > 0) {
      if (fx.bolt && fx.flash > 0.6)
        for (let i = 1; i < fx.bolt.length; i++) px.line(ctx, fx.bolt[i - 1][0], fx.bolt[i - 1][1], fx.bolt[i][0], fx.bolt[i][1], '#fffbe0')
      px.rect(ctx, 0, 0, W, H, px.css('#f4f6ff', (fx.flash * 0.45).toFixed(2)))
    }
  }

  // ------------------------------------------------------------------ water

  function drawWater(ctx, fx, land, colors, t, w) {
    const W = fx.W
    const rows = H - WATER
    for (let r = 0; r < rows; r++) px.rect(ctx, 0, WATER + r, W, 1, px.mix(colors.top, colors.deep, r / rows))
    if (w.frozen) {
      for (let r = 0; r < rows; r++) px.rect(ctx, 0, WATER + r, W, 1, px.css(px.mix('#dce9f0', '#b9cfdb', r / rows), 0.85))
      for (let i = 0; i < 18; i++) {
        const x = px.hash(i, 7, 1) * W
        const y = WATER + 3 + px.hash(i, 8, 1) * (rows - 6)
        px.line(ctx, x, y, x + (px.hash(i, 9, 1) - 0.5) * 16, y + (px.hash(i, 10, 1) - 0.5) * 6, 'rgba(255,255,255,0.7)')
      }
    }
    // The town upside down in the canal, rippling a little, fading with depth.
    const choppy = 1 + w.wind / 40 + w.intensity * 0.8
    for (let r = 0; r < rows; r++) {
      ctx.globalAlpha = w.frozen ? 0.12 : 0.42 - (r / rows) * 0.2
      const dx = Math.round(Math.sin(t * 1.1 + r * 0.33) * (0.35 + r * 0.025) * choppy)
      ctx.drawImage(land, 0, Math.floor(WATER - 1 - r * 1.15), W, 1, dx, WATER + r, W, 1)
    }
    ctx.globalAlpha = 1
    if (!w.frozen) {
      // Little highlights on the water.
      const count = Math.round(W / 6 * (0.6 + w.wind / 30))
      for (let i = 0; i < count; i++) {
        const seed = Math.floor(t * 0.8 + px.hash(i, 1, 2) * 10)
        const x = px.hash(i, seed, 3) * W
        const y = WATER + 2 + px.hash(i, seed, 4) * (rows - 3)
        px.rect(ctx, x, y, 2 + Math.round(px.hash(i, seed, 5) * 3), 1, px.css(px.mix(colors.top, '#ffffff', 0.4), 0.35))
      }
    }
  }

  // ------------------------------------------------------------------ lights

  const WARM = ['#ffd27a', '#ffe3a3', '#ffc35e', '#f9e7c4', '#ffd27a', '#ffd27a']

  /** Share of windows lit at this hour, before darkness is taken into account. */
  function windowShare(hour) {
    if (hour >= 6 && hour < 8) return 0.45
    if (hour >= 8 && hour < 16) return 0.15
    if (hour >= 16 && hour < 23) return 0.7
    if (hour >= 23 || hour < 1) return 0.35
    return 0.07
  }

  function drawLights(ctx, town, lights, dark, hour, t, event) {
    if (dark < 0.15) return
    const share = windowShare(hour) * Math.min(1, dark * 1.4)
    const bucket = Math.floor(hour)
    const reflections = []
    for (const win of town.windows) {
      if (px.hash(win.house * 131 + win.i, bucket, 5) >= share) continue
      const pick = Math.floor(px.hash(win.house, win.i, 6) * WARM.length)
      const tv = px.hash(win.house, win.i, 8) < 0.05
      const color = tv ? px.mix('#9fc3ff', '#d0e2ff', 0.5 + 0.5 * Math.sin(t * 7 + win.i)) : WARM[pick]
      px.rect(ctx, win.x, win.y, win.w, win.h, color)
      if (win.h >= 5) px.rect(ctx, win.x, win.y + Math.floor(win.h / 2), win.w, 1, 'rgba(90,70,40,0.8)')
      if (win.y > 100) reflections.push({ x: win.x + 1, color, strength: 0.35 })
    }
    if (dark > 0.35) {
      for (const lamp of town.lamps) {
        px.disc(ctx, lamp.x, STREET - 16, 9, px.css('#ffcf7a', (0.07 * dark).toFixed(3)))
        px.disc(ctx, lamp.x, STREET - 16, 5, px.css('#ffcf7a', (0.14 * dark).toFixed(3)))
        px.rect(ctx, lamp.x, STREET - 17, 1, 2, '#fff1b8')
        px.rect(ctx, lamp.x - 6, STREET, 13, 5, px.css('#ffcf7a', (0.12 * dark).toFixed(3)))
        reflections.push({ x: lamp.x, color: '#ffd98a', strength: 0.6 })
      }
    }
    if (event === 'december' && dark > 0.3)
      for (const h of town.houses) {
        const y = STREET - (h.body ?? h.h - (h.gable || 0))
        for (let x = h.x + 1; x < h.x + h.w - 1; x += 2)
          if (Math.sin(t * 2 + x) > -0.3) px.rect(ctx, x, y, 1, 1, ['#ff4d4d', '#ffd84d', '#4dff88', '#4db8ff'][(((x >> 1) % 4) + 4) % 4])
      }
    for (const l of lights) {
      if (l.rect) {
        px.rect(ctx, l.rect[0], l.rect[1], l.rect[2], l.rect[3], l.color)
        continue
      }
      px.disc(ctx, l.x, l.y, l.r + 2, px.css(l.color, 0.18))
      px.rect(ctx, l.x, l.y, 1, 1, l.color)
      if (l.y > 120) reflections.push({ x: l.x, color: l.color, strength: 0.4 })
    }
    for (const ref of reflections)
      for (let k = 0; k < 12; k++) {
        const x = ref.x + Math.round(Math.sin(t * 2.2 + k * 1.7 + ref.x) * 1.3)
        const a = (ref.strength - k * 0.03) * dark
        if (a > 0.02) px.rect(ctx, x, WATER + 1 + k * 3, k % 3 === 0 ? 2 : 1, 2, px.css(ref.color, a.toFixed(2)))
      }
  }

  return { create, paintSky, drawStars, drawSun, drawMoon, updateClouds, drawClouds, updateWeather, drawWeather, drawWater, drawLights, windowShare }
})
