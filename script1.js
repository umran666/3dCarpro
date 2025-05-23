let scene, camera, renderer, car, stars = [];
let velocity = new THREE.Vector3();
let acceleration = 0.01;
let maxSpeed = 0.5;
let friction = 0.95;
let turnSpeed = 0.03;
let currentSpeed = 0;

const keys = {
    w: false, s: false, a: false, d: false,
    up: false, down: false, left: false, right: false,
    space: false
};

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000011, 1, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011);
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Create car
    createCar();

    // Create stars
    createStars();

    // Create ground grid
    createGround();

    // Set initial camera position
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Start game loop
    animate();
}

function createCar() {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    carGroup.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.6, 2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xaa2222 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.1;
    roof.position.z = -0.3;
    carGroup.add(roof);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    const positions = [
        [-1.2, 0.3, 1.3],   // front left
        [1.2, 0.3, 1.3],    // front right
        [-1.2, 0.3, -1.3],  // rear left
        [1.2, 0.3, -1.3]    // rear right
    ];

    positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.rotation.z = Math.PI / 2;
        carGroup.add(wheel);
    });

    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const headlightMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffaa,
        emissive: 0x444422
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.7, 0.6, 2.1);
    carGroup.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.7, 0.6, 2.1);
    carGroup.add(rightHeadlight);

    car = carGroup;
    scene.add(car);
}

function createStars() {
    const starGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 1000; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            (Math.random() - 0.5) * 200,
            Math.random() * 100 + 20,
            (Math.random() - 0.5) * 200
        );
        stars.push(star);
        scene.add(star);
    }
}

function createGround() {
    // Create a grid pattern on the ground
    const gridHelper = new THREE.GridHelper(100, 50, 0x333366, 0x111133);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Create a large plane for the ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x001122,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);
}

function handleInput() {
    if (keys.w || keys.up) {
        velocity.z -= acceleration;
    }
    if (keys.s || keys.down) {
        velocity.z += acceleration * 0.5;
    }
    if (keys.a || keys.left) {
        if (Math.abs(velocity.z) > 0.01) {
            car.rotation.y += turnSpeed * Math.abs(velocity.z) / maxSpeed;
        }
    }
    if (keys.d || keys.right) {
        if (Math.abs(velocity.z) > 0.01) {
            car.rotation.y -= turnSpeed * Math.abs(velocity.z) / maxSpeed;
        }
    }
    if (keys.space) {
        velocity.multiplyScalar(0.9);
    }

    // Apply friction
    velocity.multiplyScalar(friction);

    // Limit speed
    velocity.clampLength(0, maxSpeed);

    // Move car based on its rotation
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(car.quaternion);
    
    car.position.addScaledVector(direction, -velocity.z);
    car.position.x += velocity.x;

    // Calculate current speed for UI
    currentSpeed = Math.abs(velocity.z) * 1000; // Convert to km/h scale
}

function updateCamera() {
    // Third-person camera following the car from behind
    const idealOffset = new THREE.Vector3(0, 8, -10); // Negative Z to be behind the car
    idealOffset.applyQuaternion(car.quaternion);
    
    const idealPosition = car.position.clone().add(idealOffset);
    
    // Smooth camera movement
    camera.position.lerp(idealPosition, 0.1);
    
    // Look at car from behind
    const lookAtTarget = car.position.clone();
    lookAtTarget.y += 2;
    camera.lookAt(lookAtTarget);
}

function updateUI() {
    document.getElementById('speed').textContent = Math.round(currentSpeed);
    document.getElementById('posX').textContent = Math.round(car.position.x);
    document.getElementById('posZ').textContent = Math.round(car.position.z);
}

function animate() {
    requestAnimationFrame(animate);

    handleInput();
    updateCamera();
    updateUI();

    // Add some star twinkling effect
    stars.forEach((star, i) => {
        if (Math.random() < 0.01) {
            star.material.opacity = 0.3 + Math.random() * 0.7;
        }
    });

    renderer.render(scene, camera);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': keys.w = keys.up = true; break;
        case 'KeyS': case 'ArrowDown': keys.s = keys.down = true; break;
        case 'KeyA': case 'ArrowLeft': keys.a = keys.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.d = keys.right = true; break;
        case 'Space': keys.space = true; e.preventDefault(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': keys.w = keys.up = false; break;
        case 'KeyS': case 'ArrowDown': keys.s = keys.down = false; break;
        case 'KeyA': case 'ArrowLeft': keys.a = keys.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.d = keys.right = false; break;
        case 'Space': keys.space = false; break;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
init();
