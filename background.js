let audioCache = {};

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "speakText",
        title: "Speak Text",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "translateText",
        title: "Translate Text",
        contexts: ["selection"]
    });
});


chrome.commands.onCommand.addListener(function(command) {
    if (command === "speak_command") {
        chrome.tabs.executeScript({
            code: "window.getSelection().toString();"
        }, function(selection) {
            var selectedText = selection[0];
            if (selectedText) {
                // Fetch speed setting from storage or use default value
                chrome.storage.local.get(['openaiApiKey', 'speechSpeed', 'speechVoice'], function(data) {
                    let speed = data.speechSpeed || 0.7; // Default speed if not set
                    let voice = data.speechVoice || "onyx"; // Default speed if not set
                    if (data.openaiApiKey) {
                        speakTextUsingOpenAI(selectedText, speed, voice, data.openaiApiKey);
                    }
                });
            }
        });
    }
});

async function speakTextUsingOpenAI(text, speed, voice, apiKey, speechModel) {
    const audioCache = {}; // Assuming audioCache is declared at a higher scope
    // const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]; // List of available voices
    // const randomVoice = voices[Math.floor(Math.random() * voices.length)]; // Randomly select a voice

    let cacheKey = `${text}-${speed}-${voice}`;
    if (audioCache[cacheKey]) {
        console.log('Playing audio from cache key', cacheKey);
        playAudioBlob(audioCache[cacheKey]);
    } else {
        try {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: speechModel,
                    voice: voice,
                    input: text,
                    speed: speed
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            audioCache[cacheKey] = blob;
            playAudioBlob(blob);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

function playAudioBlob(blob) {
    let audioURL = window.URL.createObjectURL(blob);
    let audio = new Audio(audioURL);
    audio.play();
}


chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "speakText") {
        // speakText(info.selectionText, globalSpeed);
        chrome.storage.local.get(['openaiApiKey', 'speechSpeed', 'speechVoice', 'speechModel'], function(data) {
            let speed = data.speechSpeed || 0.7; // Default speed if not set
            let voice = data.speechVoice || "onyx"; // Default speed if not set
            let speechmodel = data.speechmodel || "tts-1"; // Default speed if not set
            if (data.openaiApiKey) {
                speakTextUsingOpenAI(info.selectionText, speed, voice, data.openaiApiKey, speechmodel);
            } else {
                console.error('API Key or language not set.');
            }
        });
    } else if (info.menuItemId === "translateText") {
        chrome.storage.local.get(['openaiApiKey', 'sourceLanguage', 'preferredLanguage', 'chosenModel'], function(data) {
            if (data.openaiApiKey && data.sourceLanguage && data.preferredLanguage) {
                translateText(info.selectionText, tab.id, data.openaiApiKey, data.sourceLanguage, data.preferredLanguage, data.chosenModel);
                // chrome.tabs.sendMessage(tab.id, {
                //     type: "showTranslatedText",
                //     translatedText: "heeeeeloo\n我是老师"
                // });
            } else {
                console.error('API Key or language not set.');
            }
        });
    }
});


let fullInput = ''; // This will be used to accumulate the full translation
let fullOutputTranslation = ''; // This will be used to accumulate the full translation

function translateText(text, tabId, apiKey, source_language, target_language, modelName) {
    console.log('translating from ', source_language, ' to ', target_language)
    fullInput = text;

    let chinese_prompt = `You're a translator bot proficient in Chinese, and I am a native speaker of ${source_language}. For any non-Chinese input (like Croatian or English), translate it to Chinese. You also need to include pinyin and a relevant construction info, so I learn how it's constructed, but don't be too detailed, and use ${source_language} to describe things, not English. For Chinese input do the same (but start with ${source_language} translation, and use ${source_language} to describe it). To point is to teach me Chinese, but the output has to be nicely split into concise lines, and the first lines must only include a raw translation (without descriptive text like "Translation", and never use "Construction" or similar text anywhere). I'm now giving you the text to translate: "${text}"`;
    
    let prompt = `You're a translator bot proficient in ${target_language}, and I am a native speaker of ${source_language}. For any non-${target_language} input (like Croatian, English, etc.), translate it to ${target_language}. You also need to include some relevant construction info, so I learn how it's constructed, but don't be too detailed, and use ${source_language} to describe things, not English.
    For ${target_language} input do the same (but start with ${source_language} translation, and use ${source_language} to describe it). To point is to teach me ${target_language}, but the output has to be nicely split into concise lines (use newlines!), and the first lines must only include a raw translation (without descriptive text like "Translation", and never use "Construction" or similar text anywhere). I'm now giving you the text to translate: "${text}"`;

    if(target_language == "Chinese"){
        prompt = chinese_prompt;
    }

    const api_url = "https://api.openai.com/v1/chat/completions";
    fetchStreamedResponse(api_url, apiKey, prompt, tabId, modelName);
}
// function translateText(text, tabId, apiKey, source_language, target_language, modelName) {
//     console.log('translating from ', source_language, ' to ', target_language)
//     fullInput = text;

//     let pinyin_insertion = ''
//     if(target_language == "Chinese"){
//         pinyin_insertion = 'pinyin and '
//     }

//     let prompt = `You're a translator bot proficient in ${target_language}, and I am a native speaker of ${source_language}. For any non-${target_language} input (like Croatian, English, etc.), translate it to ${target_language}. You also need to include ${pinyin_insertion}some relevant construction info, so I learn how it's constructed, but don't be too detailed, and use ${source_language} to describe things, not English.
//     For ${target_language} input do the same (but start with ${source_language} translation, and use ${source_language} to describe it). To point is to teach me ${target_language}, but the output has to be nicely split into concise lines (use newlines!), and the first lines must only include a raw translation (without descriptive text like "Translation", and never use "Construction" or similar text anywhere). I'm now giving you the text to translate: "${text}"`;


//     const api_url = "https://api.openai.com/v1/chat/completions";
//     fetchStreamedResponse(api_url, apiKey, prompt, tabId, modelName);
// }

function storeTranslation(inputText, outputText) {
    chrome.storage.local.get({ translationHistory: [] }, function(data) {
        let translationHistory = data.translationHistory;
        const firstLineOfOutput = outputText.split('\n')[0] || "";
        const translationObject = {
            inputText: inputText,
            outputTranslation: firstLineOfOutput
        };
        translationHistory.push(translationObject);
        chrome.storage.local.set({ translationHistory: translationHistory }, function() {
            console.log("Translation history updated.");
        });
    });
}

function fetchStreamedResponse(api_url, apiKey, prompt, tabId, modelName) {
    fetch(api_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            // model: "gpt-3.5-turbo-0125",
            model: modelName,
            messages: [{"role": "system", "content": "Translate text between languages, using a concise multiline format."},
                       {"role": "user", "content": prompt}],
            max_tokens: 400,
            stream: true
        })
    })
    .then(response => {
        const reader = response.body.getReader();
        let streamText = '';
        let isFirstChunk = true;  // Flag to check if it's the first chunk

        return reader.read().then(function processText({ done, value }) {
            if (done) {
                console.log('sending last chunk');
                chrome.tabs.sendMessage(tabId, {
                    type: "sendTranslationEnd"
                });
                storeTranslation(fullInput, fullOutputTranslation);
                return streamText;
            }
            streamText += new TextDecoder("utf-8").decode(value, {stream: true});

            let lastNewline = streamText.lastIndexOf('\n');
            if (lastNewline > -1) {
                let messages = streamText.substring(0, lastNewline).split('\n');
                messages.forEach(message => {
                    if (message.startsWith('data: ')) {
                        message = message.substring(6); // Remove 'data: ' prefix
                        try {
                            const data = JSON.parse(message);
                            if (data.choices) {
                                data.choices.forEach(choice => {
                                    if (choice.delta && choice.delta.content) {
                                        if (isFirstChunk) {
                                            // Send the begin translation message with the first chunk
                                            console.log('sending first chunk')
                                            chrome.tabs.sendMessage(tabId, {
                                                type: "sendTranslationBegin",
                                                translatedText: choice.delta.content
                                            });
                                            isFirstChunk = false;  // Update the flag after sending the first message
                                        } else {
                                            // Send subsequent chunks
                                            // console.log('sending subsequent chunk')
                                            let chunk = choice.delta.content;
                                            fullOutputTranslation += chunk;
                                            chrome.tabs.sendMessage(tabId, {
                                                type: "sendTranslatedChunk",
                                                translatedText: chunk
                                            });
                                        }
                                    }
                                });
                            }
                        } catch (error) {
                            console.log('Received non-JSON or special message:', message);
                        }
                    }
                });
                streamText = streamText.substring(lastNewline + 1);
            }

            return reader.read().then(processText);
        });
    })
    .catch(err => console.error('Error:', err));
}
