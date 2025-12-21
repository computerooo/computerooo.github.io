// @version V1.0.0.1
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：合成钢琴音色
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

class PianoSynth {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.stringBuffers = new Map();
    this.vibrateState = 0.3;
    this.maxDispNotes = 10;
    this.dispNotes = new Int32Array(this.maxDispNotes);
    this.noteColors = new Int32Array(this.maxDispNotes);
    this.dispNames = '';
    this.curInputIndex = 0;
    this.ansNotes = null;
    this.skipAnsCnt = 0;
    this.defDuration = 1.5;
    this.preGenIndex = 0;
    this.preGenedLow = 1000;
    this.preGenedHi = 0;
  }

  setAnsNotes(ansNotes) {
    this.ansNotes = ansNotes;
  }

  normalize(buffer) {
    const length = buffer.length;
    const data = buffer.getChannelData(0);
    var i;
    var maxVar = 0.1;

    for (i = 0; i < length; i ++) {
      if (maxVar < data[i]) {
        maxVar = data[i];
      }
      if (maxVar < -data[i]) {
        maxVar = -data[i];
      }
    }

    for (let i = 0; i < length; i++) {
      data[i] /= maxVar;
      data[i] *= 0.6;
    }
  }

  mixBuffers(buffer1, buffer2) {
    const length = Math.max(buffer1.length, buffer2.length);
    const mixedBuffer = this.audioContext.createBuffer(1, length, this.sampleRate);

    const data1 = buffer1.getChannelData(0);
    const data2 = buffer2.getChannelData(0);
    const mixedData = mixedBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const sample1 = i < data1.length ? data1[i] : 0;
      const sample2 = i < data2.length ? data2[i] : 0;
      mixedData[i] = sample1 + sample2;
    }

    return mixedBuffer;
  }

  generateStringVibration(frequency, duration) {
    const cacheKey = `${frequency}_${duration}`;
    if (this.stringBuffers.has(cacheKey)) {
      return this.stringBuffers.get(cacheKey);
    }
    const string1 = this.generateStringVibrationInt(frequency, duration);
    this.normalize(string1);
    this.stringBuffers.set(cacheKey, string1);
    return string1;
  }

  generateStringVibrationInt(frequency, duration) {
    var nOversample = 1;
    while (nOversample < 20) {
      const sr = nOversample * this.sampleRate;
      const err = ((sr / frequency) / Math.floor(sr / frequency) - 1);
      if (err < 0.003) { // < 0.3%
        break;
      }
      nOversample += 1;
    }
    const sampleRate = this.sampleRate * nOversample;
    const length = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const outBuffer = this.audioContext.createBuffer(1, length / nOversample, this.sampleRate);
    const data = buffer.getChannelData(0);
    const outData = outBuffer.getChannelData(0);

    const delayLength = Math.floor(sampleRate / frequency);
    const delayLengthF = sampleRate / frequency;

    const delayLine = this.createPluckedNoise(delayLength, frequency);

    const stringDamping = this.calStringDamping(frequency);
    const feedback = stringDamping;
    const inharmonicity = this.calInharmonicity(frequency);

    for (let i = 0; i < length; i ++) {
      const readIndex = i % delayLength;
      let sample = delayLine[readIndex];
      const modulation = 1.0 + inharmonicity * Math.sin(i * 0.0001);
      const newSample = sample * feedback * modulation;

      if (i > delayLength * 10) {
        delayLine[readIndex] = newSample;
      }

      data[i] = newSample;
    }

    this.applyLowPassFilter(buffer.getChannelData(0), this.sampleRate / 3, 0, 0.707, sampleRate);
    this.applyLowPassFilter(buffer.getChannelData(0), this.sampleRate / 3, 0, 0.707, sampleRate);

    for (let i = 0; i < outBuffer.length; i ++) {
      outData[i] = data[i * nOversample];
    }

    const filteredBuffer = this.applyStringBodyResonance(outBuffer, frequency, this.sampleRate);

    const envelope = this.genADSREnvelope(filteredBuffer.length, this.sampleRate);
    const filteredData = filteredBuffer.getChannelData(0);
    for (let i = 0; i < filteredBuffer.length; i ++) {
      filteredData[i] *= envelope[i];
    }

    return filteredBuffer;
  }

  calNextPos() {
    let a = 1664525;
    let c = 1013904223;
    let m = Math.pow(2, 32);
    this.vibrateState = (a * this.vibrateState + c) % m;
    return this.vibrateState / m;
  }

  createPluckedNoise(length, frequency) {
    const vibrate = new Float32Array(length);
    const hfLen = length / 2;

    this.vibrateState = 0.25;

    for (let i = 0; i < length; i++) {
      const r1 = this.calNextPos();
      const r2 = this.calNextPos();
      vibrate[i] = (r1 + r2 - 1.0);
    }

    var saw = (frequency - 220) / (880 - 220);
    if (saw < 0) {
      saw = 0;
    } else if (saw > 1) {
      saw = 1;
    }

    for (let i = 0; i < length; i++) {
      const window = Math.cos(2 * Math.PI * i / (length - 1));
      vibrate[i] *= window;
      vibrate[i] += saw * (hfLen - i) / hfLen;
    }

    return vibrate;
  }

  calStringDamping(frequency) {
    return 0.995;
    const maxVal = 0.001;
    const maxFreq = 4200;
    const minVal = 0.000;
    const minFreq = 20;
    return 0.995 + Math.log10(frequency / minFreq) / Math.log10(maxFreq / minFreq) * (maxVal - minVal) + minVal;
  }

  calInharmonicity(frequency) {
    return 0.0005 * Math.sqrt(frequency / 440);
  }

  applyStringBodyResonance(inputBuffer, frequency, sampleRate) {
    const length = inputBuffer.length;
    const outputBuffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const tmpBuffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const inputData = inputBuffer.getChannelData(0);
    const outputData = outputBuffer.getChannelData(0);
    const tmpData = tmpBuffer.getChannelData(0);
    const fq = 50;
    var i;

    const resonances_hi = [
      { freq: frequency * 1, gain: 3.0, q: fq },
      { freq: frequency * 2, gain: 3.0, q: fq },
      { freq: frequency * 3, gain: -3.0, q: fq },
      { freq: frequency * 4, gain: -10.0, q: fq },
      { freq: frequency * 5, gain: -10.0, q: fq },
      { freq: frequency * 6, gain: -15.0, q: fq },
      { freq: frequency * 7, gain: -20.0, q: fq },
      { freq: frequency * 8, gain: -20.0, q: fq },
      { freq: frequency * 9, gain: -25.0, q: fq },
      { freq: frequency * 10, gain: -20.0, q: fq },
      { freq: frequency * 11, gain: -20.0, q: fq },
      { freq: frequency * 12, gain: -20.0, q: fq },
    ];

    const resonances_mid = [
      { freq: frequency * 1, gain: 0.0, q: fq },
      { freq: frequency * 2, gain: 3.0, q: fq },
      { freq: frequency * 3, gain: 0.0, q: fq },
      { freq: frequency * 4, gain: -5.0, q: fq },
      { freq: frequency * 5, gain: -10.0, q: fq },
      { freq: frequency * 6, gain: -15.0, q: fq },
      { freq: frequency * 7, gain: -20.0, q: fq },
      { freq: frequency * 8, gain: -20.0, q: fq },
      { freq: frequency * 9, gain: -25.0, q: fq },
      { freq: frequency * 10, gain: -25.0, q: fq },
      { freq: frequency * 11, gain: -25.0, q: fq },
      { freq: frequency * 12, gain: -30.0, q: fq },
      { freq: frequency * 13, gain: -30.0, q: fq },
      { freq: frequency * 14, gain: -30.0, q: fq },
      { freq: frequency * 15, gain: -30.0, q: fq },
    ];

    const resonances_low = [
      { freq: frequency * 1, gain: 0.0, q: fq },
      { freq: frequency * 2, gain: 3.0, q: fq },
      { freq: frequency * 3, gain: 0.0, q: fq },
      { freq: frequency * 4, gain: -5.0, q: fq },
      { freq: frequency * 5, gain: -10.0, q: fq },
      { freq: frequency * 6, gain: -15.0, q: fq },
      { freq: frequency * 7, gain: -20.0, q: fq },
      { freq: frequency * 8, gain: -20.0, q: fq },
      { freq: frequency * 9, gain: -25.0, q: fq },
      { freq: frequency * 10, gain: -25.0, q: fq },
      { freq: frequency * 11, gain: -25.0, q: fq },
      { freq: frequency * 12, gain: -30.0, q: fq },
      { freq: frequency * 13, gain: -30.0, q: fq },
      { freq: frequency * 14, gain: -30.0, q: fq },
      { freq: frequency * 15, gain: -30.0, q: fq },
    ];

    var resonances;
    if (frequency >= 438) {
      resonances = resonances_hi;
    } else if (frequency >= 108) {
      resonances = resonances_mid;
    } else {
      resonances = resonances_low;
    }

    for (let i = 0; i < length; i++) {
      outputData[i] = 0;
    }

    var lowPassFreq = frequency * (resonances.length + 3);
    if (lowPassFreq < sampleRate / 2.2) {
      for (i = 0; i < 2; i ++) {
        this.applyLowPassFilter(inputData, lowPassFreq, 0.0, 0.707, sampleRate);
      }
    }

    var ftIndex = 1;
    for (const resonance of resonances) {
      const ftFreq = resonance.freq;
      const delayLength = 3 * Math.floor(Math.pow(sampleRate / ftFreq, 0.1) * resonances.length / Math.pow(ftIndex, 0.3)) + 1;
      const feedback = this.calStringDamping(ftFreq) + 0.002;
      const inharmonicity = this.calInharmonicity(ftFreq);
      var coef = 1.0;

      if (ftFreq > sampleRate / 2.2) {
        break;
      }
      for (let i = 0; i < length; i++) {
        tmpData[i] = inputData[i];
      }

      this.applyBandPassFilter(tmpData, resonance.freq, resonance.gain, resonance.q, sampleRate);

      for (let i = 0; i < length; i++) {
        outputData[i] += tmpData[i] * coef;
        const modulation = 1.0 + inharmonicity * Math.sin(i * 0.0001);
        if (i % delayLength == 0) {
          coef *= feedback * modulation;
        }
      }

      ftIndex ++;
    }

    return outputBuffer;
  }

  genADSREnvelope(totalSamples, sampleRate) {
    const attackTime = 0.020;
    const decayTime = 0.10;
    const sustainLevel = 0.9;
    const releaseTime = 0.5;

    const duration = totalSamples / sampleRate;
    const attackDuration = duration * attackTime;
    const decayDuration = duration * decayTime;
    const releaseDuration = duration * releaseTime;
    const sustainDuration = duration - (attackDuration + decayDuration + releaseDuration);

    const envelope = new Float32Array(totalSamples);

    let currentSample = 0;

    const attackSamples = Math.floor(attackDuration * sampleRate);
    for (let i = 0; i < attackSamples && currentSample < totalSamples; i++) {
      envelope[currentSample] = 1;//Math.pow(1.5, i - attackSamples);
      currentSample++;
    }

    const decaySamples = Math.floor(decayDuration * sampleRate);
    const decayStartValue = 1.0;
    const decayEndValue = sustainLevel;
    for (let i = 0; i < decaySamples && currentSample < totalSamples; i++) {
      envelope[currentSample] = decayStartValue + (decayEndValue - decayStartValue) * (i / decaySamples);
      currentSample++;
    }

    const sustainSamples = Math.floor(sustainDuration * sampleRate);
    for (let i = 0; i < sustainSamples && currentSample < totalSamples; i++) {
      envelope[currentSample] = sustainLevel;
      currentSample++;
    }

    const releaseSamples = Math.floor(releaseDuration * sampleRate);
    const releaseStartValue = sustainLevel;
    for (let i = 0; i < releaseSamples && currentSample < totalSamples; i++) {
      envelope[currentSample] = releaseStartValue * (1 - i / releaseSamples);
      currentSample++;
    }

    while (currentSample < totalSamples) {
      envelope[currentSample] = 0;
      currentSample++;
    }

    return envelope;
  }

  applyBandPassFilter(data, centerFreq, gain, q, sampleRate) {
    const length = data.length;

    const A = Math.pow(10, gain / 20);
    const w0 = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    var b0 = alpha;
    var b1 = 0;
    var b2 = -alpha;

    var a0 = 1 + alpha;
    var a1 = -2 * Math.cos(w0);
    var a2 = 1 - alpha;

    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    b0 = b0 / a0;
    b1 = b1 / a0;
    b2 = b2 / a0;

    a1 = - a1 / a0;
    a2 = - a2 / a0;

    for (let i = 0; i < length; i++) {
      const x0 = data[i];
      // const y0 = (b0 * x0 + b1 * x1 + b2 * x2 + a1 * y1 + a2 * y2);
      const y0 = (b0 * x0 + b2 * x2 + a1 * y1 + a2 * y2);

      data[i] = y0 * A;

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
  }

  applyLowPassFilter(data, centerFreq, gain, q, sampleRate) {
    const length = data.length;

    const A = Math.pow(10, gain / 20);
    const w0 = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    var b0 = (1 - Math.cos(w0)) / 2;
    var b1 = (1 - Math.cos(w0));
    var b2 = (1 - Math.cos(w0)) / 2;

    var a0 = (1 + alpha);
    var a1 = (-2 * Math.cos(w0));
    var a2 = (1 - alpha);

    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    b0 = b0 / a0;
    b1 = b1 / a0;
    b2 = b2 / a0;

    a1 = - a1 / a0;
    a2 = - a2 / a0;

    for (let i = 0; i < length; i++) {
      const x0 = data[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 + a1 * y1 + a2 * y2);

      data[i] = y0 * A;

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
  }

  applyPeakingFilter(data, centerFreq, gain, q, sampleRate) {
    const length = data.length;

    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    var b0 = 1 + alpha * A;
    var b1 = -2 * Math.cos(w0);
    var b2 = 1 - alpha * A;

    var a0 = 1 + alpha / A;;
    var a1 = (-2 * Math.cos(w0));
    var a2 = (1 - alpha / A);

    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    b0 = b0 / a0;
    b1 = b1 / a0;
    b2 = b2 / a0;

    a1 = - a1 / a0;
    a2 = - a2 / a0;

    for (let i = 0; i < length; i++) {
      const x0 = data[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 + a1 * y1 + a2 * y2);

      data[i] = y0;

      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
  }

  midiToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  async playMIDINote(midiNote, duration = 1.5, velocity = 0.9) {
    const ret = await AudioManagerAPI.playAudioSegment('piano', midiNote - 21);
    if (ret) {
      return ret;
    }
    const freq = this.midiToFrequency(midiNote);
    return this.playNote(freq, duration, velocity);
  }

  playNote(frequency, duration = 1.0, velocity = 1.0) {
    const stringBuffer = this.generateStringVibration(frequency, duration);

    const source = this.audioContext.createBufferSource();
    source.buffer = stringBuffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = velocity;

    source.connect(gainNode);

    if (this.audioContext.destination.channelCount > 1) {
      const panner = this.audioContext.createStereoPanner();
      const panValue = Math.log10(frequency / 440) * 1.0;
      panner.pan.value = Math.max(-0.5, Math.min(0.5, panValue));

      gainNode.connect(panner);
      panner.connect(this.audioContext.destination);
    } else {
      gainNode.connect(this.audioContext.destination);
    }

    source.start();
    source.stop(this.audioContext.currentTime + duration);

    return {
      source: source,
      gainNode: gainNode,
      stop: () => {
        if (source) {
          source.stop();
        }
      },
      setVolume: (vol) => {
        gainNode.gain.value = Math.max(0, Math.min(1, vol));
      },
    };
  }

  getNoteIndex(noteName) {
    const noteOrder = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const octave = parseInt(noteName.slice(-1));
    const note = noteName.slice(0, -1);
    return octave * 12 + noteOrder.indexOf(note);
  }

  blackKeysBeforeWhite(whiteKeyIndex, notes) {
    let blackKeyCount = 0;

    for (let i = 0; i < notes.length; i++) {
      if (notes[i].color === 'white') {
        if (i === whiteKeyIndex) {
          return blackKeyCount;
        }
      } else {
        blackKeyCount++;
      }
    }

    return blackKeyCount;
  }

  async onKeyDown(note, showAns = true, byUser = true) {
    let noteColors = null;
    if (note == undefined) {
      return;
    }
    if ((playTimerId != -1) && (trainMode.startsWith("Train")) && (byUser == true)) {
      return;
    }
    if ((this.ansNotes != null) && ((this.curInputIndex >= this.ansNotes.length) || !byUser)) {
      showAns = false;
    }
    const keyElement = document.querySelector(`[data-note="${note.name}"]`);
    if (showAns) {
      this.dispNotes[this.curInputIndex] = note.note;
      if (this.ansNotes != null) {
        if (trainMode == 'Test_interval') {
          if (((note.note == this.ansNotes[0]) || (note.note == this.ansNotes[1])) &&
              ((this.curInputIndex == 0) || (this.dispNotes[0] != note.note || this.ansNotes[0] == this.ansNotes[1]))) {
            this.noteColors[this.curInputIndex] = 0xFF99FF00;
          } else {
            this.noteColors[this.curInputIndex] = 0xFFFF0000;
            playTipsError();
          }
        } else if (this.ansNotes[this.curInputIndex] == note.note) {
          this.noteColors[this.curInputIndex] = 0xFF99FF00;
        } else {
          this.noteColors[this.curInputIndex] = 0xFFFF0000;
          playTipsError();
        }
        noteColors = this.noteColors;
      }
      this.dispNames += noteToSingName(note.note, isFlatKey);
      window.Display.showNotes(this.dispNotes, noteColors, this.dispNames, isFlatKey, this.skipAnsCnt);
      this.curInputIndex ++;
      if (this.curInputIndex >= this.maxDispNotes) {
        this.cleanHistNoteInfo();
      }
      if (keyElement) {
        keyElement.style.background = note.color === 'white' ? '#e0e0e0' : '#555';
        keyElement.style.transform = 'translateY(3px)';
      }
      keyElement.down = true;
    }
    const velocity = 0.9 + Math.random() * 0.1;
    if ((this.ansNotes != null) && (this.curInputIndex == this.ansNotes.length)) {
      onTestNext(this.checkCorrect());
      window.Display.showNotes(this.dispNotes, noteColors, this.dispNames, isFlatKey);
      this.curInputIndex ++;
    }
    if ((playTimerId != -1) && (trainMode.startsWith("Test")) && (byUser == true)) {
      return;
    }
    const ret = await this.playMIDINote(note.note + shiftValue, this.defDuration, velocity);
    if (keyElement) {
      if (keyElement.curPlayCt) {
        onKeyUp(note, byUser);
      }
      keyElement.curPlayCtl = ret;
    }
  }

  checkCorrect() {
    var isCorrect = false;

    if (this.ansNotes != null) {
      if (trainMode === 'Test_interval') {
        if (this.curInputIndex == 2) {
          if ((this.ansNotes[0] == this.dispNotes[1]) && (this.ansNotes[1] == this.dispNotes[0])) {
            return true;
          }
        }
      }
      for (let i = this.skipAnsCnt; i < this.curInputIndex; i ++) {
        if (this.ansNotes[i] != this.dispNotes[i]) {
          return false;
        }
      }
      return true;
    } else {
      return isCorrect;
    }
  }

  cleanHistNoteInfo(upAllKeys = false) {
    this.skipAnsCnt = 0;
    if ((refNote >= -1) && (trainMode == 'Test_block_chord')) {
      this.skipAnsCnt = 1;
    }
    this.curInputIndex = this.skipAnsCnt;
    this.dispNames = '';
    for (let i = 0; i < this.maxDispNotes; i ++) {
      this.dispNotes[i] = 0;
      this.noteColors[i] = 0xFFFF9900;
    }
    window.Display.showNotes([]);
    if (upAllKeys) {
      this.allKeysUp();
    }
  }

  allKeysUp() {
    for (let i = 0; i < kbNotes.length; i ++) {
      this.onKeyUp(kbNotes[i], false);
    }
  }

  onKeyRelease(obj, note, curPlayCtl, vol) {
    const noteVal = note.note + shiftValue;
    if (vol <= 0.01) {
      curPlayCtl.stop();
      curPlayCtl = null;
    } else {
      curPlayCtl.setVolume(vol);
      let ratio = 0.96;
      if (noteVal < 30) {
        ratio = 0.985;
      } else if (noteVal < 33) {
        ratio = 0.98;
      } else if (noteVal < 45) {
        ratio = 0.97;
      } else if (noteVal < 57) {
        ratio = 0.965;
      } else if (noteVal < 69) {
        ratio = 0.96;
      }
      setTimeout(obj.onKeyRelease, 1, obj, note, curPlayCtl, vol * ratio);
    }
  }

  onKeyUp(note, byUser = true) {
    if ((playTimerId != -1) && (trainMode.startsWith("Train")) && (byUser == true)) {
      return;
    }
    const keyElement = document.querySelector(`[data-note="${note.name}"]`);
    if (keyElement && keyElement.down) {
      keyElement.down = false;
      keyElement.style.background = note.color === 'white' ? 'white' : '#333';
      keyElement.style.transform = 'translateY(0)';
      if ((playTimerId == -1) && (this.ansNotes == null)) {
        this.cleanHistNoteInfo();
        window.Display.showNotes([]);
      }
    }
    if ((playTimerId != -1) && (trainMode.startsWith("Test")) && (byUser == true)) {
      return;
    }
    if (keyElement.curPlayCtl) {
      setTimeout(this.onKeyRelease, 100, this, note, keyElement.curPlayCtl, 1.0);
      keyElement.curPlayCtl = null;
    }
  }

  createKeyboard() {
    kbNotes = [
      { name: 'A1', color: 'white', key: 'q', note: 45, text:'A' },
      { name: 'A#1', color: 'black', key: '2', note: 46, text:'' },
      { name: 'B1', color: 'white', key: 'w', note: 47, text:'B' },
      { name: 'C1', color: 'white', key: 'e', note: 48, text:'C' },
      { name: 'C#1', color: 'black', key: '4', note: 49, text:'' },
      { name: 'D1', color: 'white', key: 'r', note: 50, text:'D' },
      { name: 'D#1', color: 'black', key: '5', note: 51, text:'' },
      { name: 'E1', color: 'white', key: 't', note: 52, text:'E' },
      { name: 'F1', color: 'white', key: 'y', note: 53, text:'F' },
      { name: 'F#1', color: 'black', key: '7', note: 54, text:'' },
      { name: 'G1', color: 'white', key: 'u', note: 55, text:'G' },
      { name: 'G#1', color: 'black', key: '8', note: 56, text:'' },
      { name: 'A2', color: 'white', key: 'i', note: 57, text:'A' },
      { name: 'A#2', color: 'black', key: '9', note: 58, text:'' },
      { name: 'B2', color: 'white', key: 'o', note: 59, text:'B' },
      { name: 'C2', color: 'white', key: 'p', note: 60, text:'C' },
      { name: 'C#2', color: 'black', key: '-', note: 61, text:'' },
      { name: 'D2', color: 'white', key: '[', note: 62, text:'D' },
      { name: 'D#2', color: 'black', key: '=', note: 63, text:'' },
      { name: 'E2', color: 'white', key: 'z', note: 64, text:'E' },
      { name: 'F2', color: 'white', key: 'x', note: 65, text:'F' },
      { name: 'F#2', color: 'black', key: 'd', note: 66, text:'' },
      { name: 'G2', color: 'white', key: 'c', note: 67, text:'G' },
      { name: 'G#2', color: 'black', key: 'f', note: 68, text:'' },
      { name: 'A3', color: 'white', key: 'v', note: 69, text:'A' },
      { name: 'A#3', color: 'black', key: 'g', note: 70, text:'' },
      { name: 'B3', color: 'white', key: 'b', note: 71, text:'B' },
      { name: 'C4', color: 'white', key: 'n', note: 72, text:'C' },
    ];

    const keyboard = document.createElement('div');
    keyboard.style.cssText = `
      position: relative;
      height: 180px;
      margin: 0px 0px;
      width: 980px;
      background: #f0f0f0;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;

    const startEndIndicator = document.createElement('div');
    const y = 15;
    startEndIndicator.style.cssText = `
      position: absolute;
      top: ${y}px;
      left: 0px;
      margin-left: 0px;
      margin-top: 0px;
      border-radius: 0px;
      width: 10px;
      height: 5px;
      background: rgba(255, 32, 0, 0.5);
      box-shadow: 0 0 3px rgba(255, 32, 0, 0.5);
      z-index: 10;
    `;
     startEndIndicator.id = 'startEndIndicator';
     keyboard.appendChild(startEndIndicator);

    kbNotes.filter(n => n.color === 'white').forEach((note, index) => {
      const key = document.createElement('div');
      key.className = 'piano-key white';
      key.dataset.note = note.name;
      key.textContent = `${note.text}`;
      key.down = false;

      key.style.cssText = `
        position: absolute;
        left: ${index * 60}px;
        width: 58px;
        height: 180px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 0 0 5px 5px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding-bottom: 10px;
        font-size: 20px;
        white-space: pre-wrap;
        font-family: monospace;
        font-weight: bold;
        line-height: 1.4;
        text-align: center;
        user-select: none;
        transition: background 0.1s, transform 0.1s;
      `;

      key.addEventListener('mousedown', () => this.onKeyDown(note));
      key.addEventListener('mouseup', () => this.onKeyUp(note));
      key.addEventListener('mouseleave', () => {
        this.onKeyUp(note);
      });

      key.addEventListener('touchstart', (e) => {
          e.preventDefault();
        this.onKeyDown(note);
      });

      key.addEventListener('touchend', (e) => {
          e.preventDefault();
        this.onKeyUp(note);
      });

      keyboard.appendChild(key);
    });

    kbNotes.filter(n => n.color === 'black').forEach((note) => {
      var whiteKeyIndex = kbNotes.findIndex(nn =>
        nn.color === 'white' &&
        this.getNoteIndex(nn.name) === (this.getNoteIndex(note.name) - 1)
      );
      const blackCnt = this.blackKeysBeforeWhite(whiteKeyIndex, kbNotes);
      whiteKeyIndex -= blackCnt;

      const key = document.createElement('div');
      key.className = 'piano-key black';
      key.dataset.note = note.name;
      key.textContent = `${note.text}`;

      key.style.cssText = `
        position: absolute;
        left: ${whiteKeyIndex * 60 + 40}px;
        width: 36px;
        height: 115px;
        background: #333;
        color: white;
        border-radius: 0 0 3px 3px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding-bottom: 10px;
        font-size: 20px;
        white-space: pre-wrap;
        font-family: monospace;
        font-weight: bold;
        line-height: 1.4;
        text-align: center;
        user-select: none;
        z-index: 10;
        transition: background 0.1s, transform 0.1s;
      `;

      key.addEventListener('mousedown', () => this.onKeyDown(note));
      key.addEventListener('mouseup', () => this.onKeyUp(note));
      key.addEventListener('mouseleave', () => {
          this.onKeyUp(note);
      });

      key.addEventListener('touchstart', (e) => {
          e.preventDefault();
        this.onKeyDown(note);
      });

      key.addEventListener('touchend', (e) => {
          e.preventDefault();
        this.onKeyUp(note);
      });

      keyboard.appendChild(key);
    });

    document.body.appendChild(keyboard);

    document.addEventListener('keydown', (e) => {
      const note = kbNotes.find(n => n.key === e.key);
      if (note && !e.repeat) {
        this.onKeyDown(note);
      }
    });

    document.addEventListener('keyup', (e) => {
      const note = kbNotes.find(n => n.key === e.key);
      if (note) {
        this.onKeyUp(note);
      }
    });
  }

  onPreGenNote(obj) {
      if (obj.preGenIndex < kbNotes.length) {
        const note = kbNotes[obj.preGenIndex].note + shiftValue;
        const freq = obj.midiToFrequency(note);
        obj.generateStringVibration(freq, obj.defDuration);
        const loadingText = document.getElementById('loadingText');
        if (loadingText != null) {
          loadingText.textContent = '已完成' + Math.floor(obj.preGenIndex * 100 / kbNotes.length) + '%';
        }
        obj.preGenIndex ++;
        setTimeout(obj.onPreGenNote, 1, obj);
      } else {
        hideLoading();
      }
  }

  async preGenNotes() {
    const low = shiftValue + kbNotes[0].note;
    const hi = shiftValue + kbNotes[kbNotes.length - 1].note;
    if ((low >= this.preGenedLow) && (hi <= this.preGenedHi)) {
      return;
    }
    if (await AudioManagerAPI.loadAudioRes()) {
      this.preGenedLow = 0;
      this.preGenedHi = 256;
      globalInfoText = '当前为高品质模式';
      globalInfoTextSize = 20;
      this.cleanHistNoteInfo();
      return;
    }
    globalInfoText = '当前为合成模式';
    globalInfoTextSize = 20;
    this.cleanHistNoteInfo();
    if (low < this.preGenedLow) {
      this.preGenedLow = low;
    }
    if (hi > this.preGenedHi) {
      this.preGenedHi = hi;
    }
    this.preGenIndex = 0;
    showLoading('本钢琴音色使用物理建模软件现场合成，\n计算量大，正在合成中，请耐心等待……');
    setTimeout(this.onPreGenNote, 50, this);
  }
}
