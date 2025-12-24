// @version V1.0.0.3
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：配置界面
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

function configUiLoad() {
  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0px;
      background: #e0e0f0;
      min-height: 100vh;
    }

    .piano-key.white:active {
      background: #e0e0e0 !important;
      transform: translateY(3px) !important;
    }

    .piano-key.black:active {
      background: #555 !important;
      transform: translateY(3px) !important;
    }

    h1 {
      text-align: center;
      color: white;
      margin-bottom: 30px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .buttons {
      display: block;
      width: 100%;
      height: 100%;
      white-space: nowrap;
      color: #ffff00;
      background:#000000;
      font-size: 48px;
      text-align: center;
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 0%;
    }

    .selects {
      width: 100%;
      height: 100%;
      white-space: nowrap;
      font-size: 30px;
      text-align: center;
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 0;
    }

    .headers {
      width: 100%;
      height: 100%;
      white-space: nowrap;
      font-size: 25px;
      text-align: center;
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 0;
    }

    tr, th {
      border: 0px solid blue;
    }

    td {
      border: 0px solid blue;
      text-align: center;
      padding-left: 0px;
      padding-right: 0px;
    }
  `;
  document.head.appendChild(style);

  const info = document.createElement('div');
  info.innerHTML = `
    <h3>🎹钢琴练耳神器（作者：<a href="https://space.bilibili.com/565718633">电脑圈圈</a>  Ⓒ版权所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负）</h3>
  `;
  document.body.appendChild(info);

  const htmls = document.createElement('div');
  htmls.innerHTML = `
  <table>
    <tr class="headers">
      <td>模式</td><td>音阶</td><td>音组</td><td>最低音</td><td>最高音</td><td>参考音</td>
      <td>速度</td><td>听音</td><td>答案</td><td>八度</td>
      <td rowspan='2'>
        <button onclick="onStartStoplick()" name="START_STOP" id="START_STOP" value="" class="buttons">开始</button>
      </td>
    </tr>

    <tr class="selects">
      <td>
        <select class="selects" name="modeSelect" onchange="onModeSelClick()">
        <option value="Train_single">单音练习</option>
        <option value="Train_interval">音程练习</option>
        <option value="Train_broken_chord">分解练习</option>
        <option value="Train_block_chord">柱式练习</option>
        <option value="Test_single">单音考试</option>
        <option value="Test_interval">音程考试</option>
        <option value="Test_broken_chord">分解考试</option>
        <option value="Test_block_chord">柱式考试</option>
        </select>
      </td>

      <td>
        <select class="selects" name="keySelect" onchange="onKeySelClick()">
        <option value='0' >C调</option>
        <option value='7'>G调</option>
        <option value='5'>F调</option>
        <option value='2'>D调</option>
        <option value='10'>bB调</option>
        <option value='9'>A调</option>
        <option value='3'>bE调</option>
        <option value='4'>E调</option>
        <option value='8'>bA调</option>
        <option value='5'>B调</option>
        <option value='1'>bD调</option>
        <option value='1'>#C调</option>
        <option value='6'>bG调</option>
        <option value='6'>#F调</option>
        </select>
      </td>

      <td>
        <select class="selects" name="seqLenSelect" onchange="onSeqLenSelClick()">
        <option value='1'>单音</option>
        <option value='2'>双音</option>
        <option value='3'>三音</option>
        <option value='4'>四音</option>
        <option value='5'>五音</option>
        </select>
      </td>

      <td>
        <select class="selects" name="lowSelect" onchange="onLowSelClick()">
        </select>
      </td>

      <td>
        <select class="selects" name="hiSelect" onchange="onHiSelClick()">
        </select>
      </td>

      <td>
        <select class="selects" name="refSelect" onchange="onRefSelClick()">
        </select>
      </td>

      <td>
        <select class="selects" name="speedSelect" onchange="onSpeedSelClick()">
        <option value='1000'>60</option>
        <option value='800'>75</option>
        <option value='666'>90</option>
        <option value='545'>110</option>
        <option value='333'>180</option>
        <option value='222'>270</option>
        <option value='181'>330</option>
        <option value='-1'>自定义</option>
        </select>
      </td>

      <td>
        <select class="selects" name="trainTimesSelect" onchange="onTrainTimesSelClick()">
        <option value='0'>0次 </option>
        <option value='1'>1次</option>
        <option value='2'>2次</option>
        <option value='3'>3次</option>
        <option value='4'>4次</option>
        <option value='5'>5次</option>
        </select>
      </td>

      <td>
        <select class="selects" name="ansTimesSelect" onchange="onAnsTimesSelClick()">
        <option value='1'>1次</option>
        <option value='2'>2次</option>
        <option value='3'>3次</option>
        <option value='4'>4次</option>
        <option value='5'>5次</option>
        </select>
      </td>

      <td>
        <select class="selects" name="shiftSelect" onchange="onShiftSelClick()">
        <option value='-2'>-2</option>
        <option value='-1'>-1</option>
        <option value='0'>0</option>
        <option value='+1'>+1</option>
        <option value='+2'>+2</option>
        <option value='+3'>+3</option>
        </select>
      </td>
    </tr>
  </table>
  <div id="Displayer" class="container"></div>
  `;
  document.body.appendChild(htmls);

  piano = new PianoSynth();
  piano.createKeyboard();

  setTimeout(loadAllConfigs, 10);
}

function customPrompt(message, defaultValue) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9999;';
  const dialog = document.createElement('div');
  dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.2);min-width:300px;z-index:10000;';

  const msg = document.createElement('div');
  msg.textContent = message || '请输入速度(拍每分):';
  msg.style.marginBottom = '10px';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = defaultValue || '';
  input.style.cssText = 'width:100%;padding:8px;margin-bottom:15px;box-sizing:border-box;';

  const buttons = document.createElement('div');
  buttons.style.cssText = 'text-align:right;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.cssText = 'margin-right:10px;padding:6px 12px;cursor:pointer;';

  const okBtn = document.createElement('button');
  okBtn.textContent = '确定';
  okBtn.style.cssText = 'padding:6px 12px;cursor:pointer;';

  buttons.appendChild(cancelBtn);
  buttons.appendChild(okBtn);
  dialog.appendChild(msg);
  dialog.appendChild(input);
  dialog.appendChild(buttons);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  input.focus();
  input.select();

  return new Promise((resolve) => {
    const handleOk = () => {
      cleanup();
      resolve(input.value || defaultValue);
    };

    const handleCancel = () => {
      cleanup();
      resolve(defaultValue);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter') handleOk();
      if (e.key === 'Escape') handleCancel();
    };

    const cleanup = () => {
      document.body.removeChild(overlay);
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKeydown);
      overlay.removeEventListener('click', handleOverlayClick);
    };

    const handleOverlayClick = (e) => {
      if (e.target === overlay) handleCancel();
    };

    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', handleOverlayClick);
  });
}

document.addEventListener('ceAllJsLoadDoneEvent', configUiLoad);
