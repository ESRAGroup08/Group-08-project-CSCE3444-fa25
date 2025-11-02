/**
 * Tests for FR-08: Unranked/Casual Mode
 * Tests the matchmaking functionality for both ranked and casual modes
 */

import { findMatch, recordMatchResult } from '../matchmaking.js';

// Mock Firestore functions for testing
function createMockFirestore() {
    const mockDb = { name: 'test-db' };
    const mockCollection = (db, path) => ({ db, path });
    const mockQuery = (col, ...clauses) => ({ collection: col, clauses });
    const mockWhere = (field, op, value) => ({ field, op, value });
    const mockLimit = (count) => ({ limit: count });
    const mockDoc = (db, ...pathSegments) => ({
        db,
        path: pathSegments.join('/'),
        id: pathSegments[pathSegments.length - 1] || 'test-id-' + Date.now()
    });
    const mockIncrement = (value) => ({ increment: value });
    
    return {
        mockDb,
        mockCollection,
        mockQuery,
        mockWhere,
        mockLimit,
        mockDoc,
        mockIncrement
    };
}

// Test: Ranked matchmaking uses skill-based filtering
async function testRankedMatchmakingUsesSkillFiltering() {
    console.log('Test: Ranked matchmaking uses skill-based filtering');
    
    const { mockDb, mockCollection, mockQuery, mockWhere, mockLimit, mockDoc } = createMockFirestore();
    const queryBuilderCalls = [];
    
    const trackingMockWhere = (field, op, value) => {
        queryBuilderCalls.push({ type: 'where', field, op, value });
        return mockWhere(field, op, value);
    };
    
    const mockGetDocs = async () => ({ empty: true, docs: [] });
    const mockRunTransaction = async () => {};
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async () => {};
    const mockDeleteDoc = async () => {};
    const log = () => {};
    
    const userProfile = { userId: 'test-user', rankPoints: 1000 };
    
    await findMatch(
        mockDb, mockCollection, mockQuery, trackingMockWhere, mockLimit,
        mockGetDocs, mockRunTransaction, mockDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
        userProfile, 'rankedMatches', 'ranked', log
    );
    
    // Verify skill-based filtering was used
    const hasSkillFilter = queryBuilderCalls.some(call => 
        call.field === 'skillLevel' && (call.op === '>=' || call.op === '<=')
    );
    
    if (hasSkillFilter) {
        console.log('✓ PASS: Ranked mode uses skill-based filtering');
    } else {
        console.log('✗ FAIL: Ranked mode does not use skill-based filtering');
    }
}

// Test: Casual matchmaking does not use skill-based filtering
async function testCasualMatchmakingNoSkillFiltering() {
    console.log('Test: Casual matchmaking does not use skill-based filtering');
    
    const { mockDb, mockCollection, mockQuery, mockWhere, mockLimit, mockDoc } = createMockFirestore();
    const queryBuilderCalls = [];
    
    const trackingMockWhere = (field, op, value) => {
        queryBuilderCalls.push({ type: 'where', field, op, value });
        return mockWhere(field, op, value);
    };
    
    const mockGetDocs = async () => ({ empty: true, docs: [] });
    const mockRunTransaction = async () => {};
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async () => {};
    const mockDeleteDoc = async () => {};
    const log = () => {};
    
    const userProfile = { userId: 'test-user', rankPoints: 1000 };
    
    await findMatch(
        mockDb, mockCollection, mockQuery, trackingMockWhere, mockLimit,
        mockGetDocs, mockRunTransaction, mockDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
        userProfile, 'casualMatches', 'casual', log
    );
    
    // Verify NO skill-based filtering was used
    const hasSkillFilter = queryBuilderCalls.some(call => 
        call.field === 'skillLevel'
    );
    
    if (!hasSkillFilter) {
        console.log('✓ PASS: Casual mode does not use skill-based filtering');
    } else {
        console.log('✗ FAIL: Casual mode incorrectly uses skill-based filtering');
    }
}

// Test: Ranked and casual modes use different pools
async function testDifferentPools() {
    console.log('Test: Ranked and casual modes use different pools');
    
    const { mockDb, mockCollection, mockQuery, mockWhere, mockLimit, mockDoc } = createMockFirestore();
    const collectionCalls = [];
    
    const trackingMockCollection = (db, path) => {
        collectionCalls.push(path);
        return mockCollection(db, path);
    };
    
    const mockGetDocs = async () => ({ empty: true, docs: [] });
    const mockRunTransaction = async () => {};
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async () => {};
    const mockDeleteDoc = async () => {};
    const log = () => {};
    
    const userProfile = { userId: 'test-user', rankPoints: 1000 };
    
    // Test ranked
    await findMatch(
        mockDb, trackingMockCollection, mockQuery, mockWhere, mockLimit,
        mockGetDocs, mockRunTransaction, mockDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
        userProfile, 'rankedMatches', 'ranked', log
    );
    
    // Test casual
    await findMatch(
        mockDb, trackingMockCollection, mockQuery, mockWhere, mockLimit,
        mockGetDocs, mockRunTransaction, mockDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
        userProfile, 'casualMatches', 'casual', log
    );
    
    const hasRankedPool = collectionCalls.includes('rankedMatches');
    const hasCasualPool = collectionCalls.includes('casualMatches');
    
    if (hasRankedPool && hasCasualPool) {
        console.log('✓ PASS: Different pools used for ranked and casual modes');
    } else {
        console.log('✗ FAIL: Pools not correctly separated');
    }
}

// Test: Match type is recorded in match result
async function testMatchTypeRecorded() {
    console.log('Test: Match type is recorded in match result');
    
    const { mockDb, mockCollection, mockQuery, mockWhere, mockLimit, mockDoc } = createMockFirestore();
    
    const mockGetDocs = async () => ({
        empty: false,
        docs: [{
            id: 'match-123',
            data: () => ({ userId: 'opponent', skillLevel: 1000, status: 'pending' })
        }]
    });
    
    const mockRunTransaction = async (db, callback) => {
        const mockTransaction = {
            get: async () => ({
                exists: () => true,
                data: () => ({ status: 'pending' })
            }),
            update: () => {}
        };
        await callback(mockTransaction);
    };
    
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async () => {};
    const mockDeleteDoc = async () => {};
    const log = () => {};
    
    const userProfile = { userId: 'test-user', rankPoints: 1000 };
    
    const result = await findMatch(
        mockDb, mockCollection, mockQuery, mockWhere, mockLimit,
        mockGetDocs, mockRunTransaction, mockDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
        userProfile, 'rankedMatches', 'ranked', log
    );
    
    if (result.matchType === 'ranked') {
        console.log('✓ PASS: Match type is recorded in result');
    } else {
        console.log('✗ FAIL: Match type not recorded correctly');
    }
}

// Test: Casual matches do not affect rank
async function testCasualDoesNotAffectRank() {
    console.log('Test: Casual matches do not affect rank');
    
    const { mockDb, mockCollection, mockDoc, mockIncrement } = createMockFirestore();
    
    let rankUpdated = false;
    let casualStatsUpdated = false;
    
    const mockRunTransaction = async (db, callback) => {
        const mockTransaction = {
            get: async () => ({
                exists: () => true,
                data: () => ({
                    rankPoints: 1000,
                    rankedMatchesPlayed: 5,
                    rankedWins: 3
                })
            }),
            update: (ref, data) => {
                if (data.rankPoints !== undefined) {
                    rankUpdated = true;
                }
            }
        };
        await callback(mockTransaction);
    };
    
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async (ref, data) => {
        if (data.casualMatchesPlayed !== undefined) {
            casualStatsUpdated = true;
        }
    };
    
    const log = () => {};
    
    await recordMatchResult(
        mockDb, mockCollection, mockDoc, mockSetDoc, mockUpdateDoc,
        mockRunTransaction, mockIncrement,
        'test-user', 'match-123', 'casual', true, 60, 95, log
    );
    
    if (!rankUpdated && casualStatsUpdated) {
        console.log('✓ PASS: Casual matches do not affect rank but update casual stats');
    } else if (rankUpdated) {
        console.log('✗ FAIL: Casual matches incorrectly affect rank');
    } else {
        console.log('✗ FAIL: Casual stats not updated');
    }
}

// Test: Ranked matches do affect rank
async function testRankedAffectsRank() {
    console.log('Test: Ranked matches do affect rank');
    
    const { mockDb, mockCollection, mockDoc, mockIncrement } = createMockFirestore();
    
    let rankUpdated = false;
    
    const mockRunTransaction = async (db, callback) => {
        const mockTransaction = {
            get: async () => ({
                exists: () => true,
                data: () => ({
                    rankPoints: 1000,
                    rankedMatchesPlayed: 5,
                    rankedWins: 3
                })
            }),
            update: (ref, data) => {
                if (data.rankPoints !== undefined) {
                    rankUpdated = true;
                }
            }
        };
        await callback(mockTransaction);
    };
    
    const mockSetDoc = async () => {};
    const mockUpdateDoc = async () => {};
    const log = () => {};
    
    await recordMatchResult(
        mockDb, mockCollection, mockDoc, mockSetDoc, mockUpdateDoc,
        mockRunTransaction, mockIncrement,
        'test-user', 'match-123', 'ranked', true, 60, 95, log
    );
    
    if (rankUpdated) {
        console.log('✓ PASS: Ranked matches affect rank');
    } else {
        console.log('✗ FAIL: Ranked matches do not affect rank');
    }
}

// Run all tests
async function runAllTests() {
    console.log('=== Running FR-08 Unranked/Casual Mode Tests ===\n');
    
    await testRankedMatchmakingUsesSkillFiltering();
    await testCasualMatchmakingNoSkillFiltering();
    await testDifferentPools();
    await testMatchTypeRecorded();
    await testCasualDoesNotAffectRank();
    await testRankedAffectsRank();
    
    console.log('\n=== Tests Complete ===');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runAllTests().catch(console.error);
} else {
    // Browser environment - export for manual execution
    window.runMatchmakingTests = runAllTests;
}

export { runAllTests };
