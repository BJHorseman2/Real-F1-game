import * as THREE from 'three';

export function createPlayerCar(scene) {
    const carBody = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.3, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xaaaa00,
        emissiveIntensity: 1.5,
        metalness: 0.4,
        roughness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.add(body);

    const stripesGeometry = new THREE.BoxGeometry(0.2, 0.31, 2);
    const stripesMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x333333,
        metalness: 0.5,
        roughness: 0.1
    });
    const stripes = new THREE.Mesh(stripesGeometry, stripesMaterial);
    stripes.position.y = 0.01;
    carBody.add(stripes);

    const cockpitGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xaaaa00,
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.1
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.z = -0.4;
    cockpit.position.y = 0.25;
    carBody.add(cockpit);

    const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.3);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        emissive: 0xffff00,
        emissiveIntensity: 0.9,
        metalness: 0.7,
        roughness: 0.1
    });

    const frontWing = new THREE.Mesh(wingGeometry, wingMaterial);
    frontWing.position.z = 0.8;
    frontWing.scale.x = 1.2;
    carBody.add(frontWing);

    const rearWingMain = new THREE.Mesh(wingGeometry, wingMaterial);
    rearWingMain.position.z = -0.8;
    rearWingMain.scale.y = 1.5;
    carBody.add(rearWingMain);

    const rearWingUpper = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.2), wingMaterial);
    rearWingUpper.position.z = -0.8;
    rearWingUpper.position.y = 0.15;
    carBody.add(rearWingUpper);

    const intakeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.4);
    const intakeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0x555500,
        emissiveIntensity: 0.7,
        metalness: 0.8,
        roughness: 0.2
    });
    const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    leftIntake.position.set(0.4, 0.1, -0.2);
    carBody.add(leftIntake);

    const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    rightIntake.position.set(-0.4, 0.1, -0.2);
    carBody.add(rightIntake);

    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0x777700,
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.1
    });

    const wheels = [];
    const wheelPositions = [
        { x: 0.4, z: 0.5 },
        { x: -0.4, z: 0.5 },
        { x: 0.4, z: -0.5 },
        { x: -0.4, z: -0.5 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, -0.1, pos.z);
        wheels.push(wheel);
        carBody.add(wheel);
    });

    carBody.position.set(0, 0.3, 2);
    scene.add(carBody);
    return { carBody, wheels };
}

export function createAICar(scene, baseCar, z) {
    const lanes = [-6, -2, 2, 6];
    const aiCar = baseCar.clone(true);
    const color = new THREE.Color();
    let hue = Math.random();
    if (Math.abs(hue - 0.16) < 0.08) {
        hue = (hue + 0.5) % 1;
    }
    color.setHSL(hue, 1, 0.5);
    aiCar.traverse(obj => {
        if (obj.material) obj.material = obj.material.clone();
        if (obj.material) {
            if (obj.material.color) obj.material.color.copy(color);
            if (obj.material.emissive) obj.material.emissive.copy(color);
            if (obj.material.emissiveIntensity !== undefined) {
                obj.material.emissiveIntensity = Math.max(obj.material.emissiveIntensity, 1.2);
            }
        }
    });

    const helmetGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: color,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.2
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(0, 0.35, -0.4);
    aiCar.add(helmet);

    const carNumber = Math.floor(Math.random() * 99) + 1;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(carNumber.toString(), canvas.width / 2, canvas.height / 2);
    const numberTexture = new THREE.CanvasTexture(canvas);
    const numberMaterial = new THREE.MeshBasicMaterial({ map: numberTexture, transparent: true });
    const numberPlane = new THREE.PlaneGeometry(0.4, 0.4);
    const leftNumber = new THREE.Mesh(numberPlane, numberMaterial);
    leftNumber.position.set(0.5, 0.2, 0);
    leftNumber.rotation.y = -Math.PI / 2;
    const rightNumber = leftNumber.clone();
    rightNumber.position.set(-0.5, 0.2, 0);
    rightNumber.rotation.y = Math.PI / 2;
    aiCar.add(leftNumber);
    aiCar.add(rightNumber);

    const startLane = lanes[Math.floor(Math.random() * lanes.length)];
    aiCar.position.set(startLane, 0.3, z);
    aiCar.userData = {
        speed: 0.05 + Math.random() * 0.1,
        lane: startLane,
        targetLane: startLane,
        laneChangeTimer: Math.floor(Math.random() * 120) + 60,
        laneChangeSpeed: 0.1
    };
    scene.add(aiCar);
    return aiCar;
}
