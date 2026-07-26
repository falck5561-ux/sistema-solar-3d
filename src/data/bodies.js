export const BODY_AUDIO = {
  Sol: 'sol.mp3',
  Mercurio: 'mercurio.mp3',
  Venus: 'venus.mp3',
  Tierra: 'tierra.mp3',
  Marte: 'marte.mp3',
  Júpiter: 'jupiter.mp3',
  Saturno: 'saturno.mp3',
  Urano: 'urano.mp3',
  Neptuno: 'neptuno.mp3'
};

export const BODY_THEME = {
  Sol: { color: '#ff9a42', soft: '#ffd095', rgb: '255, 154, 66' },
  Mercurio: { color: '#b9aa99', soft: '#e4d8ca', rgb: '185, 170, 153' },
  Venus: { color: '#e0a357', soft: '#f7d699', rgb: '224, 163, 87' },
  Tierra: { color: '#62c59f', soft: '#ddd078', rgb: '98, 197, 159' },
  Marte: { color: '#df6942', soft: '#ffae8f', rgb: '223, 105, 66' },
  Júpiter: { color: '#d7b48f', soft: '#f4ddc2', rgb: '215, 180, 143' },
  Saturno: { color: '#e7cf91', soft: '#fff0bf', rgb: '231, 207, 145' },
  Urano: { color: '#74d9df', soft: '#b7f4f5', rgb: '116, 217, 223' },
  Neptuno: { color: '#4d80ff', soft: '#9fbbff', rgb: '77, 128, 255' }
};

export const SUN_INFO = {
  name: 'Sol',
  type: 'Estrella tipo G',
  diameter: '1,392,700 km',
  distance: 'Centro del sistema',
  year: '—',
  temperature: '≈ 5,500 °C (superficie)',
  description:
    'La estrella que concentra casi toda la masa del Sistema Solar. Su luz y gravedad gobiernan el movimiento de los planetas.'
};

export const PLANETS = [
  {
    name: 'Mercurio',
    type: 'Planeta rocoso',
    radius: 0.72,
    distance: 12.5,
    diameter: '4,879 km',
    distanceText: '57.9 millones km',
    yearText: '88 días',
    temperature: '≈ 167 °C',
    orbitPeriod: 87.97,
    rotationHours: 1407.6,
    axialTilt: 0.03,
    inclination: 7,
    eccentricity: 0.2056,
    initialAngle: 0.4,
    texture: 'rocky',
    colors: ['#7a7167', '#b2a797', '#514b45', '#d1c3ae'],
    description: 'El planeta más cercano al Sol: pequeño, rocoso y cubierto de cráteres.'
  },
  {
    name: 'Venus',
    type: 'Planeta rocoso',
    radius: 1.08,
    distance: 17.2,
    diameter: '12,104 km',
    distanceText: '108.2 millones km',
    yearText: '224.7 días',
    temperature: '≈ 464 °C',
    orbitPeriod: 224.7,
    rotationHours: -5832.5,
    axialTilt: 177.4,
    inclination: 3.39,
    eccentricity: 0.0068,
    initialAngle: 2.2,
    texture: 'cloudy',
    colors: ['#8b5c2f', '#d7a85a', '#f0d08a', '#6d4529'],
    atmosphere: { color: '#f4b35f', intensity: 0.72 },
    description: 'Un mundo cubierto por nubes densas, con un efecto invernadero extremo.'
  },
  {
    name: 'Tierra',
    type: 'Planeta oceánico',
    radius: 1.16,
    distance: 22.7,
    diameter: '12,742 km',
    distanceText: '149.6 millones km',
    yearText: '365.25 días',
    temperature: '≈ 15 °C',
    orbitPeriod: 365.25,
    rotationHours: 23.934,
    axialTilt: 23.44,
    inclination: 0,
    eccentricity: 0.0167,
    initialAngle: 4.4,
    texture: 'earth',
    colors: ['#0c3d73', '#1563a5', '#2f794a', '#9d8b55'],
    atmosphere: { color: '#4ea8ff', intensity: 1 },
    clouds: true,
    moons: [
      {
        name: 'Luna',
        radius: 0.28,
        distance: 2.25,
        orbitPeriod: 27.3,
        colors: ['#8b8984', '#c4c0b8', '#5f5e5b'],
        initialAngle: 0.8
      }
    ],
    description: 'Nuestro hogar: océanos líquidos, atmósfera protectora y una biosfera activa.'
  },
  {
    name: 'Marte',
    type: 'Planeta rocoso',
    radius: 0.88,
    distance: 29.2,
    diameter: '6,779 km',
    distanceText: '227.9 millones km',
    yearText: '687 días',
    temperature: '≈ −63 °C',
    orbitPeriod: 686.98,
    rotationHours: 24.623,
    axialTilt: 25.19,
    inclination: 1.85,
    eccentricity: 0.0934,
    initialAngle: 1.2,
    texture: 'rocky',
    colors: ['#6e2b18', '#a84827', '#d27a48', '#4b2118'],
    atmosphere: { color: '#db7652', intensity: 0.25 },
    moons: [
      { name: 'Fobos', radius: 0.09, distance: 1.5, orbitPeriod: 0.32, colors: ['#72665c', '#403934'], initialAngle: 2.1 },
      { name: 'Deimos', radius: 0.065, distance: 1.9, orbitPeriod: 1.26, colors: ['#8c8177', '#4e4742'], initialAngle: 5.2 }
    ],
    description: 'El planeta rojo, marcado por volcanes gigantes, cañones y antiguos cauces de agua.'
  },
  {
    name: 'Júpiter',
    type: 'Gigante gaseoso',
    radius: 3.72,
    distance: 41.5,
    diameter: '139,820 km',
    distanceText: '778.5 millones km',
    yearText: '11.86 años',
    temperature: '≈ −110 °C',
    orbitPeriod: 4332.59,
    rotationHours: 9.925,
    axialTilt: 3.13,
    inclination: 1.3,
    eccentricity: 0.0489,
    initialAngle: 3.4,
    texture: 'gasBands',
    colors: ['#6f4d38', '#d5b795', '#f0dfbf', '#9e7051', '#532c24'],
    atmosphere: { color: '#d9b38c', intensity: 0.2 },
    moons: [
      { name: 'Ío', radius: 0.2, distance: 4.7, orbitPeriod: 1.77, colors: ['#d6bd53', '#92732d', '#f0df8d'], initialAngle: 0.1 },
      { name: 'Europa', radius: 0.18, distance: 5.6, orbitPeriod: 3.55, colors: ['#b9a989', '#e4ddc9', '#786a56'], initialAngle: 1.9 },
      { name: 'Ganímedes', radius: 0.25, distance: 6.8, orbitPeriod: 7.15, colors: ['#75695d', '#a99a88', '#514942'], initialAngle: 3.7 },
      { name: 'Calisto', radius: 0.23, distance: 8.0, orbitPeriod: 16.69, colors: ['#5c5147', '#8f7e6c', '#342e2a'], initialAngle: 5.3 }
    ],
    description: 'El planeta más grande, con bandas turbulentas y la Gran Mancha Roja.'
  },
  {
    name: 'Saturno',
    type: 'Gigante gaseoso',
    radius: 3.2,
    distance: 56.5,
    diameter: '116,460 km',
    distanceText: '1,434 millones km',
    yearText: '29.45 años',
    temperature: '≈ −140 °C',
    orbitPeriod: 10759.22,
    rotationHours: 10.7,
    axialTilt: 26.73,
    inclination: 2.49,
    eccentricity: 0.0565,
    initialAngle: 5.7,
    texture: 'gasBands',
    colors: ['#a78955', '#ead7a0', '#c3a56b', '#f5e7bd', '#80683f'],
    atmosphere: { color: '#ead69f', intensity: 0.14 },
    rings: { inner: 1.32, outer: 2.35, color: '#d8c39c', opacity: 0.88 },
    moons: [
      { name: 'Titán', radius: 0.27, distance: 5.7, orbitPeriod: 15.95, colors: ['#b77932', '#e0ad55', '#75471f'], initialAngle: 2.4 }
    ],
    description: 'Famoso por su complejo sistema de anillos compuesto de hielo y roca.'
  },
  {
    name: 'Urano',
    type: 'Gigante de hielo',
    radius: 2.25,
    distance: 71.5,
    diameter: '50,724 km',
    distanceText: '2,871 millones km',
    yearText: '84 años',
    temperature: '≈ −195 °C',
    orbitPeriod: 30688.5,
    rotationHours: -17.24,
    axialTilt: 97.77,
    inclination: 0.77,
    eccentricity: 0.0457,
    initialAngle: 2.8,
    texture: 'ice',
    colors: ['#65b9c2', '#9adce0', '#4b9ca8'],
    atmosphere: { color: '#86e4ea', intensity: 0.45 },
    rings: { inner: 1.38, outer: 1.78, color: '#87aeb1', opacity: 0.45 },
    description: 'Un gigante azul verdoso que rota prácticamente acostado sobre su órbita.'
  },
  {
    name: 'Neptuno',
    type: 'Gigante de hielo',
    radius: 2.18,
    distance: 86.5,
    diameter: '49,244 km',
    distanceText: '4,495 millones km',
    yearText: '164.8 años',
    temperature: '≈ −200 °C',
    orbitPeriod: 60182,
    rotationHours: 16.11,
    axialTilt: 28.32,
    inclination: 1.77,
    eccentricity: 0.0113,
    initialAngle: 4.9,
    texture: 'iceBands',
    colors: ['#0d2b81', '#1e58bd', '#397fe0', '#0a1d5d'],
    atmosphere: { color: '#347cff', intensity: 0.55 },
    description: 'El planeta más lejano, azotado por algunos de los vientos más rápidos del sistema.'
  }
];

export const BODY_STATS = {
  Sol: { gravity: '274 m/s²', day: '25–35 días', moons: '8 planetas', fact: 'Concentra cerca del 99.86% de la masa del sistema.' },
  Mercurio: { gravity: '3.7 m/s²', day: '58.6 días', moons: '0 lunas', fact: 'Un día solar dura más que su año.' },
  Venus: { gravity: '8.87 m/s²', day: '243 días', moons: '0 lunas', fact: 'Gira en sentido contrario a la mayoría de los planetas.' },
  Tierra: { gravity: '9.81 m/s²', day: '23 h 56 min', moons: '1 luna', fact: 'El único mundo conocido con vida y océanos superficiales.' },
  Marte: { gravity: '3.71 m/s²', day: '24 h 37 min', moons: '2 lunas', fact: 'Olympus Mons es el volcán más alto conocido del sistema.' },
  Júpiter: { gravity: '24.79 m/s²', day: '9 h 56 min', moons: '95+ lunas', fact: 'Su Gran Mancha Roja es una tormenta mayor que la Tierra.' },
  Saturno: { gravity: '10.44 m/s²', day: '10 h 42 min', moons: '140+ lunas', fact: 'Sus anillos son extensos, pero sorprendentemente delgados.' },
  Urano: { gravity: '8.69 m/s²', day: '17 h 14 min', moons: '27 lunas', fact: 'Su eje está inclinado casi 98 grados.' },
  Neptuno: { gravity: '11.15 m/s²', day: '16 h 6 min', moons: '14 lunas', fact: 'Sus vientos pueden superar los 2,000 km/h.' }
};
