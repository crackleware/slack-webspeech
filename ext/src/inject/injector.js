chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	    if (document.readyState === "complete") {
		    clearInterval(readyStateCheckInterval);

            chrome.storage.sync.get({
                lang: 'en-US',
                enableTTS: false,
                voiceName: 'Google US English',
                prependUsername: false
            }, function(items) {
                console.log('storage items:', items);
                var s = document.createElement('script');
                s.textContent = '('+toggleSlackWebspeechInPage+')('+JSON.stringify(items)+')';
                (document.head || document.documentElement).appendChild(s);
            });
	    }
	}, 10);
});


function toggleSlackWebspeechInPage(opts) {
    function log() {
        var a = Array.prototype.slice.call(arguments, 0);
        console.log.apply(console, ['SlackWebspeech'].concat(a)); 
    }

    var sws = window.slackWebspeech;
    if (sws) {
        log('stoping old');
        if (sws.flushDelayInterval != undefined) {
            clearInterval(sws.flushDelayInterval);
        }
        $('#msgs_div')[0].removeEventListener("DOMNodeInserted", sws.onNodeInserted, false);

        if (sws.enableTTS) {
            sws.voiceSynth.cancel();
        }

        sws.start_recognition = function () { };
        sws.stop_recognition();

        $('#slack-webspeech-status').remove();
        
        delete window.slackWebspeech;
        
        return;
    }

    log('starting new', opts);
    sws = window.slackWebspeech = {};
    
    sws.lang = opts.lang;
    sws.enableTTS = opts.enableTTS;
    sws.voiceName = opts.voiceName;
    sws.prependUsername = opts.prependUsername;
    
    sws.flushDelay = 2000; // ms


    $('.messages_header .channel_title').after(
        '<div id="slack-webspeech-status" style="min-width: 250px"><pre></pre></div>')
    $('#slack-webspeech-status pre').text('Slack Webspeech enabled');

    sws.recognition = new webkitSpeechRecognition();
    sws.recognition.continuous = true;
    sws.recognition.interimResults = true;
    if (sws.lang) sws.recognition.lang = sws.lang;

    sws.final_transcript = '';

    sws.recognition_keep_running = true;

    sws.send_message = function() {
        log('send_message:', sws.final_transcript);
        $('#message-input')[0].value = sws.final_transcript; TS.view.submit(); // slack integration
        sws.final_transcript = '';
        sws.update_status('', sws.final_transcript);
    }

    sws.update_status = function(interim_transcript, final_transcript) {
        $('#slack-webspeech-status pre').html(
            'interim: ' + interim_transcript.trim() + '\n' +
            '  final: <b>' + final_transcript.trim() + '</b>');
    }

    sws.recognition.onstart = function() {
        log('webspeech onstart');
    }
    sws.recognition.onresult = function(event) {
        //log('webspeech onresult', event);

        sws.lasttime = sws.time();

        var interim_transcript = '';

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                sws.final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        log('final_transcript:', sws.final_transcript);
        log('interim_transcript:', interim_transcript);

        sws.update_status(interim_transcript, sws.final_transcript);
        
        if (0) {
            var send = false;
            ['.', '!', '?'].forEach(function (c) {
                if (sws.final_transcript.endsWith(c)) {
                    send = true;
                }
            });
            if (send) sws.send_message();
        }
    }
    sws.recognition.onerror = function(event) {
        log('webspeech onerror', event);
    }
    sws.recognition.onend = function() {
        log('webspeech onend');
        if (sws.recognition_keep_running) {
            setTimeout(function () { sws.recognition.start(); }, 10);
        }
    }

    sws.time = function() { return (new Date()).getTime(); }
    sws.lasttime = sws.time();

    if (sws.flushDelay != null) {
        sws.flushDelayInterval = setInterval(function () {
            var t = sws.time();
            if (t - sws.lasttime > sws.flushDelay) {
                sws.lasttime = t;
                if (sws.final_transcript) sws.send_message();
            }
        }, 200); 
    }

    //setInterval(function () { console.log(sws.recognition_keep_running); }, 500);

    sws.start_recognition = function() {
        sws.recognition_keep_running = true;
        sws.recognition.start();
    }

    sws.stop_recognition = function() {
        sws.recognition_keep_running = false;
        sws.recognition.stop();
    }

    if (sws.enableTTS) { // TTS
        sws.voiceSynth = window.speechSynthesis;

        sws.voice = null;
        // voices needs some time to be ready
        sws.voiceSynth.onvoiceschanged = function() {
            if (sws.voice) return;
            var voices = '';
            sws.voiceSynth.getVoices().forEach(function (v) {
                voices += v.name+' ('+v.lang+'), ';
                if (v.name == sws.voiceName) {
                    sws.voice = v;
                }
            });
            log('found voices:', voices);
            if (sws.voice) {
                log('selected voice:', [sws.voice.name, sws.voice.lang]);
                $('#slack-webspeech-status pre').text('Found TTS voice.');
            }
        };
        
        sws.speak_message = function(msg) {
            log('speak_message:', msg);
            var ut = new SpeechSynthesisUtterance(msg);
            ut.voice = sws.voice;
            if (sws.lang) ut.lang = sws.lang;
            sws.stop_recognition();
            ut.onend = function() {
                sws.start_recognition();
            };
            sws.voiceSynth.speak(ut);
        }

        // find my slack username
        sws.my_slack_username = $('#team_header_user_name').text();
        log('my_slack_username:', sws.my_slack_username);

        // monitor for new messages
        sws.onNodeInserted = function (ev) {
            if (ev.target.tagName == 'TS-MESSAGE') {
                //log(ev.target);
                var el = $(ev.target);
                var username = el.find('.message_content_header_left a').first().text();
                //if (el.attr('data-member-id') != my_slack_id) {
                if (username != sws.my_slack_username) {
                    var el_body = el.find('.message_body').first();
                    var text = '';
                    if (sws.prependUsername) text += username + 'says, ';
                    text += el_body.text();
                    sws.speak_message(text);
                }
            }
        };
        $('#msgs_div')[0].addEventListener("DOMNodeInserted", sws.onNodeInserted, false);
    }

    sws.start_recognition();

    return;
}


