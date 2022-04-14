import EventEmitter from "events";
import { RawData, WebSocket } from "ws";

class Socket {
  private ws: WebSocket;
  private emitter: EventEmitter = new EventEmitter();
  constructor(ws: WebSocket) {
    ws.on('message', this.praseMessage.bind(this));
    this.ws = ws;

    ws.onopen = e => this.emitter.emit('open');
    ws.onclose = e => this.emitter.emit('close');
  }

  private praseMessage(data: RawData) {
    const json = JSON.parse(data.toString());
    console.log(json);
    this.emitter.emit(json.type, json.data);
  }

  on(eventName: string, callback: (this: Socket, ...args) => void) {
    this.emitter.on(eventName, callback.bind(this));
  }

  once(eventName: string, callback: (this: Socket, ...args) => void) {
    this.emitter.once(eventName, callback.bind(this));
  }

  emit(type: string, data): boolean {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: type,
        data: data
      }));
      return true;
    } else return false;
  }
}

export default Socket;