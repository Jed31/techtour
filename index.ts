import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';
import * as THREE from 'three'
import { CameraHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.update();

// LIGHTS
light()

// FLOOR
// MAP
new GLTFLoader().load('./map/city_pack_1.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object: any) {
        if (object.isMesh) object.receiveShadow = true;
    });
    scene.add(model);
});

// MODEL WITH ANIMATIONS
var characterControls: CharacterControls
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object: any) {
        if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);

    const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap: Map<string, THREE.AnimationAction> = new Map()
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
        animationsMap.set(a.name, mixer.clipAction(a))
    })

    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, 'Idle')
});

// CONTROL KEYS
const keysPressed = {}
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed as any)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);

        // RESPAWN LOGIC
        if (characterControls.model.position.y < -10) {
            console.log("Fallen off map! Respawning...");
            moveTo('start');
        }
    }
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition()
}
window.addEventListener('resize', onWindowResize);



function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}

// --- TOUR DATA & UI LOGIC ---
const tourData: any = {
    start: {
        text: "Welcome to the City Center. The heart of our virtual world.",
        position: { x: -80, y: 0, z: -90 },
        choices: [
            { label: "1. Go to Outskirts", target: "outskirts" },
            { label: "2. Go to Park", target: "park" },
            { label: "3. Aerial View", target: "aerial" }
        ]
    },
    outskirts: {
        text: "You are now at the Outskirts. It's quieter here.",
        position: { x: -40, y: 0, z: -40 },
        choices: [
            { label: "Back to Center", target: "start" },
            { label: "Go to Park", target: "park" }
        ]
    },
    park: {
        text: "The Park area. A nice place to relax.",
        position: { x: -40, y: 0, z: -20 },
        choices: [
            { label: "Back to Center", target: "start" },
            { label: "Go to Outskirts", target: "outskirts" }
        ]
    },
    aerial: {
        text: "A bird's eye view of the entire city layout.",
        position: { x: -20, y: 50, z: -50 },
        choices: [
            { label: "Back to Center", target: "start" }
        ]
    }
};

let currentAudio: HTMLAudioElement | null = null;
const controlsTarget = new THREE.Vector3(0, 0, 0);

async function playVoice(text: string) {
    const statusEl = document.getElementById('voice-status');
    if (!statusEl) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    window.speechSynthesis.cancel();

    statusEl.innerText = "Guide Speaking...";
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
    const API_KEY = 'ea12904d017b845b032437fc2b72280b2f319028377b712fbd0fbbc0db9843c2';

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) throw new Error('API Error');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.onended = () => {
            statusEl.innerText = "";
            URL.revokeObjectURL(url);
        };
        currentAudio.play();

    } catch (error) {
        console.error("ElevenLabs Error:", error);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.onend = () => statusEl.innerText = "";
        window.speechSynthesis.speak(u);
    }
}

function updateUI(key: string) {
    const data = tourData[key];
    const textEl = document.getElementById('dialogue-text');
    const choicesEl = document.getElementById('choices-container');
    if (!textEl || !choicesEl) return;

    textEl.style.opacity = '0';
    textEl.style.transform = "translateY(5px)";
    setTimeout(() => {
        textEl.innerText = data.text;
        textEl.style.opacity = '1';
        textEl.style.transform = "translateY(0)";
        textEl.style.transition = "all 0.5s ease";
        playVoice(data.text);
    }, 300);

    choicesEl.innerHTML = '';
    data.choices.forEach((c: any) => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn';
        btn.innerText = c.label;
        btn.onclick = () => moveTo(c.target);
        choicesEl.appendChild(btn);
    });
}

function moveTo(key: string) {
    const target = tourData[key];
    if (!characterControls) return;

    // Teleport Character
    characterControls.model.position.set(target.position.x, target.position.y, target.position.z);

    // Animate Camera
    const offset = new THREE.Vector3(0, 5, 10); // Simple offset
    const newCamPos = new THREE.Vector3().copy(characterControls.model.position).add(offset);

    gsap.to(camera.position, {
        x: newCamPos.x, y: newCamPos.y, z: newCamPos.z,
        duration: 2,
        ease: "power2.inOut"
    });

    updateUI(key);
}

// Initial Move & Audio Handling
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');

if (startBtn && startOverlay) {
    startBtn.addEventListener('click', () => {
        startOverlay.style.opacity = '0';
        setTimeout(() => startOverlay.style.display = 'none', 500);

        // Resume AudioContext if needed (browser policy)
        if (THREE.AudioContext.getContext().state === 'suspended') {
            THREE.AudioContext.getContext().resume();
        }

        if (characterControls) moveTo('start');
        else {
            const check = setInterval(() => {
                if (characterControls) {
                    moveTo('start');
                    clearInterval(check);
                }
            }, 500);
        }
    });
} else {
    // Fallback if UI not found
    setTimeout(() => {
        if (characterControls) moveTo('start');
    }, 1000);
}