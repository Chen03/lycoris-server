import { WebSocketServer } from 'ws';
import PlayRoom from './PlayRoom.js';
import Socket from './Socket.js';
const wss = new WebSocketServer({ port: 3001 });
let playRoomList = [];
let memberMap = new Map();
function createRoom(socket, list) {
    const newRoom = new PlayRoom(list, { socket: socket, name: memberMap.get(socket) }, playRoomList.length);
    playRoomList.push(newRoom);
}
wss.on('connection', function connection(ws) {
    console.log('connection');
    const socket = new Socket(ws);
    socket.on('setUpName', function (data) {
        memberMap.set(socket, data);
    });
    socket.on('createRoom', (data) => createRoom(socket, data));
});
