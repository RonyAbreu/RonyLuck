// Dado 3D com Three.js
let diceScene, diceCamera, diceRenderer, diceMesh;
let isRolling = false;

function initDice() {
    const container = document.getElementById('dice-canvas');
    if (!container) return;

    diceScene = new THREE.Scene();
    diceCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const size = Math.min(300, window.innerWidth - 80);
    diceRenderer.setSize(size, size);
    container.appendChild(diceRenderer.domElement);
    container.style.width = size + 'px';
    container.style.height = size + 'px';

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
        new THREE.MeshStandardMaterial({ map: createFaceTexture(3) }),
        new THREE.MeshStandardMaterial({ map: createFaceTexture(4) }),
        new THREE.MeshStandardMaterial({ map: createFaceTexture(5) }),
        new THREE.MeshStandardMaterial({ map: createFaceTexture(2) }),
        new THREE.MeshStandardMaterial({ map: createFaceTexture(1) }),
        new THREE.MeshStandardMaterial({ map: createFaceTexture(6) })
    ];

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    diceMesh = new THREE.Mesh(geometry, materials);
    diceScene.add(diceMesh);

    diceMesh.rotation.set(0, 0, 0);
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

    const faceRotations = {
        1: new THREE.Euler(0, 0, 0),
        2: new THREE.Euler(Math.PI / 2, 0, 0),
        3: new THREE.Euler(0, -Math.PI / 2, 0),
        4: new THREE.Euler(0, Math.PI / 2, 0),
        5: new THREE.Euler(-Math.PI / 2, 0, 0),
        6: new THREE.Euler(0, Math.PI, 0)
    };

    const targetEuler = faceRotations[result];
    
    const duration = 1000;
    const startTime = performance.now();
    const startRotation = {
        x: diceMesh.rotation.x,
        y: diceMesh.rotation.y,
        z: diceMesh.rotation.z
    };

    const spinSpeedX = (Math.random() * 2 + 3) * Math.PI;
    const spinSpeedY = (Math.random() * 2 + 3) * Math.PI;
    const spinSpeedZ = (Math.random() * 2 + 3) * Math.PI;

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        if (t < 1) {
            if (t < 0.85) {
                diceMesh.rotation.x = startRotation.x + (spinSpeedX * elapsed / 1000);
                diceMesh.rotation.y = startRotation.y + (spinSpeedY * elapsed / 1000);
                diceMesh.rotation.z = startRotation.z + (spinSpeedZ * elapsed / 1000);
            } else {
                const slowT = (t - 0.85) / 0.15;
                const easeT = 1 - Math.pow(1 - slowT, 4);
                
                diceMesh.rotation.x = diceMesh.rotation.x + (targetEuler.x - diceMesh.rotation.x) * easeT * 0.3;
                diceMesh.rotation.y = diceMesh.rotation.y + (targetEuler.y - diceMesh.rotation.y) * easeT * 0.3;
                diceMesh.rotation.z = diceMesh.rotation.z + (targetEuler.z - diceMesh.rotation.z) * easeT * 0.3;
            }
            
            requestAnimationFrame(animate);
        } else {
            diceMesh.rotation.x = targetEuler.x;
            diceMesh.rotation.y = targetEuler.y;
            diceMesh.rotation.z = targetEuler.z;
            isRolling = false;
        }
    }

    requestAnimationFrame(animate);
}

// Ajustar tamanho do canvas no resize
window.addEventListener('resize', () => {
    if (diceRenderer) {
        const container = document.getElementById('dice-canvas');
        const size = Math.min(300, window.innerWidth - 80);
        diceRenderer.setSize(size, size);
        container.style.width = size + 'px';
        container.style.height = size + 'px';
    }
});

// Inicializar quando carregar a página
initDice();