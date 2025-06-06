export const aiCars = [];

export function addAICar(car) {
    aiCars.push(car);
}

export function updateAICars(aiCarsArray, delta, speed, carBody, activePowerUp, showCrash) {
    aiCarsArray.forEach(ai => {
        ai.position.z += (speed + ai.userData.speed) * delta;

        ai.userData.speed += (Math.random() - 0.5) * 0.001;
        ai.userData.speed = Math.min(Math.max(ai.userData.speed, 0.03), 0.12);

        ai.userData.laneChangeTimer -= delta;
        if (ai.userData.laneChangeTimer <= 0) {
            const lanes = [-6, -2, 2, 6];
            ai.userData.targetLane = lanes[Math.floor(Math.random() * lanes.length)];
            ai.userData.laneChangeTimer = Math.floor(Math.random() * 120) + 60;
        }

        const dx = ai.userData.targetLane - ai.position.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), ai.userData.laneChangeSpeed * delta);
        ai.position.x += step;

        if (Math.abs(dx) < 0.05) {
            ai.position.x = ai.userData.targetLane;
            ai.userData.lane = ai.userData.targetLane;
        }

        if (ai.position.x <= -8) ai.position.x = -8;
        if (ai.position.x >= 8) ai.position.x = 8;

        if (ai.position.z > 5) {
            const lanes = [-6, -2, 2, 6];
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            ai.position.z = -200;
            ai.position.x = lane;
            ai.userData.speed = 0.05 + Math.random() * 0.1;
            ai.userData.lane = lane;
            ai.userData.targetLane = lane;
            ai.userData.laneChangeTimer = Math.floor(Math.random() * 120) + 60;
        }

        if (!activePowerUp || activePowerUp !== 'invincible') {
            if (Math.abs(ai.position.z - carBody.position.z) < 1 &&
                Math.abs(ai.position.x - carBody.position.x) < 0.75) {
                showCrash();
            }
        }
    });
}
