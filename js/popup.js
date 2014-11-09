if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}

var winCounter=99999;

$(document).ready(function() {
	winCounter = 99999;
	chrome.windows.getAll({"populate":true},processWindows);
	$("#saveBtn").click(SaveChanges);
	$("#newWinBtn").click(newWin);
});

function processWindows(windows) {
	var results = $("#results").empty();	
	windows.forEach(function(v) { 
		addWindow(v,results);
	});
	
	$(".tabli").sortable({
	  connectWith: ".connected"
	});
	
	$("li").tooltip({
        placement : 'top'
    });	
}

function setCollapse(id) {
	$(".panel-"+id).click(function(event) {
		var tgt = $(event.target);
		if(tgt.hasClass("panel-opened")) {
			tgt.removeClass("panel-opened");
			tgt.addClass("panel-closed");
			tgt.next().hide();
		}
		else {
			tgt.addClass("panel-opened");
			tgt.removeClass("panel-closed");
			tgt.next().show();
		}
	});
}

function newWin(evt) {
	addWindow(null,$("#results"));
	$(".tabli").sortable({
	  connectWith: ".connected"
	});
}

function addWindow(w,el) {
	var collapseId;
	var panel = '<div class="col-xs-6"><div class="panel panel-info"><div class="panel-heading panel-{0} panel-opened" style="cursor: pointer;">{1}</div>' +
				'<div class="panel-body"><ul class="connected tabli" data-val="{2}">{3}</ul></div></div></div>';
	if(w){
		collapseId = w.id;
		panel = String.format(panel,w.id,'Window - '+w.id,w.id,getTabs(w.tabs,w.id));
	}
	else {
		collapseId = winCounter++;
		panel = String.format(panel,collapseId,'New Window',0,'');
	}
	$(el).append(panel);
	setCollapse(collapseId);
}

function getTabs(tabsArr,wid) {
	var tabs = '';
	for(var i=0;i<tabsArr.length;i++) {
		var tab = tabsArr[i];
		var aTab = '<li data-original-title="URL: {0}" data-rel="tooltip" data-tab="{1}" data-window="{2}">{3}</li>';//id,title,url
		tabs += String.format(aTab,tab.url,tab.id,wid,tab.title);
	}
	return tabs;
}

function SaveChanges(event) {
	$("ul").each(function(k,v) { 
		var wid = $(v).attr('data-val');
		if(wid === "0")
			chrome.windows.create(null,function(window) { console.log(v+ " " +window); MoveTabs(v,window.id); });
		else
			MoveTabs(v,wid);
		
	});
	chrome.windows.getAll({"populate":true},processWindows);
	$("#message").text("Changes Saved");
	setTimeout(function() { $("#message").text("") },2000);
}

function MoveTabs(wins,wid) {
	var tabs = $("li",$(wins));
	var tabIds = [];
	for(var i=0;i<tabs.length;i++) {
		tabIds.push(parseInt($(tabs[i]).attr('data-tab')));
	}
	chrome.tabs.move(tabIds, {"windowId":parseInt(wid),"index":-1}, null);
}