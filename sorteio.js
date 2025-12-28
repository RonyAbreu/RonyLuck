// Sorteador de Números
let drawnNumbers = [];

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