$(document).ready(function() {
    const $editor = $('#editor');
    const $suggestionBar = $('#suggestion-bar');
    let currentMatchStart = -1;
    let currentMatchEnd = -1;

    // ==========================================
    // 1. Real-time Typing Engine
    // ==========================================
    $editor.on('input', function() {
        let text = $editor.val();
        let cursorPos = $editor[0].selectionStart;
        let textBeforeCursor = text.substring(0, cursorPos);
        
        // Find the active English word being typed
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

    // ==========================================
    // 2. Keyboard Navigation (Enter, Space, Arrows)
    // ==========================================
    $editor.on('keydown', function(e) {
        let $suggestions = $('.suggestion-item');
        let $active = $('.suggestion-item.active');

        // If suggestions are on screen, hijack the specific keys
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

    // ==========================================
    // 3. Dictionary API & Rendering
    // ==========================================
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
            // Auto-select the first word so Space/Enter grabs it instantly
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
        
        // Piece string back together with the selected word and a trailing space
        $editor.val(before + malayalamWord + " " + after);
        
        // Reset cursor to directly after the newly inserted word
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

    // ==========================================
    // 4. Copy & DTP Conversion Pipeline
    // ==========================================
    
    // Copy Standard Unicode
    $('#btn-copy-unicode').on('click', function() {
        copyToClipboard($editor.val(), $(this), "📋 Copy Unicode");
    });

    // Copy and Convert to FML-TT
    $('#btn-copy-fml').on('click', function() {
        let unicodeText = $editor.val();
        let fmlText = convertUnicodeToFML(unicodeText);
        copyToClipboard(fmlText, $(this), "📋 FML-TT");
    });

    // Copy and Convert to ML-TT
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

    // ==========================================
    // 5. Advanced DTP Conversion Logic
    // ==========================================
    
    function convertUnicodeToFML(text) {
        let convertedText = text;

        // PHASE 1: Split Multi-part Vowels (ൊ, ോ, ൌ) into left and right components
        convertedText = convertedText.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ൊ/g, "െ$1ാ"); 
        convertedText = convertedText.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ോ/g, "േ$1ാ"); 
        convertedText = convertedText.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ൌ/g, "െ$1ൗ"); 

        // PHASE 2: Physically move left-side vowels (െ, േ, ൈ) to the front of the consonant/conjunct
        convertedText = convertedText.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*?)([െേൈ])/g, "$2$1");

        // PHASE 3: Map complex Conjuncts (koottaksharangal) FIRST
        // ** REPLACE THE "X", "Y", "Z" WITH YOUR ACTUAL FML-TT KEYBOARD CHARACTERS **
        convertedText = convertedText.replace(/ണ്[ടറ]/g, "X"); // Example: ണ്ട
        convertedText = convertedText.replace(/ങ്[ക]/g, "Y"); // Example: ങ്ക
        convertedText = convertedText.replace(/ഞ്[ച]/g, "Z"); // Example: ഞ്ച
        convertedText = convertedText.replace(/ക്[ക]/g, "W"); // Example: ക്ക
        // ADD MORE CONJUNCTS HERE: മ്പ, ന്ത, ങ്ങ, etc.

        // PHASE 4: Map Vowel Signs (Left side ones are already safely at the front)
        convertedText = convertedText.replace(/െ/g, "A"); // Replace "A" with FML E-sign
        convertedText = convertedText.replace(/േ/g, "B"); // Replace "B" with FML long E-sign
        convertedText = convertedText.replace(/ൈ/g, "C"); // Replace "C" with FML Ai-sign
        convertedText = convertedText.replace(/ാ/g, "D"); // Replace "D" with FML Aa-sign

        // PHASE 5: Map Single Consonants and Chillus
        convertedText = convertedText.replace(/ക/g, "k"); 
        convertedText = convertedText.replace(/ഖ/g, "K");
        // ADD THE REST OF THE ALPHABET HERE...

        // Clean up remaining Viramas (Chandrakkala)
        convertedText = convertedText.replace(/്/g, "v"); // Replace "v" with FML Chandrakkala

        return convertedText;
    }

    function convertUnicodeToML(text) {
        let convertedText = text;
        
        // Implement the same 5-phase structure here for ML-TT fonts.
        // The ML-TT mapping will use different ASCII characters than FML-TT,
        // but the regex grouping logic remains exactly the same.
        
        return convertedText; 
    }

    // ==========================================
    // 6. UI Utilities
    // ==========================================
    $('#btn-theme').on('click', function() {
        let $body = $('body');
        $body.attr('data-theme', $body.attr('data-theme') === 'dark' ? '' : 'dark');
    });
});