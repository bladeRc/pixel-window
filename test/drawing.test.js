// Draws everything once on a fake canvas: catches a module that fails to load
// or a drawing that throws, which the browser would only show as a blank screen.
const { test } = require('node:test')
const assert = require('node:assert/strict')

global.self = global
global.PW = {}
for (const m of ['pixels', 'sun', 'weather', 'palette', 'font', 'location', 'cities', 'styles', 'landmarks', 'skyline', 'scene', 'actors', 'effects']) {
  const mod = require(`../src/${m}.js`)
  global.PW[m === 'pixels' ? 'px' : m] = mod
}
const { cities, scene, styles, landmarks } = global.PW

function fakeCtx() {
  let calls = 0
  return {
    fillStyle: '',
    fillRect(x, y, w, h) {
      for (const v of [x, y, w, h]) assert.ok(Number.isFinite(v), `fillRect got ${[x, y, w, h]}`)
      calls++
    },
    get calls() {
      return calls
    },
  }
}

test('every hero and skyline icon draws', () => {
  for (const hero of Object.keys(landmarks.HEROES)) {
    const ctx = fakeCtx()
    landmarks.drawHero(ctx, hero, 260, 122)
    assert.ok(ctx.calls > 8, `${hero} drew only ${ctx.calls} shapes`)
    landmarks.heroLights(fakeCtx(), hero, 260, 122, 1, 1, Date.parse('2026-10-22T21:02:00'))
  }
  for (const id of Object.keys(landmarks.SKYLINE)) {
    const ctx = fakeCtx()
    landmarks.drawSkylineIcon(ctx, id, 100, 114, '#556677')
    assert.ok(ctx.calls >= 2, `${id} drew only ${ctx.calls} shapes`)
  }
})

test('every style builds and draws a street, in every season', () => {
  for (const style of Object.keys(styles.KINDS_FOR)) {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const place = cities.describe({ name: 'Test', country: '', lat: 50, lon: 5 })
      const town = scene.buildTown(320, { ...place, style })
      const ctx = fakeCtx()
      const opts = { season, event: 'december', snow: season === 'winter' }
      scene.drawHouses(ctx, town, opts)
      scene.drawFeatureGround(ctx, town, opts)
      scene.drawHero(ctx, town, opts)
      scene.drawSign(ctx, town)
      scene.drawTrees(ctx, town, 1, 20, opts)
      scene.drawQuay(ctx, town, opts)
      assert.ok(town.houses.length > 3, `${style} street has ${town.houses.length} houses`)
    }
  }
})

test('every landmark city builds its town', () => {
  for (const c of cities.CITIES) {
    const town = scene.buildTown(360, cities.describe({ name: c.name, country: '', lat: c.lat, lon: c.lon }))
    const ctx = fakeCtx()
    scene.drawHero(ctx, town, { season: 'autumn', snow: false })
    scene.drawSkyline(ctx, 360, { far: '#556677', near: '#445566' }, town, [])
    assert.equal(town.place.cityId, c.id)
  }
})
