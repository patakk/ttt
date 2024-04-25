

// Loading the saved settings when the popup is opened
document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('apiKey').addEventListener('input', function() {
        var apiKey = this.value;
        console.log('apiKey set to', apiKey);
        chrome.storage.local.set({'openaiApiKey': apiKey}, function() {
            console.log('API Key saved');
        });
    });

    // Event listener for saving the speech speed
    document.getElementById('setSpeed').addEventListener('input', function() {
        var speed = document.getElementById('setSpeed').value;
        console.log('speed set to', speed);
        chrome.storage.local.set({'speechSpeed': speed}, function() {
            console.log('Speed set to', speed);
        });
    });

    // Event listeners for saving languages upon selection change
    document.getElementById('voiceSelector').addEventListener('change', function() {
        var voice = this.value;
        chrome.storage.local.set({'speechVoice': voice}, function() {
            console.log('Voice set to', voice);
        });
    });

    // Event listeners for saving languages upon selection change
    document.getElementById('languageSelector').addEventListener('change', function() {
        var language = this.value;
        chrome.storage.local.set({'preferredLanguage': language}, function() {
            console.log('Target Language set to', language);
        });
    });

    document.getElementById('sourceLanguageSelector').addEventListener('change', function() {
        var language = this.value;
        chrome.storage.local.set({'sourceLanguage': language}, function() {
            console.log('Source Language set to', language);
        });
    });

    document.getElementById('modelSelector').addEventListener('change', function() {
        var model = this.value;
        chrome.storage.local.set({'chosenModel': model}, function() {
            console.log('Model set to', model);
        });
    });

    document.getElementById('speechModelSelector').addEventListener('change', function() {
        var model = this.value;
        chrome.storage.local.set({'speechModel': model}, function() {
            console.log('Model set to', model);
        });
    });
    

    chrome.storage.local.get(['openaiApiKey', 'sourceLanguage', 'preferredLanguage', 'speechSpeed', 'speechVoice', 'chosenModel', 'speechModel'], function(data) {
        if (data.openaiApiKey) {
            document.getElementById('apiKey').value = data.openaiApiKey;
        }
        if (data.preferredLanguage) {
            document.getElementById('languageSelector').value = data.preferredLanguage;
        }
        if (data.sourceLanguage) {
            document.getElementById('sourceLanguageSelector').value = data.sourceLanguage;
        }
        if (data.speechSpeed) {
            document.getElementById('setSpeed').value = data.speechSpeed;
        }
        if (data.speechVoice) {
            document.getElementById('voiceSelector').value = data.speechVoice;
        }
        if (data.chosenModel) {
            document.getElementById('modelSelector').value = data.chosenModel;
        }
        if (data.speechModel) {
            document.getElementById('speechModelSelector').value = data.speechModel;
        }
    });
});
