const NodeCache = require('node-cache');

let cacheInstance;

const initializeCache = () => {
  try {
    cacheInstance = new NodeCache({
      stdTTL: 3600, // Default TTL: 1 hour
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false
    });

    console.log('✅ Node Cache initialized successfully');
  } catch (error) {
    console.error('❌ Cache initialization failed:', error);
  }
};

const cache = {
  get(key) {
    try {
      if (!cacheInstance) return null;
      return cacheInstance.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set(key, value, ttl = 3600) {
    try {
      if (!cacheInstance) return false;
      return cacheInstance.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  del(key) {
    try {
      if (!cacheInstance) return false;
      return cacheInstance.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  has(key) {
    try {
      if (!cacheInstance) return false;
      return cacheInstance.has(key);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  },

  flush() {
    try {
      if (!cacheInstance) return false;
      cacheInstance.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  },

  keys() {
    try {
      if (!cacheInstance) return [];
      return cacheInstance.keys();
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
};

module.exports = {
  initializeCache,
  cache
};







