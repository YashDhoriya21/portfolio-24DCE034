// cache/taskCache.js
// Practical 9 — In-memory caching using node-cache
// TTL: 60 seconds; cache is process-local (resets on server restart)

const NodeCache = require('node-cache');

// stdTTL: default time-to-live in seconds for each key
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Simple hit/miss counters for the supplementary /debug/cache endpoint
let hits = 0;
let misses = 0;

function getHits()   { return hits; }
function getMisses() { return misses; }
function recordHit()  { hits++; }
function recordMiss() { misses++; }

module.exports = { cache, getHits, getMisses, recordHit, recordMiss };
