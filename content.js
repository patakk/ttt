
let initializeStyle = false;
let activeBubbles = [];

class Bubble {
    constructor(domelement) {
        this.bubble = domelement;
        this.closebutton = null;
        this.draggablearea = null;
        this.dragged = false;
        this.overdragged = false;
        this.timeoutId = null;
        this.fadeId = null;
        this.mouseover = false;
    }

    setPos(x, y) {
        this.bubble.style.left = `${x}px`;
        this.bubble.style.top = `${y}px`;
        const bubbleWidth = this.bubble.offsetWidth;
        const bubbleHeight = this.bubble.offsetHeight;
        // whiteedge has to be moved because it's not a child of bubble, because it has to be behind (z-index stuff)
    }
}

document.addEventListener('contextmenu', function(event) {
    rmouseX = event.clientX;
    rmouseY = event.clientY;
}, true);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "sendTranslationBegin" || request.type === "explainHanzi") {
        console.log('transmition begin');

        // removeBubbleFromDOM();
        let style = null;
        if(!initializeStyle) {
            style = document.createElement('style');
            style.textContent = `
                .translation-bubble, .translation-bubble * {
                    user-select: text; /* Allows text to be selected inside the bubble */
                    color: rgba(10,10,10,1.0); /* Ensure text color is consistent */
                    display: inline-block; /* Treat inline elements like block elements */
                    white-space: nowrap; /* Prevents the collapse of whitespace */
                    text-wrap: balance; /* Balance text wrapping */
                }
                .translation-bubble::selection, .translation-bubble *::selection {
                    background: #FFD700; /* Gold background for the bubble */
                    color: #000; /* Black text for the bubble */
                }
            `;
            document.head.appendChild(style);
            initializeStyle = true;
        }

        let bubblediv = document.createElement('div');
        bubblediv.setAttribute('id', 'translation-bubble');
        bubblediv.className = 'translation-bubble';
        // let lines = request.translatedText.split('\n').map(line => {
        //     line = line.trim();
        //     if (line.startsWith('*')) {
        //         line = `<i>${line.slice(1).trim()}</i>`;
        //     }
        //     line = line.split('. ').join('.<br>');
        //     line = line.split('." ').join('."<br>');
        //     return line;
        // });

        // create a text container
        let bubbletext = document.createElement('div');
        bubbletext.className = 'translation-bubble-text';
        bubbletext.innerHTML = request.translatedText;

        // bubblediv.innerHTML = request.translatedText;
        bubblediv.appendChild(bubbletext);
        document.body.appendChild(bubblediv);

        let bubble = new Bubble(bubblediv)
        bubble.bubbletext = bubbletext;
        activeBubbles.push(bubble);
        
        bubblediv.style.position = 'absolute';
        bubblediv.style.padding = '18px 24px';
        bubblediv.style.backgroundColor = 'rgba(255,255,255, 0.75)';
        bubblediv.style.border = 'none';
        bubblediv.style.borderRadius = '10px';
        bubblediv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        bubblediv.style.backdropFilter = 'blur(5px)';
        bubblediv.style.zIndex = '666';
        bubblediv.style.color = 'rgba(9,9,9,1.0)';
        bubblediv.style.fontSize = '16px';
        bubblediv.style.font = 'Roboto, sans-serif';

        bubbletext.style.cssText = 'scrollbar-width: none; max-height: 600px; max-width: 500px; overflow-y: scroll; padding: 6px 0px;';
        // bubbletext.style.overflowY = bubbletext.scrollHeight > bubbletext.clientHeight ? 'scroll' : 'hidden';


        const selection = window.getSelection();
        if (!selection.rangeCount)
            {}
        else{
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            applyInitialPos(bubble, rect);
        }
        if(request.type === "explainHanzi") {
            let selectedText = window.getSelection().toString();
            selectedText = selectedText.trim();

            if(activeBubbles.length > 0) {
                let bubble = activeBubbles[activeBubbles.length - 1];
                applyInitialStyles(bubble);
                addBubbleInteractions(bubble);
                checkMouseOver(bubble);
            }
            if(request.shouldDelete){
                setTimeout(() => {
                    let bubble = activeBubbles[activeBubbles.length - 1];
                    removeBubbleFromDOM(bubble);
                    activeBubbles = activeBubbles.filter(b => b !== bubble);
                    bubble.removed = true; // Mark the object as removed
                }, 2000);
            }
            
        }
    }
    else if (request.type === "sendTranslatedChunk") {
        // fetch last bubble and add text to its content
        if(activeBubbles.length > 0) {
            let bubble = activeBubbles[activeBubbles.length - 1];
            let processed_chunk = request.translatedText;
            // check if chunk is \n and make it br
            processed_chunk = processed_chunk.split('\n').join('<br>');
            // get innerHTML of bubbletext
            bubble.bubbletext.innerHTML += processed_chunk;
        }
    }
    else if(request.type === "sendTranslationEnd") {
        console.log('transmition end');
        if(activeBubbles.length > 0) {
            let bubble = activeBubbles[activeBubbles.length - 1];
            applyInitialStyles(bubble);
            addBubbleInteractions(bubble);
            checkMouseOver(bubble);
        }
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "drawHanzi") {
        showHanzi();
    }
});


function explainHanzi(){
    // removeBubbleFromDOM();
    let style = null;
    if(!initializeStyle) {
        style = document.createElement('style');
        style.textContent = `
            .translation-bubble, .translation-bubble * {
                user-select: text; /* Allows text to be selected inside the bubble */
                color: rgba(10,10,10,1.0); /* Ensure text color is consistent */
                display: inline-block; /* Treat inline elements like block elements */
                white-space: nowrap; /* Prevents the collapse of whitespace */
                text-wrap: balance; /* Balance text wrapping */
            }
            .translation-bubble::selection, .translation-bubble *::selection {
                background: #FFD700; /* Gold background for the bubble */
                color: #000; /* Black text for the bubble */
            }
        `;
        document.head.appendChild(style);
        initializeStyle = true;
    }

    let bubblediv = document.createElement('div');
    bubblediv.setAttribute('id', 'translation-bubble');
    bubblediv.className = 'translation-bubble';
    // let lines = request.translatedText.split('\n').map(line => {
    //     line = line.trim();
    //     if (line.startsWith('*')) {
    //         line = `<i>${line.slice(1).trim()}</i>`;
    //     }
    //     line = line.split('. ').join('.<br>');
    //     line = line.split('." ').join('."<br>');
    //     return line;
    // });

    // create a text container
    let bubbletext = document.createElement('div');
    bubbletext.className = 'translation-bubble-text';
    bubbletext.innerHTML = request.translatedText;

    // bubblediv.innerHTML = request.translatedText;
    bubblediv.appendChild(bubbletext);
    document.body.appendChild(bubblediv);

    let bubble = new Bubble(bubblediv)
    bubble.bubbletext = bubbletext;
    activeBubbles.push(bubble);
    
    bubblediv.style.position = 'absolute';
    bubblediv.style.padding = '18px 24px';
    bubblediv.style.backgroundColor = 'rgba(255,255,255, 0.75)';
    bubblediv.style.border = 'none';
    bubblediv.style.borderRadius = '10px';
    bubblediv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    bubblediv.style.backdropFilter = 'blur(5px)';
    bubblediv.style.zIndex = '666';
    bubblediv.style.color = 'rgba(9,9,9,1.0)';
    bubblediv.style.fontSize = '16px';
    bubblediv.style.font = 'Roboto, sans-serif';

    bubbletext.style.cssText = 'scrollbar-width: none; max-height: 600px; max-width: 500px; overflow-y: scroll; padding: 6px 0px;';
    // bubbletext.style.overflowY = bubbletext.scrollHeight > bubbletext.clientHeight ? 'scroll' : 'hidden';


    const selection = window.getSelection();
    if (!selection.rangeCount)
        {}
    else{
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        applyInitialPos(bubble, rect);
    }
}


let rmouseX = 0;
let rmouseY = 0;
let mouseX = 0;
let mouseY = 0;


function applyInitialPos(bubbleobj, rect) {
    let bubble = bubbleobj.bubble;
    let x = 0;
    let y = 0;
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const padding = 50;

    // if (rect.left < 10 && rect.top < 10) {
    //     x = rmouseX + window.scrollX - bubbleWidth / 8;
    //     y = rmouseY + window.scrollY - bubbleHeight - 45;
    // } else {
    //     x = rect.left + window.scrollX - bubbleWidth / 8;
    //     y = rect.top + window.scrollY - bubbleHeight - 45;
    // }
    
    x = rmouseX + window.scrollX - bubbleWidth / 8;
    y = rmouseY + window.scrollY - bubbleHeight - 45;

    if(x + bubbleWidth > window.scrollX + windowWidth - padding)
        x = window.scrollX + windowWidth - padding - bubbleWidth;
    if(x < window.scrollX + padding)
        x = window.scrollX + padding;
    if(y + bubbleHeight > window.scrollY + windowHeight - padding)
        y = window.scrollY + windowHeight - padding - bubbleHeight;
    if(y < window.scrollY + padding)
        y = window.scrollY + padding;


    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
}


function applyInitialStyles(bubbleobj) {
    let bubble = bubbleobj.bubble;
    let x = 0;
    let y = 0;
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // const padding = 50;

    // // if (rect.left < 10 && rect.top < 10) {
    // //     x = rmouseX + window.scrollX - bubbleWidth / 8;
    // //     y = rmouseY + window.scrollY - bubbleHeight - 45;
    // // } else {
    // //     x = rect.left + window.scrollX - bubbleWidth / 8;
    // //     y = rect.top + window.scrollY - bubbleHeight - 45;
    // // }
    
    // x = rmouseX + window.scrollX - bubbleWidth / 8;
    // y = rmouseY + window.scrollY - bubbleHeight - 45;

    // if(x + bubbleWidth > window.scrollX + windowWidth - padding)
    //     x = window.scrollX + windowWidth - padding - bubbleWidth;
    // if(x < window.scrollX + padding)
    //     x = window.scrollX + padding;
    // if(y + bubbleHeight > window.scrollY + windowHeight - padding)
    //     y = window.scrollY + windowHeight - padding - bubbleHeight;
    // if(y < window.scrollY + padding)
    //     y = window.scrollY + padding;

    // applyInitialPos(bubbleobj, rect);

    // close button div
    const close = document.createElement('div');
    // set id
    close.setAttribute('id', 'translation-bubble-close');
    close.style.position = 'absolute';
    close.style.width = '16px';
    close.style.height = '16px';
    close.style.right = '2px';
    close.style.top = '2px';
    close.style.background = '#ffffff88';
    // slight shadow
    close.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    close.style.borderRadius = '50%';
    close.style.cursor = 'pointer';
    close.style.zIndex = '333';
    close.style.opacity = '0.0';
    close.style.transition = 'opacity 0.3s ease';
    // add event for closing
    close.addEventListener('click', function() {
        removeBubbleFromDOM(bubbleobj);
        activeBubbles = activeBubbles.filter(b => b !== bubbleobj);
        bubbleobj.removed = true; // Mark the object as removed
    });


    bubble.appendChild(close);
    bubbleobj.closebutton = close;
}

/*
document.addEventListener('click', function outsideClickListener(event) {
    if (event.target.id != 'translation-bubble' && event.target.id != 'translation-bubble-draggable' && event.target.id != 'translation-bubble-close') {
        activeBubbles.forEach(bubbleobj => {
            removeBubbleFromDOM(bubbleobj);
        });
        activeBubbles = [];
    }
});
*/

document.addEventListener('keydown', function(event) {
    if (event.key === 'q') {
        chrome.storage.local.get(['translationHistory'], function(result) {
            if (result.translationHistory) {
                const allInputs = result.translationHistory.map(translation => translation.inputText.trim()).join(" ");
                const allWords = allInputs.split(/\s+/).filter(word => word.length > 0);
                const uniqueWords = [...new Set(allWords)];
                const wordCount = allWords.length;
                const uniqueWordCount = uniqueWords.length;
                console.log(`Total number of input words:        ${wordCount}`);
                console.log(`Total number of unique input words: ${uniqueWordCount}`);
            } else {
                console.log('No translation history found.');
            }
        });
    }
});

let shouldSkipHanzi = false;
let mouseStartX = 0;
let mouseStartY = 0;

document.addEventListener('mousedown', function(event) {
    const selectedText = window.getSelection().toString();

    if (selectedText.length > 0){
        shouldSkipHanzi = true;
        console.log('will skip on release')
    }
    mouseStartX = event.clientX + window.scrollX;
    mouseStartY = event.clientY + window.scrollY;
});


// document.addEventListener('click', () => {
//     if (!isMouseOverHanzi) {
//         hanzicontainer.parentNode.removeChild(hanzicontainer);
//     }
// });

let isMouseOverHanzi = false;
let hanziwriter;
let isQuizState = false;
let quizComplete = false;

document.addEventListener('keydown', function(event) {
    if (event.key === 'q' && (!isQuizState || quizComplete)) {
        // console.log('isQuizState', isQuizState)
        quizComplete = false;
        hanziwriter.quiz(
            {
                onComplete: function() {
                    // hanziwriter.updateColor('strokeColor', 'rgb(233,244,255,0.6)')
                    quizComplete = true;
                    isQuizState = false;
                    // setInterval(() => {
                        // hanziwriter.updateColor('strokeColor', '#000000')
                    // }, 600);

                }
            }
        );
        isQuizState = true;
    }
});

let clickStartedOnHanzi = false;

document.addEventListener('mousedown', function(event) {
    clickStartedOnHanzi = isMouseOverHanzi;
    if (!isMouseOverHanzi && !clickStartedOnHanzi) {
        let hanzicontainers = document.getElementsByClassName('hanzi-container');
        for (let i = 0; i < hanzicontainers.length; i++) {
            hanzicontainers[i].style.transition = 'opacity 0.2s';
            hanzicontainers[i].style.opacity = '0';
            setTimeout(() => {
                hanzicontainers[i].parentNode.removeChild(hanzicontainers[i]);
                // remove event listerners
                isQuizState = false;
                isMouseOverHanzi = false;
                quizComplete = false;
            }, 200);
        }
    }
});

function showHanzi() {
    console.log('showing hanzi');
    if (!isMouseOverHanzi && !clickStartedOnHanzi) {
        let hanzicontainers = document.getElementsByClassName('hanzi-container');
        for (let i = 0; i < hanzicontainers.length; i++) {
            hanzicontainers[i].style.transition = 'opacity 0.2s';
            hanzicontainers[i].style.opacity = '0';
            setTimeout(() => {
                hanzicontainers[i].parentNode.removeChild(hanzicontainers[i]);
                // remove event listerners
                isQuizState = false;
                isMouseOverHanzi = false;
                quizComplete = false;
            }, 200);
        }
    }
    if(quizComplete){
        // hanziwriter.showCharacter();
        quizComplete = false;
        isQuizState = false;
        return;
    }

    let selectedText = window.getSelection().toString();
    selectedText = selectedText.trim();
    
    if (selectedText.length === 1 && /[\u4e00-\u9faf]/.test(selectedText)) {
        const hanzicontainer = document.createElement('div');
        document.body.appendChild(hanzicontainer);
        isQuizState = false;
        isMouseOverHanzi = false;
        hanzicontainer.style.position = 'absolute';
        hanzicontainer.style.left = rmouseX + 'px';
        hanzicontainer.style.top = rmouseY + 'px';
        hanzicontainer.style.zIndex = '9999';
        hanzicontainer.style.padding = '28px 28px';
        hanzicontainer.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
        hanzicontainer.style.border = 'none';
        hanzicontainer.style.borderRadius = '10px';
        hanzicontainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        hanzicontainer.style.backdropFilter = 'blur(5px)';
        hanzicontainer.style.transition = 'opacity 0.66s';
        hanzicontainer.style.opacity = '0';

        setTimeout(() => {
            hanzicontainer.style.opacity = '1.0';
        }, 20);

        const div = document.createElement('div');
        hanzicontainer.appendChild(div);
        hanzicontainer.className = 'hanzi-container';
        div.style.width = '200px'; // Ensure it matches the HanziWriter setup
        div.style.height = '200px';

        hanziwriter = HanziWriter.create(div, selectedText, {
            width: 200,
            height: 200,
            padding: 5,
            strokeAnimationSpeed: 2,
            delayBetweenStrokes: 220,
            strokeColor: '#151515',
            highlightColor: '#ddffef',
            showOutline: false,
            drawingWidth: 20,
            highlightOnComplete: true,
            drawingColor: '#151515',
            markStrokeCorrectAfterMisses: 6,
        });
        window.getSelection().removeAllRanges();

        hanzicontainer.addEventListener('mouseover', function() {
            isMouseOverHanzi = true;
            hanzicontainer.focus();
        });

        hanzicontainer.addEventListener('mouseout', function() {
            isMouseOverHanzi = false;
        });

        hanzicontainer.addEventListener('click', function() {
            if (!isQuizState) {
                hanziwriter.animateCharacter();
            }
        });
        


        // hanzicontainer.addEventListener('mouseout', function() {
        //     isMouseOver = false;
        //     setTimeout(() => {
        //         hanzicontainer.parentNode.removeChild(hanzicontainer);
        //     }, 2222); // Wait for 1 second before removing
        // });
        setTimeout(() => {
            hanziwriter.animateCharacter();
        }, 1000);
    }
    shouldSkipHanzi = false;
}


let timeouts = [];

function addBubbleInteractions(bubbleobj) {

    let bubble = bubbleobj.bubble;
    bubble.addEventListener('mousedown', function(event) {
        event.stopPropagation();  // Prevent the bubble from closing when clicked
    }, false);

    const draggableArea = document.createElement('div');
    // set id
    draggableArea.setAttribute('id', 'translation-bubble-draggable');
    draggableArea.style.width = '50px';
    draggableArea.style.height = '14px';
    draggableArea.style.position = 'absolute';
    draggableArea.style.top = '2px';
    draggableArea.style.left = '50%';
    draggableArea.style.transform = 'translateX(-50%)';
    draggableArea.style.cursor = 'move';
    draggableArea.style.background = '#ffffff88';
    draggableArea.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    draggableArea.style.borderRadius = '4px';
    draggableArea.style.cursor = 'pointer';
    draggableArea.style.zIndex = '333';
    draggableArea.style.opacity = '0.0';
    draggableArea.style.transition = 'opacity 0.3s ease';
    bubble.appendChild(draggableArea);

    bubbleobj.draggablearea = draggableArea;

    draggableArea.addEventListener('mousedown', function(event) {
        bubbleobj.dragged = true;
        offsetX = (event.clientX + window.scrollX - parseInt(bubble.style.left, 10));
        offsetY = (event.clientY + window.scrollY - parseInt(bubble.style.top, 10));
        event.preventDefault(); // Prevent text selection
    });
    
    draggableArea.addEventListener('mouseover', function(event) {
        let close = bubbleobj.closebutton;
        let drag = bubbleobj.draggablearea;
        close.style.opacity = '1.0';
        drag.style.opacity = '1.0';
        bubbleobj.overdragged = true;
        console.log('overdragged');
    });

    draggableArea.addEventListener('mouseout', function(event) {
        let close = bubbleobj.closebutton;
        let drag = bubbleobj.draggablearea;
        close.style.opacity = '0.0';
        drag.style.opacity = '0.0';
        bubbleobj.overdragged = false;
    });

    document.addEventListener('mousemove', function(event) {
        if (bubbleobj.dragged) {
            bubbleobj.setPos(
                event.clientX + window.scrollX - offsetX,
                event.clientY + window.scrollY - offsetY
            );
        }
    });
    
    document.addEventListener('mouseup', function() {
        bubbleobj.dragged = false;
        checkMouseOver(bubbleobj);
    });


    document.addEventListener('mousemove', function(event) {
        let x = event.clientX + window.scrollX;
        let y = event.clientY + window.scrollY;
        mouseX = x;
        mouseY = y;
        checkMouseOver(bubbleobj);
    });
}


function checkMouseOver(bubbleobj){
    let x = mouseX;
    let y = mouseY;
    let close = bubbleobj.closebutton;
    let drag = bubbleobj.draggablearea;
    let bubble = bubbleobj.bubble;
    let bubbleX = parseInt(bubble.style.left, 10);
    let bubbleY = parseInt(bubble.style.top, 10);
    let bubbleWidth = bubble.offsetWidth;
    let bubbleHeight = bubble.offsetHeight;
    if(x > bubbleX && x < bubbleX + bubbleWidth && y > bubbleY && y < bubbleY + bubbleHeight) {
        close.style.opacity = '1.0';
        drag.style.opacity = '1.0';
        bubbleobj.mouseover = true;
        clearTimeout(bubbleobj.fadeId);
        bubbleobj.fadeId = null;
        // after one second fade it back to 0.0
        if(!bubbleobj.dragged){
            if(!bubbleobj.fadeId){
                bubbleobj.fadeId = setTimeout(() => {
                    console.log('evoga')
                    if(!bubbleobj.overdragged){
                        close.style.opacity = '0.0';
                        drag.style.opacity = '0.0';
                    }
                }, 1000);
            }
        }
        if (bubbleobj.timeoutId) {
            clearTimeout(bubbleobj.timeoutId);
            bubbleobj.timeoutId = null;      
            console.log('cleared timeout');
        }
    } else {
        close.style.opacity = '0.0';
        drag.style.opacity = '0.0';
        if(bubbleobj.mouseover)
            resetTimeout(bubbleobj);
        bubbleobj.mouseover = false;
    }
}

function resetTimeout(bubbleobj) {
    console.log('reset timeout');
    if (bubbleobj.timeoutId) {
        clearTimeout(bubbleobj.timeoutId);
        bubbleobj.timeoutId = null;            
    }
    bubbleobj.timeoutId = setTimeout(() => {
        if (!bubbleobj.removed) {
            removeBubbleFromDOM(bubbleobj);
            activeBubbles = activeBubbles.filter(b => b !== bubbleobj);
            bubbleobj.removed = true; // Mark the object as removed
        }
    }, 3333);
}

function removeBubbleFromDOM(bubbleobj) {
    // Animate opacity from 1 to 0
    bubbleobj.bubble.style.transition = 'opacity 0.2';
    bubbleobj.closebutton.style.transition = 'opacity 0.2';
    bubbleobj.draggablearea.style.transition = 'opacity 0.2';

    bubbleobj.bubble.style.opacity = '0';
    bubbleobj.closebutton.style.opacity = '0';
    bubbleobj.draggablearea.style.opacity = '0';

    // Set a timeout to remove the elements from the DOM after the animation
    setTimeout(() => {
        bubbleobj.bubble.parentNode.removeChild(bubbleobj.bubble);
        bubbleobj.closebutton.parentNode.removeChild(bubbleobj.closebutton);
        bubbleobj.draggablearea.parentNode.removeChild(bubbleobj.draggablearea);
    }, 200);  // Delay of 1000 milliseconds
}