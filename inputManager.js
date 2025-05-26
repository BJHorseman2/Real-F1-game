class InputManager {
  constructor() {
    this.accelerate = false;
    this.decelerate = false;
  }

  handleKey(e, down) {
    switch (e.code) {
      case 'KeyW':
        this.accelerate = down;
        e.preventDefault();
        break;
      case 'KeyS':
        this.decelerate = down;
        e.preventDefault();
        break;
    }
  }
}

const inputManager = new InputManager();
window.addEventListener('keydown', e => inputManager.handleKey(e, true));
window.addEventListener('keyup', e => inputManager.handleKey(e, false));
