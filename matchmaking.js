/**
 * FR-08: UNRANKED/CASUAL MODE
 * This file contains matchmaking logic that handles both ranked and casual game modes.
 * 
 * Key Features:
 * - Separate matchmaking pools for ranked and casual modes
 * - Skill-based matching for ranked mode
 * - Any-opponent matching for casual mode
 * - Match results from casual mode do NOT affect player skill rankings
 * - All matches (ranked and casual) are recorded in match history
 **/

/**
 * Find a match for a player in either ranked or casual mode
 * @param {Object} db - Firestore database instance
 * @param {Function} collection - Firestore collection function
 * @param {Function} query - Firestore query function
 * @param {Function} where - Firestore where clause function
 * @param {Function} limit - Firestore limit function
 * @param {Function} getDocs - Firestore getDocs function
 * @param {Function} runTransaction - Firestore runTransaction function
 * @param {Function} doc - Firestore doc function
 * @param {Function} setDoc - Firestore setDoc function
 * @param {Function} updateDoc - Firestore updateDoc function
 * @param {Function} deleteDoc - Firestore deleteDoc function
 * @param {Object} userProfile - User profile with userId and rankPoints
 * @param {string} poolToQuery - Collection name for the matchmaking pool
 * @param {string} matchType - Either 'ranked' or 'casual'
 * @param {Function} log - Logging function
 * @returns {Object} Match result with success status, matchId, and matchType
 */
export async function findMatch(db, collection, query, where, limit, getDocs, runTransaction, doc, setDoc, updateDoc, deleteDoc, userProfile, poolToQuery, matchType, log) {
    log(`Finding ${matchType} match...`);
    
    const mySkill = userProfile.rankPoints || 1000;
    const userId = userProfile.userId;
    let matchQuery = null;

    if (matchType === 'ranked') {
        // For RANKED, we query the ranked pool and use a skill-based query
        matchQuery = query(
            collection(db, poolToQuery),
            where('status', '==', 'pending'),
            where('skillLevel', '>=', mySkill - 100), // Skill range
            where('skillLevel', '<=', mySkill + 100),
            limit(1)
        );
        log(`Querying ranked pool for opponent near ${mySkill} points...`);

    } else {
        // For CASUAL, we query the casual pool and take anyone
        matchQuery = query(
            collection(db, poolToQuery),
            where('status', '==', 'pending'),
            limit(1)
        );
        log("Querying casual pool for *any* opponent...");
    }

    // Execute the query and handle matchmaking in a transaction
    try {
        const querySnapshot = await getDocs(matchQuery);
        
        if (!querySnapshot.empty) {
            // Found an opponent - join their match
            const opponentDoc = querySnapshot.docs[0];
            const matchId = opponentDoc.id;
            const opponentData = opponentDoc.data();
            
            log(`Found opponent: ${opponentData.userId}, joining match ${matchId}...`);
            
            // Use transaction to safely update the match
            await runTransaction(db, async (transaction) => {
                const matchRef = doc(db, poolToQuery, matchId);
                const matchDoc = await transaction.get(matchRef);
                
                if (!matchDoc.exists()) {
                    throw new Error("Match no longer exists");
                }
                
                const matchData = matchDoc.data();
                if (matchData.status !== 'pending') {
                    throw new Error("Match already started or filled");
                }
                
                // Update match status to matched
                transaction.update(matchRef, {
                    status: 'matched',
                    player2Id: userId,
                    player2Skill: mySkill,
                    matchedAt: new Date().toISOString(),
                    matchType: matchType // Record whether this is ranked or casual
                });
            });
            
            log(`Successfully joined ${matchType} match ${matchId}!`);
            return {
                success: true,
                matchId: matchId,
                opponent: opponentData.userId,
                matchType: matchType
            };
            
        } else {
            // No opponent found - create a new pending match
            log(`No opponent found, creating new ${matchType} match entry...`);
            
            const newMatchRef = doc(collection(db, poolToQuery));
            await setDoc(newMatchRef, {
                status: 'pending',
                player1Id: userId,
                skillLevel: mySkill,
                createdAt: new Date().toISOString(),
                matchType: matchType // Record whether this is ranked or casual
            });
            
            log(`Created new ${matchType} match entry with ID: ${newMatchRef.id}`);
            return {
                success: true,
                matchId: newMatchRef.id,
                waiting: true,
                matchType: matchType
            };
        }
        
    } catch (error) {
        log(`Error during matchmaking: ${error.message}`);
        return {
            success: false,
            error: error.message,
            matchType: matchType
        };
    }
}

/**
 * Record match result and update player stats
 * For ranked matches: updates player skill ranking
 * For casual matches: only records in match history without affecting ranking
 * @param {Object} db - Firestore database instance
 * @param {Function} collection - Firestore collection function
 * @param {Function} doc - Firestore doc function
 * @param {Function} setDoc - Firestore setDoc function
 * @param {Function} updateDoc - Firestore updateDoc function
 * @param {Function} runTransaction - Firestore runTransaction function
 * @param {Function} increment - Firestore increment function
 * @param {string} userId - ID of the player
 * @param {string} matchId - ID of the match
 * @param {string} matchType - Either 'ranked' or 'casual'
 * @param {boolean} won - Whether the player won
 * @param {number} wpm - Words per minute achieved
 * @param {number} accuracy - Accuracy percentage
 * @param {Function} log - Logging function
 * @returns {Object} Result with success status
 */
export async function recordMatchResult(db, collection, doc, setDoc, updateDoc, runTransaction, increment, userId, matchId, matchType, won, wpm, accuracy, log) {
    try {
        log(`Recording ${matchType} match result for user ${userId}...`);
        
        // Always record in match history
        const historyRef = doc(collection(db, `users/${userId}/matchHistory`));
        await setDoc(historyRef, {
            matchId: matchId,
            matchType: matchType,
            result: won ? 'win' : 'loss',
            wpm: wpm,
            accuracy: accuracy,
            timestamp: new Date().toISOString(),
            rankedMatch: matchType === 'ranked'
        });
        
        log(`Match recorded in history`);
        
        // Only update skill ranking for ranked matches
        if (matchType === 'ranked') {
            log(`Updating skill ranking for ranked match...`);
            
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User profile not found");
                }
                
                const userData = userDoc.data();
                const currentRank = userData.rankPoints || 1000;
                
                // Calculate rank change based on win/loss
                const rankChange = won ? 25 : -15;
                const newRank = Math.max(0, currentRank + rankChange); // Don't go below 0
                
                transaction.update(userRef, {
                    rankPoints: newRank,
                    rankedMatchesPlayed: increment(1),
                    rankedWins: won ? increment(1) : userData.rankedWins || 0
                });
                
                log(`Rank updated: ${currentRank} -> ${newRank}`);
            });
        } else {
            log(`Casual match - rank NOT affected`);
            
            // Update casual match stats only
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                casualMatchesPlayed: increment(1),
                casualWins: won ? increment(1) : increment(0)
            });
        }
        
        log(`Match result recorded successfully`);
        return {
            success: true,
            matchType: matchType,
            rankAffected: matchType === 'ranked'
        };
        
    } catch (error) {
        log(`Error recording match result: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}
