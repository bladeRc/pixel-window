// Cities with hand-drawn landmarks, and which building style each country gets.
(function (root, factory) {
  const mod = factory()
  if (typeof module === 'object' && module.exports) module.exports = mod
  else (root.PW = root.PW || {}).cities = mod
})(typeof self !== 'undefined' ? self : this, function () {
  // hero: the big landmark on the right; skyline: smaller ones far away, at a share of the width.
  const CITIES = [
    { id: 'leiden', name: 'Leiden', lat: 52.1601, lon: 4.497, radius: 8, style: 'dutch', hero: 'devalk', skyline: [['pieterskerk', 0.16], ['stadhuis', 0.34], ['hooglandse', 0.5]] },
    { id: 'amsterdam', name: 'Amsterdam', lat: 52.3731, lon: 4.8922, radius: 15, style: 'dutch', hero: 'westerkerk', skyline: [['rijksmuseum', 0.2], ['zuiderkerk', 0.45]] },
    { id: 'paris', name: 'Paris', lat: 48.8566, lon: 2.3522, radius: 30, style: 'paris', hero: 'eiffel', skyline: [['sacrecoeur', 0.18], ['notredame', 0.42]] },
    { id: 'london', name: 'London', lat: 51.5074, lon: -0.1278, radius: 35, style: 'london', hero: 'bigben', skyline: [['shard', 0.14], ['stpauls', 0.32], ['londoneye', 0.5]] },
    { id: 'newyork', name: 'New York', lat: 40.7128, lon: -74.006, radius: 35, style: 'american', hero: 'empire', skyline: [['chrysler', 0.2], ['onewtc', 0.42]] },
    { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, radius: 40, style: 'japan', hero: 'tokyotower', skyline: [['skytree', 0.25]] },
    { id: 'rome', name: 'Rome', lat: 41.9028, lon: 12.4964, radius: 25, style: 'med', hero: 'colosseum', skyline: [['stpeters', 0.22]] },
    { id: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.405, radius: 30, style: 'central', hero: 'fernsehturm', skyline: [['brandenburg', 0.3]] },
    { id: 'barcelona', name: 'Barcelona', lat: 41.3874, lon: 2.1686, radius: 20, style: 'med', hero: 'sagrada', skyline: [['agbar', 0.25]] },
    { id: 'sydney', name: 'Sydney', lat: -33.8688, lon: 151.2093, radius: 40, style: 'modern', hero: 'opera', skyline: [['harbourbridge', 0.3]] },
    { id: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, radius: 40, style: 'desert', hero: 'burj', skyline: [['burjalarab', 0.2]] },
    { id: 'sanfrancisco', name: 'San Francisco', lat: 37.7749, lon: -122.4194, radius: 25, style: 'american', hero: 'goldengate', skyline: [['transamerica', 0.3]] },
    { id: 'istanbul', name: 'Istanbul', lat: 41.0082, lon: 28.9784, radius: 40, style: 'med', hero: 'mosque', skyline: [['galata', 0.3]] },
    { id: 'seattle', name: 'Seattle', lat: 47.6062, lon: -122.3321, radius: 25, style: 'american', hero: 'spaceneedle', skyline: [] },
    { id: 'toronto', name: 'Toronto', lat: 43.6532, lon: -79.3832, radius: 30, style: 'american', hero: 'cntower', skyline: [] },
    { id: 'rio', name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, radius: 35, style: 'colonial', hero: 'cristo', skyline: [['sugarloaf', 0.2]] },
    { id: 'chisinau', name: 'Chișinău', lat: 47.0105, lon: 28.8638, radius: 20, style: 'eastern', hero: 'chisinau', skyline: [['govhouse', 0.12], ['tvtower', 0.42], ['orthodoxfar', 0.58]] },
  ]

  const STYLE_BY_COUNTRY = {
    dutch: ['NL', 'BE'],
    paris: ['FR', 'MC', 'LU'],
    london: ['GB', 'IE'],
    american: ['US', 'CA'],
    med: ['ES', 'PT', 'IT', 'GR', 'HR', 'MT', 'CY', 'TR', 'MA', 'TN', 'AL', 'ME', 'IL', 'LB'],
    nordic: ['SE', 'NO', 'FI', 'DK', 'IS', 'EE', 'LV', 'LT', 'FO', 'GL'],
    central: ['DE', 'AT', 'CH', 'CZ', 'PL', 'SK', 'HU', 'SI', 'LI'],
    japan: ['JP', 'KR', 'TW'],
    desert: ['AE', 'QA', 'SA', 'KW', 'BH', 'OM', 'EG', 'JO'],
    colonial: ['MX', 'CU', 'CO', 'PE', 'BR', 'AR', 'CL', 'EC', 'BO', 'UY', 'PY', 'VE', 'GT', 'CR', 'PA', 'DO', 'PR'],
    eastern: ['MD', 'RO', 'UA', 'BG', 'RS', 'BY', 'BA', 'MK', 'GE', 'AM', 'RU'],
  }
  const STYLE_OF = {}
  for (const [style, countries] of Object.entries(STYLE_BY_COUNTRY)) for (const c of countries) STYLE_OF[c] = style

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }

  /** The hand-drawn city this place belongs to (nearest one within its radius), or null. */
  function match(lat, lon) {
    let best = null
    let bestD = Infinity
    for (const c of CITIES) {
      const d = distanceKm(lat, lon, c.lat, c.lon)
      if (d <= c.radius && d < bestD) {
        best = c
        bestD = d
      }
    }
    return best
  }

  function styleFor(country) {
    return STYLE_OF[(country || '').toUpperCase()] || 'modern'
  }

  /** Everything the scene needs to know about a place. */
  function describe(place) {
    const city = match(place.lat, place.lon)
    const style = city ? city.style : styleFor(place.country)
    return {
      ...place,
      cityId: city ? city.id : null,
      style,
      hero: city ? city.hero : style === 'dutch' ? 'windmill' : style === 'eastern' ? 'orthodox' : 'park',
      skyline: city ? city.skyline : style === 'eastern' ? [['orthodoxfar', 0.3]] : [],
      tropical: Math.abs(place.lat) < 23.5,
      south: place.lat < 0,
      palms: ['desert', 'colonial'].includes(style) || Math.abs(place.lat) < 30,
    }
  }

  return { CITIES, STYLE_OF, distanceKm, match, styleFor, describe }
})
