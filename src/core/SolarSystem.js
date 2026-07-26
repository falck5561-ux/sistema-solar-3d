import * as THREE from 'three';
import { PLANETS, SUN_INFO } from '../data/bodies.js';
import { BalletDancer } from '../graphics/BalletDancer.js';
import {
  createCloudTexture,
  createPlanetTexture,
  createRadialGlowTexture,
  createRingTexture,
  createStarTexture
} from '../graphics/textures.js';
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
  sunFragmentShader,
  sunVertexShader
} from '../graphics/shaders.js';

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

function createOrbitGeometry(distance, eccentricity, segments = 320) {
  const semiMajor = distance;
  const semiMinor = distance * Math.sqrt(1 - eccentricity * eccentricity);
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * TWO_PI;
    points.push(
      new THREE.Vector3(
        semiMajor * (Math.cos(angle) - eccentricity),
        0,
        semiMinor * Math.sin(angle)
      )
    );
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

function solveOrbitPosition(distance, eccentricity, angle, target = new THREE.Vector3()) {
  const semiMinor = distance * Math.sqrt(1 - eccentricity * eccentricity);
  target.set(
    distance * (Math.cos(angle) - eccentricity),
    0,
    semiMinor * Math.sin(angle)
  );
  return target;
}

function createAtmosphere(radius, atmosphere) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(atmosphere.color) },
      uIntensity: { value: atmosphere.intensity }
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.09, 64, 64),
    material
  );
  mesh.renderOrder = 2;
  return mesh;
}

function createRing(radius, config) {
  const inner = radius * config.inner;
  const outer = radius * config.outer;
  const geometry = new THREE.RingGeometry(inner, outer, 256, 6);
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const radial = (Math.sqrt(x * x + y * y) - inner) / (outer - inner);
    uvs.setXY(i, radial, 0.5);
  }

  const material = new THREE.MeshStandardMaterial({
    map: createRingTexture(config.color),
    color: config.color,
    transparent: true,
    opacity: config.opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.82,
    metalness: 0.04,
    alphaTest: 0.025
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  ring.receiveShadow = true;
  ring.renderOrder = 1;
  return ring;
}

function createMoonTexture(moon) {
  return createPlanetTexture(
    moon.name,
    'rocky',
    moon.colors ?? ['#777', '#aaa', '#444'],
    256
  );
}

export class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.clockBodies = [];
    this.selectableMeshes = [];
    this.bodies = new Map();
    this.orbitLines = [];
    this.planetScale = 1;
    this.tempVector = new THREE.Vector3();
    this.selectedBodyName = 'Sol';
    this.earthBalletEnabled = true;
    this.hoveredBodyName = null;
    this.trailsVisible = true;
    this.shootingStars = [];
    this.nebulae = [];
    this.solarFlares = [];

    this.root = new THREE.Group();
    this.root.name = 'Sistema Solar';
    scene.add(this.root);

    this.createLighting();
    this.createStars();
    this.createNebulae();
    this.createShootingStars();
    this.createSun();
    this.createPlanets();
    this.createEarthBallet();
    this.createAsteroidBelt();
    this.createComet();
  }

  createLighting() {
    const ambient = new THREE.HemisphereLight(0x20325a, 0x080302, 0.27);
    this.scene.add(ambient);

    const sunlight = new THREE.PointLight(0xffd7a3, 8500, 0, 1.55);
    sunlight.position.set(0, 0, 0);
    sunlight.castShadow = false;
    this.root.add(sunlight);
  }

  createStars() {
    const starTexture = createStarTexture();

    const makeLayer = (count, minRadius, maxRadius, size, opacity) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const random = THREE.MathUtils.seededRandom;

      for (let i = 0; i < count; i += 1) {
        const radius = minRadius + random() * (maxRadius - minRadius);
        const theta = random() * TWO_PI;
        const phi = Math.acos(2 * random() - 1);
        const index = i * 3;
        positions[index] = radius * Math.sin(phi) * Math.cos(theta);
        positions[index + 1] = radius * Math.cos(phi);
        positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);

        const tint = random();
        colors[index] = 0.72 + tint * 0.28;
        colors[index + 1] = 0.78 + tint * 0.22;
        colors[index + 2] = 0.9 + random() * 0.1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size,
        map: starTexture,
        transparent: true,
        opacity,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      return new THREE.Points(geometry, material);
    };

    this.starLayerFar = makeLayer(5200, 230, 880, 1.35, 0.82);
    this.starLayerNear = makeLayer(1100, 130, 330, 0.72, 0.48);
    this.scene.add(this.starLayerFar, this.starLayerNear);

    const galacticGeometry = new THREE.BufferGeometry();
    const dustCount = 3400;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i += 1) {
      const index = i * 3;
      const radius = 180 + Math.random() * 540;
      const angle = Math.random() * TWO_PI;
      const y = (Math.random() - 0.5) * 55 + Math.sin(angle * 2.2) * 12;
      dustPositions[index] = Math.cos(angle) * radius;
      dustPositions[index + 1] = y;
      dustPositions[index + 2] = Math.sin(angle) * radius;
      dustColors[index] = 0.22 + Math.random() * 0.18;
      dustColors[index + 1] = 0.27 + Math.random() * 0.2;
      dustColors[index + 2] = 0.42 + Math.random() * 0.28;
    }

    galacticGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    galacticGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    const galacticMaterial = new THREE.PointsMaterial({
      size: 2.1,
      transparent: true,
      opacity: 0.13,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.galacticDust = new THREE.Points(galacticGeometry, galacticMaterial);
    this.galacticDust.rotation.z = 18 * DEG;
    this.scene.add(this.galacticDust);
  }


  createNebulae() {
    const texture = createRadialGlowTexture(512);
    const configs = [
      { position: [-260, 95, -390], scale: [300, 180], color: 0x3155b8, opacity: 0.045 },
      { position: [330, -80, -470], scale: [350, 210], color: 0x8f3fa8, opacity: 0.036 },
      { position: [-420, -120, 160], scale: [280, 160], color: 0x217f91, opacity: 0.03 }
    ];

    configs.forEach((config, index) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        rotation: index * 0.75
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...config.position);
      sprite.scale.set(config.scale[0], config.scale[1], 1);
      this.scene.add(sprite);
      this.nebulae.push(sprite);
    });
  }

  createShootingStars() {
    for (let i = 0; i < 5; i += 1) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -12, 0, 0], 3));
      const material = new THREE.LineBasicMaterial({
        color: i % 2 ? 0xa9d6ff : 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.scene.add(line);
      this.shootingStars.push({
        line,
        speed: 68 + Math.random() * 48,
        life: 0,
        delay: 2 + Math.random() * 13,
        direction: new THREE.Vector3(-1, -0.25, 0.15).normalize()
      });
    }
  }

  createSun() {
    const sunUniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      uniforms: sunUniforms,
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
      toneMapped: false
    });

    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(5.25, 96, 96), material);
    sunMesh.name = 'Sol';
    sunMesh.userData.selectable = true;
    sunGroup.add(sunMesh);

    const glowMaterial = new THREE.SpriteMaterial({
      map: createRadialGlowTexture(),
      color: 0xff8a22,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(21);
    sunGroup.add(glow);

    const outerGlow = new THREE.Sprite(
      glowMaterial.clone()
    );
    outerGlow.material.opacity = 0.24;
    outerGlow.material.color.set(0xff3b08);
    outerGlow.scale.setScalar(34);
    sunGroup.add(outerGlow);

    const coronaGeometry = new THREE.BufferGeometry();
    const coronaCount = 900;
    const coronaPositions = new Float32Array(coronaCount * 3);
    for (let i = 0; i < coronaCount; i += 1) {
      const angle = Math.random() * TWO_PI;
      const radius = 5.7 + Math.pow(Math.random(), 2) * 3.8;
      const index = i * 3;
      coronaPositions[index] = Math.cos(angle) * radius;
      coronaPositions[index + 1] = (Math.random() - 0.5) * 1.1;
      coronaPositions[index + 2] = Math.sin(angle) * radius;
    }
    coronaGeometry.setAttribute('position', new THREE.BufferAttribute(coronaPositions, 3));
    const corona = new THREE.Points(
      coronaGeometry,
      new THREE.PointsMaterial({
        size: 0.28,
        map: createStarTexture(),
        color: 0xff8d31,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    sunGroup.add(corona);
    this.sunCorona = corona;

    [0.78, 1.12, 1.42].forEach((arc, index) => {
      const flare = new THREE.Mesh(
        new THREE.TorusGeometry(6.25 + index * 0.22, 0.065 + index * 0.018, 6, 96, arc),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? 0xffc05e : 0xff6f1f,
          transparent: true,
          opacity: 0.42 - index * 0.08,
          blending: THREE.NormalBlending,
          depthWrite: false,
          depthTest: true
        })
      );
      flare.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      sunGroup.add(flare);
      this.solarFlares.push(flare);
    });

    const selectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.selectionRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.2, 128), selectionMaterial);
    this.selectionRing.visible = false;
    this.selectionRing.renderOrder = 8;
    this.root.add(this.selectionRing);

    this.root.add(sunGroup);
    this.sunUniforms = sunUniforms;
    this.sunGlow = glow;
    this.outerSunGlow = outerGlow;

    const body = {
      name: 'Sol',
      object: sunGroup,
      mesh: sunMesh,
      radius: 5.25,
      baseRadius: 5.25,
      info: SUN_INFO,
      kind: 'sun'
    };
    sunMesh.userData.bodyRef = body;
    this.bodies.set(body.name, body);
    this.selectableMeshes.push(sunMesh);
  }

  createPlanets() {
    const sphereGeometryCache = new Map();

    PLANETS.forEach((data) => {
      const orbitRoot = new THREE.Group();
      orbitRoot.rotation.x = data.inclination * DEG;
      orbitRoot.rotation.z = data.inclination * 0.18 * DEG;
      orbitRoot.name = `Órbita de ${data.name}`;
      this.root.add(orbitRoot);

      const orbitLine = new THREE.LineLoop(
        createOrbitGeometry(data.distance, data.eccentricity),
        new THREE.LineBasicMaterial({
          color: data.name === 'Tierra' ? 0x4f83c4 : 0x53637c,
          transparent: true,
          opacity: data.name === 'Tierra' ? 0.34 : 0.2,
          depthWrite: false
        })
      );
      orbitRoot.add(orbitLine);
      this.orbitLines.push(orbitLine);

      const trailGeometry = new THREE.BufferGeometry();
      const trailSegments = 72;
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(trailSegments * 3), 3));
      const trailLine = new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(data.colors[Math.min(1, data.colors.length - 1)]),
          transparent: true,
          opacity: 0.46,
          blending: THREE.NormalBlending,
          depthWrite: false,
          depthTest: true
        })
      );
      trailLine.frustumCulled = false;
      orbitRoot.add(trailLine);

      const carrier = new THREE.Group();
      orbitRoot.add(carrier);

      const axialGroup = new THREE.Group();
      axialGroup.rotation.z = data.axialTilt * DEG;
      carrier.add(axialGroup);

      const geometryKey = Math.round(data.radius * 10);
      let geometry = sphereGeometryCache.get(geometryKey);
      if (!geometry) {
        geometry = new THREE.SphereGeometry(data.radius, 64, 64);
        sphereGeometryCache.set(geometryKey, geometry);
      }

      const texture = createPlanetTexture(data.name, data.texture, data.colors);
      const planetMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: data.texture.includes('ice') ? 0.72 : 0.92,
        metalness: 0.01,
        envMapIntensity: 0.22
      });
      const mesh = new THREE.Mesh(geometry, planetMaterial);
      mesh.name = data.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      axialGroup.add(mesh);

      const body = {
        name: data.name,
        object: carrier,
        mesh,
        axialGroup,
        orbitRoot,
        orbitLine,
        trailLine,
        trailSegments,
        data,
        info: {
          name: data.name,
          type: data.type,
          diameter: data.diameter,
          distance: data.distanceText,
          year: data.yearText,
          temperature: data.temperature,
          description: data.description
        },
        radius: data.radius,
        baseRadius: data.radius,
        kind: 'planet',
        cloudMesh: null,
        atmosphereMesh: null,
        moonBodies: []
      };

      mesh.userData.selectable = true;
      mesh.userData.bodyRef = body;
      this.selectableMeshes.push(mesh);
      this.bodies.set(data.name, body);
      this.clockBodies.push(body);

      if (data.atmosphere) {
        body.atmosphereMesh = createAtmosphere(data.radius, data.atmosphere);
        axialGroup.add(body.atmosphereMesh);
      }

      if (data.clouds) {
        const cloudMaterial = new THREE.MeshStandardMaterial({
          map: createCloudTexture(),
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          roughness: 1,
          side: THREE.DoubleSide
        });
        const cloudMesh = new THREE.Mesh(
          new THREE.SphereGeometry(data.radius * 1.018, 64, 64),
          cloudMaterial
        );
        cloudMesh.renderOrder = 1;
        axialGroup.add(cloudMesh);
        body.cloudMesh = cloudMesh;
      }

      if (data.rings) {
        const ring = createRing(data.radius, data.rings);
        axialGroup.add(ring);
        body.ring = ring;
      }

      if (data.moons) {
        data.moons.forEach((moonData, moonIndex) => {
          const moonOrbitRoot = new THREE.Group();
          moonOrbitRoot.rotation.x = (2 + moonIndex * 1.9) * DEG;
          carrier.add(moonOrbitRoot);

          const moonCarrier = new THREE.Group();
          moonOrbitRoot.add(moonCarrier);

          const moon = new THREE.Mesh(
            new THREE.SphereGeometry(moonData.radius, 32, 32),
            new THREE.MeshStandardMaterial({
              map: createMoonTexture(moonData),
              roughness: 1,
              metalness: 0
            })
          );
          moon.castShadow = true;
          moon.receiveShadow = true;
          moonCarrier.add(moon);

          const moonOrbit = new THREE.LineLoop(
            createOrbitGeometry(moonData.distance, 0, 96),
            new THREE.LineBasicMaterial({
              color: 0x7b8797,
              transparent: true,
              opacity: 0.12,
              depthWrite: false
            })
          );
          moonOrbitRoot.add(moonOrbit);
          this.orbitLines.push(moonOrbit);

          body.moonBodies.push({
            data: moonData,
            mesh: moon,
            carrier: moonCarrier,
            orbitRoot: moonOrbitRoot,
            orbitLine: moonOrbit
          });
        });
      }
    });
  }


  createEarthBallet() {
    const earth = this.getBody('Tierra');
    if (!earth) return;
    this.earthBallet = new BalletDancer(earth.baseRadius);
    earth.axialGroup.add(this.earthBallet.root);
    this.earthBallet.setSelected(this.selectedBodyName === 'Tierra');

    this.earthBalletHalo = new THREE.Group();
    this.earthBalletHalo.visible = false;
    earth.axialGroup.add(this.earthBalletHalo);
    const haloConfigs = [
      { radius: earth.baseRadius * 1.42, tube: 0.008, color: 0x75b88e, opacity: 0.07, rotation: [1.15, 0.2, 0.42] },
      { radius: earth.baseRadius * 1.62, tube: 0.006, color: 0xd1c46d, opacity: 0.045, rotation: [0.7, 0.8, -0.5] }
    ];
    this.earthBalletHalo.userData.rings = haloConfigs.map((config) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(config.radius, config.tube, 8, 180),
        new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: 0,
          blending: THREE.NormalBlending,
          depthWrite: false,
          depthTest: true
        })
      );
      ring.rotation.set(...config.rotation);
      ring.userData.baseOpacity = config.opacity;
      this.earthBalletHalo.add(ring);
      return ring;
    });
  }

  createAsteroidBelt() {
    const count = 1800;
    const geometry = new THREE.IcosahedronGeometry(0.075, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x71665d,
      roughness: 1,
      metalness: 0.03
    });
    const belt = new THREE.InstancedMesh(geometry, material, count);
    belt.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    belt.name = 'Cinturón de asteroides';

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TWO_PI;
      const radius = 34.2 + Math.random() * 4.1 + Math.sin(angle * 7) * 0.4;
      const y = (Math.random() - 0.5) * 1.65;
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.rotation.set(Math.random() * TWO_PI, Math.random() * TWO_PI, Math.random() * TWO_PI);
      const scale = 0.45 + Math.pow(Math.random(), 2) * 2.4;
      dummy.scale.set(scale * (0.65 + Math.random()), scale, scale * (0.65 + Math.random()));
      dummy.updateMatrix();
      belt.setMatrixAt(i, dummy.matrix);
    }
    belt.instanceMatrix.needsUpdate = true;
    this.root.add(belt);
    this.asteroidBelt = belt;
  }

  createComet() {
    const group = new THREE.Group();
    group.name = 'Cometa';

    const nucleus = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 2),
      new THREE.MeshStandardMaterial({
        color: 0x8b8e90,
        roughness: 0.95,
        emissive: 0x101820,
        emissiveIntensity: 0.6
      })
    );
    group.add(nucleus);

    const coma = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture(),
        color: 0xa7d9ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    coma.scale.setScalar(2.4);
    group.add(coma);

    const tailGeometry = new THREE.ConeGeometry(0.55, 11, 18, 1, true);
    tailGeometry.translate(0, -5.5, 0);
    const tail = new THREE.Mesh(
      tailGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x81c8ff,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = 0.35;
    group.add(tail);

    this.root.add(group);
    this.comet = { group, nucleus, tail };
  }

  update(simulationDays, deltaSeconds, elapsedSeconds) {
    this.sunUniforms.uTime.value = elapsedSeconds;
    this.sunGlow.material.opacity = 0.67 + Math.sin(elapsedSeconds * 1.7) * 0.04;
    this.outerSunGlow.material.opacity = 0.22 + Math.sin(elapsedSeconds * 0.72) * 0.025;
    this.starLayerFar.rotation.y = elapsedSeconds * 0.0007;
    this.starLayerNear.rotation.y = -elapsedSeconds * 0.0013;
    this.galacticDust.rotation.y = elapsedSeconds * 0.00012;
    this.sunCorona.rotation.y = elapsedSeconds * 0.075;
    this.sunCorona.rotation.z = elapsedSeconds * 0.024;
    this.solarFlares.forEach((flare, index) => {
      flare.rotation.z += deltaSeconds * (0.04 + index * 0.018);
      flare.material.opacity = 0.24 + Math.sin(elapsedSeconds * (0.7 + index * 0.21) + index) * 0.11;
    });
    this.nebulae.forEach((nebula, index) => {
      nebula.material.rotation += deltaSeconds * (index % 2 ? -0.002 : 0.0015);
      nebula.material.opacity += (0.028 + Math.sin(elapsedSeconds * 0.16 + index) * 0.012 - nebula.material.opacity) * 0.015;
    });

    this.shootingStars.forEach((star) => {
      star.delay -= deltaSeconds;
      if (star.delay <= 0 && star.life <= 0) {
        star.line.visible = true;
        star.life = 1.05;
        star.line.position.set(120 + Math.random() * 180, 30 + Math.random() * 130, -180 - Math.random() * 240);
        star.direction.set(-1, -0.18 - Math.random() * 0.2, 0.05 + Math.random() * 0.18).normalize();
        star.line.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), star.direction);
      }
      if (star.life > 0) {
        star.life -= deltaSeconds;
        star.line.position.addScaledVector(star.direction, star.speed * deltaSeconds);
        star.line.material.opacity = Math.sin(Math.max(0, star.life) * Math.PI) * 0.72;
        if (star.life <= 0) {
          star.line.visible = false;
          star.delay = 5 + Math.random() * 16;
        }
      }
    });

    this.earthBallet?.update(elapsedSeconds, deltaSeconds);
    if (this.earthBalletHalo) {
      const haloActive = this.selectedBodyName === 'Tierra' && this.earthBalletEnabled;
      this.earthBalletHalo.visible = haloActive;
      this.earthBalletHalo.rotation.y = elapsedSeconds * 0.12;
      this.earthBalletHalo.rotation.x = Math.sin(elapsedSeconds * 0.22) * 0.08;
      this.earthBalletHalo.userData.rings.forEach((ring, index) => {
        ring.rotation.z += deltaSeconds * (index % 2 ? -0.18 : 0.13) * (index + 1);
        ring.material.opacity = haloActive
          ? ring.userData.baseOpacity + Math.sin(elapsedSeconds * (0.72 + index * 0.18) + index) * 0.012
          : 0;
      });
    }

    this.clockBodies.forEach((body) => {
      const { data } = body;
      const orbitAngle = data.initialAngle + (simulationDays / data.orbitPeriod) * TWO_PI;
      solveOrbitPosition(data.distance, data.eccentricity, orbitAngle, body.object.position);

      if (body.trailLine && this.trailsVisible) {
        const positions = body.trailLine.geometry.attributes.position;
        const trailSpan = data.name === 'Mercurio' ? 1.1 : 0.62;
        for (let i = 0; i < body.trailSegments; i += 1) {
          const progress = i / (body.trailSegments - 1);
          const sampleAngle = orbitAngle - trailSpan * (1 - progress);
          solveOrbitPosition(data.distance, data.eccentricity, sampleAngle, this.tempVector);
          positions.setXYZ(i, this.tempVector.x, this.tempVector.y, this.tempVector.z);
        }
        positions.needsUpdate = true;
      }

      const rotationDirection = Math.sign(data.rotationHours) || 1;
      const visualRotationRate = THREE.MathUtils.clamp(24 / Math.abs(data.rotationHours), 0.025, 2.4);
      body.mesh.rotation.y += deltaSeconds * visualRotationRate * rotationDirection * 0.82;

      if (body.cloudMesh) {
        body.cloudMesh.rotation.y += deltaSeconds * 0.055;
      }

      body.moonBodies.forEach((moonBody) => {
        const moonAngle =
          moonBody.data.initialAngle +
          (simulationDays / moonBody.data.orbitPeriod) * TWO_PI;
        moonBody.carrier.position.set(
          Math.cos(moonAngle) * moonBody.data.distance,
          Math.sin(moonAngle * 0.37) * 0.06,
          Math.sin(moonAngle) * moonBody.data.distance
        );
        moonBody.mesh.rotation.y += deltaSeconds * 0.32;
      });
    });

    const selected = this.getBody(this.selectedBodyName);
    if (selected && this.selectionRing) {
      this.getBodyWorldPosition(selected, this.tempVector);
      this.selectionRing.position.copy(this.tempVector);
      const baseRadius = selected.kind === 'planet' ? selected.baseRadius * this.planetScale : selected.baseRadius;
      const pulse = 1 + Math.sin(elapsedSeconds * 2.2) * 0.045;
      this.selectionRing.scale.setScalar(baseRadius * 1.5 * pulse);
      this.selectionRing.material.opacity = 0.36 + Math.sin(elapsedSeconds * 2.2) * 0.14;
      this.selectionRing.visible = true;
      if (selected.kind === 'planet') selected.orbitLine.material.opacity += (0.48 - selected.orbitLine.material.opacity) * 0.08;
    }

    if (this.asteroidBelt) {
      this.asteroidBelt.rotation.y = simulationDays * 0.00019;
    }

    if (this.comet) {
      const angle = simulationDays * 0.0038 + 1.4;
      const a = 96;
      const b = 21;
      this.comet.group.position.set(
        Math.cos(angle) * a - 38,
        Math.sin(angle * 0.61) * 7,
        Math.sin(angle) * b
      );
      const awayFromSun = this.comet.group.position.clone().normalize();
      this.comet.group.quaternion.setFromUnitVectors(
        new THREE.Vector3(-1, 0, 0),
        awayFromSun
      );
      this.comet.nucleus.rotation.x += deltaSeconds * 0.35;
      this.comet.nucleus.rotation.y += deltaSeconds * 0.57;
    }
  }


  setSelectedBody(name) {
    this.selectedBodyName = name;
    this.earthBallet?.setSelected(name === 'Tierra');
    this.clockBodies.forEach((body) => {
      const selected = body.name === name;
      body.orbitLine.material.opacity = selected ? 0.5 : (body.name === 'Tierra' ? 0.34 : 0.2);
      if (body.trailLine) body.trailLine.material.opacity = selected ? 0.82 : 0.38;
      body.mesh.material.emissive = body.mesh.material.emissive || new THREE.Color(0x000000);
      body.mesh.material.emissive.set(selected ? body.data.colors[0] : 0x000000);
      body.mesh.material.emissiveIntensity = selected ? 0.055 : 0;
    });
  }

  setHoveredBody(name) {
    if (this.hoveredBodyName === name) return;
    const previous = this.getBody(this.hoveredBodyName);
    if (previous?.kind === 'planet' && previous.name !== this.selectedBodyName) {
      previous.mesh.material.emissive?.set(0x000000);
      previous.mesh.material.emissiveIntensity = 0;
    }
    this.hoveredBodyName = name;
    const next = this.getBody(name);
    if (next?.kind === 'planet' && next.name !== this.selectedBodyName) {
      next.mesh.material.emissive = next.mesh.material.emissive || new THREE.Color(0x000000);
      next.mesh.material.emissive.set(next.data.colors[1] || next.data.colors[0]);
      next.mesh.material.emissiveIntensity = 0.12;
    }
  }

  faceSelectionRing(camera) {
    if (this.selectionRing?.visible) this.selectionRing.quaternion.copy(camera.quaternion);
  }


  setEarthBalletEnabled(enabled) {
    this.earthBalletEnabled = enabled;
    this.earthBallet?.setEnabled(enabled);
  }

  getEarthBalletWorldPosition(target = new THREE.Vector3()) {
    if (!this.earthBallet) return this.getBodyWorldPosition(this.getBody('Tierra'), target);
    return this.earthBallet.getWorldFocusPosition(target);
  }

  setTrailsVisible(visible) {
    this.trailsVisible = visible;
    this.clockBodies.forEach((body) => {
      if (body.trailLine) body.trailLine.visible = visible;
    });
  }

  setPlanetScale(scale) {
    this.planetScale = scale;
    this.clockBodies.forEach((body) => {
      body.axialGroup.scale.setScalar(scale);
    });
  }

  setOrbitsVisible(visible) {
    this.orbitLines.forEach((line) => {
      line.visible = visible;
    });
  }

  setAsteroidsVisible(visible) {
    if (this.asteroidBelt) this.asteroidBelt.visible = visible;
  }

  getBody(name) {
    return this.bodies.get(name);
  }

  getBodies() {
    return [...this.bodies.values()];
  }

  getBodyWorldPosition(body, target = new THREE.Vector3()) {
    body.object.getWorldPosition(target);
    return target;
  }

  raycast(raycaster) {
    const intersections = raycaster.intersectObjects(this.selectableMeshes, false);
    return intersections.length ? intersections[0].object.userData.bodyRef : null;
  }
}
