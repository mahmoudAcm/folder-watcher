const addAlert = (type = 'danger', message, useTimeout = true) => {
  const currTime = Date.now();
  const alertContainer = document.createElement('div');
  alertContainer.setAttribute(
    'class',
    `alert bg-${type} alert-${type} alert-dismissible shadow rounded slide-right`,
  );
  alertContainer.setAttribute('role', 'alert');
  alertContainer.dataset.id = currTime;
  alertContainer.dataset.timeout = useTimeout;

  const dismissButton = document.createElement('button');
  dismissButton.classList.add('close');
  dismissButton.setAttribute('type', 'button');
  dismissButton.dataset.dismiss = 'alert';
  dismissButton.setAttribute('aria-label', 'Close');

  const span = document.createElement('span');
  span.innerHTML = '&times;';
  span.setAttribute('aria-hidden', 'true');

  dismissButton.appendChild(span);

  alertContainer.appendChild(document.createTextNode(message));
  alertContainer.appendChild(dismissButton);

  let timeoutRefOuter = null,
    timeoutRefInner = null;

  function onMouseLeave() {
    if (!useTimeout) return;
    timeoutRefOuter = setTimeout(() => {
      alertContainer.classList.add('fade');
      timeoutRefInner = setTimeout(() => {
        alertContainer.remove();
      }, 125);
    }, 4500);
  }

  if (useTimeout) onMouseLeave();

  alertContainer.addEventListener('mouseenter', () => {
    if (timeoutRefInner !== null) clearTimeout(timeoutRefInner);
    if (timeoutRefOuter !== null) clearTimeout(timeoutRefOuter);
  });

  alertContainer.addEventListener('mouseleave', onMouseLeave);

  return alertContainer;
};
