# Quizdesk

**Turn a PDF question bank into an interactive practice quiz.**

[Try the live demo](https://quizdesk-ten.vercel.app/) · Built by **Mourya Tanusri**

Quizdesk helps students practice from the question banks they already have. Upload a text-based PDF, choose how many questions to attempt, and either practice with instant feedback or take a test and review your results afterward. PDF extraction, quiz navigation, and scoring all happen in the browser.

## Try it in under a minute

1. Open the [live demo](https://quizdesk-ten.vercel.app/).
2. Click **Try a sample quiz** to explore without uploading a file, or click **Choose PDF** to import your own question bank.
3. Select **Practice** or **Test**, choose a question count, and start.

## Features

| Feature | What it does |
| --- | --- |
| **Practice mode** | Shows feedback immediately. The correct option turns green, and an incorrect selection turns red. The first graded choice is recorded. |
| **Test mode** | Keeps answers hidden until the results screen. You can revisit questions and change your choices before finishing. |
| **Question count** | Lets you choose 3, 10, 20, 50, 100, or all available questions, depending on the size of the PDF. |
| **Independent shuffle controls** | Keeps the PDF order by default. Shuffle questions to draw a random set, shuffle options to change the order of the choices, or use both. |
| **End early** | Lets you finish either mode before answering every question. Canceling the confirmation returns you to the same question with your answers intact. |
| **Score and review** | Shows the percentage and counts for correct, incorrect, and unanswered questions. An answer review shows your choice and the correct answer. |

If you answer 3 questions in a 10-question quiz and get 2 right, your result is **20%** with **2 correct, 1 incorrect, and 7 unanswered**. The denominator is the full quiz you selected.

## How it works

1. **Extract text from the PDF.** Bundled PDF.js reads the selected file in the browser. The extraction code reconstructs text lines page by page.
2. **Parse questions and answer keys.** A rule-based JavaScript parser recognizes numbered prompts, four labeled choices, and inline answer keys. It handles wrapped prompts, questions that span pages, and multiple choices on a single line. Worked solution text is skipped.
3. **Build a quiz.** With question shuffling off, Quizdesk takes the first questions in PDF order. With it on, Quizdesk shuffles the full bank before taking the requested number. Each choice carries its correctness flag, so shuffling the options preserves the answer key.
4. **Grade and review.** Quizdesk compares the selected choices against the answer key and calculates the percentage using the size of the selected quiz. Decimal precision keeps small scores visible, such as **0.33%** for one correct answer out of 300.

Quizdesk uses **HTML, CSS, vanilla JavaScript, and PDF.js**. GitHub hosts the source, and Vercel serves the production site as static files. Uploaded PDFs stay in the browser. The app runs without a backend, database, or API key.

## Supported PDF formats

Use a **text-based PDF** with numbered questions and four options labeled A through D. Quizdesk supports formats like these:

```text
1. What does a prototype help a team do?
A. Test an idea
B. Avoid feedback
C. Guarantee profit
D. Eliminate revisions
Answer: A. Test an idea
```

```text
Q1. What is the sum of the first 25 natural numbers?
(A) 300   (B) 315
(C) 325   (D) 350
Answer: (C) 325
Solution: Use n(n + 1) / 2.
```

If an answer key is missing, you can enter answers on the setup screen. Image-only scans need OCR before import. Unlabeled choices and separate answer-key sections may need reformatting or manual key entry.

## Verification

| Check | Result |
| --- | --- |
| **Entrepreneurship question bank** | Imported all **266 questions** with four choices and matching answer keys, including a question split across two pages. |
| **Problem Solving & Quantitative Techniques question bank** | Imported all **300 questions** with four choices and matching answer keys, including inline choices, wrapped prompts, and worked solution sections. |
| **Quiz behavior** | Checked original and shuffled ordering, answer correctness after option shuffling, decimal scores, and result counts for completed and partial attempts. |

## Deployment

Quizdesk is deployed on Vercel as a static web app.

[Open Quizdesk](https://quizdesk-ten.vercel.app/)

Open `index.html` directly in your browser. PDF.js is bundled, so you can run the app without installing packages or starting a local server. To edit the project, open the `quizdesk` folder in VS Code.

## Project structure

| File | Responsibility |
| --- | --- |
| `index.html` | Upload screen, quiz sections, and early-finish confirmation |
| `style.css` | Responsive layout, color palette, and feedback styles |
| `app.js` | Upload flow, quiz setup, navigation, and results |
| `pdf-text.js` | Browser-side PDF text extraction and page handling |
| `parser.js` | Parsing numbered questions, options, and answer keys |
| `quiz-data.js` | Question selection, shuffling, and scoring |
| `vendor/` | Bundled PDF.js files and their license |
