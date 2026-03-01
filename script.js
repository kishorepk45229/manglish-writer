$(document).ready(function() {
    const $editor = $('#editor');
    const $suggestionBar = $('#suggestion-bar');
    let currentEnglishWord = "";
    let savedSelection = null;

    // --- 1. Rich Text & Typography Formatting ---
    $('.format-btn').on('click', function(e) {
        e.preventDefault();
        let command = $(this).data('command');
        document.execCommand(command, false, null);
        $editor.focus();
    });

    $('#font-selector').on('change', function() {
        let selectedFont = $(this).val();
        document.execCommand('fontName', false, selectedFont);
        $editor.focus();
    });

    // --- 2. Transliteration & Live Dictionary ---
    $editor.on('keyup', function(e) {
        // Ignore navigation/control keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift", "Control", "Alt", "Meta", "Enter", "Backspace"].includes(e.key)) {
            if (e.key === "Backspace") fetchCurrentWord();
            return;
        }

        if (e.key === ' ') {
            // Spacebar pressed: auto-select top suggestion if available
            if (currentEnglishWord !== "") {
                let topSuggestion = $('.suggestion-item').first().text();
                if (topSuggestion) {
                    replaceWord(topSuggestion + "\u00A0"); // Non-breaking space
                }
            }
        } else {
            // Normal typing: fetch active word
            fetchCurrentWord();
        }
    });

    function fetchCurrentWord() {
        saveSelection();
        let textBeforeCursor = getTextBeforeCursor();
        let match = textBeforeCursor.match(/([a-zA-Z]+)$/); // Look for trailing English chars

        if (match) {
            currentEnglishWord = match[1];
            fetchSuggestionsFromGoogle(currentEnglishWord);
        } else {
            clearSuggestions();
            currentEnglishWord = "";
        }
    }

    function fetchSuggestionsFromGoogle(word) {
        let apiUrl = `https://inputtools.google.com/request?text=${word}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
        
        $.get(apiUrl, function(response) {
            if (response[0] === 'SUCCESS') {
                let suggestions = response[1][0][1];
                renderSuggestions(suggestions);
            }
        });
    }

    function renderSuggestions(words) {
        $suggestionBar.empty();
        words.forEach(word => {
            let $badge = $(`<span class="suggestion-item">${word}</span>`);
            $badge.on('click', function(e) {
                e.preventDefault();
                replaceWord(word + "\u00A0");
                $editor.focus();
            });
            $suggestionBar.append($badge);
        });
    }

    function clearSuggestions() {
        $suggestionBar.html('<span class="suggestion-placeholder">Type in Manglish (e.g., \'namaskaram\') to see suggestions...</span>');
    }

    function replaceWord(malayalamText) {
        restoreSelection();
        
        // Delete the English letters just typed
        for(let i=0; i < currentEnglishWord.length; i++) {
            document.execCommand("delete", false, null);
        }
        
        // Insert the Malayalam text securely
        document.execCommand("insertText", false, malayalamText);
        clearSuggestions();
        currentEnglishWord = "";
    }

    // --- 3. Cursor Tracking Utilities ---
    function getTextBeforeCursor() {
        let selection = window.getSelection();
        if (selection.rangeCount > 0) {
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents($editor[0]);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            return preCaretRange.toString();
        }
        return "";
    }

    function saveSelection() {
        let sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            savedSelection = sel.getRangeAt(0);
        }
    }

    function restoreSelection() {
        if (savedSelection) {
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
    }

    // --- 4. Global UI Actions ---
    $('#btn-theme').on('click', function() {
        let $body = $('body');
        if ($body.attr('data-theme') === 'dark') {
            $body.removeAttr('data-theme');
            $(this).text('🌙');
        } else {
            $body.attr('data-theme', 'dark');
            $(this).text('☀️');
        }
    });

    $('#btn-copy').on('click', function() {
        navigator.clipboard.writeText($editor[0].innerText);
        let originalText = $(this).html();
        $(this).html('✅ Copied!');
        setTimeout(() => $(this).html(originalText), 2000);
    });

    $('#btn-export').on('click', function() {
        let htmlContent = $editor.html();
        let blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = "draft_export.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});