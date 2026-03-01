$(document).ready(function() {
    const $editor = $('#editor');
    const $suggestionBar = $('#suggestion-bar');
    let currentMatchStart = -1;
    let currentMatchEnd = -1;

    // --- 1. Real-time Typing Engine ---
    $editor.on('input', function() {
        let text = $editor.val();
        let cursorPos = $editor[0].selectionStart;
        let textBeforeCursor = text.substring(0, cursorPos);
        
        let match = textBeforeCursor.match(/([a-zA-Z]+)$/);

        if (match) {
            let currentEnglishWord = match[1];
            currentMatchStart = match.index;
            currentMatchEnd = cursorPos;
            fetchSuggestions(currentEnglishWord);
        } else {
            clearSuggestions();
        }
    });

    // --- 2. Keyboard Navigation (Enter, Space, Arrows) ---
    $editor.on('keydown', function(e) {
        let $suggestions = $('.suggestion-item');
        let $active = $('.suggestion-item.active');

        // If suggestions are on screen, hijack the keys
        if ($suggestions.length > 0) {
            
            // ENTER or SPACE: Insert the active word
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Stop newline or regular space
                if ($active.length) {
                    $active.click(); 
                }
            } 
            // RIGHT ARROW: Move selection right
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                let $next = $active.next('.suggestion-item');
                if ($next.length) {
                    $active.removeClass('active');
                    $next.addClass('active');
                }
            } 
            // LEFT ARROW: Move selection left
            else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                let $prev = $active.prev('.suggestion-item');
                if ($prev.length) {
                    $active.removeClass('active');
                    $prev.addClass('active');
                }
            }
        }
    });

    // --- 3. Dictionary API & Rendering ---
    function fetchSuggestions(word) {
        let apiUrl = `https://inputtools.google.com/request?text=${word}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
        
        $.get(apiUrl, function(response) {
            if (response[0] === 'SUCCESS') {
                renderSuggestions(response[1][0][1]);
            }
        });
    }

    function renderSuggestions(words) {
        $suggestionBar.empty();
        
        words.forEach((word, index) => {
            // Auto-select the first word
            let activeClass = index === 0 ? 'active' : '';
            let $badge = $(`<span class="suggestion-item ${activeClass}">${word}</span>`);
            
            $badge.on('click', function() {
                replaceWord(word);
            });
            
            $suggestionBar.append($badge);
        });
    }

    function replaceWord(malayalamWord) {
        let text = $editor.val();
        let before = text.substring(0, currentMatchStart);
        let after = text.substring(currentMatchEnd);
        
        $editor.val(before + malayalamWord + " " + after);
        
        let newCursorPos = currentMatchStart + malayalamWord.length + 1;
        $editor[0].setSelectionRange(newCursorPos, newCursorPos);
        
        clearSuggestions();
        $editor.focus();
    }

    function clearSuggestions() {
        $suggestionBar.html('<span class="suggestion-placeholder">Type English words here (e.g., \'namaskaram\')...</span>');
        currentMatchStart = -1;
        currentMatchEnd = -1;
    }

    // --- 4. Copy & DTP Conversion Pipeline ---
    
    // Standard Unicode Copy
    $('#btn-copy-unicode').on('click', function() {
        copyToClipboard($editor.val(), $(this), "📋 Copy Unicode");
    });

    // FML-TT Copy Pipeline
    $('#btn-copy-fml').on('click', function() {
        let unicodeText = $editor.val();
        let fmlText = convertUnicodeToFML(unicodeText);
        copyToClipboard(fmlText, $(this), "📋 FML-TT");
    });

    // ML-TT Copy Pipeline
    $('#btn-copy-ml').on('click', function() {
        let unicodeText = $editor.val();
        let mlText = convertUnicodeToML(unicodeText);
        copyToClipboard(mlText, $(this), "📋 ML-TT");
    });

    function copyToClipboard(text, $btnElement, originalText) {
        navigator.clipboard.writeText(text).then(() => {
            $btnElement.html('✅ Copied!');
            setTimeout(() => $btnElement.html(originalText), 2000);
        });
    }

    // --- Font Conversion Logic Hub ---
    function convertUnicodeToFML(text) {
        // PASTE YOUR UNICODE-TO-FML MAPPING ARRAY LOGIC HERE
        // Example structure:
        // text = text.replace(/ക/g, "I"); 
        // text = text.replace(/ഖ/g, "J");
        return text; // Currently returns raw text until you paste your map
    }

    function convertUnicodeToML(text) {
        // PASTE YOUR UNICODE-TO-ML MAPPING ARRAY LOGIC HERE
        return text; 
    }

    // Dark Mode
    $('#btn-theme').on('click', function() {
        let $body = $('body');
        $body.attr('data-theme', $body.attr('data-theme') === 'dark' ? '' : 'dark');
    });
});