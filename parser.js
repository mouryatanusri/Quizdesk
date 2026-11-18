function parseQuestions(text) {
  const questions = [];
  let current;
  let field;
  let prefixed = false;

  for (const raw of text.split(/[\r\n\f]+/)) {
    const line = raw.trim();
    if (!line || /^\d+$/.test(line) || /^MCQ QUESTION BANK$/i.test(line)) continue;

    const heading = line.match(/^(Q(?:uestion)?\s*)?(\d+)\s*[.)]\s*(.+)$/i);
    const option = line.match(/^\(?([A-Da-d])[.)\]:]\s*(.+)$/);
    const inlineOptions = /^\([A-D]\)\s/i.test(line)
      ? [...line.matchAll(/(?:^|\s)\(([A-D])\)\s+(.+?)(?=\s+\([A-D]\)\s|$)/gi)]
      : [];
    const key = line.match(/^(?:correct\s+)?answer\s*[:–-]\s*\(?([A-Da-d])\b/i);

    if (heading && (heading[1] || !prefixed)) {
      prefixed = Boolean(heading[1]);
      current = { number: Number(heading[2]), prompt: heading[3], options: {}, answer: null };
      questions.push(current);
      field = 'prompt';
    } else if (current && key) {
      current.answer = key[1].toUpperCase();
      field = null;
    } else if (current && /^solution\s*:/i.test(line)) {
      field = null;
    } else if (current && inlineOptions.length) {
      for (const [, letter, value] of inlineOptions) {
        field = letter.toUpperCase();
        current.options[field] = value;
      }
    } else if (current && option) {
      field = option[1].toUpperCase();
      current.options[field] = option[2];
    } else if (current && field === 'prompt') {
      current.prompt += ' ' + line;
    } else if (current && field) {
      current.options[field] += ' ' + line;
    }
  }

  return questions.filter(question => [...'ABCD'].every(letter => question.options[letter]));
}
