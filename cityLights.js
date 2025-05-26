const CityLights = (() => {
  const lights = [];
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

  function update(time) {
    const t = time * 0.002;
    lights.forEach(l => {
      l.material.opacity = 0.3 + 0.2 * Math.sin(t + l.position.x);
    });
  }

  return { createLight, update };
})();
