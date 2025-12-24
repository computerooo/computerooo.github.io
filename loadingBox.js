// @version V1.0.0.2
//作者：电脑圈圈 https://space.bilibili.com/565718633
//日期：2025-12-07
//功能：配置界面
//所有版权归作者电脑圈圈所有，仅供爱好者免费使用，严禁用于任何商业用途，否则后果自负

function showLoading(text) {
  const div = document.createElement('div');
  div.innerHTML = `<div style="
    position:fixed;
    top:0;
    left:0;
    width:100%;
    height:100%;
    background:rgba(0,0,0,0.5);
    z-index:9999;
    display:flex;
    justify-content:center;align-items:center">
    <div style="
      background:white;
      padding:30px;
      width:600px;
      border-radius:10px;
      white-space: pre-wrap;
      text-align:center">
      <div style="
        width:40px;
        height:40px;
        border:4px solid #f3f3f3;
        border-top:4px solid #3498db;
        border-radius:50%;margin:0 auto 15px;
        animation:spin 1s linear infinite">
      </div>
      <div id='loadingTitleText' style="padding:0px; font-size: 30px">
        ${text}
      </div>
      <div id='loadingText' style="
        background:white;
        padding:0px;
        font-size: 30px;
        border-radius:10px;
        text-align:center">
        已完成0%
      </div>
    </div>
  </div>`;
  div.id = 'loadingDialog';
  document.body.appendChild(div);

  if (!document.querySelector('#loadingStyle')) {
    const style = document.createElement('style');
    style.id = 'loadingStyle';
    style.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }
}

function updateLoadingInfo(progress = 100, message = null) {
  const loadingText = document.getElementById('loadingText');
  if (loadingText != null) {
    loadingText.textContent = '已完成' + progress + '%';
  }
  if (message == null) {
    return;
  }
  const loadingTitleText = document.getElementById('loadingTitleText');
  if (loadingTitleText != null) {
    loadingTitleText.textContent = message;
  }
}

function hideLoading() {
  const dialog = document.getElementById('loadingDialog');
  if (dialog) dialog.remove();
}
