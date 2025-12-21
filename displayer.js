// @version V1.0.0.1
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：显示器
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

class SimpleDisplay {
  constructor(containerId, width = 1012, height = 123) {
    this.container = document.getElementById(containerId);
    this.width = width;
    this.height = height;

    this.lineSpacing = 14;
    this.Top = 32;
    this.noteX = 30;
    this.noteRadius = 5;
    this.noteOffset = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

    this.init();
  }

  init() {
    const screen = document.createElement('div');
    screen.style.cssText = `
      width: ${this.width}px;
      height: ${this.height}px;
      background: #2020a080;
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
      border-right: 1px solid rgba(0, 100, 255, 0.5);
    `;

    for (let i = 0; i < 5; i++) {
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
       noteArea.appendChild(line);
    }

    const numberArea = document.createElement('div');
    numberArea.style.cssText = `
      width: 40%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: left;
      margin-left: 20px;
      border-right: 1px solid rgba(0, 100, 255, 0.5);
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

  showNotes(midiIndexs, noteColors, displayText = '', flat = false, skipCnt = 0) {
    this.clearNote();
    var noteNames = '';

    for (let i = skipCnt; i < midiIndexs.length; i ++) {
      const midiIndex = midiIndexs[i];
      if (midiIndex <= 0) {
        break;
      }

      const noteOffset = this.noteOffset[midiIndex % 12];
      const pitchName = noteToPitchName(midiIndex, flat);
      const oct = Math.floor((midiIndex - 60) / 12);

      const middleC = this.Top + 1.5 * this.lineSpacing + 1.0;
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
        const Y = flat ? noteY - 14 : noteY - 13;
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
    num.style.cssText = `
      color: #ff9900;
      font-size: 28px;
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

  clearNote() {
    const children = this.noteArea.children;
    const lines = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      //if (child.style.background === 'rgb(0, 255, 128)') {
      if (child.name === 'line') {
        lines.push(child);
      }
    }

    this.noteArea.innerHTML = '';
    lines.forEach(line => this.noteArea.appendChild(line));
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
