// Where the sun is, when it rises and sets, and what the moon looks like.
// NOAA's solar position formulas; accurate to about a minute, no library needed.
// Loads as a browser script (window.PW.sun) or a Node module (for tests).
(function (root, factory) {
  const mod = factory()
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).sun = mod
})(typeof self !== 'undefined' ? self : this, function () {
  const RAD = Math.PI / 180
  const DEG = 180 / Math.PI
  const DAY = 86400000

  function solar(ms) {
    const T = (ms / DAY + 2440587.5 - 2451545) / 36525
    const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    const C =
      Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
      Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
      Math.sin(3 * M * RAD) * 0.000289
    const omega = 125.04 - 1934.136 * T
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD)
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD)
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG
    const y = Math.tan((eps / 2) * RAD) ** 2
    const eqTime =
      4 *
      DEG *
      (y * Math.sin(2 * L0 * RAD) -
        2 * e * Math.sin(M * RAD) +
        4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
        0.5 * y * y * Math.sin(4 * L0 * RAD) -
        1.25 * e * e * Math.sin(2 * M * RAD))
    return { decl, eqTime }
  }

  /** The sun's elevation above the horizon and azimuth (0 = north, 90 = east), in degrees. */
  function position(ms, lat, lon) {
    const { decl, eqTime } = solar(ms)
    const minutes = (((ms % DAY) + DAY) % DAY) / 60000
    const trueSolar = (((minutes + eqTime + 4 * lon) % 1440) + 1440) % 1440
    const ha = trueSolar / 4 - 180
    const cosZen =
      Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD)
    const zen = Math.acos(Math.max(-1, Math.min(1, cosZen))) * DEG
    const cosAz = (Math.sin(lat * RAD) * Math.cos(zen * RAD) - Math.sin(decl * RAD)) / (Math.cos(lat * RAD) * Math.sin(zen * RAD))
    let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * DEG
    az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360
    return { elevation: 90 - zen, azimuth: az }
  }

  /** Sunrise, solar noon and sunset (ms) for the UTC day containing `ms`; null in polar day/night. */
  function times(ms, lat, lon) {
    const midnight = Math.floor(ms / DAY) * DAY
    const { decl, eqTime } = solar(midnight + DAY / 2)
    const noonMin = 720 - 4 * lon - eqTime
    const cosHa =
      Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD)
    const noon = midnight + noonMin * 60000
    if (cosHa > 1 || cosHa < -1) return { sunrise: null, noon, sunset: null }
    const ha = Math.acos(cosHa) * DEG
    return { sunrise: noon - ha * 4 * 60000, noon, sunset: noon + ha * 4 * 60000 }
  }

  const SYNODIC = 29.530588853
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

  /** 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
  function moonPhase(ms) {
    const days = (ms - KNOWN_NEW_MOON) / DAY
    return (((days / SYNODIC) % 1) + 1) % 1
  }

  return { position, times, moonPhase }
})
