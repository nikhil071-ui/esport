const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const admin = require("firebase-admin");
const cron = require('node-cron');
const templates = require('./emailTemplates');

// Initialize Environment & App
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- 1. FIREBASE ADMIN SETUP ---
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Production: Load from Environment Variable (Render)
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        // Development: Load from file
        serviceAccount = require("./serviceAccountKey.json");
    }
} catch (error) {
    console.error("Failed to load Firebase credentials:", error);
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
}

// --- 2. NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper Function for HTML Emails
const sendHtmlEmail = (to, subject, htmlContent) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: htmlContent
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("Email Error:", error);
        else console.log("Email Sent:", info.response);
    });
};

// --- CRON JOB: TOURNAMENT REMINDER (Every Minute) ---
// Checks for tournaments starting in 30 minutes
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const thirtyMinLater = new Date(now.getTime() + 30 * 60000);
    
    // Format to match stored string format if necessary, or better store as ISO
    // Assuming stored as "YYYY-MM-DD" and "HH:mm" strings
    // We fetch all "Open" or "Verifying" tournaments and check their timestamps manually
    
    const snapshot = await admin.firestore().collection('tournaments').where('status', '!=', 'Completed').get();
    
    snapshot.forEach(doc => {
        const t = doc.data();
        if (!t.date || !t.time) return;

        const tDateTime = new Date(`${t.date}T${t.time}`);
        const timeDiff = tDateTime - now;
        
        // Check if starts between 29 and 31 minutes from now (to catch it once)
        const diffMinutes = timeDiff / 60000;
        
        // Also check if we haven't sent a reminder yet (avoid spam)
        if (diffMinutes >= 29 && diffMinutes <= 31 && !t.reminderSent) {
            console.log(`Sending reminder for ${t.title}`);
            
            // Get all participant emails
            const emails = t.participants.map(p => p.email);
            if (emails.length > 0) {
                // Send in batches or Bcc
                emails.forEach(email => {
                    sendHtmlEmail(
                        email, 
                        `🔔 Starting Soon: ${t.title}`,
                        templates.matchReminderEmail(t.title, "30 Minutes")
                    );
                });
            }
            
            // Mark as sent
            admin.firestore().collection('tournaments').doc(doc.id).update({ reminderSent: true });
        }
    });
});

// --- API: SEND WELCOME EMAIL ---
app.post('/api/send-welcome', async (req, res) => {
    const { email, name } = req.body;
    sendHtmlEmail(email, "Welcome to Nexus Esports", templates.welcomeEmail(name || "Gamer"));
    res.json({ success: true });
});

// --- API: CONTACT SUPPORT ---
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    const adminEmail = "luckmatters199@gmail.com";
    const emailSubject = `[Support Request] ${subject} - ${name}`;
    const emailBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #6d28d9;">New Support Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</p>
        </div>
    `;

    // Send to Admin
    sendHtmlEmail(adminEmail, emailSubject, emailBody);
    
    // Optional: Send auto-reply to user
    sendHtmlEmail(email, "We received your message - Nexus Support", `
        <p>Hi ${name},</p>
        <p>Thank you for contacting Nexus Esports Support. We have received your message regarding "<strong>${subject}</strong>".</p>
        <p>Our team will review your request and get back to you shortly.</p>
        <p>Best regards,<br>Nexus Support Team</p>
    `);

    res.json({ success: true, message: "Support email sent" });
});

// --- API: NOTIFY CHAT MESSAGE ---
app.post('/api/notify-chat', async (req, res) => {
    const { tournamentId, senderName, message } = req.body;
    
    // Fetch tournament participants to notify
    const tDoc = await admin.firestore().collection('tournaments').doc(tournamentId).get();
    if(tDoc.exists) {
        const t = tDoc.data();
        const emails = t.participants.map(p => p.email).filter(e => e !== req.body.senderEmail); // Don't notify sender
        
        // Simple Loop (For production, use a queue)
        emails.forEach(email => {
            sendHtmlEmail(
                email,
                `New Message in ${t.title}`,
                templates.chatNotificationEmail(t.title, senderName, message)
            );
        });
    }
    res.json({ success: true });
});

// --- ROUTE 1: SIGNUP VERIFICATION (Sends code to anyone) ---
app.post('/api/send-code', async (req, res) => {
    const { email, code } = req.body;
    sendEmail(email, code, res);
});

// --- ROUTE 2: FORGOT PASSWORD (Only sends if user exists) ---
app.post('/api/send-reset-code', async (req, res) => {
    const { email, code } = req.body;

    try {
        // Step A: Check if user exists in Firebase
        await admin.auth().getUserByEmail(email);
        
        // Step B: If user exists, send the email
        sendEmail(email, code, res);

    } catch (error) {
        // If error code is 'auth/user-not-found', user doesn't exist
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// --- ROUTE 3: RESET PASSWORD (Updates password via Admin) ---
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Get User ID
        const user = await admin.auth().getUserByEmail(email);
        
        // Update Password
        await admin.auth().updateUser(user.uid, {
            password: newPassword
        });

        res.status(200).json({ success: true, message: "Password updated" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// --- HELPER: Generate Short ID ---
const generateShortId = () => 'TRN-' + Math.floor(1000 + Math.random() * 9000);

// --- ROUTE 4: CREATE TOURNAMENT (Updated for Payment) ---
app.post('/api/create-tournament', async (req, res) => {
    // Added 'qrCodeUrl' to destructuring
    const { title, game, map, format, prize, entryFee, date, time, maxSlots, discordLink, qrCodeUrl } = req.body;

    try {
        const shortId = generateShortId(); // Generates e.g., "TRN-4821"

        await admin.firestore().collection('tournaments').add({
            shortId, // <--- SAVING UNIQUE CODE
            title,
            game,
            map,
            format,
            prize,
            entryFee,
            date,
            time,
            maxSlots: parseInt(maxSlots),
            discordLink,
            qrCodeUrl, // <--- SAVING THE QR IMAGE LINK
            participants: [],
            status: "Open",
            bracket: [], // Empty bracket initially
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ success: true, message: "Tournament Created", shortId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ROUTE 5: GET TOURNAMENTS (User) ---
app.get('/api/tournaments', async (req, res) => {
    try {
        // Fetch all tournaments, newest first
        const snapshot = await admin.firestore()
            .collection('tournaments')
            .orderBy('createdAt', 'desc')
            .get();

        const tournaments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE 14: GET ALL TRANSACTIONS (Admin) ---
app.get('/api/transactions', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('tournaments').get();
        let allTransactions = [];

        snapshot.forEach(doc => {
            const tournament = doc.data();
            if (tournament.participants) {
                tournament.participants.forEach(p => {
                    // Only include people who actually submitted a transaction ID
                    if (p.transactionId) {
                        allTransactions.push({
                            tournamentId: doc.id,
                            tournamentTitle: tournament.title,
                            email: p.email,
                            teamName: p.teamName || "Unnamed",
                            transactionId: p.transactionId,
                            status: p.paymentStatus || 'Pending',
                            joinedAt: p.joinedAt || new Date().toISOString()
                        });
                    }
                });
            }
        });

        // Sort by newest first
        allTransactions.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
        
        res.status(200).json(allTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE 15: GENERATE BRACKET (The Brain) ---
app.post('/api/generate-bracket', async (req, res) => {
    const { tournamentId } = req.body;
    try {
        const tRef = admin.firestore().collection('tournaments').doc(tournamentId);
        const tDoc = await tRef.get();
        if (!tDoc.exists) return res.status(404).json({ error: "Tournament not found" });

        const data = tDoc.data();
        
        // 1. Get Approved Teams Only
        let teams = data.participants
            .filter(p => p.paymentStatus === 'Verified') // Only paid teams
            .map(p => p.teamName || p.email);

        if (teams.length < 2) return res.status(400).json({ error: "Not enough verified teams" });

        // 2. Shuffle Teams (Fairness)
        teams = teams.sort(() => Math.random() - 0.5);

        // 3. Calculate Bracket Structure (Standard Power of 2 with Byes)
        // This ensures the bracket always converges correctly (2 -> 1, 4 -> 2 -> 1, etc.)
        const teamCount = teams.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
        const byeCount = bracketSize - teamCount;

        // Separate teams into "Round 1 Fighters" and "Round 2 Seeds (Byes)"
        // The first 'byeCount' teams skip Round 1.
        const byeTeams = teams.slice(0, byeCount);
        const fightTeams = teams.slice(byeCount);

        let matches = [];
        let matchIdCounter = 1;
        
        // 4. Create Round 1 Matches
        // These teams must fight to get into Round 2
        for (let i = 0; i < fightTeams.length; i += 2) {
            matches.push({
                id: matchIdCounter++,
                round: 1,
                player1: fightTeams[i],
                player2: fightTeams[i+1],
                winner: null
            });
        }
        const round1MatchCount = matches.length;

        // 5. Create Round 2 Matches (Pre-seeded)
        // We mix the "Bye Teams" with "Slots for Round 1 Winners"
        let round2Pool = [...byeTeams];
        // For every match in Round 1, we need one empty slot in Round 2
        for(let i=0; i < round1MatchCount; i++) {
            round2Pool.push(null); // Placeholder for a winner
        }

        // Create pairs for Round 2
        // We put this in matches array so they are visible immediately
        let currentRoundMatches = [];
        for (let i = 0; i < round2Pool.length; i += 2) {
            const p1 = round2Pool[i];
            const p2 = round2Pool[i+1];
            
            const match = {
                id: matchIdCounter++,
                round: 2,
                player1: p1,
                player2: p2, // Can be null (waiting for R1 winner)
                winner: null
            };
            matches.push(match);
            currentRoundMatches.push(match);
        }

        // 6. Generate Subsequent Rounds (3, 4, 5...) until Final
        // We continue until we have only 1 match in a round
        let currentRoundNumber = 2;
        while (currentRoundMatches.length > 1) {
             currentRoundNumber++;
             let nextRoundMatches = [];
             
             // For every 2 matches in previous round, create 1 match in this round
             for (let i = 0; i < currentRoundMatches.length; i += 2) {
                 const match = {
                     id: matchIdCounter++,
                     round: currentRoundNumber,
                     player1: null, // Waiting for winner of currentRoundMatches[i]
                     player2: null, // Waiting for winner of currentRoundMatches[i+1]
                     winner: null
                 };
                 matches.push(match);
                 nextRoundMatches.push(match);
             }
             currentRoundMatches = nextRoundMatches;
        }

        // 7. Save to DB
        await tRef.update({ 
            bracket: matches,
            status: "In Progress"
        });

        res.status(200).json({ success: true, message: `Bracket Generated. ${teams.length} Teams -> Total ${matches.length} Matches.` });


    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTE 16: UPDATE MATCH WINNER (Smart Advancement) ---
app.post('/api/update-match', async (req, res) => {
    const { tournamentId, matchId, winner } = req.body;
    try {
        const tRef = admin.firestore().collection('tournaments').doc(tournamentId);
        
        await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(tRef);
            let bracket = doc.data().bracket;
            
            const matchIndex = bracket.findIndex(m => m.id === matchId);
            if (matchIndex === -1) throw "Match not found";
            
            const match = bracket[matchIndex];
            const oldWinner = match.winner;
            const currentRound = match.round;
            const nextRound = currentRound + 1;

            // Update the winner of the current match
            bracket[matchIndex].winner = winner;
            
            if (oldWinner) {
                // CORRECTION MODE: If we are changing the result, we must fix the next round
                // Find where the old winner went in the next round
                const nextMatchIndex = bracket.findIndex(m => 
                    m.round === nextRound && (m.player1 === oldWinner || m.player2 === oldWinner)
                );

                if (nextMatchIndex !== -1) {
                    // Replace the old winner with the new winner
                    if (bracket[nextMatchIndex].player1 === oldWinner) {
                        bracket[nextMatchIndex].player1 = winner;
                    } else {
                        bracket[nextMatchIndex].player2 = winner;
                    }
                    // Reset the winner of that next match if it was already decided?
                    bracket[nextMatchIndex].winner = null;
                }
            } else {
                // NORMAL PROGRESSION: Find or create a slot in the next round
                // We look for a match in the next round that has an EMPTY slot
                let nextMatch = bracket.find(m => m.round === nextRound && (!m.player1 || !m.player2));
                
                if (nextMatch) {
                    // Add winner to existing pending match (Created during generation)
                    if (!nextMatch.player1) nextMatch.player1 = winner;
                    else nextMatch.player2 = winner;
                } else {
                    // Create a new match for the next round (Higher rounds)
                    const maxId = Math.max(...bracket.map(m => m.id), 0);
                    bracket.push({
                        id: maxId + 1,
                        round: nextRound,
                        player1: winner,
                        player2: null, // Waiting for opponent
                        winner: null
                    });
                }
            }
            
            t.update(tRef, { bracket });
        });

        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTE: VERIFY PLAYER ACTION (Approve/Reject) ---
app.post('/api/verify-player', async (req, res) => {
    const { tournamentId, userEmail, action, transactionId } = req.body; // action: 'Approve' | 'Reject'
    try {
        const tRef = admin.firestore().collection('tournaments').doc(tournamentId);
        const doc = await tRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Tournament not found" });

        const tData = doc.data();
        let participants = tData.participants || [];
        
        // Handling Rejection (Update Status to 'Rejected')
        if (action === 'Reject') {
            participants = participants.map(p => {
                // Identify target entry
                const isTarget = transactionId === 'Free Entry' ? p.email === userEmail : p.transactionId === transactionId;
                
                if (isTarget) {
                     return { ...p, paymentStatus: 'Rejected' };
                }
                return p;
            });
             
             // Send Rejection Email
             sendHtmlEmail(
                userEmail, 
                `Registration Rejected: ${tData.title}`,
                templates.paymentRejectedEmail(tData.title)
            );
        } else {
            // Handling Approval (Update Status)
            participants = participants.map(p => {
                const isTarget = transactionId === 'Free Entry' ? p.email === userEmail : p.transactionId === transactionId;
                
                if (isTarget) {
                    return { ...p, paymentStatus: 'Verified' };
                }
                return p;
            });

             // Send Confirmation Email
             sendHtmlEmail(
                userEmail, 
                `Registration Approved: ${tData.title}`,
                templates.tournamentJoinEmail(tData.title, tData.date, tData.time)
            );
        }

        await tRef.update({ participants });

        res.json({ success: true, message: `Player ${action}ed` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- OLD ROUTE (Keep for compatibility or remove if unused) ---
app.post('/api/tournament/verify-payment', async (req, res) => {
    // Forwarding to new logic equivalent to 'Approve'
    req.body.action = 'Approve';
    // ... we can just redirect or copy logic. For now, I'll leaving this routed or just update the client. 
    // Since I'm editing the file, I'll just replace the old route with the new one entirely if possible, 
    // BUT the user's previous code in AdminPanel calls `/api/tournament/verify-payment`.
    // So I will keep the old route logic for now to avoid breaking the previous button until I update AdminPanel completely.
    // Actually, I'll just rewrite it to reuse logic or just keep it simple.
    
    const { tournamentId, userEmail } = req.body;
    try {
        const tRef = admin.firestore().collection('tournaments').doc(tournamentId);
        const doc = await tRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Tournament not found" });

        const participants = doc.data().participants || [];
        const updatedParticipants = participants.map(p => {
            if (p.email === userEmail) {
                return { ...p, paymentStatus: 'Verified' };
            }
            return p;
        });

        await tRef.update({ participants: updatedParticipants });
        res.json({ success: true, message: "Verified" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE 6: DELETE TOURNAMENT (Admin) ---
app.delete('/api/tournament/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await admin.firestore().collection('tournaments').doc(id).delete();
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// --- ROUTE 7: JOIN TOURNAMENT (Updated with Security Check) ---
app.post('/api/join-tournament', async (req, res) => {
    const { tournamentId, userEmail, teamName, teamSize, transactionId, players } = req.body;

    try {
        const tournamentRef = admin.firestore().collection('tournaments').doc(tournamentId);
        const doc = await tournamentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Tournament not found" });
        }

        const tournamentData = doc.data();
        
        // 1. SECURITY CHECK: If it's a PAId tournament, require Transaction ID
        const isPaid = tournamentData.entryFee && tournamentData.entryFee !== 'Free';
        if (isPaid && !transactionId) {
            return res.status(400).json({ error: "Payment Proof (Transaction ID) is required for this tournament." });
        }

        // 2. Determine Status
        // If it's paid, status is PENDING. If free, status is VERIFIED.
        const status = isPaid ? "Pending Verification" : "Verified";
        const finalTxId = isPaid ? transactionId : "Free Entry";

        const participantData = {
            email: userEmail,
            teamName: teamName || "Unnamed Team",
            teamSize: teamSize || "Solo",
            players: players || [], // <--- Saving Roster
            transactionId: finalTxId,
            paymentStatus: status,
            joinedAt: new Date().toISOString()
        };

        await tournamentRef.update({
            participants: admin.firestore.FieldValue.arrayUnion(participantData)
        });

        // SEND EMAILS BASED ON PAYMENT
        if (isPaid) {
            // Paid -> Pending -> Send "Payment Pending" Email
            sendHtmlEmail(
                userEmail, 
                `Payment Verification Pending: ${tournamentData.title}`,
                templates.paymentPendingEmail(tournamentData.title)
            );
        } else {
            // Free -> Verified -> Send "Access Granted" Email
            sendHtmlEmail(
                userEmail, 
                `Registration Confirmed: ${tournamentData.title}`,
                templates.tournamentJoinEmail(tournamentData.title, tournamentData.date, tournamentData.time)
            );
        }

        res.status(200).json({ success: true, message: isPaid ? "Registration Pending Approval" : "Registration Successful" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- HELPER FUNCTION: SEND EMAIL ---
async function sendEmail(email, code, res) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Nexus Esports - Verification Code',
        html: `
            <div style="font-family: Arial; padding: 20px; color: #333;">
                <h2 style="color: #bd00ff;">Verification Required</h2>
                <p>Use this code to verify your identity:</p>
                <h1 style="background: #eee; display: inline-block; padding: 10px; letter-spacing: 5px;">${code}</h1>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

// --- ROUTE 9: GET USER PROFILE ---
app.get('/api/user/:email', async (req, res) => {
    try {
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('email', '==', req.params.email).get();
        if (snapshot.empty) return res.status(404).json({ error: "User not found" });
        
        const userData = snapshot.docs[0].data();
        res.status(200).json(userData);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTE 10: UPDATE PROFILE (Avatar, Bio, Game ID) ---
app.post('/api/user/update', async (req, res) => {
    const { email, displayName, gameId, bio, avatarUrl } = req.body;
    try {
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        
        if (snapshot.empty) return res.status(404).json({ error: "User not found" });

        const userDoc = snapshot.docs[0].ref;
        await userDoc.update({
            displayName, 
            gameId, 
            bio, 
            avatarUrl
        });

        res.status(200).json({ success: true, message: "Profile Updated" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTE 11: GET SINGLE TOURNAMENT DETAILS ---
app.get('/api/tournament/:id', async (req, res) => {
    try {
        const doc = await admin.firestore().collection('tournaments').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Not found" });
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTE: GET ALL USERS (Admin) ---
app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('users').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE: SEED DATA (DEV ONLY) ---
app.post('/api/seed-data', async (req, res) => {
    try {
        const batch = admin.firestore().batch();
        
        // 1. Create Dummy Users
        const usersRef = admin.firestore().collection('users');
        const dummyUsers = [
            { email: 'viper@nexus.com', displayName: 'Viper', role: 'admin', gameId: 'Viper#1234' },
            { email: 'shadow@nexus.com', displayName: 'Shadow', role: 'user', gameId: 'Shadow#9999' },
            { email: 'ghost@nexus.com', displayName: 'Ghost', role: 'user', gameId: 'Ghost#0000' },
            { email: 'player1@gmail.com', displayName: 'ProGamer', role: 'user', gameId: 'Pro#1111' }
        ];

        dummyUsers.forEach(u => {
            const newRef = usersRef.doc();
            batch.set(newRef, u);
        });

        // 2. Create Dummy Leaderboard Stats
        const statsRef = admin.firestore().collection('match_stats');
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const dummyStats = [
            { tournamentId: 'mock-t1', playerName: 'Viper', kills: 45, damage: 5000, date: today, teamName: 'Team Alpha' },
            { tournamentId: 'mock-t1', playerName: 'Shadow', kills: 32, damage: 3200, date: today, teamName: 'Team Bravo' },
            { tournamentId: 'mock-t1', playerName: 'Ghost', kills: 60, damage: 7000, date: today, teamName: 'Team Alpha' },
            { tournamentId: 'mock-t1', playerName: 'ProGamer', kills: 12, damage: 1500, date: today, teamName: 'SoloSquad' }
        ];

        dummyStats.forEach(s => {
            const newRef = statsRef.doc();
            batch.set(newRef, s);
        });

        // 3. Create Dummy Tournaments
        const tRef = admin.firestore().collection('tournaments');

        // T1: Completed BGMI Tournament
        const t1 = tRef.doc();
        batch.set(t1, {
            title: "Winter Championship 2026",
            game: "BGMI",
            map: "Erangel",
            format: "Battle Royale (Squad)",
            prize: "₹10,000",
            entryFee: "₹500",
            date: "2026-01-20",
            time: "18:00",
            maxSlots: 100,
            status: "Completed",
            winner: "Team Alpha",
            shortId: "TRN-9999",
            createdAt: new Date().toISOString(),
            participants: [
                { email: "viper@nexus.com", teamName: "Team Alpha", teamSize: "Squad", paymentStatus: "Verified", transactionId: "TXwd123", joinedAt: new Date().toISOString() },
                { email: "shadow@nexus.com", teamName: "Team Bravo", teamSize: "Squad", paymentStatus: "Verified", transactionId: "TXab456", joinedAt: new Date().toISOString() },
                { email: "random@user.com", teamName: "Dark Knights", teamSize: "Squad", paymentStatus: "Rejected", transactionId: "TXfail", joinedAt: new Date().toISOString() },
                { email: "pro@gmail.com", teamName: "SoloSquad", teamSize: "Solo", paymentStatus: "Verified", transactionId: "TXsol1", joinedAt: new Date().toISOString() }
            ],
            bracket: [] // Battle Royale doesn't use bracket tree usually, but we can add one for logic check
        });

        // T2: In-Progress Free Fire Clash Squad (Bracket)
        const t2 = tRef.doc();
        batch.set(t2, {
            title: "Clash Squad Weekly #42",
            game: "Free Fire",
            map: "Bermuda",
            format: "Clash Squad (4v4)",
            prize: "500 Diamonds",
            entryFee: "Free",
            date: "2026-01-25",
            time: "20:00",
            maxSlots: 16,
            status: "In Progress",
            shortId: "TRN-8888",
            createdAt: new Date().toISOString(),
            participants: [
                { email: "p1@ff.com", teamName: "Red Dragons", paymentStatus: "Verified", transactionId: "Free Entry" },
                { email: "p2@ff.com", teamName: "Blue Skulls", paymentStatus: "Verified", transactionId: "Free Entry" },
                { email: "p3@ff.com", teamName: "Green Vipers", paymentStatus: "Verified", transactionId: "Free Entry" },
                { email: "p4@ff.com", teamName: "Yellow Bolts", paymentStatus: "Verified", transactionId: "Free Entry" }
            ],
            bracket: [
                { id: 1, round: 1, player1: "Red Dragons", player2: "Blue Skulls", winner: "Red Dragons" },
                { id: 2, round: 1, player1: "Green Vipers", player2: "Yellow Bolts", winner: null },
                { id: 3, round: 2, player1: "Red Dragons", player2: null, winner: null } // Waiting for winner of match 2
            ]
        });

        // T3: Upcoming COD Mobile
        const t3 = tRef.doc();
        batch.set(t3, {
            title: "CODM Sunday Showdown",
            game: "COD Mobile",
            map: "Nuketown",
            format: "Team Deathmatch",
            prize: "₹2000",
            entryFee: "Free",
            date: "2026-02-01",
            time: "14:00",
            maxSlots: 32,
            status: "Open",
            shortId: "TRN-7777",
            createdAt: new Date().toISOString(),
            participants: [
                { email: "sniper@cod.com", teamName: "Sniper Elite", paymentStatus: "Pending Verification", transactionId: "PendingTx", joinedAt: new Date().toISOString() }
            ],
            bracket: []
        });

        await batch.commit();
        res.json({ success: true, message: "Full Mock Data Seeded!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE: DECLARE TOURNAMENT WINNER (For Battle Royale) ---
app.post('/api/set-tournament-winner', async (req, res) => {
    const { tournamentId, winnerName } = req.body;
    try {
        await admin.firestore().collection('tournaments').doc(tournamentId).update({
            winner: winnerName,
            status: "Completed"
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ROUTE: UPDATE STATS (Kills/Damage) ---
app.post('/api/update-stats', async (req, res) => {
    const { tournamentId, stats } = req.body; 
    // stats = [{ teamName, playerName, kills, damage }, ...]

    try {
        const batch = admin.firestore().batch();
        const statsRef = admin.firestore().collection('match_stats');
        
        // Get tournament info for metadata (Game, Date)
        const tDoc = await admin.firestore().collection('tournaments').doc(tournamentId).get();
        const tData = tDoc.data();

        stats.forEach(s => {
            const newStatRef = statsRef.doc(); // Auto ID
            batch.set(newStatRef, {
                tournamentId,
                game: tData.game,
                date: new Date().toISOString(), // Timestamp for filtering by Month
                teamName: s.teamName,
                playerName: s.playerName,
                kills: parseInt(s.kills) || 0,
                damage: parseInt(s.damage) || 0
            });
        });

        await batch.commit();
        res.json({ success: true, message: "Stats Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE: GET LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
    const { type, month } = req.query; // type = 'player' | 'team'
    console.log(`[API] Leaderboard Request: type=${type}, month=${month}`);
    
    try {
        let query = admin.firestore().collection('match_stats');
        const snapshot = await query.get();
        console.log(`[API] Found ${snapshot.size} stats documents.`);
        
        let stats = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = new Date(data.date);
            const dataMonth = date.toISOString().slice(0, 7); // YYYY-MM
            
            console.log(` - Doc ${doc.id}: Date=${data.date} (Parsed Month: ${dataMonth}) vs Filter=${month}`);

            // Filter Month
            if (month && dataMonth !== month) return;

            // Group by Player or Team
            const key = type === 'player' ? data.playerName : data.teamName;
            
            if (!stats[key]) {
                stats[key] = { name: key, kills: 0, damage: 0, matches: 0 };
            }
            stats[key].kills += data.kills;
            stats[key].damage += data.damage;
            stats[key].matches += 1;
        });

        // Convert to array and sort
        const leaderboard = Object.values(stats).sort((a,b) => b.kills - a.kills);
        console.log(`[API] Returning ${leaderboard.length} entries.`);
        res.json(leaderboard);

    } catch (err) {
        console.error("[API] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));