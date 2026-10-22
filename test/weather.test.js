const { test } = require('node:test')
const assert = require('node:assert/strict')
const weather = require('../src/weather.js')

test('every WMO code maps to a scene', () => {
  for (const code of Object.keys(weather.CODES)) {
    const w = weather.fromCode(Number(code))
    assert.ok(w.clouds >= 0 && w.clouds <= 1, `clouds for ${code}`)
    assert.ok(['none', 'rain', 'snow'].includes(w.precip), `precip for ${code}`)
  }
  assert.equal(weather.fromCode(12345).label, 'partly cloudy', 'unknown codes fall back')
})

test('rain, snow, fog and storms come through', () => {
  assert.equal(weather.fromCode(65).precip, 'rain')
  assert.equal(weather.fromCode(65).intensity, 1)
  assert.equal(weather.fromCode(73).precip, 'snow')
  assert.ok(weather.fromCode(45).fog > 0)
  assert.equal(weather.fromCode(95).storm, true)
})

test('cloud cover raises the clouds of a clear-ish code', () => {
  assert.equal(weather.fromCode(1, { cloudCover: 70 }).clouds, 0.7)
  assert.equal(weather.fromCode(3, { cloudCover: 10 }).clouds, 0.95)
})

test('canals freeze only after a real cold snap', () => {
  assert.equal(weather.isFrozen([-4, -5, -3.5], -1), true)
  assert.equal(weather.isFrozen([-4, -1, -5], -1), false)
  assert.equal(weather.isFrozen([-4, -5, -6], 2), false)
})

test('reads an Open-Meteo response', () => {
  const w = weather.fromResponse({
    current: { temperature_2m: 11.2, weather_code: 61, cloud_cover: 100, wind_speed_10m: 23 },
    daily: { temperature_2m_min: [7, 8, 6, 9] },
  })
  assert.equal(w.precip, 'rain')
  assert.equal(w.wind, 23)
  assert.equal(w.frozen, false)
  assert.match(weather.apiUrl(52.16, 4.5), /latitude=52.16&longitude=4.5/)
})

test('debug names work', () => {
  assert.equal(weather.named('snow').precip, 'snow')
  assert.equal(weather.named('nope'), null)
})
