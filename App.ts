import { WebSocketServer } from 'ws';
import { createServer } from 'https'
import PlayRoom, { Song } from './PlayRoom.js';
import Socket from './Socket.js';
import { readFileSync } from 'fs';

const server = createServer({
  key: readFileSync('../cert/balanca.cn.key'),
  cert: readFileSync('../cert/balanca.cn_bundle.crt'),
})

const wss = new WebSocketServer({ server });
// const wss = new WebSocketServer({ port: 3001 });

let playRoomList : Array<PlayRoom> = [];
let memberMap = new Map();

function createRoom(socket: Socket, list: Array<Song>, iterator: number) {
  const newRoom = new PlayRoom(list, iterator, { socket: socket, name: memberMap.get(socket) }, playRoomList.length);
  playRoomList.push(newRoom);
}

wss.on('connection', function connection(ws) {
  console.log('connection');
  const socket = new Socket(ws);
  socket.on('setUpName', function(data) {
    memberMap.set(socket, data);
  });
  socket.on('createRoom', (data) => createRoom(socket, data.list, data.iterator));
  socket.on('requestAvaliableRoom', () =>
    socket.emit('avaliableRooms', playRoomList.map(
      (room, index) => ({ ID: index, count: room.memberCount })
    ))
  );
  socket.on('joinRoom', ID => playRoomList[ID].addMember({ socket: socket, name: memberMap.get(socket) }));
});

server.listen(3001);