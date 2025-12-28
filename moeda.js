// Moeda 3D com Three.js
let coinScene, coinCamera, coinRenderer, coinMesh;
let isFlipping = false;

function initCoin() {
    const container = document.getElementById('coin-canvas');
    if (!container) return;

    coinScene = new THREE.Scene();
    coinCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    coinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const size = Math.min(300, window.innerWidth - 80);
    coinRenderer.setSize(size, size);
    container.appendChild(coinRenderer.domElement);

    // Lighting melhorada
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

        // Texto principal
        ctx.fillStyle = '#654321';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);

        // Símbolo decorativo
        if (isHeads) {
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 70px Arial';
            ctx.fillText('★', 256, 170);
        } else {
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 60px Arial';
            ctx.fillText('♔', 256, 170);
        }

        // Ano
        ctx.fillStyle = '#8b6914';
        ctx.font = 'bold 35px Arial';
        ctx.fillText('2025', 256, 360);

        return new THREE.CanvasTexture(canvas);
    };

    // Criar geometria e materiais
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 64);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xb8860b, shininess: 100 }),
        new THREE.MeshPhongMaterial({ map: createCoinTexture('CARA', true), shininess: 100 }),
        new THREE.MeshPhongMaterial({ map: createCoinTexture('COROA', false), shininess: 100 })
    ];

    coinMesh = new THREE.Mesh(geometry, materials);
    coinMesh.rotation.x = 0;
    coinMesh.rotation.y = 0;
    coinMesh.rotation.z = 0;
    coinMesh.position.y = 0;
    
    coinScene.add(coinMesh);

    coinCamera.position.set(0, 5, 2);
    coinCamera.lookAt(0, 0, 0);

    animateCoin();
}

function animateCoin() {
    requestAnimationFrame(animateCoin);
    if (coinRenderer && coinScene && coinCamera) {
        coinRenderer.render(coinScene, coinCamera);
    }
}

function flipCoin() {
    if (isFlipping || !coinMesh) return;
    isFlipping = true;

    const result = Math.random() < 0.5 ? 'Cara' : 'Coroa';
    
    const duration = 3000;
    const startTime = performance.now();
    
    const startPos = coinMesh.position.y;
    const startRotX = coinMesh.rotation.x;
    const startRotY = coinMesh.rotation.y;
    
    const targetRotationX = result === 'Cara' ? 0 : Math.PI;
    const numFlips = Math.floor(Math.random() * 5) + 8;
    const totalRotationX = (numFlips * Math.PI * 2) + targetRotationX;
    const totalRotationY = (Math.random() * 2 + 2) * Math.PI * 2;

    document.getElementById('coin-result').textContent = '';

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);

        if (t < 1) {
            if (t < 0.15) {
                const phaseT = t / 0.15;
                const easeT = Math.pow(phaseT, 0.5);
                
                coinMesh.position.y = startPos + (2 * easeT);
                coinMesh.rotation.x = startRotX + (totalRotationX * easeT * 0.3);
                coinMesh.rotation.y = startRotY + (totalRotationY * easeT * 0.3);
                
            } else if (t < 0.85) {
                const phaseT = (t - 0.15) / 0.7;
                
                const height = 2 + Math.sin(phaseT * Math.PI) * 0.5;
                coinMesh.position.y = height;
                
                coinMesh.rotation.x = startRotX + (totalRotationX * (0.3 + phaseT * 0.6));
                coinMesh.rotation.y = startRotY + (totalRotationY * (0.3 + phaseT * 0.6));
                
            } else {
                const phaseT = (t - 0.85) / 0.15;
                const easeT = 1 - Math.pow(1 - phaseT, 4);
                
                const currentHeight = 2 + Math.sin(0.7 * Math.PI) * 0.5;
                coinMesh.position.y = currentHeight * (1 - easeT);
                
                const currentRotX = startRotX + (totalRotationX * 0.9);
                const currentRotY = startRotY + (totalRotationY * 0.9);
                
                coinMesh.rotation.x = currentRotX + (targetRotationX - currentRotX) * easeT;
                coinMesh.rotation.y = currentRotY + (0 - currentRotY) * easeT;
            }

            requestAnimationFrame(animate);
        } else {
            coinMesh.position.y = 0;
            coinMesh.rotation.x = targetRotationX;
            coinMesh.rotation.y = 0;
            coinMesh.rotation.z = 0;
            
            document.getElementById('coin-result').textContent = result;
            isFlipping = false;
        }
    }

    requestAnimationFrame(animate);
}

// Ajustar tamanho do canvas no resize
window.addEventListener('resize', () => {
    if (coinRenderer) {
        const container = document.getElementById('coin-canvas');
        const size = Math.min(300, window.innerWidth - 80);
        coinRenderer.setSize(size, size);
        container.style.width = size + 'px';
        container.style.height = size + 'px';
    }
});

// Inicializar quando carregar a página
initCoin();