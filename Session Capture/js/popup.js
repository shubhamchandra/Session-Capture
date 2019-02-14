$(document).ready(() => {
    console.log("document is ready");
    init();
    $('#save').prop('disabled', true);
    $('#sessionName').keyup(function() {
        if($(this).val() != '')
            $('#save').prop('disabled', false);
        else 
            $('#save').prop('disabled', true);
    });
    $('#save').click(() => {
        createSession($('#sessionName').val());
        $('#sessionName').val('');
        $('#save').prop('disabled', true);
    });

    $('#options').click(() => {
        var optionsUrl = chrome.extension.getURL('options.html');
        chrome.tabs.query({url: optionsUrl}, function(tabs) {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, {active: true});
            } else {
                chrome.tabs.create({url: optionsUrl});
            }
        });
    });
});




