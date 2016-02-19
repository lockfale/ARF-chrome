'use strict';

var autoUpdateCheck, lastCheckedText, versionText, checkForUpdatesButton;
var state = {   // default state
  autoUpdate: true
};

var port = chrome.extension.connect({name: 'ARFbus'});

var init = function() {
  autoUpdateCheck = document.querySelector('input[name=autoUpdate]');
  versionText = document.querySelector('span.version');
  lastCheckedText = document.querySelector('span.lastChecked');
  checkForUpdatesButton = document.querySelector('input.checkForUpdates');

  chrome.storage.local.get(['autoUpdate', 'lastChecked', 'version'], values => {
    setState(values);
  });

  autoUpdateCheck.addEventListener('click', function() {
    chrome.storage.local.get('autoUpdate', function(values) {
      if (autoUpdateCheck.checked !== !!values.autoUpdate) {
        chrome.storage.local.set({'autoUpdate': autoUpdateCheck.checked}, () => {
          if (!chrome.runtime.lastError) {
            setState({ 'autoUpdate': autoUpdateCheck.checked }); // optimistic -- DOM should already agree with state
          }
        });
      }
    });
  });

  checkForUpdatesButton.addEventListener('click', () => {
    port.postMessage('checkForUpdates');
  });
};


var setState = function(values) {
  let tmp = _.assign(_.cloneDeep(state), values);
  if (!_.isEqual(state, tmp)) {
    state = _.cloneDeep(tmp);
    render();
  }
};

var render = function() {
  let version = state.version || 'n/a';
  let lastChecked = state.lastChecked ? new Date(state.lastChecked).toString() : 'never';

  autoUpdateCheck.checked = !!state.autoUpdate;
  lastCheckedText.innerText = `Last checked: ${lastChecked}`;
  versionText.innerText = `ARF version: ${version}`;
};

init();
render();
