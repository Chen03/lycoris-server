class PlayRoom {
    constructor(list, { socket, name }, ID) {
        this.time = {
            syncTime: 0,
            songTime: 0
        };
        this.playList = list;
        this.memberList = [{
                socket: socket,
                name: name
            }];
        this.ID = ID;
        this.addMember(this.memberList[0], false);
        console.log(list);
    }
    addMember(member, sync = true) {
        this.memberList.push(member);
        member.socket.emit('roomConnected', this.ID);
        sync && member.socket.emit('sync', {
            list: this.playList,
            time: this.time
        });
        member.socket.on('play', data => {
            this.time = data.time;
            this.memberList.forEach(member => member.socket.emit('play', { time: this.time }));
        });
        member.socket.on('pause', data => {
            this.time = data.time;
            this.memberList.forEach(member => member.socket.emit('pause', { time: this.time }));
        });
    }
    ;
}
export default PlayRoom;
