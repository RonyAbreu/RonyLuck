// Global variables
let drawnNumbers = [];
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
    
    // Initialize 3D scene for coin when showing
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

// ===== DADO 3D CSS =====
function rollDice() {
    if (isRolling) return;
    isRolling = true;
    
    const dice = document.getElementById('dice');
    const result = Math.floor(Math.random() * 6) + 1;
    
    // Limpar resultado anterior
    document.getElementById('dice-result').textContent = '';
    
    // Rotações para cada face do dado
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',           // Face 1 (frente)
        2: 'rotateX(0deg) rotateY(180deg)',         // Face 2 (trás)
        3: 'rotateX(0deg) rotateY(-90deg)',         // Face 3 (direita)
        4: 'rotateX(0deg) rotateY(90deg)',          // Face 4 (esquerda)
        5: 'rotateX(-90deg) rotateY(0deg)',         // Face 5 (topo)
        6: 'rotateX(90deg) rotateY(0deg)'           // Face 6 (baixo)
    };
    
    // Adicionar rotações extras para efeito de rolagem
    const extraRotations = 'rotateX(720deg) rotateY(720deg)';
    const finalRotation = rotations[result];
    
    // Aplica a animação
    dice.style.transition = 'transform 2s ease-out';
    dice.style.transform = extraRotations + ' ' + finalRotation;
    
    // Após a animação, mostra o resultado
    setTimeout(() => {
        document.getElementById('dice-result').textContent = result;
        isRolling = false;
    }, 2000);
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