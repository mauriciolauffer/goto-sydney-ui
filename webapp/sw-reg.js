if (0 && window.navigator && window.navigator.serviceWorker) {
  window.navigator.serviceWorker.register('./sw.js')
    .then(function() { 'use strict'; console.log('SW registered'); })
    .catch(function() { 'use strict'; console.error('SW not registered'); });
}
