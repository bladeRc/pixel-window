// The wallpaper: your city + real time + real weather → the scene, at a gentle 12 fps.
//
// URL options (handy for testing and recording):
//   ?city=Paris              any city by name (otherwise: your location from your IP)
//   ?lat=..&lon=..&name=..&country=NL   an exact spot
//   ?time=2026-10-22T19:30   pretend it's that local time (in the city's time zone)
//   ?speed=600               time-lapse (600× faster)
//   ?weather=rain            clear | clouds | overcast | fog | drizzle | rain | heavyrain | storm | snow | blizzard
//   ?wind=40  ?frozen  ?season=winter  ?event=december  ?fps=20  ?debug
;(function () {
  const PW = window.PW
  const { px, scene: S, palette: P, effects: FX, actors: A } = PW
  const H = S.H
  const q = new URLSearchParams(location.search)
  const num = (v, d) => (v === null || v === '' || isNaN(Number(v)) ? d : Number(v))

  const config = {
    city: q.get('city') || '',
    fps: num(q.get('fps'), 12),
    debug: q.has('debug'),
  }
  const forced = {
    timeText: q.get('time'),
    speed: num(q.get('speed'), 1),
    weather: q.get('weather'),
    wind: q.has('wind') ? num(q.get('wind'), 12) : null,
    frozen: q.has('frozen'),
    season: q.get('season'),
    event: q.get('event'),
  }

  const store = {
    get(key) {
      try {
        return JSON.parse(localStorage.getItem('pixel-window.' + key))
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('pixel-window.' + key, JSON.stringify(value))
      } catch {}
    },
  }

  // ------------------------------------------------------------ where

  const fromUrl = q.has('lat') && q.has('lon') ? { name: q.get('name') || 'Here', country: q.get('country') || '', lat: num(q.get('lat'), 52.16), lon: num(q.get('lon'), 4.5), tz: q.get('tz') || null, source: 'url' } : null
  let place = PW.cities.describe(fromUrl || (!config.city && store.get('place')) || PW.location.LEIDEN)

  async function locate() {
    if (fromUrl) return
    try {
      const found = await PW.location.resolve({ city: config.city })
      const same = Math.abs(found.lat - place.lat) < 0.01 && Math.abs(found.lon - place.lon) < 0.01
      store.set('place', found)
      if (!same) usePlace(found)
    } catch {
      // Offline or nothing found: stay where we are.
    }
  }

  function usePlace(p) {
    place = PW.cities.describe(p)
    resetClock()
    resize()
    refreshWeather()
    loadSkyline()
    safeDraw(performance.now()) // repaint the new city straight away
  }

  // ------------------------------------------------------------ when

  let startedAt = Date.now()
  let forcedStart = null
  function resetClock() {
    startedAt = Date.now()
    forcedStart = forced.timeText ? PW.location.zonedTime(forced.timeText, place.tz) : null
  }
  resetClock()
  const now = () => (forcedStart === null && forced.speed === 1 ? Date.now() : (forcedStart ?? startedAt) + (Date.now() - startedAt) * forced.speed)

  function seasonOf(month) {
    if (forced.season) return forced.season
    if (place.tropical) return 'summer'
    const m = place.south ? (month + 6) % 12 : month
    return ['winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][m]
  }
  function eventOf(month, day) {
    if (forced.event) return forced.event
    if (place.country === 'NL' && month === 3 && day === 27) return 'kingsday'
    if (place.cityId === 'leiden' && month === 9 && day === 3) return 'ontzet'
    if (month === 11 && !['japan', 'desert'].includes(place.style)) return 'december'
    return null
  }

  // ------------------------------------------------------------ weather

  function applyOverrides(w) {
    if (forced.wind !== null) w.wind = forced.wind
    if (forced.frozen) w.frozen = true
    return w
  }
  let weather = applyOverrides((forced.weather && PW.weather.named(forced.weather)) || store.get('weather') || PW.weather.fromCode(2))
  async function refreshWeather() {
    if (forced.weather) return
    try {
      weather = applyOverrides(await PW.weather.fetchWeather(place.lat, place.lon))
      store.set('weather', weather)
    } catch {
      // Offline: keep the last weather we had.
    }
  }

  // ------------------------------------------------------------ skyline

  let skylineItems = []
  let silhouettes = []
  async function loadSkyline() {
    const key = 'skyline.' + place.lat.toFixed(2) + ',' + place.lon.toFixed(2)
    const cached = store.get(key)
    skylineItems = cached ? cached.items : []
    silhouettes = PW.skyline.project(skylineItems, W)
    staticKey = ''
    if (cached && Date.now() - cached.at < 30 * 86400000) return
    const { lat, lon } = place
    try {
      const items = await PW.skyline.fetchSkyline(lat, lon)
      store.set(key, { at: Date.now(), items })
      // Only use it if we haven't moved to another city meanwhile.
      if (place.lat !== lat || place.lon !== lon) return
      skylineItems = items
      silhouettes = PW.skyline.project(skylineItems, W)
      staticKey = ''
    } catch {
      // Wikidata busy or offline: try again in an hour.
      setTimeout(() => place.lat === lat && place.lon === lon && loadSkyline(), 3600 * 1000)
    }
  }

  // Lively Wallpaper calls this when a setting changes.
  window.livelyPropertyListener = function (name, val) {
    if (name === 'city') {
      config.city = String(val || '')
      locate()
    }
    if (name === 'fps') config.fps = num(val, config.fps)
    if (name === 'debug') config.debug = !!val
  }

  // ------------------------------------------------------------ canvases

  const canvas = document.getElementById('c')
  const ctx = canvas.getContext('2d')
  const layer = () => {
    const c = document.createElement('canvas')
    return { c, g: c.getContext('2d') }
  }
  const L = { sky: layer(), back: layer(), via: layer(), mill: layer(), houses: layer(), quay: layer(), land: layer(), water: layer() }

  let W = 0
  let town = null
  let actors = null
  let fx = null
  let staticKey = ''
  let look = null
  let millAngle = 0.4

  function resize() {
    W = px.clamp(Math.round((H * window.innerWidth) / Math.max(1, window.innerHeight)), 200, 560)
    canvas.width = W
    canvas.height = H
    for (const k in L) {
      L[k].c.width = W
      L[k].c.height = H
    }
    town = S.buildTown(W, place)
    actors = A.create(W)
    fx = FX.create(W)
    silhouettes = PW.skyline.project(skylineItems, W)
    staticKey = ''
    warmUp()
  }

  /** Runs the street for 20 seconds up front, so it never starts empty. */
  function warmUp() {
    const local = PW.location.localParts(now(), place.tz)
    const env = { t: 0, hour: local.hour, darkness: 0.5, weather, season: seasonOf(local.month), trees: town.trees, bikes: town.bikes }
    actors.nextBoat = Math.min(actors.nextBoat, 6)
    for (let i = 0; i < 80; i++) A.update(actors, 0.25, env)
  }

  /** Redraws everything that only changes by the minute: sky, town, palette. */
  function rebuild(time, sun) {
    const local = PW.location.localParts(time, place.tz)
    const snow = weather.precip === 'snow' || weather.frozen
    const opts = { season: seasonOf(local.month), event: eventOf(local.month, local.day), snow }
    const sky = P.sky(sun.elevation, weather)
    FX.paintSky(L.sky.g, W, sky)
    for (const k of ['back', 'via', 'mill', 'houses', 'quay']) L[k].g.clearRect(0, 0, W, H)
    // Fog swallows the far skyline first.
    const haze = (c) => px.mix(c, sky.bottom, weather.fog * 0.85)
    S.drawSkyline(L.back.g, W, { far: haze(px.mix(sky.bottom, '#4f5a72', 0.4)), near: haze(px.mix(sky.bottom, '#4f5a72', 0.6)) }, town, silhouettes)
    S.drawViaduct(L.via.g, W)
    S.drawFeatureGround(L.mill.g, town, opts)
    S.drawHero(L.mill.g, town, opts)
    S.drawSign(L.mill.g, town)
    S.drawHouses(L.houses.g, town, opts)
    S.drawQuay(L.quay.g, town, opts)

    const times = PW.sun.times(time, place.lat, place.lon)
    const prev = PW.sun.times(time - 86400000, place.lat, place.lon)
    const next = PW.sun.times(time + 86400000, place.lat, place.lon)
    let moon = null
    const [from, to] = times.sunrise && time < times.sunrise ? [prev.sunset, times.sunrise] : [times.sunset, next.sunrise]
    if (from && to && time > from && time < to) {
      const f = (time - from) / (to - from)
      moon = { x: Math.round(W * (0.12 + 0.76 * f)), y: Math.round(70 - Math.sin(f * Math.PI) * 50) }
    }
    look = {
      ...opts,
      sky,
      tint: P.tint(sun.elevation, weather),
      dark: P.darkness(sun.elevation, weather),
      cloud: P.cloud(sun.elevation, weather),
      water: P.water(sky, sun.elevation),
      moon,
      phase: PW.sun.moonPhase(time),
      hour: local.hour,
    }
  }

  // ------------------------------------------------------------ loop

  const debugEl = document.getElementById('debug')
  let last = 0
  let lastFrame = performance.now()
  let errors = 0

  function frame(ms) {
    requestAnimationFrame(frame)
    if (ms - last < 1000 / config.fps - 2) return
    last = ms
    safeDraw(ms)
  }

  // A wallpaper must never freeze: a frame that fails is logged and skipped.
  function safeDraw(ms) {
    try {
      draw(ms)
    } catch (err) {
      if (errors++ < 5) console.error('pixel-window frame failed:', err && err.stack ? err.stack : err)
    }
  }

  function draw(ms) {
    const dt = Math.min(0.25, Math.max(0, (ms - lastFrame) / 1000))
    lastFrame = ms
    const t = ms / 1000
    const time = now()
    const sun = PW.sun.position(time, place.lat, place.lon)

    const key = [Math.floor(time / 60000), W, weather.code, weather.frozen, Math.round(weather.clouds * 10)].join('|')
    if (key !== staticKey) {
      staticKey = key
      rebuild(time, sun)
    }

    millAngle += dt * (weather.wind < 6 ? 0 : Math.min(1.6, 0.25 + weather.wind * 0.025))
    const env = { t, hour: look.hour, darkness: look.dark, weather, season: look.season, trees: town.trees, bikes: town.bikes }
    A.update(actors, dt, env)
    FX.updateClouds(fx, dt, weather)
    FX.updateWeather(fx, dt, weather, env)

    // Sky.
    ctx.drawImage(L.sky.c, 0, 0)
    FX.drawStars(ctx, W, t, px.clamp((-sun.elevation - 5) / 8, 0, 1) * (1 - weather.clouds * 0.9))
    FX.drawMoon(ctx, look.moon, look.phase, px.css(look.sky.top), weather.clouds)
    FX.drawSun(ctx, W, sun, weather.clouds)
    FX.drawClouds(ctx, fx, look.cloud, weather.clouds)

    // The town, then the light of the hour laid over it.
    const lights = []
    const g = L.land.g
    g.clearRect(0, 0, W, H)
    g.drawImage(L.back.c, 0, 0)
    g.drawImage(L.via.c, 0, 0)
    A.drawLand(g, actors, t, lights, look.dark, 'train')
    g.drawImage(L.mill.c, 0, 0)
    S.drawSails(g, town, millAngle)
    g.drawImage(L.houses.c, 0, 0)
    S.drawTrees(g, town, t, weather.wind, look)
    g.drawImage(L.quay.c, 0, 0)
    A.drawLand(g, actors, t, lights, look.dark, 'street')
    tint(g, look.tint)
    ctx.drawImage(L.land.c, 0, 0)

    // The water, what floats on it, then lights and weather on top.
    FX.drawWater(ctx, fx, L.land.c, look.water, t, weather)
    const wg = L.water.g
    wg.clearRect(0, 0, W, H)
    A.drawWater(wg, actors, t, lights, look.dark, weather.frozen)
    tint(wg, look.tint)
    ctx.drawImage(L.water.c, 0, 0)
    PW.skyline.lights(ctx, silhouettes, t, look.dark)
    PW.landmarks.heroLights(ctx, town.hero, town.heroX, S.GROUND, t, look.dark, time)
    if (look.dark > 0.4) S.drawSign(ctx, town) // station signs are lit at night
    FX.drawLights(ctx, town, lights, look.dark, look.hour, t, look.event)
    FX.drawWeather(ctx, fx, weather, t, look.sky)

    if (config.debug) {
      const cost = performance.now() - ms
      const hh = Math.floor(look.hour)
      const mm = String(Math.floor((look.hour % 1) * 60)).padStart(2, '0')
      debugEl.style.display = 'block'
      debugEl.textContent = `${place.name} (${place.country || '?'}) · ${place.style} · ${place.hero} · ${silhouettes.length} skyline · via ${place.source}\n${hh}:${mm} local  sun ${sun.elevation.toFixed(1)}°  ${weather.label}  wind ${Math.round(weather.wind)} km/h  ${Math.round(weather.temp)}°C\n${look.season}${look.event ? ' · ' + look.event : ''}${weather.frozen ? ' · frozen' : ''}  ${W}×${H}  frame ${cost.toFixed(1)} ms  bikes ${actors.bikes.length}`
    } else debugEl.style.display = 'none'
  }

  function tint(g, t) {
    if (t.alpha <= 0.01) return
    g.globalCompositeOperation = 'source-atop'
    g.fillStyle = px.css(t.color, t.alpha.toFixed(3))
    g.fillRect(0, 0, W, H)
    g.globalCompositeOperation = 'source-over'
  }

  window.addEventListener('resize', resize)
  resize()
  refreshWeather()
  setInterval(refreshWeather, 15 * 60 * 1000)
  loadSkyline()
  locate()
  setInterval(locate, 6 * 3600 * 1000)

  // Paint straight away, then animate.
  requestAnimationFrame(frame)
  safeDraw(performance.now())
})()
