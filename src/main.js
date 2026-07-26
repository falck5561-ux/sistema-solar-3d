import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SolarSystem } from './core/SolarSystem.js';
import { BODY_AUDIO, BODY_STATS, BODY_THEME } from './data/bodies.js';
import { EXPERIENCE } from './data/experience.js';
import './styles.css';

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const intro = $('#intro');
const enterExperienceButton = $('#enter-experience');
const loading = $('#loading');
const loadingProgress = $('#loading-progress');
const introRecipient = $('#intro-recipient');
const introEyebrow = $('#intro-eyebrow');
const introTitleOne = $('#intro-title-one');
const introTitleTwo = $('#intro-title-two');
const introCopy = $('#intro-copy');
const introStats = $('#intro-stats');
const introButtonLabel = $('#intro-button-label');
const introNote = $('#intro-note');
const introPlayful = $('#intro-playful');
const earthNote = $('#earth-note');
const earthNoteTitle = $('#earth-note-title');
const earthNoteMessage = $('#earth-note-message');
const earthNoteSignature = $('#earth-note-signature');
const earthNoteTrigger = $('#earth-note-trigger');
const panel = $('#control-panel');
const infoCard = $('#info-card');
const infoCardToggle = $('#info-card-toggle');
const togglePanelButton = $('#toggle-panel');
const closePanelButton = $('#close-panel');
const planetSelect = $('#planet-select');
const planetDock = $('#planet-dock');
const playPauseButton = $('#play-pause');
const autoTourButton = $('#auto-tour');
const orbitCameraButton = $('#orbit-camera');
const resetCameraButton = $('#reset-camera');
const cinemaModeButton = $('#cinema-mode');
const fullscreenButton = $('#fullscreen');
const speedInput = $('#speed');
const speedValue = $('#speed-value');
const scaleInput = $('#planet-scale');
const scaleValue = $('#scale-value');
const showOrbitsInput = $('#show-orbits');
const showLabelsInput = $('#show-labels');
const showAsteroidsInput = $('#show-asteroids');
const showBloomInput = $('#show-bloom');
const qualityToggle = $('#quality-toggle');
const qualityLabel = $('#quality-label');
const labelsLayer = $('#labels-layer');
const toast = $('#toast');
const mobileGestureHint = $('#mobile-gesture-hint');
const wishStar = $('#wish-star');
const audioToggleButton = $('#audio-toggle');
const audioRestartButton = $('#audio-restart');
const infoAudioButton = $('#info-audio-button');
const volumeInput = $('#volume');
const volumeValue = $('#volume-value');
const audioState = $('#audio-state');
const audioFileName = $('#audio-file-name');
const audioTrackTitle = $('#audio-track-title');
const audioProgressBar = $('#audio-progress-bar');
const bodyAudioFile = $('#body-audio-file');
const audioIndicator = $('#audio-indicator');
const audioIndicatorText = $('#audio-indicator-text');
const simulationTime = $('#simulation-time');
const telemetryBody = $('#telemetry-body');
const focusReticle = $('#focus-reticle');
const hoverCard = $('#hover-card');
const hoverName = $('#hover-name');
const warpLines = $('#warp-lines');
const cameraFlash = $('#camera-flash');
const exitCinemaButton = $('#exit-cinema');
const cinemaBodyName = $('#cinema-body-name');
const cinemaBodySubtitle = $('#cinema-body-subtitle');
const balletButtons = [...document.querySelectorAll('[data-ballet-toggle]')];

const infoElements = {
  type: $('#body-type'),
  name: $('#body-name'),
  description: $('#body-description'),
  diameter: $('#body-diameter'),
  distance: $('#body-distance'),
  year: $('#body-year'),
  temperature: $('#body-temperature'),
  gravity: $('#body-gravity'),
  day: $('#body-day'),
  moons: $('#body-moons')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010207);
scene.fog = new THREE.FogExp2(0x010207, 0.00038);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.12, 1400);
camera.position.set(0, 46, 96);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.setClearColor(0x010207, 1);
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.052;
controls.rotateSpeed = 0.46;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.52;
controls.minDistance = 2.2;
controls.maxDistance = 460;
controls.target.set(0, 0, 0);
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.34, 0.88);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const solarSystem = new SolarSystem(scene);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const labels = new Map();
const dockButtons = new Map();
const bodyPosition = new THREE.Vector3();
const projectedPosition = new THREE.Vector3();
const previousBodyPosition = new THREE.Vector3();
const currentBodyPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const balletPosition = new THREE.Vector3();
const mobileQuery = window.matchMedia('(max-width: 760px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let simulationDays = 0;
let daysPerSecond = Number(speedInput.value);
let paused = false;
let selectedBody = null;
let focusTransition = null;
let followingBody = false;
let autoTourEnabled = false;
let autoTourTimer = 0;
let autoTourIndex = 0;
let cameraOrbitEnabled = false;
let cameraOrbitAngle = 0;
let cinemaMode = false;
let bloomEnabled = true;
let pointerDown = null;
let hoveredBody = null;
let toastTimer = null;
let warpTimer = null;
let qualityMode = 'auto';
let dynamicPixelRatio = Math.min(window.devicePixelRatio, 1.5);
let fpsFrames = 0;
let fpsElapsed = 0;
let experienceStarted = false;
let balletEnabled = true;
let infoCardCompact = mobileQuery.matches;
let wasMobileLayout = mobileQuery.matches;
let gestureHintTimer = null;
let wishStarTimer = null;

const tourOrder = ['Sol', 'Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno'];
const qualityModes = ['auto', 'high', 'performance'];


function applyExperienceCopy() {
  introRecipient.innerHTML = `<span>✦</span> ${EXPERIENCE.recipient}`;
  introEyebrow.textContent = EXPERIENCE.eyebrow;
  introTitleOne.textContent = EXPERIENCE.titleLineOne;
  introTitleTwo.textContent = EXPERIENCE.titleLineTwo;
  introCopy.textContent = EXPERIENCE.introCopy;
  introButtonLabel.textContent = EXPERIENCE.startButton;
  introNote.textContent = EXPERIENCE.introNote;
  introPlayful.textContent = EXPERIENCE.playfulNote ?? '';
  introStats.innerHTML = EXPERIENCE.stats.map((item) => `<span>${item}</span>`).join('');
  earthNoteTitle.textContent = EXPERIENCE.earthTitle;
  earthNoteMessage.textContent = EXPERIENCE.earthMessage;
  earthNoteSignature.textContent = EXPERIENCE.earthSignature;
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function hapticPulse(pattern = 10) {
  if ('vibrate' in navigator && mobileQuery.matches) navigator.vibrate(pattern);
}

function showMobileGestureHint() {
  if (!mobileQuery.matches || reducedMotionQuery.matches) return;
  window.clearTimeout(gestureHintTimer);
  mobileGestureHint.classList.add('visible');
  gestureHintTimer = window.setTimeout(() => mobileGestureHint.classList.remove('visible'), 4200);
}

function triggerWishStar() {
  if (reducedMotionQuery.matches) return;
  window.clearTimeout(wishStarTimer);
  wishStar.classList.remove('active');
  void wishStar.offsetWidth;
  wishStar.classList.add('active');
  wishStarTimer = window.setTimeout(() => wishStar.classList.remove('active'), 1500);
}

function revealEarthNote() {
  if (selectedBody?.name !== 'Tierra') return;
  hapticPulse([8, 30, 8]);
  setInfoCardCompact(false);
  earthNote?.classList.add('revealed', 'highlighted');
  triggerWishStar();
  window.setTimeout(() => {
    earthNote?.scrollIntoView({
      behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }, 80);
  window.setTimeout(() => earthNote?.classList.remove('highlighted'), 1500);
}

function navigateBySwipe(direction) {
  const currentIndex = Math.max(0, tourOrder.indexOf(selectedBody?.name ?? 'Sol'));
  const nextIndex = (currentIndex + direction + tourOrder.length) % tourOrder.length;
  const nextBody = solarSystem.getBody(tourOrder[nextIndex]);
  if (!nextBody) return;
  hapticPulse(8);
  mobileGestureHint.classList.remove('visible');
  focusOnBody(nextBody, 1.25, true);
}


function getFocusPosition(body, target = new THREE.Vector3()) {
  solarSystem.getBodyWorldPosition(body, target);
  if (body?.name === 'Tierra' && balletEnabled) {
    solarSystem.getEarthBalletWorldPosition(balletPosition);
    target.lerp(balletPosition, mobileQuery.matches ? 0.56 : 0.52);
  }
  return target;
}

function updateBalletInterface() {
  balletButtons.forEach((button) => {
    button.classList.toggle('active', balletEnabled);
    button.setAttribute('aria-pressed', String(balletEnabled));
    const label = button.querySelector('[data-ballet-label]');
    if (!label) return;
    const compact = button.dataset.balletCompact === 'true';
    label.textContent = compact
      ? (balletEnabled ? 'Ocultar' : 'Mostrar')
      : (balletEnabled ? 'Animacion activa' : 'Animacion oculta');
  });
}

function toggleEarthBallet() {
  if (selectedBody?.name !== 'Tierra') {
    showToast('Selecciona la Tierra para activar el ballet luciérnaga.', 'info');
    return;
  }
  balletEnabled = !balletEnabled;
  solarSystem.setEarthBalletEnabled(balletEnabled);
  updateBalletInterface();
  focusOnBody(selectedBody, 1.15, false);
  showToast(balletEnabled ? 'Ballet luciérnaga activado.' : 'Ballet luciérnaga oculto.', 'fact', 2600);
}

function showToast(message, type = 'info', duration = 4200) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
}

function setPanelCollapsed(collapsed) {
  panel.classList.toggle('collapsed', collapsed);
  togglePanelButton.classList.toggle('active', !collapsed);
  togglePanelButton.setAttribute('aria-expanded', String(!collapsed));
  document.body.classList.toggle('controls-open', mobileQuery.matches && !collapsed);
}

function setInfoCardCompact(compact) {
  infoCardCompact = mobileQuery.matches ? compact : false;
  infoCard.classList.toggle('mobile-compact', infoCardCompact);
  infoCardToggle.setAttribute('aria-expanded', String(!infoCardCompact));
  infoCardToggle.setAttribute(
    'aria-label',
    infoCardCompact ? 'Mostrar detalles del planeta' : 'Ocultar detalles del planeta'
  );
}

function applyBodyTheme(bodyName) {
  const theme = BODY_THEME[bodyName] ?? BODY_THEME.Sol;
  document.documentElement.style.setProperty('--accent', theme.color);
  document.documentElement.style.setProperty('--accent-soft', theme.soft);
  document.documentElement.style.setProperty('--accent-rgb', theme.rgb);
}

function getAudioFile(bodyName) {
  return BODY_AUDIO[bodyName] ?? `${bodyName.toLowerCase()}.mp3`;
}

function getAudioUrl(bodyName) {
  return `${import.meta.env.BASE_URL}audio/${getAudioFile(bodyName)}`;
}

class AudioMixer {
  constructor() {
    this.decks = [new Audio(), new Audio()];
    this.decks.forEach((deck) => {
      deck.preload = 'metadata';
      deck.loop = true;
    });
    this.activeIndex = 0;
    this.currentBodyName = null;
    this.volume = Number(volumeInput.value) / 100;
    this.requestId = 0;
    this.fadeFrame = null;
  }

  get active() {
    return this.decks[this.activeIndex];
  }

  get playing() {
    return Boolean(this.currentBodyName && !this.active.paused);
  }

  async play(bodyName, restart = false) {
    const requestId = ++this.requestId;
    const filename = getAudioFile(bodyName);
    updateAudioInterface('loading', bodyName);

    if (this.currentBodyName === bodyName && this.active.src) {
      if (restart) this.active.currentTime = 0;
      try {
        await this.active.play();
        this.fadeDecks(this.active, null, this.volume, 0, 420);
        updateAudioInterface('playing', bodyName);
        return;
      } catch (error) {
        updateAudioInterface('error', bodyName);
        showToast(`Agrega ${filename} en public/audio.`, 'error');
        return;
      }
    }

    const oldDeck = this.active;
    const nextIndex = 1 - this.activeIndex;
    const nextDeck = this.decks[nextIndex];
    nextDeck.pause();
    nextDeck.currentTime = 0;
    nextDeck.src = getAudioUrl(bodyName);
    nextDeck.volume = 0;
    nextDeck.load();

    try {
      await nextDeck.play();
      if (requestId !== this.requestId) {
        nextDeck.pause();
        return;
      }
      this.activeIndex = nextIndex;
      this.currentBodyName = bodyName;
      this.fadeDecks(nextDeck, oldDeck, this.volume, 0, 850);
      updateAudioInterface('playing', bodyName);
    } catch (error) {
      nextDeck.pause();
      if (requestId !== this.requestId) return;
      updateAudioInterface('error', bodyName);
      showToast(`Agrega ${filename} dentro de public/audio y vuelve a tocar ${bodyName}.`, 'error');
      console.warn(`No se pudo reproducir public/audio/${filename}`, error);
    }
  }

  fadeDecks(fadeInDeck, fadeOutDeck, fadeInTarget, fadeOutTarget, duration) {
    if (this.fadeFrame) cancelAnimationFrame(this.fadeFrame);
    const startedAt = performance.now();
    const inStart = fadeInDeck?.volume ?? 0;
    const outStart = fadeOutDeck?.volume ?? 0;

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (fadeInDeck) fadeInDeck.volume = THREE.MathUtils.lerp(inStart, fadeInTarget, eased);
      if (fadeOutDeck) fadeOutDeck.volume = THREE.MathUtils.lerp(outStart, fadeOutTarget, eased);
      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(step);
      } else {
        if (fadeOutDeck) {
          fadeOutDeck.pause();
          fadeOutDeck.currentTime = 0;
        }
        this.fadeFrame = null;
      }
    };
    this.fadeFrame = requestAnimationFrame(step);
  }

  async toggle(bodyName) {
    if (this.currentBodyName !== bodyName || !this.active.src) {
      await this.play(bodyName, false);
      return;
    }
    if (this.active.paused) {
      try {
        await this.active.play();
        this.fadeDecks(this.active, null, this.volume, 0, 380);
        updateAudioInterface('playing', bodyName);
      } catch {
        updateAudioInterface('error', bodyName);
      }
    } else {
      this.active.pause();
      updateAudioInterface('paused', bodyName);
    }
  }

  restart(bodyName) {
    return this.play(bodyName, true);
  }

  setVolume(value) {
    this.volume = value;
    if (!this.active.paused) this.active.volume = value;
  }

  updateProgress() {
    const active = this.active;
    const progress = Number.isFinite(active.duration) && active.duration > 0 ? active.currentTime / active.duration : 0;
    audioProgressBar.style.transform = `scaleX(${THREE.MathUtils.clamp(progress, 0, 1)})`;
  }
}

const audioMixer = new AudioMixer();

function updateAudioInterface(state, bodyName = selectedBody?.name ?? 'Sol') {
  const filename = getAudioFile(bodyName);
  audioFileName.textContent = filename;
  bodyAudioFile.textContent = filename;
  audioTrackTitle.textContent = `Sonido de ${bodyName}`;
  audioState.className = 'state-pill';
  audioIndicator.classList.remove('is-playing', 'has-error');

  if (state === 'playing') {
    audioState.textContent = 'Reproduciendo';
    audioState.classList.add('playing');
    audioToggleButton.textContent = '❚❚';
    infoAudioButton.textContent = '❚❚';
    audioIndicator.classList.add('is-playing');
    audioIndicatorText.textContent = `${bodyName} · ${filename}`;
  } else if (state === 'paused') {
    audioState.textContent = 'En pausa';
    audioState.classList.add('paused');
    audioToggleButton.textContent = '▶';
    infoAudioButton.textContent = '▶';
    audioIndicatorText.textContent = `En pausa · ${bodyName}`;
  } else if (state === 'loading') {
    audioState.textContent = 'Cargando';
    audioState.classList.add('loading');
    audioToggleButton.textContent = '…';
    infoAudioButton.textContent = '…';
    audioIndicatorText.textContent = `Cargando ${filename}`;
  } else if (state === 'error') {
    audioState.textContent = 'Archivo pendiente';
    audioState.classList.add('error');
    audioToggleButton.textContent = '▶';
    infoAudioButton.textContent = '▶';
    audioIndicator.classList.add('has-error');
    audioIndicatorText.textContent = `Falta ${filename}`;
  } else {
    audioState.textContent = 'Preparado';
    audioToggleButton.textContent = '▶';
    infoAudioButton.textContent = '▶';
    audioIndicatorText.textContent = 'Música lista';
  }
}

function updateInfo(body) {
  const info = body.info;
  const stats = BODY_STATS[body.name] ?? BODY_STATS.Sol;
  infoElements.type.textContent = info.type;
  infoElements.name.textContent = info.name;
  infoElements.description.textContent = info.description;
  infoElements.diameter.textContent = info.diameter;
  infoElements.distance.textContent = info.distance;
  infoElements.year.textContent = info.year;
  infoElements.temperature.textContent = info.temperature;
  infoElements.gravity.textContent = stats.gravity;
  infoElements.day.textContent = stats.day;
  infoElements.moons.textContent = stats.moons;
  bodyAudioFile.textContent = getAudioFile(body.name);
  audioFileName.textContent = getAudioFile(body.name);
  audioTrackTitle.textContent = `Sonido de ${body.name}`;
  telemetryBody.textContent = body.name;
  planetSelect.value = body.name;
  applyBodyTheme(body.name);
  solarSystem.setSelectedBody(body.name);
  const isEarth = body.name === 'Tierra';
  document.body.classList.toggle('earth-focus', isEarth);
  cinemaBodyName.textContent = body.name;
  cinemaBodySubtitle.textContent = isEarth && balletEnabled ? 'Ballet luciérnaga · una sorpresa para ti' : `${info.type} · exploración orbital`;
  earthNote?.classList.remove('revealed');
  if (isEarth && experienceStarted) {
    window.setTimeout(() => earthNote?.classList.add('revealed'), reducedMotionQuery.matches ? 40 : 760);
  }

  dockButtons.forEach((button, name) => button.classList.toggle('active', name === body.name));
  labels.forEach((label, name) => label.classList.toggle('active', name === body.name));
}

function createLabelsOptionsAndDock() {
  solarSystem.getBodies().forEach((body, index) => {
    const option = document.createElement('option');
    option.value = body.name;
    option.textContent = body.name;
    planetSelect.appendChild(option);

    const label = document.createElement('button');
    label.className = 'planet-label';
    label.type = 'button';
    label.textContent = body.name;
    label.dataset.body = body.name;
    label.addEventListener('click', () => focusOnBody(body, 1.55, true));
    labelsLayer.appendChild(label);
    labels.set(body.name, label);

    const theme = BODY_THEME[body.name] ?? BODY_THEME.Sol;
    const dockButton = document.createElement('button');
    dockButton.type = 'button';
    dockButton.className = 'dock-planet';
    dockButton.dataset.body = body.name;
    dockButton.style.setProperty('--body-color', theme.color);
    dockButton.style.setProperty('--planet-index', index);
    dockButton.setAttribute('aria-label', `Visitar ${body.name}`);
    dockButton.innerHTML = `<i aria-hidden="true"><b></b></i><span>${body.name}</span>`;
    dockButton.addEventListener('click', () => focusOnBody(body, 1.45, true));
    planetDock.appendChild(dockButton);
    dockButtons.set(body.name, dockButton);
  });
}

function startWarp() {
  if (reducedMotionQuery.matches) return;
  window.clearTimeout(warpTimer);
  warpLines.classList.remove('active');
  cameraFlash.classList.remove('active');
  void warpLines.offsetWidth;
  warpLines.classList.add('active');
  cameraFlash.classList.add('active');
  warpTimer = window.setTimeout(() => {
    warpLines.classList.remove('active');
    cameraFlash.classList.remove('active');
  }, 900);
}

function focusOnBody(body, duration = 1.65, shouldPlayAudio = false) {
  if (!body) return;
  selectedBody = body;
  updateInfo(body);
  if (mobileQuery.matches) setInfoCardCompact(true);
  cameraOrbitEnabled = false;
  orbitCameraButton.classList.remove('active');
  orbitCameraButton.querySelector('span').textContent = 'Orbitar';

  getFocusPosition(body, bodyPosition);
  const target = bodyPosition.clone();
  const viewDirection = camera.position.clone().sub(controls.target);
  if (viewDirection.lengthSq() < 0.001) viewDirection.set(1, 0.45, 1);
  viewDirection.normalize();

  const scaledRadius = body.kind === 'planet' ? body.baseRadius * solarSystem.planetScale : body.baseRadius;
  const earthBalletFocus = body.name === 'Tierra' && balletEnabled;
  const mobileDistanceFactor = earthBalletFocus ? (mobileQuery.matches ? 10.6 : 7.6) : (mobileQuery.matches ? 9.5 : 7.35);
  const distance = Math.max(scaledRadius * mobileDistanceFactor, body.kind === 'sun' ? (mobileQuery.matches ? 45 : 36) : (earthBalletFocus ? (mobileQuery.matches ? 8.6 : 7.4) : 6.8));
  const destination = target
    .clone()
    .add(viewDirection.multiplyScalar(distance))
    .add(new THREE.Vector3(0, scaledRadius * (earthBalletFocus ? (mobileQuery.matches ? 0.92 : 0.58) : (mobileQuery.matches ? 1.6 : 1.15)), 0));

  focusTransition = {
    startedAt: performance.now() / 1000,
    duration: reducedMotionQuery.matches ? 0.15 : duration,
    fromCamera: camera.position.clone(),
    fromTarget: controls.target.clone(),
    destinationOffset: destination.sub(target),
    resumeOrbit: cinemaMode
  };
  followingBody = true;
  previousBodyPosition.copy(target);
  startWarp();

  if (shouldPlayAudio) audioMixer.play(body.name, false);
  if (mobileQuery.matches) setPanelCollapsed(true);

  const fact = BODY_STATS[body.name]?.fact;
  if (fact) window.setTimeout(() => showToast(fact, 'fact', 4800), reducedMotionQuery.matches ? 100 : 850);
}

function goToGeneralView() {
  autoTourEnabled = false;
  autoTourButton.classList.remove('active');
  autoTourButton.querySelector('span').textContent = 'Recorrido';
  cameraOrbitEnabled = false;
  orbitCameraButton.classList.remove('active');
  orbitCameraButton.querySelector('span').textContent = 'Orbitar';
  followingBody = false;
  selectedBody = solarSystem.getBody('Sol');
  updateInfo(selectedBody);
  focusTransition = {
    startedAt: performance.now() / 1000,
    duration: reducedMotionQuery.matches ? 0.15 : 1.8,
    fromCamera: camera.position.clone(),
    fromTarget: controls.target.clone(),
    fixedDestination: new THREE.Vector3(0, 46, 96),
    fixedTarget: new THREE.Vector3(0, 0, 0)
  };
  startWarp();
  if (mobileQuery.matches) setPanelCollapsed(true);
}

function updateFocus(elapsed, delta) {
  if (focusTransition) {
    const raw = Math.min(1, (elapsed - focusTransition.startedAt) / focusTransition.duration);
    const t = easeInOutCubic(raw);

    if (focusTransition.fixedDestination) {
      camera.position.lerpVectors(focusTransition.fromCamera, focusTransition.fixedDestination, t);
      controls.target.lerpVectors(focusTransition.fromTarget, focusTransition.fixedTarget, t);
    } else if (selectedBody) {
      getFocusPosition(selectedBody, currentBodyPosition);
      desiredCameraPosition.copy(currentBodyPosition).add(focusTransition.destinationOffset);
      camera.position.lerpVectors(focusTransition.fromCamera, desiredCameraPosition, t);
      controls.target.lerpVectors(focusTransition.fromTarget, currentBodyPosition, t);
      previousBodyPosition.copy(currentBodyPosition);
    }

    if (raw >= 1) {
      const shouldResumeOrbit = focusTransition.resumeOrbit;
      focusTransition = null;
      if (shouldResumeOrbit && !cameraOrbitEnabled) toggleCameraOrbit();
    }
    return;
  }

  if (!followingBody || !selectedBody) return;
  getFocusPosition(selectedBody, currentBodyPosition);

  if (cameraOrbitEnabled) {
    cameraOffset.copy(camera.position).sub(controls.target);
    const radius = Math.max(cameraOffset.length(), selectedBody.baseRadius * 7);
    const height = THREE.MathUtils.clamp(cameraOffset.y, -radius * 0.45, radius * 0.55);
    const horizontalRadius = Math.sqrt(Math.max(0.1, radius * radius - height * height));
    cameraOrbitAngle += delta * (cinemaMode ? 0.09 : 0.16);
    desiredCameraPosition.set(
      currentBodyPosition.x + Math.cos(cameraOrbitAngle) * horizontalRadius,
      currentBodyPosition.y + height,
      currentBodyPosition.z + Math.sin(cameraOrbitAngle) * horizontalRadius
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.pow(0.001, delta));
    controls.target.lerp(currentBodyPosition, 1 - Math.pow(0.0005, delta));
    previousBodyPosition.copy(currentBodyPosition);
    return;
  }

  const movement = currentBodyPosition.clone().sub(previousBodyPosition);
  camera.position.add(movement);
  controls.target.add(movement);
  previousBodyPosition.copy(currentBodyPosition);
}

function updateLabels() {
  const labelsVisible = showLabelsInput.checked;
  labelsLayer.classList.toggle('hidden', !labelsVisible);
  if (!labelsVisible) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const cameraDirection = new THREE.Vector3();
  const mobile = window.innerWidth <= 680;
  camera.getWorldDirection(cameraDirection);

  solarSystem.getBodies().forEach((body) => {
    const label = labels.get(body.name);
    if (mobile && body.name !== selectedBody?.name) {
      label.style.opacity = '0';
      label.style.pointerEvents = 'none';
      return;
    }

    solarSystem.getBodyWorldPosition(body, bodyPosition);
    const toBody = bodyPosition.clone().sub(camera.position);
    const inFront = toBody.dot(cameraDirection) > 0;
    projectedPosition.copy(bodyPosition).project(camera);
    const visible = inFront && projectedPosition.z > -1 && projectedPosition.z < 1 && Math.abs(projectedPosition.x) < 1.12 && Math.abs(projectedPosition.y) < 1.12;

    if (!visible) {
      label.style.opacity = '0';
      label.style.pointerEvents = 'none';
      return;
    }

    const x = (projectedPosition.x * 0.5 + 0.5) * width;
    const y = (-projectedPosition.y * 0.5 + 0.5) * height;
    const distance = camera.position.distanceTo(bodyPosition);
    const opacity = THREE.MathUtils.clamp(1.28 - distance / 175, 0.24, 1);
    label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    label.style.opacity = String(opacity);
    label.style.pointerEvents = 'auto';
  });
}

function updateReticle() {
  if (!selectedBody) {
    focusReticle.classList.remove('visible');
    return;
  }

  solarSystem.getBodyWorldPosition(selectedBody, bodyPosition);
  projectedPosition.copy(bodyPosition).project(camera);
  const visible = projectedPosition.z > -1 && projectedPosition.z < 1 && Math.abs(projectedPosition.x) < 1.15 && Math.abs(projectedPosition.y) < 1.15;
  if (!visible || focusTransition) {
    focusReticle.classList.remove('visible');
    return;
  }

  const x = (projectedPosition.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-projectedPosition.y * 0.5 + 0.5) * window.innerHeight;
  const distance = camera.position.distanceTo(bodyPosition);
  const radius = selectedBody.kind === 'planet' ? selectedBody.baseRadius * solarSystem.planetScale : selectedBody.baseRadius;
  const size = THREE.MathUtils.clamp((radius / distance) * window.innerHeight * 2.4, 62, 240);
  focusReticle.style.setProperty('--reticle-size', `${size}px`);
  focusReticle.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  focusReticle.classList.add('visible');
}

function formatSimulationTime(days) {
  if (days < 365) return `Día ${Math.floor(days).toLocaleString('es-MX')}`;
  const years = days / 365.25;
  if (years < 100) return `Año ${years.toFixed(1)}`;
  return `${Math.floor(years).toLocaleString('es-MX')} años`;
}

function togglePause() {
  paused = !paused;
  playPauseButton.classList.toggle('active', paused);
  playPauseButton.querySelector('i').textContent = paused ? '▶' : '❚❚';
  playPauseButton.querySelector('span').textContent = paused ? 'Reanudar' : 'Pausar';
}

function toggleAutoTour() {
  autoTourEnabled = !autoTourEnabled;
  autoTourButton.classList.toggle('active', autoTourEnabled);
  autoTourButton.querySelector('i').textContent = autoTourEnabled ? '■' : '✦';
  autoTourButton.querySelector('span').textContent = autoTourEnabled ? 'Detener' : 'Recorrido';
  autoTourTimer = 0;
  if (autoTourEnabled) {
    autoTourIndex = Math.max(0, tourOrder.indexOf(selectedBody?.name ?? 'Sol'));
    focusOnBody(solarSystem.getBody(tourOrder[autoTourIndex]), 1.6, true);
  }
}

function updateAutoTour(delta) {
  if (!autoTourEnabled) return;
  autoTourTimer += delta;
  if (autoTourTimer < 8.5) return;
  autoTourTimer = 0;
  autoTourIndex = (autoTourIndex + 1) % tourOrder.length;
  focusOnBody(solarSystem.getBody(tourOrder[autoTourIndex]), 1.75, true);
}

function toggleCameraOrbit() {
  if (!selectedBody) return;
  cameraOrbitEnabled = !cameraOrbitEnabled;
  orbitCameraButton.classList.toggle('active', cameraOrbitEnabled);
  orbitCameraButton.querySelector('span').textContent = cameraOrbitEnabled ? 'Orbitando' : 'Orbitar';
  cameraOffset.copy(camera.position).sub(controls.target);
  cameraOrbitAngle = Math.atan2(cameraOffset.z, cameraOffset.x);
  followingBody = true;
  focusTransition = null;
}

function toggleCinemaMode(force) {
  cinemaMode = typeof force === 'boolean' ? force : !cinemaMode;
  document.body.classList.toggle('cinema-mode', cinemaMode);
  cinemaModeButton.classList.toggle('active', cinemaMode);
  cinemaModeButton.querySelector('b').textContent = cinemaMode ? 'Salir' : 'Cine';
  cinemaModeButton.setAttribute('aria-label', cinemaMode ? 'Salir del modo cinematográfico' : 'Activar modo cinematográfico');
  if (cinemaMode && !cameraOrbitEnabled) toggleCameraOrbit();
  if (!cinemaMode && mobileQuery.matches) setPanelCollapsed(true);
}

function handlePick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const body = solarSystem.raycast(raycaster);
  if (!body) return;
  autoTourEnabled = false;
  autoTourButton.classList.remove('active');
  autoTourButton.querySelector('i').textContent = '✦';
  autoTourButton.querySelector('span').textContent = 'Recorrido';
  focusOnBody(body, 1.55, true);
}

function handleHover(event) {
  if (event.pointerType === 'touch') return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const body = solarSystem.raycast(raycaster);

  if (body !== hoveredBody) {
    hoveredBody = body;
    solarSystem.setHoveredBody(body?.name ?? null);
    renderer.domElement.classList.toggle('can-select', Boolean(body));
  }

  if (body) {
    hoverName.textContent = body.name;
    hoverCard.style.transform = `translate3d(${event.clientX + 18}px, ${event.clientY + 18}px, 0)`;
    hoverCard.classList.add('visible');
  } else {
    hoverCard.classList.remove('visible');
  }
}

function setQuality(mode, announce = true) {
  qualityMode = mode;
  const labelsMap = { auto: 'Adaptativa', high: 'Ultra', performance: 'Rendimiento' };
  qualityToggle.textContent = mode.toUpperCase();
  qualityLabel.textContent = labelsMap[mode];

  if (mode === 'high') {
    dynamicPixelRatio = Math.min(window.devicePixelRatio, 1.8);
    bloomPass.strength = 0.52;
    bloomPass.radius = 0.38;
    bloomPass.threshold = 0.86;
  } else if (mode === 'performance') {
    dynamicPixelRatio = Math.min(window.devicePixelRatio, 1.0);
    bloomPass.strength = 0.24;
    bloomPass.radius = 0.24;
    bloomPass.threshold = 0.92;
  } else {
    dynamicPixelRatio = Math.min(window.devicePixelRatio, mobileQuery.matches ? 1.2 : 1.5);
    bloomPass.strength = 0.38;
    bloomPass.radius = 0.31;
    bloomPass.threshold = 0.89;
  }
  renderer.setPixelRatio(dynamicPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(dynamicPixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (announce) showToast(`Calidad: ${labelsMap[mode]}`);
}

function updateAdaptiveQuality(delta) {
  if (qualityMode !== 'auto') return;
  fpsFrames += 1;
  fpsElapsed += delta;
  if (fpsElapsed < 4) return;

  const fps = fpsFrames / fpsElapsed;
  fpsFrames = 0;
  fpsElapsed = 0;

  // No se cambia el pixel ratio durante la animación. Reasignar los
  // render targets del compositor puede provocar un fotograma negro.
  if (fps < 38) {
    bloomPass.strength = Math.max(0.22, bloomPass.strength - 0.04);
    bloomPass.radius = Math.max(0.22, bloomPass.radius - 0.02);
    qualityLabel.textContent = 'Estable';
  } else if (fps > 52) {
    bloomPass.strength += (0.38 - bloomPass.strength) * 0.18;
    bloomPass.radius += (0.31 - bloomPass.radius) * 0.18;
    qualityLabel.textContent = 'Alta estable';
  } else {
    qualityLabel.textContent = 'Equilibrada';
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
  document.body.classList.toggle('controls-open', mobileQuery.matches && !panel.classList.contains('collapsed'));

  if (mobileQuery.matches !== wasMobileLayout) {
    wasMobileLayout = mobileQuery.matches;
    setInfoCardCompact(mobileQuery.matches);
  }
}

planetSelect.addEventListener('change', () => {
  autoTourEnabled = false;
  autoTourButton.classList.remove('active');
  focusOnBody(solarSystem.getBody(planetSelect.value), 1.55, true);
});

playPauseButton.addEventListener('click', togglePause);
autoTourButton.addEventListener('click', toggleAutoTour);
orbitCameraButton.addEventListener('click', toggleCameraOrbit);
resetCameraButton.addEventListener('click', goToGeneralView);
cinemaModeButton.addEventListener('click', () => toggleCinemaMode());
exitCinemaButton.addEventListener('click', () => toggleCinemaMode(false));
balletButtons.forEach((button) => button.addEventListener('click', toggleEarthBallet));
audioToggleButton.addEventListener('click', () => selectedBody && audioMixer.toggle(selectedBody.name));
infoAudioButton.addEventListener('click', () => selectedBody && audioMixer.toggle(selectedBody.name));
audioRestartButton.addEventListener('click', () => selectedBody && audioMixer.restart(selectedBody.name));

togglePanelButton.addEventListener('click', () => setPanelCollapsed(!panel.classList.contains('collapsed')));
closePanelButton.addEventListener('click', () => setPanelCollapsed(true));
infoCardToggle.addEventListener('click', () => setInfoCardCompact(!infoCardCompact));
earthNoteTrigger.addEventListener('click', revealEarthNote);

speedInput.addEventListener('input', () => {
  daysPerSecond = Number(speedInput.value);
  speedValue.textContent = `${daysPerSecond} días/s`;
  document.querySelectorAll('.speed-presets button').forEach((button) => button.classList.toggle('active', Number(button.dataset.speed) === daysPerSecond));
});

document.querySelectorAll('.speed-presets button').forEach((button) => {
  button.addEventListener('click', () => {
    speedInput.value = button.dataset.speed;
    speedInput.dispatchEvent(new Event('input'));
  });
});

scaleInput.addEventListener('input', () => {
  const value = Number(scaleInput.value);
  solarSystem.setPlanetScale(value);
  scaleValue.textContent = `${value.toFixed(2)}×`;
});

volumeInput.addEventListener('input', () => {
  const volume = Number(volumeInput.value) / 100;
  volumeValue.textContent = `${volumeInput.value}%`;
  audioMixer.setVolume(volume);
});

showOrbitsInput.addEventListener('change', () => {
  solarSystem.setOrbitsVisible(showOrbitsInput.checked);
  solarSystem.setTrailsVisible(showOrbitsInput.checked);
});
showAsteroidsInput.addEventListener('change', () => solarSystem.setAsteroidsVisible(showAsteroidsInput.checked));
showBloomInput.addEventListener('change', () => { bloomEnabled = showBloomInput.checked; });

qualityToggle.addEventListener('click', () => {
  const nextIndex = (qualityModes.indexOf(qualityMode) + 1) % qualityModes.length;
  setQuality(qualityModes[nextIndex]);
});

fullscreenButton.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    showToast('El navegador no permitió activar la pantalla completa.', 'error');
    console.warn(error);
  }
});

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = {
    x: event.clientX,
    y: event.clientY,
    startedAt: performance.now(),
    pointerType: event.pointerType
  };
});
renderer.domElement.addEventListener('pointermove', handleHover);
renderer.domElement.addEventListener('pointercancel', () => { pointerDown = null; });
renderer.domElement.addEventListener('pointerleave', () => {
  hoveredBody = null;
  solarSystem.setHoveredBody(null);
  hoverCard.classList.remove('visible');
});
renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerDown) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  const movement = Math.hypot(dx, dy);
  const elapsed = performance.now() - pointerDown.startedAt;
  const isTouchSwipe = pointerDown.pointerType === 'touch'
    && mobileQuery.matches
    && experienceStarted
    && !cinemaMode
    && Math.abs(dx) > 56
    && Math.abs(dx) > Math.abs(dy) * 1.35
    && elapsed < 720;
  pointerDown = null;

  if (isTouchSwipe) {
    navigateBySwipe(dx < 0 ? 1 : -1);
    return;
  }
  if (movement < 7) handlePick(event);
});

window.addEventListener('resize', onResize);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    togglePause();
  }
  if (event.code === 'KeyC') toggleCinemaMode();
  if (event.code === 'KeyO') toggleCameraOrbit();
  if (event.code === 'Escape' && cinemaMode) toggleCinemaMode(false);
  if (event.code === 'KeyB') toggleEarthBallet();
});

controls.addEventListener('start', () => {
  focusTransition = null;
  if (cameraOrbitEnabled) toggleCameraOrbit();
});

enterExperienceButton.addEventListener('click', () => {
  hapticPulse(10);
  experienceStarted = true;
  intro.classList.add('hidden');
  document.body.classList.add('experience-started');
  window.setTimeout(() => intro.remove(), 950);
  focusOnBody(solarSystem.getBody('Tierra'), 2.2, false);
  showToast('Toca un planeta para escuchar su canción. La Tierra guarda una sorpresa.', 'info', 5200);
  window.setTimeout(showMobileGestureHint, 950);
});

applyExperienceCopy();
createLabelsOptionsAndDock();
selectedBody = solarSystem.getBody('Sol');
updateInfo(selectedBody);
setPanelCollapsed(mobileQuery.matches);
setInfoCardCompact(mobileQuery.matches);
setQuality('auto', false);
updateAudioInterface('ready', 'Sol');
updateBalletInterface();
solarSystem.setEarthBalletEnabled(true);

let fakeProgress = 0;
const loadingInterval = window.setInterval(() => {
  fakeProgress = Math.min(100, fakeProgress + 7 + Math.random() * 13);
  loadingProgress.style.width = `${fakeProgress}%`;
  if (fakeProgress >= 100) {
    window.clearInterval(loadingInterval);
    window.setTimeout(() => {
      loading.classList.add('hidden');
      window.setTimeout(() => loading.remove(), 750);
    }, 280);
  }
}, 85);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = performance.now() / 1000;

  if (!paused) simulationDays += delta * daysPerSecond;
  solarSystem.update(simulationDays, delta, elapsed);
  updateAutoTour(delta);
  updateFocus(elapsed, delta);
  controls.update();
  solarSystem.faceSelectionRing(camera);
  updateLabels();
  updateReticle();
  updateAdaptiveQuality(delta);
  audioMixer.updateProgress();
  simulationTime.textContent = formatSimulationTime(simulationDays);

  if (bloomEnabled) composer.render();
  else renderer.render(scene, camera);
}

animate();
