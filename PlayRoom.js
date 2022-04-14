class PlayRoom {
    constructor(list, iterator, { socket, name }, ID) {
        this.time = {
            syncTime: 0,
            songTime: 0
        };
        this.syncCount = 0;
        this.playList = list;
        this.iterator = iterator;
        this.memberList = [];
        this.ID = ID;
        this.addMember({ socket: socket, name: name }, false);
        console.log(list);
    }
    get memberCount() {
        return this.memberList.length;
    }
    addMember(member, sync = true) {
        console.log(`addMember: ${member}`);
        this.memberList.push(member);
        member.socket.emit('roomConnected', this.ID);
        sync && member.socket.emit('sync', {
            list: this.playList,
            time: this.time
        });
        member.socket.on('close', () => this.memberList =
            this.memberList.filter(m => m != member));
        member.socket.on('play', data => {
            this.time = data.time;
            this.memberList.forEach(m => m != member &&
                m.socket.emit('play', { time: this.time }));
        });
        member.socket.on('pause', data => {
            this.time = data.time;
            this.memberList.forEach(m => m != member &&
                m.socket.emit('pause', { time: this.time }));
        });
        member.socket.on('syncSeek', data => {
            this.time = data.time;
            this.memberList.forEach(m => m != member &&
                m.socket.emit('sync', { time: this.time }));
        });
        member.socket.on('addSong', data => {
            this.iterator = data.iterator;
            if (data.now)
                this.playList.splice(this.iterator, 0, data.song);
            else
                this.playList.push(data.song);
            this.memberList.forEach(m => {
                m.socket.emit('sync', {
                    list: this.playList,
                    iterator: this.iterator,
                });
            });
            this.syncCount = 0;
            console.log(this.memberList.length);
            member.socket.once('syncComplete', () => {
                console.log(this.syncCount);
                if (++this.syncCount === this.memberList.length) {
                    const nowTime = new Date().getTime();
                    this.memberList.forEach(m => m.socket.emit('play', {
                        time: { songTime: 0, syncTime: nowTime }
                    }));
                }
            });
            // setTimeout(() => {
            //   const nowTime = new Date().getTime();
            //   this.memberList.forEach(m => {
            //     m.socket.emit('play', { 
            //       time: { songTime: 0, syncTime: nowTime }
            //     });
            //   }, 300);
            // })
        });
    }
    ;
}
export default PlayRoom;
