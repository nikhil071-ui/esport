// Email Templates
const getMainTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Arial', sans-serif; background-color: #0d0d12; color: #ffffff; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #15151e; border: 1px solid #2d2d3a; }
  .header { background-color: #7c3aed; padding: 20px; text-align: center; }
  .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #fff; text-transform: uppercase; }
  .body { padding: 30px; font-size: 16px; line-height: 1.6; color: #cfcfcf; }
  .highlight { color: #a78bfa; font-weight: bold; }
  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #2d2d3a; }
  .btn { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
        <div class="logo">NEXUS ESPORTS</div>
    </div>
    <div class="body">
        ${content}
    </div>
    <div class="footer">
        &copy; ${new Date().getFullYear()} Nexus Esports. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  welcomeEmail: (name) => getMainTemplate(`
    <h2>Welcome to the Arena, ${name}! 🎮</h2>
    <p>Your journey begins now. Your account has been successfully created and verified.</p>
    <p>You can now:</p>
    <ul>
        <li>Join official tournaments</li>
        <li>Build your team</li>
        <li>Climb the leaderboards</li>
    </ul>
    <p>Good luck!</p>
    <center><a href="http://localhost:5173" class="btn">ENTER BATTLEFIELD</a></center>
  `),

  tournamentJoinEmail: (tourneyName, date, time) => getMainTemplate(`
    <h2>Registration Confirmed! ⚔</h2>
    <p>You have successfully joined <strong>${tourneyName}</strong>.</p>
    <p><strong>📅 Date:</strong> ${date}</p>
    <p><strong>⏰ Time:</strong> ${time}</p>
    <p>Please be ready 15 minutes before the start time. Check your dashboard for bracket updates.</p>
  `),

  matchReminderEmail: (tourneyName, timeRemaining) => getMainTemplate(`
    <h2>⚠ MATCH STARTING SOON</h2>
    <p>Your tournament <strong>${tourneyName}</strong> is starting in <span class="highlight">${timeRemaining}</span>.</p>
    <p>Log in now and check in with your team to avoid disqualification.</p>
    <center><a href="http://localhost:5173" class="btn">GO TO LOBBY</a></center>
  `),
  
  chatNotificationEmail: (tourneyName, sender, message) => getMainTemplate(`
    <h3>New Message in ${tourneyName}</h3>
    <p><strong>${sender}</strong> says:</p>
    <blockquote style="border-left: 2px solid #7c3aed; padding-left: 10px; color: #fff;">${message}</blockquote>
    <p><a href="http://localhost:5173" style="color: #a78bfa">Reply in Tournament Chat</a></p>
  `),

  paymentPendingEmail: (tourneyName) => getMainTemplate(` 
    <h2>Payment Received ⏳</h2>
    <p>We have received your request to join <strong>${tourneyName}</strong>.</p>
    <p>Your transaction ID is currently being verified by our admins. You will receive a confirmation email once approved.</p>
  `),

  paymentRejectedEmail: (tourneyName) => getMainTemplate(`
    <h2>Registration Rejected ❌</h2>
    <p>Unfortunately, your request to join <strong>${tourneyName}</strong> has been rejected.</p>
    <p>This may be due to:</p>
    <ul>
      <li>Invalid Transaction ID</li>
      <li>Incorrect Payment Amount</li>
      <li>Team Name inappropriate</li>
    </ul>
    <p>You can try registering again from your dashboard.</p>
    <center><a href="http://localhost:5173" class="btn">GO TO DASHBOARD</a></center>
  `)
};
