var winCounter = 99999; //Used for new windows, so IDs don't clash
var windowTemplate;
var bookmarksTemplate;
var allWindows;

$(document).ready(function() {
    chrome.windows.getAll({ "populate": true }, processWindows);
    $("#saveBtn").click(saveChanges);
    $("#newWinBtn").click(newWin);

    var windowSource = $("#window-template").html();
    windowTemplate = Handlebars.compile(windowSource);

    var bookmarksSource = $("#bookmarks-template").html();
    bookmarksTemplate = Handlebars.compile(bookmarksSource);
});

function processWindows(windows) {
    allWindows = [];
    var results = $("#results").empty();

    windows.forEach(function(v) {
        allWindows.push({ id: v.id, tabs: v.tabs });
        addWindow(v, results);
    });

    $(".tabli").sortable({
        connectWith: ".connected",
    });

    $("li").tooltip({
        placement: 'top'
    });

    $("[data-export]").click(exportBookmarks);
}

function setCollapse(id) {
    $(".panel-" + id).click(function(event) {
        var tgt = $(event.target);
        if (tgt.hasClass("panel-opened")) {
            tgt.removeClass("panel-opened");
            tgt.addClass("panel-closed");
            tgt.next().hide();
        } else {
            tgt.addClass("panel-opened");
            tgt.removeClass("panel-closed");
            tgt.next().show();
        }
    });
}

function addWindow(w, el) {
    var collapseId;
    var panel = '';
    if (w) {
        collapseId = w.id;
        panel = windowTemplate({ wId: w.id, wTitle: 'Window - ' + w.id, tabs: w.tabs });
    } else {
        collapseId = winCounter++;
        panel = windowTemplate({ wId: 0, wTitle: 'New Window', tabs: [] });
    }
    $(el).append(panel);
    setCollapse(collapseId);
}

function newWin(evt) {
    addWindow(null, $("#results"));
    $(".tabli").sortable({
        connectWith: ".connected"
    });
}

function saveChanges(event) {
    $("ul").each(function(k, v) {
        var wid = $(v).attr('data-val');
        if (wid === "0")
            chrome.windows.create(null, function(window) {
                moveTabs(v, window.id);
            });
        else
            moveTabs(v, wid);

    });
    chrome.windows.getAll({ "populate": true }, processWindows);
    $("#message").text("Changes Saved");
    setTimeout(function() { $("#message").text("") }, 2000);
}

function moveTabs(wins, wid) {
    var tabs = $("li", $(wins));
    var tabIds = [];
    for (var i = 0; i < tabs.length; i++) {
        tabIds.push(parseInt($(tabs[i]).attr('data-tab')));
    }
    chrome.tabs.move(tabIds, { "windowId": parseInt(wid), "index": -1 }, null);
}


function exportBookmarks(el) {
    var wid = parseInt($(el.target).attr('data-export'));
    var window = allWindows.filter(x => x.id === wid);
    var tabs = window[0].tabs.map(function(obj) {
        return { url: obj.url, title: obj.title };
    });
    var html = bookmarksTemplate({ bookmarks: tabs });
    download('export.html', html);

}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}