function save_options() {
    var lang = document.getElementById('lang').value;
    var enableTTS = document.getElementById('enableTTS').checked;
    var voiceName = document.getElementById('voiceName').value;
    var prependUsername = document.getElementById('prependUsername').checked;
    chrome.storage.sync.set({
        lang: lang,
        enableTTS: enableTTS,
        voiceName: voiceName,
        prependUsername: prependUsername
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        lang: 'en-US',
        enableTTS: false,
        voiceName: 'Google US English',
        prependUsername: true
    }, function(items) {
        document.getElementById('lang').value = items.lang;
        document.getElementById('enableTTS').checked = items.enableTTS;
        document.getElementById('voiceName').value = items.voiceName;
        document.getElementById('prependUsername').value = items.prependUsername;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
