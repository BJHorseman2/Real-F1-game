import { inputManager } from './inputManager.js';

// Load and store high score as a numeric value
let highScore = parseFloat(localStorage.getItem('f1RacerHighScore')) || 0;
document.getElementById('highScore').textContent = 'High Score: ' + Math.floor(highScore);

// Lap tracking
let lap = 1;
const totalLaps = 5;
const lapThreshold = 5000; // unused but kept for compatibility
const lapDiv = document.getElementById('lap');
lapDiv.textContent = `Lap: ${lap}/${totalLaps}`;
// Track how far the player has travelled to ensure lap counts remain accurate
let distanceTraveled = 0;
let gameWon = false;

// Sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    switch(type) {
        case 'powerup':
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            break;
        case 'crash':
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(110, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            break;
        case 'beep':
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
            break;
        case 'engine':
            oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            break;
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    return { oscillator, gainNode };
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 200);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// Disable antialiasing and limit pixel ratio for better performance on
// low powered devices
const renderer = new THREE.WebGLRenderer({antialias: false});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);
// Ensure the window has focus for keyboard events
window.focus();

// F1 car
const carBody = new THREE.Group();

// Main body - more aerodynamic shape
const bodyGeometry = new THREE.BoxGeometry(0.8, 0.3, 2);
const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,    // Bright yellow base
    emissive: 0xaaaa00, // Strong yellow emissive glow
    emissiveIntensity: 1.5, // Increase the glow intensity
    metalness: 0.4,    // Less metallic for more saturated color
    roughness: 0.1     // Very smooth surface for better reflections
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
carBody.add(body);

// Racing stripes
const stripesGeometry = new THREE.BoxGeometry(0.2, 0.31, 2);
const stripesMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,     // Black stripes
    emissive: 0x333333,  // Slight glow
    metalness: 0.5,
    roughness: 0.1
});
const stripes = new THREE.Mesh(stripesGeometry, stripesMaterial);
stripes.position.y = 0.01; // Slightly above the body
carBody.add(stripes);

// Cockpit with neon accents
const cockpitGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,     // Dark base color
    emissive: 0xaaaa00,  // Yellow neon glow on edges
    emissiveIntensity: 0.7,
    metalness: 0.9,
    roughness: 0.1
});
const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
cockpit.position.z = -0.4;
cockpit.position.y = 0.25;
carBody.add(cockpit);

// Wings with neon accents
const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.3);
const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,       // Dark base color
    emissive: 0xffff00,    // Bright yellow emissive glow
    emissiveIntensity: 0.9, // Strong glow intensity
    metalness: 0.7,
    roughness: 0.1          // Smooth surface for better reflections
});

// Front wing - wider and more aggressive
const frontWing = new THREE.Mesh(wingGeometry, wingMaterial);
frontWing.position.z = 0.8;
frontWing.scale.x = 1.2; // Wider front wing
carBody.add(frontWing);

// Rear wing - taller with dual elements
const rearWingMain = new THREE.Mesh(wingGeometry, wingMaterial);
rearWingMain.position.z = -0.8;
rearWingMain.scale.y = 1.5; // Taller wing
carBody.add(rearWingMain);

// Second rear wing element (DRS style)
const rearWingUpper = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.05, 0.2),
    wingMaterial
);
rearWingUpper.position.z = -0.8;
rearWingUpper.position.y = 0.15;
carBody.add(rearWingUpper);

// Air intakes on sides
const intakeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.4);
const intakeMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0x555500,
    emissiveIntensity: 0.7,
    metalness: 0.8,
    roughness: 0.2
});

// Left intake
const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
leftIntake.position.set(0.4, 0.1, -0.2);
carBody.add(leftIntake);

// Right intake
const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
rightIntake.position.set(-0.4, 0.1, -0.2);
carBody.add(rightIntake);

// Wheels with neon accents
const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,       // Keep tires mostly black
    emissive: 0x777700,    // Subtle yellow glow on the rims
    emissiveIntensity: 0.7, // Medium glow intensity
    metalness: 0.9,
    roughness: 0.1          // Smooth reflective surface
});

const wheels = [];
const wheelPositions = [
    {x: 0.4, z: 0.5},
    {x: -0.4, z: 0.5},
    {x: 0.4, z: -0.5},
    {x: -0.4, z: -0.5}
];

wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, -0.1, pos.z);
    wheels.push(wheel);
    carBody.add(wheel);
});

// Position the car slightly behind the start line so it doesn't move
// ahead before the race actually begins
carBody.position.set(0, 0.3, 2);
scene.add(carBody);

// -------------------- AI Cars --------------------
// Simple opponents cloned from the player's car
const aiCars = [];

function createAICar(z) {
    const lanes = [-6, -2, 2, 6];
    const aiCar = carBody.clone(true);
    const color = new THREE.Color();
    let hue = Math.random();
    // Avoid hues close to the player's yellow color (roughly 0.16)
    if (Math.abs(hue - 0.16) < 0.08) {
        hue = (hue + 0.5) % 1;
    }
    // Use fully saturated colors for a neon look
    color.setHSL(hue, 1, 0.5);
    aiCar.traverse(obj => {
        if (obj.material) obj.material = obj.material.clone();
        if (obj.material) {
            if (obj.material.color) {
                obj.material.color.copy(color);
            }
            if (obj.material.emissive) {
                obj.material.emissive.copy(color);
            }
            if (obj.material.emissiveIntensity !== undefined) {
                obj.material.emissiveIntensity = Math.max(obj.material.emissiveIntensity, 1.2);
            }
        }
    });

    // Add a simple driver helmet for extra detail
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

    // Add number decals on the sides using a small canvas texture
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
    aiCars.push(aiCar);
}

// Position AI cars behind the start line. They will remain
// stationary until the race begins.
for (let i = 6; i <= 10; i += 2) {
    createAICar(i);
}

// Track segments
const trackSegments = [];
const segmentLength = 20;
// Increased number of segments so each lap is longer
const numSegments = 40;
const trackWidth = 20;

// Start/finish lines
let startLine, finishLine;

function createLine(z, label) {
    const width = trackWidth;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const squares = 8;
    for(let i = 0; i < squares; i++) {
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
    // Slightly larger depth so the trigger zone is hard to miss
    const geometry = new THREE.PlaneGeometry(width, 2);
    const line = new THREE.Mesh(geometry, material);
    line.rotation.x = -Math.PI/2;
    line.position.set(0, 0.02, z);
    scene.add(line);
    return line;
}

function createTrackSegment(position) {
    const segment = new THREE.Group();
    
    // Main track
    const trackGeometry = new THREE.PlaneGeometry(trackWidth, segmentLength);
    const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        roughness: 0.7,
        metalness: 0.1
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    segment.add(track);
    
    // Racing stripes
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
    
    // Curbs
    [-trackWidth/2, trackWidth/2].forEach(x => {
        for(let i = 0; i < 10; i++) {
            const color = i % 2 === 0 ? 0xff0000 : 0xffffff;
            const curbGeo = new THREE.BoxGeometry(1, segmentLength/10, 0.2);
            const curbMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color === 0xff0000 ? 0x330000 : 0x222222
            });
            const curb = new THREE.Mesh(curbGeo, curbMat);
            curb.position.set(x, -segmentLength/2 + (segmentLength/10 * i) + segmentLength/20, 0.1);
            segment.add(curb);
        }
    });
    
    segment.rotation.x = -Math.PI/2;
    segment.position.copy(position);
    scene.add(segment);
    return segment;
}

// Create initial track segments
for(let i = 0; i < numSegments; i++) {
    const pos = new THREE.Vector3(0, 0, -i * segmentLength);
    trackSegments.push(createTrackSegment(pos));
}

// Add start and finish lines
startLine = createLine(0, 'START');
finishLine = createLine(-segmentLength * numSegments, 'FINISH');
finishLine.visible = false;

// Utility to pick a readable text color based on billboard background
function getContrastColor(hexColor) {
    const r = (hexColor >> 16) & 0xff;
    const g = (hexColor >> 8) & 0xff;
    const b = hexColor & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 186 ? '#000000' : '#ffffff';
}

// Create simple billboards
const billboards = [];

function createBillboard(position, rotation = 0, color = 0x00ffff, adText = '', adImage = null) {
    // Enhanced billboard implementation with color options and tilt
    const width = 6;
    const height = 3;
    
    // Create canvas texture or load image for the billboard
    let material;
    if (adImage) {
        const texture = new THREE.TextureLoader().load(adImage);
        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
    } else if (adText) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fill background with color
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        context.strokeStyle = '#ffffff';
        context.lineWidth = 10;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Add text with high contrast for readability
        const textColor = getContrastColor(color);
        context.fillStyle = textColor;
        context.font = 'bold 70px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        // Draw outline so the text "pops" against any background
        context.lineWidth = 8;
        context.strokeStyle = textColor === '#000000' ? '#ffffff' : '#000000';
        context.strokeText(adText, canvas.width/2, canvas.height/2);
        context.fillText(adText, canvas.width/2, canvas.height/2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
    } else {
        // Default solid color if no ad text
        material = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });
    }
    
    // Create a simple plane geometry with a basic material
    const billboard = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
    );
    
    // Position billboard
    billboard.position.copy(position);
    
    // Adjust rotation to face more toward the player/track center
    const tilt = Math.PI / 3; // Angle more toward the player for visibility
    if (rotation > 0) { // Left side
        billboard.rotation.y = Math.PI/2 + tilt;
    } else { // Right side
        billboard.rotation.y = -Math.PI/2 - tilt;
    }
    
    // Add to scene and tracking array
    scene.add(billboard);
    billboards.push(billboard);

    return billboard;
}

function createGantryBillboard(z, color = 0xff6600, adText = '', adImage = null) {
    const gantry = new THREE.Group();

    // Support posts on each side of the track
    const postGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });

    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-trackWidth/2 - 1, 2.5, 0);
    gantry.add(leftPost);

    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(trackWidth/2 + 1, 2.5, 0);
    gantry.add(rightPost);

    // Billboard panel spanning the track
    const width = trackWidth + 2;
    const height = 2;
    let material;
    if (adImage) {
        const texture = new THREE.TextureLoader().load(adImage);
        material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    } else if (adText) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.fillRect(0, 0, canvas.width, canvas.height);
        const textColor = getContrastColor(color);
        context.fillStyle = textColor;
        // Smaller crisp lettering for the gantry billboard
        context.font = 'bold 30px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.lineWidth = 6;
        context.strokeStyle = textColor === '#000000' ? '#ffffff' : '#000000';
        context.strokeText(adText, canvas.width/2, canvas.height/2);
        context.fillText(adText, canvas.width/2, canvas.height/2);
        const texture = new THREE.CanvasTexture(canvas);
        material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    } else {
        material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    }

    const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    sign.position.set(0, 5, 0);
    gantry.add(sign);

    gantry.position.z = z;
    scene.add(gantry);
    billboards.push(gantry);
    return gantry;
}

// Add billboards along the track with neon colors and F1-themed ads
// Left side billboards
createBillboard(new THREE.Vector3(-trackWidth/2 - 2, 3, -20), Math.PI/2, 0xff00ff, 'MarkyB');       // Magenta image
createBillboard(new THREE.Vector3(-trackWidth/2 - 2, 3, -100), Math.PI/2, 0xffff00, 'SPEED');      // Yellow
createBillboard(new THREE.Vector3(-trackWidth/2 - 2, 3, -140), Math.PI/2, 0xff00ff, 'RACING');     // Magenta
createBillboard(new THREE.Vector3(-trackWidth/2 - 2, 3, -180), Math.PI/2, 0x00ffff, 'CHAMPIONS');  // Cyan

// Right side billboards
createBillboard(new THREE.Vector3(trackWidth/2 + 2, 3, -40), -Math.PI/2, 0x00ffff, 'F1');         // Cyan
createBillboard(new THREE.Vector3(trackWidth/2 + 2, 3, -80), -Math.PI/2, 0xff00ff, 'NEON');       // Magenta
createBillboard(new THREE.Vector3(trackWidth/2 + 2, 3, -120), -Math.PI/2, 0x00ff00, '', 'billboards/ad2.svg');      // Green image
createBillboard(new THREE.Vector3(trackWidth/2 + 2, 3, -160), -Math.PI/2, 0xff00ff, 'FASTEST');    // Magenta
createBillboard(new THREE.Vector3(trackWidth/2 + 2, 3, -200), -Math.PI/2, 0x00ffff, 'MarkyB');       // Cyan

// Overhead gantry billboard spanning the track
// Use a darker color for better contrast on the gantry billboard
createGantryBillboard(-90, 0x003366, '', 'billboards/ad3.svg');


// Barriers and obstacles
const obstacles = [];
function createObstacle(z) {
    const barrierGroup = new THREE.Group();
    
    // Add movement properties to the barrier group
    barrierGroup.userData = {
        moveDirection: Math.random() < 0.5 ? -1 : 1,
        moveSpeed: 0.05 + Math.random() * 0.05
    };
    
    // Concrete barrier
    const barrierGeometry = new THREE.BoxGeometry(2, 1, 0.5);
    const barrierMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7
    });
    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.y = 0.5;
    barrierGroup.add(barrier);
    
    // Tire stack
    const tireGeometry = new THREE.TorusGeometry(0.2, 0.1, 16, 16);
    const tireMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.9
    });
    
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 2; j++) {
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.x = Math.PI/2;
            tire.position.set(-0.5 + j, 0.2 + (i * 0.2), 0);
            barrierGroup.add(tire);
        }
    }
    
    barrierGroup.position.set((Math.random()*10)-5, 0, z);
    scene.add(barrierGroup);
    obstacles.push(barrierGroup);
}

// Fewer initial obstacles for smoother gameplay
for(let i = -30; i > -200; i -= 20) {
    if(Math.random() < 0.5) createObstacle(i);
}

// Lighting
const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 5);
scene.add(mainLight);

// Flood lights
function createFloodLight(x, z) {
    const light = new THREE.SpotLight(0xffaa00, 0.5);
    light.position.set(x, 15, z);
    light.angle = Math.PI/4;
    light.penumbra = 0.1;
    light.decay = 1;
    light.distance = 50;
    scene.add(light);
}

for(let z = 0; z > -180; z -= 40) {
    createFloodLight(-12, z);
    createFloodLight(12, z);
}

// -------------------- Cityscape --------------------
const cityScape = new THREE.Group();
const cityLength = (segmentLength * numSegments) + 200; // extend city along track

function createBuildingTexture(height) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rows = 8;
    const cols = 4;
    const winW = 6;
    const winH = 8;
    const padX = 4;
    const padY = 4;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffe066' : '#444';
            ctx.fillRect(padX + x * (winW + padX), padY + y * (winH + padY), winW, winH);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, Math.ceil(height / 10));
    return { texture, canvas, ctx };
}

function createBuilding(x, z) {
    const width = 2 + Math.random() * 3;
    const depth = 2 + Math.random() * 3;
    const height = 5 + Math.random() * 15;

    // Base building geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const { texture, canvas, ctx } = createBuildingTexture(height);

    // Vary building colors across the full hue range for a more vibrant city
    const baseHue = Math.random();
    const baseSaturation = 0.2 + Math.random() * 0.3;
    const baseLightness = 0.3 + Math.random() * 0.2;
    const baseColor = new THREE.Color().setHSL(baseHue, baseSaturation, baseLightness);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: baseColor,
        emissiveMap: texture,
        emissiveIntensity: 0.8,
        roughness: 0.8,
        metalness: 0.2
    });

    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    // Ensure buildings remain perfectly upright
    building.rotation.set(0, 0, 0);

    // Replace large white glow with a small red light
    const buildingLight = CityLights.createLight(new THREE.Color(0xff0000));
    buildingLight.scale.set(0.5, 0.5, 1);
    buildingLight.position.set(0, height * 0.8, 0);
    building.add(buildingLight);
    building.userData.light = buildingLight;

    // Add simple rooftop structure
    const roofHeight = 0.3 + Math.random() * 0.2;
    const roofGeo = new THREE.BoxGeometry(width * 0.6, roofHeight, depth * 0.6);
    const roofMat = new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(0.8),
        roughness: 0.6,
        metalness: 0.3
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height / 2 + roofHeight / 2;
    building.add(roof);

    // Additional rooftop details
    const hvacGeo = new THREE.BoxGeometry(width * 0.3, 0.2, depth * 0.3);
    const hvac = new THREE.Mesh(hvacGeo, roofMat.clone());
    hvac.position.set((Math.random() - 0.5) * width * 0.4,
                      height / 2 + roofHeight + 0.1,
                      (Math.random() - 0.5) * depth * 0.4);
    building.add(hvac);

    // Small blinking red beacon on the roof
    const beacon = CityLights.createBeacon();
    beacon.position.set(0, height / 2 + roofHeight + 0.2, 0);
    building.add(beacon);
    building.userData.beacon = beacon;

    if (Math.random() > 0.7) {
        const towerGeo = new THREE.CylinderGeometry(width * 0.15, width * 0.15, 0.8, 12);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.3 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set((Math.random() - 0.5) * width * 0.4,
                           height / 2 + roofHeight + 0.5,
                           (Math.random() - 0.5) * depth * 0.4);
        building.add(tower);
    }

    // Occasional antenna for extra detail
    if (Math.random() > 0.5) {
        const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            emissive: 0x333333
        });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = height / 2 + roofHeight + 0.5;
        building.add(antenna);
    }

    building.userData.canvas = canvas;
    building.userData.ctx = ctx;
    building.userData.texture = texture;
    building.userData.lastFlicker = 0;
    building.userData.flickerInterval = 500 + Math.random() * 1500;

    cityScape.add(building);
}

// Keep buildings away from the racing surface
const buildingMargin = 10; // distance from the edge of the track
// Reduced building count to lighten rendering load
for (let i = 0; i < 50; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const offset = (trackWidth / 2) + buildingMargin + Math.random() * 20;
    const x = side * offset;
    const z = -Math.random() * cityLength;
    createBuilding(x, z);
}
scene.add(cityScape);

function updateBuildingLights(time) {
    cityScape.children.forEach(b => {
        if (time - b.userData.lastFlicker > b.userData.flickerInterval) {
            const ctx = b.userData.ctx;
            if (ctx) {
                const rows = 8;
                const cols = 4;
                const winW = 6;
                const winH = 8;
                const padX = 4;
                const padY = 4;
                for (let i = 0; i < 2; i++) {
                    const x = Math.floor(Math.random() * cols);
                    const y = Math.floor(Math.random() * rows);
                    ctx.fillStyle = Math.random() > 0.5 ? '#ffe066' : '#444';
                    ctx.fillRect(padX + x * (winW + padX), padY + y * (winH + padY), winW, winH);
                }
                b.userData.texture.needsUpdate = true;
            }
            b.userData.lastFlicker = time;
            b.userData.flickerInterval = 500 + Math.random() * 1500;
        }
    });
    CityLights.update(time);
}

function createBlimp() {
    const blimp = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    bodyGeo.rotateZ(Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4444aa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZOE', canvas.width/2, canvas.height/2);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshStandardMaterial({
        color: 0x4444aa,
        emissive: 0x222244,
        map: texture
    });

    const body = new THREE.Mesh(bodyGeo, material);
    blimp.add(body);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 1), material.clone());
    fin.position.set(-4, 0, 0);
    blimp.add(fin);

    // Position the blimp closer to the track so it's easier to spot
    blimp.position.set(0, 25, -80);

    // Add a small point light to ensure the blimp stands out
    const blimpLight = new THREE.PointLight(0xffffff, 0.8, 30);
    blimpLight.position.set(0, 0, 0);
    blimp.add(blimpLight);
    scene.add(blimp);
    return blimp;
}

const blimp = createBlimp();

// Controls
let moveLeft = false, moveRight = false;
let useTiltControls = false;

// Keyboard controls are handled by InputManager

// Touch controls
const handleTouch = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const width = window.innerWidth;
    if (touch) {
        moveLeft = touch.clientX < width / 2;
        moveRight = touch.clientX >= width / 2;
    }
};

window.addEventListener('touchstart', handleTouch);
window.addEventListener('touchmove', handleTouch);
window.addEventListener('touchend', () => {
    moveLeft = false;
    moveRight = false;
});

// Tilt controls
let tiltSensitivity = 2;
let gyroData = { gamma: 0 };

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
        if (useTiltControls) {
            // gamma is the left-to-right tilt in degrees
            gyroData.gamma = e.gamma;
            
            // Reset movement
            moveLeft = false;
            moveRight = false;
            
            // Apply tilt control
            if (gyroData.gamma < -tiltSensitivity) moveLeft = true;
            if (gyroData.gamma > tiltSensitivity) moveRight = true;
        }
    });
}

// Toggle tilt controls
const tiltToggle = document.getElementById('tiltToggle');
tiltToggle.addEventListener('click', () => {
    useTiltControls = !useTiltControls;
    tiltToggle.style.background = useTiltControls ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.2)';
    
    // Request device orientation permission if needed
    if (useTiltControls && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response !== 'granted') {
                    useTiltControls = false;
                    tiltToggle.style.background = 'rgba(255,0,0,0.2)';
                    showMessage('Tilt controls require device orientation permission');
                }
            })
            .catch(console.error);
    }
});

// Prevent default touch behavior
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
});

// Power-ups
const powerUps = [];
let activePowerUp = null;
let powerUpDuration = 0;

function createPowerUp(z) {
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
}

// Create initial power-ups
for(let i = -40; i > -200; i -= 40) {
    createPowerUp(i);
}

// Game loop
let speed = 0;
const startSpeed = 0.3;
let score = 0;
// Use the same distance as our looping logic for accurate lap counts
const trackLength = segmentLength * numSegments;
const scoreDiv = document.getElementById('score');
const countdownDiv = document.getElementById('countdown');
const messageDiv = document.getElementById('message');
const lights = document.querySelectorAll('#startLights .light');

// Checkpoints positioned along the track at equal intervals
const checkpointTriggerSize = 1.5;
const checkpointOffsets = [trackLength / 3, (trackLength / 3) * 2];
const checkpoints = checkpointOffsets.map(off => {
    const cp = createLine(-off, '');
    cp.material.opacity = 0; // invisible trigger
    return cp;
});
let nextCheckpoint = 0;

let raceStarted = false;
let lastTime = 0;

function startLightSequence() {
    let index = 0;
    const show = () => {
        if (index < lights.length) {
            lights[index].classList.add('on');
            const beep = createSound('beep');
            beep.oscillator.start();
            beep.oscillator.stop(audioContext.currentTime + 0.2);
            index++;
            setTimeout(show, 700);
        } else {
            const beep = createSound('beep');
            beep.oscillator.start();
            beep.oscillator.stop(audioContext.currentTime + 0.2);
            setTimeout(() => {
                document.getElementById('startLights').style.display = 'none';
                countdownDiv.textContent = 'GO!';
                countdownDiv.style.display = 'block';
                speed = startSpeed;
                raceStarted = true;
                setTimeout(() => { countdownDiv.style.display = 'none'; }, 500);
            }, 300);
        }
    };
    show();
}

function showMessage(text, duration = 1500) {
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, duration);
}

// Centralized lap completion logic so laps increment reliably
function completeLap() {
    nextCheckpoint = 0;
    distanceTraveled -= trackLength;
    if (lap < totalLaps) {
        lap++;
        lapDiv.textContent = `Lap: ${lap}/${totalLaps}`;
        if (lap === totalLaps) {
            finishLine.visible = true;
        } else if (lap > 1) {
            showMessage('Lap ' + (lap - 1) + ' complete!');
        }
    } else if (!gameWon) {
        gameWon = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('f1RacerHighScore', highScore);
        }
        showMessage('You won the race! Final Score: ' + Math.floor(score));
        setTimeout(() => window.location.reload(), 1000);
    }

    startLine.position.z = 0;
    finishLine.position.z = -(numSegments * segmentLength);
    checkpoints.forEach((cp, i) => {
        cp.position.z = -checkpointOffsets[i];
    });
}

function animate(time) {
    requestAnimationFrame(animate);
    const delta = lastTime ? (time - lastTime) / 16.6667 : 1;
    lastTime = time;
    updateBuildingLights(time);

    // Apply manual acceleration/deceleration
    const accelStep = 0.02;
    const brakeStep = 0.04;
    const maxSpeed = 3;
    const accel = inputManager.accelerate;
    const decel = inputManager.decelerate;
    if (accel) speed = Math.min(speed + accelStep * delta, maxSpeed);
    if (decel) speed = Math.max(speed - brakeStep * delta, 0);

    if (raceStarted) {
        distanceTraveled += speed * delta;
    }
    
    // Move car
    const lateralStep = 0.4 * delta;
    const movingLeft = moveLeft || inputManager.left;
    const movingRight = moveRight || inputManager.right;
    if(movingLeft) carBody.position.x = Math.max(carBody.position.x - lateralStep, -8);
    if(movingRight) carBody.position.x = Math.min(carBody.position.x + lateralStep, 8);
    
    // Rotate wheels
    wheels.forEach(wheel => {
        wheel.rotation.x += speed * 0.5 * delta;
    });
    
    // Move track segments while preserving spacing without drift
    let minZ = Math.min(...trackSegments.map(s => s.position.z));
    trackSegments.forEach(segment => {
        segment.position.z += speed * delta;
        if (segment.position.z > 10) {
            // Reposition relative to the current furthest segment
            segment.position.z = minZ - segmentLength;
            // Update minZ so subsequent segments stack correctly
            minZ = segment.position.z;
        }
    });

    // Move start and finish lines
    [startLine, finishLine].forEach(line => {
        if (line) {
            line.position.z += speed * delta;
            if(line.position.z > 10) {
                line.position.z = -(numSegments * segmentLength);
            }
        }
    });

    // Move checkpoints in sync with the track
    checkpoints.forEach(cp => {
        cp.position.z += speed * delta;
        if (cp.position.z > 10) {
            cp.position.z -= trackLength;
        }
    });
    
    
    // Move and check power-ups
    powerUps.forEach(powerUp => {
        if (!powerUp.userData.collected) {
            powerUp.position.z += speed * delta;
            powerUp.rotation.y += 0.02 * delta;
            
            // Check collection
            if(Math.abs(powerUp.position.z-carBody.position.z) < 1 && 
               Math.abs(powerUp.position.x-carBody.position.x) < 1) {
                powerUp.userData.collected = true;
                powerUp.visible = false;
                activePowerUp = powerUp.userData.type;
                powerUpDuration = 300; // 5 seconds at 60fps
                
                // Show power-up message
                const powerupDiv = document.getElementById('powerup');
                powerupDiv.textContent = 'Power-up: ' + activePowerUp.toUpperCase();
                powerupDiv.style.opacity = '1';
                
                // Play power-up sound
                const sound = createSound('powerup');
                sound.oscillator.start();
                sound.oscillator.stop(audioContext.currentTime + 0.1);
            }
            
            // Respawn if passed
            if(powerUp.position.z > 5) {
                powerUp.position.z = -200;
                powerUp.position.x = (Math.random() * 12) - 6;
                powerUp.userData.collected = false;
                powerUp.visible = true;
            }
        }
    });
    
    // Update power-up effects
    if (activePowerUp) {
        powerUpDuration -= delta;
        if (powerUpDuration <= 0) {
            document.getElementById('powerup').style.opacity = '0';
            activePowerUp = null;
        }
    }
    
    // Animate billboards - basic implementation
    billboards.forEach(billboard => {
        // Move with track
        billboard.position.z += speed * delta;

        // Reset position when passed
        if(billboard.position.z > 20) {
            billboard.position.z -= 200;
        }
    });

    // Parallax movement for distant cityscape
    cityScape.children.forEach(building => {
        building.position.z += speed * 0.5 * delta;
        if (building.position.z > 50) {
            building.position.z -= cityLength;
        }
    });

    // Slowly fly the blimp across the sky
    if (blimp) {
        blimp.position.z += speed * 0.3 * delta;
        blimp.position.x += 0.05 * delta;
        if (blimp.position.x > 20) blimp.position.x = -20;
        if (blimp.position.z > 50) {
            blimp.position.z -= cityLength;
        }
    }
    
    // Move obstacles with increasing difficulty
    const difficultyFactor = Math.min(2, 1 + score/20000); // More gradual
    
    obstacles.forEach(obj => {
        obj.position.z += speed * delta;
        
        // Add horizontal movement with increased speed based on difficulty
        obj.position.x += obj.userData.moveDirection * obj.userData.moveSpeed * difficultyFactor * delta;
        
        if (obj.position.x <= -8 || obj.position.x >= 8) {
            obj.userData.moveDirection *= -1;
        }
        
        if(obj.position.z > 5) {
            obj.position.z = -200;
            obj.position.x = (Math.random()*10)-5;
            obj.userData.moveDirection = Math.random() < 0.5 ? -1 : 1;
            obj.userData.moveSpeed = (0.05 + Math.random() * 0.05) * difficultyFactor;
        }
        
        // Collision detection (skip if invincible)
        if(!activePowerUp || activePowerUp !== 'invincible') {
            if(Math.abs(obj.position.z-carBody.position.z) < 1 && 
               Math.abs(obj.position.x-carBody.position.x) < 0.75) {
                // Play crash sound
                const sound = createSound('crash');
                sound.oscillator.start();
                sound.oscillator.stop(audioContext.currentTime + 0.3);
                
                // Update high score
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('f1RacerHighScore', highScore);
                }
                
                showMessage('Crash! Final Score: ' + Math.floor(score));
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    });

    // Move AI cars with basic lane changing logic once the race has started
    aiCars.forEach(ai => {
        if (!raceStarted) return; // keep them on the grid until the start

        ai.position.z += (speed + ai.userData.speed) * delta;

        // Slight speed variation
        ai.userData.speed += (Math.random() - 0.5) * 0.001;
        ai.userData.speed = Math.min(Math.max(ai.userData.speed, 0.03), 0.12);

        // Decide when to change lanes
        ai.userData.laneChangeTimer -= delta;
        if (ai.userData.laneChangeTimer <= 0) {
            const lanes = [-6, -2, 2, 6];
            ai.userData.targetLane = lanes[Math.floor(Math.random() * lanes.length)];
            ai.userData.laneChangeTimer = Math.floor(Math.random() * 120) + 60;
        }

        // Smoothly move toward target lane
        const dx = ai.userData.targetLane - ai.position.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), ai.userData.laneChangeSpeed * delta);
        ai.position.x += step;

        if (Math.abs(dx) < 0.05) {
            ai.position.x = ai.userData.targetLane;
            ai.userData.lane = ai.userData.targetLane;
        }

        if (ai.position.x <= -8) ai.position.x = -8;
        if (ai.position.x >= 8) ai.position.x = 8;

        if(ai.position.z > 5) {
            const lanes = [-6, -2, 2, 6];
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            ai.position.z = -200;
            ai.position.x = lane;
            ai.userData.speed = 0.05 + Math.random()*0.1;
            ai.userData.lane = lane;
            ai.userData.targetLane = lane;
            ai.userData.laneChangeTimer = Math.floor(Math.random() * 120) + 60;
        }

        // Collision detection (skip if invincible)
        if(!activePowerUp || activePowerUp !== 'invincible') {
            if(Math.abs(ai.position.z-carBody.position.z) < 1 &&
               Math.abs(ai.position.x-carBody.position.x) < 0.75) {
                const sound = createSound('crash');
                sound.oscillator.start();
                sound.oscillator.stop(audioContext.currentTime + 0.3);

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('f1RacerHighScore', highScore);
                }

                showMessage('Crash! Final Score: ' + Math.floor(score));
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    });
    
    // Update score and speed only after the race starts
    if (raceStarted) {
        const baseScoreIncrease = speed * 10 * delta;
        const baseSpeedIncrease = 0.0003 * delta; // slower ramp up

        if (activePowerUp === 'speed') {
            score += baseScoreIncrease * 2;
            speed += baseSpeedIncrease * 2;
        } else if (activePowerUp === 'slowmo') {
            score += baseScoreIncrease * 0.5;
            speed += baseSpeedIncrease * 0.5;
        } else {
            score += baseScoreIncrease;
            speed += baseSpeedIncrease;
        }

        // Prevent runaway acceleration at higher laps
        speed = Math.min(speed, maxSpeed);

        if (score > highScore) {
            highScore = score;
            document.getElementById('highScore').textContent = 'High Score: ' + Math.floor(highScore);
            // Persist the new high score immediately for continuity
            localStorage.setItem('f1RacerHighScore', highScore);
        }
    }

    scoreDiv.textContent = Math.floor(score);

    // Handle checkpoints and lap completion
    if (raceStarted) {
        if (nextCheckpoint < checkpoints.length) {
            const cp = checkpoints[nextCheckpoint];
            if (Math.abs(cp.position.z - carBody.position.z) < checkpointTriggerSize) {
                nextCheckpoint++;
                showMessage('Checkpoint ' + nextCheckpoint);
            }
        } else if (distanceTraveled >= trackLength) {
            completeLap();
        }
    }
    
    camera.position.set(carBody.position.x, 4, carBody.position.z+5);
    camera.lookAt(carBody.position.x, carBody.position.y, carBody.position.z-5);
    
    renderer.render(scene, camera);
}

requestAnimationFrame(animate);
startLightSequence();
