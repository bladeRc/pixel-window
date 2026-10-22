const { test } = require('node:test')
const assert = require('node:assert/strict')
const skyline = require('../src/skyline.js')

const row = (name, h, lon, lat, type, id) => ({
  item: { value: 'http://www.wikidata.org/entity/' + (id || name) },
  itemLabel: { value: name },
  coord: { value: `Point(${lon} ${lat})` },
  height: { value: String(h) },
  ...(type ? { type: { value: type } } : {}),
})

const ROTTERDAM = { results: { bindings: [
  row('Euromast', 185, 4.4667, 51.9055, 'observation tower'),
  row('Maastoren', 165, 4.4890, 51.9100, 'skyscraper'),
  row('Codricotoren', 220, 4.49, 51.91, 'proposed tower'),
  row('Erasmusbrug', 139, 4.4825, 51.9093, 'bridge'),
  row('Laurenskerk', 64, 4.4842, 51.9214, 'church building'),
  row('Maastoren', 150, 4.4890, 51.9100, 'office building', 'Maastoren'),
] } }

test('parses, dedupes and drops proposed buildings and bridges', () => {
  const items = skyline.parse(ROTTERDAM, 51.9225, 4.4792)
  assert.deepEqual(items.map((i) => i.name), ['Euromast', 'Maastoren', 'Laurenskerk'])
  assert.equal(items[0].kind, 'needle')
  assert.equal(items[1].h, 165, 'keeps the highest height of duplicates')
  assert.equal(items[2].kind, 'church')
})

test('east of the centre ends up on the left, closer means taller', () => {
  const sil = skyline.project([
    { name: 'east', h: 150, kind: 'building', dx: 2000, dy: 0 },
    { name: 'west', h: 150, kind: 'building', dx: -2000, dy: 0 },
    { name: 'near', h: 150, kind: 'building', dx: 0, dy: 3000 },
  ], 320)
  const by = Object.fromEntries(sil.map((s) => [s.name, s]))
  assert.ok(by.east.x < 160 && by.west.x > 160)
  assert.ok(by.near.hpx > by.east.hpx)
  assert.equal(sil[sil.length - 1].name, 'near', 'drawn last, in front')
})

test('the hand-drawn heroes are not drawn twice', () => {
  const items = skyline.parse({ results: { bindings: [row('Eiffel Tower', 330, 2.2945, 48.8584, 'lattice tower'), row('Tour Montparnasse', 210, 2.3219, 48.8421, 'skyscraper')] } }, 48.8566, 2.3522)
  assert.deepEqual(items.map((i) => i.name), ['Tour Montparnasse'])
})
