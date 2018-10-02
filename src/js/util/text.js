
function titleCase(lower) {
  return lower.replace(/\b\w/, c => c.toUpperCase());
}

function createFireMessages(fireActions) {
  const messages = Object.entries(fireActions)
    .map(action => {
      const name = action[0];
      const { hits, killed } = action[1];
      const hitsWords = timesWords(hits);
      if (killed) {
        return { name, text: `was hit${hitsWords} and killed.` };
      }
      return { name, text: `was hit${hitsWords}.` };
    });
  return messages;
}

function timesWords(number) {
  if (number === 1) {
    return '';
  }
  else if (number === 2) {
    return ' twice';
  }
  return ` ${number} times`;
}

function truncateAndCenterText(text, left, width) {
  // Leave room from the ellipse
  const truncatedText = text.length <= width ?
    text :
    `${text.substring(0, text.length - 3)}...`;

  // const startingCol = left + 1 +
  //   Math.round((width - truncatedText.length) / 2);
  const startingCol = left + 2;
  return { startingCol, truncatedText };
}

export default {
  titleCase,
  createFireMessages,
  timesWords,
  truncateAndCenterText
};
