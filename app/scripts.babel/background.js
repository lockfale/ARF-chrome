'use strict';

const LATEST_VERSION_INFO_URL = 'http://evanbooth.com/arf/arf.json';
const ARF_FOLDER_NAME = 'ARF';

chrome.runtime.onInstalled.addListener(details => {
  checkForUpdates();
});

chrome.alarms.clearAll(cleared => {
  chrome.alarms.create('checkForUpdates', {
    delayInMinutes: 60 * 24,
    periodInMinutes: 60 * 24  //daily
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'checkForUpdates') {
    chrome.storage.local.get('autoUpdate', values => {
      if (values.autoUpdate) {
        checkForUpdates();
      }
    });
  }
});

chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    if (msg === 'checkForUpdates') {
      checkForUpdates();
    }
  });
});

var checkForUpdates = function() {
  var targetVersion;
  getLatestVersionInfo()
  .then(verInfo => {
    targetVersion = verInfo.version;
    return getLocalVersion()
    .then(localVersion => {
      if (verInfo.version === localVersion) {
        return Q.reject('already on latest version');
      }
      return Q(verInfo);
    });
  })
  .then(getBookmarks)
  .then(bookmarks => {
    return getARFFolder()
    .then(removeARFBookmarks)
    .then(arfNode => {
      return addBookmarks(arfNode, bookmarks)
      .then(results => {
        chrome.storage.local.set({ 'version': targetVersion });
      });
    });
  })
  .catch(error => {
    console.error('error updating:', error);
  })
  .done(() => {
    chrome.storage.local.set({ 'lastChecked': new Date() / 1000 * 1000 });
  });
};

var getLatestVersionInfo = function() {
  let deferred = Q.defer();

  $.ajax({
    'url': LATEST_VERSION_INFO_URL,
    'cache': false,
    'dataType': 'json'
  })
  .done(res => {
    if (typeof res.version !== 'undefined' && typeof res.uri !== 'undefined') {
      deferred.resolve(res);
    } else {
      deferred.reject('invalid version info');
    }
  })
  .fail(() => {
    deferred.reject('could not fetch version info');
  });

  return deferred.promise;
};

var getBookmarks = function(verInfo) {
  let deferred = Q.defer();

  $.ajax({
    'url': verInfo.uri,
    'cache': false,
    'dataType': 'json'
  })
  .done(res => {
    deferred.resolve(res);
  })
  .fail(res => {
    if (res.status === 200) {
      deferred.reject('could not fetch bookmarks — probably invalid JSON');
    }
    deferred.reject(`could not fetch bookmarks — status ${res.status}`);
  });

  return deferred.promise;
};

var getLocalVersion = function() {
  let deferred = Q.defer();

  chrome.storage.local.get('version', values => {
    deferred.resolve(values.version);
  });

  return deferred.promise;
};

var getARFFolder = function() {
  let deferred = Q.defer();

  chrome.bookmarks.search({ 'title': ARF_FOLDER_NAME }, nodes => {
    if (!nodes.length) {
      // no 'ARF' folder... let's make one
      chrome.bookmarks.create({ 'title': ARF_FOLDER_NAME }, arfFolder => {
        deferred.resolve(arfFolder);
      });
    } else {
      deferred.resolve(nodes[0]);
    }
  });

  return deferred.promise;
};

var removeARFBookmarks = function(arfNode) {
  let deferred = Q.defer();

  chrome.bookmarks.getChildren(arfNode.id, children => {
    Q.all(
      _.map(children, childNode => {
        return removeBookmark(childNode.id);
      })
    ).then(() => {
      deferred.resolve(arfNode);
    });
  });

  return deferred.promise;
};

var removeBookmark = function(bookmarkId) {
  let deferred = Q.defer();

  chrome.bookmarks.removeTree(bookmarkId, () => {
    deferred.resolve(bookmarkId);
  });

  return deferred.promise;
};

var totalBookmarks;

var addBookmarks = function(arfNode, bookmarks) {
  totalBookmarks = 0;
  return Q.all(
    _.map((bookmarks.children || []).sort(bookmarkNameSortAlpha), bookmark => {
      return addBookmark(arfNode, bookmark);
    })
  );
};

var addBookmark = function(parentNode, bookmark) {
  let bookmarkObj = {
    'title': bookmark.name
  };

  if ((bookmark.type || '').toLowerCase() === 'url') {
    bookmarkObj.url = bookmark.url;
    return addBookmarkQ(parentNode, bookmarkObj);
  }

  // it's a folder, unleash the recursion
  return addBookmarkQ(parentNode, bookmarkObj)
  .then(bookmarkNode => {
    return Q.all(
      _.map((bookmark.children || []).sort(bookmarkNameSortAlpha), childBookmark => {
        return addBookmark(bookmarkNode, childBookmark);
      })
    );
  });

};

var addBookmarkQ = function(parentNode, bookmarkObj) {
  let deferred = Q.defer();

  bookmarkObj.parentId = parentNode.id;
  chrome.bookmarks.create(bookmarkObj, bookmarkNode => {
    totalBookmarks++;
    deferred.resolve(bookmarkNode);
  });

  return deferred.promise;
};

var bookmarkNameSortAlpha = function(a, b) {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  } else {
    return 0;
  }
};
