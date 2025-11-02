/**
 * Main integration file for PlayerRankingSys.html demo
 * This demonstrates the matchmaking features including FR-08: Unranked/Casual Mode
 */

import { findMatch, recordMatchResult } from './matchmaking.js';

// Mock Firestore functions for demonstration purposes
// In a real implementation, these would be imported from Firebase SDK
const mockDb = { name: 'mock-firestore-db' };

const mockCollection = (db, path) => ({ db, path });

const mockQuery = (col, ...clauses) => ({ collection: col, clauses });

const mockWhere = (field, op, value) => ({ field, op, value });

const mockLimit = (count) => ({ limit: count });

const mockGetDocs = async (query) => {
    // Simulate finding or not finding opponents
    // In production, this would query the actual Firestore database
    const random = Math.random();
    
    if (random > 0.5) {
        // Simulate finding an opponent
        return {
            empty: false,
            docs: [{
                id: 'match-' + Date.now(),
                data: () => ({
                    userId: 'opponent-' + Math.floor(Math.random() * 1000),
                    skillLevel: 1000 + Math.floor(Math.random() * 200 - 100),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                })
            }]
        };
    } else {
        // No opponent found
        return { empty: true, docs: [] };
    }
};

const mockRunTransaction = async (db, callback) => {
    // Simulate a successful transaction
    const mockTransaction = {
        get: async (ref) => ({
            exists: () => true,
            data: () => ({
                status: 'pending',
                userId: 'opponent-123',
                skillLevel: 1050,
                rankedMatchesPlayed: 10,
                rankedWins: 5,
                rankPoints: 1050
            })
        }),
        update: (ref, data) => {
            logToOutput(`Transaction update: ${JSON.stringify(data, null, 2)}`);
        }
    };
    
    await callback(mockTransaction);
};

const mockDoc = (db, ...pathSegments) => {
    const path = typeof db === 'object' && db.path 
        ? `${db.path}/${pathSegments.join('/')}` 
        : pathSegments.join('/');
    return { 
        db, 
        path,
        id: pathSegments[pathSegments.length - 1] || 'auto-' + Date.now()
    };
};

const mockSetDoc = async (ref, data) => {
    logToOutput(`Document created at ${ref.path}: ${JSON.stringify(data, null, 2)}`);
    return Promise.resolve();
};

const mockUpdateDoc = async (ref, data) => {
    logToOutput(`Document updated at ${ref.path}: ${JSON.stringify(data, null, 2)}`);
    return Promise.resolve();
};

const mockDeleteDoc = async (ref) => {
    logToOutput(`Document deleted at ${ref.path}`);
    return Promise.resolve();
};

const mockIncrement = (value) => ({ increment: value });

// Logger function that outputs to the UI
function logToOutput(message) {
    const logOutput = document.getElementById('log-output');
    if (logOutput) {
        const timestamp = new Date().toLocaleTimeString();
        logOutput.textContent += `[${timestamp}] ${message}\n`;
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    console.log(message);
}

// Initialize user profile
const userProfile = {
    userId: 'user-' + Math.floor(Math.random() * 10000),
    rankPoints: 1000 + Math.floor(Math.random() * 500 - 250),
    username: 'DemoPlayer' + Math.floor(Math.random() * 100)
};

// Display user ID on page load
document.addEventListener('DOMContentLoaded', () => {
    const userIdSpan = document.getElementById('user-id');
    if (userIdSpan) {
        userIdSpan.textContent = userProfile.userId;
    }
    
    logToOutput('=== FR-08: Unranked/Casual Mode Demo ===');
    logToOutput(`User Profile: ${JSON.stringify(userProfile, null, 2)}`);
    logToOutput('Click "Find RANKED Match" or "Find CASUAL Match" to test matchmaking');
    logToOutput('');
});

// Handle Ranked Match button
document.getElementById('btn-ranked')?.addEventListener('click', async () => {
    logToOutput('');
    logToOutput('--- RANKED MATCHMAKING INITIATED ---');
    
    const result = await findMatch(
        mockDb,
        mockCollection,
        mockQuery,
        mockWhere,
        mockLimit,
        mockGetDocs,
        mockRunTransaction,
        mockDoc,
        mockSetDoc,
        mockUpdateDoc,
        mockDeleteDoc,
        userProfile,
        'rankedMatches', // Pool name for ranked matches
        'ranked',
        logToOutput
    );
    
    logToOutput('');
    logToOutput('RANKED MATCH RESULT:');
    logToOutput(JSON.stringify(result, null, 2));
    
    if (result.success) {
        if (result.waiting) {
            logToOutput('✓ Waiting for opponent in RANKED pool...');
        } else {
            logToOutput(`✓ Matched with opponent: ${result.opponent}`);
            logToOutput('Note: When match completes, your RANK WILL be affected');
            
            // Simulate a match result after 3 seconds
            setTimeout(async () => {
                logToOutput('');
                logToOutput('--- SIMULATING RANKED MATCH COMPLETION ---');
                const won = Math.random() > 0.5;
                const wpm = 50 + Math.floor(Math.random() * 50);
                const accuracy = 85 + Math.floor(Math.random() * 15);
                
                logToOutput(`Result: ${won ? 'WIN' : 'LOSS'}, WPM: ${wpm}, Accuracy: ${accuracy}%`);
                
                const recordResult = await recordMatchResult(
                    mockDb,
                    mockCollection,
                    mockDoc,
                    mockSetDoc,
                    mockUpdateDoc,
                    mockRunTransaction,
                    mockIncrement,
                    userProfile.userId,
                    result.matchId,
                    'ranked',
                    won,
                    wpm,
                    accuracy,
                    logToOutput
                );
                
                logToOutput('');
                logToOutput('RECORD RESULT:');
                logToOutput(JSON.stringify(recordResult, null, 2));
                logToOutput(`✓ Ranked match recorded - Rank ${recordResult.rankAffected ? 'WAS' : 'was NOT'} affected`);
            }, 3000);
        }
    } else {
        logToOutput(`✗ Error: ${result.error}`);
    }
});

// Handle Casual Match button
document.getElementById('btn-casual')?.addEventListener('click', async () => {
    logToOutput('');
    logToOutput('--- CASUAL MATCHMAKING INITIATED ---');
    
    const result = await findMatch(
        mockDb,
        mockCollection,
        mockQuery,
        mockWhere,
        mockLimit,
        mockGetDocs,
        mockRunTransaction,
        mockDoc,
        mockSetDoc,
        mockUpdateDoc,
        mockDeleteDoc,
        userProfile,
        'casualMatches', // Pool name for casual matches
        'casual',
        logToOutput
    );
    
    logToOutput('');
    logToOutput('CASUAL MATCH RESULT:');
    logToOutput(JSON.stringify(result, null, 2));
    
    if (result.success) {
        if (result.waiting) {
            logToOutput('✓ Waiting for opponent in CASUAL pool...');
        } else {
            logToOutput(`✓ Matched with opponent: ${result.opponent}`);
            logToOutput('Note: When match completes, your rank will NOT be affected');
            
            // Simulate a match result after 3 seconds
            setTimeout(async () => {
                logToOutput('');
                logToOutput('--- SIMULATING CASUAL MATCH COMPLETION ---');
                const won = Math.random() > 0.5;
                const wpm = 50 + Math.floor(Math.random() * 50);
                const accuracy = 85 + Math.floor(Math.random() * 15);
                
                logToOutput(`Result: ${won ? 'WIN' : 'LOSS'}, WPM: ${wpm}, Accuracy: ${accuracy}%`);
                
                const recordResult = await recordMatchResult(
                    mockDb,
                    mockCollection,
                    mockDoc,
                    mockSetDoc,
                    mockUpdateDoc,
                    mockRunTransaction,
                    mockIncrement,
                    userProfile.userId,
                    result.matchId,
                    'casual',
                    won,
                    wpm,
                    accuracy,
                    logToOutput
                );
                
                logToOutput('');
                logToOutput('RECORD RESULT:');
                logToOutput(JSON.stringify(recordResult, null, 2));
                logToOutput(`✓ Casual match recorded - Rank ${recordResult.rankAffected ? 'WAS' : 'was NOT'} affected`);
            }, 3000);
        }
    } else {
        logToOutput(`✗ Error: ${result.error}`);
    }
});

// Handle other feature buttons with placeholders
document.getElementById('btn-win-rank')?.addEventListener('click', () => {
    logToOutput('');
    logToOutput('--- FR-07: Player Ranking System (Not implemented in this PR) ---');
});

document.getElementById('btn-lose-rank')?.addEventListener('click', () => {
    logToOutput('');
    logToOutput('--- FR-07: Player Ranking System (Not implemented in this PR) ---');
});

document.getElementById('btn-create-lobby')?.addEventListener('click', () => {
    logToOutput('');
    logToOutput('--- FR-09: Private Match Lobby (Not implemented in this PR) ---');
});

document.getElementById('btn-join-lobby')?.addEventListener('click', () => {
    logToOutput('');
    logToOutput('--- FR-09: Private Match Lobby (Not implemented in this PR) ---');
});
