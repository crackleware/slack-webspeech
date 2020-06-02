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
    document.querySelector('.ql-editor').innerText = final_transcript;
    setTimeout(() => {
        document.querySelector('div.ql-buttons > button.c-texty_input__button--send').click();
    }, 50);
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
        if (t - lasttime > 2000) {
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

    // monitor for new messages
    var last_el_id = null;
    var is_my_msg = true;
    document.querySelector(".c-message_list > div.c-scrollbar__hider > div > div").addEventListener("DOMNodeInserted", function (ev) {
        var el = ev.target;
        if (el && el.classList.contains('c-virtual_list__item')) {
            console.log(el);
            console.log(el.innerText);
            if (el.getAttribute('aria-expanded') == "false") {
                var id = el.getAttribute('id');
                if (id.search('x') == -1) {
                    var el_id = parseFloat(id);
                    if (el_id == null || (el_id != NaN && (last_el_id == null || el_id > last_el_id))) {
                        last_el_id = el_id;
                        var el2 = el.querySelector("div.c-message_kit__gutter__right");
                        if (el2) {
                            var el3 = el2.querySelector('.c-message__sender');
                            if (el3) {
                                is_my_msg = el3.style.color == 'rgb(223, 61, 192)';
                            }
                            console.log('is_my_msg:', is_my_msg);
                            if (!is_my_msg) {
                                speak_message(el2.innerText);
                            }
                        }
                    }
                }
            }
        }
    }, false);
}

if (1) { start_recognition(); }

true

