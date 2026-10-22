// Small drawing helpers: colours, seeded randomness, sprites from text grids.
(function (root, factory) {
  const mod = factory()
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).px = mod
})(typeof self !== 'undefined' ? self : this, function () {
  /** A seeded random generator (mulberry32), so the town looks the same every time. */
  function rng(seed) {
    let a = seed >>> 0
    return function () {
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  /** A stable pseudo-random number in [0, 1) for a few integers. */
  function hash(a, b, c) {
    let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b)
    h = Math.imul(h ^ ((b | 0) + 0x632be5ab), 0xc2b2ae35)
    h = Math.imul(h ^ ((c | 0) + 0x27d4eb2f), 0x165667b1)
    h ^= h >>> 15
    return (h >>> 0) / 4294967296
  }

  function hex(s) {
    const n = parseInt(s.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  function col(c) {
    return typeof c === 'string' ? hex(c) : c
  }

  function mix(a, b, t) {
    const x = col(a)
    const y = col(b)
    const k = Math.max(0, Math.min(1, t))
    return [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]
  }

  function css(c, alpha) {
    const [r, g, b] = col(c)
    const rgb = `${Math.round(r)},${Math.round(g)},${Math.round(b)}`
    return alpha === undefined ? `rgb(${rgb})` : `rgba(${rgb},${alpha})`
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = typeof color === 'string' ? color : css(color)
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }

  /** Draws a text-grid sprite; '.' is transparent, other characters look up `pal`. */
  function sprite(ctx, rows, x, y, pal, flip) {
    const w = rows[0].length
    for (let r = 0; r < rows.length; r++) {
      const row = flip ? [...rows[r]].reverse().join('') : rows[r]
      let c = 0
      while (c < w) {
        const ch = row[c]
        if (ch === '.' || ch === undefined) {
          c++
          continue
        }
        let end = c
        while (row[end + 1] === ch) end++
        const color = pal[ch]
        if (color) rect(ctx, x + c, y + r, end - c + 1, 1, color)
        c = end + 1
      }
    }
  }

  /** A one-pixel line (Bresenham). */
  function line(ctx, x0, y0, x1, y1, color) {
    ctx.fillStyle = typeof color === 'string' ? color : css(color)
    x0 = Math.round(x0)
    y0 = Math.round(y0)
    x1 = Math.round(x1)
    y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      ctx.fillRect(x0, y0, 1, 1)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  /** A filled pixel disc. */
  function disc(ctx, cx, cy, r, color) {
    ctx.fillStyle = typeof color === 'string' ? color : css(color)
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35)
      ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1)
    }
  }

  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x))
  }

  return { rng, hash, hex, mix, css, rect, sprite, line, disc, clamp }
})
