import { WebSocket } from "ws";
import Socket from "./Socket.js";

interface Song {
  name: string,
  artists: Array<{ name: string }>,
  url: string,
  picUrl: string
}

interface Member {
  socket: Socket,
  name: string
}

class PlayRoom {
  private playList: Array<Song>;
  private memberList: Array<Member>;
  private time = {
    syncTime: 0,
    songTime: 0
  };

  public ID: number;

  constructor(list: Array<Song>, { socket, name }: Member, ID: number) {
    this.playList = list;
    this.memberList = [{
      socket: socket,
      name: name
    }];
    this.ID = ID;

    this.addMember(this.memberList[0], false);
    console.log(list);
  }

  addMember(member: Member, sync: boolean = true) {
    this.memberList.push(member);
    member.socket.emit('roomConnected', this.ID);
    sync && member.socket.emit('sync', {
      list: this.playList, 
      time: this.time
    });
    
    member.socket.on('play', data => {
      this.time = data.time;
      this.memberList.forEach(member => 
        member.socket.emit('play', { time: this.time }));
    });
    member.socket.on('pause', data => {
      this.time = data.time;
      this.memberList.forEach(member => 
        member.socket.emit('pause', { time: this.time }));
    });
  };
}

export { Song, Member };
export default PlayRoom;