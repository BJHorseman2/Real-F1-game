const CityLights = (() => {
  const lights = [];
  const beacons = [];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  const baseMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });

  function createLight(color) {
    const material = baseMaterial.clone();
    if (color) material.color.copy(color);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 1);
    lights.push(sprite);
    return sprite;
  }

  function createBeacon() {
    const material = baseMaterial.clone();
    material.color.set(0xff0000);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.5, 1);
    sprite.userData.phase = Math.random() * Math.PI * 2;
    beacons.push(sprite);
    return sprite;
  }

  function update(time) {
    const t = time * 0.002;
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      l.material.opacity = 0.3 + 0.2 * Math.sin(t + l.position.x);
    }
    for (let i = 0; i < beacons.length; i++) {
      const b = beacons[i];
      b.material.opacity = Math.sin(time * 0.01 + b.userData.phase) > 0 ? 1 : 0.1;
    }
  }

  return { createLight, createBeacon, update };
})();
