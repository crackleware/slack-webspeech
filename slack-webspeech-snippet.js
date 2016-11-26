slack_webspeech_lang = null;
if (0) slack_webspeech_lang = 'sr-SP';

var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
if (slack_webspeech_lang) recognition.lang = slack_webspeech_lang;

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
            lasttime = time();
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

function time() { return (new Date()).getTime(); }
lasttime = time();

if (1) {
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

if (1) { // TTS
    var voiceSynth = window.speechSynthesis;

    var googleVoice = null;
    // voices needs some time to be ready
    voiceSynth.getVoices().forEach(function (v) {
        console.log('searching voice:', [v.name, v.lang]);
        if (1 && slack_webspeech_lang == null && v.name == 'Google US English') {
            console.log('selecting voice:', [v.name, v.lang]);
            googleVoice = v;
        }
    });

    function speak_message(msg) {
        console.log('speak_message:', msg);
        if (0) return;
        var ut = new SpeechSynthesisUtterance(msg);
        ut.voice = googleVoice;
        if (slack_webspeech_lang) ut.lang = slack_webspeech_lang;
        stop_recognition();
        ut.onend = function() {
            start_recognition();
        };
        voiceSynth.speak(ut);
    }

    // find my slack username
    my_slack_username = $('#team_header_user_name').text();
    console.log('my_slack_username:', my_slack_username);

    // monitor for new messages
    $('#msgs_div')[0].addEventListener("DOMNodeInserted", function (ev) {
        if (ev.target.tagName == 'TS-MESSAGE') {
            //console.log(ev.target);
            var el = $(ev.target);
            var username = el.find('.message_content_header_left a').first().text();
//             if (el.attr('data-member-id') != my_slack_id) {
            if (username != my_slack_username) {
                var el_body = el.find('.message_body').first();
                var text = username + 'says, ' + el_body.text();
                speak_message(text);
            }
        }
    }, false);
}

if (1) { start_recognition(); }

true

