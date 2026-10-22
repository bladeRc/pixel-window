// Hand-drawn landmarks: a big "hero" on the right of the view, and small
// silhouettes on the far skyline. Each is a little drawing in code.
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).landmarks = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px
  const R = (ctx, x, y, w, h, c) => px.rect(ctx, x, y, w, h, c)

  /** A tapering lattice tower (Eiffel, Tokyo Tower): legs, platforms, criss-cross texture. */
  function latticeTower(ctx, cx, base, height, spread, colors, decks) {
    const top = base - height
    for (let y = top; y < base; y++) {
      const t = (base - y) / height
      const hw = Math.round(spread * Math.pow(1 - t, 2.3) + 1)
      const leg = Math.max(1, Math.round(hw * 0.32))
      const solid = t > 0.5
      const band = colors.band ? Math.floor((base - y) / 7) % 2 === 1 : false
      const c = band ? colors.band : colors.main
      const dark = px.mix(c, '#000000', 0.3)
      if (solid || hw <= 3) R(ctx, cx - hw, y, hw * 2 + 1, 1, c)
      else {
        R(ctx, cx - hw, y, leg, 1, c)
        R(ctx, cx + hw - leg + 1, y, leg, 1, c)
        if (t > 0.18) for (let x = cx - hw + leg; x <= cx + hw - leg; x++) if ((x + y) % 4 === 0 || (x - y) % 4 === 0) R(ctx, x, y, 1, 1, dark)
      }
      if ((y + cx) % 3 === 0) R(ctx, cx - hw, y, 1, 1, dark)
    }
    for (const [t, extra, h] of decks) {
      const y = Math.round(base - height * t)
      const hw = Math.round(spread * Math.pow(1 - t, 2.3) + 1) + extra
      R(ctx, cx - hw, y - h + 1, hw * 2 + 1, h, colors.deck || colors.main)
    }
  }

  const HEROES = {
    eiffel(ctx, cx, base) {
      latticeTower(ctx, cx, base, 100, 24, { main: '#6b5440' }, [[0.18, 3, 2], [0.42, 2, 2], [0.78, 1, 2]])
      R(ctx, cx, base - 106, 1, 7, '#4a3a2c')
    },
    tokyotower(ctx, cx, base) {
      latticeTower(ctx, cx, base, 96, 22, { main: '#e8481c', band: '#f2f0ea', deck: '#d8dde2' }, [[0.38, 4, 5], [0.7, 2, 3]])
      R(ctx, cx, base - 104, 1, 9, '#e8481c')
    },
    bigben(ctx, cx, base) {
      // The Palace of Westminster to the left.
      const stone = '#c2aa72'
      R(ctx, cx - 58, base - 24, 48, 24, stone)
      for (let x = cx - 58; x < cx - 10; x += 4) {
        R(ctx, x, base - 28, 1, 4, stone)
        R(ctx, x + 2, base - 20, 1, 5, '#6a5a3a')
        R(ctx, x + 2, base - 11, 1, 5, '#6a5a3a')
      }
      // Elizabeth Tower.
      R(ctx, cx - 6, base - 66, 12, 66, '#c9b27a')
      for (let x = cx - 4; x < cx + 6; x += 3) R(ctx, x, base - 64, 1, 60, '#a8915c')
      R(ctx, cx - 8, base - 80, 16, 15, '#c9b27a')
      px.disc(ctx, cx, base - 73, 5, '#efe8d0')
      R(ctx, cx, base - 77, 1, 4, '#1d1d1f')
      R(ctx, cx, base - 73, 3, 1, '#1d1d1f')
      R(ctx, cx - 6, base - 86, 12, 6, '#c9b27a')
      for (let x = cx - 5; x < cx + 5; x += 3) R(ctx, x, base - 85, 1, 4, '#5a4a32')
      for (let i = 0; i < 14; i++) R(ctx, cx - 6 + Math.floor(i / 2.3), base - 87 - i, 12 - Math.floor(i / 2.3) * 2, 1, '#3d4048')
      R(ctx, cx, base - 104, 1, 4, '#d4a63a')
    },
    empire(ctx, cx, base) {
      const c = '#b8b2a6'
      const steps = [[30, 0, 40], [22, 40, 70], [14, 70, 90], [10, 90, 96], [6, 96, 102], [3, 102, 108]]
      for (const [w, from, to] of steps) {
        R(ctx, cx - w / 2, base - to, w, to - from, c)
        for (let x = cx - w / 2 + 1; x < cx + w / 2 - 1; x += 2) R(ctx, x, base - to + 1, 1, to - from - 1, '#8a857a')
      }
      R(ctx, cx, base - 120, 1, 12, '#6a6a6a')
    },
    colosseum(ctx, cx, base) {
      const c = '#d2b48c'
      const left = cx - 50
      const width = 100
      for (let tier = 0; tier < 4; tier++) {
        const y0 = base - 9 - tier * 9
        const end = tier === 3 ? width * 0.55 : tier === 2 ? width * 0.8 : width
        R(ctx, left, y0, end, 9, tier % 2 ? '#cbab80' : c)
        if (tier < 3) for (let x = left + 2; x < left + end - 2; x += 5) R(ctx, x, y0 + 2, 2, 6, '#6a5440')
        else for (let x = left + 3; x < left + end - 2; x += 6) R(ctx, x, y0 + 3, 1, 2, '#6a5440')
      }
      for (let x = left + width * 0.55; x < left + width * 0.8; x += 1) if (px.hash(x, 1, 1) < 0.5) R(ctx, x, base - 37, 1, 2, c)
    },
    fernsehturm(ctx, cx, base) {
      R(ctx, cx - 9, base - 6, 18, 6, '#9aa0a6')
      for (let y = base - 82; y < base - 6; y++) {
        const w = Math.round(3 + ((y - (base - 82)) / 76) * 3)
        R(ctx, cx - w, y, w * 2 + 1, 1, '#c8cdd2')
      }
      px.disc(ctx, cx, base - 88, 8, '#b8c0c8')
      R(ctx, cx - 8, base - 89, 17, 2, '#5a6470')
      px.disc(ctx, cx - 3, base - 92, 2, '#dfe5ea')
      for (let i = 0; i < 26; i++) R(ctx, cx, base - 97 - i, 1, 1, Math.floor(i / 4) % 2 ? '#c8102e' : '#f2f2f2')
    },
    sagrada(ctx, cx, base) {
      const c = '#cdb78f'
      const spires = [[-34, 58], [-24, 70], [-14, 64], [-3, 96], [8, 80], [18, 72], [28, 62], [36, 54]]
      R(ctx, cx - 40, base - 28, 82, 28, '#bfa77c')
      for (const [dx, h] of spires) {
        for (let i = 0; i < h; i++) {
          const w = Math.max(1, Math.round(4 * (1 - i / h) + 0.5))
          R(ctx, cx + dx - w, base - i, w * 2 + 1, 1, c)
          if (i % 4 === 0 && w > 1) R(ctx, cx + dx, base - i, 1, 1, '#6a5440')
        }
        px.disc(ctx, cx + dx, base - h - 1, 1, '#e8d8a0')
      }
      // Still a construction crane, of course.
      R(ctx, cx + 44, base - 100, 2, 100, '#f2c200')
      R(ctx, cx + 20, base - 100, 40, 2, '#f2c200')
      px.line(ctx, cx + 30, base - 98, cx + 30, base - 80, '#3a3a3a')
    },
    opera(ctx, cx, base) {
      R(ctx, cx - 50, base - 6, 100, 6, '#c9a37a')
      const shells = [[-36, 20, 18], [-18, 26, 24], [2, 32, 30], [22, 22, 20], [38, 16, 14]]
      for (const [dx, w, h] of shells)
        for (let i = 0; i < h; i++) {
          const span = Math.round(w * Math.sqrt(1 - (i / h) ** 2))
          R(ctx, cx + dx, base - 6 - i, Math.max(1, span - Math.round(i * 0.3)), 1, i % 3 === 0 ? '#d8d6d0' : '#f2f0ea')
        }
    },
    burj(ctx, cx, base) {
      const tiers = [[22, 0, 30], [17, 30, 55], [12, 55, 78], [8, 78, 96], [5, 96, 108], [3, 108, 114]]
      for (const [w, from, to] of tiers) {
        R(ctx, cx - w / 2, base - to, w, to - from, '#a8b8c8')
        R(ctx, cx - w / 2, base - to, 1, to - from, '#d8e2ea')
      }
      R(ctx, cx, base - 124, 1, 10, '#a8b8c8')
    },
    goldengate(ctx, cx, base) {
      const red = '#c0362c'
      const deck = base - 12
      R(ctx, cx - 60, deck, 130, 3, red)
      for (const tx of [cx - 22, cx + 52]) {
        R(ctx, tx - 4, base - 78, 2, 78, red)
        R(ctx, tx + 2, base - 78, 2, 78, red)
        for (const y of [base - 76, base - 60, base - 44, base - 28]) R(ctx, tx - 4, y, 8, 2, red)
      }
      for (let x = cx - 60; x < cx + 70; x++) {
        const t = (x - (cx - 22)) / 74
        const y = Math.round(base - 76 + 60 * 4 * t * (1 - t) * (t >= 0 && t <= 1 ? 1 : 0) + (t < 0 ? -t * 70 : 0) + (t > 1 ? (t - 1) * 70 : 0))
        R(ctx, x, Math.min(y, deck - 1), 1, 1, red)
        if (x % 3 === 0 && y < deck - 1) R(ctx, x, y, 1, deck - y, '#a8302a')
      }
    },
    mosque(ctx, cx, base) {
      const stone = '#d8cdb8'
      const lead = '#7d8a96'
      R(ctx, cx - 34, base - 22, 68, 22, stone)
      for (let x = cx - 30; x < cx + 30; x += 6) R(ctx, x, base - 14, 2, 5, '#5a4a3a')
      for (const [dx, r] of [[-20, 8], [20, 8], [0, 18]]) {
        for (let i = 0; i <= r; i++) {
          const half = Math.round(Math.sqrt(r * r - i * i))
          R(ctx, cx + dx - half, base - 22 - (dx ? 0 : 6) - i, half * 2 + 1, 1, lead)
        }
      }
      R(ctx, cx - 18, base - 28, 36, 6, stone)
      R(ctx, cx, base - 48, 1, 4, '#d4a63a')
      for (const mx of [cx - 44, cx - 38, cx + 38, cx + 44]) {
        R(ctx, mx, base - 70, 2, 70, stone)
        R(ctx, mx - 1, base - 52, 4, 1, stone)
        for (let i = 0; i < 7; i++) R(ctx, mx + (i > 3 ? 1 : 0), base - 71 - i, i > 3 ? 1 : 2, 1, lead)
      }
    },
    spaceneedle(ctx, cx, base) {
      const c = '#e8e4dc'
      for (let y = base - 66; y < base; y++) {
        const t = (y - (base - 66)) / 66
        const hw = Math.round(2 + Math.abs(t - 0.45) * 16)
        R(ctx, cx - hw, y, 2, 1, c)
        R(ctx, cx + hw - 1, y, 2, 1, c)
        R(ctx, cx, y, 1, 1, '#c8c2b6')
      }
      for (let i = 0; i < 6; i++) R(ctx, cx - 13 + Math.abs(i - 2), base - 72 + i, 27 - Math.abs(i - 2) * 2, 1, i === 2 ? '#c8a038' : c)
      R(ctx, cx - 3, base - 76, 7, 4, c)
      R(ctx, cx, base - 92, 1, 16, '#c8c2b6')
    },
    cntower(ctx, cx, base) {
      for (let y = base - 82; y < base; y++) {
        const w = Math.round(2 + ((y - (base - 82)) / 82) * 4)
        R(ctx, cx - w, y, w * 2 + 1, 1, '#a8acb0')
      }
      for (let i = 0; i < 9; i++) R(ctx, cx - 8 + Math.abs(i - 4), base - 90 + i, 17 - Math.abs(i - 4) * 2, 1, i === 4 ? '#3a3f46' : '#9aa0a6')
      R(ctx, cx - 2, base - 100, 5, 10, '#a8acb0')
      R(ctx, cx - 3, base - 104, 7, 4, '#9aa0a6')
      for (let i = 0; i < 18; i++) R(ctx, cx, base - 105 - i, 1, 1, Math.floor(i / 3) % 2 ? '#c8102e' : '#e8e8e8')
    },
    cristo(ctx, cx, base) {
      for (let x = cx - 58; x < cx + 60; x++) {
        const d = Math.abs(x - cx) / 58
        const top = Math.round(base - 70 * (1 - d * d * 0.9) + px.hash(x, 2, 2) * 3)
        R(ctx, x, top, 1, base - top, '#3f6a3a')
        if (px.hash(x, 4, 4) < 0.4) R(ctx, x, top + 2 + Math.floor(px.hash(x, 5, 5) * 20), 1, 1, '#2f5a2a')
      }
      R(ctx, cx - 1, base - 92, 3, 22, '#efece4')
      R(ctx, cx - 7, base - 88, 15, 2, '#efece4')
      R(ctx, cx - 1, base - 94, 3, 2, '#efece4')
    },
    westerkerk(ctx, cx, base) {
      R(ctx, cx - 44, base - 26, 36, 26, '#7a3b2a')
      for (let i = 0; i < 10; i++) R(ctx, cx - 44 + i, base - 27 - i, 36 - i * 2, 1, '#3d4048')
      for (let x = cx - 40; x < cx - 10; x += 6) R(ctx, x, base - 20, 2, 10, '#2a3440')
      R(ctx, cx - 7, base - 50, 14, 50, '#7a3b2a')
      R(ctx, cx - 6, base - 62, 12, 12, '#d8c9a8')
      R(ctx, cx - 5, base - 72, 10, 10, '#d8c9a8')
      R(ctx, cx - 4, base - 80, 8, 8, '#d8c9a8')
      for (const y of [base - 58, base - 68, base - 77]) R(ctx, cx - 2, y, 4, 4, '#2a3440')
      R(ctx, cx - 3, base - 84, 7, 4, '#2f4a8a')
      R(ctx, cx - 2, base - 86, 5, 2, '#d4a63a')
      R(ctx, cx, base - 92, 1, 6, '#d4a63a')
    },
  }

  /** An onion dome with its cross, standing on (cx, base). */
  function onion(ctx, cx, base, w, h, color) {
    for (let i = 0; i < h; i++) {
      // From the base up: a short neck, the swell at about a third, then the tapering point.
      const t = i / (h - 1)
      const shape = t < 0.35 ? 0.7 + 0.3 * (t / 0.35) : Math.cos(((t - 0.35) / 0.65) * Math.PI * 0.5) ** 1.4
      const span = Math.max(1, Math.round(w * shape))
      R(ctx, cx - Math.floor(span / 2), base - i, span, 1, i === Math.round(h * 0.5) ? px.mix(color, '#ffffff', 0.35) : color)
    }
    R(ctx, cx, base - h - 4, 1, 4, '#d4a63a')
    R(ctx, cx - 1, base - h - 3, 3, 1, '#d4a63a')
  }

  /** A row of columns between y0 and y1. */
  function columns(ctx, x0, x1, y0, y1, step, color, shade) {
    for (let x = x0; x <= x1; x += step) {
      R(ctx, x, y0, 2, y1 - y0, color)
      R(ctx, x + 1, y0, 1, y1 - y0, shade)
    }
  }

  Object.assign(HEROES, {
    // Chișinău's Cathedral Park: the Triumphal Arch, the Nativity Cathedral and its bell tower.
    chisinau(ctx, cx, base) {
      const stone = '#efe6d2'
      const shade = '#d2c6ac'
      const dark = '#8a7a5a'
      // Nativity Cathedral.
      const kx = cx + 22
      R(ctx, kx - 17, base - 26, 34, 26, stone)
      R(ctx, kx - 17, base - 26, 34, 2, shade)
      for (const wx of [kx - 13, kx + 10]) R(ctx, wx, base - 20, 3, 8, '#3a3f46')
      R(ctx, kx - 11, base - 30, 22, 4, shade)
      for (let i = 0; i < 6; i++) R(ctx, kx - 11 + i, base - 31 - i, 22 - i * 2, 1, stone)
      columns(ctx, kx - 10, kx + 8, base - 26, base, 4, '#f8f2e4', shade)
      R(ctx, kx - 12, base - 2, 24, 2, shade)
      R(ctx, kx - 7, base - 46, 14, 10, stone)
      for (let x = kx - 6; x < kx + 7; x += 3) R(ctx, x, base - 44, 1, 6, dark)
      for (let i = 0; i < 8; i++) {
        const half = Math.round(8 * Math.sqrt(1 - (i / 8) ** 2))
        R(ctx, kx - half, base - 47 - i, half * 2, 1, '#6f8a80')
      }
      R(ctx, kx - 1, base - 58, 2, 3, stone)
      R(ctx, kx, base - 63, 1, 5, '#d4a63a')
      R(ctx, kx - 1, base - 61, 3, 1, '#d4a63a')
      // The bell tower, four tiers and a spire.
      const bx = cx + 50
      const tiers = [[12, 26], [10, 18], [8, 14], [6, 10]]
      let y = base
      for (const [w, h] of tiers) {
        R(ctx, bx - w / 2, y - h, w, h, stone)
        R(ctx, bx - w / 2, y - h, w, 1, shade)
        R(ctx, bx - 1, y - h + 3, 2, Math.max(2, h - 7), '#3a3f46')
        R(ctx, bx - w / 2, y - h, 1, h, shade)
        y -= h
      }
      onion(ctx, bx, y - 1, 6, 6, '#6f8a80')
      R(ctx, bx, y - 18, 1, 8, '#d4a63a')
      // The Triumphal Arch in front.
      const ax = cx - 6
      R(ctx, ax - 11, base - 30, 22, 30, stone)
      // The arched passage: straight sides, round top.
      R(ctx, ax - 4, base - 15, 8, 15, '#5a5f66')
      for (let i = 0; i <= 4; i++) {
        const half = Math.round(Math.sqrt(16 - i * i))
        R(ctx, ax - half, base - 15 - i, half * 2, 1, '#5a5f66')
      }
      columns(ctx, ax - 10, ax - 7, base - 26, base, 3, '#f8f2e4', shade)
      columns(ctx, ax + 6, ax + 9, base - 26, base, 3, '#f8f2e4', shade)
      R(ctx, ax - 12, base - 30, 24, 2, shade)
      R(ctx, ax - 9, base - 36, 18, 6, stone)
      R(ctx, ax - 9, base - 36, 18, 1, shade)
      R(ctx, ax - 3, base - 34, 6, 3, dark)
    },
    // Anywhere else in Eastern Europe: an Orthodox church with five onion domes.
    orthodox(ctx, cx, base) {
      const white = '#f2efe6'
      R(ctx, cx - 26, base - 28, 52, 28, white)
      for (let i = 0; i < 4; i++) R(ctx, cx - 27 + i, base - 29 - i, 54 - i * 2, 1, '#5a7a8a')
      for (const wx of [cx - 20, cx - 8, cx + 6, cx + 18]) R(ctx, wx, base - 22, 2, 8, '#2a3440')
      R(ctx, cx - 4, base - 12, 8, 12, '#7a5a2a')
      for (const [dx, w, h, dw, dh, col] of [[0, 12, 14, 14, 12, '#d4a63a'], [-17, 6, 8, 8, 8, '#3a5a9a'], [17, 6, 8, 8, 8, '#3a5a9a'], [-9, 6, 6, 8, 7, '#3a5a9a'], [9, 6, 6, 8, 7, '#3a5a9a']]) {
        R(ctx, cx + dx - w / 2, base - 32 - h, w, h, white)
        for (let x = cx + dx - w / 2 + 1; x < cx + dx + w / 2 - 1; x += 3) R(ctx, x, base - 30 - h, 1, h - 4, '#2a3440')
        onion(ctx, cx + dx, base - 33 - h, dw, dh, col)
      }
      R(ctx, cx + 34, base - 60, 10, 60, white)
      R(ctx, cx + 37, base - 52, 4, 6, '#2a3440')
      onion(ctx, cx + 39, base - 61, 8, 8, '#d4a63a')
    },
  })

  // Added to SKYLINE once that table exists (below).
  const EASTERN_SKYLINE = {
    // Chișinău's Government House: a long modernist block with a taller middle.
    govhouse(ctx, x, b, c) {
      R(ctx, x, b - 24, 70, 24, c)
      R(ctx, x + 25, b - 36, 20, 12, c)
    },
    tvtower(ctx, x, b, c) {
      for (let i = 0; i < 90; i++) R(ctx, x + Math.floor(i * 0.04), b - i, Math.max(1, 6 - Math.floor(i * 0.06)), 1, c)
      R(ctx, x - 2, b - 50, 9, 2, c)
      R(ctx, x - 1, b - 66, 7, 2, c)
    },
    orthodoxfar(ctx, x, b, c) {
      R(ctx, x, b - 22, 30, 22, c)
      onion(ctx, x + 15, b - 23, 10, 10, c)
      onion(ctx, x + 5, b - 23, 6, 6, c)
      onion(ctx, x + 25, b - 23, 6, 6, c)
    },
  }

  /** Night lights of a hero: what glows and what blinks. */
  function heroLights(ctx, hero, cx, base, t, dark, time) {
    if (dark < 0.3) return
    const blink = Math.floor(t * 1.2) % 2 === 0
    const aircraft = (y) => blink && px.rect(ctx, cx, y, 1, 1, '#ff2a2a')
    switch (hero) {
      case 'eiffel': {
        for (let i = 0; i < 70; i++) {
          const y = base - 2 - Math.floor(px.hash(i, 1, 9) * 96)
          const tt = (base - y) / 100
          const hw = Math.round(24 * Math.pow(1 - tt, 2.3) + 1)
          const side = px.hash(i, 2, 9) < 0.5 ? -1 : 1
          px.rect(ctx, cx + side * Math.round(px.hash(i, 3, 9) * hw), y, 1, 1, px.css('#ffcc66', (0.5 + 0.5 * dark).toFixed(2)))
        }
        // The sparkle: the first five minutes of every hour after dark.
        if (new Date(time).getMinutes() < 5)
          for (let i = 0; i < 25; i++) if (px.hash(i, Math.floor(t * 10), 7) < 0.5) px.rect(ctx, cx - 12 + Math.floor(px.hash(i, 4, Math.floor(t * 10)) * 25), base - 10 - Math.floor(px.hash(i, 5, Math.floor(t * 10)) * 90), 1, 1, '#ffffff')
        px.rect(ctx, cx, base - 106, 1, 1, blink ? '#fff6c0' : '#ffcc66')
        break
      }
      case 'tokyotower':
        for (let y = base - 96; y < base; y += 2) {
          const tt = (base - y) / 96
          const hw = Math.round(22 * Math.pow(1 - tt, 2.3) + 1)
          px.rect(ctx, cx - hw, y, 1, 1, '#ff9a3c')
          px.rect(ctx, cx + hw, y, 1, 1, '#ff9a3c')
        }
        aircraft(base - 104)
        break
      case 'bigben':
        px.disc(ctx, cx, base - 73, 5, '#fff3c0')
        px.rect(ctx, cx, base - 77, 1, 4, '#3a2a1a')
        px.rect(ctx, cx, base - 73, 3, 1, '#3a2a1a')
        break
      case 'empire':
        px.rect(ctx, cx - 5, base - 102, 10, 6, '#f4f4f4')
        px.rect(ctx, cx - 3, base - 108, 6, 6, '#c8102e')
        px.rect(ctx, cx - 1, base - 112, 3, 4, '#1f4e9a')
        aircraft(base - 120)
        break
      case 'burj':
        for (let i = 0; i < 40; i++) px.rect(ctx, cx - 9 + Math.floor(px.hash(i, 1, 3) * 18), base - Math.floor(px.hash(i, 2, 3) * 110), 1, 1, '#ffe7a8')
        aircraft(base - 124)
        break
      case 'cntower':
        px.rect(ctx, cx - 8, base - 86, 17, 1, '#9ad0ff')
        aircraft(base - 122)
        break
      case 'fernsehturm':
        px.rect(ctx, cx - 7, base - 89, 15, 1, '#ffe7a8')
        aircraft(base - 122)
        break
      case 'spaceneedle':
        px.rect(ctx, cx - 12, base - 70, 25, 1, '#ffe7a8')
        aircraft(base - 92)
        break
      case 'cristo':
        px.rect(ctx, cx - 1, base - 94, 3, 24, '#ffffff')
        px.rect(ctx, cx - 7, base - 88, 15, 2, '#ffffff')
        break
      case 'chisinau':
        // Floodlit cathedral and arch.
        px.rect(ctx, cx + 5, base - 26, 34, 26, px.css('#ffe2a8', (0.22 * dark).toFixed(2)))
        px.rect(ctx, cx - 17, base - 36, 22, 36, px.css('#ffe2a8', (0.22 * dark).toFixed(2)))
        px.rect(ctx, cx + 44, base - 68, 12, 68, px.css('#ffe2a8', (0.18 * dark).toFixed(2)))
        break
      case 'goldengate':
        for (const tx of [cx - 22, cx + 52]) px.rect(ctx, tx - 1, base - 80, 2, 1, blink ? '#ff2a2a' : '#7a1a1a')
        break
    }
  }

  // ------------------------------------------------------------- skyline icons

  const SKYLINE = {
    pieterskerk(ctx, x, b, c) {
      R(ctx, x, b - 40, 52, 40, c)
      for (let i = 0; i < 14; i++) R(ctx, x + i, b - 40 - i, 52 - i * 2, 1, c)
      R(ctx, x + 24, b - 64, 4, 12, c)
      px.line(ctx, x + 26, b - 72, x + 26, b - 64, c)
    },
    stadhuis(ctx, x, b, c) {
      R(ctx, x, b - 50, 6, 50, c)
      R(ctx, x + 1, b - 60, 4, 10, c)
      px.line(ctx, x + 3, b - 72, x + 3, b - 60, c)
    },
    hooglandse(ctx, x, b, c) {
      R(ctx, x, b - 60, 11, 60, c)
      R(ctx, x - 1, b - 62, 13, 3, c)
      R(ctx, x + 2, b - 68, 7, 6, c)
      px.line(ctx, x + 5, b - 76, x + 5, b - 68, c)
    },
    rijksmuseum(ctx, x, b, c) {
      R(ctx, x, b - 30, 60, 30, c)
      for (const tx of [x + 18, x + 36]) {
        R(ctx, tx, b - 46, 6, 16, c)
        for (let i = 0; i < 5; i++) R(ctx, tx + Math.floor(i / 2), b - 47 - i, 6 - Math.floor(i / 2) * 2, 1, c)
      }
    },
    zuiderkerk(ctx, x, b, c) {
      R(ctx, x, b - 54, 8, 54, c)
      R(ctx, x + 1, b - 64, 6, 10, c)
      px.line(ctx, x + 4, b - 78, x + 4, b - 64, c)
    },
    sacrecoeur(ctx, x, b, c) {
      for (let i = 0; i < 70; i++) R(ctx, x - 10 + i, b - 22 + Math.round(Math.abs(i - 35) * 0.25), 1, 30, c)
      R(ctx, x + 10, b - 40, 30, 18, c)
      px.disc(ctx, x + 25, b - 44, 8, c)
      R(ctx, x + 24, b - 56, 2, 5, c)
      px.disc(ctx, x + 13, b - 42, 4, c)
      px.disc(ctx, x + 37, b - 42, 4, c)
    },
    notredame(ctx, x, b, c) {
      R(ctx, x, b - 44, 10, 44, c)
      R(ctx, x + 14, b - 44, 10, 44, c)
      R(ctx, x + 10, b - 34, 4, 34, c)
      R(ctx, x + 24, b - 28, 40, 28, c)
      for (let i = 0; i < 10; i++) R(ctx, x + 24 + i, b - 28 - i, 40 - i * 2, 1, c)
      px.line(ctx, x + 44, b - 60, x + 44, b - 38, c)
    },
    shard(ctx, x, b, c) {
      for (let i = 0; i < 90; i++) R(ctx, x + Math.floor(i * 0.11), b - i, Math.max(1, 20 - Math.floor(i * 0.22)), 1, c)
    },
    stpauls(ctx, x, b, c) {
      R(ctx, x, b - 30, 50, 30, c)
      R(ctx, x + 2, b - 44, 7, 14, c)
      R(ctx, x + 41, b - 44, 7, 14, c)
      R(ctx, x + 17, b - 40, 16, 10, c)
      px.disc(ctx, x + 25, b - 44, 9, c)
      R(ctx, x + 24, b - 60, 3, 8, c)
    },
    londoneye(ctx, x, b, c) {
      const cx = x + 22
      const cy = b - 26
      for (let a = 0; a < Math.PI * 2; a += 0.06) R(ctx, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 1, 1, c)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) px.line(ctx, cx, cy, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, c)
      px.line(ctx, cx, cy, cx - 8, b, c)
      px.line(ctx, cx, cy, cx + 8, b, c)
    },
    chrysler(ctx, x, b, c) {
      R(ctx, x, b - 70, 14, 70, c)
      for (let i = 0; i < 6; i++) R(ctx, x + 1 + i, b - 70 - i * 3, 12 - i * 2, 3, c)
      px.line(ctx, x + 7, b - 100, x + 7, b - 88, c)
    },
    onewtc(ctx, x, b, c) {
      for (let i = 0; i < 100; i++) R(ctx, x + Math.floor(i * 0.06), b - i, Math.max(2, 14 - Math.floor(i * 0.12)), 1, c)
      px.line(ctx, x + 7, b - 120, x + 7, b - 100, c)
    },
    skytree(ctx, x, b, c) {
      for (let i = 0; i < 110; i++) R(ctx, x + Math.floor(i * 0.05), b - i, Math.max(2, 12 - Math.floor(i * 0.1)), 1, c)
      R(ctx, x - 3, b - 62, 18, 4, c)
      R(ctx, x, b - 82, 12, 3, c)
      px.line(ctx, x + 6, b - 124, x + 6, b - 110, c)
    },
    stpeters(ctx, x, b, c) {
      R(ctx, x, b - 26, 60, 26, c)
      R(ctx, x + 20, b - 40, 20, 14, c)
      px.disc(ctx, x + 30, b - 42, 12, c)
      R(ctx, x + 28, b - 62, 5, 8, c)
      R(ctx, x + 30, b - 66, 1, 4, c)
    },
    brandenburg(ctx, x, b, c) {
      R(ctx, x, b - 26, 44, 5, c)
      for (let i = 0; i < 6; i++) R(ctx, x + 2 + i * 8, b - 21, 3, 21, c)
      R(ctx, x + 18, b - 32, 8, 6, c)
    },
    agbar(ctx, x, b, c) {
      for (let i = 0; i < 70; i++) {
        const w = i > 50 ? Math.round(9 * Math.sqrt(1 - ((i - 50) / 20) ** 2)) : 9
        R(ctx, x + 9 - w, b - i, w * 2, 1, c)
      }
    },
    harbourbridge(ctx, x, b, c) {
      for (let i = 0; i <= 80; i++) {
        const t = i / 80
        R(ctx, x + i, b - 18 - Math.round(36 * 4 * t * (1 - t)), 1, 2, c)
        if (i % 4 === 0) R(ctx, x + i, b - 18 - Math.round(36 * 4 * t * (1 - t)), 1, Math.round(36 * 4 * t * (1 - t)), c)
      }
      R(ctx, x - 6, b - 18, 92, 2, c)
      R(ctx, x - 6, b - 34, 8, 34, c)
      R(ctx, x + 78, b - 34, 8, 34, c)
    },
    burjalarab(ctx, x, b, c) {
      for (let i = 0; i < 64; i++) R(ctx, x, b - i, Math.max(1, Math.round(22 * Math.sin((1 - i / 64) * Math.PI * 0.5))), 1, c)
      R(ctx, x, b - 74, 2, 74, c)
    },
    transamerica(ctx, x, b, c) {
      for (let i = 0; i < 80; i++) R(ctx, x + Math.floor(i * 0.08), b - i, Math.max(1, 14 - Math.floor(i * 0.17)), 1, c)
      px.line(ctx, x + 7, b - 92, x + 7, b - 80, c)
    },
    galata(ctx, x, b, c) {
      R(ctx, x, b - 50, 12, 50, c)
      R(ctx, x - 1, b - 52, 14, 3, c)
      for (let i = 0; i < 12; i++) R(ctx, x + Math.floor(i / 2), b - 52 - i, 12 - Math.floor(i / 2) * 2, 1, c)
    },
    sugarloaf(ctx, x, b, c) {
      for (let i = 0; i < 46; i++) {
        const half = Math.round(16 * Math.sqrt(Math.max(0, 1 - (i / 46) ** 1.6)))
        R(ctx, x + 18 - half, b - i, half * 2, 1, c)
      }
      px.line(ctx, x + 18, b - 46, x - 30, b - 20, c)
    },
  }

  Object.assign(SKYLINE, EASTERN_SKYLINE)

  function drawHero(ctx, hero, cx, base) {
    if (HEROES[hero]) HEROES[hero](ctx, cx, base)
  }

  function drawSkylineIcon(ctx, id, x, base, color) {
    if (SKYLINE[id]) SKYLINE[id](ctx, x, base, color)
  }

  return { HEROES, SKYLINE, drawHero, heroLights, drawSkylineIcon }
})
