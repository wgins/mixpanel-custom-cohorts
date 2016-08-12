var s = document.createElement('script');
s.src = chrome.extension.getURL('custom-cohorts.js');
(document.head||document.documentElement).appendChild(s);
