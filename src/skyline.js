// The real skyline of any city: tall buildings, towers and churches with their
// real heights from Wikidata, projected onto the horizon as seen from a few
// kilometres north of the centre (the view faces south, so east is on the left).
(function (root, factory) {
  const mod = factory(root.PW || { px: require('./pixels.js') })
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).skyline = mod
})(typeof self !== 'undefined' ? self : this, function (PW) {
  const px = PW.px
  const BASE = 118 // where silhouettes stand: just behind the viaduct and the houses
  const VIEWER = 7000 // metres north of the centre
  const MIN_DIST = 2500

  function query(lat, lon, radiusKm) {
    return `SELECT ?item ?itemLabel ?coord ?height (SAMPLE(?typeLabel) AS ?type) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?coord . bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${radiusKm || 6}" . }
  ?item p:P2048/psn:P2048/wikibase:quantityAmount ?height .
  FILTER(?height >= 30 && ?height < 1000)
  FILTER NOT EXISTS { ?item wdt:P576 ?demolished }
  OPTIONAL { ?item wdt:P31 ?t . ?t rdfs:label ?typeLabel . FILTER(LANG(?typeLabel) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl,de,fr,es,it,ja". }
} GROUP BY ?item ?itemLabel ?coord ?height LIMIT 400`
  }

  function url(lat, lon) {
    return 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query(lat, lon))
  }

  const SKIP = /proposed|planned|unbuilt|demolished|destroyed|under construction|bridge|dam|crane|ship|wind turbine|statue|sculpture/i
  // Landmarks the hand-drawn heroes already show.
  // Landmarks the hand-drawn heroes and skyline icons already show.
  const HEROES = /eiffel|tokyo tower|elizabeth tower|empire state|fernsehturm|berlin tv|sagrada|sydney opera|burj khalifa|golden gate|space needle|cn tower|christ the redeemer|colosseum|westerkerk|de valk|the shard|st\.? paul|london eye|chrysler|one world trade|skytree|st\.? peter|notre-dame|sacr[eé]|brandenburg|gl[oò]ries|agbar|harbour bridge|burj al arab|transamerica|galata|sugarloaf|p[aã]o de a[cç]|rijksmuseum|zuiderkerk|pieterskerk|hooglandse|nativity cathedral|arcul de triumf|triumphal arch, chi/i

  function kindOf(type) {
    const t = (type || '').toLowerCase()
    if (/church|cathedral|basilica|chapel|minster|abbey|mosque|temple|bell tower|belfry/.test(t)) return 'church'
    if (/television|observation|radio|transmitter|communication|mast|chimney|lighthouse|water tower|lookout/.test(t)) return 'needle'
    return 'building'
  }

  /** Wikidata rows → skyline items in metres from the centre, tallest first, deduped. */
  function parse(data, lat0, lon0) {
    const byItem = new Map()
    for (const b of (data && data.results && data.results.bindings) || []) {
      const type = b.type ? b.type.value : ''
      const name = b.itemLabel ? b.itemLabel.value : ''
      if (SKIP.test(type) || SKIP.test(name) || HEROES.test(name)) continue
      const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value)
      if (!m) continue
      const lon = Number(m[1])
      const lat = Number(m[2])
      const h = Number(b.height.value)
      const prev = byItem.get(b.item.value)
      if (prev && prev.h >= h) continue
      byItem.set(b.item.value, {
        name,
        h,
        kind: kindOf(type),
        dx: (lon - lon0) * 111320 * Math.cos((lat0 * Math.PI) / 180),
        dy: (lat - lat0) * 110540,
      })
    }
    return [...byItem.values()].sort((a, b) => b.h - a.h).slice(0, 60)
  }

  async function fetchSkyline(lat, lon, fetchFn) {
    const res = await (fetchFn || fetch)(url(lat, lon), { headers: { Accept: 'application/sparql-results+json' } })
    if (!res.ok) throw new Error('wikidata ' + res.status)
    return parse(await res.json(), lat, lon)
  }

  /** Items → screen silhouettes for a canvas `W` wide, far ones first. */
  function project(items, W) {
    const out = []
    for (const it of items || []) {
      const dist = Math.max(MIN_DIST, VIEWER - it.dy)
      const x = Math.round(W / 2 - (it.dx / dist) * W * 0.95)
      const hpx = Math.min(108, Math.round((it.h * 1700) / dist))
      if (hpx < 6) continue
      const w = it.kind === 'needle' ? 2 : it.kind === 'church' ? px.clamp(Math.round(hpx * 0.35), 4, 16) : px.clamp(Math.round(hpx * 0.2), 3, 14)
      if (x + w < 0 || x - w > W) continue
      out.push({ ...it, x, hpx, w, dist })
    }
    return out.sort((a, b) => b.dist - a.dist)
  }

  function draw(ctx, sil, near, far) {
    for (const s of sil) {
      const c = px.mix(near, far, px.clamp((s.dist - MIN_DIST) / 7000, 0, 1))
      const top = BASE - s.hpx
      const left = s.x - Math.floor(s.w / 2)
      if (s.kind === 'needle') {
        px.rect(ctx, s.x, top, 2, s.hpx, c)
        px.rect(ctx, s.x - 2, top + Math.round(s.hpx * 0.2), 6, 3, c)
      } else if (s.kind === 'church') {
        const body = Math.round(s.hpx * 0.45)
        px.rect(ctx, left, BASE - body, s.w, body, c)
        const tw = Math.max(2, Math.round(s.w * 0.35))
        px.rect(ctx, s.x - Math.floor(tw / 2), BASE - Math.round(s.hpx * 0.75), tw, Math.round(s.hpx * 0.75) - body + 1, c)
        px.line(ctx, s.x, top, s.x, BASE - Math.round(s.hpx * 0.75), c)
      } else {
        px.rect(ctx, left, top, s.w, s.hpx, c)
        if (s.h > 150 && s.w >= 5) px.rect(ctx, s.x, top - 3, 1, 3, c)
      }
    }
  }

  /** Lit windows at night and the red aircraft-warning lights on the tallest. */
  function lights(ctx, sil, t, dark) {
    if (dark < 0.35) return
    for (const s of sil) {
      if (s.kind === 'building' && s.hpx > 10) {
        const n = Math.round((s.hpx * s.w) / 14)
        for (let i = 0; i < n; i++) {
          const wx = s.x - Math.floor(s.w / 2) + 1 + Math.floor(px.hash(i, s.h, 1) * Math.max(1, s.w - 2))
          const wy = BASE - s.hpx + 2 + Math.floor(px.hash(i, s.h, 2) * (s.hpx - 4))
          px.rect(ctx, wx, wy, 1, 1, px.css(px.hash(i, s.h, 3) < 0.8 ? '#ffd98a' : '#cfe2ff', (0.55 * dark).toFixed(2)))
        }
      }
      if (s.h >= 100 && Math.floor(t * 1.1 + s.x) % 2 === 0) px.rect(ctx, s.x, BASE - s.hpx - (s.kind === 'building' && s.h > 150 ? 3 : 0), 1, 1, '#ff2a2a')
    }
  }

  return { BASE, query, url, parse, kindOf, fetchSkyline, project, draw, lights }
})
