// @version V1.0.0.3
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：合成钢琴音色
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.db = null;
    this.isInitialized = false;
    this.initAudioContext();
    this.pianoAudio = null;
    this.cachedAudios = {};
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext({sampleRate: 22050});
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Your browser does not support Web Audio API');
    }
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioCacheDB', 2);

      request.onerror = (event) => {
        console.error('Failed to open database:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('audio_cache')) {
          const audioStore = db.createObjectStore('audio_cache', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('audio_meta')) {
          const metaStore = db.createObjectStore('audio_meta', { keyPath: 'key' });
        }
      };
    });
  }

  showProgressDialog(message = '') {
    hideLoading();
    showLoading(message)
    return;
  }

  updateProgressInfo(progress, message = null) {
    updateLoadingInfo(progress, message);
  }

  hideProgressDialog() {
    hideLoading();
  }

  async downloadMP3(url) {
    this.cancelDownload = false;

    try {
      console.log(`Starting download: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength) : 0;
      let loadedBytes = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        if (this.cancelDownload) {
          console.log('Download cancelled by user');
          return null;
        }

        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loadedBytes += value.length;

        if (totalBytes > 0) {
          const progress = (loadedBytes / totalBytes) * 100;
          const mbLoaded = (loadedBytes / 1024 / 1024).toFixed(2);
          const mbTotal = (totalBytes / 1024 / 1024).toFixed(2);

          this.updateProgressInfo(Math.floor(progress), `正在下载资源: ${mbLoaded}MB / ${mbTotal}MB`, true);
        } else {
          this.updateProgressInfo(0, `已下载: ${(loadedBytes / 1024 / 1024).toFixed(2)}MB`, true);
        }
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const mp3Data = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        mp3Data.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`download completed, size: ${(mp3Data.length / 1024 / 1024).toFixed(2)}MB`);
      this.updateProgressInfo(100, '下载完成');

      if (this.cancelDownload || (mp3Data.length <= 0)) {
        return null;
      }
      return mp3Data;
    } catch (error) {
      console.error('Failed to download MP3:', error);
      return null;
    }
  }

  async decodeMP3ToWAV(mp3Buffer) {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      this.updateProgressInfo(20, '正在解码音频……');

      const audioBuffer = await new Promise((resolve, reject) => {
        this.audioContext.decodeAudioData(
          mp3Buffer,
          (buffer) => {
            resolve(buffer);
          },
          (error) => {
            reject(error);
          }
        );
      });

      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;

      console.log(`Audio info - Channels: ${numChannels}, Sample rate: ${sampleRate}, Samples: ${length}`);

      this.updateProgressInfo(100, '解码完成');

      this.audioWav = {
        data: audioBuffer,
        sampleRate: sampleRate,
        channels: numChannels,
        duration: audioBuffer.duration,
        length: length
      };
      console.log(`WAV data generated successfully, duration: ${audioBuffer.duration.toFixed(2)} seconds`);
      return this.audioWav;
    } catch (error) {
      console.error('Failed to decode MP3:', error);
      throw error;
    }
  }

  async genSplitPoints(wavData) {
    return new Promise((resolve, reject) => {
        resolve(this.genSplitPointsInt(wavData));
        });
  }

  async genSplitPointsInt(wavData) {
    console.log('start to genSplitPoints...');
    const ch0Data = Array.from(wavData.data.getChannelData(0));
    for (let i = 0; i < wavData.data.length; i ++) {
      if (ch0Data[i] < 0) {
        ch0Data[i] = 0 - ch0Data[i];
      }
    }
    this.updateProgressInfo(33, '正在处理音频……');
    await new Promise(resolve => setTimeout(resolve, 10));
    if (wavData.channels > 1) {
      const ch1Data = Array.from(wavData.data.getChannelData(1));
      for (let i = 0; i < wavData.data.length; i ++) {
        if (ch1Data[i] < 0) {
          ch0Data[i] = (ch0Data[i] - ch1Data[i]) / 2;
        } else {
          ch0Data[i] = (ch0Data[i] + ch1Data[i]) / 2;
        }
      }
      this.updateProgressInfo(67, '正在处理音频……');
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    let found = false;
    let count = 0;
    let smallLenTh = wavData.data.sampleRate * 0.1;
    const splitPoints = [];
    for (let i = 0; i < wavData.data.length; i ++) {
      if (!found) {
        if (ch0Data[i] > 0.05) {
          found = true;
          count = 0;
          splitPoints.push(Math.floor(i - 0.02 * wavData.data.sampleRate));
        }
      } else {
        if (ch0Data[i] < 0.01) {
          count ++;
          if (count > smallLenTh) {
            found = false;
          }
        } else {
          count = 0;
        }
      }
    }
    splitPoints.push(wavData.data.length);
    /*
    console.log('splitPoints = ' + splitPoints.length + ', val =' + splitPoints);
    for (let i = 0; i < splitPoints.length - 1; i ++) {
      console.log('diff[' + i + '] =' + (splitPoints[i + 1] - splitPoints[i]));
    }
    */
    console.log('genSplitPoints done.');
    return splitPoints;
  }

  async cacheMp3ToLocalDb(mp3Data, cacheId, currentVersion, procRet) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log('cache to local');
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audio_cache', 'audio_meta'], 'readwrite');
      // const ch0Data = Array.from(wavData.data.getChannelData(0));
      const audioData = {
        id: cacheId,
        version: currentVersion,
        timestamp: Date.now(),
        data: mp3Data,
        splitPoints: procRet ? procRet.splitPoints : null,
      };

      const audioStore = transaction.objectStore('audio_cache');
      const audioRequest = audioStore.put(audioData);

      const metaStore = transaction.objectStore('audio_meta');
      const metaRequest = metaStore.put({
        key: 'current_version_' + cacheId,
        value: currentVersion,
        cacheId: cacheId,
        lastUpdated: Date.now()
      });

      audioRequest.onsuccess = () => {
        console.log(`Audio data cached successfully, ID: ${cacheId}`);
      };

      metaRequest.onsuccess = () => {
        console.log('Metadata cached successfully');
      };

      transaction.oncomplete = () => {
        console.log('All caching operations completed');
        resolve(true);
      };

      transaction.onerror = (event) => {
        console.error('Caching failed:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async loadMp3FromLocalDb(cacheId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audio_cache'], 'readonly');
      const store = transaction.objectStore('audio_cache');
      const request = store.get(cacheId);

      request.onsuccess = (event) => {
        const cachedData = event.target.result;

        if (!cachedData) {
          resolve(null);
          return;
        }

        console.log('Audio loaded from cache successfully');
        resolve(cachedData);
      };

      request.onerror = (event) => {
        console.error('Failed to load from cache:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async processAudio(mp3Data, cSplitPoints) {
    try {
      const wavData = await this.decodeMP3ToWAV(mp3Data);
      await new Promise(resolve => setTimeout(resolve, 10));

      this.updateProgressInfo(10, '正在处理音频……');
      await new Promise(resolve => setTimeout(resolve, 10));
      const splitPoints = cSplitPoints ? cSplitPoints : await this.genSplitPoints(wavData);
      this.updateProgressInfo(100, '处理音频完成');
      await new Promise(resolve => setTimeout(resolve, 10));

      const audioData = {
        wavData: wavData,
        splitPoints: splitPoints,
      }
      return audioData;
    } catch (error) {
      console.error('processAudio failed:', error);
      return null;
    }
    return null;
  }

  async checkVersionAndUpdate(url, cacheId, newVersion, forceUpdate = false) {
    try {
      const currentCached = await this.getCachedVersion(cacheId);
      const needUpdate = forceUpdate ||
        !currentCached ||
        currentCached.value !== newVersion;

      if (!needUpdate) {
        console.log('Version for [' + cacheId + '] matches, using cached data');
        this.updateProgressInfo(15, '正在从本地加载' + cacheId + '缓存……');
        await new Promise(resolve => setTimeout(resolve, 10));
        const cacheRet = await this.loadMp3FromLocalDb(cacheId, newVersion);
        const mp3Data = cacheRet.data;
        this.updateProgressInfo(100, '加载缓存完成');
        await new Promise(resolve => setTimeout(resolve, 10));
        let ret = null;
        if (mp3Data) {
          if (!cacheRet.splitPoints) {
            var mp3Data_ = mp3Data.slice(0);
          }
          ret = await this.processAudio(mp3Data, cacheRet.splitPoints);
          if (!cacheRet.splitPoints && ret) {
            await this.cacheMp3ToLocalDb(mp3Data_, cacheId, newVersion, ret);
          }
        }
        return ret;
      }

      console.log(`Update required, downloading new version: ${newVersion}`);
      this.updateProgressInfo(0, '开始从网站下载' + cacheId + '资源……');
      await new Promise(resolve => setTimeout(resolve, 10));
      const mp3Data = await this.downloadMP3(url);
      await new Promise(resolve => setTimeout(resolve, 10));

      if (mp3Data) {
        const ret = await this.processAudio(mp3Data.buffer.slice(0));
        if (ret) {
          this.updateProgressInfo(13, '正在缓存到本地……');
          await new Promise(resolve => setTimeout(resolve, 10));
          await this.cacheMp3ToLocalDb(mp3Data.buffer, cacheId, newVersion, ret);
          this.updateProgressInfo(100, '缓存完成');
          await new Promise(resolve => setTimeout(resolve, 10));
          console.log('Mp3 update completed');
          return ret;
        }
      }
    } catch (error) {
      console.error('Version check and update failed:', error);
    }
    return null;
  }

  async getCachedVersion(cacheId) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audio_meta'], 'readonly');
      const store = transaction.objectStore('audio_meta');
      const request = store.get('current_version_' + cacheId);

      request.onsuccess = (event) => {
        resolve(event.target.result || null);
      };

      request.onerror = (event) => {
        console.log('event.target.error =' + event.target.error);
        reject(event.target.error);
      };
    });
  }

  getAudioSegment(sourceBuffer, startSample, endSample) {
    const audioContext = sourceBuffer.context;
    const numChannels = sourceBuffer.numberOfChannels;
    const sampleRate = sourceBuffer.sampleRate;
    const segmentLength = endSample - startSample;

    const segmentBuffer = this.audioContext.createBuffer(
      numChannels,
      segmentLength,
      sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const sourceData = sourceBuffer.getChannelData(channel);
      const targetData = segmentBuffer.getChannelData(channel);

      for (let i = 0; i < segmentLength; i++) {
        targetData[i] = sourceData[startSample + i];
      }
    }

    return segmentBuffer;
  }

  async getAudioSegmentCnt(cacheId) {
    if (!this.audioContext) {
      return -1;
    }

    try {
      const cachedAudio = this.cachedAudios[cacheId];
      if (cachedAudio) {
        return cachedAudio.splitPoints.length - 1;
      }
    } catch (error) {
      console.error('Failed to get segment cnt:', error);
    }

    return -1;
  }

  async playAudioSegment(cacheId, index, volume = 1) {
    if (!this.audioContext) {
      return null;
    }

    try {
      const cachedAudio = this.cachedAudios[cacheId];
      let startSample = 0;
      let endSample = 0;
      if (cachedAudio) {
        if (index < 0 || index >= cachedAudio.splitPoints.length - 1) {
          console.log(`error index ${index}, splitPoints len = ${cachedAudio.splitPoints.length}`);
          return null;
        }
        startSample = index > 0 ? cachedAudio.splitPoints[index] : 0;
        if (cacheId.startsWith('voice')) {
          startSample -= Math.floor(cachedAudio.wavData.sampleRate * 0.1);
        }
        if (startSample < 0) {
          startSample = 0;
        }
        endSample = cachedAudio.splitPoints[index + 1];
        endSample -= Math.floor(cachedAudio.wavData.sampleRate * 0.1);
        if (endSample < 0) {
          endSample = 1;
        }
      } else {
        return null;
      }

      // console.log(`Playing samples: ${startSample} to ${endSample}`);

      endSample = Math.min(endSample, cachedAudio.wavData.length);
      const audioBuffer = this.getAudioSegment(cachedAudio.wavData.data, startSample, endSample);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);

      return {
        source: source,
        gainNode: gainNode,
        playTime: Math.floor(audioBuffer.length * 1000 / audioBuffer.sampleRate),
        stop: () => {
          try {
            source.stop();
          } catch (e) {
          }
        },
        setVolume: (vol) => {
          gainNode.gain.value = Math.max(0, Math.min(1, vol));
        }
      };
    } catch (error) {
      console.error('Failed to play audio segment:', error);
      return null;
    }
    return null;
  }

  async loadAudioRes() {
    if (this.cachedAudios['piano']) {
      return true;
    }

    this.showProgressDialog();

    const allAudioRes = [
      {key: 'piano', path: './audio/piano.mp3', ver: 'V1.0.0.2'},
      {key: 'voice_000', path: './audio/voice_000.mp3', ver: 'V1.0.0.2'},
      {key: 'voice_001', path: './audio/voice_001.mp3', ver: 'V1.0.0.2'},
      {key: 'voice_002', path: './audio/voice_002.mp3', ver: 'V1.0.0.2'},
      {key: 'voice_003', path: './audio/voice_003.mp3', ver: 'V1.0.0.2'},
      {key: 'voice_600', path: './audio/voice_600.mp3', ver: 'V1.0.0.2'},
    ];

    for (let i = 0; i < allAudioRes.length; i ++) {
      try {
        this.cachedAudios[allAudioRes[i].key] = await this.checkVersionAndUpdate(allAudioRes[i].path,
                allAudioRes[i].key, allAudioRes[i].ver, false);
      } catch (error) {
        console.error('Audio update failed:', error);
        this.cachedAudios[allAudioRes[i].key] = null;
      }
    }

    this.hideProgressDialog();

    if (this.cachedAudios['piano']) {
      return true;
    } else {
      return false;
    }
  }
}

let audioManager = null;
async function initAudioManager() {
  if (!audioManager) {
    audioManager = new AudioManager();
    await audioManager.initDatabase();
  }
  let timeout = 100;
  while ((!audioManager.isInitialized) || (audioManager.db == null)) {
    await new Promise(resolve => setTimeout(resolve, 10));
    timeout --;
    if (timeout <= 0) {
      break;
    }
  }
  return audioManager;
}

async function updateAudio(mp3Url, cacheId, version, forceUpdate = false) {
  try {
    const manager = await initAudioManager();
    const audioData = await manager.checkVersionAndUpdate(mp3Url, cacheId, version, forceUpdate);
    return audioData;
  } catch (error) {
    console.error('Audio update failed:', error);
    throw error;
  }
}

async function loadAudioRes() {
  try {
    const manager = await initAudioManager();
    return await manager.loadAudioRes();
  } catch (error) {
    console.error('Audio update failed:', error);
    throw error;
  }
}

window.AudioManagerAPI = {
  init: initAudioManager,
  updateAudio: updateAudio,
  loadAudioRes: loadAudioRes,

  downloadMP3: async (url) => {
    const manager = await initAudioManager();
    return await manager.downloadMP3(url);
  },

  decodeToWAV: async (mp3Buffer) => {
    const manager = await initAudioManager();
    return await manager.decodeMP3ToWAV(mp3Buffer);
  },

  loadFromCache: async (cacheId, currentVersion) => {
    const manager = await initAudioManager();
    return await manager.loadMp3FromLocalDb(cacheId, currentVersion);
  },

  playAudioSegment: async (cacheId, index) => {
    const manager = await initAudioManager();
    return manager.playAudioSegment(cacheId, index);
  },

  getAudioSegmentCnt: async (cacheId) => {
    const manager = await initAudioManager();
    return manager.getAudioSegmentCnt(cacheId);
  },
};

document.addEventListener('ceAllJsLoadDoneEvent', async () => {
  try {
    await initAudioManager();
    console.log('Audio manager initialization completed');
  } catch (error) {
    console.error('Audio manager initialization failed:', error);
  }
});
