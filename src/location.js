// Where the wallpaper is: a city you typed, or the city your internet
// connection is in. Both services are free and need no account.
(function (root, factory) {
  const mod = factory()
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).location = mod
})(typeof self !== 'undefined' ? self : this, function () {
  const LEIDEN = { name: 'Leiden', country: 'NL', lat: 52.1601, lon: 4.497, tz: 'Europe/Amsterdam', source: 'default' }

  function geocodeUrl(name) {
    return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  }

  /** Open-Meteo geocoding → a place, or null when nothing matched. */
  function fromGeocode(data) {
    const r = data && data.results && data.results[0]
    if (!r) return null
    return { name: r.name, country: (r.country_code || '').toUpperCase(), lat: r.latitude, lon: r.longitude, tz: r.timezone || null, source: 'search' }
  }

  const IP_URL = 'https://get.geojs.io/v1/ip/geo.json'

  /** GeoJS (IP location) → a place, or null. */
  function fromIp(data) {
    const lat = Number(data && data.latitude)
    const lon = Number(data && data.longitude)
    if (!isFinite(lat) || !isFinite(lon)) return null
    return { name: data.city || data.region || data.country || 'Here', country: (data.country_code || '').toUpperCase(), lat, lon, tz: data.timezone || null, source: 'ip' }
  }

  async function json(url, fetchFn) {
    const res = await (fetchFn || fetch)(url)
    if (!res.ok) throw new Error(`${url} → ${res.status}`)
    return res.json()
  }

  /** Resolves `{ city }` by name, otherwise by IP. Throws when offline; callers keep what they had. */
  async function resolve(opts, fetchFn) {
    if (opts && opts.city && opts.city.trim()) {
      const place = fromGeocode(await json(geocodeUrl(opts.city.trim()), fetchFn))
      if (!place) throw new Error(`no place called "${opts.city}"`)
      return place
    }
    const place = fromIp(await json(IP_URL, fetchFn))
    if (!place) throw new Error('IP location gave no coordinates')
    return place
  }

  /** Local hour (with fraction), month, day and weekday of `ms` in a time zone; the PC's own when `tz` is null. */
  function localParts(ms, tz) {
    const d = new Date(ms)
    if (!tz) return { hour: d.getHours() + d.getMinutes() / 60, month: d.getMonth(), day: d.getDate() }
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', month: 'numeric', day: 'numeric', hourCycle: 'h23' })
          .formatToParts(d)
          .map((p) => [p.type, p.value]),
      )
      return { hour: Number(parts.hour) + Number(parts.minute) / 60, month: Number(parts.month) - 1, day: Number(parts.day) }
    } catch {
      return { hour: d.getHours() + d.getMinutes() / 60, month: d.getMonth(), day: d.getDate() }
    }
  }

  /** Minutes the zone is ahead of UTC at `ms`. */
  function offsetMinutes(ms, tz) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date(ms))
        .map((x) => [x.type, x.value]),
    )
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 60000) * 60000) / 60000
  }

  /** "2026-10-22T19:30" read as a wall-clock time in `tz` (or on this PC when there's none). */
  function zonedTime(text, tz) {
    if (!tz) return Date.parse(text)
    try {
      const asUtc = Date.parse(text + 'Z')
      const guess = asUtc - offsetMinutes(asUtc, tz) * 60000
      return asUtc - offsetMinutes(guess, tz) * 60000
    } catch {
      return Date.parse(text)
    }
  }

  return { LEIDEN, geocodeUrl, fromGeocode, IP_URL, fromIp, resolve, localParts, zonedTime }
})
