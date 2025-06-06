export class InputManager {
  constructor() {
    this.left = false;
    this.right = false;
    this.accelerate = false;
    this.decelerate = false;
  }

  handleKey(e, down) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = down;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.right = down;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.accelerate = down;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.decelerate = down;
        e.preventDefault();
        break;
    }
  }
}

export const inputManager = new InputManager();
window.addEventListener('keydown', e => inputManager.handleKey(e, true));
window.addEventListener('keyup', e => inputManager.handleKey(e, false));
