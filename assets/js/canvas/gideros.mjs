import { createOffshore } from './effects/offshore.mjs';
import { createFoam } from './effects/foam.mjs';
// Original coordinates in Makalp's unaltered 1818 x 1228 Bay1 photograph.
export function giderosScene() {
  return {
    seed: 'gundogdu-gideros-1',
    photo: { width: 1818, height: 1228 },
    bounds: { x: 500, y: 590, width: 930, height: 565 },
    performance: { fps: 20, maxDpr: 1.25, maxPixels: 650000, lowPowerFps: 15, lowPowerDpr: 1, staticFallbackCost: 9 },
    effects: [
      { create: createOffshore, params: {
        enabled: true, count: 26, opacity: .34, speedScale: .4,
        horizon: 590, depthSpan: 570, length: [22, 50], travel: [8, 17],
        direction: [-1, .12], life: [15, 25], wait: [8, 18],
        bounds: { x: 550, y: 610, width: 850, height: 480 },
        areas: [[[640,670],[900,615],[1120,625],[1370,660],[1280,785],[1100,900],[860,1010],[670,1050],[650,870],[540,775]]],
      }},
      { create: createFoam, params: {
        opacity: .2, travelSpeed: [2, 2.6], foamWidth: 1.2, widthScale: .8, speedScale: .42,
        dispersion: .6, groupChance: 0, breakSpread: .06, deformation: .5, wakeOpacity: .1,
        count: 2, curve: 1, roughness: .3, spacing: 35, fadeIn: [7, 10], fadeTail: [6, 9],
        fadeDistance: 15, shoreOffset: [20, 25], wakeLag: 8, eventSpacing: 6, startJitter: 2,
        length: [28, 40], routeRange: [.3, .68], minTravel: 28, tangentSpan: 12,
        birthGap: [8, 13], groupGap: [8, 13],
        startLine: [[700,990],[850,1020]],
        shoreLine: [[650,1080],[700,1120],[750,1140],[800,1110],[860,1070]],
        safeArea: [[620,970],[900,930],[950,990],[880,1090],[820,1130],[740,1160],[680,1120]],
      }},
    ],
  };
}
