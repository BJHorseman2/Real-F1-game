import * as THREE from 'three';

export const powerUps = [];

export function createPowerUp(scene, z) {
    const types = ['speed', 'invincible', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];

    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshStandardMaterial({
        color: type === 'speed' ? 0x00ff00 : type === 'invincible' ? 0xffff00 : 0x00ffff,
        emissive: type === 'speed' ? 0x003300 : type === 'invincible' ? 0x333300 : 0x003333,
        metalness: 0.8,
        roughness: 0.2
    });

    const powerUp = new THREE.Mesh(geometry, material);
    powerUp.position.set((Math.random() * 12) - 6, 0.5, z);
    powerUp.userData = { type, collected: false };
    scene.add(powerUp);
    powerUps.push(powerUp);
    return powerUp;
}
