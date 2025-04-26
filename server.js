const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir arquivos estáticos
app.use(express.static('.'));

// Armazenar as salas e conexões
const rooms = new Map();

// Gerenciar conexões WebSocket
wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const room = params.get('room');
    const color = params.get('color');

    if (!room || !color) {
        ws.close();
        return;
    }

    // Criar ou entrar em uma sala
    if (!rooms.has(room)) {
        rooms.set(room, new Map());
    }
    const currentRoom = rooms.get(room);
    
    // Verificar se a cor já está em uso na sala
    if (currentRoom.has(color)) {
        ws.close();
        return;
    }

    // Adicionar jogador à sala
    currentRoom.set(color, ws);

    // Notificar que o oponente entrou
    const opponent = color === 'white' ? 'black' : 'white';
    if (currentRoom.has(opponent)) {
        currentRoom.get(opponent).send(JSON.stringify({ type: 'opponent_joined' }));
        ws.send(JSON.stringify({ type: 'game_start' }));
    }

    // Gerenciar mensagens do jogador
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const opponent = color === 'white' ? 'black' : 'white';
            
            if (currentRoom.has(opponent)) {
                currentRoom.get(opponent).send(message);
            }
        } catch (e) {
            console.error('Erro ao processar mensagem:', e);
        }
    });

    // Gerenciar desconexão
    ws.on('close', () => {
        if (currentRoom.has(color)) {
            currentRoom.delete(color);
            
            // Notificar oponente sobre a desconexão
            const opponent = color === 'white' ? 'black' : 'white';
            if (currentRoom.has(opponent)) {
                currentRoom.get(opponent).send(JSON.stringify({ type: 'opponent_disconnected' }));
            }

            // Remover sala se estiver vazia
            if (currentRoom.size === 0) {
                rooms.delete(room);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});