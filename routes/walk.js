// Walking routes from the campus-side station exit, using the footpaths in map.geojson.
const STATION = { lat: -33.777161, lng: 151.118078 };
// Footpath pieces that are lit, traced from Macquarie's Accessibility Map (April 2026); see tools/trace-lit-paths.
const LIT = require('../data/lit-paths.json');
const NIGHT_UNLIT_COST = 2;
const WALK = new Set([
  'footway', 'pedestrian', 'path', 'steps', 'crossing', 'corridor',
  'living_street', 'service', 'unclassified', 'residential',
]);

function metres(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function keyOf(lng, lat) {
  return lng.toFixed(5) + ',' + lat.toFixed(5);
}

function avoidAreas(raw) {
  const areas = [];
  for (const f of raw.features) {
    const p = f.properties || {};
    const kind = p.landuse === 'grass' || p.landuse === 'forest' || p.landuse === 'meadow'
      || p.natural === 'wood' || p.natural === 'grassland';
    if (!kind || !f.geometry || !/Polygon$/.test(f.geometry.type)) continue;
    const ring = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0];
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    areas.push({ ring, minLng, maxLng, minLat, maxLat });
  }
  return areas;
}

function insideAvoid(lng, lat, areas) {
  for (const area of areas) {
    if (lng < area.minLng || lng > area.maxLng || lat < area.minLat || lat > area.maxLat) continue;
    const ring = area.ring;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

const litEdges = new Set();
for (const [lng1, lat1, lng2, lat2] of LIT) {
  litEdges.add(keyOf(lng1, lat1) + '|' + keyOf(lng2, lat2));
  litEdges.add(keyOf(lng2, lat2) + '|' + keyOf(lng1, lat1));
}

function buildGraph(raw) {
  const nodes = new Map();
  const ensure = (lng, lat) => {
    const key = keyOf(lng, lat);
    let node = nodes.get(key);
    if (!node) {
      node = { lat: +lat.toFixed(5), lng: +lng.toFixed(5), edges: [] };
      nodes.set(key, node);
    }
    return node;
  };
  const link = (a, b, steps, cost, name) => {
    if (a === b) return;
    const w = metres(a, b);
    if (w < 0.5) return;
    const lit = litEdges.has(keyOf(a.lng, a.lat) + '|' + keyOf(b.lng, b.lat));
    const nightCost = lit ? cost : cost * NIGHT_UNLIT_COST;
    const add = (from, to) => {
      const existing = from.edges.find((e) => e.to === to);
      if (existing) {
        if (name && !existing.name) existing.name = name;
        if (steps) existing.steps = true;
        if (lit && !existing.lit) { existing.lit = true; existing.nightCost = Math.min(existing.nightCost, nightCost); }
        return;
      }
      from.edges.push({ to, w, cost, nightCost, lit, steps, name: name || '' });
    };
    add(a, b);
    add(b, a);
  };
  const avoid = avoidAreas(raw);
  const slow = (a, b) => {
    const midLng = (a.lng + b.lng) / 2;
    const midLat = (a.lat + b.lat) / 2;
    return insideAvoid(midLng, midLat, avoid) ? 3 : 1;
  };
  for (const f of raw.features) {
    const highway = f.properties && f.properties.highway;
    if (!WALK.has(highway) || !f.geometry) continue;
    const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates]
      : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [];
    const steps = highway === 'steps';
    for (const line of lines) {
      let prev = null;
      for (const [lng, lat] of line) {
        const node = ensure(lng, lat);
        if (prev) link(prev, node, steps, metres(prev, node) * slow(prev, node), f.properties.name || '');
        prev = node;
      }
    }
  }
  return nodes;
}

function nearest(nodes, point, maxM) {
  let best = null;
  let bestD = maxM;
  for (const node of nodes.values()) {
    const d = metres(point, node);
    if (d < bestD) { best = node; bestD = d; }
  }
  return best;
}

function ringPoint(feature) {
  const ring = feature.geometry.coordinates[0];
  let lat = 0;
  let lng = 0;
  const n = Math.max(1, ring.length - 1);
  for (let i = 0; i < n; i++) { lng += ring[i][0]; lat += ring[i][1]; }
  return { lng: lng / n, lat: lat / n };
}

function fromStation(nodes, night) {
  return shortestFrom(nearest(nodes, STATION, 80), night);
}

function shortestFrom(start, night) {
  const dist = new Map(start ? [[start, 0]] : []);
  const prev = new Map();
  const used = new Set();
  const queue = start ? [start] : [];
  while (queue.length) {
    let bi = 0;
    for (let i = 1; i < queue.length; i++) if (dist.get(queue[i]) < dist.get(queue[bi])) bi = i;
    const node = queue.splice(bi, 1)[0];
    if (used.has(node)) continue;
    used.add(node);
    for (const edge of node.edges) {
      const next = dist.get(node) + (night ? edge.nightCost : edge.cost);
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { node, steps: edge.steps, w: edge.w, lit: edge.lit, name: edge.name || '' });
        queue.push(edge.to);
      }
    }
  }
  return { start, dist, prev };
}

// Closest point on the building outline, so the drawn walk can finish at the wall.
function closestOnRing(point, ring) {
  let best = null;
  let bestD = Infinity;
  const cos = Math.cos(point.lat * Math.PI / 180);
  const px = point.lng * cos;
  const py = point.lat;
  for (let i = 0; i < ring.length - 1; i++) {
    const ax = ring[i][0] * cos;
    const ay = ring[i][1];
    const bx = ring[i + 1][0] * cos;
    const by = ring[i + 1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const spot = { lng: (ax + dx * t) / cos, lat: ay + dy * t };
    const d = metres(point, spot);
    if (d < bestD) { bestD = d; best = spot; }
  }
  return { point: best, metres: bestD };
}

// Shortest walk from the station to the footpath nearest this building.
// Returns coordinates as [lat, lng], or null when no path comes close.
function routeTo(nodes, feature, night) {
  const cacheKey = night ? 'fromStationNight' : 'fromStation';
  if (!nodes[cacheKey]) nodes[cacheKey] = fromStation(nodes, night);
  const { start, dist, prev } = nodes[cacheKey];
  if (!start) return null;
  const ring = feature.geometry.type === 'MultiPolygon'
    ? feature.geometry.coordinates[0][0]
    : feature.geometry.coordinates[0];
  let goal = null;
  for (const limit of [30, 55, 90]) {
    let best = Infinity;
    for (const node of nodes.values()) {
      const cost = dist.get(node);
      if (cost === undefined || cost >= best) continue;
      let near = Infinity;
      for (let i = 0; i < ring.length; i++) {
        near = Math.min(near, metres(node, { lng: ring[i][0], lat: ring[i][1] }));
      }
      if (near <= limit) { best = cost; goal = node; }
    }
    if (goal) break;
  }
  if (!goal) return null;
  const hops = [];
  let cursor = goal;
  while (cursor) {
    const hop = prev.get(cursor);
    if (hop) hops.push({ from: hop.node, to: cursor, w: hop.w, steps: hop.steps, lit: hop.lit, name: hop.name || '' });
    cursor = hop && hop.node;
  }
  hops.reverse();
  const coordinates = hops.length ? [[hops[0].from.lat, hops[0].from.lng]] : [[start.lat, start.lng]];
  let steps = false;
  let walked = 0;
  let litWalked = 0;
  for (const hop of hops) {
    coordinates.push([hop.to.lat, hop.to.lng]);
    walked += hop.w;
    if (hop.lit) litWalked += hop.w;
    if (hop.steps) steps = true;
  }
  const door = closestOnRing(goal, ring);
  if (door.point && door.metres > 1 && door.metres <= 40) {
    coordinates.push([door.point.lat, door.point.lng]);
    walked += door.metres;
  }
  const instructions = describeWalk(hops, feature.properties.name || '');
  return { coordinates, metres: Math.round(walked), litMetres: Math.round(litWalked), steps, instructions };
}

// The walk from a building, or from a point {lat, lng} such as the user's position, to a spot such as a drinking fountain, on the footpaths.
// Starts at the footpath node nearest the building's outline (or the point); returns the same shape as routeTo.
function routeBetween(nodes, feature, spot, night) {
  const isPoint = !feature.geometry;
  const ring = isPoint ? [[feature.lng, feature.lat]]
    : feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0];
  // Try every footpath node near the building (a virtual start joins them, costing their distance to the wall)
  // and every node near the spot, so one badly placed node cannot send the walk the long way round.
  // Widen the search only when the tight one finds nothing (a wide one lets a single node between the two count as a walk).
  const near = new Map();
  const away = new Map();
  for (const node of nodes.values()) {
    let d = Infinity;
    for (const [lng, lat] of ring) d = Math.min(d, metres(node, { lng, lat }));
    near.set(node, d);
    away.set(node, metres(node, spot));
  }
  let virtual = null;
  let prev = null;
  let goal = null;
  for (const limit of [40, 65, 90]) {
    const starts = [...nodes.values()].filter((n) => near.get(n) <= limit);
    const goals = [...nodes.values()].filter((n) => away.get(n) <= limit);
    if (!starts.length || !goals.length) continue;
    virtual = { lat: 0, lng: 0, edges: starts.map((n) => ({ to: n, w: 0, cost: near.get(n), nightCost: near.get(n), lit: false, steps: false, name: '' })) };
    const found = shortestFrom(virtual, night);
    prev = found.prev;
    let best = Infinity;
    for (const g of goals) {
      const cost = found.dist.get(g);
      if (cost !== undefined && cost + away.get(g) < best) { best = cost + away.get(g); goal = g; }
    }
    if (goal) break;
  }
  if (!goal) return null;
  const hops = [];
  let cursor = goal;
  while (cursor) {
    const hop = prev.get(cursor);
    if (!hop || hop.node === virtual) break;
    hops.push({ from: hop.node, to: cursor, w: hop.w, steps: hop.steps, lit: hop.lit, name: hop.name || '' });
    cursor = hop.node;
  }
  hops.reverse();
  const start = hops.length ? hops[0].from : goal;
  // The walk off the start point (or the wall) onto the footpath: drawn and counted, and added to the first instruction.
  const origin = isPoint ? feature : closestOnRing(start, ring).point;
  const lead = origin ? metres(origin, start) : 0;
  const coordinates = lead > 1 ? [[origin.lat, origin.lng], [start.lat, start.lng]] : [[start.lat, start.lng]];
  let walked = lead > 1 ? lead : 0;
  let litWalked = 0;
  let steps = false;
  for (const hop of hops) {
    coordinates.push([hop.to.lat, hop.to.lng]);
    walked += hop.w;
    if (hop.lit) litWalked += hop.w;
    if (hop.steps) steps = true;
  }
  const last = metres(goal, spot);
  if (last > 1) { coordinates.push([spot.lat, spot.lng]); walked += last; }
  // A walk with no footpath in it (start and tap share a node) is one short step in a straight line.
  const instructions = hops.length ? describeWalk(hops, spot.label || '')
    : walked > 1 ? [{ kind: 'head', direction: cardinal(bearing({ lat: coordinates[0][0], lng: coordinates[0][1] }, spot)), name: '', metres: Math.round(walked), steps: false }, { kind: 'arrive', name: spot.label || '', metres: 0, steps: false }]
      : [{ kind: 'arrive', name: spot.label || '', metres: 0, steps: false }];
  // Every metre belongs to a step: the walk on to the footpath goes to the first, the walk off it to the last.
  if (hops.length && lead > 1) instructions[0].metres += Math.round(lead);
  if (last > 1 && hops.length) instructions[instructions.length - 2].metres += Math.round(last);
  return { coordinates, metres: Math.round(walked), litMetres: Math.round(litWalked), steps, instructions };
}

function bearing(a, b) {
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function turnAngle(from, to) {
  return (to - from + 540) % 360 - 180;
}

function cardinal(deg) {
  return ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(deg / 45) % 8];
}

function describeWalk(hops, destination) {
  const runs = [];
  for (const hop of hops) {
    const dir = bearing(hop.from, hop.to);
    const last = runs[runs.length - 1];
    const angle = last ? Math.abs(turnAngle(last.exit, dir)) : 0;
    const nameChange = Boolean(last && hop.name && last.name && hop.name !== last.name);
    const sharp = angle >= 55;
    if (!last) {
      runs.push({ name: hop.name, metres: hop.w, steps: hop.steps, bearing: dir, exit: dir });
      continue;
    }
    if ((!nameChange && !sharp) || (hop.name && !last.name && !sharp) || (!nameChange && hop.w < 18)) {
      last.metres += hop.w;
      last.steps = last.steps || hop.steps;
      last.exit = dir;
      if (hop.name) last.name = hop.name;
      continue;
    }
    runs.push({ name: hop.name, metres: hop.w, steps: hop.steps, bearing: dir, exit: dir });
  }
  for (let i = runs.length - 1; i > 0; i--) {
    const namedTurn = runs[i].name && runs[i].name !== runs[i - 1].name;
    if (runs[i].metres >= 30 || namedTurn) continue;
    runs[i - 1].metres += runs[i].metres;
    runs[i - 1].exit = runs[i].exit;
    runs[i - 1].steps = runs[i - 1].steps || runs[i].steps;
    if (runs[i].name && !runs[i - 1].name) runs[i - 1].name = runs[i].name;
    runs.splice(i, 1);
  }
  if (runs.length > 1 && runs[0].metres < 25) {
    runs[1].metres += runs[0].metres;
    runs[1].steps = runs[1].steps || runs[0].steps;
    if (!runs[1].name && runs[0].name) runs[1].name = runs[0].name;
    runs.shift();
  }
  const instructions = runs.map((run, i) => {
    if (i === 0) {
      return { kind: 'head', direction: cardinal(run.bearing), name: run.name, metres: Math.round(run.metres), steps: run.steps };
    }
    const angle = turnAngle(runs[i - 1].exit, run.bearing);
    let kind = 'straight';
    if (angle < -35) kind = 'left';
    else if (angle > 35) kind = 'right';
    if (Math.abs(angle) > 150) kind = 'uturn';
    return { kind, name: run.name, metres: Math.round(run.metres), steps: run.steps };
  });
  instructions.push({ kind: 'arrive', name: destination, metres: 0, steps: false });
  return instructions;
}

module.exports = { buildGraph, routeTo, routeBetween, nearest, ringPoint, metres, STATION };
