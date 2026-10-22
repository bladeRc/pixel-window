// Colours that follow the sun and the weather.
(function (root, factory) {
  const mod = factory(root.PW || require('./pixels.js'))
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).palette = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px || PW

  // Sky gradient (top, horizon) by sun elevation in degrees.
  const SKY = [
    [-90, '#05081a', '#0f1430'],
    [-14, '#070b22', '#141a3c'],
    [-8, '#121a44', '#2c2b5e'],
    [-4, '#1f2a62', '#6a4a7a'],
    [-1, '#2d3f80', '#d0705a'],
    [2, '#3a5d9e', '#f39a5c'],
    [7, '#4a7cc4', '#f4c48e'],
    [16, '#4c8ad4', '#b7dbf2'],
    [90, '#3b7fd2', '#a4d3f2'],
  ]

  // Light that falls on the town: a colour laid over everything, and how strongly.
  const TINT = [
    [-90, '#070c2a', 0.66],
    [-8, '#0b1235', 0.62],
    [-3, '#2a1f4e', 0.45],
    [0, '#8a3d4a', 0.3],
    [3, '#ff7a3d', 0.2],
    [8, '#ffb36b', 0.09],
    [14, '#ffffff', 0],
    [90, '#ffffff', 0],
  ]

  function stops(table, elev) {
    for (let i = 0; i < table.length - 1; i++) {
      const a = table[i]
      const b = table[i + 1]
      if (elev <= b[0]) return { a, b, t: (elev - a[0]) / (b[0] - a[0]) }
    }
    const last = table[table.length - 1]
    return { a: last, b: last, t: 0 }
  }

  /** How dull the weather makes things: 0 bright, up to ~0.85 grey. */
  function gloom(w) {
    return px.clamp(w.clouds * 0.6 + (w.precip !== 'none' ? 0.15 + w.intensity * 0.1 : 0) + w.fog * 0.45, 0, 0.85)
  }

  function sky(elev, w) {
    const { a, b, t } = stops(SKY, elev)
    let top = px.mix(a[1], b[1], t)
    let bottom = px.mix(a[2], b[2], t)
    const day = px.clamp((elev + 6) / 12, 0, 1)
    const grey = px.mix('#141820', '#8f99a4', day)
    const greyLow = px.mix('#1b1f29', '#b4bcc4', day)
    const g = gloom(w)
    top = px.mix(top, grey, g)
    bottom = px.mix(bottom, greyLow, g * 0.9)
    return { top, bottom }
  }

  function tint(elev, w) {
    const { a, b, t } = stops(TINT, elev)
    const color = px.mix(a[1], b[1], t)
    let alpha = a[2] + (b[2] - a[2]) * t
    const g = gloom(w)
    if (elev > -3) alpha = Math.max(alpha, g * 0.22)
    return { color: elev > 8 && g > 0.3 ? px.mix(color, '#5d6672', g) : color, alpha }
  }

  /** 0 in daylight, 1 at night: how many windows and lamps are lit. */
  function darkness(elev, w) {
    return px.clamp((3 - elev) / 9 + gloom(w) * 0.25, 0, 1)
  }

  function cloud(elev, w) {
    const day = px.clamp((elev + 4) / 10, 0, 1)
    const sunset = px.clamp(1 - Math.abs(elev - 1) / 6, 0, 1)
    let light = px.mix('#2b3150', '#ffffff', day)
    light = px.mix(light, '#ffb08a', sunset * 0.6)
    let shade = px.mix('#1a1e34', '#c9d2dc', day)
    shade = px.mix(shade, '#b46a78', sunset * 0.5)
    const g = gloom(w)
    return { light: px.mix(light, px.mix('#22262f', '#9aa3ad', day), g * 0.8), shade: px.mix(shade, px.mix('#171a22', '#7c8590', day), g * 0.8) }
  }

  function water(skyColors, elev) {
    const day = px.clamp((elev + 6) / 14, 0, 1)
    return {
      top: px.mix(px.mix(skyColors.bottom, '#20414f', 0.55), '#0a1220', 1 - day),
      deep: px.mix(px.mix(skyColors.top, '#0f2733', 0.7), '#050a14', 1 - day),
    }
  }

  return { sky, tint, darkness, cloud, water, gloom }
})
