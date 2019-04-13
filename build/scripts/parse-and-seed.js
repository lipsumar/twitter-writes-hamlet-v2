"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lib_1 = require("../lib");
var fs = require('fs');
var text = fs.readFileSync(__dirname + '/../../resources/hamlet.txt').toString();
var lines = text.split('\n');
var dialogLines = [];
var lastWasName = false;
var openTextTag = false;
var titleOut = false;
var lastWasScene = false;
var lastWasDialog = false;
var openTextDialogTag = false;
var lastWasDirection = false;
var allWords = lib_1.extractWords(text);
var nextWordI = 0;
var sequentialNextWordI = 0;
var queue = [];
function out(html, s, split) {
    //console.log('out', html, s);
    var splitI = sequentialNextWordI;
    if (s) {
        var words = lib_1.extractWords(s);
        var sReplaced = '';
        words.forEach(function (word) {
            var clean = lib_1.cleanWord(word);
            if (clean) {
                if (clean.toLowerCase() !== lib_1.cleanWord(allWords[nextWordI]).toLowerCase()) {
                    console.log(s);
                    console.log(clean, '!=', allWords[nextWordI], '\n -1=', allWords[nextWordI - 1], '\n +1=', allWords[nextWordI + 1]);
                    process.exit();
                }
                var acceptable = [];
                // further split composed words like free-footed
                // => accept "free footed"
                // => accept "freefooted"
                var parts = clean.split('-');
                if (parts.length > 1) {
                    acceptable.push(parts.join(' '));
                    acceptable.push(parts.join(''));
                }
                queue.push({
                    index: sequentialNextWordI,
                    word: word,
                    clean: clean,
                    acceptable: acceptable,
                    found_in_twitter: 0
                });
                sReplaced += '<span data-i="' + sequentialNextWordI + '">' + word + '</span> ';
                nextWordI++;
                sequentialNextWordI++;
                if (typeof (allWords[nextWordI]) === 'undefined') {
                    //console.log('last word', word);
                    return;
                }
                while (!allWords[nextWordI].trim()) {
                    nextWordI++;
                    if (typeof (allWords[nextWordI]) === 'undefined') {
                        //console.log('last word', word);
                        return;
                    }
                }
            }
            else {
                sReplaced += word;
            }
        });
        html = html.split('%s').join(sReplaced);
    }
    if (split) {
        html = '@split-token@' + splitI + '===' + html;
    }
    dialogLines.push(html);
}
lines.forEach(function (line, i) {
    line = line.trim();
    var nextLine = lines[i + 1];
    if (typeof nextLine === 'undefined' || nextLine === '') {
        lastWasScene = true;
    }
    if (line === '')
        return;
    if (line.substring(0, 4) === 'ACT ') {
        if (openTextDialogTag) {
            out('</div></div>');
            openTextDialogTag = false;
        }
        if (openTextTag) {
            out('\t\t</div>');
            openTextTag = false;
        }
        out('<div class="text__act">%s</div>', line);
        lastWasDialog = false;
        lastWasDirection = false;
        return;
    }
    if (line.substring(0, 6) === 'SCENE ') {
        if (openTextDialogTag) {
            out('</div></div>');
            openTextDialogTag = false;
        }
        if (openTextTag) {
            out('\t\t</div>');
            openTextTag = false;
        }
        out('<div class="text__scene">%s</div>', line);
        lastWasScene = true;
        lastWasDialog = false;
        lastWasDirection = false;
        return;
    }
    if (line === line.toUpperCase()) {
        if (openTextTag) {
            out('\t\t</div>');
        }
        if (!lastWasDialog) {
            out('<div class="text__dialog">\n\t<div class="dialog">');
            openTextDialogTag = true;
        }
        out('\t\t<div class="dialog__name">%s</div>', line);
        lastWasName = true;
        lastWasDialog = true;
        lastWasDirection = false;
    }
    else {
        if (lastWasName) {
            out('\t\t<div class="dialog__text">');
            openTextTag = true;
        }
        if (!titleOut) {
            out('0===<div class="text__title text__title--1">%s</div>', 'The Tragedy of');
            out('<div class="text__title text__title--2">%s</div>', 'Hamlet');
            out('<div class="text__title text__title--3">%s</div>', 'Prince of Denmark');
            titleOut = true;
            lastWasDialog = false;
            lastWasDirection = false;
        }
        else {
            if (lastWasScene) {
                if (openTextTag) {
                    out('\t\t</div>');
                    openTextTag = false;
                }
                if (openTextDialogTag) {
                    out('\t</div>\n</div>');
                    openTextDialogTag = false;
                }
                out('<div class="text__stage-direction">%s</div>', line, true);
                lastWasDirection = true;
                lastWasScene = false;
                lastWasDialog = false;
            }
            else {
                if (lastWasDirection) {
                    out('<div class="text__dialog">\n\t<div class="dialog"><div class="dialog__name"></div><div class="dialog__text">');
                    openTextDialogTag = true;
                    openTextTag = true;
                    //lastWasName = true;
                    lastWasDialog = true;
                }
                out('\t\t\t<div>%s</div>', line);
                lastWasDirection = false;
            }
        }
        lastWasName = false;
    }
});
fs.writeFileSync(__dirname + '/../../mongo-seed/words.json', JSON.stringify(queue));
var hamletHtml = dialogLines.join('\n');
var hamletHtmlParts = hamletHtml.split('@split-token@');
var savedHamletHtmlPartsCount = 0;
var htmlQueue = [];
var htmlPieceIndex = [];
hamletHtmlParts.forEach(function (section) {
    var parts = section.split('===');
    var partI = parseInt(parts[0], 10);
    htmlQueue.push({
        html: parts[1],
        index: partI
    });
    htmlPieceIndex.push(partI);
});
console.log(hamletHtmlParts.length + ' parts');
function processHtmlQueue() {
    var item = htmlQueue.shift();
    if (item) {
        fs.writeFileSync(__dirname + '/../../html-pieces/htmlPiece-' + item.index, item.html);
        savedHamletHtmlPartsCount++;
        //console.log('parts saved: ' + Math.round((savedHamletHtmlPartsCount/hamletHtmlParts.length)*100)+'%');
        processHtmlQueue();
    }
}
fs.writeFileSync(__dirname + '/../../html-pieces/htmlPieceIndex.json', JSON.stringify(htmlPieceIndex));
processHtmlQueue();
//fs.writeFileSync('hamlet.html', fs.readFileSync('tpl/hamlet-header.html') + hamletHtml + fs.readFileSync('tpl/hamlet-footer.html'));
