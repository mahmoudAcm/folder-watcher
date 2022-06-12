function requestPermission() {
  var isChrome =
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (!isChrome) {
    confirm('for you to get notifications please use chrome browser.');
    return;
  }
  if (typeof window.Notification === 'undefined') {
    confirm('sorry this browser dose not support notifications.');
  } else {
    return Notification.requestPermission();
  }
}
