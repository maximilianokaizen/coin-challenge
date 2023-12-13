import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

const roomsFilePath = path.join(__dirname, 'data', 'rooms.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const redisClient = new Redis(); 

const SOME_CONVERSION_FACTOR_X = 0.0001;
const SOME_CONVERSION_FACTOR_Y = 0.0001;

type Coordinates = { x: number; y: number; z: number };
type Coin = { position: Coordinates; room: string; id: number };
type RoomConfig = {
    room: string;
    roomId: string;
    coins: number;
    area: { xmax: number; xmin: number; ymax: number; ymin: number; zmax: number; zmin: number };
};

const generatedCoins: Record<string, Coin[]> = {};

function generateCoins(roomConfig: RoomConfig): void {
    const { room, coins, area } = roomConfig;
    generatedCoins[room] = [];
    let idCounter = 1;

    for (let i = 0; i < coins; i++) {
        const x = Math.floor(Math.random() * (area.xmax - area.xmin + 1)) + area.xmin;
        const y = Math.floor(Math.random() * (area.ymax - area.ymin + 1)) + area.ymin;
        const z = Math.floor(Math.random() * (area.zmax - area.zmin + 1)) + area.zmin;
        const latitude = x * SOME_CONVERSION_FACTOR_X; // specific for 3d world scale
        const longitude = y * SOME_CONVERSION_FACTOR_Y; // specific for 3d world scale
        const coin: Coin = { position: { x, y, z }, room, id: idCounter++ };
        generatedCoins[room].push(coin);
        redisClient.geoadd(room, longitude, latitude, 'coin' + coin.id);
        redisClient.expire(room, 3600); 
    }
}

function readRoomConfigurations(): RoomConfig[] {
    try {
        const data = fs.readFileSync(roomsFilePath, 'utf8');
        const roomConfigs: RoomConfig[] = JSON.parse(data);
        return roomConfigs;
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        return [];
    }
}

function initializeRooms(): void {
    const roomConfigs = readRoomConfigurations();

    roomConfigs.forEach((roomConfig, index) => {
        generateCoins(roomConfig);
    });
}

initializeRooms();

function emitCoinsAvailable(socket: Socket, room: string): void {
    if (generatedCoins[room]) {
        socket.emit('coins', generatedCoins[room]);
    }
}

io.on('connection', (socket: Socket) => {
    socket.on('getCoins', (room: string) => {
        emitCoinsAvailable(socket, room);
    });

    socket.on('grabCoin', (coinId: number, room: string) => {
        const index = generatedCoins[room]?.findIndex((coin) => coin.id === coinId);
        if (index !== undefined && index !== -1) {
            const grabbedCoin = generatedCoins[room]?.splice(index, 1)[0];
            if (grabbedCoin) {
                redisClient.zrem(room, 'coin' + coinId, (err, result) => {
                    if (err) {
                        console.error('Error eliminando la moneda', err);
                    } else {
                        console.log('Moneda eliminada:', result);
                    }
                });
                io.to(room).emit('coinGrabbed', grabbedCoin);
                console.log('Moneda agarrada:', grabbedCoin);
            }
        } else {
            console.log('Moneda no encontrada');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const roomConfig: RoomConfig = {
    room: 'exampleRoom',
    roomId: '1', // or UUID
    coins: 10,
    area: { xmax: 100, xmin: 0, ymax: 100, ymin: 0, zmax: 50, zmin: 0 },
};

generateCoins(roomConfig);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// API ROUTES

// list coins from rooms

app.get('/coins/:room', (req, res) => {
    const room = req.params.room as string;
    if (generatedCoins[room]) {
        const coinsAvailable = generatedCoins[room].length;
        res.json({ room, coinsAvailable });
    } else {
        res.status(404).json({ error: 'Error' });
    }
});

// list all rooms

app.get('/rooms', (req, res) => {
    const roomsAvailable = Object.keys(generatedCoins);
    res.json({ rooms: roomsAvailable });
});
