const { getDocument } = globalThis.pdfjsLib;

async function readPdf(bytes, onProgress = () => {}) {
  const task = getDocument({ data: bytes, isEvalSupported: false });
  const pages = [];
  try {
    const pdf = await task.promise;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const { items } = await page.getTextContent();
      let text = '';
      let height;
      for (const item of items) {
        if (!('str' in item)) continue;
        const nextHeight = item.transform[5];
        if (item.str && height !== undefined && Math.abs(nextHeight - height) > 2 && !text.endsWith('\n')) {
          text += '\n';
        }
        text += item.str + (item.hasEOL ? '\n' : '');
        if (item.str) height = nextHeight;
      }
      pages.push(text);
      onProgress(number, pdf.numPages);
    }
    return pages.join('\n');
  } finally {
    await task.destroy();
  }
}
