console.log('connected');
const watcherInputs = document.querySelectorAll('[data-id]');
const optionsInputs = document.querySelectorAll('[data-type="options"]');
const watcherForm = document.querySelector('#watcherForm');
const folders = document.querySelector('#folders');
const alert = document.querySelector('#alert');
const resetBtn = document.querySelector('#resetBtn');
let foldersList = [];
const watcherState = { options: {} };
let alertTimeout = null;

/**
 * @param {'success' | 'warning' | 'danger'} type the alert color
 * @param {string} message the alert feedback shown to the user
 * @param {number} timeout timeout of hidding the alert
 */
function showAlert(type, message, timeout) {
  if (alertTimeout !== null) clearTimeout(alertTimeout);

  alert.style.display = 'inline';

  alert.textContent = message;
  alert.setAttribute('class', `alert alert-${type}`);

  alertTimeout = setTimeout(() => {
    alert.style.display = 'none';
  }, timeout | 5000);
}

watcherInputs.forEach((input) => {
  input.addEventListener('input', (event) => {
    watcherState[event.target.id] = event.target.value;
  });
});

optionsInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    watcherState['options'][event.target.id] = event.target.checked;
  });
});

/**
 * @param  {[] | [event]} args
 */
function resetForm(...args) {
  watcherForm.reset();
  const keys = Object.keys(watcherState);
  keys.forEach((key) => {
    delete watcherState[key];
  });
  watcherState.options = {};
}

resetBtn.addEventListener('click', resetForm);

watcherForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const res = await fetch('/watch', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(watcherState),
  }).then((res) => res.json());

  if (res.type === 'success') {
    foldersList = res.payload;
    resetForm();
    bootstrap();
    showAlert(res.type, res.message);
    return;
  }

  showAlert(res.type, res.message);
});

window.addEventListener('load', async () => {
  const res = await fetch('/data', {
    headers: {
      'content-type': 'application/json',
    },
  }).then((res) => res.json());
  foldersList = res.watchedFolders;
  bootstrap();
});

function remove(idx) {
  (async () => {
    const folderPath = foldersList[idx].folderPath;
    const res = await fetch('/unwatch', {
      method: 'delete',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ folderPath }),
    }).then((res) => res.json());

    if (res.type === 'success') {
      foldersList = foldersList.filter(
        (folder) => folder.folderPath !== folderPath,
      );
      bootstrap();
      showAlert(res.type, res.message);
      return;
    }

    showAlert(res.type, res.message);
  })();
}

/**
 * @param { { folderPath: string, idx: number, createdAt: Date } } args
 * @returns card component
 */
function folder({ folderPath, createdAt, idx }) {
  return `
    <div class="card mt-3" id="${idx + 1}">
      <div class="card-header">
        <div class="float-left folderPath">${folderPath}</div>
        <div class="float-right folderPathBtn">
          <button type="button" class="btn btn-danger" onclick="remove(${idx})">X</button>
        </div>
      </div>
      <div class="card-body text-center text-muted" title="Creation Time" dir="rtl">${new Date(
        createdAt,
      ).toLocaleString('ar')}</div>
    </div>`;
}

function bootstrap() {
  folders.innerHTML = '';
  foldersList.forEach((folderItem, idx) => {
    folders.innerHTML += folder({ idx, ...folderItem });
  });
}
