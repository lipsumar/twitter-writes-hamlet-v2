function extractWords(text: string): string[] {
  text = text.replace(/\n\n/gm, '   ').replace(/ /gm, '=').replace(/\n/gm, '=\n=');
  var words = text.split('=');
  return words;
}

function cleanWord(w: string): string {
  // — is a "tiret quadratin"
  // the - after is a regular one
  return w.replace(/(^[,.'":;!?\[—-]+)|([,.'":;!?\]—-]+$)/g, '');
};

export { extractWords, cleanWord }