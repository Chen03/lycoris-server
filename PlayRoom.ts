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

function genUUID() { return Math.round(Math.random() * 1000000); }

class PlayRoom {
  private playList: Array<Song>;
  private iterator: number;
  private memberList: Array<Member>;
  private time = {
    syncTime: 0,
    songTime: 0
  };
  private paused: boolean = true;

  private syncCount: number = 0;
  private finishCount: number = 0;

  public ID: number;
  public get memberCount(): number {
    return this.memberList.length;
  }

  constructor(list: Array<Song>, iterator: number, { socket, name }: Member, ID: number) {
    this.playList = list;
    this.iterator = iterator;
    this.memberList = [];
    this.ID = ID;

    this.addMember({ socket, name }, false);
    console.log({ list, iterator });
  }

  emitAll(type: string, data: any) {
    this.memberList.forEach(member => member.socket.emit(type, data));
  }

  sendMessage(message: string, type: string = 'info') {
    this.emitAll('message', { message, type });
  }

  addMember(member: Member, sync: boolean = true) {
    console.log(`addMember: ${member}`);
    this.memberList.push(member);
    member.socket.emit('roomConnected', this.ID);
    sync && member.socket.emit('sync', {
      list: this.playList, 
      iterator: this.iterator,
      time: this.time,
      paused: this.paused
    });

    member.socket.on('close', () => this.memberList = 
      this.memberList.filter(m => m != member));
    member.socket.on('exitRoom', () => this.memberList = 
      this.memberList.filter(m => m != member));
    
    member.socket.on('play', data => {
      this.time = data.time;
      this.paused = false;
      this.memberList.forEach(m => m != member &&
        m.socket.emit('play', { time: this.time }));
    });
    member.socket.on('pause', data => {
      this.time = data.time;
      this.paused = true;
      this.memberList.forEach(m => m != member &&
        m.socket.emit('pause', { time: this.time }));
    });
    member.socket.on('syncSeek', data => {
      this.time = data.time;
      this.memberList.forEach(m => m != member &&
        m.socket.emit('sync', { time: this.time }));
    });

    const syncPlayList = needReplay => {
      console.log({ list: this.playList, iterator: this.iterator });
      this.finishCount = 0;
      const paused = this.paused;
      this.memberList.forEach(m => {
        m.socket.emit('sync', { 
          list: this.playList,
          iterator: this.iterator,
          paused: needReplay
        });
        if (needReplay) {
          this.paused = true;
          if (!paused) {
            m.socket.once('syncComplete', () => {
              console.log(this.syncCount);
              if (++this.syncCount === this.memberList.length) {
                this.paused = false;
                const nowTime = new Date().getTime();
                this.memberList.forEach(m => m.socket.emit('play', {
                  time: { songTime: 0, syncTime: nowTime }
                }));
              }
            });
          }
        }
      });
      this.syncCount = 0;
      console.log(this.memberList.length);
    };
    member.socket.on('addSong', data => {
      // this.iterator = data.iterator;
      data.song.uuid = genUUID();
      if (data.now)  this.playList.splice(this.iterator, 0, data.song);
      else  this.playList.push(data.song);
      syncPlayList(data.now);
      this.sendMessage(`${member.name} 添加了 ${data.song.name}!`);
    });
    member.socket.on('nextSong', () => {
      if (this.playList.length > this.iterator + 1) {
        ++this.iterator;
        syncPlayList(true);
        this.sendMessage(`${member.name} 切了下一首～`);
      }
    });
    member.socket.on('prevSong', () => {
      if (this.iterator > 0) {
        --this.iterator;
        syncPlayList(true);
        this.sendMessage(`${member.name} 切了上一首，再来亿遍！`);
      }
    });
    member.socket.on('changeSong', it => {
      if (this.iterator !== it) {
        this.iterator = it;
        syncPlayList(true);
        this.sendMessage(`${member.name} 切歌了诶`);
      }
    });

    member.socket.on('finishedPlay', () => {
      if (++this.finishCount === this.memberCount && 
          this.iterator + 1 < this.playList.length) {
        ++this.iterator;
        syncPlayList(true);
        this.sendMessage(`大家都听完了，开始下一首啦`);
      }
    })
  };
}

export { Song, Member };
export default PlayRoom;