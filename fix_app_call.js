const fs = require('fs');
let code = fs.readFileSync('mobile-app/App.js', 'utf8');

code = code.replace(
`      socketService.setIncomingCallHandler((data) => {
        setIncomingCall(data);
      });`,
`      socketService.setIncomingCallHandler((data) => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute && currentRoute.name === 'VideoCall') {
          // Reject automatically if already in a call
          if (socketService.socket) {
            socketService.socket.emit('callEnded', data.callId);
          }
          return;
        }
        setIncomingCall(data);
      });`
);

fs.writeFileSync('mobile-app/App.js', code);
