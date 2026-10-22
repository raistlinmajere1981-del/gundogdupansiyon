import { createOffshore } from './effects/offshore.mjs';
import { createFoam } from './effects/foam.mjs';
// Original coordinates in Makalp's unaltered 1818 x 1228 Bay1 photograph.
export function giderosScene({diagnostic = true} = {}) {
  const scene = {
    seed: 'gundogdu-gideros-1',
    photo: { width: 1818, height: 1228 },
    bounds: { x: 500, y: 590, width: 930, height: 565 },
    performance: { fps: 20, maxDpr: 1.25, maxPixels: 650000, lowPowerFps: 15, lowPowerDpr: 1, staticFallbackCost: 9 },
    effects: [
      { create: createOffshore, params: {
        enabled: true, count: 40, opacity: .85, speedScale: .6,
        horizon: 590, depthSpan: 570, length: [42, 85], travel: [12, 24],
        direction: [-1, .12], life: [15, 25], wait: [8, 18],
        bounds: { x: 550, y: 610, width: 850, height: 480 },
        areas: [[[640,670],[900,615],[1120,625],[1370,660],[1280,785],[1100,900],[860,1010],[670,1050],[650,870],[540,775]]],
      }},
      { create: createFoam, params: {
        opacity: .75, travelSpeed: [2.8, 3.6], foamWidth: 2.4, widthScale: .9, speedScale: .6,
        dispersion: .6, groupChance: 0, breakSpread: .06, deformation: .5, wakeOpacity: .1,
        count: 2, curve: 1, roughness: .3, spacing: 35, fadeIn: [2, 4], fadeTail: [6, 9],
        fadeDistance: 15, shoreOffset: [20, 25], wakeLag: 8, eventSpacing: 6, startJitter: 2,
        length: [40, 60], routeRange: [.3, .68], minTravel: 28, tangentSpan: 12,
        birthGap: [8, 13], groupGap: [8, 13],
        startLine: [[700,990],[850,1020]],
        shoreLine: [[650,1080],[700,1120],[750,1140],[800,1110],[860,1070]],
        safeArea: [[620,970],[900,930],[950,990],[880,1090],[820,1130],[740,1160],[680,1120]],
      }},
    ],
  };
  if (diagnostic) {
    Object.assign(scene.effects[0].params, {
      count: 120, opacity: 4, speedScale: 2.4, length: [75, 140], travel: [22, 44],
      life: [5, 9], wait: [.2, 1],
    });
    Object.assign(scene.effects[1].params, {
      count: 6, opacity: 5, foamWidth: 8, widthScale: 1.3, speedScale: 2.2,
      travelSpeed: [9, 13], deformation: 2, wakeOpacity: .7, spacing: 12,
      fadeIn: [.3, .7], fadeTail: [2, 3], birthGap: [.3, .7], groupGap: [.3, .7],
      eventSpacing: .5, length: [55, 85], curve: 1.5,
      // Keep bounded, safe routes visible before desktop cover cropping.
      startLine: [[710,965],[840,990]], shoreLine: [[650,1050],[720,1095],[790,1080],[860,1040]],
      safeArea: [[620,920],[910,910],[950,1000],[880,1100],[790,1140],[670,1110]],
    });
  }
  return scene;
}
