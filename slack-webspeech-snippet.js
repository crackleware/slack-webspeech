var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
if (0) recognition.lang = 'sr-SP'; // change language

final_transcript = '';

recognition_keep_running = true;

function send_message() {
    console.log('send_message:', final_transcript);
    $('#message-input')[0].value = final_transcript; TS.view.submit(); // slack integration
    final_transcript = '';
}

recognition.onstart = function() {
    console.log('webspeech onstart');
}
recognition.onresult = function(event) {
//     console.log('webspeech onresult', event);

    var interim_transcript = '';

    for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
        } else {
            interim_transcript += event.results[i][0].transcript;
        }
    }
    console.log('final_transcript:', final_transcript);
    console.log('interim_transcript:', interim_transcript);

    if (0) {
        var send = false;
        ['.', '!', '?'].forEach(function (c) {
            if (final_transcript.endsWith(c)) {
                send = true;
            }
        });
        if (send) send_message();
    }
}
recognition.onerror = function(event) {
    console.log('webspeech onerror', event);
}
recognition.onend = function() {
    console.log('webspeech onend');
    if (recognition_keep_running) {
        setTimeout(function () { recognition.start(); }, 50);
    }
}

if (1) {
    function time() { return (new Date()).getTime(); }
    lasttime = time();
    setInterval(function () {
        var t = time();
        if (t - lasttime > 3000) {
            lasttime = t;
            if (final_transcript) send_message();
        }
    }, 500); 
}

function start_recognition() {
    recognition_keep_running = true;
    recognition.start();
}

function stop_recognition() {
    recognition_keep_running = false;
    recognition.stop();
}

if (1) { start_recognition(); }

true

