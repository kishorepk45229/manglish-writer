$(document).ready(function() {
    const $editor = $('#editor');
    const $suggestionBar = $('#suggestion-bar');
    let activeEnglishWord = "";

    // ==========================================
    // 1. Rich Text Formatting Support
    // ==========================================
    $('.format-btn').on('click', function(e) {
        e.preventDefault();
        document.execCommand($(this).data('command'), false, null);
        $editor.focus();
    });

    $('#font-selector').on('change', function() {
        document.execCommand('fontName', false, $(this).val());
        $editor.focus();
    });

    // ==========================================
    // 2. Real-time ContentEditable Dictionary
    // ==========================================
    $editor.on('keyup', function(e) {
        // Ignore navigation keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift", "Control", "Meta"].includes(e.key)) return;

        let word = getWordBeforeCaret();
        
        if (word && /^[a-zA-Z]+$/.test(word)) {
            activeEnglishWord = word;
            fetchSuggestions(word);
        } else {
            clearSuggestions();
            activeEnglishWord = "";
        }
    });

    $editor.on('keydown', function(e) {
        let $active = $('.suggestion-item.active');
        if ($('.suggestion-item').length > 0) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if ($active.length) replaceWordInEditor($active.text() + "\u00A0"); // \u00A0 is non-breaking space
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                let $next = $active.next('.suggestion-item');
                if ($next.length) { $active.removeClass('active'); $next.addClass('active'); }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                let $prev = $active.prev('.suggestion-item');
                if ($prev.length) { $active.removeClass('active'); $prev.addClass('active'); }
            }
        }
    });

    function getWordBeforeCaret() {
        let sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let range = sel.getRangeAt(0);
        let node = range.startContainer;
        if (node.nodeType === 3) { // Text node
            let text = node.textContent.substring(0, range.startOffset);
            let match = text.match(/([a-zA-Z]+)$/);
            return match ? match[1] : null;
        }
        return null;
    }

    function replaceWordInEditor(malayalamText) {
        if (!activeEnglishWord) return;
        
        // Use native execCommand to delete the English characters safely
        for(let i = 0; i < activeEnglishWord.length; i++) {
            document.execCommand("delete", false, null);
        }
        // Insert Malayalam text keeping current HTML styles (bold, etc.) intact
        document.execCommand("insertText", false, malayalamText);
        
        clearSuggestions();
        activeEnglishWord = "";
    }

    function fetchSuggestions(word) {
        $.get(`https://inputtools.google.com/request?text=${word}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`, function(res) {
            if (res[0] === 'SUCCESS') renderSuggestions(res[1][0][1]);
        });
    }

    function renderSuggestions(words) {
        $suggestionBar.empty();
        words.forEach((word, i) => {
            let $badge = $(`<span class="suggestion-item ${i === 0 ? 'active' : ''}">${word}</span>`);
            $badge.on('click', function() { replaceWordInEditor(word + "\u00A0"); });
            $suggestionBar.append($badge);
        });
    }

    function clearSuggestions() {
        $suggestionBar.html('<span class="suggestion-placeholder">Type English words here...</span>');
    }

    // ==========================================
    // 3. FML-TT Conversion Engine (Expanded)
    // ==========================================
    $('#btn-copy-fml').on('click', function() {
        // Grab raw text (strips HTML tags for DTP pasting)
        let text = $editor[0].innerText; 
        
        // --- PHASE 1: Vowel Splitting ---
        text = text.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ൊ/g, "െ$1ാ"); 
        text = text.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ോ/g, "േ$1ാ"); 
        text = text.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*)ൌ/g, "െ$1ൗ"); 

        // --- PHASE 2: Left Vowel Reordering ---
        text = text.replace(/([ക-ഹൺ-ൿ](?:്[ക-ഹൺ-ൿ])*?)([െേൈ])/g, "$2$1");

        // --- PHASE 3: Conjuncts (koottaksharangal) ---
        // Using standard FML mapping characters
        text = text.replace(/ക്[ക]/g, "¡"); // ക്ക
        text = text.replace(/ങ്[ക]/g, "§"); // ങ്ക
        text = text.replace(/ച്[ച]/g, "ച്ച"); // Update with your specific FML char
        text = text.replace(/ഞ്[ച]/g, "©"); // ഞ്ച
        text = text.replace(/ട്[ട]/g, "¶"); // ട്ട
        text = text.replace(/ണ്[ട]/g, "ണ്ട"); // Update with your specific FML char
        text = text.replace(/ത്[ത]/g, "ˆ"); // ത്ത
        text = text.replace(/ന്[ത]/g, "´"); // ന്ത
        text = text.replace(/ന്[ന]/g, "¡"); // ന്ന
        text = text.replace(/പ്[പ]/g, "¸"); // പ്പ
        text = text.replace(/മ്[പ]/g, "¼"); // മ്പ
        text = text.replace(/മ്[മ]/g, "½"); // മ്മ
        
        // --- PHASE 4: Left & Right Vowel Signs ---
        text = text.replace(/െ/g, "s"); // E-sign
        text = text.replace(/േ/g, "t"); // Long E-sign
        text = text.replace(/ൈ/g, "ൈ"); // Ai-sign
        text = text.replace(/ാ/g, "m"); // Aa-sign
        text = text.replace(/ി/g, "n"); // i-sign
        text = text.replace(/ീ/g, "o"); // ii-sign
        text = text.replace(/ു/g, "p"); // u-sign
        text = text.replace(/ൂ/g, "q"); // uu-sign
        
        // --- PHASE 5: Standard Alphabet & Chillus ---
        // Vowels
        text = text.replace(/അ/g, "A");
        text = text.replace(/ആ/g, "B");
        text = text.replace(/ഇ/g, "C");
        text = text.replace(/ഈ/g, "D");
        text = text.replace(/ഉ/g, "E");
        
        // Consonants
        text = text.replace(/ക/g, "I"); 
        text = text.replace(/ഖ/g, "J");
        text = text.replace(/ഗ/g, "K");
        text = text.replace(/ഘ/g, "L");
        text = text.replace(/ങ/g, "M");
        text = text.replace(/ച/g, "N");
        text = text.replace(/ഛ/g, "O");
        text = text.replace(/ജ/g, "P");
        text = text.replace(/ഝ/g, "Q");
        text = text.replace(/ഞ/g, "R");
        text = text.replace(/ട/g, "S");
        text = text.replace(/ഠ/g, "T");
        text = text.replace(/ഡ/g, "U");
        text = text.replace(/ഢ/g, "V");
        text = text.replace(/ണ/g, "W");
        text = text.replace(/ത/g, "X");
        text = text.replace(/ഥ/g, "Y");
        text = text.replace(/ദ/g, "Z");
        text = text.replace(/ധ/g, "a");
        text = text.replace(/ന/g, "b");
        text = text.replace(/പ/g, "c");
        text = text.replace(/ഫ/g, "d");
        text = text.replace(/ബ/g, "e");
        text = text.replace(/ഭ/g, "f");
        text = text.replace(/മ/g, "g");
        text = text.replace(/യ/g, "h");
        text = text.replace(/ര/g, "i");
        text = text.replace(/ല/g, "j");
        text = text.replace(/വ/g, "k");
        text = text.replace(/ശ/g, "l");
        text = text.replace(/ഷ/g, "m");
        text = text.replace(/സ/g, "n");
        text = text.replace(/ഹ/g, "o");
        text = text.replace(/ള/g, "p");
        text = text.replace(/ഴ/g, "q");
        text = text.replace(/റ/g, "r");

        // Virama (Chandrakkala)
        text = text.replace(/്/g, "v"); 

        navigator.clipboard.writeText(text);
        let $btn = $(this);
        $btn.text('Copied!');
        setTimeout(() => $btn.text('Copy FML-TT'), 2000);
    });

    // Copy Unicode
    $('#btn-copy-unicode').on('click', function() {
        navigator.clipboard.writeText($editor[0].innerText);
        let $btn = $(this);
        $btn.text('Copied!');
        setTimeout(() => $btn.text('Copy Unicode'), 2000);
    });

    // Dark Mode
    $('#btn-theme').on('click', function() {
        $('body').toggleClass('dark-theme');
        let icon = $('body').hasClass('dark-theme') ? 'ph-sun' : 'ph-moon';
        $(this).html(`<i class="ph ${icon}"></i>`);
    });
});