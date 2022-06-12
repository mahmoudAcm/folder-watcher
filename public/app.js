const form = document.querySelector('form');
const folderPathInput = document.getElementById('folderPath');
const messageInput = document.getElementById('message');
const alertStack = document.getElementById('alert-stack');
const submitBtn = document.getElementById('submit');
const foldersContainer = document.getElementById('folders');
const adder = document.getElementById('adder');
const adderBtn = document.getElementById('adder-btn');
const currentDate = document.getElementById('current-date');
const nextBgBtn = document.getElementById('next-bg-btn');

const backgrounds = [snowConfig, defaultConfig, spaceConfig];
let interval = null;

function changeBackground() {
  interval = setInterval(nextBackground, 60 * 5 * 1000);
}

window.onload = function () {
  currentDate.innerHTML = `Current Date: ${new Date().toDateString()}`;
  const firstVisit = localStorage.getItem('first_visit');
  if (!firstVisit || firstVisit !== 'false') {
    localStorage.setItem('first_visit', 'false');
    confirm('If unexpected behavior happened please try refreshing the page.');
  }
  changeBackground();
  requestPermission();
};

socket.on('notification', (payload) => {
  const notify = new Notification(payload.title, {
    body: payload.message,
    image: '/favicon.png',
    requireInteraction: true,
  });

  notify.onclick = (evt) => {
    evt.target.close();
    evt.preventDefault();
    socket.emit('open', payload.title);
  };
});

socket.on('connection', async () => {
  await requestPermission();

  new Notification('connected to server successfully.', {
    image: '/favicon.png',
    requireInteraction: true,
  });

  alertStack.appendChild(
    addAlert('success', 'connected to server successfully.'),
  );

  const array = [];
  let idx = 0;
  for (const child of alertStack.children) {
    if (child.dataset.timeout === 'false') array.push(idx);
    idx++;
  }

  while (array.length) {
    idx = array.pop();
    alertStack.children[idx].remove();
  }

  socket.emit('folders');
});

socket.on('disconnect', () => {
  new Notification('disconneced, something went wrong.', {
    image: '/favicon.png',
    requireInteraction: true,
  });

  alertStack.appendChild(
    addAlert('warning', 'disconneced, something went wrong.'),
  );
});

socket.on('connect_error', () => {
  alertStack.appendChild(
    addAlert('info', 'trying to connect the server, connecting...', false),
  );
});

socket.on('folderOpened', (foldername) => {
  alertStack.appendChild(
    addAlert('success', `Folder '${foldername}' is opened successfully.`),
  );
});

socket.on('error', (error) => {
  if ('message' in error) {
    alertStack.appendChild(addAlert('danger', error.message));
  }
  setTimeout(() => {
    submitBtn.removeAttribute('disabled');
  }, 500);
});

socket.on('watched', (folder) => {
  form.reset();
  alertStack.appendChild(
    addAlert('success', `folder '${folder.name}' is watched successfully.`),
  );
  setTimeout(() => {
    submitBtn.removeAttribute('disabled');
    socket.emit('folders');
  }, 500);
});

socket.on('unwatched', (folderPath, folderName) => {
  for (var folder of foldersContainer.children) {
    if (folder.dataset.id === folderPath) {
      console.log('removed');
      folder.remove();
      alertStack.appendChild(
        addAlert('info', `Folder '${folderName}' has been removed.`),
      );
      return;
    }
  }
});

socket.on('folders', (folders) => {
  foldersContainer.innerHTML = '';
  for (const folder of folders.reverse()) {
    foldersContainer.appendChild(
      addFolderItem(
        folder.name,
        new Date(folder.timestamps).toLocaleString('en'),
        folder.folderPath,
      ),
    );
  }
});

form.onsubmit = function onSubmit(evt) {
  evt.preventDefault();
  const folderPath = folderPathInput.value;
  const notificationMsg = messageInput.value;
  let canSend = true;

  if (!folderPath) {
    canSend = false;
    setTimeout(() => {
      alertStack.appendChild(
        addAlert('danger', 'Please provide a valid folder path.'),
      );
    });
  }

  if (!notificationMsg) {
    canSend = false;
    setTimeout(() => {
      alertStack.appendChild(
        addAlert('danger', 'Please provide a valid message.'),
      );
    }, 250);
  }

  if (!canSend) return;

  const payload = { folderPath, notificationMsg };
  socket.emit('watch', payload);
  submitBtn.setAttribute('disabled', 'true');
};

let toggle = false;
adderBtn.addEventListener('click', () => {
  adder.classList.toggle('show-adder');
  ['btn-primary', 'btn-danger', 'btn-toggle'].forEach(
    adderBtn.classList.toggle,
  );

  folderPathInput.focus({
    preventScroll: true,
  });

  if (!toggle) {
    adderBtn.title = 'close the form';
  } else adderBtn.title = 'add a watcher';

  toggle ^= true;
});

let currentBgIndex = parseInt(localStorage.getItem('cur_idx') || '0', 10);
particlesJS('particles', backgrounds[currentBgIndex]);

function nextBackground() {
  particlesJS('particles', backgrounds[++currentBgIndex % 3]);
  localStorage.setItem('cur_idx', currentBgIndex % 3);
}

nextBgBtn.addEventListener('click', () => {
  if (interval !== null) clearInterval(interval);
  nextBackground();
  changeBackground();
});
