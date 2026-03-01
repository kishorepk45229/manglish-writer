$(document).ready(function() {
    const $editor = $('#editor');
    const $suggestionBar = $('#suggestion-bar');

    // Listen to every input in the textarea
    $editor.on('input', function() {
        let text = $editor.val();
        let cursorPos = $editor[0].selectionStart;

        // Extract the text right before the cursor
        let textBeforeCursor = text.substring(0, cursorPos);
        
        // Find the active English word being typed
        let match = textBeforeCursor.match(/([a-zA-Z]+)$/);

        if (match) {
            let currentEnglishWord = match[1];
            let startIdx = match.index;
            fetchSuggestions(currentEnglishWord, startIdx, cursorPos);
        } else {
            clearSuggestions();
        }
    });

    // Handle Spacebar to auto-select the first suggestion
    $editor.on('keydown', function(e) {
        if (e.key === ' ') {
            let firstSuggestion = $('.suggestion-item').first().text();
            
            if (firstSuggestion) {
                e.preventDefault(); // Stop the normal spacebar action
                $('.suggestion-item').first().click(); // Simulate clicking the top word
            }
        }
    });

    function fetchSuggestions(word, startIdx, endIdx) {
        let apiUrl = `https://inputtools.google.com/request?text=${word}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
        
        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                if (response[0] === 'SUCCESS') {
                    let suggestions = response[1][0][1];
                    renderSuggestions(suggestions, startIdx, endIdx);
                }
            },
            error: function() {
                $suggestionBar.html('<span style="color:red;">Error loading dictionary. Check internet or use a local server.</span>');
            }
        });
    }

    function renderSuggestions(words, startIdx, endIdx) {
        $suggestionBar.empty();
        
        words.forEach((word, index) => {
            // Highlight the first word as the default (what happens when you press space)
            let activeClass = index === 0 ? 'active' : '';
            let $badge = $(`<span class="suggestion-item ${activeClass}">${word}</span>`);
            
            // Handle clicking a word
            $badge.on('click', function() {
                replaceWord(word, startIdx, endIdx);
            });
            
            $suggestionBar.append($badge);
        });
    }

    function replaceWord(malayalamWord, startIdx, endIdx) {
        let text = $editor.val();
        
        // Piece the string back together with the new Malayalam word
        let before = text.substring(0, startIdx);
        let after = text.substring(endIdx);
        
        // Add a space after the inserted word
        $editor.val(before + malayalamWord + " " + after);
        
        // Move the cursor right after the newly inserted word and space
        let newCursorPos = startIdx + malayalamWord.length + 1;
        $editor[0].setSelectionRange(newCursorPos, newCursorPos);
        
        clearSuggestions();
        $editor.focus();
    }

    function clearSuggestions() {
        $suggestionBar.html('<span class="suggestion-placeholder">Type English words here (e.g., \'namaskaram\')...</span>');
    }

    // UI Utilities
    $('#btn-theme').on('click', function() {
        let $body = $('body');
        $body.attr('data-theme', $body.attr('data-theme') === 'dark' ? '' : 'dark');
    });

    $('#btn-copy').on('click', function() {
        navigator.clipboard.writeText($editor.val());
        let originalText = $(this).html();
        $(this).html('✅ Copied!');
        setTimeout(() => $(this).html(originalText), 2000);
    });
});