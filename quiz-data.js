function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function makeQuiz(questions, { shuffleQuestions = false, shuffleOptions = false, count = questions.length } = {}) {
  const ordered = shuffleQuestions ? shuffled(questions) : questions;
  return ordered.slice(0, count).map(question => {
    const options = [...'ABCD'].map(letter => ({
      text: question.options[letter],
      correct: letter === question.answer,
    }));
    return {
      ...question,
      choices: shuffleOptions ? shuffled(options) : options,
    };
  });
}

function scoreQuiz(quiz, selections) {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let ungraded = 0;
  let keyed = 0;

  quiz.forEach((question, index) => {
    if (question.answer) keyed++;
    const choice = question.choices[selections[index]];
    if (!choice) unanswered++;
    else if (!question.answer) ungraded++;
    else if (choice.correct) correct++;
    else incorrect++;
  });

  const total = quiz.length;
  return { correct, incorrect, unanswered, ungraded, total, percent: keyed ? correct * 100 / total : null };
}
