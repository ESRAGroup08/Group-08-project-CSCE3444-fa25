#!/usr/bin/env node
/**
 * Test runner for matchmaking tests
 */

import { runAllTests } from './tests/matchmaking.test.js';

runAllTests().catch(console.error);
