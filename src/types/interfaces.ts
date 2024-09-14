import { IncomingMessage } from "http";
import { Socket } from "socket.io";

export interface CustomRequest extends IncomingMessage {
  cookies: { [key: string]: string };
  res?: Response;
}

export interface CustomSocket extends Socket {
  request: CustomRequest;
  user?: any;
}
