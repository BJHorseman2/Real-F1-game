import * as THREE from 'three';

export const trackSegments = [];
export const segmentLength = 20;
export const numSegments = 40;
export const trackWidth = 20;

export function createLine(scene, z, label) {
    const width = trackWidth;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const squares = 8;
    for (let i = 0; i < squares; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(i * (canvas.width / squares), 0, canvas.width / squares, canvas.height);
    }
    if (label) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(width, 2);
    const line = new THREE.Mesh(geometry, material);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.02, z);
    scene.add(line);
    return line;
}

export function createTrackSegment(scene, position) {
    const segment = new THREE.Group();

    const trackGeometry = new THREE.PlaneGeometry(trackWidth, segmentLength);
    const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        roughness: 0.7,
        metalness: 0.1
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    segment.add(track);

    [-8, -4, 0, 4, 8].forEach(x => {
        const stripeGeo = new THREE.PlaneGeometry(0.5, segmentLength);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x666666,
            side: THREE.DoubleSide
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(x, 0, 0.01);
        segment.add(stripe);
    });

    [-trackWidth / 2, trackWidth / 2].forEach(x => {
        for (let i = 0; i < 10; i++) {
            const color = i % 2 === 0 ? 0xff0000 : 0xffffff;
            const curbGeo = new THREE.BoxGeometry(1, segmentLength / 10, 0.2);
            const curbMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color === 0xff0000 ? 0x330000 : 0x222222
            });
            const curb = new THREE.Mesh(curbGeo, curbMat);
            curb.position.set(x, -segmentLength / 2 + (segmentLength / 10 * i) + segmentLength / 20, 0.1);
            segment.add(curb);
        }
    });

    segment.rotation.x = -Math.PI / 2;
    segment.position.copy(position);
    scene.add(segment);
    return segment;
}
