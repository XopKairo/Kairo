const fs = require('fs');
let code = fs.readFileSync('backend-mongo/sockets/socket.js', 'utf8');

// Inside callStarted:
code = code.replace(
`        const hostDoc = await Host.findById(targetRoomId);
        if (hostDoc) {
          targetRoomId = hostDoc.userId.toString();
        }

        if (targetRoomId) {
          io.to(targetRoomId).emit("incomingCall", { ...data, hostUserId: targetRoomId });

          // Initial LiveCall entry
          await LiveCall.create({
            callId,
            userId,
            hostId: targetRoomId,
            status: "RINGING",
          });`,
`        const hostDoc = await Host.findById(targetRoomId);
        let actualHostId = hostId; // default to original
        if (hostDoc) {
          targetRoomId = hostDoc.userId.toString();
          actualHostId = hostDoc._id.toString();
        } else {
          // If not found by ID, maybe it's already a userId, let's find the Host
          const h = await Host.findOne({ userId: targetRoomId });
          if(h) actualHostId = h._id.toString();
        }

        if (targetRoomId) {
          io.to(targetRoomId).emit("incomingCall", { ...data, hostUserId: targetRoomId });

          // Initial LiveCall entry
          await LiveCall.create({
            callId,
            userId,
            hostId: actualHostId, // Save the actual Host document _id
            status: "RINGING",
          });`
);

// Inside callAccepted
code = code.replace(
`        // Store call state in Redis for authoritative tracking
        await redisClient.hSet(\`activeCall:\${callId}\`, {
          callerId: call.userId.toString(),
          hostId: call.hostId.toString(),
          startTime: startTime.toString(),
          ratePerMinute: ratePerMinute.toString(),
        });
        await redisClient.expire(\`activeCall:\${callId}\`, 3600); // 1 hour safety expiry

        call.status = "ACTIVE";
        call.startedAt = new Date(startTime);
        await call.save();`,
`        // Store call state in Redis for authoritative tracking
        await redisClient.hSet(\`activeCall:\${callId}\`, {
          callerId: call.userId.toString(),
          hostId: call.hostId.toString(),
          startTime: startTime.toString(),
          ratePerMinute: ratePerMinute.toString(),
        });
        await redisClient.expire(\`activeCall:\${callId}\`, 3600); // 1 hour safety expiry

        call.status = "ACTIVE";
        call.startedAt = new Date(startTime);
        await call.save();
        
        // Start the actual billing Call via CallService
        try {
           await callService.startCall(call.userId.toString(), call.hostId.toString(), callId);
        } catch (e) {
           console.error("Failed to start actual Call document:", e);
        }`
);

// Inside endCallAndDeductBalance
code = code.replace(
`      // 3. Mark Host as Online again
      const h = await Host.findOneAndUpdate({ userId: callData.hostId }, { status: "Online" }, { new: true });
      if (h) io.emit("statusUpdate", { hostId: h._id, status: "Online" });`,
`      // 3. Mark Host as Online again
      // callData.hostId is the actual Host document _id here!
      const h = await Host.findByIdAndUpdate(callData.hostId, { status: "Online" }, { new: true });
      if (h) { io.emit("statusUpdate", { hostId: h._id, status: "Online" }); }
      else {
         // fallback
         const h2 = await Host.findOneAndUpdate({ userId: callData.hostId }, { status: "Online" }, { new: true });
         if(h2) io.emit("statusUpdate", { hostId: h2._id, status: "Online" });
      }`
);

fs.writeFileSync('backend-mongo/sockets/socket.js', code);
