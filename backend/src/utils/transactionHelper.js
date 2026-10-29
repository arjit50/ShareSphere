/**
 * Simple helper to execute operations sequentially without requiring a MongoDB replica set.
 * Multi-document transactions require a replica set in MongoDB, which is unnecessary
 * for a college-level project. We execute standard sequential Mongoose queries instead.
 */
const runInTransaction = async (callback) => {
  const result = await callback(null);
  return { result };
};

module.exports = { runInTransaction };
