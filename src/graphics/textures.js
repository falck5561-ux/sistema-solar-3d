import * as THREE from 'three';

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function hexToRgb(hex) {
  const color = new THREE.Color(hex);
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255)
  };
}

function mixRgb(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function smoothNoise(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 0.001) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x, y, seed) {
  let total = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let octave = 0; octave < 5; octave += 1) {
    total += smoothNoise(x * frequency, y * frequency, seed + octave * 193) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return total / 1.065;
}

function finishTexture(canvas, repeat = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  texture.needsUpdate = true;
  return texture;
}

function drawRockyTexture(ctx, size, colors, random, seed) {
  const palette = colors.map(hexToRgb);
  const image = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;
      const n1 = fbm(nx * 5.2, ny * 3.7, seed);
      const n2 = fbm(nx * 17.0, ny * 10.0, seed + 77);
      const value = Math.min(0.999, n1 * 0.72 + n2 * 0.28);
      const scaled = value * (palette.length - 1);
      const index = Math.floor(scaled);
      const mixed = mixRgb(palette[index], palette[Math.min(index + 1, palette.length - 1)], scaled - index);
      const lighting = 0.77 + n2 * 0.42;
      const i = (y * size + x) * 4;
      image.data[i] = Math.min(255, mixed.r * lighting);
      image.data[i + 1] = Math.min(255, mixed.g * lighting);
      image.data[i + 2] = Math.min(255, mixed.b * lighting);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 90; i += 1) {
    const radius = 2 + random() * 17;
    const x = random() * size;
    const y = random() * size;
    const gradient = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, 1, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.18)');
    gradient.addColorStop(0.58, 'rgba(50,30,25,0.14)');
    gradient.addColorStop(1, 'rgba(10,5,3,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.65 + random() * 0.45), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawGasTexture(ctx, size, colors, random, seed, stronger = false) {
  const palette = colors;
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, size, size);

  let y = 0;
  while (y < size) {
    const bandHeight = 5 + random() * (stronger ? 22 : 15);
    const color = palette[Math.floor(random() * palette.length)];
    const alpha = 0.55 + random() * 0.4;
    const gradient = ctx.createLinearGradient(0, y, 0, y + bandHeight);
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.24, color);
    gradient.addColorStop(0.76, color);
    gradient.addColorStop(1, `${color}00`);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, size, bandHeight);
    y += bandHeight * (0.62 + random() * 0.7);
  }

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 380; i += 1) {
    const px = random() * size;
    const py = random() * size;
    const width = 10 + random() * 68;
    const height = 1 + random() * 7;
    ctx.fillStyle = palette[Math.floor(random() * palette.length)];
    ctx.beginPath();
    ctx.ellipse(px, py, width, height, (random() - 0.5) * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  if (stronger) {
    const stormX = size * 0.68;
    const stormY = size * 0.63;
    const gradient = ctx.createRadialGradient(stormX, stormY, 2, stormX, stormY, 43);
    gradient.addColorStop(0, 'rgba(246,174,126,0.95)');
    gradient.addColorStop(0.38, 'rgba(175,75,46,0.9)');
    gradient.addColorStop(0.72, 'rgba(113,42,32,0.6)');
    gradient.addColorStop(1, 'rgba(85,32,24,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(stormX, stormY, 49, 22, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  const image = ctx.getImageData(0, 0, size, size);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const i = (py * size + px) * 4;
      const turbulence = (fbm(px / size * 15, py / size * 7, seed) - 0.5) * 28;
      image.data[i] = Math.max(0, Math.min(255, image.data[i] + turbulence));
      image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + turbulence));
      image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + turbulence));
      image.data[i + 3] = 255;
    }
  }
  ctx.globalAlpha = 1;
  ctx.putImageData(image, 0, 0);
}

function drawEarthTexture(ctx, size, random, seed) {
  const ocean = ctx.createLinearGradient(0, 0, 0, size);
  ocean.addColorStop(0, '#071d47');
  ocean.addColorStop(0.5, '#0b5591');
  ocean.addColorStop(1, '#051c40');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.filter = 'blur(3px)';
  for (let continent = 0; continent < 42; continent += 1) {
    const x = random() * size;
    const y = size * (0.13 + random() * 0.74);
    const w = 20 + random() * 82;
    const h = 9 + random() * 44;
    const green = random() > 0.42 ? '#39784b' : '#a39058';
    ctx.fillStyle = green;
    ctx.globalAlpha = 0.68 + random() * 0.28;
    ctx.beginPath();
    for (let point = 0; point < 12; point += 1) {
      const angle = (point / 12) * Math.PI * 2;
      const distortion = 0.6 + random() * 0.55;
      const px = x + Math.cos(angle) * w * distortion;
      const py = y + Math.sin(angle) * h * distortion;
      if (point === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const image = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    const latitude = Math.abs(y / size - 0.5) * 2;
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const noise = (fbm(x / size * 12, y / size * 8, seed) - 0.5) * 24;
      image.data[i] = Math.max(0, Math.min(255, image.data[i] + noise));
      image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + noise));
      image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + noise));
      if (latitude > 0.86) {
        const ice = Math.min(1, (latitude - 0.86) / 0.14);
        image.data[i] = image.data[i] * (1 - ice) + 225 * ice;
        image.data[i + 1] = image.data[i + 1] * (1 - ice) + 238 * ice;
        image.data[i + 2] = image.data[i + 2] * (1 - ice) + 245 * ice;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}


function enhancePlanetTexture(ctx, name, size, random) {
  ctx.save();

  if (name === 'Marte') {
    const north = ctx.createLinearGradient(0, 0, 0, size * 0.13);
    north.addColorStop(0, 'rgba(244,226,204,0.9)');
    north.addColorStop(1, 'rgba(244,226,204,0)');
    ctx.fillStyle = north;
    ctx.fillRect(0, 0, size, size * 0.14);

    const south = ctx.createLinearGradient(0, size, 0, size * 0.86);
    south.addColorStop(0, 'rgba(231,214,197,0.78)');
    south.addColorStop(1, 'rgba(231,214,197,0)');
    ctx.fillStyle = south;
    ctx.fillRect(0, size * 0.86, size, size * 0.14);

    ctx.strokeStyle = 'rgba(74,25,18,0.45)';
    ctx.lineWidth = size * 0.013;
    ctx.beginPath();
    ctx.moveTo(size * 0.18, size * 0.58);
    ctx.bezierCurveTo(size * 0.38, size * 0.53, size * 0.58, size * 0.66, size * 0.83, size * 0.54);
    ctx.stroke();
  }

  if (name === 'Venus') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 45; i += 1) {
      const y = random() * size;
      const x = random() * size;
      ctx.strokeStyle = i % 2 ? '#ffe5aa' : '#d98c44';
      ctx.lineWidth = 2 + random() * 6;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.12, y);
      ctx.bezierCurveTo(x, y - 14, x + size * 0.08, y + 15, x + size * 0.2, y);
      ctx.stroke();
    }
  }

  if (name === 'Júpiter') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 14; i += 1) {
      const y = size * (0.12 + i * 0.055);
      ctx.fillStyle = i % 2 ? '#fff1d6' : '#bd805e';
      ctx.fillRect(0, y, size, 1 + (i % 3));
    }
  }

  if (name === 'Saturno') {
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 24; i += 1) {
      const y = size * (0.08 + i * 0.036);
      ctx.fillStyle = i % 3 === 0 ? '#fff1c8' : '#9d8151';
      ctx.fillRect(0, y, size, 1 + (i % 2));
    }
  }

  if (name === 'Urano') {
    const glow = ctx.createLinearGradient(0, 0, size, 0);
    glow.addColorStop(0, 'rgba(55,145,156,0.16)');
    glow.addColorStop(0.5, 'rgba(220,255,255,0.16)');
    glow.addColorStop(1, 'rgba(55,145,156,0.16)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  if (name === 'Neptuno') {
    const stormX = size * 0.35;
    const stormY = size * 0.54;
    const gradient = ctx.createRadialGradient(stormX, stormY, 2, stormX, stormY, size * 0.085);
    gradient.addColorStop(0, 'rgba(1,10,51,0.86)');
    gradient.addColorStop(0.55, 'rgba(8,29,98,0.72)');
    gradient.addColorStop(1, 'rgba(20,68,165,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(stormX, stormY, size * 0.095, size * 0.042, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#8ec8ff';
    ctx.beginPath();
    ctx.ellipse(size * 0.62, size * 0.42, size * 0.1, size * 0.008, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function createPlanetTexture(name, textureType, colors, size = window.innerWidth > 1100 ? 768 : 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: false });
  const seed = hashString(name);
  const random = seededRandom(seed);

  if (textureType === 'earth') {
    drawEarthTexture(ctx, size, random, seed);
  } else if (textureType === 'gasBands') {
    drawGasTexture(ctx, size, colors, random, seed, name === 'Júpiter');
  } else if (textureType === 'iceBands') {
    drawGasTexture(ctx, size, colors, random, seed, true);
  } else if (textureType === 'cloudy') {
    drawGasTexture(ctx, size, colors, random, seed, false);
  } else if (textureType === 'ice') {
    drawGasTexture(ctx, size, colors, random, seed, false);
  } else {
    drawRockyTexture(ctx, size, colors, random, seed);
  }

  enhancePlanetTexture(ctx, name, size, random);
  return finishTexture(canvas);
}

export function createCloudTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const seed = 7391;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = fbm(x / size * 9, y / size * 5, seed);
      const wisps = fbm(x / size * 22 + 7, y / size * 9, seed + 41);
      const density = Math.max(0, (n * 0.7 + wisps * 0.3 - 0.52) * 4.4);
      const i = (y * size + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.min(210, density * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  return finishTexture(canvas);
}

export function createRingTexture(color = '#d8c39c', size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(color);
  const image = ctx.createImageData(size, 32);

  for (let x = 0; x < size; x += 1) {
    const t = x / (size - 1);
    const gaps =
      0.72 +
      Math.sin(t * 260) * 0.08 +
      Math.sin(t * 71) * 0.1 +
      Math.sin(t * 910) * 0.025;
    const cassini = t > 0.57 && t < 0.62 ? 0.08 : 1;
    const edge = THREE.MathUtils.smoothstep(t, 0, 0.035) * (1 - THREE.MathUtils.smoothstep(t, 0.965, 1));
    const alpha = Math.max(0, Math.min(1, gaps * cassini * edge));
    for (let y = 0; y < 32; y += 1) {
      const i = (y * size + x) * 4;
      const brightness = 0.72 + Math.sin(t * 140 + y * 0.1) * 0.1;
      image.data[i] = base.r * 255 * brightness;
      image.data[i + 1] = base.g * 255 * brightness;
      image.data[i + 2] = base.b * 255 * brightness;
      image.data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finishTexture(canvas);
}

export function createRadialGlowTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,244,183,1)');
  gradient.addColorStop(0.14, 'rgba(255,173,51,0.92)');
  gradient.addColorStop(0.4, 'rgba(255,91,10,0.28)');
  gradient.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(canvas);
}

export function createStarTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(220,235,255,0.95)');
  gradient.addColorStop(0.38, 'rgba(140,185,255,0.32)');
  gradient.addColorStop(1, 'rgba(60,100,180,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(canvas);
}
