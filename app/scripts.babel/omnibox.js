'use strict';

const SEARCH_THRESHOLD = .35;
const MAX_RESULT_COUNT = 10;
const PATH_SEPARATOR = ' > ';

chrome.omnibox.onInputStarted.addListener(() => {
  console.log('onInputStarted');
});

chrome.omnibox.onInputChanged.addListener((text, suggestResult) => {
  console.log('omnibox text:', text);
  suggestResults(text, suggestResult);
});

chrome.omnibox.onInputEntered.addListener((text, inputEnteredDisposition) => {
  console.log('entered text:', text);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: text});
  });
});

chrome.omnibox.onInputCancelled.addListener(() => {
  console.log('user canceled');
});

var suggestResultsBase = function(text, suggestResult) {

  var fuse = new Fuse(linksArray, { keys: ['title', 'url'], threshold: SEARCH_THRESHOLD });
  var result = fuse.search(text);
  result = result.slice(0, result.length > MAX_RESULT_COUNT ? MAX_RESULT_COUNT : result.length - 1);

  if (result.length) {
    chrome.omnibox.setDefaultSuggestion({ 'description': `ARF found <match>${result.length}</match> matching resources.` });
    suggestResult(result.map((res) => {
      return buildResult(res);
    }));
  } else {
    chrome.omnibox.setDefaultSuggestion({
      'description': `No resources matched query: ${_.escape(text)}. Better quit security.`
    });
  }
};

var buildResult = function(res) {
  let path = getFullPath(res);
  path = path.length ? ` <dim>${_.escape(path.join(PATH_SEPARATOR))}</dim>` : '';

  return {
    'content': res.url,
    'description': `<match>${_.escape(res.title)}</match> - <url>${_.escape(res.url)}</url> ${path}`
  };
};

var getFullPath = function(b, path) {
  path = path || [];
  b = b || {};
  if (typeof idRef[b.id] === 'undefined' || typeof b.parentId === 'undefined') return path;
  path.unshift(b.title);
  return getFullPath(idRef[b.parentId], path);
};


var suggestResults = _.throttle(suggestResultsBase, 200, { 'trailing': true });
