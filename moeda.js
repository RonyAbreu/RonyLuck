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
    container.style.width = size + 'px';
    container.style.height = size + 'px';

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    coinScene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight1.position.set(5, 10, 5);
    coinScene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-5, -5, 5);
    coinScene.add(dirLight2);

    // Texturas
    const createCoinTexture = (text, isHeads) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Rotacionar o contexto para que o texto fique horizontal na moeda
        ctx.translate(256, 256);
        ctx.rotate(-Math.PI / 2);
        
        // Se for COROA (verso), rotacionar 180° a mais para compensar o flip
        if (!isHeads) {
            ctx.rotate(Math.PI);
        }
        
        ctx.translate(-256, -256);

        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffed4e');
        gradient.addColorStop(0.8, '#daa520');
        gradient.addColorStop(1, '#b8860b');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(256, 256, 250, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(256, 256, 240, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(256, 256, 220 - i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#654321';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);

        if (isHeads) {
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 70px Arial';
            ctx.fillText('★', 256, 170);
        } else {
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 60px Arial';
            ctx.fillText('♔', 256, 170);
        }

        ctx.fillStyle = '#8b6914';
        ctx.font = 'bold 35px Arial';
        ctx.fillText('2025', 256, 360);

        return new THREE.CanvasTexture(canvas);
    };

    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 64);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xb8860b, shininess: 100 }), // borda
        new THREE.MeshPhongMaterial({ map: createCoinTexture('CARA', true), shininess: 100 }),
        new THREE.MeshPhongMaterial({ map: createCoinTexture('COROA', false), shininess: 100 })
    ];

    coinMesh = new THREE.Mesh(geometry, materials);
    // Rotacionar para que a moeda fique horizontal (de frente para a câmera)
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.rotation.y = 0;
    coinMesh.rotation.z = 0;
    coinMesh.position.y = 0;
    
    coinScene.add(coinMesh);

    coinCamera.position.set(0, 0, 5);
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

    // Ajustar rotações finais para moeda horizontal
    const faceRotations = {
        'Cara': new THREE.Euler(Math.PI / 2, 0, 0),      // Face CARA virada para frente
        'Coroa': new THREE.Euler(-Math.PI / 2, 0, 0)     // Face COROA virada para frente
    };

    const targetEuler = faceRotations[result];
    
    const duration = 2000;
    const startTime = performance.now();
    const startRotation = {
        x: coinMesh.rotation.x,
        y: coinMesh.rotation.y,
        z: coinMesh.rotation.z
    };

    // Número de voltas completas + rotação final
    const fullSpins = 4 + Math.floor(Math.random() * 2); // 4-5 voltas
    const totalRotationX = (fullSpins * Math.PI * 2) + (result === 'Cara' ? 0 : Math.PI);

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        if (t < 1) {
            // Movimento vertical suave (lançamento para cima)
            const jumpHeight = 0.5; // Altura reduzida para não sair do card
            coinMesh.position.y = Math.sin(t * Math.PI) * jumpHeight;

            // Rotação suave com desaceleração
            const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            // Girar principalmente no eixo X (flip cara/coroa)
            coinMesh.rotation.x = startRotation.x + totalRotationX * easeT;
            
            // Adicionar leve rotação em Y e Z para efeito mais realista
            coinMesh.rotation.y = startRotation.y + (Math.sin(t * Math.PI * 3) * 0.2);
            coinMesh.rotation.z = startRotation.z + (Math.sin(t * Math.PI * 2) * 0.1);
            
            requestAnimationFrame(animate);
        } else {
            // Finalizar na posição e rotação exatas
            coinMesh.position.y = 0;
            coinMesh.rotation.x = targetEuler.x;
            coinMesh.rotation.y = 0;
            coinMesh.rotation.z = 0;
            isFlipping = false;
        }
    }

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    if (coinRenderer) {
        const container = document.getElementById('coin-canvas');
        const size = Math.min(300, window.innerWidth - 80);
        coinRenderer.setSize(size, size);
        container.style.width = size + 'px';
        container.style.height = size + 'px';
    }
});

initCoin();