import * as THREE from 'three';
import { createRadialGlowTexture, createStarTexture } from './textures.js';

const TWO_PI = Math.PI * 2;

function damp(current, target, lambda, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));
}

function smoothStep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function createTaperedLimb(length, topRadius, bottomRadius, material) {
  const pivot = new THREE.Group();
  const geometry = new THREE.CylinderGeometry(bottomRadius, topRadius, length, 20, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -length * 0.5;
  mesh.castShadow = true;
  pivot.add(mesh);

  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(topRadius * 1.03, 18, 14),
    material
  );
  joint.scale.y = 0.88;
  pivot.add(joint);

  return { pivot, mesh, joint, length };
}

function attachLimb(parent, limb, position) {
  limb.pivot.position.copy(position);
  parent.add(limb.pivot);
  return limb;
}

function createRoundedHand(material) {
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.047, 18, 14), material);
  palm.scale.set(0.82, 1.15, 0.55);
  hand.add(palm);

  const fingers = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.022, 0.07, 5, 10),
    material
  );
  fingers.position.y = -0.055;
  fingers.scale.set(0.76, 1, 0.52);
  hand.add(fingers);
  return hand;
}

function lerpRotation(target, from, to, amount) {
  target.x = THREE.MathUtils.lerp(from[0], to[0], amount);
  target.y = THREE.MathUtils.lerp(from[1], to[1], amount);
  target.z = THREE.MathUtils.lerp(from[2], to[2], amount);
}

const POSES = [
  {
    time: 0,
    leftUpperArm: [0.08, 0.08, -0.58], rightUpperArm: [0.08, -0.08, 0.58],
    leftForearm: [0.02, 0, -0.34], rightForearm: [0.02, 0, 0.34],
    leftThigh: [-0.02, 0.03, -0.03], rightThigh: [-0.03, -0.03, 0.08],
    leftShin: [0.04, 0, 0], rightShin: [0.07, 0, 0.02],
    torso: [0, 0, 0.018], head: [0, -0.08, -0.018], turn: 0
  },
  {
    time: 0.18,
    leftUpperArm: [0.18, 0.08, -1.38], rightUpperArm: [0.18, -0.08, 1.38],
    leftForearm: [0.03, 0, -0.13], rightForearm: [0.03, 0, 0.13],
    leftThigh: [-0.04, 0.02, -0.02], rightThigh: [-0.04, -0.02, 0.05],
    leftShin: [0.05, 0, 0], rightShin: [0.06, 0, 0],
    torso: [0.02, 0, -0.025], head: [-0.02, 0.22, 0.035], turn: 0.32
  },
  {
    time: 0.38,
    leftUpperArm: [-0.12, 0.14, -1.18], rightUpperArm: [0.36, -0.18, 1.02],
    leftForearm: [-0.08, 0, -0.18], rightForearm: [0.08, 0, 0.26],
    leftThigh: [-0.05, 0, -0.03], rightThigh: [-1.08, 0.16, 0.18],
    leftShin: [0.08, 0, 0], rightShin: [0.34, 0.02, 0.08],
    torso: [0.07, -0.08, -0.06], head: [-0.05, 0.34, 0.04], turn: 0.82
  },
  {
    time: 0.56,
    leftUpperArm: [0.24, 0.05, -2.48], rightUpperArm: [0.24, -0.05, 2.48],
    leftForearm: [0.02, 0, 0.48], rightForearm: [0.02, 0, -0.48],
    leftThigh: [-0.05, 0, -0.02], rightThigh: [-0.14, 0.12, 0.74],
    leftShin: [0.08, 0, 0], rightShin: [1.28, 0.05, -0.08],
    torso: [-0.02, 0.04, 0.015], head: [-0.06, -0.2, -0.02], turn: 1.48
  },
  {
    time: 0.73,
    leftUpperArm: [0.28, 0.06, -0.78], rightUpperArm: [0.28, -0.06, 0.78],
    leftForearm: [0.04, 0, -0.62], rightForearm: [0.04, 0, 0.62],
    leftThigh: [-0.04, 0, -0.02], rightThigh: [-0.38, 0.06, 0.82],
    leftShin: [0.05, 0, 0], rightShin: [1.44, 0, -0.1],
    torso: [0, 0.02, -0.025], head: [0.02, 0.1, 0.025], turn: 2.05
  },
  {
    time: 0.88,
    leftUpperArm: [0.14, 0.04, -1.5], rightUpperArm: [0.14, -0.04, 1.5],
    leftForearm: [0.04, 0, -0.04], rightForearm: [0.04, 0, 0.04],
    leftThigh: [-0.03, 0, -0.04], rightThigh: [-0.02, 0, 0.1],
    leftShin: [0.05, 0, 0], rightShin: [0.05, 0, 0],
    torso: [0.02, 0, 0.035], head: [-0.02, -0.28, -0.035], turn: 2.58
  },
  {
    time: 1,
    leftUpperArm: [0.08, 0.08, -0.58], rightUpperArm: [0.08, -0.08, 0.58],
    leftForearm: [0.02, 0, -0.34], rightForearm: [0.02, 0, 0.34],
    leftThigh: [-0.02, 0.03, -0.03], rightThigh: [-0.03, -0.03, 0.08],
    leftShin: [0.04, 0, 0], rightShin: [0.07, 0, 0.02],
    torso: [0, 0, 0.018], head: [0, -0.08, -0.018], turn: TWO_PI
  }
];

export class BalletDancer {
  constructor(planetRadius = 1.16) {
    this.enabled = true;
    this.selected = false;
    this.visibility = 0;

    this.root = new THREE.Group();
    this.root.name = 'Bailarina luciérnaga de la Tierra';
    this.root.position.y = planetRadius * 1.045;
    this.root.visible = false;

    this.worldAnchor = new THREE.Object3D();
    this.worldAnchor.position.set(0, 0.92, 0);
    this.root.add(this.worldAnchor);

    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0c7bd,
      roughness: 0.68,
      metalness: 0
    });
    this.tightsMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8d7c7,
      roughness: 0.74,
      metalness: 0
    });
    this.bodiceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x245d49,
      roughness: 0.44,
      metalness: 0.03,
      clearcoat: 0.24,
      clearcoatRoughness: 0.68,
      emissive: 0x071b13,
      emissiveIntensity: 0.11
    });
    this.skirtMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x2f6f55, roughness: 0.8, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x214f45, roughness: 0.78, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x173b38, roughness: 0.76, side: THREE.DoubleSide })
    ];
    this.shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4b725d,
      roughness: 0.6,
      metalness: 0.01
    });
    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x241a20,
      roughness: 0.88,
      metalness: 0
    });
    this.eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x171117, roughness: 0.9 });
    this.lipMaterial = new THREE.MeshStandardMaterial({ color: 0x9a5368, roughness: 0.72 });
    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xcabf75,
      roughness: 0.32,
      metalness: 0.72
    });

    this.createStage();
    this.createFigure();
    this.createFireflyCostume();
    this.createRibbon();
    this.createParticles();
    this.createLighting();
  }

  createStage() {
    this.stage = new THREE.Group();
    this.root.add(this.stage);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.75, 0.065, 80),
      new THREE.MeshStandardMaterial({
        color: 0x0c1717,
        roughness: 0.62,
        metalness: 0.3,
        emissive: 0x05110d,
        emissiveIntensity: 0.12
      })
    );
    platform.position.y = 0.02;
    platform.receiveShadow = true;
    this.stage.add(platform);

    const inset = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.59, 0.02, 80),
      new THREE.MeshStandardMaterial({
        color: 0x193127,
        roughness: 0.74,
        metalness: 0.08
      })
    );
    inset.position.y = 0.073;
    this.stage.add(inset);

    this.stageRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.01, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0xc7b95f,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending
      })
    );
    this.stageRing.rotation.x = Math.PI / 2;
    this.stageRing.position.y = 0.092;
    this.stageRing.renderOrder = 3;
    this.stage.add(this.stageRing);

    this.stageGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture(256),
        color: 0x6fa47d,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending
      })
    );
    this.stageGlow.position.y = 0.11;
    this.stageGlow.scale.set(1.65, 1.65, 1);
    this.stageGlow.renderOrder = 1;
    this.root.add(this.stageGlow);
  }

  createFigure() {
    this.dancer = new THREE.Group();
    this.dancer.position.y = 0.09;
    this.root.add(this.dancer);

    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.9;
    this.dancer.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 28, 20),
      this.bodiceMaterial
    );
    pelvisMesh.scale.set(1.08, 0.72, 0.8);
    pelvisMesh.position.y = -0.02;
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.11;
    this.pelvis.add(this.torsoGroup);

    const torsoProfile = [
      new THREE.Vector2(0.105, -0.12),
      new THREE.Vector2(0.13, -0.05),
      new THREE.Vector2(0.142, 0.07),
      new THREE.Vector2(0.185, 0.22),
      new THREE.Vector2(0.17, 0.34),
      new THREE.Vector2(0.11, 0.4)
    ];
    this.torso = new THREE.Mesh(
      new THREE.LatheGeometry(torsoProfile, 48),
      this.bodiceMaterial
    );
    this.torso.scale.z = 0.76;
    this.torso.castShadow = true;
    this.torsoGroup.add(this.torso);

    const neckline = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.012, 8, 48, Math.PI * 1.3),
      this.metalMaterial
    );
    neckline.rotation.set(Math.PI / 2, 0, -Math.PI * 0.15);
    neckline.position.set(0, 0.38, 0.035);
    neckline.scale.z = 0.72;
    this.torsoGroup.add(neckline);

    this.skirtLayers = [];
    [
      { radius: 0.43, y: -0.05, height: 0.075, material: this.skirtMaterials[0] },
      { radius: 0.37, y: -0.005, height: 0.07, material: this.skirtMaterials[1] },
      { radius: 0.31, y: 0.035, height: 0.06, material: this.skirtMaterials[2] }
    ].forEach((layer, index) => {
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, layer.radius, layer.height, 72, 1, false),
        layer.material
      );
      skirt.position.y = layer.y;
      skirt.castShadow = true;
      skirt.userData.phase = index * 0.8;
      this.pelvis.add(skirt);
      this.skirtLayers.push(skirt);
    });

    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(0.146, 0.014, 8, 64),
      this.metalMaterial
    );
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.07;
    this.pelvis.add(belt);

    this.neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.062, 0.115, 20),
      this.skinMaterial
    );
    this.neck.position.y = 0.56;
    this.pelvis.add(this.neck);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.705;
    this.pelvis.add(this.headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.132, 32, 26), this.skinMaterial);
    head.scale.set(0.9, 1.08, 0.86);
    head.castShadow = true;
    this.headGroup.add(head);

    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.027, 14, 10), this.skinMaterial);
    const rightEar = leftEar.clone();
    leftEar.position.set(-0.122, 0.005, 0);
    rightEar.position.set(0.122, 0.005, 0);
    this.headGroup.add(leftEar, rightEar);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.136, 28, 20, 0, TWO_PI, 0, Math.PI * 0.59),
      this.hairMaterial
    );
    hairCap.rotation.x = Math.PI;
    hairCap.position.set(0, 0.03, -0.004);
    this.headGroup.add(hairCap);

    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.071, 22, 18), this.hairMaterial);
    bun.scale.set(1, 0.9, 0.82);
    bun.position.set(0, 0.145, -0.07);
    this.headGroup.add(bun);

    const eyeGeometry = new THREE.SphereGeometry(0.012, 12, 8);
    const leftEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial);
    const rightEye = leftEye.clone();
    leftEye.position.set(-0.043, 0.018, 0.112);
    rightEye.position.set(0.043, 0.018, 0.112);
    leftEye.scale.set(1.15, 0.55, 0.45);
    rightEye.scale.copy(leftEye.scale);
    this.headGroup.add(leftEye, rightEye);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), this.skinMaterial);
    nose.position.set(0, -0.005, 0.127);
    nose.scale.set(0.7, 1.1, 0.9);
    this.headGroup.add(nose);

    const lips = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), this.lipMaterial);
    lips.position.set(0, -0.052, 0.116);
    lips.scale.set(1.35, 0.45, 0.42);
    this.headGroup.add(lips);

    const tiara = new THREE.Mesh(
      new THREE.TorusGeometry(0.096, 0.006, 6, 40, Math.PI),
      this.metalMaterial
    );
    tiara.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    tiara.position.set(0, 0.095, 0.104);
    this.headGroup.add(tiara);

    const shoulderY = 0.46;
    this.leftUpperArm = attachLimb(
      this.torsoGroup,
      createTaperedLimb(0.34, 0.046, 0.037, this.skinMaterial),
      new THREE.Vector3(-0.17, shoulderY, 0)
    );
    this.rightUpperArm = attachLimb(
      this.torsoGroup,
      createTaperedLimb(0.34, 0.046, 0.037, this.skinMaterial),
      new THREE.Vector3(0.17, shoulderY, 0)
    );
    this.leftForearm = attachLimb(
      this.leftUpperArm.pivot,
      createTaperedLimb(0.29, 0.038, 0.029, this.skinMaterial),
      new THREE.Vector3(0, -0.335, 0)
    );
    this.rightForearm = attachLimb(
      this.rightUpperArm.pivot,
      createTaperedLimb(0.29, 0.038, 0.029, this.skinMaterial),
      new THREE.Vector3(0, -0.335, 0)
    );

    this.leftHand = createRoundedHand(this.skinMaterial);
    this.rightHand = createRoundedHand(this.skinMaterial);
    this.leftHand.position.y = -0.285;
    this.rightHand.position.y = -0.285;
    this.leftForearm.pivot.add(this.leftHand);
    this.rightForearm.pivot.add(this.rightHand);

    this.leftThigh = attachLimb(
      this.pelvis,
      createTaperedLimb(0.46, 0.066, 0.049, this.tightsMaterial),
      new THREE.Vector3(-0.075, -0.06, 0)
    );
    this.rightThigh = attachLimb(
      this.pelvis,
      createTaperedLimb(0.46, 0.066, 0.049, this.tightsMaterial),
      new THREE.Vector3(0.075, -0.06, 0)
    );
    this.leftShin = attachLimb(
      this.leftThigh.pivot,
      createTaperedLimb(0.43, 0.05, 0.034, this.tightsMaterial),
      new THREE.Vector3(0, -0.455, 0)
    );
    this.rightShin = attachLimb(
      this.rightThigh.pivot,
      createTaperedLimb(0.43, 0.05, 0.034, this.tightsMaterial),
      new THREE.Vector3(0, -0.455, 0)
    );

    const shoeGeometry = new THREE.CapsuleGeometry(0.045, 0.13, 6, 14);
    this.leftShoe = new THREE.Mesh(shoeGeometry, this.shoeMaterial);
    this.rightShoe = new THREE.Mesh(shoeGeometry, this.shoeMaterial);
    this.leftShoe.position.set(0, -0.41, 0.055);
    this.rightShoe.position.set(0, -0.41, 0.055);
    this.leftShoe.rotation.x = Math.PI / 2 + 0.18;
    this.rightShoe.rotation.x = Math.PI / 2 + 0.18;
    this.leftShin.pivot.add(this.leftShoe);
    this.rightShin.pivot.add(this.rightShoe);
  }

  createFireflyCostume() {
    this.wingPivots = [];
    this.fireflyLights = [];
    this.petalPanels = [];

    const wingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbdd9a7,
      roughness: 0.42,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.02,
      clearcoat: 0.12,
      clearcoatRoughness: 0.72
    });

    const wingEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0xd6cf82,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending
    });

    const makeWingGeometry = (upper = true) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      if (upper) {
        shape.bezierCurveTo(0.16, 0.12, 0.30, 0.34, 0.22, 0.55);
        shape.bezierCurveTo(0.10, 0.78, -0.07, 0.52, -0.04, 0.20);
      } else {
        shape.bezierCurveTo(0.17, 0.04, 0.30, 0.18, 0.25, 0.36);
        shape.bezierCurveTo(0.16, 0.55, -0.05, 0.42, -0.04, 0.14);
      }
      shape.bezierCurveTo(-0.03, 0.07, -0.02, 0.03, 0, 0);
      return new THREE.ShapeGeometry(shape, 30);
    };

    const createWing = (side, upper) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.085, upper ? 0.31 : 0.24, -0.105);
      this.torsoGroup.add(pivot);

      const geometry = makeWingGeometry(upper);
      const wing = new THREE.Mesh(geometry, wingMaterial.clone());
      wing.scale.x = side;
      wing.rotation.z = side * (upper ? -0.34 : -0.54);
      wing.rotation.x = -0.08;
      wing.renderOrder = 3;
      pivot.add(wing);

      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 18), wingEdgeMaterial.clone());
      edge.scale.x = side;
      edge.rotation.copy(wing.rotation);
      edge.renderOrder = 4;
      pivot.add(edge);

      pivot.userData.side = side;
      pivot.userData.upper = upper;
      pivot.userData.baseY = upper ? side * 0.20 : side * 0.13;
      this.wingPivots.push(pivot);
      return pivot;
    };

    createWing(-1, true);
    createWing(1, true);
    createWing(-1, false);
    createWing(1, false);

    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0.04);
    petalShape.bezierCurveTo(0.12, -0.01, 0.13, -0.24, 0, -0.39);
    petalShape.bezierCurveTo(-0.13, -0.24, -0.12, -0.01, 0, 0.04);
    const petalGeometry = new THREE.ShapeGeometry(petalShape, 22);
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: 0x4c8b62,
      roughness: 0.66,
      metalness: 0.01,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * TWO_PI;
      const pivot = new THREE.Group();
      pivot.position.y = 0.045;
      pivot.rotation.y = angle;
      this.pelvis.add(pivot);

      const petal = new THREE.Mesh(petalGeometry, petalMaterial.clone());
      petal.position.set(0, 0, 0.12);
      petal.rotation.x = 0.19;
      petal.rotation.z = Math.sin(angle * 2) * 0.035;
      petal.scale.set(0.92, 0.9 + (i % 3) * 0.035, 1);
      petal.castShadow = true;
      pivot.add(petal);
      pivot.userData.phase = i * 0.73;
      this.petalPanels.push(pivot);
    }

    const beltGemMaterial = new THREE.MeshStandardMaterial({
      color: 0xcabf67,
      emissive: 0x4a4212,
      emissiveIntensity: 0.38,
      roughness: 0.32,
      metalness: 0.18
    });
    this.beltGem = new THREE.Mesh(new THREE.SphereGeometry(0.038, 18, 14), beltGemMaterial);
    this.beltGem.scale.set(1.18, 0.76, 0.66);
    this.beltGem.position.set(0, 0.085, 0.145);
    this.pelvis.add(this.beltGem);

    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xe2d36f,
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending
    });

    const lightPositions = [
      [-0.09, 0.15, 0.13], [0.08, 0.24, 0.12], [-0.03, 0.33, 0.13],
      [-0.19, -0.02, 0.20], [0.19, -0.01, 0.19], [-0.28, -0.06, 0.09],
      [0.27, -0.05, 0.08], [-0.08, -0.12, 0.25], [0.10, -0.13, 0.24]
    ];

    lightPositions.forEach((position, index) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (index % 3) * 0.002, 12, 8), lightMaterial.clone());
      dot.position.set(...position);
      dot.renderOrder = 5;
      this.pelvis.add(dot);
      dot.userData.phase = index * 0.71;
      dot.userData.baseOpacity = 0.44 + (index % 4) * 0.06;
      this.fireflyLights.push(dot);
    });

    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b8150,
      roughness: 0.58,
      metalness: 0.18
    });
    const tipMaterial = lightMaterial.clone();

    [-1, 1].forEach((side, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.035, 0.11, -0.01),
        new THREE.Vector3(side * 0.065, 0.18, 0.005),
        new THREE.Vector3(side * 0.09, 0.24, 0.025)
      ]);
      const antenna = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.006, 7, false), antennaMaterial);
      this.headGroup.add(antenna);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), tipMaterial.clone());
      tip.position.copy(curve.getPoint(1));
      tip.userData.phase = index * 1.7 + 0.4;
      tip.userData.baseOpacity = 0.72;
      this.headGroup.add(tip);
      this.fireflyLights.push(tip);
    });

    this.lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 20, 14),
      new THREE.MeshStandardMaterial({
        color: 0xd6c65f,
        emissive: 0x786914,
        emissiveIntensity: 0.62,
        roughness: 0.42,
        transparent: true,
        opacity: 0.78
      })
    );
    this.lantern.scale.set(0.82, 1.15, 0.82);
    this.lantern.position.set(0, 0.02, -0.16);
    this.pelvis.add(this.lantern);

    this.lanternLight = new THREE.PointLight(0xe2d174, 0.22, 1.8, 2);
    this.lanternLight.position.copy(this.lantern.position);
    this.pelvis.add(this.lanternLight);
  }

  createRibbon() {
    this.ribbonSegments = 96;
    const positions = new Float32Array(this.ribbonSegments * 3);
    this.ribbonGeometry = new THREE.BufferGeometry();
    this.ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.ribbon = new THREE.Line(
      this.ribbonGeometry,
      new THREE.LineBasicMaterial({
        color: 0xc9ba66,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending
      })
    );
    this.ribbon.frustumCulled = false;
    this.ribbon.renderOrder = 4;
    this.root.add(this.ribbon);
  }

  createParticles() {
    this.particleCount = 46;
    const positions = new Float32Array(this.particleCount * 3);
    const phases = new Float32Array(this.particleCount);
    const radii = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i += 1) {
      phases[i] = Math.random() * TWO_PI;
      radii[i] = 0.48 + Math.random() * 0.54;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.025,
      map: createStarTexture(),
      color: 0xe1d27b,
      transparent: true,
      opacity: 0.34,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.12,
      sizeAttenuation: true
    });
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.phases = phases;
    this.particles.userData.radii = radii;
    this.particles.renderOrder = 2;
    this.root.add(this.particles);
  }

  createLighting() {
    this.keyLight = new THREE.PointLight(0xffe5bd, 0.96, 5.5, 2);
    this.keyLight.position.set(1.2, 2.2, 1.55);
    this.root.add(this.keyLight);

    this.fillLight = new THREE.PointLight(0x7dc7a8, 0.62, 4.8, 2);
    this.fillLight.position.set(-1.35, 1.45, -0.8);
    this.root.add(this.fillLight);

    this.rimLight = new THREE.PointLight(0xe0cf79, 0.38, 4, 2);
    this.rimLight.position.set(0, 1.7, -1.3);
    this.root.add(this.rimLight);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setSelected(selected) {
    this.selected = selected;
  }

  getWorldFocusPosition(target = new THREE.Vector3()) {
    this.worldAnchor.getWorldPosition(target);
    return target;
  }

  getPosePair(progress) {
    for (let i = 0; i < POSES.length - 1; i += 1) {
      if (progress >= POSES[i].time && progress <= POSES[i + 1].time) {
        const local = (progress - POSES[i].time) / (POSES[i + 1].time - POSES[i].time);
        return [POSES[i], POSES[i + 1], smoothStep(local)];
      }
    }
    return [POSES[0], POSES[1], 0];
  }

  update(elapsed, delta) {
    const target = this.enabled && this.selected ? 1 : 0;
    this.visibility = damp(this.visibility, target, target ? 3.8 : 6.2, delta);
    this.root.visible = this.visibility > 0.004;
    if (!this.root.visible) return;

    const entrance = smoothStep(this.visibility);
    const scale = 0.82 * entrance;
    this.root.scale.setScalar(scale);
    this.root.rotation.y = Math.sin(elapsed * 0.08) * 0.035;

    const cycleDuration = 18;
    const progress = (elapsed % cycleDuration) / cycleDuration;
    const [poseA, poseB, blend] = this.getPosePair(progress);
    const breath = Math.sin(elapsed * 1.45);

    lerpRotation(this.leftUpperArm.pivot.rotation, poseA.leftUpperArm, poseB.leftUpperArm, blend);
    lerpRotation(this.rightUpperArm.pivot.rotation, poseA.rightUpperArm, poseB.rightUpperArm, blend);
    lerpRotation(this.leftForearm.pivot.rotation, poseA.leftForearm, poseB.leftForearm, blend);
    lerpRotation(this.rightForearm.pivot.rotation, poseA.rightForearm, poseB.rightForearm, blend);
    lerpRotation(this.leftThigh.pivot.rotation, poseA.leftThigh, poseB.leftThigh, blend);
    lerpRotation(this.rightThigh.pivot.rotation, poseA.rightThigh, poseB.rightThigh, blend);
    lerpRotation(this.leftShin.pivot.rotation, poseA.leftShin, poseB.leftShin, blend);
    lerpRotation(this.rightShin.pivot.rotation, poseA.rightShin, poseB.rightShin, blend);
    lerpRotation(this.torsoGroup.rotation, poseA.torso, poseB.torso, blend);
    lerpRotation(this.headGroup.rotation, poseA.head, poseB.head, blend);

    const turn = THREE.MathUtils.lerp(poseA.turn, poseB.turn, blend);
    this.dancer.rotation.y = turn + elapsed * 0.035;
    this.dancer.rotation.z = Math.sin(elapsed * 0.32) * 0.012;
    this.dancer.position.y = 0.09 + Math.sin(elapsed * 1.45) * 0.006;
    this.torso.scale.set(1 + breath * 0.006, 1 + breath * 0.012, 0.76 + breath * 0.004);

    this.leftHand.rotation.z = Math.sin(elapsed * 0.72) * 0.08;
    this.rightHand.rotation.z = -Math.sin(elapsed * 0.72) * 0.08;
    this.leftShoe.rotation.x = Math.PI / 2 + 0.22 + Math.sin(elapsed * 0.55) * 0.025;
    this.rightShoe.rotation.x = Math.PI / 2 + 0.22 - Math.sin(elapsed * 0.55) * 0.025;

    this.skirtLayers.forEach((skirt, index) => {
      const flutter = Math.sin(elapsed * (0.7 + index * 0.08) + skirt.userData.phase);
      skirt.rotation.y = -turn * (0.06 + index * 0.025) + flutter * 0.018;
      skirt.scale.x = 1 + flutter * 0.012;
      skirt.scale.z = 1 - flutter * 0.009;
    });

    this.petalPanels.forEach((petal, index) => {
      const flutter = Math.sin(elapsed * 1.1 + petal.userData.phase);
      petal.rotation.z = flutter * 0.018;
      petal.rotation.x = Math.sin(elapsed * 0.72 + index * 0.4) * 0.014;
    });

    this.wingPivots.forEach((wing, index) => {
      const side = wing.userData.side;
      const upper = wing.userData.upper;
      const flutter = Math.sin(elapsed * (upper ? 2.15 : 1.85) + index * 0.92);
      wing.rotation.y = side * (upper ? 0.22 : 0.14) + side * flutter * (upper ? 0.12 : 0.08);
      wing.rotation.z = side * Math.sin(elapsed * 0.56 + index) * 0.018;
      wing.children.forEach((child) => {
        if (child.material?.opacity !== undefined) {
          child.material.opacity = (child.isLineSegments ? 0.18 : 0.17) + (flutter + 1) * 0.025;
        }
      });
    });

    this.fireflyLights.forEach((light, index) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * (1.1 + (index % 4) * 0.13) + light.userData.phase);
      light.material.opacity = (light.userData.baseOpacity ?? 0.55) * (0.45 + pulse * 0.55) * entrance;
      const scalePulse = 0.86 + pulse * 0.25;
      light.scale.setScalar(scalePulse);
    });

    const lanternPulse = 0.5 + 0.5 * Math.sin(elapsed * 1.28);
    this.lantern.material.emissiveIntensity = 0.42 + lanternPulse * 0.32;
    this.lantern.material.opacity = (0.66 + lanternPulse * 0.12) * entrance;
    this.lanternLight.intensity = (0.12 + lanternPulse * 0.12) * entrance;

    this.stage.rotation.y = -elapsed * 0.045;
    this.stageRing.material.opacity = (0.17 + Math.sin(elapsed * 0.7) * 0.025) * entrance;
    this.stageGlow.material.opacity = (0.032 + Math.sin(elapsed * 0.52) * 0.008) * entrance;
    this.keyLight.intensity = (0.82 + Math.sin(elapsed * 0.72) * 0.06) * entrance;
    this.fillLight.intensity = (0.50 + Math.cos(elapsed * 0.63) * 0.05) * entrance;
    this.rimLight.intensity = (0.31 + Math.sin(elapsed * 0.5) * 0.035) * entrance;

    const ribbonPosition = this.ribbonGeometry.attributes.position;
    for (let i = 0; i < this.ribbonSegments; i += 1) {
      const segmentProgress = i / (this.ribbonSegments - 1);
      const age = 1 - segmentProgress;
      const angle = elapsed * 0.52 - age * 5.4;
      const radius = 0.26 + age * 0.52;
      const height = 0.28 + segmentProgress * 1.28 + Math.sin(angle * 1.25) * 0.035;
      ribbonPosition.setXYZ(
        i,
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }
    ribbonPosition.needsUpdate = true;
    this.ribbon.material.opacity = (0.10 + Math.sin(elapsed * 0.42) * 0.02) * entrance;

    const particlePosition = this.particles.geometry.attributes.position;
    const phases = this.particles.userData.phases;
    const radii = this.particles.userData.radii;
    for (let i = 0; i < this.particleCount; i += 1) {
      const phase = phases[i];
      const radius = radii[i];
      const angle = phase + elapsed * (0.09 + (i % 5) * 0.008);
      const y = 0.12 + ((phase / TWO_PI + elapsed * 0.026) % 1) * 1.55;
      particlePosition.setXYZ(i, Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }
    particlePosition.needsUpdate = true;
    this.particles.material.opacity = (0.20 + Math.sin(elapsed * 0.38) * 0.05) * entrance;
  }
}
