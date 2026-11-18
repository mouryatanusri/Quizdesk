const byId = id => document.getElementById(id);
const screens = ['landing', 'setup', 'quiz', 'results'];
const endDialog = byId('end-dialog');
let questions = [];
let fileName = '';
let options = {};
let mode = 'practice';
let quiz = [];
let selections = [];
let position = 0;
let busy = false;

function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function button(label, onClick, className = 'primary') {
  const element = node('button', label, className);
  element.type = 'button';
  element.addEventListener('click', onClick);
  return element;
}

function show(screen, focus = true) {
  screens.forEach(id => { byId(id).hidden = id !== screen; });
  if (!focus) return;
  const heading = byId(screen).querySelector('h1, h2');
  heading.tabIndex = -1;
  heading.focus();
}

function status(message, error = false) {
  const element = byId('status');
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('error', error);
}

function home() {
  if (busy) return;
  status('');
  show('landing');
}

function toggle(label, description, setting) {
  const control = button('', () => {
    options[setting] = !options[setting];
    control.setAttribute('aria-pressed', String(options[setting]));
  }, 'toggle');
  control.setAttribute('aria-pressed', String(Boolean(options[setting])));
  const copy = node('span', undefined, 'toggle-copy');
  copy.append(node('strong', label), node('small', description));
  const indicator = node('span', undefined, 'switch');
  indicator.setAttribute('aria-hidden', 'true');
  control.append(copy, indicator);
  return control;
}

function setup(reset = false) {
  if (reset) {
    options = {};
    mode = 'practice';
  }
  const panel = byId('setup');
  const keyed = questions.filter(question => question.answer).length;
  const countRow = node('label', undefined, 'count-row');
  const countCopy = node('span', undefined, 'toggle-copy');
  countCopy.append(
    node('strong', 'Number of questions'),
    node('small', 'Uses the first questions in PDF order. Turn on Shuffle questions for a random selection.'),
  );
  const countSelect = node('select');
  for (const amount of [questions.length, ...[3, 10, 20, 50, 100].filter(value => value < questions.length)]) {
    const entry = node('option', amount === questions.length ? 'All (' + amount + ')' : String(amount));
    entry.value = amount;
    countSelect.append(entry);
  }
  countSelect.value = options.count ?? questions.length;
  countSelect.addEventListener('change', () => { options.count = Number(countSelect.value); });
  countRow.append(countCopy, countSelect);
  const settings = node('div', undefined, 'settings');
  settings.append(
    toggle('Shuffle questions', 'Randomize the order of the questions.', 'shuffleQuestions'),
    toggle('Shuffle options', 'Randomize the choices within each question.', 'shuffleOptions'),
  );
  const modes = node('fieldset', undefined, 'mode-picker');
  modes.append(node('legend', 'Quiz mode'));
  for (const [value, label, description] of [
    ['practice', 'Practice', 'See feedback as soon as you answer.'],
    ['test', 'Test', 'Answer every question to see your marks.'],
  ]) {
    const card = node('label', undefined, 'mode-card');
    const input = node('input');
    input.type = 'radio';
    input.name = 'quiz-mode';
    input.value = value;
    input.checked = mode === value;
    input.addEventListener('change', () => { mode = value; });
    const copy = node('span', undefined, 'toggle-copy');
    copy.append(node('strong', label), node('small', description));
    card.append(input, copy);
    modes.append(card);
  }
  const actions = node('div', undefined, 'row actions');
  actions.append(button('Choose another PDF', home, 'secondary'), button('Start quiz', start));
  panel.replaceChildren(
    node('div', fileName, 'meta'),
    node('h2', 'Set up your quiz'),
node('p', `${questions.length} ${questions.length === 1 ? 'question' : 'questions'} ready. Make this round yours!`),    modes,
    countRow,
    settings,
  );
  if (keyed < questions.length) {
    const details = node('details', undefined, 'key-editor');
    details.append(node('summary', 'Answer key (' + keyed + ' of ' + questions.length + ' found)'));
    details.append(node('p', 'Add missing answers so those questions can earn credit.'));
    const list = node('div', undefined, 'keylist');
    questions.forEach(question => {
      const row = node('label', undefined, 'keyrow');
      const select = node('select');
      for (const letter of ['', ...'ABCD']) {
        const entry = node('option', letter ? letter + '. ' + question.options[letter] : 'Unscored');
        entry.value = letter;
        select.append(entry);
      }
      select.value = question.answer || '';
      select.addEventListener('change', () => { question.answer = select.value || null; });
      row.append(node('span', question.number + '. ' + question.prompt), select);
      list.append(row);
    });
    details.append(list);
    panel.append(details);
  }
  panel.append(actions);
  show('setup');
}

function start() {
  quiz = makeQuiz(questions, options);
  selections = Array(quiz.length).fill(null);
  position = 0;
  renderQuestion();
}

function renderQuestion(focus = true) {
  const question = quiz[position];
  const panel = byId('quiz');
  const selected = selections[position];
  const answered = selections.filter(value => value !== null).length;
  const remaining = quiz.length - answered;
  const showFeedback = mode === 'practice' && selected !== null && question.answer;
  const metadata = node('div', undefined, 'row meta');
  const modeLabel = mode === 'practice' ? 'Practice' : 'Test';
  metadata.append(node('span', modeLabel + ' · Question ' + (position + 1) + ' of ' + quiz.length), node('span', answered + ' answered'));
  const progress = node('progress', undefined, 'progress');
  progress.max = quiz.length;
  progress.value = answered;
  progress.setAttribute('aria-label', 'Questions answered');
  const choices = node('div');
  question.choices.forEach((choice, index) => {
    const control = button('', () => {
      if (showFeedback) return;
      selections[position] = index;
      renderQuestion(false);
      panel.querySelectorAll('.option')[index].focus();
    }, 'option');
    control.setAttribute('aria-pressed', String(selected === index));
    if (showFeedback) {
      control.setAttribute('aria-disabled', 'true');
      if (choice.correct) control.classList.add('right');
      else if (selected === index) control.classList.add('wrong');
    }
    control.append(node('b', 'ABCD'[index]), node('span', choice.text));
    if (showFeedback && (choice.correct || selected === index)) {
      control.append(node('span', choice.correct ? 'Correct' : 'Incorrect', 'choice-label'));
    }
    choices.append(control);
  });

  const feedback = node('div', undefined, 'question-feedback');
  if (showFeedback) {
    const correctIndex = question.choices.findIndex(choice => choice.correct);
    const correct = selected === correctIndex;
    feedback.classList.add(correct ? 'good' : 'missed');
    feedback.textContent = correct ? 'Correct!' : 'Incorrect. The correct answer is ' + 'ABCD'[correctIndex] + '.';
  } else if (mode === 'practice' && selected !== null) {
    feedback.textContent = 'No answer key is available for this question.';
  }
  const actions = node('div', undefined, 'row actions');
  const previous = button('← Previous', () => { position--; renderQuestion(); }, 'secondary');
  previous.disabled = position === 0;
  const last = position === quiz.length - 1;
  if (!last) {
    actions.append(previous, button('Next →', () => { position++; renderQuestion(); }));
  } else if (mode === 'test' && remaining) {
    feedback.textContent = remaining + (remaining === 1 ? ' question left to answer.' : ' questions left to answer.');
    actions.append(previous, button('Go to unanswered question', () => {
      position = selections.indexOf(null);
      renderQuestion();
    }));
  } else {
    actions.append(previous, button(mode === 'test' ? 'Submit test' : 'See results', () => results()));
  }
  if (!last && mode === 'test' && !remaining) actions.append(button('Submit test', () => results()));
  const end = node('div', undefined, 'end-actions');
  end.append(button('End the test', requestEnd, 'end-link'));
  panel.replaceChildren(metadata, progress, node('h2', question.prompt), choices, feedback, actions, end);
  show('quiz', focus);
}

function requestEnd() {
  const remaining = selections.filter(value => value === null).length;
  byId('end-message').textContent = remaining
    ? 'Do you really want to end before completing all the questions? ' + remaining +
      (remaining === 1 ? ' question will be marked unanswered.' : ' questions will be marked unanswered.')
    : 'Do you want to finish and view your results?';
  endDialog.returnValue = 'cancel';
  endDialog.showModal();
}

endDialog.addEventListener('close', () => {
  if (endDialog.returnValue === 'end') results({ endEarly: true });
});

function results({ endEarly = false } = {}) {
  if (mode === 'test' && !endEarly && selections.includes(null)) return;
  const panel = byId('results');
  const { correct, incorrect, unanswered, ungraded, total, percent } = scoreQuiz(quiz, selections);
  const summary = node('div', undefined, 'card result-head');
  summary.append(node('h2', mode === 'test' ? 'Your test results' : 'Your practice results'));
  if (percent !== null) {
    const formatted = percent > 0 && percent < 0.01
      ? '<0.01'
      : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(percent);
    summary.append(node('strong', formatted + '%', 'score'), node('p', correct + ' of ' + total + ' quiz questions correct.'));
  } else {
    summary.append(node('p', 'No answer key was available. Your choices are listed below.'));
  }
  const counts = node('ul', undefined, 'score-counts');
  counts.setAttribute('aria-label', 'Answer counts');
  counts.append(
    node('li', correct + ' correct', 'count-correct'),
    node('li', incorrect + ' incorrect', 'count-incorrect'),
    node('li', unanswered + ' unanswered'),
  );
  if (ungraded) counts.append(node('li', ungraded + ' unscored'));
  summary.append(counts);
  const actions = node('div', undefined, 'row actions');
  actions.append(button('Upload another PDF', home, 'secondary'), button('Practice again', () => setup()));
  summary.append(actions);
  const review = node('div', undefined, 'review');
  review.append(node('h2', 'Review your answers'));
  quiz.forEach((question, index) => {
    const selection = question.choices[selections[index]];
    const correctIndex = question.choices.findIndex(choice => choice.correct);
    const item = node('details');
    const label = !selection ? 'Unanswered' : correctIndex < 0 ? 'Unscored' : selection.correct ? 'Correct' : 'Incorrect';
    const title = node('summary');
    title.append(node('span', label + ' · ', selection?.correct ? 'good' : correctIndex >= 0 ? 'missed' : 'meta'));
    title.append(document.createTextNode((index + 1) + '. ' + question.prompt));
    item.append(title, node('p', selection ? 'Your answer — ' + 'ABCD'[selections[index]] + '. ' + selection.text : 'Your answer — skipped'));
    if (correctIndex >= 0) item.append(node('p', 'Correct answer — ' + 'ABCD'[correctIndex] + '. ' + question.choices[correctIndex].text));
    review.append(item);
  });
  panel.replaceChildren(summary, review);
  show('results');
}

async function upload(file) {
  if (busy || !file) return;
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    status('Choose a PDF file.', true);
    return;
  }
  busy = true;
  byId('choose').disabled = true;
  byId('sample').disabled = true;
  status('Reading your PDF…');
  try {
    const text = await readPdf(new Uint8Array(await file.arrayBuffer()), (page, total) => {
      status('Reading page ' + page + ' of ' + total + '…');
    });
    const parsed = parseQuestions(text);
    if (!parsed.length) {
      status(text.trim() ? 'No four-option questions found. Use numbered questions with choices labeled A, B, C and D.' : 'No selectable text found. Use a text-based PDF.', true);
      return;
    }
    questions = parsed;
    fileName = file.name;
    status('');
    setup(true);
  } catch (error) {
    status(error.name === 'PasswordException' ? 'Unlock the PDF and try again.' : 'This PDF could not be read. Try a different PDF.', true);
  } finally {
    busy = false;
    byId('choose').disabled = false;
    byId('sample').disabled = false;
  }
}

byId('home').addEventListener('click', home);
byId('choose').addEventListener('click', () => byId('file').click());
byId('file').addEventListener('change', event => {
  const file = event.target.files[0];
  event.target.value = '';
  upload(file);
});
const drop = byId('drop');
drop.addEventListener('dragover', event => {
  event.preventDefault();
  drop.classList.add('over');
});
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', event => {
  event.preventDefault();
  drop.classList.remove('over');
  upload(event.dataTransfer.files[0]);
});
byId('sample').addEventListener('click', () => {
  fileName = 'Sample quiz';
  questions = parseQuestions([
    '1. What does a prototype help a team do?\nA. Test an idea early\nB. Avoid customer feedback\nC. Guarantee profit\nD. Eliminate revisions\nAnswer: A',
    '2. Which measure describes money moving in and out of a business?\nA. Market share\nB. Cash flow\nC. Brand awareness\nD. Customer retention\nAnswer: B',
    '3. What can market research help a business understand?\nA. Tomorrow’s exact sales\nB. Every competitor’s password\nC. Customer needs\nD. The future exchange rate\nAnswer: C',
  ].join('\n'));
  setup(true);
});
