// @version V1.0.0.6
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：显示器
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

class SimpleDisplay {
  constructor(containerId, width = 1012, height = 142) {
    this.container = document.getElementById(containerId);
    this.width = width;
    this.height = height;

    this.lineSpacing = 16;
    this.Top = 38;
    this.noteX = 60;
    this.noteRadius = 6;
    this.noteOffset = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

    this.clefFontHeight = 10;
    this.clefIsChanged = true;
    this.gClef = true;
    this.ansNotes = null;

    this.allLinesG = [];
    this.allLinesF = [];

    this.init();
  }

  init() {
    const screen = document.createElement('div');
    screen.style.cssText = `
      width: ${this.width}px;
      height: ${this.height}px;
      background: #2020a0f0;
      border: 2px solid #0066cc;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 0 20px rgba(0, 100, 255, 0.2),
      0 0 15px rgba(0, 100, 255, 0.3);
    `;

    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      box-shadow: inset 0 0 30px rgba(0, 100, 255, 0.15);
    `;

    const Container = document.createElement('div');
    Container.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
    `;

    this.screen = screen;
    this.Container = Container;

    this.draw();

    screen.appendChild(glow);
    screen.appendChild(Container);
    this.container.appendChild(screen);
  }

  draw() {
    const noteArea = document.createElement('div');
    noteArea.style.cssText = `
      width: 40%;
      height: 100%;
      position: relative;
      border-right: 2px solid rgba(0, 100, 255, 0.5);
    `;

    for (let i = -1; i < 5; i++) {
      const line = document.createElement('div');
      const y = this.Top + i * this.lineSpacing;
      line.style.cssText = `
        position: absolute;
        top: ${y}px;
        left: 0;
        margin-left: 10px;
        margin-top: 0px;
        width: 93%;
        height: 2px;
        background: #0080ff;
        box-shadow: 0 0 3px rgba(0, 255, 128, 0.7);
      `;
      line.name = 'line';
      line.id = 'line';
      if (i != -1) {
        this.allLinesG.push(line);
      }
      if (i != 4) {
        this.allLinesF.push(line);
      }
    }

    const color = '#F90';
    const fClefSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fClefSvg.setAttribute('width', '60');
    fClefSvg.setAttribute('height', '100');
    fClefSvg.setAttribute('viewBox', '0 0 60 100');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('fill', 'none');
    path1.setAttribute('stroke', color);
    path1.setAttribute('stroke-width', '3');
    path1.setAttribute('stroke-linecap', 'round');

    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('fill', 'none');
    path2.setAttribute('stroke', color);
    path2.setAttribute('stroke-width', '3');
    path2.setAttribute('stroke-linecap', 'round');

    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('fill', 'none');
    path3.setAttribute('stroke', color);
    path3.setAttribute('stroke-width', '3');
    path3.setAttribute('stroke-linecap', 'round');

    path1.setAttribute('d', 'M12.5,28.75 Q8.75,21.25 16.25,25 Q23.75,28.75 23.75,40 Q23.75,51.25 12.5,66.25');
    path2.setAttribute('d', 'M12.5,28.75 Q12.5,28.75 14.375,25 Q21.875,28.75 21.875,40 Q21.875,51.25 12.5,66.25');
    path3.setAttribute('d', 'M12.5,28.75 Q17,28.75 12.5,25 Q20,28.75 20,40 Q20,51.25 12.5,66.25');

    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '11');
    circle1.setAttribute('cy', '28');
    circle1.setAttribute('r', '5');
    circle1.setAttribute('fill', color);

    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle2.setAttribute('cx', '35');
    circle2.setAttribute('cy', '32');
    circle2.setAttribute('r', '3.5');
    circle2.setAttribute('fill', color);

    const circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle3.setAttribute('cx', '35');
    circle3.setAttribute('cy', '46');
    circle3.setAttribute('r', '3.5');
    circle3.setAttribute('fill', color);

    fClefSvg.appendChild(path1);
    fClefSvg.appendChild(path2);
    fClefSvg.appendChild(path3);
    fClefSvg.appendChild(circle1);
    fClefSvg.appendChild(circle2);
    fClefSvg.appendChild(circle3);

    fClefSvg.style.position = 'relative';
    fClefSvg.style.zIndex = '8';

    this.fClefSvg = fClefSvg;

    const numberArea = document.createElement('div');
    numberArea.style.cssText = `
      width: 40%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: left;
      margin-left: 20px;
      border-right: 2px solid rgba(0, 100, 255, 0.5);
    `;

    const textArea = document.createElement('div');
    textArea.style.cssText = `
      width: 20%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: left;
      margin-left: 20px;
    `;

    this.noteArea = noteArea;
    this.numberArea = numberArea;
    this.textArea = textArea;

    this.Container.appendChild(noteArea);
    this.Container.appendChild(numberArea);
    this.Container.appendChild(textArea);
  }

  isChordMode() {
    if (trainMode.endsWith("chord")) {
      return true;
    }
    if (trainMode.endsWith("interval")) {
      return true;
    }
    return false;
  }

  setClefType(clef = 'G') {
    if (clef == 'G') {
      this.gClef = true;
    } else {
      this.gClef = false;
    }
    this.Top = 38 - (this.gClef ? 0 : this.lineSpacing);
    this.clefIsChanged = true;
  }

  setAnsNotes(ansNotes) {
    this.ansNotes = ansNotes;
  }

  showAnsNotes(midiIndexs, flat = false, skipCnt = 0) {
    for (let i = skipCnt; i < midiIndexs.length; i ++) {
      const midiIndex = midiIndexs[i];
      if (midiIndex <= 0) {
        break;
      }

      const noteOffset = this.noteOffset[midiIndex % 12];
      const pitchName = noteToPitchName(midiIndex, flat);
      const oct = Math.floor((midiIndex - 60) / 12);

      const middleC = this.Top + 1.5 * this.lineSpacing + 1.0 + (this.gClef ? 0 : this.lineSpacing);
      const semitoneOffset = (noteOffset + oct * 7) * (this.lineSpacing / 2);
      let noteY = middleC - semitoneOffset;
      let noteX = this.noteX;

      noteX = noteX + i * 30;

      let noteColor = 0xFFB0B0B0;
      const A = (noteColor >> 24) & 0xFF;
      const R = (noteColor >> 16) & 0xFF;
      const G = (noteColor >> 8) & 0xFF;
      const B = (noteColor >> 0) & 0xFF;

      if (pitchName.startsWith('#') || pitchName.startsWith('b')) {
        if (flat) {
            noteY -= this.lineSpacing / 2;
        }
        const acc = document.createElement('div');
        const symbol = flat ? 'b' : '♯';
        const Y = flat ? noteY - 12 : noteY - 13;
        const X = flat ? noteX - 14 : noteX - 11;
        acc.textContent = symbol;
        acc.style.cssText = `
          position: absolute;
          top: ${Y}px;
          left: ${X}px;
          color: rgba(${R}, ${G}, ${B}, ${A});
          font-size: 18px;
          font-weight: bold;
          text-shadow: 0 0 6px rgba(${R}, ${G}, ${B}, 0.8);
          z-index: 9;
        `;
        this.noteArea.appendChild(acc);
      }

      const note = document.createElement('div');
      note.style.cssText = `
        position: absolute;
        top: ${noteY - this.noteRadius * 0.8}px;
        left: ${noteX}px;
        width: ${this.noteRadius * 2.2}px;
        height: ${this.noteRadius * 1.6}px;
        background: rgba(${R}, ${G}, ${B}, ${A});
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(${R}, ${G}, ${B}, 0.8);
        z-index: 10;
      `;
      this.noteArea.appendChild(note);

      // low add
      for (let i = 0; i < Math.floor((noteY - (this.Top + 4 * this.lineSpacing) + 0.5) / this.lineSpacing); i ++) {
        const y = this.Top + (i + 5) * this.lineSpacing;
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute;
          top: ${y}px;
          left: ${noteX - 10}px;
          width: 30px;
          height: 2px;
          background: #0080ff;
          box-shadow: 0 0 3px rgba(0, 255, 128, 0.7);
        `;
        this.noteArea.appendChild(line);
      }

      // up add
      for (let i = 0; i < Math.floor((this.Top - noteY) / this.lineSpacing + 0.5); i ++) {
        const y = this.Top - (i + 1) * this.lineSpacing;
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute;
          top: ${y}px;
          left: ${noteX - 10}px;
          width: 30px;
          height: 2px;
          background: #0080ff;
          box-shadow: 0 0 3px rgba(0, 255, 128, 0.7);
        `;
        this.noteArea.appendChild(line);
      }
    }
  }

  showNotes(midiIndexs, noteColors, displayText = '', flat = false, skipCnt = 0) {
    this.clearNote();
    let noteNames = '';

    if (this.ansNotes != null) {
      this.showAnsNotes(this.ansNotes, flat, skipCnt);
    }

    for (let i = skipCnt; i < midiIndexs.length; i ++) {
      const midiIndex = midiIndexs[i];
      if (midiIndex <= 0) {
        break;
      }

      const noteOffset = this.noteOffset[midiIndex % 12];
      const pitchName = noteToPitchName(midiIndex, flat);
      const oct = Math.floor((midiIndex - 60) / 12);

      const middleC = this.Top + 1.5 * this.lineSpacing + 1.0 + (this.gClef ? 0 : this.lineSpacing);
      const semitoneOffset = (noteOffset + oct * 7) * (this.lineSpacing / 2);
      let noteY = middleC - semitoneOffset;
      let noteX = this.noteX;

      if (!this.isChordMode()) {
         noteX = noteX + i * 30;
      }

      let noteColor = 0xFFFF9900;
      if ((noteColors != null) && (i < noteColors.length)) {
        noteColor = noteColors[i];
      }
      const A = (noteColor >> 24) & 0xFF;
      const R = (noteColor >> 16) & 0xFF;
      const G = (noteColor >> 8) & 0xFF;
      const B = (noteColor >> 0) & 0xFF;

      if (pitchName.startsWith('#') || pitchName.startsWith('b')) {
        if (flat) {
            noteY -= this.lineSpacing / 2;
        }
        const acc = document.createElement('div');
        const symbol = flat ? 'b' : '♯';
        const Y = flat ? noteY - 12 : noteY - 13;
        const X = flat ? noteX - 14 : noteX - 11;
        acc.textContent = symbol;
        acc.style.cssText = `
          position: absolute;
          top: ${Y}px;
          left: ${X}px;
          color: rgba(${R}, ${G}, ${B}, ${A});
          font-size: 18px;
          font-weight: bold;
          text-shadow: 0 0 6px rgba(${R}, ${G}, ${B}, 0.8);
          z-index: 9;
        `;
        this.noteArea.appendChild(acc);
      }

      noteNames += pitchName;

      const note = document.createElement('div');
      note.style.cssText = `
        position: absolute;
        top: ${noteY - this.noteRadius * 0.8}px;
        left: ${noteX}px;
        width: ${this.noteRadius * 2.2}px;
        height: ${this.noteRadius * 1.6}px;
        background: rgba(${R}, ${G}, ${B}, ${A});
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(${R}, ${G}, ${B}, 0.8);
        z-index: 10;
      `;
      this.noteArea.appendChild(note);

      // low add
      for (let i = 0; i < Math.floor((noteY - (this.Top + 4 * this.lineSpacing) + 0.5) / this.lineSpacing); i ++) {
        const y = this.Top + (i + 5) * this.lineSpacing;
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute;
          top: ${y}px;
          left: ${noteX - 10}px;
          width: 30px;
          height: 2px;
          background: #0080ff;
          box-shadow: 0 0 3px rgba(0, 255, 128, 0.7);
        `;
        this.noteArea.appendChild(line);
      }

      // up add
      for (let i = 0; i < Math.floor((this.Top - noteY) / this.lineSpacing + 0.5); i ++) {
        const y = this.Top - (i + 1) * this.lineSpacing;
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute;
          top: ${y}px;
          left: ${noteX - 10}px;
          width: 30px;
          height: 2px;
          background: #0080ff;
          box-shadow: 0 0 3px rgba(0, 255, 128, 0.7);
        `;
        this.noteArea.appendChild(line);
      }
    }

    this.numberArea.innerHTML = '';
    const num = document.createElement('div');

    num.textContent = noteNames + '\n' + displayText;
    let textFontSize = 36;
    if (num.textContent.length >= 60) {
      textFontSize = 25;
    } else if (num.textContent.length >= 54) {
      textFontSize = 28;
    } else if (num.textContent.length >= 48) {
      textFontSize = 32;
    }
    num.style.cssText = `
      color: #ff9900;
      font-size: ${textFontSize}px;
      white-space: pre-wrap;
      text-align: left !important;
      font-family: monospace;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(255, 153, 0, 0.8);
    `;
    this.numberArea.appendChild(num);

    this.textArea.innerHTML = '';
    const text = document.createElement('div');

    text.textContent = globalInfoText;
    text.style.cssText = `
      color: #ff9900;
      font-size: ${globalInfoTextSize}px;
      white-space: pre-wrap;
      text-align: center;
      font-family: monospace;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(255, 153, 0, 0.8);
      display: block;
      width: 100%;
    `;
    this.textArea.appendChild(text);
  }

  getCharacterRenderHeight(character, fontSize = 16) {
    const span = document.createElement('span');
    span.textContent = character;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.fontSize = fontSize + 'px';
    span.style.fontFamily = 'inherit';
    span.style.whiteSpace = 'nowrap';
    span.style.display = 'inline-block';
    document.body.appendChild(span);
    const height = span.offsetHeight;
    document.body.removeChild(span);
    return height;
  }

  clearNote() {
    const lines = this.gClef ? this.allLinesG : this.allLinesF;
    const fontSize = 50;
    this.noteArea.innerHTML = '';
    lines.forEach(line => this.noteArea.appendChild(line));

    const clef = document.createElement('div');
    const symbol = this.gClef ? '𝄞' : '𝄢';
    if (this.clefIsChanged) {
      this.clefFontHeight = this.getCharacterRenderHeight(symbol, fontSize);
      this.clefIsChanged = false;
    }
    const Y = this.Top + (this.gClef ? (this.lineSpacing * 3 - this.clefFontHeight * 0.63)
        : (this.lineSpacing * 1 - this.clefFontHeight * 0.5));
    const X = this.noteX - 53;
    clef.textContent = symbol;

    let noteColor = 0xFFFF9900;
    const A = (noteColor >> 24) & 0xFF;
    const R = (noteColor >> 16) & 0xFF;
    const G = (noteColor >> 8) & 0xFF;
    const B = (noteColor >> 0) & 0xFF;

    clef.style.cssText = `
        position: absolute;
        top: ${Y}px;
        left: ${X}px;
        color: rgba(${R}, ${G}, ${B}, ${A});
        font-size: ${fontSize}px;
        font-weight: bold;
        text-shadow: 0 0 6px rgba(${R}, ${G}, ${B}, 0.8);
        z-index: 8;
      `;
    this.noteArea.appendChild(this.gClef ? clef : this.fClefSvg);
  }
}

window.createDisplay = function(containerId, width = 400, height = 90) {
  return new SimpleDisplay(containerId, width, height);
};

window.initDisplay = function() {
  const container = document.getElementById('Displayer');
  if (container) {
    window.Display = new SimpleDisplay('Displayer');
  }
};

document.addEventListener('ceAllJsLoadDoneEvent', window.initDisplay);
