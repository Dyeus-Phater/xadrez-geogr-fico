// Variáveis de conexão
let ws = null;
let currentRoom = null;
let playerColor = null;

// Configurar controles multiplayer
function setupMultiplayerControls() {
    document.getElementById('create-room').addEventListener('click', () => {
        const roomCode = document.getElementById('room-code').value;
        if (roomCode) {
            connectToRoom(roomCode, 'white');
        } else {
            alert('Por favor, insira um código para a sala');
        }
    });

    document.getElementById('join-room').addEventListener('click', () => {
        const roomCode = document.getElementById('room-code').value;
        if (roomCode) {
            connectToRoom(roomCode, 'black');
        } else {
            alert('Por favor, insira o código da sala');
        }
    });
}

// Conectar ao WebSocket
function connectToRoom(room, color) {
    if (ws) {
        ws.close();
    }

    currentRoom = room;
    playerColor = color;
    ws = new WebSocket(`ws://${window.location.hostname}:3000?room=${room}&color=${color}`);

    ws.onopen = () => {
        alert(`Conectado à sala ${room} como ${color === 'white' ? 'Branco' : 'Preto'}`);
        resetGame();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'opponent_joined':
                alert('Oponente conectado! O jogo vai começar.');
                break;
            case 'game_start':
                alert('Jogo iniciado!');
                break;
            case 'opponent_disconnected':
                alert('Oponente desconectou.');
                break;
            case 'move':
                handleOpponentMove(data.from, data.to);
                break;
        }
    };

    ws.onclose = () => {
        alert('Desconectado da sala');
        currentRoom = null;
        playerColor = null;
    };

    ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        alert('Erro ao conectar ao servidor');
    };
}

// Função para lidar com movimento do oponente
function handleOpponentMove(from, to) {
    const fromSquare = document.querySelector(`[data-position="${from}"]`);
    const toSquare = document.querySelector(`[data-position="${to}"]`);
    
    if (fromSquare && toSquare) {
        const piece = fromSquare.querySelector('.chess-piece');
        if (piece) {
            movePiece(fromSquare, toSquare, piece);
        }
    }
}

// Função para enviar movimento ao servidor
function sendMove(from, to) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'move',
            from: from,
            to: to
        }));
    }
}

// Exportar funções necessárias
window.setupMultiplayerControls = setupMultiplayerControls;
window.sendMove = sendMove;
window.getPlayerColor = () => playerColor;
window.isConnected = () => ws && ws.readyState === WebSocket.OPEN;