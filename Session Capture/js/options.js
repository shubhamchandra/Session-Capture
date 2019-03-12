$(document).ready(() => {
    var sessions = [];
    var activeSession = null;
    var curTabs = [];
    var allowEdit = true;
    var addSession = false;
    var deleteSessionClicked = false;
    var submitEnabled = false;

    chrome.storage.local.get(['SessionCapture_Sessions'], (obj) => {
        sessions = obj.SessionCapture_Sessions;
        console.log(sessions);
        $.each(sessions, (idx, session) => {
            console.log(session.date);
            var date = getDateFromTimeStamp(session.date);
            var cls = 'session-list-item';
            if(idx == 0) {
                cls = 'active session-list-item';
                setupTabContent(session);
            }
            var txt = `<li class="${cls}" id="${session.id}">
            <div class="session-title">${session.name}</div>
            <div class="session-date">${date}</div>
            </li>`;
            txt = $(txt).on('click', () => {
                displaySession(session); // closure
            });
            $('#session-list-content').append(txt);
        });
    });

    getDateFromTimeStamp = (date) => {
        date1 = new Date(parseInt(date));
        date1 = date1.toLocaleString("en-US");
        arr = date1.split(',');
        date1 = arr[0] + arr[1];
        return date1;
    }

    setupTabContent = (session) => {
        $('.session-detail #session-name').text(session.name);
        var date = getDateFromTimeStamp(session.date);
        $('.tab-content #session-time').text("Created " + date);
        activeSession = session;
        console.log("activeSession set to", activeSession);
        getTabs(session.id).then((tabs) => {
            console.log("tabs", tabs);
            curTabs = tabs;
            $list = $('<ul class="tab-list-content"></ul>');
            $.each(tabs, (i, tab) => {
                $txt = $(`<li class="tab-item"></li>`);
                $x = $(`<img class="x" src="images/removeItemIcon.png">`);
                $x.click(() => {
                    console.log("tab clicked:", tab);
                    console.log($(event.target).parent());
                    $(event.target).parent().remove();
                    for(var i = 0; i < curTabs.length; i++) {
                        if(curTabs[i].index === tab.index) {
                            curTabs.splice(i, 1);
                            break;
                        }
                    }
                });
                $t = $(`<img class="favicon" src="${tab.favIconUrl}">
                <a href="${tab.url}" target="_blank">${tab.title}</a>`);
                $txt.append($x).append($t);
                $list.append($txt);
            });
            $('.tab-content .tab-list').html($list);
            allowEdit = true;
            invertEdit();
        });
        
    }

    invertEdit = () => {
        allowEdit = !allowEdit;
        if(allowEdit) {
            $('#edit-save img').attr('src', 'images/saveIcon.png');
            $('#edit-save span').text('Save');
            $('.tab-item .x').show();
        } else {
            $('#edit-save img').attr('src', 'images/editIcon.png');
            $('#edit-save span').text('Edit');
            $('.tab-item .x').hide();
            chrome.storage.local.set({['SessionCapture_Tabs' + activeSession.id]: curTabs}, () => {
                console.log("saved tabs for sessionId ", activeSession.id);
            });
        }
    }

    $('#edit-save').click(invertEdit);

    addBtnHandler = () => {
        if(deleteSessionClicked) {
            $('.overlay').hide();
            $('.session-form').hide();
            $('#add-btn').css('transform', 'rotate(1turn)');
            deleteSessionClicked = false;
            return;
        }
        addSession = !addSession;
        disableSubmit();
        $('.session-name-input').val('');
        if(addSession) {
            $('.overlay').show();
            $('.session-form.create').show();
            $('#add-btn').css('transform', 'rotate(.125turn)');
            $('.session-name-input').focus();
        } else {
            $('.overlay').hide();
            $('.session-form').hide();
            $('#add-btn').css('transform', 'rotate(1turn)');
        }
    }

    $('#add-btn').click(addBtnHandler);

    $('#open-tabs-btn').click(() => {
        $.each(curTabs, (idx, tab) => {
            chrome.tabs.create({'url': tab.url});
        });
    });

    disableSubmit = () => {
        submitEnabled = false;
        $('.create .session-submit').css({'background': '#7d91ab', 'cursor' : 'default'});
        $('.create .session-submit').hover(() => {
            $('.create .session-submit').css({'background' : '#7d91ab', 'color' : '#b7c5c8'});
        });
    } 

    enableSubmit = () => {
        submitEnabled = true;
        $('.create .session-submit').css({'background': '#39424e', 'cursor' : 'pointer'});
        $('.create .session-submit').hover(() => {
            $('.create .session-submit').css({'background': '#5b697c', 'color' : '#c3d1d4'});
        },
        () => {
            $('.create .session-submit').css({'background': '#39424e', 'color' : '#b7c5c8'});
        }
        );
    }

    $('.session-name-input').keyup(() => {
        if($('.session-name-input').val() == '')
            disableSubmit();
        else 
            enableSubmit();
    });

    displaySession = (session) => {
        console.log("Display " ,session);
        if(session.id == activeSession.id)
            return;
        activeSession = session;
        $('#session-list-content li.active').removeClass('active');
        $('#' + session.id).addClass('active');
        setupTabContent(session);
    }

    createSession = (sessionName) => {
        captureCurrentSession(sessionName).then((session) => {
            var date = getDateFromTimeStamp(session.date);
            var cls = 'session-list-item';
            var txt = `<li class="${cls}" id="${session.id}">
            <div class="session-title">${session.name}</div>
            <div class="session-date">${date}</div>
            </li>`;
            txt = $(txt).on('click', () => {
                displaySession(session); // closure
            });
            $('#session-list-content').prepend(txt);
            sessions.unshift(session);
            displaySession(session);
        });
    }

    deleteSession = () => {
        for(var i = 0; i < sessions.length; i++) {
            if(sessions[i].id == activeSession.id) {
                chrome.storage.local.remove(["SessionCapture_Tabs" + sessions[i].id]);
                console.log("session to be deleted", sessions[i]);
                sessions.splice(i, 1);
                $('#session-list-content li.active').remove();
                $('#session-list-content li:nth-child(1)').addClass('active');
                break;
            }
        }
        displaySession(sessions[0]);
        chrome.storage.local.set({ "SessionCapture_Sessions" : sessions});
        addBtnHandler();
    }

    deleteSessionForm = () => {
        $('.overlay').show();
        $('.session-form.delete').show();
        $('#add-btn').css('transform', 'rotate(.125turn)');
        deleteSessionClicked = true;
    }

    $('#delete-session-btn').click(deleteSessionForm);  

    $('.delete .session-submit').click(deleteSession);

    $('.session-submit').click(() => {
        if(!submitEnabled) return;
        createSession($('.session-name-input').val());
        addBtnHandler();
    });
});