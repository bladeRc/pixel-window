// Regional building styles. Each style mixes a few kinds of house; each kind
// knows how to lay itself out (size, windows) and how to draw itself.
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).styles = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px
  const STREET = 130
  const GLASS = '#2a3440'
  const SNOW = '#f4f8fb'

  const KINDS_FOR = {
    dutch: ['gable'],
    paris: ['mansard'],
    london: ['terrace'],
    american: ['brownstone', 'brownstone', 'brownstone', 'modern'],
    med: ['tiled'],
    colonial: ['tiled'],
    desert: ['tiled', 'tiled', 'modern'],
    nordic: ['steep'],
    central: ['steep'],
    japan: ['japan', 'japan', 'japan', 'modern'],
    modern: ['modern', 'modern', 'steep'],
    eastern: ['panel', 'panel', 'panel', 'pastel', 'pastel', 'pastel', 'pastel', 'church'],
  }

  const WALLS = {
    eastern: ['#b8b4aa', '#a8aaa6', '#c9c2b0', '#9aa0a6', '#d6cfbf', '#bfb6a0'],
    pastel: ['#e9d8a6', '#d9e6d0', '#f0c9b4', '#cfe0e8', '#efe6d0', '#e8b8a0', '#e2d0e8'],
    dutch: ['#7a3b2a', '#8b4a32', '#5e2f24', '#a9564b', '#6b2f22', '#e6dcc4', '#2f3b33', '#8c5a3c', '#d8c9a8', '#4a4f57', '#7d3f30'],
    paris: ['#e9dfc6', '#e2d5b8', '#efe6d0', '#d9ccad', '#e6dac0'],
    london: ['#8a4b38', '#9a5a42', '#7a4030', '#efe9dc', '#e6dccb', '#8f5640'],
    american: ['#6b4a3a', '#5c3f33', '#7a3b2a', '#8a5a42', '#704536'],
    med: ['#f2ead8', '#ead9b8', '#e8c99a', '#d9a07a', '#f4f0e6', '#c96e4a', '#efe1c4'],
    colonial: ['#e8506a', '#f2c94c', '#3fa3c8', '#6fbf73', '#f28c38', '#f4f0e6', '#b06ad0', '#2fb5a0'],
    desert: ['#e6cfa3', '#d9bc8c', '#efe2c6', '#d4b07a', '#e9d8b0'],
    nordic: ['#a8322a', '#e8c55a', '#3d5f8a', '#efe9dc', '#7a9a6a', '#c9663a'],
    central: ['#e9d8b4', '#d7e3c4', '#f0c9b4', '#c9d6e3', '#efe6d0', '#e8cfa0'],
    japan: ['#e8e1d0', '#d9cfb8', '#6a4a32', '#9aa0a6', '#efe9dc', '#7a6a58'],
    modern: ['#8a929c', '#b8bec6', '#6b7a8a', '#c9b79c', '#a3a8ad', '#d6d0c4', '#7d8a7a'],
  }

  const GABLES = ['step', 'bell', 'neck', 'spout', 'cornice', 'step', 'cornice', 'bell']
  const pick = (r, list) => list[Math.floor(r() * list.length)]
  const DRAW_EXTRA = {} // drawers of the kinds added after DRAW (see the Eastern European kinds)

  function grid(house, cols, firstY, lastY, stepY, w, h) {
    const xs = []
    for (let c = 0; c < cols; c++) xs.push(house.x + Math.round(((c + 1) * house.w) / (cols + 1)) - Math.floor(w / 2))
    for (let y = firstY; y >= lastY; y -= stepY) for (const x of xs) house.windows.push({ x, y, w, h })
    return xs
  }

  // ---------------------------------------------------------------- build

  const BUILD = {
    gable(r, x, style) {
      const w = 18 + Math.floor(r() * 10)
      const h = 44 + Math.floor(r() * 22)
      const type = pick(r, GABLES)
      const gable = type === 'cornice' ? 0 : Math.min(16, Math.floor(w * 0.62))
      const wall = pick(r, WALLS.dutch)
      const house = { kind: 'gable', x, w, h, type, gable, wall, trim: pick(r, ['#efe8d8', '#f4f0e6', '#ddd2ba']), door: pick(r, ['#2f4a3a', '#5a2e22', '#1f2d3d', '#3d2f25', '#6b1f1f']), shutter: r() < 0.3 ? pick(r, ['#2f5a3e', '#7a2a24', '#22303f']) : null, isBrick: !['#e6dcc4', '#d8c9a8', '#2f3b33', '#4a4f57'].includes(wall), windows: [] }
      const bodyTop = STREET - (h - gable)
      const cols = w >= 25 ? 3 : 2
      const xs = []
      for (let c = 0; c < cols; c++) xs.push(x + Math.round(((c + 1) * w) / (cols + 1)) - 1)
      house.doorX = xs[cols === 3 ? 1 : Math.floor(r() * 2)]
      for (const cx of xs) if (cx !== house.doorX) house.windows.push({ x: cx, y: STREET - 10, w: 3, h: 7 })
      for (let y = STREET - 24; y >= bodyTop + 3; y -= 11) for (const cx of xs) house.windows.push({ x: cx, y, w: 3, h: 5 })
      if (gable >= 9) house.windows.push({ x: x + Math.floor(w / 2) - 1, y: bodyTop - Math.floor(gable / 2), w: 2, h: 3 })
      return house
    },

    mansard(r, x) {
      const w = 30 + Math.floor(r() * 9)
      const floors = 5 + (r() < 0.3 ? 1 : 0)
      const body = 12 + (floors - 1) * 10
      const house = { kind: 'mansard', x, w, h: body + 9, body, floors, wall: pick(r, WALLS.paris), awning: r() < 0.6 ? pick(r, ['#7a1f2a', '#1f4a3a', '#1f2f5a', '#8a5a1a']) : null, windows: [] }
      const cols = Math.max(3, Math.floor((w - 4) / 7))
      house.cols = grid(house, cols, STREET - 22, STREET - body + 3, 10, 3, 6)
      for (const cx of house.cols) house.windows.push({ x: cx, y: STREET - body - 6, w: 3, h: 3 })
      return house
    },

    terrace(r, x) {
      const w = 16 + Math.floor(r() * 5)
      const floors = 3 + (r() < 0.5 ? 1 : 0)
      const h = 12 + (floors - 1) * 10 + 2
      const stucco = r() < 0.3
      const house = { kind: 'terrace', x, w, h, wall: stucco ? pick(r, ['#efe9dc', '#e6dccb']) : pick(r, WALLS.london.slice(0, 3).concat(['#8f5640'])), door: pick(r, ['#1b1b1d', '#1f2f5a', '#7a1f2a', '#2f4a3a']), windows: [] }
      house.doorX = x + 3
      house.windows.push({ x: x + w - 7, y: STREET - 10, w: 4, h: 7 })
      grid(house, 2, STREET - 22, STREET - h + 6, 10, 3, 6)
      return house
    },

    brownstone(r, x) {
      const w = 18 + Math.floor(r() * 5)
      const h = 46 + Math.floor(r() * 9)
      const house = { kind: 'brownstone', x, w, h, wall: pick(r, WALLS.american), fire: r() < 0.45, tank: r() < 0.25, windows: [] }
      house.cols = grid(house, 3, STREET - 25, STREET - h + 7, 10, 3, 6)
      house.windows.push({ x: house.cols[2], y: STREET - 13, w: 3, h: 6 })
      return house
    },

    tiled(r, x, style) {
      const w = 18 + Math.floor(r() * 9)
      const floors = 2 + Math.floor(r() * 3)
      const body = 12 + (floors - 1) * 10
      const flat = style === 'desert' || r() < (style === 'colonial' ? 0.5 : 0.25)
      const house = { kind: 'tiled', style, x, w, body, h: body + (flat ? 3 : 5), flat, wall: pick(r, WALLS[style] || WALLS.med), shutter: pick(r, style === 'colonial' ? ['#f4f0e6', '#6a4a32', '#2f6a8a'] : ['#2f6a8a', '#3f7a4a', '#7a3a2a', '#5a7a9a']), balcony: r() < 0.6, windows: [] }
      house.cols = grid(house, w >= 24 ? 3 : 2, STREET - 22, STREET - body + 3, 10, 3, 5)
      house.doorX = x + Math.floor(w / 2) - 1
      return house
    },

    steep(r, x, style) {
      const w = 18 + Math.floor(r() * 7)
      const floors = 2 + Math.floor(r() * 2)
      const body = 12 + (floors - 1) * 10
      const roof = Math.round(w * 0.55)
      const nordic = style === 'nordic'
      const house = { kind: 'steep', x, w, body, roof, h: body + roof, nordic, wall: pick(r, WALLS[nordic ? 'nordic' : 'central']), roofColor: nordic ? pick(r, ['#3a3f46', '#2f3338', '#5a2e22']) : pick(r, ['#9e3b2b', '#8a3a2a', '#5a5f66']), timber: !nordic && r() < 0.4, windows: [] }
      grid(house, 2, STREET - 9, STREET - body + 3, 10, 3, 4)
      house.windows.push({ x: x + Math.floor(w / 2) - 1, y: STREET - body - Math.floor(roof / 2), w: 2, h: 3 })
      house.doorX = x + Math.floor(w / 2) - 1
      house.windows = house.windows.filter((wi) => !(wi.y > STREET - 12 && Math.abs(wi.x - house.doorX) < 4))
      return house
    },

    japan(r, x) {
      const w = 20 + Math.floor(r() * 9)
      const house = { kind: 'japan', x, w, body: 24, h: 30, wall: pick(r, WALLS.japan), lantern: r() < 0.4, vending: r() < 0.25, windows: [] }
      grid(house, 2, STREET - 20, STREET - 20, 10, 5, 5)
      house.windows.push({ x: x + w - 9, y: STREET - 9, w: 5, h: 5 })
      return house
    },

    modern(r, x) {
      const w = 26 + Math.floor(r() * 13)
      const floors = 6 + Math.floor(r() * 7)
      const h = 10 + floors * 7
      const house = { kind: 'modern', x, w, h, wall: pick(r, WALLS.modern), sign: pick(r, ['#c8102e', '#1f4e9a', '#2f6a3a', '#f2a020', '#7a3a8a']), balconies: r() < 0.5, windows: [] }
      const cols = Math.floor((w - 2) / 5)
      for (let y = STREET - 16; y >= STREET - h + 4; y -= 7) for (let c = 0; c < cols; c++) house.windows.push({ x: x + 2 + c * 5, y, w: 3, h: 4 })
      return house
    },
  }

  // Eastern Europe: Soviet-era panel blocks, old pastel houses, Orthodox churches.
  Object.assign(BUILD, {
    panel(r, x) {
      const w = 30 + Math.floor(r() * 15)
      const floors = r() < 0.45 ? 5 : 9 + Math.floor(r() * 4)
      const h = 10 + floors * 8
      const house = { kind: 'panel', x, w, h, floors, wall: pick(r, WALLS.eastern), stripe: r() < 0.4 ? pick(r, ['#c96a4a', '#5a8ab8', '#d8b04a', '#6a9a6a']) : null, sign: pick(r, ['#c8102e', '#1f6aa8', '#2f8a4a', '#e88a1a']), windows: [], balconies: [] }
      const cols = Math.floor((w - 2) / 6)
      for (let f = 0; f < floors - 1; f++) {
        const y = STREET - 16 - f * 8
        for (let c = 0; c < cols; c++) {
          const wx = x + 2 + c * 6
          house.windows.push({ x: wx, y, w: 3, h: 4 })
          // Every balcony was glazed in by its own family, each in its own way.
          if (c % 2 === 1 && r() < 0.8) house.balconies.push({ x: wx - 1, y: y + 1, glazed: r() < 0.6, frame: pick(r, ['#e8e4dc', '#6a4a32', '#8a9aaa', '#d8d0c0']), dish: r() < 0.08, ac: r() < 0.12 })
        }
      }
      return house
    },

    pastel(r, x) {
      const w = 18 + Math.floor(r() * 9)
      const floors = r() < 0.6 ? 1 : 2
      const body = 14 + (floors - 1) * 10
      const house = { kind: 'pastel', x, w, body, h: body + 6, wall: pick(r, WALLS.pastel), roof: pick(r, ['#a8402e', '#4f7a5a', '#a8402e', '#5a6a7a']), windows: [] }
      house.cols = grid(house, w >= 24 ? 3 : 2, STREET - 10, STREET - body + 3, 10, 3, 5)
      house.doorX = x + w - 6
      house.windows = house.windows.filter((wi) => !(wi.y > STREET - 12 && Math.abs(wi.x - house.doorX) < 4))
      return house
    },

    church(r, x) {
      const w = 26
      return { kind: 'church', x, w, h: 48, body: 20, dome: pick(r, ['#d4a63a', '#3a5a9a', '#4f8a6a']), windows: [{ x: x + 6, y: STREET - 15, w: 2, h: 5 }, { x: x + 18, y: STREET - 15, w: 2, h: 5 }] }
    },
  })

  /** An onion dome: `w` wide, `h` tall, with its cross, standing on (cx, base). */
  function onion(ctx, cx, base, w, h, color) {
    for (let i = 0; i < h; i++) {
      // From the base up: a short neck, the swell at about a third, then the tapering point.
      const t = i / (h - 1)
      const shape = t < 0.35 ? 0.7 + 0.3 * (t / 0.35) : Math.cos(((t - 0.35) / 0.65) * Math.PI * 0.5) ** 1.4
      const span = Math.max(1, Math.round(w * shape))
      px.rect(ctx, cx - Math.floor(span / 2), base - i, span, 1, i === Math.round(h * 0.5) ? px.mix(color, '#ffffff', 0.35) : color)
    }
    px.rect(ctx, cx, base - h - 4, 1, 4, '#d4a63a')
    px.rect(ctx, cx - 1, base - h - 3, 3, 1, '#d4a63a')
  }

  Object.assign(DRAW_EXTRA, {
    panel(ctx, h, o) {
      const top = STREET - h.h
      const seam = px.mix(h.wall, '#000', 0.14)
      px.rect(ctx, h.x, top, h.w, h.h, h.wall)
      for (let y = STREET - 10; y > top; y -= 8) px.rect(ctx, h.x, y, h.w, 1, seam)
      for (let x = h.x + 6; x < h.x + h.w; x += 12) px.rect(ctx, x, top, 1, h.h - 10, seam)
      if (h.stripe) px.rect(ctx, h.x + Math.floor(h.w / 2) - 1, top + 2, 3, h.h - 12, h.stripe)
      for (const w of h.windows) {
        px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
        px.rect(ctx, w.x, w.y, 1, 1, '#4f6d86')
      }
      for (const b of h.balconies) {
        if (b.glazed) {
          px.rect(ctx, b.x, b.y - 2, 5, 5, b.frame)
          px.rect(ctx, b.x + 1, b.y - 1, 3, 2, '#5a7088')
        } else {
          px.rect(ctx, b.x, b.y + 2, 5, 1, px.mix(h.wall, '#000', 0.3))
          px.rect(ctx, b.x, b.y + 1, 1, 1, px.mix(h.wall, '#000', 0.3))
          px.rect(ctx, b.x + 4, b.y + 1, 1, 1, px.mix(h.wall, '#000', 0.3))
        }
        if (b.dish) px.rect(ctx, b.x + 5, b.y - 1, 2, 2, '#d8d8d8')
        if (b.ac) px.rect(ctx, b.x + 5, b.y + 1, 2, 2, '#f0f0f0')
      }
      px.rect(ctx, h.x, STREET - 10, h.w, 10, px.mix(h.wall, '#000', 0.08))
      px.rect(ctx, h.x + 2, STREET - 8, h.w - 10, 8, '#2a3440')
      px.rect(ctx, h.x + 2, STREET - 10, h.w - 10, 2, h.sign)
      px.rect(ctx, h.x + h.w - 6, STREET - 8, 3, 8, '#4a3a2a')
      px.rect(ctx, h.x + 4, top - 4, 6, 4, px.mix(h.wall, '#000', 0.12))
      if (o.snow) px.rect(ctx, h.x, top - 1, h.w, 1, SNOW)
    },

    pastel(ctx, h, o) {
      const top = STREET - h.body
      px.rect(ctx, h.x, top, h.w, h.body, h.wall)
      px.rect(ctx, h.x, top, h.w, 1, '#f4f1ea')
      // A tin hip roof with standing seams.
      for (let i = 0; i < 6; i++) {
        const inset = i * 2 - 1
        const rw = h.w - inset * 2
        if (rw <= 0) break
        px.rect(ctx, h.x + inset, top - 1 - i, rw, 1, h.roof)
        for (let x = h.x + inset; x < h.x + inset + rw; x += 3) px.rect(ctx, x, top - 1 - i, 1, 1, px.mix(h.roof, '#000', 0.2))
      }
      if (o.snow) px.rect(ctx, h.x + 4, top - 6, h.w - 8, 2, SNOW)
      for (const w of h.windows) {
        px.rect(ctx, w.x - 1, w.y - 2, w.w + 2, w.h + 3, '#f4f1ea')
        px.rect(ctx, w.x, w.y - 1, w.w, w.h + 1, GLASS)
        px.rect(ctx, w.x, w.y - 1, 1, 1, '#f4f1ea')
        px.rect(ctx, w.x + w.w - 1, w.y - 1, 1, 1, '#f4f1ea')
      }
      px.rect(ctx, h.doorX - 1, STREET - 10, 5, 10, '#f4f1ea')
      px.rect(ctx, h.doorX, STREET - 9, 3, 9, '#5a3a22')
    },

    church(ctx, h, o) {
      const top = STREET - h.body
      const white = '#f2efe6'
      px.rect(ctx, h.x + 2, top, h.w - 4, h.body, white)
      for (let i = 0; i < 4; i++) px.rect(ctx, h.x + 1 + i, top - 1 - i, h.w - 2 - i * 2, 1, '#6a7a8a')
      px.rect(ctx, h.x + 9, top - 12, 8, 8, white)
      px.rect(ctx, h.x + 11, top - 10, 1, 4, '#2a3440')
      px.rect(ctx, h.x + 14, top - 10, 1, 4, '#2a3440')
      onion(ctx, h.x + 13, top - 13, 10, 9, h.dome)
      if (o.snow) px.rect(ctx, h.x + 3, top - 5, h.w - 6, 1, SNOW)
      for (const w of h.windows) px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
      px.rect(ctx, h.x + 11, STREET - 9, 5, 9, '#7a5a2a')
      px.rect(ctx, h.x + 12, STREET - 10, 3, 1, '#7a5a2a')
    },
  })

  function buildRow(style, startX, endX, seed) {
    const r = px.rng(seed)
    const kinds = KINDS_FOR[style] || KINDS_FOR.modern
    const houses = []
    let x = startX
    let idx = 0
    let churches = 0
    while (x < endX) {
      let kind = pick(r, kinds)
      if (kind === 'church' && churches++ > 0) kind = 'pastel' // one church per street is plenty
      const h = BUILD[kind](r, x, style)
      // Never spill into the landmark zone (the station sign stands there).
      if (h.x + h.w > endX + 2) break
      h.idx = idx++
      houses.push(h)
      x += h.w + (style === 'dutch' || style === 'london' || style === 'paris' || style === 'american' ? 0 : r() < 0.4 ? 1 + Math.floor(r() * 3) : 0)
    }
    return houses
  }

  // ---------------------------------------------------------------- draw

  function window(ctx, w, trim) {
    px.rect(ctx, w.x - 1, w.y - 1, w.w + 2, w.h + 2, trim)
    px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
  }

  function brick(ctx, h, top, dark, density) {
    for (let y = top; y < STREET; y++) for (let c = 1; c < h.w; c++) if (px.hash(h.idx * 97 + c, y, 3) < density) px.rect(ctx, h.x + c, y, 1, 1, dark)
  }

  function gableProfile(h, c) {
    const { w, gable: g, type } = h
    if (!g) return 0
    const d = Math.min(c, w - 1 - c)
    const t = d / ((w - 1) / 2)
    switch (type) {
      case 'spout':
        return Math.round(g * Math.min(1, t * 1.05))
      case 'step':
        return Math.round((g * (Math.min(4, Math.floor(t * 4.6)) + 1)) / 5)
      case 'neck': {
        const shoulder = (w - Math.max(6, Math.round(w * 0.42))) / 2
        return d >= shoulder ? g : Math.round(g * 0.42 * Math.min(1, (d + 1) / shoulder) ** 0.6)
      }
      case 'bell':
        return Math.round(g * (t < 0.3 ? (t / 0.3) * 0.45 : 0.45 + 0.55 * Math.sin(((t - 0.3) / 0.7) * Math.PI * 0.5)))
      default:
        return 0
    }
  }

  const DRAW = {
    gable(ctx, h, o) {
      const bodyTop = STREET - (h.h - h.gable)
      const dark = px.mix(h.wall, '#000000', 0.35)
      for (let c = 0; c < h.w; c++) {
        const top = bodyTop - gableProfile(h, c)
        px.rect(ctx, h.x + c, top, 1, STREET - top, h.wall)
        if (h.gable) px.rect(ctx, h.x + c, top, 1, 1, h.trim)
        if (o.snow && top < STREET - 4) px.rect(ctx, h.x + c, top - 1, 1, 2, SNOW)
      }
      if (h.isBrick)
        for (let y = bodyTop - h.gable; y < STREET; y++)
          for (let c = 1; c < h.w; c++) if (px.hash(h.idx * 97 + c, y, 3) < 0.07 && y >= bodyTop - gableProfile(h, c)) px.rect(ctx, h.x + c, y, 1, 1, dark)
      px.rect(ctx, h.x, bodyTop - gableProfile(h, 0), 1, STREET - bodyTop + gableProfile(h, 0), dark)
      if (h.type === 'cornice') {
        px.rect(ctx, h.x - 1, bodyTop - 2, h.w + 2, 2, h.trim)
        px.rect(ctx, h.x, bodyTop, h.w, 1, dark)
        if (o.snow) px.rect(ctx, h.x - 1, bodyTop - 3, h.w + 2, 1, SNOW)
      } else px.rect(ctx, h.x + Math.floor(h.w / 2) - 1, bodyTop - h.gable - 2, 2, 2, h.trim)
      for (const w of h.windows) {
        window(ctx, w, h.trim)
        if (w.h >= 5) px.rect(ctx, w.x, w.y + Math.floor(w.h / 2), w.w, 1, h.trim)
        if (h.shutter && w.h === 5) {
          px.rect(ctx, w.x - 2, w.y - 1, 1, w.h + 2, h.shutter)
          px.rect(ctx, w.x + w.w + 1, w.y - 1, 1, w.h + 2, h.shutter)
        }
      }
      px.rect(ctx, h.doorX - 1, STREET - 11, 5, 11, h.trim)
      px.rect(ctx, h.doorX, STREET - 10, 3, 2, GLASS)
      px.rect(ctx, h.doorX, STREET - 7, 3, 7, h.door)
    },

    mansard(ctx, h, o) {
      const top = STREET - h.body
      const line = px.mix(h.wall, '#000000', 0.15)
      px.rect(ctx, h.x, top, h.w, h.body, h.wall)
      px.rect(ctx, h.x, top, 1, h.body, line)
      for (let y = STREET - 12; y > top; y -= 10) px.rect(ctx, h.x, y, h.w, 1, line)
      // The zinc mansard roof with dormers and chimneys.
      for (let i = 0; i < 9; i++) {
        const inset = Math.min(i, 3) + (i > 6 ? i - 6 : 0)
        px.rect(ctx, h.x + inset, top - 1 - i, h.w - inset * 2, 1, i === 0 ? '#3f4852' : '#5d6a78')
      }
      if (o.snow) px.rect(ctx, h.x + 5, top - 10, h.w - 10, 2, SNOW)
      for (const cx of [h.x + 2, h.x + h.w - 5]) {
        px.rect(ctx, cx, top - 13, 3, 5, '#c7b08a')
        px.rect(ctx, cx, top - 14, 1, 1, '#c96a3a')
        px.rect(ctx, cx + 2, top - 14, 1, 1, '#c96a3a')
      }
      for (const w of h.windows) {
        if (w.y < top) {
          px.rect(ctx, w.x - 1, w.y - 2, w.w + 2, w.h + 3, h.wall)
          px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
          continue
        }
        window(ctx, w, '#f4ecd8')
      }
      // Wrought-iron balconies on the 2nd and 5th floors.
      for (const fy of [STREET - 22 + 7, STREET - 52 + 7]) {
        if (fy < top + 4) continue
        px.rect(ctx, h.x + 1, fy, h.w - 2, 1, '#1d1f22')
        for (let x = h.x + 1; x < h.x + h.w - 1; x += 2) px.rect(ctx, x, fy - 2, 1, 2, '#1d1f22')
      }
      // Shop on the ground floor.
      if (h.awning) {
        px.rect(ctx, h.x + 1, STREET - 9, h.w - 2, 9, '#2a3440')
        for (let x = h.x; x < h.x + h.w; x++) px.rect(ctx, x, STREET - 12, 1, 3, Math.floor((x - h.x) / 2) % 2 ? h.awning : '#efe6d0')
      } else {
        px.rect(ctx, h.x + Math.floor(h.w / 2) - 2, STREET - 9, 4, 9, '#2a2420')
      }
    },

    terrace(ctx, h, o) {
      const top = STREET - h.h
      px.rect(ctx, h.x, top, h.w, h.h, h.wall)
      brick(ctx, h, top, px.mix(h.wall, '#000', 0.25), h.wall === '#efe9dc' || h.wall === '#e6dccb' ? 0 : 0.08)
      px.rect(ctx, h.x, top, h.w, 2, px.mix(h.wall, '#fff', 0.25))
      px.rect(ctx, h.x + h.w - 3, top - 5, 4, 5, '#7a3a2a')
      for (let i = 0; i < 3; i++) px.rect(ctx, h.x + h.w - 3 + i * 1.5, top - 7, 1, 2, '#c96a3a')
      if (o.snow) px.rect(ctx, h.x, top - 1, h.w, 1, SNOW)
      for (const w of h.windows) {
        window(ctx, w, '#f4f1ea')
        px.rect(ctx, w.x, w.y + Math.floor(w.h / 2), w.w, 1, '#f4f1ea')
      }
      px.rect(ctx, h.doorX - 1, STREET - 12, 5, 12, '#f4f1ea')
      px.rect(ctx, h.doorX, STREET - 11, 3, 2, GLASS)
      px.rect(ctx, h.doorX, STREET - 8, 3, 8, h.door)
      px.rect(ctx, h.x, STREET - 4, h.w, 1, '#1b1b1d')
      for (let x = h.x; x < h.x + h.w; x += 2) px.rect(ctx, x, STREET - 5, 1, 5, '#1b1b1d')
    },

    brownstone(ctx, h, o) {
      const top = STREET - h.h
      px.rect(ctx, h.x, top, h.w, h.h, h.wall)
      brick(ctx, h, top, px.mix(h.wall, '#000', 0.25), 0.06)
      px.rect(ctx, h.x - 1, top, h.w + 2, 3, '#3a2a22')
      for (let x = h.x; x < h.x + h.w; x += 2) px.rect(ctx, x, top + 3, 1, 1, '#3a2a22')
      if (o.snow) px.rect(ctx, h.x - 1, top - 1, h.w + 2, 1, SNOW)
      for (const w of h.windows) {
        window(ctx, w, '#d9c9a8')
        px.rect(ctx, w.x - 1, w.y - 2, w.w + 2, 1, '#d9c9a8')
      }
      // Raised door and the stoop.
      const dx = h.x + 2
      px.rect(ctx, dx, STREET - 18, 4, 10, '#3a2a22')
      px.rect(ctx, dx + 1, STREET - 17, 2, 9, '#2a1d14')
      for (let s = 0; s < 8; s++) px.rect(ctx, dx + 3 + s, STREET - 8 + s, 2, 8 - s, '#8a7a6a')
      px.line(ctx, dx + 4, STREET - 10, dx + 12, STREET - 2, '#1b1b1d')
      if (h.fire) {
        for (let y = STREET - 23; y > top + 6; y -= 10) {
          px.rect(ctx, h.x + 6, y, h.w - 8, 1, '#1b1b1d')
          px.rect(ctx, h.x + 6, y - 3, h.w - 8, 1, '#1b1b1d')
          for (let x = h.x + 6; x < h.x + h.w - 2; x += 2) px.rect(ctx, x, y - 3, 1, 3, '#1b1b1d')
          px.line(ctx, h.x + 7, y, h.x + h.w - 4, y + 9, '#1b1b1d')
        }
      }
      if (h.tank) {
        const tx = h.x + h.w - 9
        px.rect(ctx, tx, top - 9, 6, 6, '#6a4a32')
        for (let i = 0; i < 4; i++) px.rect(ctx, tx - 1 + i, top - 12 + i, 8 - i * 2, 1, '#3a2a22')
        px.rect(ctx, tx, top - 3, 1, 3, '#1b1b1d')
        px.rect(ctx, tx + 5, top - 3, 1, 3, '#1b1b1d')
      }
    },

    tiled(ctx, h, o) {
      const top = STREET - h.body
      px.rect(ctx, h.x, top, h.w, h.body, h.wall)
      px.rect(ctx, h.x, top, 1, h.body, px.mix(h.wall, '#000', 0.12))
      if (h.flat) {
        px.rect(ctx, h.x, top - 3, h.w, 3, px.mix(h.wall, '#000', 0.08))
        if (h.style === 'desert') for (let x = h.x; x < h.x + h.w; x += 3) px.rect(ctx, x, top - 5, 2, 2, px.mix(h.wall, '#000', 0.08))
      } else {
        for (let i = 0; i < 5; i++) px.rect(ctx, h.x - 1 + i * 2, top - 1 - i, h.w + 2 - i * 4, 1, i % 2 ? '#c8673d' : '#a8472a')
        if (o.snow) px.rect(ctx, h.x + 6, top - 6, h.w - 12, 1, SNOW)
      }
      for (const w of h.windows) {
        if (h.style === 'desert') {
          px.rect(ctx, w.x, w.y, w.w, w.h, '#3a2f28')
          px.rect(ctx, w.x, w.y, 1, 1, h.wall)
          px.rect(ctx, w.x + w.w - 1, w.y, 1, 1, h.wall)
          continue
        }
        px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
        px.rect(ctx, w.x - 1, w.y, 1, w.h, h.shutter)
        px.rect(ctx, w.x + w.w, w.y, 1, w.h, h.shutter)
        if (h.balcony && w.y < STREET - 20) {
          px.rect(ctx, w.x - 2, w.y + w.h, w.w + 4, 1, '#2a2420')
          px.rect(ctx, w.x - 1, w.y + w.h - 1, 1, 1, '#d8304a')
          px.rect(ctx, w.x + w.w, w.y + w.h - 1, 1, 1, '#e86aa0')
        }
      }
      px.rect(ctx, h.doorX, STREET - 8, 3, 8, h.style === 'desert' ? '#5a3a22' : '#4a3020')
    },

    steep(ctx, h, o) {
      const top = STREET - h.body
      px.rect(ctx, h.x, top, h.w, h.body, h.wall)
      if (h.nordic) for (let x = h.x + 1; x < h.x + h.w; x += 2) px.rect(ctx, x, top, 1, h.body, px.mix(h.wall, '#000', 0.12))
      if (h.timber) {
        const beam = '#4a3426'
        for (let y = STREET - 12; y >= top; y -= 10) px.rect(ctx, h.x, y, h.w, 1, beam)
        px.rect(ctx, h.x, top, 1, h.body, beam)
        px.rect(ctx, h.x + h.w - 1, top, 1, h.body, beam)
        px.line(ctx, h.x + 1, STREET - 13, h.x + 6, STREET - 21, beam)
        px.line(ctx, h.x + h.w - 2, STREET - 13, h.x + h.w - 7, STREET - 21, beam)
      }
      // The steep gable roof facing the street.
      const half = h.w / 2 + 1
      for (let i = 0; i < h.roof; i++) {
        const span = Math.round(half * (1 - i / h.roof))
        px.rect(ctx, h.x + h.w / 2 - span, top - 1 - i, span * 2, 1, h.roofColor)
        if (o.snow && i % 2 === 0) px.rect(ctx, h.x + h.w / 2 - span, top - 1 - i, 2, 1, SNOW)
      }
      px.rect(ctx, h.x + 2, top - 1, h.w - 4, Math.floor(h.roof * 0.6), h.wall)
      for (let i = 0; i < Math.floor(h.roof * 0.6); i++) {
        const span = Math.round(half * (1 - (i + 2) / h.roof)) - 1
        px.rect(ctx, h.x + 2, top - 1 - i, h.w - 4, 1, h.roofColor)
        px.rect(ctx, h.x + h.w / 2 - span, top - 1 - i, span * 2, 1, h.wall)
      }
      for (const w of h.windows) {
        window(ctx, w, '#f4f1ea')
        px.rect(ctx, w.x + 1, w.y, 1, w.h, '#f4f1ea')
      }
      px.rect(ctx, h.doorX - 1, STREET - 10, 5, 10, '#f4f1ea')
      px.rect(ctx, h.doorX, STREET - 9, 3, 9, h.nordic ? '#2f3b55' : '#5a3a22')
    },

    japan(ctx, h, o) {
      const top = STREET - h.body
      px.rect(ctx, h.x, top, h.w, h.body, h.wall)
      // The mid eave between the floors and the roof, ends turned up.
      px.rect(ctx, h.x - 2, STREET - 13, h.w + 4, 2, '#3a3f47')
      for (let i = 0; i < 4; i++) px.rect(ctx, h.x - 3 + i, top - 1 - i, h.w + 6 - i * 2, 1, i === 0 ? '#2a2e35' : '#3a3f47')
      px.rect(ctx, h.x - 3, top - 2, 1, 1, '#3a3f47')
      px.rect(ctx, h.x + h.w + 2, top - 2, 1, 1, '#3a3f47')
      if (o.snow) px.rect(ctx, h.x, top - 5, h.w, 1, SNOW)
      for (const w of h.windows) {
        px.rect(ctx, w.x, w.y, w.w, w.h, '#d8cfb4')
        px.rect(ctx, w.x + 2, w.y, 1, w.h, '#5a4a3a')
        px.rect(ctx, w.x, w.y + 2, w.w, 1, '#5a4a3a')
      }
      px.rect(ctx, h.x + 3, STREET - 9, 5, 9, '#3a2f28')
      if (h.lantern) px.rect(ctx, h.x + 1, STREET - 11, 2, 3, '#c8102e')
      if (h.vending) {
        px.rect(ctx, h.x + h.w - 4, STREET - 8, 4, 8, '#2f6aa8')
        px.rect(ctx, h.x + h.w - 3, STREET - 7, 2, 3, '#e8f4ff')
      }
    },

    modern(ctx, h, o) {
      const top = STREET - h.h
      px.rect(ctx, h.x, top, h.w, h.h, h.wall)
      px.rect(ctx, h.x, top, 1, h.h, px.mix(h.wall, '#000', 0.15))
      px.rect(ctx, h.x + h.w - 1, top, 1, h.h, px.mix(h.wall, '#fff', 0.12))
      for (const w of h.windows) {
        px.rect(ctx, w.x, w.y, w.w, w.h, GLASS)
        px.rect(ctx, w.x, w.y, 1, 1, '#4f6d86')
        if (h.balconies) px.rect(ctx, w.x - 1, w.y + w.h, w.w + 2, 1, px.mix(h.wall, '#fff', 0.3))
      }
      px.rect(ctx, h.x + 1, STREET - 9, h.w - 2, 9, '#2a3440')
      px.rect(ctx, h.x + 1, STREET - 11, h.w - 2, 2, h.sign)
      px.rect(ctx, h.x + 3, top - 2, 4, 2, '#5a5f66')
      px.rect(ctx, h.x + h.w - 6, top - 6, 1, 6, '#3a3f46')
      if (o.snow) px.rect(ctx, h.x, top - 1, h.w, 1, SNOW)
    },
  }

  function drawRow(ctx, houses, opts) {
    for (const h of houses) (DRAW[h.kind] || DRAW_EXTRA[h.kind])(ctx, h, opts)
  }

  /** The tallest point of a house, for layout. */
  function topOf(h) {
    return STREET - h.h
  }

  return { KINDS_FOR, WALLS, buildRow, drawRow, gableProfile, topOf, onion }
})
