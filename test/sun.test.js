const { test } = require('node:test')
const assert = require('node:assert/strict')
const sun = require('../src/sun.js')

const LEIDEN = [52.1601, 4.497]
const MIN = 60000

const near = (actual, expected, tolerance, what) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} not within ${tolerance} of ${expected}`)

test('noon elevation matches 90° − latitude ± the season', () => {
  for (const [date, decl] of [['2026-03-20', 0], ['2026-06-21', 23.44], ['2026-12-21', -23.44]]) {
    const { noon } = sun.times(Date.parse(date + 'T12:00:00Z'), ...LEIDEN)
    near(sun.position(noon, ...LEIDEN).elevation, 90 - LEIDEN[0] + decl, 0.6, `noon on ${date}`)
  }
})

test('Leiden midsummer: sunrise ≈ 05:19 and sunset ≈ 22:07 local (CEST, UTC+2)', () => {
  const { sunrise, sunset } = sun.times(Date.parse('2026-06-21T12:00:00Z'), ...LEIDEN)
  near(sunrise, Date.parse('2026-06-21T03:19:00Z'), 6 * MIN, 'sunrise')
  near(sunset, Date.parse('2026-06-21T20:07:00Z'), 6 * MIN, 'sunset')
})

test('the sun is in the south at noon, east in the morning, west in the evening', () => {
  const day = Date.parse('2026-10-22T12:00:00Z')
  const { sunrise, noon, sunset } = sun.times(day, ...LEIDEN)
  near(sun.position(noon, ...LEIDEN).azimuth, 180, 1, 'noon azimuth')
  assert.ok(sun.position(sunrise + 30 * MIN, ...LEIDEN).azimuth < 135)
  assert.ok(sun.position(sunset - 30 * MIN, ...LEIDEN).azimuth > 225)
  near(sun.position(sunrise, ...LEIDEN).elevation, -0.83, 0.5, 'elevation at sunrise')
})

test('moon phase: known full moon and new moon', () => {
  near(sun.moonPhase(Date.parse('2024-01-25T17:54:00Z')), 0.5, 0.02, 'full moon Jan 2024')
  const nm = sun.moonPhase(Date.parse('2024-04-08T18:21:00Z'))
  assert.ok(nm < 0.02 || nm > 0.98, `new moon Apr 2024 (eclipse day): ${nm}`)
})
