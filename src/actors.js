// Everything that moves: cyclists, the train, boats, ducks, skaters and gulls.
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js'), scene: require('./scene.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).actors = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px
  const { STREET, WATER, MILL_ZONE } = PW.scene

  const SHIRTS = ['#c8102e', '#1f4e9a', '#f2c94c', '#2f6a3a', '#e6e6e6', '#202020', '#ff7a00', '#7a3a8a', '#3fa3c8']
  const BIKES = ['#1d1d1f', '#3a5a8a', '#7a2020', '#2f5a3e', '#c9c2b0', '#5a3a6a']
  const HAIR = ['#2a1d14', '#6a4a2a', '#d8b56a', '#1a1a1a', '#a0522d', '#9a9a9a']
  const SKIN = ['#f1c7a3', '#d9a07a', '#8d5a3b', '#e8b890']
  const UMBRELLAS = ['#1a1a1a', '#c8102e', '#1f4e9a', '#2f6a3a', '#f2c94c']

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)]
  }

  /** How many cyclists per second, by hour and weather. */
  function bikeRate(hour, w) {
    let rate = hour >= 7 && hour < 9 ? 0.4 : hour >= 16 && hour < 19 ? 0.4 : hour >= 9 && hour < 16 ? 0.2 : hour >= 19 && hour < 23 ? 0.12 : 0.025
    if (w.precip === 'rain') rate *= 1 - w.intensity * 0.5
    if (w.precip === 'snow') rate *= 0.45
    if (w.storm) rate *= 0.4
    return rate
  }

  function create(W) {
    return {
      W,
      bikes: [],
      boats: [],
      gulls: [],
      train: null,
      nextTrain: 8 + Math.random() * 20,
      nextBoat: 5 + Math.random() * 25,
      nextGulls: 3 + Math.random() * 15,
      ducks: [0, 1, 2].map((i) => ({ x: 30 + i * 9 + Math.random() * 20, y: 150 + i * 5, vx: (Math.random() - 0.5) * 2, phase: Math.random() * 6 })),
      skaters: [0, 1, 2, 3].map((i) => ({ x: Math.random() * W, y: 146 + i * 7, dir: i % 2 ? 1 : -1, speed: 10 + Math.random() * 10, phase: Math.random() * 6, shirt: pick(SHIRTS) })),
    }
  }

  function update(a, dt, env) {
    const W = a.W
    const w = env.weather

    if (Math.random() < bikeRate(env.hour, w) * (env.bikes ?? 1) * dt && a.bikes.length < 9) {
      const dir = Math.random() < 0.5 ? 1 : -1
      a.bikes.push({
        x: dir > 0 ? -16 : W + 2,
        dir,
        speed: 15 + Math.random() * 9,
        shirt: pick(SHIRTS),
        frame: pick(BIKES),
        hair: pick(HAIR),
        skin: pick(SKIN),
        umbrella: w.precip !== 'none' && Math.random() < 0.55 ? pick(UMBRELLAS) : null,
        phase: Math.random() * 6,
      })
    }
    for (const b of a.bikes) b.x += b.dir * b.speed * dt
    a.bikes = a.bikes.filter((b) => b.x > -20 && b.x < W + 20)

    a.nextTrain -= dt
    const trainsRun = env.hour >= 5 || env.hour < 1
    if (!a.train && a.nextTrain <= 0 && trainsRun) {
      const dir = Math.random() < 0.5 ? 1 : -1
      a.train = { dir, x: dir > 0 ? -170 : W + 10, speed: 55 + Math.random() * 15, cars: 3 + Math.floor(Math.random() * 2) }
    }
    if (a.train) {
      a.train.x += a.train.dir * a.train.speed * dt
      const len = a.train.cars * 41
      if (a.train.x > W + 20 || a.train.x < -len - 20) {
        a.train = null
        a.nextTrain = 70 + Math.random() * 150
      }
    }

    a.nextBoat -= dt
    if (a.nextBoat <= 0 && !w.frozen && !w.storm && a.boats.length === 0) {
      const dir = Math.random() < 0.5 ? 1 : -1
      a.boats.push({ dir, x: dir > 0 ? -30 : W + 4, speed: 6 + Math.random() * 4, people: 1 + Math.floor(Math.random() * 4), hull: pick(['#1f3f2f', '#e8e2d4', '#2b3a55', '#7a2020']), shirts: [pick(SHIRTS), pick(SHIRTS), pick(SHIRTS), pick(SHIRTS)] })
      a.nextBoat = 45 + Math.random() * 90
    }
    for (const b of a.boats) b.x += b.dir * b.speed * dt
    a.boats = a.boats.filter((b) => b.x > -40 && b.x < W + 40)

    a.nextGulls -= dt
    if (a.nextGulls <= 0) {
      a.nextGulls = 25 + Math.random() * 60
      if (env.darkness < 0.5 && !w.storm && w.intensity < 0.7) {
        const dir = w.wind > 25 ? 1 : Math.random() < 0.5 ? 1 : -1
        const n = 2 + Math.floor(Math.random() * 4)
        for (let i = 0; i < n; i++)
          a.gulls.push({ x: (dir > 0 ? -10 : W + 10) - dir * i * (6 + Math.random() * 6), y: 18 + Math.random() * 45, dir, speed: 14 + Math.random() * 8 + w.wind * 0.2, phase: Math.random() * 6 })
      }
    }
    for (const g of a.gulls) g.x += g.dir * g.speed * dt
    a.gulls = a.gulls.filter((g) => g.x > -40 && g.x < W + 40)

    for (const d of a.ducks) {
      d.x += d.vx * dt
      if (Math.random() < dt * 0.2) d.vx = (Math.random() - 0.5) * 3
      d.x = px.clamp(d.x, 6, W - MILL_ZONE - 6)
    }
    for (const s of a.skaters) {
      s.x += s.dir * s.speed * dt
      if (s.x > W + 10) s.dir = -1
      if (s.x < -10) s.dir = 1
    }
  }

  // --------------------------------------------------------------- drawing

  function drawBike(ctx, b, t, lights, dark) {
    const x = Math.round(b.x)
    const dir = b.dir
    const yb = dir > 0 ? STREET + 3 : STREET + 5
    const cy = yb - 3
    const X = (dx) => (dir > 0 ? x + dx : x + 13 - dx)
    const R = (dx, y, w, h, c) => px.rect(ctx, dir > 0 ? x + dx : x + 13 - dx - w + 1, y, w, h, c)
    const ring = (dx) => {
      R(dx - 1, cy - 2, 3, 1, '#1d1d1f')
      R(dx - 1, cy + 2, 3, 1, '#1d1d1f')
      R(dx - 2, cy - 1, 1, 3, '#1d1d1f')
      R(dx + 2, cy - 1, 1, 3, '#1d1d1f')
    }
    ring(2)
    ring(11)
    // The legs behind the frame, then the frame.
    const p = t * 7 + b.phase
    const pants = '#2b2f3a'
    px.line(ctx, X(5), cy - 5, X(6) + Math.round(Math.cos(p + Math.PI) * 1.5) * dir, cy + Math.round(Math.sin(p + Math.PI) * 1.5), px.mix(pants, '#000', 0.3))
    px.line(ctx, X(2), cy, X(6), cy, b.frame)
    px.line(ctx, X(6), cy, X(5), cy - 4, b.frame)
    px.line(ctx, X(5), cy - 4, X(10), cy - 4, b.frame)
    px.line(ctx, X(6), cy, X(10), cy - 4, b.frame)
    px.line(ctx, X(10), cy - 4, X(11), cy, b.frame)
    px.line(ctx, X(10), cy - 4, X(10), cy - 6, '#1d1d1f')
    R(9, cy - 6, 2, 1, '#1d1d1f')
    R(4, cy - 5, 2, 1, '#1d1d1f')
    px.line(ctx, X(5), cy - 5, X(6) + Math.round(Math.cos(p) * 1.5) * dir, cy + Math.round(Math.sin(p) * 1.5), pants)
    // Rider.
    for (let k = 0; k < 6; k++) R(5 + Math.round(k * 0.35), cy - 6 - k, 2, 1, b.shirt)
    px.line(ctx, X(7), cy - 10, X(10), cy - 6, px.mix(b.shirt, '#000', 0.25))
    R(7, cy - 15, 2, 3, b.skin)
    R(7, cy - 15, 2, 1, b.hair)
    R(6, cy - 14, 1, 2, b.hair)
    if (b.umbrella) {
      px.line(ctx, X(9), cy - 9, X(9), cy - 19, '#1d1d1f')
      R(5, cy - 20, 9, 1, b.umbrella)
      R(6, cy - 21, 7, 1, b.umbrella)
      R(7, cy - 22, 5, 1, b.umbrella)
      R(9, cy - 23, 1, 1, '#1d1d1f')
    }
    if (dark > 0.45) {
      lights.push({ x: X(12), y: cy - 4, color: '#fff3c0', r: 2 })
      lights.push({ x: X(1), y: cy - 3, color: '#ff3b30', r: 1 })
    }
  }

  function drawTrain(ctx, tr, lights, dark) {
    const top = 96
    for (let c = 0; c < tr.cars; c++) {
      const x0 = Math.round(tr.x + c * 41)
      px.rect(ctx, x0, top + 1, 40, 14, '#f2c200')
      px.rect(ctx, x0 + 1, top, 38, 1, '#80858c')
      px.rect(ctx, x0, top + 12, 40, 2, '#1f3f8f')
      px.rect(ctx, x0, top + 14, 40, 1, '#2a2d33')
      for (let wx = x0 + 3; wx < x0 + 37; wx += 5) {
        if (wx === x0 + 18) {
          px.rect(ctx, wx, top + 4, 3, 8, '#c9a200')
          continue
        }
        px.rect(ctx, wx, top + 3, 3, 3, '#2b3542')
        px.rect(ctx, wx, top + 8, 3, 3, '#2b3542')
        if (dark > 0.4) {
          lights.push({ rect: [wx, top + 3, 3, 3], color: '#fff1c4' })
          lights.push({ rect: [wx, top + 8, 3, 3], color: '#fff1c4' })
        }
      }
      // Sloped noses on the end cars.
      const isFront = tr.dir > 0 ? c === tr.cars - 1 : c === 0
      const isEnd = c === 0 || c === tr.cars - 1
      if (isEnd) {
        const nx = (tr.dir > 0) === isFront ? x0 + 39 : x0
        const side = (tr.dir > 0) === isFront ? 1 : -1
        for (let i = 0; i < 6; i++) px.rect(ctx, nx + side * Math.ceil(i / 2), top + 1 + i, 1, 1, '#2b3542')
        if (dark > 0.3 && isFront) lights.push({ x: nx + side * 2, y: top + 11, color: '#ffffff', r: 2 })
      }
    }
  }

  function drawBoat(ctx, b, t, lights, dark) {
    const L = 26
    const x = Math.round(b.x)
    const y = 152 + Math.round(Math.sin(t * 1.3) * 0.6)
    for (let i = 0; i < 4; i++) px.rect(ctx, x + i, y + i, L - i * 2, 1, i === 0 ? '#e8e2d4' : b.hull)
    for (let i = 0; i < b.people; i++) {
      const pxx = x + 5 + i * 5
      px.rect(ctx, pxx, y - 4, 3, 4, b.shirts[i])
      px.rect(ctx, pxx + 1, y - 6, 2, 2, SKIN[(i + 1) % SKIN.length])
    }
    const back = b.dir > 0 ? x - 1 : x + L
    px.rect(ctx, back, y - 2, 2, 4, '#2a2c30')
    for (let i = 1; i < 10; i++) if (Math.random() < 0.5) px.rect(ctx, back - b.dir * i * 2, y + 3 + (i % 2), 2, 1, 'rgba(255,255,255,0.45)')
    if (dark > 0.4) lights.push({ x: b.dir > 0 ? x + L - 2 : x + 1, y: y - 3, color: '#fff3c0', r: 2 })
  }

  function drawDuck(ctx, d, t) {
    const y = Math.round(d.y + Math.sin(t * 2 + d.phase) * 0.6)
    const x = Math.round(d.x)
    const right = d.vx >= 0
    px.rect(ctx, x, y, 4, 2, '#7a5a3a')
    px.rect(ctx, x + (right ? 3 : -1), y - 2, 2, 2, '#2f6a3a')
    px.rect(ctx, x + (right ? 5 : -2), y - 1, 1, 1, '#f2a020')
    px.rect(ctx, x, y + 2, 4, 1, 'rgba(255,255,255,0.25)')
  }

  function drawSkater(ctx, s, t) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    const k = Math.sin(t * 3 + s.phase)
    px.rect(ctx, x, y - 9, 2, 2, SKIN[0])
    px.rect(ctx, x - s.dir, y - 7, 3, 4, s.shirt)
    px.rect(ctx, x - s.dir * 2, y - 7, 1, 1, '#c8102e')
    px.line(ctx, x, y - 3, x + Math.round(k * 2), y, '#1d1d1f')
    px.line(ctx, x + 1, y - 3, x + 1 - Math.round(k * 2), y, '#1d1d1f')
  }

  const GULL = [
    ['k...k', '.w.w.', '..w..'],
    ['.....', 'kwwwk', '..w..'],
  ]

  function drawGull(ctx, g, t) {
    const frame = Math.floor(t * 4 + g.phase) % 2
    px.sprite(ctx, GULL[frame], Math.round(g.x), Math.round(g.y), { w: '#f4f4f4', k: '#3a3a3a' })
  }

  /** Draws the land actors (behind the tint) and collects their lights. */
  function drawLand(ctx, a, t, lights, dark, layer) {
    if (layer === 'train') {
      if (a.train) drawTrain(ctx, a.train, lights, dark)
      return
    }
    for (const b of a.bikes) drawBike(ctx, b, t, lights, dark)
    for (const g of a.gulls) drawGull(ctx, g, t)
  }

  function drawWater(ctx, a, t, lights, dark, frozen) {
    if (frozen) {
      for (const s of a.skaters) drawSkater(ctx, s, t)
      return
    }
    for (const d of a.ducks) drawDuck(ctx, d, t)
    for (const b of a.boats) drawBoat(ctx, b, t, lights, dark)
  }

  return { create, update, drawLand, drawWater, bikeRate }
})
