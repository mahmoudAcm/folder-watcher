function addFolderItem(foldername, date, folderPath) {
  const item = document.createElement('li');
  item.setAttribute(
    'class',
    'list-group-item d-flex justify-content-between align-items-center folder-item rounded shadow',
  );
  item.dataset.id = folderPath;

  const span = document.createElement('span');
  span.setAttribute('class', 'badge badge-primary badge-pill');
  span.textContent = date;

  const paths = folderPath.split('\\');
  const lastPortion = paths.pop();

  const ol = document.createElement('ol');
  ol.classList.add('breadcrumb');

  for (const path of paths.slice(0, 6)) {
    const li = document.createElement('li');
    li.classList.add('breadcrumb-item');
    li.classList.add('active');

    li.innerHTML = path;
    ol.appendChild(li);
  }

  if (paths.length > 6) {
    const li = document.createElement('li');
    li.classList.add('breadcrumb-item');
    li.classList.add('active');

    li.innerHTML = '..';
    ol.appendChild(li);
  }

  const li = document.createElement('li');
  li.classList.add('breadcrumb-item');
  li.innerHTML = `<a href="#">${lastPortion}</a>`;
  ol.appendChild(li);

  li.addEventListener('click', () => {
    socket.emit('open', folderPath);
  });

  item.appendChild(ol);
  
  const delBtn = document.createElement('button');
  delBtn.setAttribute("class", "btn del-btn");
  delBtn.textContent = 'X';
  
  delBtn.addEventListener('click', () => {
    socket.emit('unwatch', folderPath);
  });
  
  item.appendChild(span);
  item.appendChild(delBtn);

  return item;
}
