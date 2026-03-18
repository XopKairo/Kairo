const fs = require('fs');
const lines = fs.readFileSync('backend-mongo/sockets/socket.js', 'utf8').split('\n');
const startIndex = lines.findIndex(l => l.includes('socket.on("callAccepted"'));
console.log(lines.slice(startIndex, startIndex + 50).join('\n'));
