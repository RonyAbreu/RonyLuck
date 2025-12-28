// Global variables
let drawnNumbers = [];
let diceScene, diceCamera, diceRenderer, diceMesh;
let coinScene, coinCamera, coinRenderer, coinMesh;
let isRolling = false;
let isFlipping = false;

// Show/Hide Screens
function showScreen(screen) {
    const screens = ['home', 'number', 'dice', 'coin'];
    screens.forEach(s => {
        document.getElementById(`${s}-screen`).classList.add('hidden');
    });
    document.getElementById(`${screen}-screen`).classList.remove('hidden');

    // Initialize 3D scenes when showing
    if (screen === 'dice' && !diceScene) {
        initDice();
    }
    if (screen === 'coin' && !coinScene) {
        initCoin();
    }
}

// ===== SORTEIO DE NÚMEROS =====
function drawNumber() {
    const min = parseInt(document.getElementById('min-input').value);
    const max = parseInt(document.getElementById('max-input').value);
    const unique = document.getElementById('unique-check').checked;

    if (isNaN(min) || isNaN(max)) {
        alert('Por favor, insira números válidos!');
        return;
    }

    if (min > max) {
        alert('Mínimo deve ser menor que máximo!');
        return;
    }

    const totalNumbers = max - min + 1;

    if (unique && drawnNumbers.length >= totalNumbers) {
        alert('Todos os números já foram sorteados! Clique em Reiniciar.');
        return;
    }

    let result;
    if (unique) {
        do {
            result = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (drawnNumbers.includes(result));
        drawnNumbers.push(result);
        updateDrawnNumbersList();
    } else {
        result = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    document.getElementById('number-result').textContent = result;
}

function updateDrawnNumbersList() {
    const section = document.getElementById('drawn-numbers-section');
    const list = document.getElementById('drawn-numbers');

    section.classList.remove('hidden');
    list.innerHTML = '';

    drawnNumbers.forEach(num => {
        const badge = document.createElement('div');
        badge.className = 'number-badge';
        badge.textContent = num;
        list.appendChild(badge);
    });
}

function resetNumbers() {
    drawnNumbers = [];
    document.getElementById('number-result').textContent = '';
    document.getElementById('drawn-numbers-section').classList.add('hidden');
}

// ===== DADO 3D (Three.js) =====
function initDice() {
    const container = document.getElementById('dice-canvas');
    if (!container) return;

    diceScene = new THREE.Scene();
    diceCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    diceRenderer.setSize(300, 300);
    container.appendChild(diceRenderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    diceScene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(0, 0, 10);
    diceScene.add(dirLight);

    // Criar texturas numeradas para as faces
    const createFaceTexture = (number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fundo vermelho com gradiente
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#cc0000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Borda
        ctx.strokeStyle = '#990000';
        ctx.lineWidth = 15;
        ctx.strokeRect(15, 15, 482, 482);

        // Número central grande e visível
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 280px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, 256, 280);

        return new THREE.CanvasTexture(canvas);
    };

    // Ordem de materiais do BoxGeometry: direita, esquerda, topo, baixo, frente, trás
    // Vamos mapear: [3, 4, 5, 2, 1, 6]
    const materials = [
        new THREE.MeshStandardMaterial({ map: createFaceTexture(3) }), // Direita
        new THREE.MeshStandardMaterial({ map: createFaceTexture(4) }), // Esquerda
        new THREE.MeshStandardMaterial({ map: createFaceTexture(5) }), // Topo
        new THREE.MeshStandardMaterial({ map: createFaceTexture(2) }), // Baixo
        new THREE.MeshStandardMaterial({ map: createFaceTexture(1) }), // Frente
        new THREE.MeshStandardMaterial({ map: createFaceTexture(6) })  // Trás
    ];

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    diceMesh = new THREE.Mesh(geometry, materials);
    diceScene.add(diceMesh);

    // Posição inicial mostrando a face 1 perfeitamente de frente
    diceMesh.rotation.set(0, 0, 0);

    // Câmera posicionada DE FRENTE (não diagonal) para mostrar apenas UMA face
    diceCamera.position.set(0, 0, 6);
    diceCamera.lookAt(0, 0, 0);

    animateDice();
}

function animateDice() {
    requestAnimationFrame(animateDice);
    // Dado fica parado - apenas renderiza
    if (diceRenderer && diceScene && diceCamera) {
        diceRenderer.render(diceScene, diceCamera);
    }
}

function rollDice() {
    if (isRolling || !diceMesh) return;
    isRolling = true;

    const result = Math.floor(Math.random() * 6) + 1;

    // Rotações finais para cada face ficar PERFEITAMENTE DE FRENTE
    const faceRotations = {
        1: new THREE.Euler(0, 0, 0),                    // Frente (face 1)
        2: new THREE.Euler(Math.PI / 2, 0, 0),          // Baixo vira para frente (face 2)
        3: new THREE.Euler(0, -Math.PI / 2, 0),         // Direita vira para frente (face 3)
        4: new THREE.Euler(0, Math.PI / 2, 0),          // Esquerda vira para frente (face 4)
        5: new THREE.Euler(-Math.PI / 2, 0, 0),         // Topo vira para frente (face 5)
        6: new THREE.Euler(0, Math.PI, 0)               // Trás vira para frente (face 6)
    };

    const targetEuler = faceRotations[result];
    
    const duration = 4000; // 4 segundos de animação
    const startTime = performance.now();
    const startRotation = {
        x: diceMesh.rotation.x,
        y: diceMesh.rotation.y,
        z: diceMesh.rotation.z
    };

    // Velocidades de rotação aleatórias para cada eixo
    const spinSpeedX = (Math.random() * 2 + 3) * Math.PI; // 3-5 rotações por segundo
    const spinSpeedY = (Math.random() * 2 + 3) * Math.PI;
    const spinSpeedZ = (Math.random() * 2 + 3) * Math.PI;

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        if (t < 1) {
            // Fase de rotação caótica (primeiros 85% do tempo)
            if (t < 0.85) {
                const spinT = t / 0.85;
                // Rotação contínua e rápida em todos os eixos
                diceMesh.rotation.x = startRotation.x + (spinSpeedX * elapsed / 1000);
                diceMesh.rotation.y = startRotation.y + (spinSpeedY * elapsed / 1000);
                diceMesh.rotation.z = startRotation.z + (spinSpeedZ * elapsed / 1000);
            } 
            // Fase de desaceleração e posicionamento final (últimos 15%)
            else {
                const slowT = (t - 0.85) / 0.15;
                const easeT = 1 - Math.pow(1 - slowT, 4); // Easing suave
                
                // Interpolar para a rotação final
                diceMesh.rotation.x = diceMesh.rotation.x + (targetEuler.x - diceMesh.rotation.x) * easeT * 0.3;
                diceMesh.rotation.y = diceMesh.rotation.y + (targetEuler.y - diceMesh.rotation.y) * easeT * 0.3;
                diceMesh.rotation.z = diceMesh.rotation.z + (targetEuler.z - diceMesh.rotation.z) * easeT * 0.3;
            }
            
            requestAnimationFrame(animate);
        } else {
            // Garantir posição final EXATA
            diceMesh.rotation.x = targetEuler.x;
            diceMesh.rotation.y = targetEuler.y;
            diceMesh.rotation.z = targetEuler.z;
            isRolling = false;
        }
    }

    requestAnimationFrame(animate);
}

// ===== MOEDA 3D (Three.js) =====
function initCoin() {
    const container = document.getElementById('coin-canvas');

    coinScene = new THREE.Scene();
    coinCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    coinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    coinRenderer.setSize(300, 300);
    container.appendChild(coinRenderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    coinScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 5, 5);
    coinScene.add(directionalLight);

    // Criar texturas para CARA e COROA
    const createCoinTexture = (text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fundo dourado com gradiente
        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.7, '#ffed4e');
        gradient.addColorStop(1, '#daa520');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(256, 256, 250, 0, Math.PI * 2);
        ctx.fill();

        // Borda da moeda
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(256, 256, 245, 0, Math.PI * 2);
        ctx.stroke();

        // Círculo interno
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(256, 256, 200, 0, Math.PI * 2);
        ctx.stroke();

        // Texto
        ctx.fillStyle = '#8b6914';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);

        return new THREE.CanvasTexture(canvas);
    };

    // Criar geometria e materiais
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 64);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xdaa520, shininess: 100 }), // Lateral
        new THREE.MeshPhongMaterial({ map: createCoinTexture('CARA'), shininess: 100 }), // Topo (CARA)
        new THREE.MeshPhongMaterial({ map: createCoinTexture('COROA'), shininess: 100 }) // Base (COROA)
    ];

    coinMesh = new THREE.Mesh(geometry, materials);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.rotation.y = 0;
    coinScene.add(coinMesh);

    coinCamera.position.z = 5;

    animateCoin();
}

function animateCoin() {
    requestAnimationFrame(animateCoin);
    coinRenderer.render(coinScene, coinCamera);
}

function flipCoin() {
    if (isFlipping) return;
    isFlipping = true;

    const result = Math.random() < 0.5 ? 'Cara' : 'Coroa';
    const targetRotationY = result === 'Cara' ? 0 : Math.PI;
    const startRotationY = coinMesh.rotation.y;
    const startTime = Date.now();
    const duration = 2500;
    const extraFlips = 5;

    // Limpar resultado anterior
    document.getElementById('coin-result').textContent = '';

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        if (progress < 1) {
            coinMesh.rotation.y = startRotationY + (Math.PI * 2 * extraFlips + targetRotationY - startRotationY) * easeProgress;
            requestAnimationFrame(animate);
        } else {
            coinMesh.rotation.y = targetRotationY;
            document.getElementById('coin-result').textContent = result;
            isFlipping = false;
        }
    }
    animate();
}

// ===== TEMA DARK/LIGHT =====
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// ===== INICIALIZAÇÃO =====
showScreen('home');
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
}