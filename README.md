# Tank Game Nextgen
Tank game is a simple 3D multiplayer game written in TypeScirpt.

# Screenshots

![Tank](https://github.com/sduoduo233/tankgame_nextgen/raw/master/screenshots/1.png)
![Plane 1](https://github.com/sduoduo233/tankgame_nextgen/raw/master/screenshots/2.png)
![Plane 2](https://github.com/sduoduo233/tankgame_nextgen/raw/master/screenshots/3.png)

# Demo server
[https://us2.1000005.xyz/tankgame/](https://us2.1000005.xyz/tankgame/)

(This is hosted on a very cheap VSP, so please expect it to go offline any time)

# How to play
- `WASD` to move around
- `Space bar` or `Left click` to shot
- `Mouse` or `Arraw keys` to look around
- `T` to open chat screen and `Enter` to send message
- Click `Touch screen` at top-right of the screen to enable touch screen support for mobile devices

# How to run locally
0. Install nodejs and npm
1. Clone this repo
2. `npm install`
3. Start your backend server
4. `npm run dev`

# Backend server
Backend server is just a simple WebSocket chat room. It forwards incoming messages to every other clients.

```javascript
import WebSocket, { WebSocketServer } from 'ws';

const server = new WebSocketServer({
    host: "0.0.0.0",
    port: "8080"
});

server.on('connection', function connection(ws) {
    console.log(`online: ${server.clients.size}`);

    ws.on('message', function message(data) {
        server.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(data.toString());
            }
        });
    });

    ws.once("close", () => {
        console.log(`online: ${server.clients.size}`);
    })
});

server.on("error", (err) => {
    console.error(err);
})
```