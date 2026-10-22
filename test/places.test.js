const { test } = require('node:test')
const assert = require('node:assert/strict')
const cities = require('../src/cities.js')
const location = require('../src/location.js')
const font = require('../src/font.js')

test('famous cities are recognised by coordinates, not names', () => {
  assert.equal(cities.match(52.1643, 4.4986).id, 'leiden', 'IP location of Leiden')
  assert.equal(cities.match(48.8534, 2.3488).id, 'paris')
  assert.equal(cities.match(52.37, 4.9).id, 'amsterdam')
  assert.equal(cities.match(51.9225, 4.4792), null, 'Rotterdam has no hand-drawn pack')
})

test('every country gets a building style, unknown ones get modern', () => {
  assert.equal(cities.styleFor('nl'), 'dutch')
  assert.equal(cities.styleFor('JP'), 'japan')
  assert.equal(cities.styleFor('ES'), 'med')
  assert.equal(cities.styleFor('XX'), 'modern')
  assert.equal(cities.styleFor('MD'), 'eastern')
  assert.equal(cities.styleFor('RO'), 'eastern')
})

test('Chișinău gets its own pack, the rest of the region a domed church', () => {
  const chisinau = cities.describe({ name: 'Chișinău', country: 'MD', lat: 47.00556, lon: 28.8575 })
  assert.equal(chisinau.cityId, 'chisinau')
  assert.equal(chisinau.hero, 'chisinau')
  const iasi = cities.describe({ name: 'Iași', country: 'RO', lat: 47.1585, lon: 27.6014 })
  assert.equal(iasi.style, 'eastern')
  assert.equal(iasi.hero, 'orthodox')
})

test('describe picks hero, style and climate', () => {
  const rotterdam = cities.describe({ name: 'Rotterdam', country: 'NL', lat: 51.92, lon: 4.48 })
  assert.equal(rotterdam.style, 'dutch')
  assert.equal(rotterdam.hero, 'windmill')
  const sydney = cities.describe({ name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21 })
  assert.equal(sydney.hero, 'opera')
  assert.equal(sydney.south, true)
  assert.equal(cities.describe({ name: 'Lima', country: 'PE', lat: -12.05, lon: -77.04 }).tropical, true)
})

test('location parsing: geocoding and IP lookups', () => {
  const paris = location.fromGeocode({ results: [{ name: 'Paris', country_code: 'FR', latitude: 48.85, longitude: 2.35, timezone: 'Europe/Paris' }] })
  assert.deepEqual([paris.name, paris.country, paris.tz], ['Paris', 'FR', 'Europe/Paris'])
  assert.equal(location.fromGeocode({}), null)
  const ip = location.fromIp({ city: 'Leiden', country_code: 'NL', latitude: '52.1643', longitude: '4.4986', timezone: 'Europe/Amsterdam' })
  assert.equal(ip.lat, 52.1643)
  assert.equal(location.fromIp({}), null)
})

test('local time in another time zone', () => {
  const noonUtc = Date.parse('2026-10-22T12:00:00Z')
  assert.equal(location.localParts(noonUtc, 'Asia/Tokyo').hour, 21)
  assert.equal(location.localParts(noonUtc, 'America/New_York').hour, 8)
  assert.equal(location.zonedTime('2026-10-22T21:00', 'Asia/Tokyo'), noonUtc, '21:00 in Tokyo')
  assert.equal(location.zonedTime('2026-10-22T14:00', 'Europe/Amsterdam'), noonUtc, '14:00 in Leiden (CEST)')
})

test('the sign font knows every letter and drops accents', () => {
  for (const [ch, rows] of Object.entries(font.GLYPHS)) {
    assert.equal(rows.length, 5, ch)
    for (const r of rows) assert.equal(r.length, 3, ch)
  }
  assert.equal(font.normalize('São Paulo'), 'SAO PAULO')
  assert.equal(font.normalize('Zürich'), 'ZURICH')
  assert.equal(font.width('LEIDEN'), 23)
})
