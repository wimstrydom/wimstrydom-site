// Rocket icon using the spacecraft PNG.
// The PNG (hail-mary-spacecraft-small.png) is 640×427, engines left, nose right.
// We display it at w=68 h=45 (preserving ~1.5 aspect), centred at origin, then
// rotate –90° so the nose points up (–y) in local coords — matching the angle=0
// convention used throughout the sim. The parent group's rotate(angle_deg) then
// handles world orientation correctly.
//
// Engine exhaust: PNG engines are on the left → after –90° rotation they sit at
// the bottom of the icon (+y direction in local coords). ENGINE_EXHAUST_Y marks
// that position so the glow element can be placed there.

const NS  = 'http://www.w3.org/2000/svg';
const W   = 68;   // display width of the PNG before internal rotation
const H   = 45;   // display height of the PNG before internal rotation
// After –90° rotation: icon spans x:[-H/2, H/2], y:[-W/2, W/2]

export function createRocketIcon() {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'rocket-icon');

  const img = document.createElementNS(NS, 'image');
  img.setAttribute('href', '/explorations/spaceship-fishing/hail-mary-spacecraft-small.png');
  img.setAttribute('x',      String(-W / 2));
  img.setAttribute('y',      String(-H / 2));
  img.setAttribute('width',  String(W));
  img.setAttribute('height', String(H));
  img.setAttribute('transform', 'rotate(-90)');

  g.appendChild(img);
  return g;
}

// Local y-coordinate of the engine exhaust after the –90° rotation.
// PNG engines sit at the left edge (x ≈ –W/2 before rotation).
// After rotate(–90°): left edge (–W/2, 0) maps to (0, W/2).
export const ENGINE_EXHAUST_Y = W / 2;   // ≈ 34
