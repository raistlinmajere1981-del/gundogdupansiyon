import {between} from '../random.mjs';

// Zero slope at both ends prevents visible birth/death pulses.
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function inside([x, y], polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

// Geography belongs to the scene. Texture is baked once per crest, never per frame.
export function createFoam({random, params}) {
  const slots = [];
  let active = 0, generation = 0, clock = 0, nextBirth = 0;
  const count = params.count ?? 6;
  const edges = params.shoreLine.slice(1).map((point, i) => ({from: params.shoreLine[i], to: point, length: Math.hypot(point[0] - params.shoreLine[i][0], point[1] - params.shoreLine[i][1])}));
  const coastLength = edges.reduce((sum, edge) => sum + edge.length, 0);
  const phases = Array.from({length: count}, (_, i) => i);
  for (let i = phases.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [phases[i], phases[j]] = [phases[j], phases[i]]; }
  const foamWidth = params.foamWidth * (params.widthScale ?? 1);
  const margin = params.curve + params.roughness + foamWidth * 3 + 8;
  function release(crest) {
    if (crest.sprite.close) crest.sprite.close();
    else crest.sprite.width = crest.sprite.height = 0;
  }

  function coastPoint(distance) {
    let remaining = Math.max(0, Math.min(coastLength, distance));
    for (const edge of edges) {
      if (remaining <= edge.length) {
        const t = remaining / edge.length;
        return [edge.from[0] + (edge.to[0] - edge.from[0]) * t, edge.from[1] + (edge.to[1] - edge.from[1]) * t];
      }
      remaining -= edge.length;
    }
    return edges.at(-1).to;
  }
  function coastSample(distance) {
    const point = coastPoint(distance), before = coastPoint(distance - params.tangentSpan), after = coastPoint(distance + params.tangentSpan);
    const angle = Math.atan2(after[1] - before[1], after[0] - before[0]);
    return {point, angle, tangent: [Math.cos(angle), Math.sin(angle)]};
  }
  function routePoint(crest, along, progress) {
    const coast = coastSample(crest.station + along);
    const target = [coast.point[0] + coast.tangent[1] * crest.shoreOffset, coast.point[1] - coast.tangent[0] * crest.shoreOffset];
    const source = [crest.x + crest.tangent[0] * along, crest.y + crest.tangent[1] * along];
    const angleDelta = Math.atan2(Math.sin(coast.angle - crest.angle), Math.cos(coast.angle - crest.angle));
    return {x: source[0] + (target[0] - source[0]) * progress, y: source[1] + (target[1] - source[1]) * progress,
      angle: crest.angle + angleDelta * progress};
  }
  function interpolateRoute(route, progress) {
    return {x: route.from.x + (route.to.x - route.from.x) * progress,
      y: route.from.y + (route.to.y - route.from.y) * progress, angle: route.from.angle + route.angleDelta * progress};
  }
  function candidate(index, initial) {
    // Separate coastal lanes initially; later choose the widest available gap.
    const [low, high] = params.routeRange;
    const u = low + (high - low) * (initial ? (index + between(random, 0.15, 0.85)) / count : random());
    const station = coastLength * u, coast = coastSample(station);
    const [from, to] = params.startLine;
    const x = from[0] + (to[0] - from[0]) * u + between(random, -params.startJitter, params.startJitter);
    const y = from[1] + (to[1] - from[1]) * u + between(random, -params.startJitter, params.startJitter);
    const shoreOffset = between(random, ...params.shoreOffset);
    const end = [coast.point[0] + coast.tangent[1] * shoreOffset, coast.point[1] - coast.tangent[0] * shoreOffset];
    return {x, y, station, shoreOffset, angle: coast.angle, tangent: coast.tangent,
      perspective: 0.82 + random() * 0.12, distance: Math.hypot(end[0] - x, end[1] - y),
      length: between(random, ...params.length) * (0.65 + u * 0.4)};
  }
  function safe(crest) {
    if (crest.distance < params.minTravel) return false;
    if (!params.safeArea) return true;
    // Check curved crests over the entire route, including the residue envelope.
    const nearMargin = params.curve + params.roughness + foamWidth * 0.8 + params.deformation * 1.55 + 3;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      for (let step = -4; step <= 4; step++) {
        const point = routePoint(crest, step / 8 * (crest.length + 10), progress);
        for (const side of [-margin, nearMargin]) {
          if (!inside([point.x - Math.sin(point.angle) * side, point.y + Math.cos(point.angle) * side], params.safeArea)) return false;
        }
      }
    }
    return true;
  }
  function texture(crest) {
    const bodyWidth = foamWidth * crest.perspective;
    const width = Math.ceil(crest.length + 10), height = Math.ceil(margin * 2);
    const sprite = document.createElement('canvas');
    sprite.width = width * 2; sprite.height = height * 2;
    const ctx = sprite.getContext('2d');
    ctx.scale(2, 2); ctx.translate(width / 2, height / 2);
    const phase = random() * Math.PI * 2;
    const centre = t => Math.sin(t * Math.PI) * crest.curve + Math.sin(t * 10 + phase) * params.roughness;
    let top = Infinity, bottom = -Infinity;
    const dot = (x, y, rx, ry, alpha) => {
      if (ctx.globalCompositeOperation === 'source-over') {
        // Conservative ellipse bounds, including its small rotation and AA edge.
        top = Math.min(top, y - ry - rx * 0.25 - 1);
        bottom = Math.max(bottom, y + ry + rx * 0.25 + 1);
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, between(random, -0.25, 0.25), 0, Math.PI * 2); ctx.fill();
    };
    ctx.fillStyle = '#fff';
    // Uneven connected islands, scalloped edges, a loose wake and small holes.
    // There is deliberately no continuous stroked centreline.
    let t = 0;
    while (t < 1) {
      const end = Math.min(1, t + between(random, 0.045, 0.13));
      const density = between(random, 0.55, 1);
      for (let u = t; u < end; u += 1.1 / crest.length) {
        const taper = Math.sin(u * Math.PI) ** 0.45;
        const x = (u - 0.5) * crest.length, y = centre(u);
        const body = bodyWidth * taper * between(random, 0.6, 1.25);
        dot(x, y + between(random, -body * 0.3, body * 0.3), between(random, 1, 2.6), body * 0.5, density * between(random, 0.45, 0.9));
        if (random() < 0.45) dot(x + between(random, -2, 2), y - between(random, body, body * 2.5), between(random, 0.4, 1.8), between(random, 0.3, 1) * taper, between(random, 0.12, 0.4));
      }
      t = end + between(random, 0.003, 0.02);
    }
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < crest.length / 2; i++) {
      const u = between(random, 0.05, 0.95);
      dot((u - 0.5) * crest.length, centre(u) + between(random, -bodyWidth * 0.4, bodyWidth * 0.4), between(random, 0.3, 1.1), between(random, 0.2, 0.7), between(random, 0.4, 1));
    }
    const cropTop = Math.max(0, Math.floor((top + height / 2) * 2));
    const cropBottom = Math.min(sprite.height, Math.ceil((bottom + height / 2) * 2));
    const frontHeight = (cropBottom - cropTop) / 2;
    const wakeHeight = Math.ceil((params.curve + params.roughness + bodyWidth * 1.6 + 3) * 2);
    const swellHeight = 18;
    const swellY = frontHeight + 2 + wakeHeight + 2;
    const atlasHeight = (swellY + swellHeight) * 2;
    const compact = typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(sprite.width, atlasHeight)
      : document.createElement('canvas');
    compact.width = sprite.width; compact.height = atlasHeight;
    const cachedCtx = compact.getContext('2d');
    cachedCtx.drawImage(sprite, 0, cropTop, sprite.width, frontHeight * 2, 0, 0, compact.width, frontHeight * 2);
    cachedCtx.scale(2, 2);
    cachedCtx.translate(width / 2, frontHeight + 2 + wakeHeight / 2);
    cachedCtx.fillStyle = '#fff';
    // A separate sparse residue, rather than a faded duplicate of the crest.
    for (let i = 0; i < crest.length * 0.75; i++) {
      const u = between(random, 0.03, 0.97), taper = Math.sin(u * Math.PI) ** 0.6;
      cachedCtx.globalAlpha = between(random, 0.18, 0.65) * taper;
      cachedCtx.beginPath();
      cachedCtx.ellipse((u - 0.5) * crest.length, centre(u) - between(random, bodyWidth * 0.3, bodyWidth * 1.5),
        between(random, 0.4, 2), between(random, 0.3, 1.2), 0, 0, Math.PI * 2);
      cachedCtx.fill();
    }
    // A feathered, broken swell body lives in the same small atlas. It is
    // visible before the crest breaks, without a sharp white offshore stripe.
    cachedCtx.setTransform(2, 0, 0, 2, width, (swellY + swellHeight / 2) * 2);
    cachedCtx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      const u = (i + 0.5) / 9;
      cachedCtx.save();
      cachedCtx.translate((u - 0.5) * crest.length, Math.sin(u * 8 + phase) * 1.2);
      cachedCtx.scale(crest.length / 9, 6);
      const gradient = cachedCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, 'rgba(255,255,255,0.65)');
      gradient.addColorStop(0.45, 'rgba(255,255,255,0.25)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      cachedCtx.fillStyle = gradient;
      cachedCtx.beginPath(); cachedCtx.arc(0, 0, 1, 0, Math.PI * 2); cachedCtx.fill();
      cachedCtx.restore();
    }
    // Normalize RGB after overlapping translucent gradients; preserve coverage.
    cachedCtx.setTransform(1, 0, 0, 1, 0, 0);
    cachedCtx.globalCompositeOperation = 'source-in';
    cachedCtx.fillStyle = '#fff';
    cachedCtx.fillRect(0, 0, compact.width, compact.height);
    sprite.width = sprite.height = 0;
    // Immutable bitmaps avoid asking the renderer to snapshot source canvases
    // on every frame. A normal canvas remains the portable fallback.
    const cached = compact.transferToImageBitmap ? compact.transferToImageBitmap() : compact;
    if (cached !== compact) compact.width = compact.height = 0;
    const sections = Array.from({length: 12}, (_, i) => {
      const u = (i + 0.5) / 12;
      const delay = Math.abs(u - crest.breakOrigin) * (params.breakSpread ?? 0.2) + between(random, 0, 0.035);
      const from = routePoint(crest, (u - 0.5) * width, 0), to = routePoint(crest, (u - 0.5) * width, 1);
      const route = {from, to, angleDelta: Math.atan2(Math.sin(to.angle - from.angle), Math.cos(to.angle - from.angle))};
      return {u, delay, end: between(random, 0.78, 1), strength: between(random, 0.75, 1), route};
    });
    return {sprite: cached, width, height: frontHeight, offsetY: cropTop / 2 - height / 2,
      wake: {sourceY: (frontHeight + 2) * 2, height: wakeHeight},
      swell: {sourceY: swellY * 2, height: swellHeight}, sections};
  }
  function spawn(index, initial = false) {
    let crest, best, clearance = -Infinity;
    for (let attempt = 0; attempt < 100; attempt++) {
      const next = candidate(index, initial);
      if (!safe(next)) continue;
      const others = slots.filter((other, i) => i !== index && other.age < other.life);
      const gap = Math.min(...others.map(other => Math.abs(next.station - other.station)));
      if (gap > clearance) { best = next; clearance = gap; }
      if (gap >= params.spacing) { crest = next; break; }
    }
    crest ??= best ?? slots[index];
    if (!crest) throw new Error('Foam scene has no safe coast route');
    const tail = between(random, ...params.fadeTail);
    let travelTime = crest.distance / between(random, ...params.travelSpeed);
    let age = initial ? (travelTime + tail) * (0.09 + 0.78 * (phases[index] + random() * 0.3) / count) : 0;
    // Avoid simultaneous shoreline fades, rather than fading several waves away offshore.
    let bestTime = travelTime, bestAge = age, bestGap = -Infinity;
    for (let attempt = 0; attempt < 24; attempt++) {
      const remaining = travelTime + tail - age;
      const gap = Math.min(...slots.filter((other, i) => i !== index && other.age < other.life)
        .map(other => Math.abs(remaining - (other.life - other.age))));
      if (gap > bestGap) { bestTime = travelTime; bestAge = age; bestGap = gap; }
      if (gap >= params.eventSpacing) break;
      travelTime = crest.distance / between(random, ...params.travelSpeed);
      if (initial) age = Math.max(0.5, Math.min(travelTime * 0.84, age + between(random, -3, 3)));
    }
    travelTime = bestTime; age = bestAge;
    const grouped = params.groupChance > 0 && index % 2 === 1 && (initial || random() < params.groupChance);
    crest = {...crest, curve: between(random, -params.curve, params.curve), life: travelTime + tail,
      travelTime, tail, fadeIn: between(random, ...params.fadeIn), age, rate: 1,
      group: grouped ? slots[index - 1]?.generation ?? null : null,
      breakOrigin: between(random, 0.1, 0.9), phase: random() * Math.PI * 2, generation: ++generation};
    return {...crest, ...texture(crest)};
  }
  try {
    for (let i = 0; i < (params.count ?? 6); i++) slots.push(spawn(i, true));
  } catch (error) {
    for (const crest of slots) release(crest);
    throw error;
  }
  return {
    update(dt) {
      const step = dt * (params.speedScale ?? 1);
      clock += step;
      for (let i = 0; i < slots.length; i++) {
        slots[i].age += step;
        if (slots[i].age >= slots[i].life && clock >= nextBirth) {
          const next = spawn(i);
          release(slots[i]);
          slots[i] = next;
          nextBirth = clock + between(random, ...(next.group ? params.groupGap : params.birthGap));
        }
      }
    },
    render(ctx) {
      active = 0;
      const disperse = params.dispersion ?? 1;
      for (const crest of slots) {
        if (crest.age < 0 || crest.age >= crest.life) continue;
        const progress = Math.min(1, crest.age / crest.travelTime);
        const remaining = crest.distance * (1 - progress);
        const shoreFade = remaining < params.fadeDistance ? 0.3 + 0.7 * remaining / params.fadeDistance : 1;
        const tailFade = smooth((crest.life - crest.age) / crest.tail);
        // White water emerges gradually in the last part of the approach.
        const shoaling = smooth((progress - 0.48) / 0.42);
        let painted = false;
        for (let i = 0; i < crest.sections.length; i++) {
          const section = crest.sections[i], sinceBreak = crest.age - section.delay * crest.travelTime;
          if (sinceBreak <= 0) continue;
          const birthFade = smooth(sinceBreak / crest.fadeIn);
          const dissolve = Math.max(0, 1 - (1 - section.end) * disperse * (1 - shoreFade));
          const envelope = birthFade * shoreFade * tailFade;
          const breathing = 0.5 + 0.5 * Math.sin(crest.age * 0.42 - section.u * 8 + crest.phase);
          const breakup = 0.2 + 0.8 * smooth(breathing);
          const fade = envelope * dissolve * (0.025 + shoaling * 0.72) * breakup;
          const w = crest.width / 12;
          const point = interpolateRoute(section.route, progress);
          const bend = Math.sin(section.u * Math.PI) * Math.sin(progress * Math.PI * 1.3 + crest.phase) * params.deformation * disperse;
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(point.angle);
          ctx.globalAlpha = Math.min(1, params.opacity * envelope * (0.065 + 0.045 * breathing) * (1 - shoaling * 0.55));
          ctx.drawImage(crest.sprite, i * w * 2, crest.swell.sourceY, w * 2, crest.swell.height * 2,
            -w / 2, bend - crest.swell.height / 2, w, crest.swell.height);
          ctx.globalAlpha = Math.min(1, params.opacity * fade * section.strength);
          ctx.drawImage(crest.sprite, i * w * 2, 0, w * 2, crest.height * 2,
            -w / 2, crest.offsetY + bend, w, crest.height * (1 + progress * 0.08));
          ctx.restore();
          const wakeFade = smooth((sinceBreak - 1) / 3) * shoreFade * tailFade * shoaling * breakup;
          if (wakeFade > 0) {
            const wakePoint = interpolateRoute(section.route, Math.max(0, progress - params.wakeLag / crest.distance));
            const spread = 1 + progress * disperse * 0.25;
            ctx.save(); ctx.translate(wakePoint.x, wakePoint.y); ctx.rotate(wakePoint.angle);
            ctx.globalAlpha = Math.min(1, params.opacity * params.wakeOpacity * wakeFade);
            ctx.drawImage(crest.sprite, i * w * 2, crest.wake.sourceY, w * 2, crest.wake.height * 2,
              -w / 2, bend - crest.wake.height / 2 * spread, w, crest.wake.height * spread);
            ctx.restore();
          }
          painted = true;
        }
        if (painted) active++;
      }
    },
    inspect: () => ({type: 'foam', count: slots.length, active, opacity: params.opacity, widthScale: params.widthScale ?? 1,
      speedScale: params.speedScale ?? 1, dispersion: params.dispersion ?? 1, groupChance: params.groupChance ?? 0,
      cachedPixels: slots.reduce((sum, c) => sum + c.sprite.width * c.sprite.height, 0),
      slots: slots.map(crest => {
        const {x, y, age, life, length, curve, distance, generation, angle, group, perspective, sections, station, travelTime} = crest;
        return {x, y, age, life, length, curve, distance, generation, angle, group, perspective, station, travelTime,
          position: routePoint(crest, 0, Math.min(1, Math.max(0, age / travelTime))), destination: routePoint(crest, 0, 1),
          breakDelays: sections.map(s => s.delay)};
      }),
    }),
    destroy() {
      for (const crest of slots) release(crest);
      slots.length = 0;
    },
  };
}
