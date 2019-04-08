"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function extractWords(text) {
    text = text.replace(/\n\n/gm, '   ').replace(/ /gm, '=').replace(/\n/gm, '=\n=');
    var words = text.split('=');
    return words;
}
exports.extractWords = extractWords;
function cleanWord(w) {
    // — is a "tiret quadratin"
    // the - after is a regular one
    return w.replace(/(^[,.'":;!?\[—-]+)|([,.'":;!?\]—-]+$)/g, '');
}
exports.cleanWord = cleanWord;
;
