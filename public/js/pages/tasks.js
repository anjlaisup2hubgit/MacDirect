// Task plan popup over the map. Pressing a task toggles it done.
(function () {
  const list = createListPopup({
    id: 'tasks-popup', title: 'User Settings', navHref: '/?tasks', hash: 'tasks',
    searchPlaceholder: 'Search tasks', emptyText: 'No tasks found.',
    card: taskCard,
    text: (t) => t.name,
    category: (t) => t.category,
    onSelect: (t, ui) => { t.done = !t.done; ui.render(); },
  });
  api('/tasks').then(list.setItems).catch((err) => { console.error(err); list.setError('Could not load tasks.'); });
})();
