// @version V1.0.0.1
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：合成钢琴音色
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

class JsLoader {
  constructor() {
    this.dbName = 'js-cache-db';
    this.storeName = 'js-files';
    this.db = null;
    this.initialized = false;
    this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('IndexedDB initialization failed');
        reject(new Error('Database initialization failed'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'path' });
          store.createIndex('version', 'version', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async waitForInitialization() {
    if (!this.initialized) {
      await this.initDB();
    }
    return new Promise((resolve) => {
      const checkInitialization = () => {
        if (this.initialized) {
          resolve();
        } else {
          setTimeout(checkInitialization, 100);
        }
      };
      checkInitialization();
    });
  }

  async getFromCache(path) {
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(path);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to read from cache'));
      };
    });
  }

  async saveToCache(path, content, version) {
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const jsFile = {
        path: path,
        content: content,
        version: version,
        timestamp: Date.now()
      };

      const request = store.put(jsFile);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save to cache'));
      };
    });
  }

  async fetchJsFromNetwork(path) {
    try {
      const response = await fetch(path, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();

      var version = '';
	  if (content.startsWith('// @version ')) {
	    let offset = '// @version '.length;
	    for (let i = 0; i < 128; i ++) {
		  if (content[i + offset] === '\n' || content[i + offset] === '\r') {
		    break;
	      }
		  version += content[i + offset];
		}
      }
      return {content: content, version: version};
    } catch (error) {
      console.error(`Failed to load JS file: ${path}`, error);
      throw error;
    }
  }

  createScriptTag(content, path) {
    const script = document.createElement('script');
    script.textContent = content;
    script.setAttribute('data-cached-path', path);
    script.setAttribute('type', 'text/javascript');

    if (document.currentScript && document.currentScript.parentNode) {
      document.currentScript.parentNode.insertBefore(script, document.currentScript.nextSibling);
    } else {
      document.head.appendChild(script);
    }

    return script;
  }

  async loadJs(path, version = null, force = false) {
    try {
      const cached = force ? null : await this.getFromCache(path);

      if (cached) {
        if (version === null || cached.version === version) {
          console.log(`Loading from cache: ${path}`);
          this.createScriptTag(cached.content, path);
          return;
        } else {
          console.log(`Version mismatch, update needed: ${path} (cached: ${cached.version}, required: ${version})`);
        }
      }

      console.log(`Loading from network: ${path}`);
      const loadRet = await this.fetchJsFromNetwork(path);
	  const content = loadRet.content;
	  const fetchedVersion = loadRet.version;
      console.log('version = ' + fetchedVersion);
      if (version !== null && fetchedVersion !== null && fetchedVersion !== version) {
        throw new Error(`Version mismatch: file version(${fetchedVersion}) ≠ required version(${version})`);
      }

      try {
        await this.saveToCache(path, content, fetchedVersion || version || 'unknown');
      } catch (error) {
        console.warn('Cache save failed, continuing:', error);
      }
      this.createScriptTag(content, path);
    } catch (error) {
      console.error(`Failed to load JS file: ${path}`, error);

      try {
        const cached = await this.getFromCache(path);
        if (cached) {
          console.warn(`Network load failed, using cached version: ${path}`);
          this.createScriptTag(cached.content, path);
        } else {
          throw new Error('No cached version available');
        }
      } catch (cacheError) {
        throw new Error(`Cannot load JS file ${path}: ${error.message}`);
      }
    }
  }

  async cleanupCache(maxAge = 30 * 24 * 60 * 60 * 1000) { // Default 30 days
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const cutoff = Date.now() - maxAge;

      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      const keysToDelete = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          keysToDelete.push(cursor.primaryKey);
          cursor.continue();
        } else {
          // Delete all expired entries
          keysToDelete.forEach(key => {
            store.delete(key);
          });
          resolve(keysToDelete.length);
        }
      };

      request.onerror = () => {
        reject(new Error('Cache cleanup failed'));
      };
    });
  }

  async getCacheStats() {
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        const items = event.target.result;
        const stats = {
          total: items.length,
          totalSize: 0,
          items: items.map(item => ({
            path: item.path,
            version: item.version,
            size: item.content.length,
            timestamp: new Date(item.timestamp).toLocaleString()
          }))
        };

        stats.totalSize = items.reduce((sum, item) => sum + item.content.length, 0);
        resolve(stats);
      };

      request.onerror = () => {
        reject(new Error('Failed to get cache statistics'));
      };
    });
  }

  async deleteCache(path) {
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(path);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete cache'));
      };
    });
  }

  async clearCache() {
    await this.waitForInitialization();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to clear cache'));
      };
    });
  }

  isScriptLoaded(path) {
    return !!document.querySelector(`script[data-cached-path="${path}"]`);
  }

  async loadJsWithCallback(path, version = null, callback = null) {
    try {
      await this.loadJs(path, version);
      if (callback && typeof callback === 'function') {
        callback(null, path);
      }
    } catch (error) {
      if (callback && typeof callback === 'function') {
        callback(error, path);
      }
      throw error;
    }
  }
}

const jsLoader = new JsLoader();

document.addEventListener('DOMContentLoaded', async () => {
  allNeedJsFile = [
    {path: 'AudioManager.js', version: 'V1.0.0.1'},
    {path: 'pianoSynth.js', version: 'V1.0.0.1' },
    {path: 'configUi.js', version: 'V1.0.0.1' },
    {path: 'configOp.js', version: 'V1.0.0.1' },
    {path: 'displayer.js', version: 'V1.0.0.1' },
  ];

  console.log('start to load js...');
  for (let i = 0; i < allNeedJsFile.length; i ++) {
    await jsLoader.loadJs(allNeedJsFile[i].path, allNeedJsFile[i].version);
  }
  console.log('load all js done.');
  document.dispatchEvent(new CustomEvent('ceAllJsLoadDoneEvent', {
    detail: { message: 'One-line event' }
  }));
});

if (typeof window !== 'undefined') {
  window.JsLoader = JsLoader;
  window.jsLoader = jsLoader;
}
