// ============================================================================
// Elevated Discord IPC Bridge (Used when Discord is running as Administrator)
// Forwards local TCP 127.0.0.1:59482 <-> \\?\pipe\discord-ipc-0
// ============================================================================

const net = require('net');

const BRIDGE_PORT = 59482;

function findDiscordPipe(index, cb) {
  if (index > 9) return cb(null);
  const pipePath = `\\\\?\\pipe\\discord-ipc-${index}`;
  const testSock = net.createConnection(pipePath);
  testSock.once('connect', () => {
    cb(testSock, pipePath);
  });
  testSock.once('error', () => {
    testSock.destroy();
    findDiscordPipe(index + 1, cb);
  });
}

const server = net.createServer((clientSock) => {
  findDiscordPipe(0, (discordSock) => {
    if (!discordSock) {
      clientSock.destroy();
      return;
    }
    clientSock.pipe(discordSock);
    discordSock.pipe(clientSock);

    clientSock.on('error', () => discordSock.destroy());
    discordSock.on('error', () => clientSock.destroy());
    clientSock.on('close', () => discordSock.destroy());
    discordSock.on('close', () => clientSock.destroy());
  });
});

server.on('error', () => {
  process.exit(0);
});

server.listen(BRIDGE_PORT, '127.0.0.1', () => {
  console.log(`[Discord Admin Bridge] Actif sur 127.0.0.1:${BRIDGE_PORT}`);
});
