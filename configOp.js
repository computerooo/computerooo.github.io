// @version V1.0.0.3
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：配置参数
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

var lastKey = -1;
var needCleanHist = false;
var correctAnsCnt = 0;
var curAnsCnt = 0;
const testTimes = 10;
var globalInfoText = '';
var globalInfoTextSize = 30;

const triadChords = ['', 'm', 'm', '', '', 'm', 'dim'];
const seventhChords = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
const ninthChords = ['maj9', 'm9', 'm7b9', 'maj9', '9', 'm9', 'm7b5b9'];
const chordDegNames = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function getChordFuncName(sing, nNotes) {
  if (trainMode.endsWith('block_chord')) {
    nNotes -= 1;
  }
  if (nNotes == 3) {
    return triadChords[sing - 1];
  } else if (nNotes == 4) {
    return seventhChords[sing - 1];
  } else if (nNotes == 5) {
    return ninthChords[sing - 1];
  } else {
    return 'unknow';
  }
}

function getChordDegName(sing) {
  return chordDegNames[sing - 1];
}

function getChordName(note) {
  const sing = noteToSingName(note).replaceAll(' ', '');
  const pitch = noteToPitchName(note, isFlatKey).replaceAll(' ', '');
  const funcName = getChordFuncName(parseInt(sing), noteSeqs.length - piano.skipAnsCnt);
  return pitch + funcName + '\n' + getChordDegName(sing) + funcName;
}

let lastPlay002Time = 0;
async function playTipsThis() {
  let ret = false;
  let need = false;

  if (trainTimes > 1 && curTimes < trainTimes) {
    let range = 2;
    if (trainMode.endsWith("block_chord")) {
      range = 4;
    } else if (trainMode.endsWith("interval")) {
      range = 3;
    }
    if (Math.floor(Math.random() * range) == 0) {
      need = true;
    }
  }

  if (trainMode.endsWith("interval") || trainMode.endsWith("block_chord")) {
    need = need && (playInterval >= 500) && (trainTimes + ansTimes >= 3);
  } else {
    need = need && (seqLen >= 3) && (playInterval >= 300) && (trainTimes + ansTimes >= 3);
  }

  if (need == true) {
    let id = 'voice_000';
    if (!trainMode.endsWith("block_chord")) {
      if (noteToSingName(noteSeqs[0]) === ' 6 ') {
        if (Math.floor(Math.random() * 10) < 7) {
          id = 'voice_600';
        }
      }
    }
    if ((Date.now() - lastPlay002Time > 1000 * 60 * 5) && (Math.floor(Math.random() * 20) == 0)) {
      id = 'voice_002';
      lastPlay002Time = Date.now();
    }
    const cnt = await AudioManagerAPI.getAudioSegmentCnt(id);
    if (cnt > 0) {
      ret = await AudioManagerAPI.playAudioSegment(id, Math.floor(Math.random() * cnt));
    }
  }

  if (ret) {
    playTimerId = setTimeout(onAutoPlay, ret.playTime);
  } else {
    playTimerId = setTimeout(onAutoPlay, playInterval);
  }
}

async function playTipsError() {
  await AudioManagerAPI.playAudioSegment('voice_003', 0);
}

async function playTipsNext() {
  let ret = false;

  if (trainMode.endsWith("interval") || trainMode.endsWith("block_chord")) {
    if ((playInterval >= 500) && (trainTimes + ansTimes >= 3)) {
      ret = await AudioManagerAPI.playAudioSegment('voice_001', 0);
    }
  } else {
    if ((seqLen >= 3) && (playInterval >= 300) && (trainTimes + ansTimes >= 3)) {
      ret = await AudioManagerAPI.playAudioSegment('voice_001', 0);
    }
  }

  if (ret) {
    playTimerId = setTimeout(onAutoPlay, ret.playTime);
  } else {
    playTimerId = setTimeout(onAutoPlay, playInterval);
  }
}

function onAutoPlay() {
  if (needCleanHist == true) {
    piano.cleanHistNoteInfo(true);
    needCleanHist = false;
  }
  if (lastKey > 0) {
    note = kbNotes[lastKey - kbNotes[0].note];
    piano.onKeyUp(note, false);
    lastKey = -1;
  }
  if (noteIndex < noteSeqs.length) {
    lastKey = noteSeqs[noteIndex];
    if ((lastKey < kbNotes[0].note) || (lastKey > kbNotes[kbNotes.length - 1]) ) {
      lastKey = -1;
      return;
    }
    note = kbNotes[lastKey - kbNotes[0].note];

    if ((noteIndex == (refNote == -2 ? 0 : 1)) && trainMode.endsWith("chord") && trainMode.startsWith("Train")) {
      if ((curTimes >= trainTimes) && ((noteSeqs.length - piano.skipAnsCnt) >= 3)) {
        globalInfoText = getChordName(noteSeqs[piano.skipAnsCnt]);
        globalInfoTextSize = 30;
      }
    }

    if (trainMode.endsWith("interval") || trainMode.endsWith("block_chord")) {
      if (refNote == -2) {
        noteIndex ++;
      }
      if (noteIndex == 0) {
        if (!trainMode.startsWith("Test")) {
          needCleanHist = true;
        }
        piano.onKeyDown(note, curTimes >= trainTimes, false);
      } else {
        for (let i = 0; i < noteSeqs.length; i ++) {
          note = kbNotes[noteSeqs[i] - kbNotes[0].note];
          if (i == 0) {
          } else {
            piano.onKeyDown(note, curTimes >= trainTimes, false);
          }
          noteIndex = noteSeqs.length - 1;
        }
      }
    } else {
      piano.onKeyDown(note, curTimes >= trainTimes, false);
    }
    noteIndex ++;
  } else {
    if ((trainMode.startsWith("Test")) && (noteIndex >= noteSeqs.length)) {
      playTimerId = setTimeout(onAutoPlay, playInterval);
      noteIndex ++;
      if (noteIndex >= (noteSeqs.length + 1)) {
        for (let i = 0; i < noteSeqs.length; i ++) {
          note = kbNotes[noteSeqs[i] - kbNotes[0].note];
          piano.onKeyUp(note, false);
        }
      }
      if (noteIndex >= (noteSeqs.length + 2)) {
        noteIndex = 0;
      }
      return;
    }
    globalInfoText = "";
    piano.cleanHistNoteInfo(true);
    if ((noteIndex == noteSeqs.length) && (seqLen > 1)) {
      noteIndex ++;
      playTipsThis();
      return;
    } else {
      noteIndex = 0;
      curTimes ++;
      if (curTimes >= (trainTimes + ansTimes)) {
        curTimes = 0;
        noteSeqs = genNoteSeqs();
        playTipsNext();
        return;
      }
    }
  }

  playTimerId = setTimeout(onAutoPlay, playInterval);
}

function simStopEvent() {
  showAnsEndInfo();
  const event = new Event('click', {bubbles: true, cancelable: true});
  event.simulated = true;
  const element = document.querySelector(`[name="START_STOP"]`);
  if (element != null) {
    element.dispatchEvent(event);
  }
}

function onTestNext(isCorrect) {
  piano.allKeysUp();
  curAnsCnt ++;
  if (isCorrect) {
    correctAnsCnt ++;
  }
  clearTimeout(playTimerId);
  noteIndex = 0;
  curTimes ++;
  noteSeqs = genNoteSeqs();
  piano.setAnsNotes(noteSeqs);
  if (curAnsCnt < testTimes) {
    globalInfoText = "共答对" + correctAnsCnt + "题\n已完成" + curAnsCnt + "题，共" + testTimes + '题';
    globalInfoTextSize = 20;
    playTimerId = setTimeout(onAutoPlay, 600);
  } else {
    playTimerId = -1;
    setTimeout(simStopEvent, 600);
  }
  needCleanHist = true;
}

function showAnsEndInfo() {
  var info;
  var ratio = correctAnsCnt / testTimes;

  if (ratio >= 0.999999999) {
    info =  '你太棒了！全对！';
  } else if (ratio >= 0.78) {
    info =  '你已经很优秀了！';
  } else if (ratio >= 0.6) {
    info =  '你已经及格啦！';
  } else if (ratio >= 0.4) {
    info =  '需要再努力一把！';
  } else if (ratio >= 0.2) {
    info =  '请继续加油哟！';
  } else {
    info =  '别灰心你行的！';
  }

  globalInfoText = "共答对" + correctAnsCnt + "题\n" + info;
  globalInfoTextSize = 20;
}

var kbNotes = null;
var piano = null;
var playTimerId = -1;
var noteSeqs = null;
var noteIndex = 0;
var trainMode = 'Test';

var lowSelValue = -1;
var hiSelValue = -1;
var refSelValue = -1;
var shiftValue = 0;

var lowestNote;
var lowestName;
var hiestNote;
var hiestName;

var playInterval = 550;

var trainTimes = 3;
var ansTimes = 2;
var curTimes = 0;

var allOptNames;
var allOptNotes;

var refNote = -1;
var startNote = 65;
var endNote = 72;
var mainNote = 0;
var isFlatKey = false;
var seqLen = 3;

const majSeq = [0, 2, 4, 5, 7, 9, 11];

var mySeed = null;

function myRandom() {
  if (mySeed == null) {
    mySeed = Math.random();
  }
  let a = 1664525;
  let c = 1013904223;
  let m = Math.pow(2, 32);
  mySeed = (a * mySeed + c) % m;
  return (mySeed / m + Math.random()) / 2;
}

function genOneNote() {
  var note = Math.floor(Math.random()  * (endNote - startNote) + 0.5) + startNote;
  const res = (note + 12 - mainNote) % 12;
  var j;

  for (j = 0; j < majSeq.length; j ++) {
    if (majSeq[j] == res) {
      break;
    }
  }

  if (j >= majSeq.length) {
    if (note == endNote) {
      note -= 1;
    } else if (note == startNote) {
      note += 1;
    } else {
      if (Math.random()  >= 0.5) {
        note += 1;
      } else {
        note -= 1;
      }
    }
  }

  return note;
}

function getNextNoteOfChord(curNote) {
  let name = noteToSingName(curNote, isFlatKey);
  let next = curNote + 4;
  if (name.startsWith('#') || name.startsWith('b')) {
    console.log('error name =' + name);
  } else {
    next = curNote + 1;

    for (let i = 0; i < 2; next ++) {
      name = noteToSingName(next, isFlatKey);
      if (name.startsWith('#') || name.startsWith('b')) {
        continue;
      }
      i ++;
    }
    next --;
  }

  return next;
}

function genChordInt(seq) {
  let startIndex = seq.length - seqLen;
  tryFindDiffNote(seq, startIndex);
  for (let i = startIndex + 1; i < seqLen + startIndex; i ++) {
    seq[i] = getNextNoteOfChord(seq[i - 1]);
  }
}

function genChord() {
  var seq;

  if (trainMode.endsWith("block_chord")) {
    if (refNote >= 0) {
      seq = new Int32Array(seqLen + 1);
      seq[0] = refNote;
    } else if (refNote == -1) {
      seq = new Int32Array(seqLen + 1);
      tryFindDiffNote(seq, 0);
    } else if (refNote == -2) {
      seq = new Int32Array(seqLen + 1);
      tryFindDiffNote(seq, 0);
    }
  } else {
    seq = new Int32Array(seqLen);
  }

  genChordInt(seq);

  return seq;
}

function tryFindDiffNote(seq, index) {
  if (noteSeqs == null) {
    seq[index] = genOneNote();
  } else {
    for (let i = 0; i < 10; i ++) {
      seq[index] = genOneNote();
      if (seq[index] != noteSeqs[index]) {
        break;
      }
    }
  }
}

function genNoteSeqs() {
  let seqLenAct = seqLen;
  noteIndex = 0;

  if (trainMode.endsWith("chord")) {
    return genChord();
  }

  if ((seqLen > 1) && trainMode.endsWith("interval")) {
    seqLenAct = 3;
  }

  const seq = new Int32Array(seqLenAct);

  if ((refNote < 0) || (seqLenAct == 1)) {
    tryFindDiffNote(seq, 0);
  } else {
    seq[0] = refNote;
  }

  for (let i = 1; i < seqLenAct; i ++) {
    if ((i == 1) && (seqLen == 2) && trainMode.endsWith("interval")) {
        seq[1] = seq[0]; // the ref note
        continue;
    }
    seq[i] = genOneNote();
    for (let j = 0; j < 3; j ++) {
      let hasFound = 0;
      for (let k = 0; k < i; k ++) {
        if (seq[i] === seq[k]) {
          hasFound = 1;
          break;
        }
      }
      if (refNote > 0 && noteSeqs != null) {
        if (i == 1 && noteSeqs.length > 1) {
          if (seq[1] == noteSeqs[1]) {
            hasFound = 1;
          }
        }
      }

      if (hasFound != 0) {
        seq[i] = genOneNote();
      } else {
        break;
      }
    }
  }

  return seq;
}

function stopPlay() {
  if (playTimerId != -1) {
    clearTimeout(playTimerId);
    playTimerId = -1;
  }
  if (lastKey > 0) {
    note = kbNotes[lastKey - kbNotes[0].note];
    piano.onKeyUp(note, false);
    lastKey = -1;
  }
  if (trainMode.startsWith("Train")) {
    globalInfoText = "";
  }
  piano.cleanHistNoteInfo(true);
  piano.setAnsNotes(null);
}

function onModeSelClick() {
  trainMode = event.target.value;
  disableUi(false);
  updateSeqLenSel();
  updateRefSel();
}

function calLowest() {
  var note = kbNotes[0].note;
  const res = (note + 12 - mainNote) % 12;
  var rel;
  var j;

  for (j = 0; j < majSeq.length; j ++) {
    if (majSeq[j] >= res) {
      rel = j + 1;
      if (majSeq[j] > res) {
        note += 1;
      }
      break;
    }
  }

  lowestNote = note;
  lowestName = rel;
}

function calHiest() {
  var note = kbNotes[kbNotes.length - 1].note;
  const res = (note + 12 - mainNote) % 12;
  var rel;
  var j;

  for (j = majSeq.length - 1; j >= 0; j --) {
    if (majSeq[j] <= res) {
      rel = j + 1;
      if (majSeq[j] < res) {
        note -= 1;
      }
      break;
    }
  }

  hiestNote = note;
  hiestName = rel;
}

function calAllNotes() {
  var i;
  var cnt = 1;
  var name = lowestName;
  var group = 0;

  for (i = lowestNote + 1; i <= hiestNote; i ++) {
    if (name != 3 && name != 7) {
      i ++;
    }
    name ++;
    name = (name - 1) % 7 + 1;
    cnt ++;
  }


  name = lowestName;
  allOptNames = new Array(cnt);
  for (i = 0; i < cnt; i ++) {
    if (group == 0) {
      allOptNames[i] = '低音' + name;
    } else if (group == 1) {
      allOptNames[i] = '中音' + name;
    } else if (group == 2) {
      allOptNames[i] = '高音' + name;
    } else if (group == 3) {
      allOptNames[i] = '超高' + name;
    }
    name ++;
    if (name == 8) {
      group ++;
      name = 1;
    }
  }

  cnt = 0;
  name = lowestName;
  allOptNotes = new Array(cnt);
  for (i = lowestNote; i <= hiestNote; i ++) {
    allOptNotes[cnt] = i;
    if (name != 3 && name != 7) {
      i ++;
    }
    name ++;
    name = (name - 1) % 7 + 1;
    cnt ++;
  }

}

function updateLowSel() {
  let i;
  let hiKeepCnt = getHiKeepCnt() + 1;
  const selectElement = document.querySelector('[name="lowSelect"]');
  const lastIndex = selectElement.selectedIndex;
  selectElement.innerHTML = '';
  for (i = 0; i < allOptNames.length - hiKeepCnt; i ++) {
    const optionElement = document.createElement('option');
    optionElement.value = i;
    optionElement.textContent = allOptNames[i];
    selectElement.appendChild(optionElement);
  }

  if (lastIndex < selectElement.options.length) {
    selectElement.selectedIndex = lastIndex;
  } else {
    selectElement.selectedIndex = selectElement.options.length * 1 / 3;
  }
  lowSelValue = parseInt(selectElement.value, 10);
}

function updateSeqLenSel() {
  const seqLenOpts = [
    '单音', '双音', '三音', '四音', '五音',
  ];
  let start = 0;
  let end = seqLenOpts.length;
  if (trainMode.endsWith('interval')) {
    start = 1;
	end = 3;
  } else if (trainMode.endsWith('chord')) {
    start = 2;
  }
  const selectElement = document.querySelector('[name="seqLenSelect"]');
  let lastIndex = selectElement.selectedIndex;
  selectElement.innerHTML = '';
  for (let i = start; i < end; i ++) {
    const optionElement = document.createElement('option');
    optionElement.value = i + 1;
    optionElement.textContent = seqLenOpts[i];
    selectElement.appendChild(optionElement);
  }
  if (lastIndex > end - start) {
    lastIndex = end - start - 1;
  }
  selectElement.selectedIndex = lastIndex;
}

function updateRefSel() {
  const selectElement = document.querySelector('[name="refSelect"]');
  let lastIndex = selectElement.selectedIndex;
  selectElement.innerHTML = '';

  for (let i = lowSelValue; i <= hiSelValue; i ++) {
    if (i < 0) {
      break;
    }
    const optionElement = document.createElement('option');
    optionElement.value = i;
    optionElement.textContent = allOptNames[i];
    selectElement.appendChild(optionElement);
  }
  var optionElement = document.createElement('option');
  optionElement.value = -1;
  optionElement.textContent = "随机";
  selectElement.appendChild(optionElement);

  optionElement = document.createElement('option');
  optionElement.value = -2;
  optionElement.textContent = "无";
  selectElement.appendChild(optionElement);

  if (trainMode.endsWith('broken_chord')) {
    lastIndex = selectElement.options.length - 1;
  }
  if (lastIndex < selectElement.options.length) {
    selectElement.selectedIndex = lastIndex;
  } else {
    selectElement.selectedIndex = selectElement.options.length * 1 / 3;
  }

  refSelValue = parseInt(selectElement.value, 10);
}

function getHiKeepCnt() {
  let hiKeep = 0;
  if (trainMode.endsWith('chord')) {
    hiKeep = (seqLen - 1) * 2;
  }
  return hiKeep;
}

function updateHiSel() {
  let i;
  let hiKeepCnt = getHiKeepCnt();
  const selectElement = document.querySelector('[name="hiSelect"]');
  const lastIndex = selectElement.selectedIndex;
  const lastVal = selectElement.value;
  selectElement.innerHTML = '';

  for (i = lowSelValue + 1; i < allOptNames.length - hiKeepCnt; i ++) {
    const optionElement = document.createElement('option');
    optionElement.value = i;
    optionElement.textContent = allOptNames[i];
    selectElement.appendChild(optionElement);
  }

  if (lastIndex < selectElement.options.length) {
    selectElement.selectedIndex = lastIndex;
  } else {
    selectElement.selectedIndex = selectElement.options.length * 1 / 3;
  }

  hiSelValue = parseInt(selectElement.value, 10);

  updateRefSel();

  updateStartEndIndicator();
}

const pitchNames = [" C ", "#C ", " D ", "#D ", " E ", " F ", "#F ", " G ", "#G ", " A ", "#A ", " B "];
const pitchNamesFlat = [" C ", "bD ", " D ", "bE ", " E ", " F ", "bG ", " G ", "bA ", " A ", "bB ", " B "];

function noteToPitchName(note, flat) {
  const index = note % 12;
  return flat ? pitchNamesFlat[index] : pitchNames[index];
}

const singNames = [" 1 ", "#1 ", " 2 ", "#2 ", " 3 ", " 4 ", "#4 ", " 5 ", "#5 ", " 6 ", "#6 ", " 7 "];
const singNamesFlat = [" 1 ", "b2 ", " 2 ", "b3 ", " 3 ", " 4 ", "b5 ", " 5 ", "b6 ", " 6 ", "b7 ", " 7 "];

function noteToSingName(note, flat) {
    const res = (note + 12 - mainNote) % 12;
    return name = flat ? singNamesFlat[res] : singNames[res];
  }

function updateKbNoteNames() {
  for (let i = 0; i < kbNotes.length; i ++) {
    const note = kbNotes[i];
    const keyElement = document.querySelector(`[data-note="${note.name}"]`);
    if (keyElement != null) {
      const singName = noteToSingName(note.note, isFlatKey);
      const pitchName = noteToPitchName(note.note, isFlatKey);
      const nStr = (note.color == 'white') ? '' + (Math.floor((note.note + shiftValue) / 12) - 1) : '';
      keyElement.textContent = pitchName.replaceAll(' ', '') + nStr + '\n' + singName.replaceAll(' ', '');
      if (note.note + shiftValue == 60) {
        keyElement.style.color = '#00ff00';
      } else if (note.note + shiftValue == 69) {
        keyElement.style.color = '#ff0000';
      } else if (note.color == 'white') {
        keyElement.style.color = 'black';
      } else if (note.color == 'black') {
        keyElement.style.color = 'white';
      }
    }
  }
}

function onKeySelClick() {
  mainNote = parseInt(event.target.value, 10);
  if (event.target.options[event.target.selectedIndex].text.startsWith('b')) {
    isFlatKey = true;
  } else if (event.target.options[event.target.selectedIndex].text.startsWith('F')) {
    isFlatKey = true;
  } else {
    isFlatKey = false;
  }
  calLowest();
  calHiest();
  calAllNotes();
  updateLowSel();
  updateHiSel();
  updateKbNoteNames();
}

function onSeqLenSelClick() {
  seqLen = parseInt(event.target.value, 10);
  if (trainMode.endsWith("interval")) {
    if (seqLen < 2) {
      seqLen = 2;
      event.target.value = '2';
    } else if (seqLen > 3) {
      seqLen = 3;
      event.target.value = '3';
    }
  }
  updateLowSel();
  updateHiSel();
}

function onRefSelClick() {
  refSelValue = parseInt(event.target.value, 10);
}

let userDefSpeed = 120;
async function onSpeedSelClick() {
  playInterval = parseInt(event.target.value, 10);
  if (playInterval < 0) {
    if (!event.simulated) {
      let speed = await customPrompt('请输入速度(拍每分):', '' + userDefSpeed);
      if (speed >= 30 && speed <= 600) {
        userDefSpeed = speed;
	  } else if (speed < 30) {
        userDefSpeed = 30;
      } else if (speed > 600) {
        userDefSpeed = 600;
      }
    }
    playInterval = 60000 / userDefSpeed;
    console.log('speed = ' + userDefSpeed + ', playInterval = ' + playInterval);
    globalInfoText = "当前速度为\n" + userDefSpeed + '拍每分';
    piano.cleanHistNoteInfo(true);
  }
}

function updateStartEndIndicator() {
  if (typeof lowSelValue !== 'number' || typeof hiSelValue !== 'number') {
    return;
  }
  if (lowSelValue < 0 || hiSelValue < 0) {
    return;
  }
  if (isNaN(lowSelValue) || isNaN(hiSelValue)) {
    return;
  }
  const startEndIndicator = document.querySelector(`[id='startEndIndicator']`);
  if (startEndIndicator != null) {
    const startNote = allOptNotes[lowSelValue];
    const endNote = allOptNotes[hiSelValue];
    var note = kbNotes[startNote - kbNotes[0].note];
    var keyElement = document.querySelector(`[data-note="${note.name}"]`);
    startEndIndicator.style.left = keyElement.style.left;
    note = kbNotes[endNote - kbNotes[0].note];
    keyElement = document.querySelector(`[data-note="${note.name}"]`);
    startEndIndicator.style.width = (parseFloat(keyElement.style.left)
        + parseFloat(keyElement.style.width)
        - parseFloat(startEndIndicator.style.left)) + 'px';
  }
}

function onLowSelClick() {
  lowSelValue = parseInt(event.target.value, 10);
  updateHiSel();
}

function onHiSelClick() {
  hiSelValue = parseInt(event.target.value, 10);
  updateRefSel();
  updateStartEndIndicator();
}

function onTrainTimesSelClick() {
  trainTimes = parseInt(event.target.value, 10);
}

function onAnsTimesSelClick() {
  ansTimes = parseInt(event.target.value, 10);
}

function onShiftSelClick() {
  shiftValue = parseInt(event.target.value, 10) * 12;
  updateKbNoteNames();
  piano.preGenNotes();
}

function calcRefNote() {
  if (refSelValue < 0) {
    refNote = refSelValue;
  } else {
    refNote = allOptNotes[refSelValue];
  }
}

function onStartStoplick() {
  if (event.target.innerHTML === '开始') {
    const selectElement = document.querySelector(`[name="seqLenSelect"]`);
    if (selectElement != null) {
      seqLen = parseInt(selectElement.value);
    }
    disableUi(true);
    globalInfoText = "";
    saveAllConfigs();
    event.target.innerHTML = '停止';
    startNote = allOptNotes[lowSelValue];
    endNote = allOptNotes[hiSelValue];
    calcRefNote();
    noteSeqs = genNoteSeqs();
    if (trainMode.startsWith("Test")) {
      correctAnsCnt = 0;
      curAnsCnt = 0;
      piano.setAnsNotes(noteSeqs);
    }
    curTimes = 0;
    piano.cleanHistNoteInfo(true);
    playTimerId = setTimeout(onAutoPlay, 100);
  } else {
    event.target.innerHTML = '开始';
    stopPlay();
    disableUi(false);
  }
}

const configPairs = [
  {key:'userDefSpeed', def:'120'},
  {key:"modeSelect", def:'Train_single'},
  {key:'keySelect', def:'0'},
  {key:'seqLenSelect', def:'3'},
  {key:'lowSelect', def:'4'},
  {key:'hiSelect', def:'7'},
  {key:'refSelect', def:'7'},
  {key:'speedSelect', def:'545'},
  {key:'trainTimesSelect', def:'3'},
  {key:'ansTimesSelect', def:'2'},
  {key:'shiftSelect', def:'+1'},
];

function loadAllConfigs() {
  const event = new Event('change', {bubbles: true, cancelable: true});

  event.simulated = true;
  for (let i = 0; i < configPairs.length; i ++) {
    const key = configPairs[i].key;
    const cfg = loadConfigFromLocal(key, configPairs[i].def);
    const selectElement = document.querySelector(`[name="${key}"]`);
    if (selectElement != null) {
      selectElement.value = cfg;
      selectElement.dispatchEvent(event);
    }
    if (key === 'userDefSpeed') {
      userDefSpeed = parseInt(cfg);
    }
  }
}

function saveAllConfigs() {
  for (let i = 0; i < configPairs.length; i ++) {
    const key = configPairs[i].key;
    const selectElement = document.querySelector(`[name="${key}"]`);
    if (selectElement != null) {
      saveConfigToLocal(key, '' + selectElement.value);
    }
    if (key === 'userDefSpeed') {
      saveConfigToLocal(key, '' + userDefSpeed);
    }
  }
}

function saveConfigToLocal(key, config) {
  try {
    localStorage.setItem(key, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('保存失败:', e);
    return false;
  }
}

function loadConfigFromLocal(key, defaultValue = {}) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('读取失败:', e);
    return defaultValue;
  }
}

function removeConfigFromLocal(key) {
  localStorage.removeItem(key);
}

const needDisableUis = [
  {key:"modeSelect"},
  {key:'keySelect'},
  {key:'seqLenSelect'},
  {key:'lowSelect'},
  {key:'hiSelect'},
  {key:'refSelect'},
  // {key:'speedSelect'},
  {key:'trainTimesSelect'},
  {key:'ansTimesSelect'},
  // {key:'shiftSelect'},
];

function disableUi(disabledReq) {
  for (let i = 0; i < needDisableUis.length; i ++) {
    const key = needDisableUis[i].key;
    let disabled = disabledReq;
    if (trainMode.endsWith("broken_chord")) {
      if (key === 'refSelect') {
        disabled = true;
      }
    }
    if (trainMode.startsWith("Test")) {
      if ((key === 'trainTimesSelect') || (key === 'ansTimesSelect')) {
        disabled = true;
      }
    }
    if (trainMode.startsWith("Train")) {
      if ((key === 'trainTimesSelect') || (key === 'ansTimesSelect')) {
        disabled = false;
      }
    }
    const selectElement = document.querySelector(`[name="${key}"]`);
    if (selectElement != null) {
      selectElement.disabled = disabled;
    }
  }
}
