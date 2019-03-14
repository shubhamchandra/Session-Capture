var SessionCount = 0;
var Sessions = [];

init = () => {
    chrome.storage.local.get(["SessionCapture_Count", "SessionCapture_Sessions"], (obj) => {
        if(!obj.SessionCapture_Count)
            chrome.storage.local.set({"SessionCapture_Count" : 0});
        else {
            SessionCount = obj.SessionCapture_Count;
            console.log("Session capture count:", SessionCount);
        }
        if(!obj.SessionCapture_Sessions)
            chrome.storage.local.set({"SessionCapture_Sessions" : []});
        else {
            Sessions = obj.SessionCapture_Sessions;
            console.log(Sessions);
        }
    });
}

captureCurrentSession = (name) => {
    var dfd = $.Deferred();
    chrome.storage.local.get(["SessionCapture_Count", "SessionCapture_Sessions"], (obj) => {
        // get latest state 
        SessionCount = obj.SessionCapture_Count;
        Sessions = obj.SessionCapture_Sessions;
        SessionCount++;
        chrome.storage.local.set({"SessionCapture_Count" : SessionCount});
        var session = {}
        session.date = Date.now();
        session.id = SessionCount;
        session.name = name;
        session.lastAccessed = Date.now();
        console.log("wtf", session);
        Sessions.unshift(session);
        chrome.storage.local.set({ "SessionCapture_Sessions" : Sessions});
        chrome.tabs.query(
            {currentWindow: true},
            function(arrayOfTabs) {
                console.log("wtf", arrayOfTabs);
                var tabId = "SessionCapture_Tabs" + SessionCount;
                for(i = 0; i < arrayOfTabs.length; i++) {
                    if(arrayOfTabs[i].url.indexOf("hikfmcfkcnaijpepnjnpckmbijgjnjif") != -1) 
                        arrayOfTabs.splice(i, 1);
                }
                chrome.storage.local.set({[tabId] : arrayOfTabs}, () => {
                    chrome.storage.local.get([tabId], (obj) => console.log("fetched value", obj));
                    dfd.resolve(session);
                });
            }
        );
    });
    return dfd.promise();
}

removeSession = (id) => {
    for(let i = 0; i < Sessions.length; i++) {
        if(Sessions[i].id == id) {
            Sessions.splice(i, 1);
            break;
        }
    }
    chrome.storage.local.set({ "SessionCapture_Sessions" : Sessions});
}

getTabs = (sessionId) => {
    var dfd = $.Deferred();
    var key = "SessionCapture_Tabs" + sessionId
    chrome.storage.local.get([key], (obj) => {
        dfd.resolve(obj[key]);
        console.log("promise resolved");
    });
    return dfd;
}

getSessions = () => {
    return Sessions;
}



