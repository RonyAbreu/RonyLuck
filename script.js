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

    // Câmera posicionada DE FRENTE para mostrar apenas UMA face
    diceCamera.position.set(0, 0, 6);
    diceCamera.lookAt(0, 0, 0);

    animateDice();
}

function animateDice() {
    requestAnimationFrame(animateDice);
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
        1: new THREE.Euler(0, 0, 0),
        2: new THREE.Euler(Math.PI / 2, 0, 0),
        3: new THREE.Euler(0, -Math.PI / 2, 0),
        4: new THREE.Euler(0, Math.PI / 2, 0),
        5: new THREE.Euler(-Math.PI / 2, 0, 0),
        6: new THREE.Euler(0, Math.PI, 0)
    };

    const targetEuler = faceRotations[result];
    
    const duration = 4000; // 4 segundos
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
                // Rotação contínua e rápida em todos os eixos
                diceMesh.rotation.x = startRotation.x + (spinSpeedX * elapsed / 1000);
                diceMesh.rotation.y = startRotation.y + (spinSpeedY * elapsed / 1000);
                diceMesh.rotation.z = startRotation.z + (spinSpeedZ * elapsed / 1000);
            } 
            // Fase de desaceleração e posicionamento final (últimos 15%)
            else {
                const slowT = (t - 0.85) / 0.15;
                const easeT = 1 - Math.pow(1 - slowT, 4);
                
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

    // Lighting melhorada para ver bem ambos os lados
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    coinScene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight1.position.set(5, 10, 5);
    coinScene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-5, -5, 5);
    coinScene.add(dirLight2);

    // Criar texturas DETALHADAS para CARA e COROA
    const createCoinTexture = (text, isHeads) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fundo dourado com gradiente radial
        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffed4e');
        gradient.addColorStop(0.8, '#daa520');
        gradient.addColorStop(1, '#b8860b');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(256, 256, 250, 0, Math.PI * 2);
        ctx.fill();

        // Borda externa decorativa
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(256, 256, 240, 0, Math.PI * 2);
        ctx.stroke();

        // Círculos decorativos internos
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(256, 256, 220 - i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Texto principal GRANDE e LEGÍVEL
        ctx.fillStyle = '#654321';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);

        // Adicionar símbolo decorativo
        if (isHeads) {
            // Estrela para CARA
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 70px Arial';
            ctx.fillText('★', 256, 170);
        } else {
            // Coroa para COROA
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 60px Arial';
            ctx.fillText('♔', 256, 170);
        }

        // Ano na parte inferior
        ctx.fillStyle = '#8b6914';
        ctx.font = 'bold 35px Arial';
        ctx.fillText('2025', 256, 360);

        return new THREE.CanvasTexture(canvas);
    };

    // Criar geometria e materiais
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 64);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xb8860b, shininess: 100 }), // Lateral
        new THREE.MeshPhongMaterial({ map: createCoinTexture('CARA', true), shininess: 100 }), // Topo (CARA)
        new THREE.MeshPhongMaterial({ map: createCoinTexture('COROA', false), shininess: 100 }) // Base (COROA)
    ];

    coinMesh = new THREE.Mesh(geometry, materials);
    
    // Posição inicial: moeda deitada mostrando CARA para cima
    coinMesh.rotation.x = 0;
    coinMesh.rotation.y = 0;
    coinMesh.rotation.z = 0;
    coinMesh.position.y = 0;
    
    coinScene.add(coinMesh);

    // Câmera posicionada DE CIMA olhando para a moeda
    coinCamera.position.set(0, 5, 2);
    coinCamera.lookAt(0, 0, 0);

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
    
    const duration = 3000; // 3 segundos
    const startTime = performance.now();
    
    // Posição e rotação inicial
    const startPos = coinMesh.position.y;
    const startRotX = coinMesh.rotation.x;
    const startRotY = coinMesh.rotation.y;
    
    // Rotação final: Cara = 0 (topo para cima), Coroa = Math.PI (base para cima)
    const targetRotationX = result === 'Cara' ? 0 : Math.PI;
    
    // Número de rotações completas no ar (8-12 flips)
    const numFlips = Math.floor(Math.random() * 5) + 8; // 8-12 flips
    const totalRotationX = (numFlips * Math.PI * 2) + targetRotationX;
    
    // Rotação em Y para efeito 3D (2-3 voltas)
    const totalRotationY = (Math.random() * 2 + 2) * Math.PI * 2;

    // Limpar resultado anterior
    document.getElementById('coin-result').textContent = '';

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);

        if (t < 1) {
            // Dividir animação em 3 fases
            if (t < 0.15) {
                // Fase 1 (0-15%): Arremesso inicial - moeda sobe rapidamente
                const phaseT = t / 0.15;
                const easeT = Math.pow(phaseT, 0.5);
                
                coinMesh.position.y = startPos + (2 * easeT);
                coinMesh.rotation.x = startRotX + (totalRotationX * easeT * 0.3);
                coinMesh.rotation.y = startRotY + (totalRotationY * easeT * 0.3);
                
            } else if (t < 0.85) {
                // Fase 2 (15-85%): No ar - rotação rápida no topo
                const phaseT = (t - 0.15) / 0.7;
                
                // Movimento vertical parabólico
                const height = 2 + Math.sin(phaseT * Math.PI) * 0.5;
                coinMesh.position.y = height;
                
                // Rotação rápida e constante
                coinMesh.rotation.x = startRotX + (totalRotationX * (0.3 + phaseT * 0.6));
                coinMesh.rotation.y = startRotY + (totalRotationY * (0.3 + phaseT * 0.6));
                
            } else {
                // Fase 3 (85-100%): Queda e parada - desaceleração suave
                const phaseT = (t - 0.85) / 0.15;
                const easeT = 1 - Math.pow(1 - phaseT, 4);
                
                // Cai de volta à posição original
                const currentHeight = 2 + Math.sin(0.7 * Math.PI) * 0.5;
                coinMesh.position.y = currentHeight * (1 - easeT);
                
                // Desacelera rotação até a posição final exata
                const currentRotX = startRotX + (totalRotationX * 0.9);
                const currentRotY = startRotY + (totalRotationY * 0.9);
                
                coinMesh.rotation.x = currentRotX + (targetRotationX - currentRotX) * easeT;
                coinMesh.rotation.y = currentRotY + (0 - currentRotY) * easeT;
            }

            requestAnimationFrame(animate);
        } else {
            // Posição final EXATA
            coinMesh.position.y = 0;
            coinMesh.rotation.x = targetRotationX;
            coinMesh.rotation.y = 0;
            coinMesh.rotation.z = 0;
            
            // Mostrar resultado
            document.getElementById('coin-result').textContent = result;
            isFlipping = false;
        }
    }

    requestAnimationFrame(animate);
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