// The town: a row of houses in the local style, the skyline, the hero landmark
// (or a windmill / park), the train viaduct with the station sign, trees, the
// street and the quay. Static parts are drawn once a minute into cached layers;
// the windmill's sails and the trees' sway are drawn every frame.
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js'), styles: require('./styles.js'), landmarks: require('./landmarks.js'), font: require('./font.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).scene = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px

  const H = 180
  const STREET = 130 // the street surface; houses stand on it
  const WATER = 139 // the canal / river starts here
  const HORIZON = 104
  const MILL_ZONE = 118 // the right-hand part of the view: hero landmark, train, sign
  const GROUND = 122 // ground level of the hero zone

  const CYCLING = { dutch: 1, nordic: 0.6, central: 0.5, japan: 0.5, paris: 0.35, london: 0.3 }

  function buildTown(W, place) {
    const p = place || { style: 'dutch', hero: 'devalk', name: 'Leiden', palms: false }
    const seed = Array.from(p.cityId || p.name || 'x').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 1574)
    const r = px.rng(seed)
    const end = W - MILL_ZONE
    const houses = PW.styles.buildRow(p.style, -4, end, p.cityId === 'leiden' ? 1574 : seed)
    const windows = []
    for (const h of houses) h.windows.forEach((w, i) => windows.push({ ...w, house: h.idx, i }))

    const trees = []
    for (let tx = 16; tx < end - 6; tx += 40 + Math.floor(r() * 10)) trees.push({ x: tx, base: STREET, size: 1, seed: Math.floor(r() * 1e6) })
    const isMill = p.hero === 'devalk' || p.hero === 'windmill'
    // The station sign stands at the left of the hero zone, so no tree there.
    if (p.hero === 'park') trees.push({ x: W - 70, base: 123, size: 1.2, seed: 55 })
    if (p.hero !== 'chisinau') trees.push({ x: W - 12, base: GROUND, size: 1.1, seed: 91 }) // the bell tower stands there

    const lamps = trees.filter((t) => t.base === STREET).map((t) => ({ x: t.x + 20 })).filter((l) => l.x < W - 4)
    lamps.push({ x: W - 34 })

    const bikes = CYCLING[p.style] || 0.25
    const parked = []
    if (bikes >= 0.5) for (const t of trees) if (t.base === STREET && r() < 0.7) parked.push({ x: t.x + 3, dir: r() < 0.5 ? 1 : -1, color: ['#1d1d1f', '#3a5a8a', '#7a2020', '#2f5a3e'][Math.floor(r() * 4)] })

    return {
      W, place: p, houses, windows, trees, lamps, parked, end, bikes,
      palms: !!p.palms,
      isMill,
      hero: p.hero,
      heroX: W - 60,
      mill: { cx: W - 60, base: GROUND },
    }
  }

  function drawHouses(ctx, town, opts) {
    PW.styles.drawRow(ctx, town.houses, opts)
    if (opts.event === 'kingsday' || opts.event === 'ontzet') {
      const colors = opts.event === 'kingsday' ? ['#ff7a00', '#ff7a00', '#ff7a00'] : ['#c8102e', '#ffffff', '#c8102e']
      for (const h of town.houses) {
        if (h.idx % 2) continue
        const fx = h.x + h.w - 3
        const fy = STREET - 26
        px.line(ctx, fx, fy, fx + 3, fy - 3, '#3a2a1e')
        colors.forEach((c, i) => px.rect(ctx, fx + 3, fy - 3 + i, 6, 1, c))
      }
    }
  }

  /** Far rooftops, then the real skyline, then the city's hand-drawn icons. */
  function drawSkyline(ctx, W, colors, town, silhouettes) {
    const r = px.rng(4)
    let x = 0
    while (x < W) {
      const w = 8 + Math.floor(r() * 14)
      const top = HORIZON - 6 - Math.floor(r() * 9)
      px.rect(ctx, x, top, w, STREET - top, colors.far)
      px.rect(ctx, x + Math.floor(w / 2) - 1, top - 3, 2, 3, colors.far)
      x += w
    }
    if (silhouettes && silhouettes.length) PW.skyline.draw(ctx, silhouettes, colors.near, colors.far)
    for (const [id, at] of town.place.skyline || []) PW.landmarks.drawSkylineIcon(ctx, id, Math.round(W * at), 114, colors.near)
  }

  function drawViaduct(ctx, W) {
    const deck = '#5b5f66'
    for (let x = 4; x < W; x += 18) px.rect(ctx, x, 114, 3, 16, '#4a4e55')
    px.rect(ctx, 0, 112, W, 3, deck)
    px.rect(ctx, 0, 111, W, 1, '#3b3f45')
    for (let x = 0; x < W; x += 3) px.rect(ctx, x, 108, 1, 3, '#3b3f45')
    px.rect(ctx, 0, 107, W, 1, '#3b3f45')
  }

  const SEASON_LEAVES = {
    spring: [['#4f8a3a', '#78b04a', '#a8d46a'], ['#4f8a3a', '#7ab84c', '#f2b8c8']],
    summer: [['#2f5f2a', '#3f7a32', '#5f9a44'], ['#2a5527', '#3a7030', '#558f3e']],
    autumn: [['#7a3a14', '#c4621c', '#f0a030'], ['#6a4a14', '#b8861c', '#f2c94c'], ['#5a2a14', '#a33a1c', '#e0602c']],
    winter: null,
  }
  const GRASS = { spring: '#5f9a44', summer: '#4f8a3a', autumn: '#6f7a3a', winter: '#6b745a' }

  /** The ground of the hero zone: a grass bastion for windmills and parks, a paved square for landmarks. */
  function drawFeatureGround(ctx, town, opts) {
    const W = town.W
    const x0 = W - MILL_ZONE
    const paved = !town.isMill && !['park', 'cristo', 'chisinau'].includes(town.hero)
    const grass = opts.snow ? '#eef3f6' : town.place.style === 'desert' ? '#c9b07a' : GRASS[opts.season]
    const ground = paved ? '#9a9088' : grass
    const shade = px.mix(ground, '#000000', 0.18)
    for (let x = x0; x < W; x++) {
      const top = x < x0 + 16 ? Math.round(STREET - ((x - x0) / 16) * 8) : GROUND
      px.rect(ctx, x, top, 1, STREET - top, ground)
      if (paved ? (x + top) % 4 === 0 : px.hash(x, 5, 9) < 0.35) px.rect(ctx, x, top + 1 + Math.floor(px.hash(x, 6, 2) * 6), 1, 1, shade)
    }
    if (town.hero === 'park') {
      const fx = W - 40
      px.rect(ctx, fx - 7, GROUND - 3, 15, 3, '#8a8a8a')
      px.rect(ctx, fx - 1, GROUND - 9, 3, 6, '#9a9a9a')
      px.rect(ctx, fx - 2, GROUND - 4, 5, 1, '#6fa8d8')
      px.rect(ctx, x0 + 30, GROUND - 3, 8, 1, '#5a3a22')
      px.rect(ctx, x0 + 30, GROUND - 2, 1, 2, '#3a2a1e')
      px.rect(ctx, x0 + 37, GROUND - 2, 1, 2, '#3a2a1e')
    }
  }

  function drawHero(ctx, town, opts) {
    if (town.isMill) return drawMill(ctx, town, opts)
    if (town.hero !== 'park') PW.landmarks.drawHero(ctx, town.hero, town.heroX, GROUND)
  }

  function drawMill(ctx, town, opts) {
    const { cx, base } = town.mill
    const brick = '#5d3a2c'
    const lit = '#7a4e3a'
    const dark = '#3d251c'
    for (let y = base - 54; y < base; y++) {
      const t = (base - y) / 54
      const half = Math.round(13 - 6 * t)
      px.rect(ctx, cx - half, y, half * 2, 1, brick)
      px.rect(ctx, cx - half, y, 2, 1, lit)
      px.rect(ctx, cx + half - 2, y, 2, 1, dark)
      if (px.hash(y, cx, 11) < 0.5) px.rect(ctx, cx - half + 3 + Math.floor(px.hash(y, 3, 1) * (half * 2 - 6)), y, 1, 1, dark)
    }
    const gy = base - 24
    px.rect(ctx, cx - 20, gy, 40, 2, '#4a3424')
    px.rect(ctx, cx - 20, gy - 5, 40, 1, '#3a2a1e')
    for (let x = cx - 20; x <= cx + 19; x += 4) px.rect(ctx, x, gy - 5, 1, 5, '#3a2a1e')
    px.line(ctx, cx - 19, gy + 2, cx - 11, gy + 9, '#3a2a1e')
    px.line(ctx, cx + 18, gy + 2, cx + 10, gy + 9, '#3a2a1e')
    px.rect(ctx, cx - 3, base - 10, 6, 10, '#e9e2d0')
    px.rect(ctx, cx - 2, base - 9, 4, 9, '#3b2b20')
    for (const [wx, wy] of [[cx - 1, base - 42], [cx - 6, base - 18], [cx + 4, base - 18], [cx - 1, base - 33]]) {
      px.rect(ctx, wx - 1, wy - 1, 4, 5, '#e9e2d0')
      px.rect(ctx, wx, wy, 2, 3, '#2a3440')
    }
    const top = base - 54
    const widths = [6, 10, 13, 15, 16, 16, 15]
    widths.forEach((w, i) => px.rect(ctx, cx - Math.floor(w / 2), top - widths.length + i, w, 1, i < 2 ? '#5a5650' : '#3d3a36'))
    if (opts.snow) px.rect(ctx, cx - 3, top - widths.length - 1, 6, 2, '#f4f8fb')
  }

  /** The sails, every frame: four lattice arms around the hub. */
  function drawSails(ctx, town, angle) {
    if (!town.isMill) return
    const { cx, base } = town.mill
    const hy = base - 57
    for (let k = 0; k < 4; k++) {
      const a = angle + (k * Math.PI) / 2
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      for (let r = 2; r <= 40; r++) px.rect(ctx, cx + dx * r, hy + dy * r, 1, 1, '#2a1d14')
      for (let r = 7; r <= 40; r++)
        for (let s = 1; s <= 5; s++) px.rect(ctx, cx + dx * r - dy * s, hy + dy * r + dx * s, 1, 1, r % 3 === 0 || s === 5 || r === 40 ? '#4a3626' : '#d9cfb8')
    }
    px.disc(ctx, cx, hy, 2, '#1d1410')
  }

  /** A station-style sign with the city's name, so it's never in doubt where you are. */
  function drawSign(ctx, town) {
    const name = PW.font.normalize(town.place.name || '')
    if (!name) return
    const text = name.length > 24 ? name.slice(0, 24) : name
    const w = PW.font.width(text) + 6
    const x = town.W - MILL_ZONE + 3
    const y = 109
    px.rect(ctx, x + 2, y + 9, 1, GROUND - y - 9, '#3b3f45')
    px.rect(ctx, x + w - 3, y + 9, 1, GROUND - y - 9, '#3b3f45')
    px.rect(ctx, x, y, w, 9, '#f4f4f0')
    px.rect(ctx, x + 1, y + 1, w - 2, 7, '#1f3f8f')
    PW.font.draw(ctx, text, x + 3, y + 2, '#ffffff')
  }

  function drawPalm(ctx, tree, t, amp, snow) {
    const sway = Math.sin(t * 1.2 + tree.seed) * amp
    let x = tree.x
    const top = tree.base - 30
    for (let y = tree.base; y > top; y--) {
      const k = (tree.base - y) / 30
      x = tree.x + Math.round(Math.sin(k * 1.4) * 4 + sway * k * k)
      px.rect(ctx, x, y, 2, 1, (tree.base - y) % 3 === 0 ? '#6a4a2a' : '#8a6a42')
    }
    const greens = ['#2f6a2a', '#3f8a32', '#4f9a3a']
    for (let f = 0; f < 7; f++) {
      const a = -Math.PI / 2 + (f - 3) * 0.5 + sway * 0.05
      for (let i = 1; i < 13; i++) {
        const fx = x + 1 + Math.cos(a) * i
        const fy = top + Math.sin(a) * i * 0.6 + (i * i) / 14
        px.rect(ctx, fx, fy, 1, 1, greens[f % 3])
        if (i % 3 === 0) px.rect(ctx, fx, fy + 1, 1, 1, greens[(f + 1) % 3])
      }
    }
    px.rect(ctx, x, top + 1, 2, 2, '#5a3a1a')
    if (snow) px.rect(ctx, x - 2, top - 1, 6, 1, '#f4f8fb')
  }

  function drawTrees(ctx, town, t, wind, opts) {
    const amp = px.clamp(wind / 18, 0.3, 3.5)
    for (const tree of town.trees) {
      if (town.palms) {
        drawPalm(ctx, tree, t, amp, opts.snow)
        continue
      }
      const s = tree.size
      const tx = tree.x
      const trunkTop = tree.base - Math.round(24 * s)
      px.rect(ctx, tx, trunkTop, 2, tree.base - trunkTop, '#3b2a22')
      px.rect(ctx, tx, trunkTop, 1, tree.base - trunkTop, '#4c382c')
      const leaves = SEASON_LEAVES[opts.season]
      if (!leaves) {
        const sway = Math.round(Math.sin(t * 0.9 + tree.seed) * amp * 0.5)
        for (const [ex, ey] of [[-9, -12], [-5, -16], [0, -18], [5, -16], [9, -11], [-12, -6], [11, -5]]) {
          px.line(ctx, tx + 1, trunkTop + 2, tx + 1 + ex * s + sway, trunkTop + ey * s, '#3b2a22')
          if (opts.snow) px.rect(ctx, tx + 1 + ex * s + sway, trunkTop + ey * s - 1, 2, 1, '#f4f8fb')
        }
        continue
      }
      const pal = leaves[tree.seed % leaves.length]
      const blobs = [[0, -6, 9], [-7, -2, 7], [7, -2, 7], [-4, -12, 6], [5, -11, 6], [0, -15, 5]]
      for (const [bx, by, br] of blobs) {
        const sway = Math.round(Math.sin(t * 1.1 + tree.seed + bx * 0.2) * amp * (-by / 15))
        px.disc(ctx, tx + 1 + bx * s + sway, trunkTop + by * s, Math.round(br * s), pal[0])
      }
      for (const [bx, by, br] of blobs) {
        const sway = Math.round(Math.sin(t * 1.1 + tree.seed + bx * 0.2) * amp * (-by / 15))
        px.disc(ctx, tx + bx * s + sway, trunkTop + by * s - 1, Math.max(1, Math.round(br * s) - 2), pal[1])
      }
      for (let i = 0; i < 14; i++) {
        const a = px.hash(tree.seed, i, 1) * Math.PI * 2
        const d = px.hash(tree.seed, i, 2) * 9 * s
        const sway = Math.round(Math.sin(t * 1.1 + tree.seed) * amp * 0.6)
        px.rect(ctx, tx + Math.cos(a) * d + sway - 1, trunkTop - 8 * s + Math.sin(a) * d * 0.8 - 2, 1, 1, pal[2])
      }
      if (opts.snow) for (const [bx, by, br] of blobs) px.rect(ctx, tx + bx * s - br + 2, trunkTop + by * s - br * s, br * 2 - 2, 1, '#f4f8fb')
    }
  }

  function drawQuay(ctx, town, opts) {
    const W = town.W
    px.rect(ctx, 0, STREET, W, 5, '#6f6760')
    for (let x = 0; x < W; x++) for (let y = STREET; y < STREET + 5; y++) if (px.hash(x, y, 7) < 0.22) px.rect(ctx, x, y, 1, 1, '#5d5650')
    if (opts.snow) px.rect(ctx, 0, STREET, W, 1, '#e8eef2')
    px.rect(ctx, 0, STREET + 5, W, 1, '#a39d94')
    px.rect(ctx, 0, STREET + 6, W, WATER - STREET - 6, '#5a2c22')
    for (let x = 0; x < W; x += 4) px.rect(ctx, x + ((x / 4) % 2) * 2, STREET + 7, 1, 1, '#3f1e17')
    for (let x = 10; x < W; x += 31) px.rect(ctx, x, STREET + 2, 2, 3, '#2a2c30')
    for (const lamp of town.lamps) {
      px.rect(ctx, lamp.x, STREET - 15, 1, 15, '#22262b')
      px.rect(ctx, lamp.x - 1, STREET - 19, 3, 1, '#22262b')
      px.rect(ctx, lamp.x - 1, STREET - 18, 3, 3, '#22262b')
      px.rect(ctx, lamp.x, STREET - 17, 1, 2, '#c8d3d8')
      px.rect(ctx, lamp.x, STREET - 20, 1, 1, '#22262b')
    }
    // Japanese streets: utility poles and sagging wires.
    if (town.place.style === 'japan') {
      const poles = []
      for (let x = 24; x < town.end; x += 52) poles.push(x)
      for (const x of poles) {
        px.rect(ctx, x, STREET - 44, 2, 44, '#7a7a74')
        px.rect(ctx, x - 4, STREET - 40, 10, 1, '#5a5a54')
      }
      for (let i = 0; i < poles.length - 1; i++)
        for (let x = poles[i] + 2; x < poles[i + 1]; x++) {
          const t = (x - poles[i]) / (poles[i + 1] - poles[i])
          for (const dy of [0, 3]) px.rect(ctx, x, STREET - 40 + dy + Math.round(4 * 4 * t * (1 - t)), 1, 1, '#2a2a2a')
        }
    }
    for (const b of town.parked) drawParkedBike(ctx, b.x, STREET + 4, b.dir, b.color)
  }

  function drawParkedBike(ctx, x, y, dir, color) {
    const X = (dx) => (dir > 0 ? x + dx : x + 10 - dx)
    for (const cx of [X(2), X(8)]) {
      px.rect(ctx, cx - 1, y - 5, 3, 1, '#1d1d1f')
      px.rect(ctx, cx - 2, y - 4, 1, 3, '#1d1d1f')
      px.rect(ctx, cx + 2, y - 4, 1, 3, '#1d1d1f')
      px.rect(ctx, cx - 1, y - 1, 3, 1, '#1d1d1f')
    }
    px.line(ctx, X(2), y - 3, X(5), y - 3, color)
    px.line(ctx, X(5), y - 3, X(4), y - 7, color)
    px.line(ctx, X(5), y - 3, X(8), y - 6, color)
    px.line(ctx, X(8), y - 6, X(8), y - 3, color)
    px.rect(ctx, Math.min(X(3), X(5)), y - 8, 3, 1, '#1d1d1f')
    px.rect(ctx, X(8), y - 8, 1, 2, '#1d1d1f')
  }

  return {
    H, STREET, WATER, HORIZON, MILL_ZONE, GROUND,
    buildTown, drawHouses, drawSkyline, drawViaduct, drawFeatureGround, drawHero, drawMill, drawSails, drawSign, drawTrees, drawQuay,
  }
})
