import { WebSocket, WebSocketServer } from 'ws';
import PlayRoom, { Song } from './PlayRoom.js';
import Socket from './Socket.js';

const wss = new WebSocketServer({ port: 3001 });

let playRoomList : Array<PlayRoom> = [];
let memberMap = new Map();

function createRoom(socket: Socket, list: Array<Song>) {
  const newRoom = new PlayRoom(list, { socket: socket, name: memberMap.get(socket) }, playRoomList.length);
  playRoomList.push(newRoom);
}

wss.on('connection', function connection(ws) {
  console.log('connection');
  const socket = new Socket(ws);
  socket.on('setUpName', function(data) {
    memberMap.set(socket, data);
  });
  socket.on('createRoom', (data) => createRoom(socket, data));
});