// What's Happening popup over the map. Pressing an event shows its building on the map.
// Events added through the Add event plan popup are kept in localStorage.
(function () {
  const STORE = 'plannedEvents';
  let base = [];
  const planned = () => { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; } };
  const list = createListPopup({
    id: 'events-popup', title: "What's Happening", navHref: '/?events', hash: 'events',
    searchPlaceholder: 'Search events', emptyText: 'No events found.',
    card: eventCard,
    text: (e) => e.name + ' ' + e.description + ' ' + e.building,
    category: (e) => e.category,
    onSelect: (e, ui) => {
      ui.setOpen(false);
      if (window.focusBuildingByName) window.focusBuildingByName(e.building, e.name);
    },
  });
  const refresh = () => list.setItems(base.concat(planned()).sort((a, b) => a.date.localeCompare(b.date)));
  window.addEventListener('events-changed', refresh);
  api('/events').then((data) => { base = data; refresh(); })
    .catch((err) => { console.error(err); list.setError('Could not load events.'); });
})();
