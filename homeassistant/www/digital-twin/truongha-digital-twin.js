// TruongHA · Digital Twin 3D — custom panel của Home Assistant.
// Khai báo trong configuration.yaml (panel_custom). Home Assistant truyền sẵn đối tượng `hass`
// (trạng thái + phiên đăng nhập) nên không cần token; Three.js được đóng gói trong vendor/
// nên chạy được khi không có internet.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const ROOMS = [
  { name: 'Phòng khách', x: -3.1, z: -2, w: 5.8, d: 4.5, color: 0x2b5362 },
  { name: 'Phòng master', x: 3.1, z: -2, w: 5.8, d: 4.5, color: 0x594f76 },
  { name: 'Phòng bé', x: 3.1, z: 2.4, w: 5.8, d: 4.1, color: 0x536d5a },
  { name: 'Bếp', x: -3.1, z: 2.4, w: 5.8, d: 4.1, color: 0x665c49 },
];

const DEVICES = [
  { id: 'light.living_room_main_light', name: 'Đèn phòng khách', x: -3.1, z: -2 },
  { id: 'light.living_room_accent_light', name: 'Đèn trang trí', x: -4.8, z: -1 },
  { id: 'light.master_bedroom_ceiling_light', name: 'Đèn phòng master', x: 3.1, z: -2 },
  { id: 'light.master_bedroom_night_light', name: 'Đèn ngủ master', x: 4.7, z: -1 },
  { id: 'light.kids_room_light', name: 'Đèn phòng bé', x: 3.1, z: 2.4 },
  { id: 'light.kitchen_light', name: 'Đèn bếp', x: -3.1, z: 2.4 },
  { id: 'light.bathroom_light', name: 'Đèn nhà tắm', x: -4.9, z: 3.4 },
  { id: 'light.hallway_light', name: 'Đèn hành lang', x: -1.1, z: 3.5 },
  { id: 'cover.living_room_curtain', name: 'Rèm phòng khách' },
  { id: 'cover.master_bedroom_curtain', name: 'Rèm phòng master' },
  { id: 'lock.front_door_lock', name: 'Khóa cửa chính' },
  { id: 'climate.living_room_ac', name: 'Điều hòa phòng khách' },
  { id: 'climate.master_bedroom_ac', name: 'Điều hòa master' },
  { id: 'climate.kids_room_ac', name: 'Điều hòa phòng bé' },
];

const SENSORS = [
  ['sensor.living_room_temperature', 'Nhiệt độ phòng khách'],
  ['sensor.master_bedroom_temperature', 'Nhiệt độ phòng master'],
  ['sensor.kids_room_temperature', 'Nhiệt độ phòng bé'],
  ['sensor.living_room_humidity', 'Độ ẩm phòng khách'],
  ['binary_sensor.kitchen_smoke', 'Cảm biến khói'],
  ['binary_sensor.kitchen_gas', 'Cảm biến gas'],
];

// Tình trạng chung của căn hộ (thay cho mục "Chế độ" tĩnh của bản trước)
const OVERVIEW = [
  ['input_datetime.scenario_time', 'Giờ kịch bản'],
  ['input_select.home_mode', 'Chế độ nhà'],
  ['alarm_control_panel.apartment_security', 'An ninh'],
  ['sensor.apartment_power', 'Công suất'],
];

const STATE_VI = {
  light: { on: 'Đang bật', off: 'Đang tắt' },
  cover: { open: 'Đang mở', closed: 'Đã đóng', opening: 'Đang mở…', closing: 'Đang đóng…' },
  lock: { locked: 'Đã khóa', unlocked: 'Đã mở khóa', locking: 'Đang khóa…', unlocking: 'Đang mở khóa…', jammed: 'Bị kẹt', open: 'Đang mở' },
  climate: { off: 'Tắt', cool: 'Làm lạnh', heat: 'Sưởi', auto: 'Tự động', dry: 'Hút ẩm', fan_only: 'Quạt', heat_cool: 'Sưởi/làm lạnh' },
  binary_sensor: { off: 'Bình thường', on: 'PHÁT HIỆN' },
  alarm_control_panel: {
    disarmed: 'Tắt', armed_away: 'Đi vắng', armed_night: 'Ban đêm', armed_home: 'Ở nhà',
    triggered: 'ĐANG BÁO ĐỘNG', arming: 'Đang bật…', pending: 'Đang chờ…',
  },
};
const COMMON_VI = { unavailable: 'Không khả dụng', unknown: 'Không rõ' };
const UNLOCK_CONFIRM_MS = 4000;

const domainOf = (id) => id.split('.')[0];

function stateText(id, s) {
  if (!s) return '—';
  if (COMMON_VI[s.state]) return COMMON_VI[s.state];
  const domain = domainOf(id);
  if (domain === 'input_datetime') return s.state.slice(0, 5);
  const label = STATE_VI[domain]?.[s.state];
  if (domain === 'climate' && s.state !== 'off' && s.attributes?.temperature != null) {
    return `${label || s.state} · ${s.attributes.temperature}°C`;
  }
  if (label) return label;
  const num = Number(s.state);
  if (s.state !== '' && Number.isFinite(num)) {
    const unit = s.attributes?.unit_of_measurement;
    return num.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + (unit ? ` ${unit}` : '');
  }
  return s.state;
}

function serviceFor(id, state) {
  switch (domainOf(id)) {
    case 'light': return state === 'on' ? 'turn_off' : 'turn_on';
    case 'cover': return state === 'open' ? 'close_cover' : 'open_cover';
    case 'lock': return state === 'locked' ? 'unlock' : 'lock';
    case 'climate': return state === 'off' ? 'turn_on' : 'turn_off';
    default: return null;
  }
}

function buttonText(id, state) {
  switch (domainOf(id)) {
    case 'cover': return state === 'open' ? 'Đóng' : 'Mở';
    case 'lock': return state === 'locked' ? 'Mở khóa' : 'Khóa';
    case 'climate': return state === 'off' ? 'Bật' : 'Tắt';
    default: return state === 'on' ? 'Tắt' : 'Bật';
  }
}

const STYLE = `
:host{display:block;height:100vh;color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#081321;color:#e7f2ff}
*{box-sizing:border-box}
header{display:flex;align-items:center;gap:8px;padding:10px 18px;border-bottom:1px solid #253b50;background:#101f30;height:64px}
header .title{flex:1;min-width:0}
h1{font-size:18px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
small{color:#9bb1c7}
ha-menu-button{color:#e7f2ff}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;height:calc(100% - 64px)}
#scene{min-height:420px;position:relative;overflow:hidden}
aside{overflow:auto;background:#101f30;border-left:1px solid #253b50;padding:16px}
section{background:#172a3d;border:1px solid #2b455c;border-radius:12px;padding:13px;margin-bottom:14px}
h2{font-size:15px;margin:0 0 10px}
button{cursor:pointer;border:1px solid #3c6078;border-radius:7px;background:#23445b;color:white;padding:8px 12px;font:inherit;font-size:13px}
button:hover{background:#316783}
button:disabled{opacity:.4;cursor:not-allowed}
button.confirm{background:#8a3b1f;border-color:#d9773f}
.item{display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #2d4459;padding:8px 0;font-size:13px}
.item:first-of-type{border-top:0}
.item .state{color:#a9bed0}
.item .state.alert{color:#ff8a7a;font-weight:600}
.item button{min-width:84px}
.dot{width:9px;height:9px;border-radius:50%;background:#e99a56;display:inline-block;margin-right:7px}
.dot.online{background:#55d9a1}
#hint{position:absolute;bottom:14px;left:16px;background:#081321bb;border-radius:8px;padding:9px;font-size:12px;pointer-events:none}
#notice{min-height:0;font-size:12px;overflow-wrap:anywhere;margin:0 0 12px;padding:9px 11px;border-radius:8px;display:none}
#notice.error{display:block;background:#4a1d1d;border:1px solid #a14b4b;color:#ffd2c9}
#notice.info{display:block;background:#1d3a2f;border:1px solid #3f8a68;color:#cdf3e0}
@media(max-width:800px){:host{height:auto;min-height:100vh}.layout{display:flex;flex-direction:column;height:auto}#scene{height:56vh;min-height:320px}aside{border-left:0}}
`;

class TruongHADigitalTwin extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._built = false;
    this._seen = new Map();
    this._rows = new Map();
    this._bulbs = new Map();
    this._pending = new Set();
    this._confirmUntil = 0;
    this._running = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    if (this._menu) this._menu.hass = hass;
    this._update();
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
  }

  set panel(_panel) {}

  connectedCallback() {
    if (this._built) this._start();
  }

  disconnectedCallback() {
    this._running = false;
  }

  _build() {
    this._built = true;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <header>
        <ha-menu-button></ha-menu-button>
        <div class="title"><h1>TruongHA · Căn hộ 3D</h1><small>Căn hộ 2 phòng ngủ · Bố cục minh họa</small></div>
        <span id="status"></span>
      </header>
      <div class="layout">
        <main id="scene"><div id="hint">Kéo để xoay · Cuộn để zoom · Chạm bóng đèn để bật/tắt</div></main>
        <aside>
          <p id="notice"></p>
          <section><h2>Tình trạng căn hộ</h2><div id="overview"></div></section>
          <section><h2>Thiết bị</h2><div id="devices"></div></section>
          <section><h2>Cảm biến</h2><div id="sensors"></div></section>
        </aside>
      </div>`;
    this._menu = root.querySelector('ha-menu-button');
    this._menu.hass = this._hass;
    this._menu.narrow = this._narrow;
    this._status = root.getElementById('status');
    this._notice = root.getElementById('notice');
    this._mount = root.getElementById('scene');

    const makeRow = (container, id, name, withButton) => {
      const row = document.createElement('div');
      row.className = 'item';
      const label = document.createElement('span');
      label.textContent = name;
      const state = document.createElement('span');
      state.className = 'state';
      const left = document.createElement('div');
      left.append(label, document.createElement('br'), state);
      row.append(left);
      let btn = null;
      if (withButton) {
        btn = document.createElement('button');
        btn.addEventListener('click', () => this._act(id));
        row.append(btn);
      }
      container.append(row);
      this._rows.set(id, { state, btn, name });
    };
    const overview = root.getElementById('overview');
    OVERVIEW.forEach(([id, name]) => makeRow(overview, id, name, false));
    const devices = root.getElementById('devices');
    DEVICES.forEach((d) => makeRow(devices, d.id, d.name, true));
    const sensors = root.getElementById('sensors');
    SENSORS.forEach(([id, name]) => makeRow(sensors, id, name, false));

    this._buildScene();
    this._start();
  }

  _buildScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081321);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(11, 14, 17);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    this._mount.prepend(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minDistance = 7;
    controls.maxDistance = 33;

    scene.add(new THREE.HemisphereLight(0xbddfff, 0x324050, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(7, 16, 10);
    sun.castShadow = true;
    scene.add(sun);

    const box = (w, h, d, color, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
      m.position.set(x, y, z);
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    box(12, 0.22, 9, 0x526b77, 0, -0.15, 0);
    for (const r of ROOMS) {
      box(r.w, 0.035, r.d, r.color, r.x, 0.01, r.z);
      for (const [w, d, x, z] of [[r.w, 0.12, r.x, r.z - r.d / 2], [0.12, r.d, r.x - r.w / 2, r.z]]) {
        const wall = box(w, 1.15, d, 0xb4c5ce, x, 0.55, z);
        wall.material.transparent = true;
        wall.material.opacity = 0.6;
      }
      box(1.6, 0.35, 0.85, 0x8bafa9, r.x, 0.23, r.z + 0.3);
      box(0.9, 0.35, 0.5, 0x263a50, r.x + 0.1, 0.55, r.z - 1);
    }
    box(0.12, 0.9, 9, 0x9fb1bd, 0, 0.4, 0);
    box(12, 0.9, 0.12, 0x9fb1bd, 0, 0.4, 0.23);

    const pickables = [];
    for (const d of DEVICES.filter((v) => domainOf(v.id) === 'light')) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x647889, emissive: 0x000000 }),
      );
      mesh.position.set(d.x, 0.9, d.z);
      mesh.userData.id = d.id;
      scene.add(mesh);
      pickables.push(mesh);
      const light = new THREE.PointLight(0xffd88a, 0, 3.5);
      light.position.copy(mesh.position);
      scene.add(light);
      this._bulbs.set(d.id, { mesh, light });
    }

    // Chạm (không kéo) vào bóng đèn để bật/tắt
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(pickables)[0];
      if (hit) this._act(hit.object.userData.id);
    });

    const resize = () => {
      const w = this._mount.clientWidth;
      const h = this._mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(this._mount);
    resize();
    this._three = { scene, camera, renderer, controls };
  }

  _start() {
    if (this._running || !this._three) return;
    this._running = true;
    const { scene, camera, renderer, controls } = this._three;
    const loop = () => {
      if (!this._running) return;
      requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
  }

  _update() {
    const hass = this._hass;
    if (!hass || !this._built) return;
    const online = hass.connected !== false;
    const statusKey = online ? 'on' : 'off';
    if (this._statusKey !== statusKey) {
      this._statusKey = statusKey;
      this._seen.clear();
      this._status.innerHTML = `<span class="dot ${online ? 'online' : ''}"></span>${online ? 'Đã kết nối' : 'Mất kết nối'}`;
    }
    for (const [id, row] of this._rows) {
      const s = hass.states[id];
      // Chỉ vẽ lại khi trạng thái của entity đó thay đổi
      if (this._seen.get(id) === s && id !== 'lock.front_door_lock') continue;
      this._seen.set(id, s);
      row.state.textContent = stateText(id, s);
      row.state.classList.toggle('alert', domainOf(id) === 'binary_sensor' && s?.state === 'on'
        || (domainOf(id) === 'alarm_control_panel' && s?.state === 'triggered'));
      if (row.btn) {
        const usable = online && s && !['unavailable', 'unknown'].includes(s.state);
        const confirming = id === 'lock.front_door_lock' && Date.now() < this._confirmUntil;
        row.btn.textContent = confirming ? 'Bấm lần nữa' : buttonText(id, s?.state);
        row.btn.classList.toggle('confirm', confirming);
        row.btn.disabled = !usable || this._pending.has(id);
      }
      const bulb = this._bulbs.get(id);
      if (bulb) {
        const on = s?.state === 'on';
        bulb.mesh.material.color.setHex(on ? 0xffdf8e : 0x647889);
        bulb.mesh.material.emissive.setHex(on ? 0xffb529 : 0x000000);
        bulb.light.intensity = on ? 3 : 0;
      }
    }
  }

  _showNotice(kind, text) {
    clearTimeout(this._noticeTimer);
    this._notice.className = kind;
    this._notice.textContent = text;
    this._noticeTimer = setTimeout(() => { this._notice.className = ''; }, kind === 'error' ? 8000 : 4000);
  }

  async _act(id) {
    const hass = this._hass;
    const device = DEVICES.find((d) => d.id === id);
    const s = hass?.states[id];
    if (!device || !s || hass.connected === false || this._pending.has(id)) return;
    const service = serviceFor(id, s.state);
    if (!service) return;

    // Mở khóa cửa là thao tác an ninh: phải bấm lần thứ hai trong 4 giây để xác nhận
    if (service === 'unlock' && Date.now() >= this._confirmUntil) {
      this._confirmUntil = Date.now() + UNLOCK_CONFIRM_MS;
      this._showNotice('info', 'Bấm "Bấm lần nữa" trong 4 giây để mở khóa cửa chính.');
      this._update();
      setTimeout(() => this._update(), UNLOCK_CONFIRM_MS + 50);
      return;
    }
    this._confirmUntil = 0;

    this._pending.add(id);
    this._seen.delete(id);
    this._update();
    try {
      await hass.callService(domainOf(id), service, { entity_id: id });
    } catch (err) {
      this._showNotice('error', `Không thực hiện được "${device.name}": ${err?.message || err?.code || err}`);
    } finally {
      this._pending.delete(id);
      this._seen.delete(id);
      this._update();
    }
  }
}

if (!customElements.get('truongha-digital-twin')) {
  customElements.define('truongha-digital-twin', TruongHADigitalTwin);
}
