// Live weather from Open-Meteo (free, no API key) and what it means for the scene.
(function (root, factory) {
  const mod = factory()
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).weather = mod
})(typeof self !== 'undefined' ? self : this, function () {
  // WMO weather codes, as Open-Meteo reports them.
  const CODES = {
    0: { label: 'clear', clouds: 0 },
    1: { label: 'mostly clear', clouds: 0.2 },
    2: { label: 'partly cloudy', clouds: 0.5 },
    3: { label: 'overcast', clouds: 0.95 },
    45: { label: 'fog', clouds: 0.8, fog: 0.7 },
    48: { label: 'freezing fog', clouds: 0.8, fog: 0.9 },
    51: { label: 'light drizzle', clouds: 0.9, precip: 'rain', intensity: 0.15 },
    53: { label: 'drizzle', clouds: 0.9, precip: 'rain', intensity: 0.25 },
    55: { label: 'heavy drizzle', clouds: 0.95, precip: 'rain', intensity: 0.35 },
    56: { label: 'freezing drizzle', clouds: 0.9, precip: 'rain', intensity: 0.2 },
    57: { label: 'freezing drizzle', clouds: 0.95, precip: 'rain', intensity: 0.35 },
    61: { label: 'light rain', clouds: 0.95, precip: 'rain', intensity: 0.4 },
    63: { label: 'rain', clouds: 1, precip: 'rain', intensity: 0.65 },
    65: { label: 'heavy rain', clouds: 1, precip: 'rain', intensity: 1 },
    66: { label: 'freezing rain', clouds: 1, precip: 'rain', intensity: 0.5 },
    67: { label: 'freezing rain', clouds: 1, precip: 'rain', intensity: 0.8 },
    71: { label: 'light snow', clouds: 0.95, precip: 'snow', intensity: 0.35 },
    73: { label: 'snow', clouds: 1, precip: 'snow', intensity: 0.65 },
    75: { label: 'heavy snow', clouds: 1, precip: 'snow', intensity: 1 },
    77: { label: 'snow grains', clouds: 0.95, precip: 'snow', intensity: 0.25 },
    80: { label: 'rain showers', clouds: 0.8, precip: 'rain', intensity: 0.5 },
    81: { label: 'rain showers', clouds: 0.9, precip: 'rain', intensity: 0.75 },
    82: { label: 'violent showers', clouds: 1, precip: 'rain', intensity: 1 },
    85: { label: 'snow showers', clouds: 0.9, precip: 'snow', intensity: 0.6 },
    86: { label: 'heavy snow showers', clouds: 1, precip: 'snow', intensity: 1 },
    95: { label: 'thunderstorm', clouds: 1, precip: 'rain', intensity: 0.9, storm: true },
    96: { label: 'thunderstorm with hail', clouds: 1, precip: 'rain', intensity: 1, storm: true },
    99: { label: 'thunderstorm with hail', clouds: 1, precip: 'rain', intensity: 1, storm: true },
  }

  /** Debug names for ?weather=... */
  const NAMED = { clear: 0, sunny: 0, clouds: 2, cloudy: 2, overcast: 3, fog: 45, drizzle: 53, rain: 63, heavyrain: 65, storm: 95, snow: 73, blizzard: 75 }

  /** The scene's view of the weather: how cloudy, what falls, how hard, fog, storm, wind, temperature. */
  function fromCode(code, extra) {
    const x = extra || {}
    const c = CODES[code] || CODES[2]
    const cover = typeof x.cloudCover === 'number' ? x.cloudCover / 100 : 0
    return {
      code: CODES[code] ? code : 2,
      label: c.label,
      clouds: Math.max(c.clouds, c.precip ? 0 : Math.min(cover, 1)),
      precip: c.precip || 'none',
      intensity: c.intensity || 0,
      fog: c.fog || 0,
      storm: !!c.storm,
      wind: typeof x.windKmh === 'number' ? x.windKmh : 12,
      temp: typeof x.tempC === 'number' ? x.tempC : 10,
      frozen: !!x.frozen,
    }
  }

  function named(name, extra) {
    const code = NAMED[String(name).toLowerCase()]
    return code === undefined ? null : fromCode(code, extra)
  }

  /** Canals freeze after a real cold snap: the last three nights at -3 °C or colder and freezing now. */
  function isFrozen(dailyMins, tempNow) {
    const last = (dailyMins || []).filter((t) => typeof t === 'number').slice(-3)
    return last.length === 3 && last.every((t) => t <= -3) && tempNow <= 0
  }

  function apiUrl(lat, lon) {
    return (
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m' +
      '&daily=temperature_2m_min&past_days=3&forecast_days=1&timezone=auto'
    )
  }

  /** Turns an Open-Meteo response into the scene's weather. */
  function fromResponse(data) {
    const cur = data.current
    const mins = (data.daily && data.daily.temperature_2m_min) || []
    return fromCode(cur.weather_code, {
      cloudCover: cur.cloud_cover,
      windKmh: cur.wind_speed_10m,
      tempC: cur.temperature_2m,
      frozen: isFrozen(mins.slice(0, -1), cur.temperature_2m),
    })
  }

  async function fetchWeather(lat, lon, fetchFn) {
    const res = await (fetchFn || fetch)(apiUrl(lat, lon))
    if (!res.ok) throw new Error('weather ' + res.status)
    return fromResponse(await res.json())
  }

  return { CODES, fromCode, named, isFrozen, apiUrl, fromResponse, fetchWeather }
})
