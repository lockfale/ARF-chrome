# ARF-chrome
Advanced Reconnaissance Framework — Google Chrome extension

## Notes
- Using Yeoman for dev (https://github.com/yeoman/generator-chrome-extension)
- I've hardcoded a URL in [background.js](https://github.com/lockfale/ARF-chrome/blob/master/app/scripts.babel/background.js#L3) that points to a small JSON file (contents are below). The extension checks this file to get the latest ARF version and the location of the matching bookmarks JSON.

arf.json:
````
{
   version: "0.0.1",
   uri: "http://evanbooth.com/arf/bookmarks-v0.0.1.json",
   md5: "shouldprobablydothis"
}
````

## ToDo
- [ ] Add a link to the [main ARF site](http://osintframework.com/) someplace handy
- [ ] [Omnibox support](https://developer.chrome.com/extensions/omnibox) search — the goal is to allow the user to start typing in the omnibox and see a list of matching ARF bookmarks, which would open when clicked or selected or whatever.
- [ ] Omnibox keywords — there are bookmarklets in ARF that basically take search criteria and open new tabs for a set number of sites (including the search criteria in the URL). A good example of this is the "username" serach, which current takes whatever word the user currently has selected. The bookmarklet can be viewed [here](http://pastebin.com/2Faz7AHR). Ideally, the user could jump up to the omnibox and type a certain keyword ('username', for example) that would trigger this action. SUPER ideally, the keyword would be customizable in the extension settings dialog. The sites associated with this type of search should probably be stored in the main bookmarks JSON file as an array of objects with site name, url (potentially with a placeholder for search term), http method (get/post), and a 'data' object with the variables that should be included in the request.
- [ ] Change the bookmark sync process to update the local ARF bookmark collection by running a diff on the local and latest bookmarks, then making the appropriate changes locally. The motivation behind this is to eventually let users add their own bookmarks alongside bookmarks added via ARF. Bonus points if the custom bookmarks show up in the omnibox search. :D

