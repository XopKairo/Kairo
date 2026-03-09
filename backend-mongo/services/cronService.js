import cron from "node-cron";
import User from "../models/User.js";
import { sendPushNotification } from "./pushService.js";

// Run every day at 10:00 AM
cron.schedule("0 10 * * *", async () => {
  console.log("Running Inactive User Notification Job...");
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    // Find users who haven't logged in for 3 days but have a push token
    const inactiveUsers = await User.find({
      lastLoginDate: { $lt: threeDaysAgo },
      pushToken: { $exists: true, $ne: "" }
    });

    for (const user of inactiveUsers) {
      await sendPushNotification(
        user.pushToken,
        "We Miss You! ❤️",
        "Your favorite hosts are online and waiting. Come say hi!"
      );
    }
    
    console.log(`Sent notifications to ${inactiveUsers.length} inactive users.`);
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});
