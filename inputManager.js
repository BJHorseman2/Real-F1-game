class InputManager {
  constructor() {
    this.keys = {};
    this.accelerate = false;
    this.decelerate = false;
    this.pending = false;
  }

  handleKey(e, down) {
    const code = e.code || '';
    if (code !== 'KeyW' && code !== 'KeyS') return; // only W/S
    this.keys[code] = down;
    if (!this.pending) {
      this.pending = true;
      requestAnimationFrame(() => {
        this.pending = false;
        this.accelerate = !!this.keys['KeyW'];
        this.decelerate = !!this.keys['KeyS'];
      });
    }
    e.preventDefault();
  }
}

const inputManager = new InputManager();
window.addEventListener('keydown', e => inputManager.handleKey(e, true));
window.addEventListener('keyup', e => inputManager.handleKey(e, false));
