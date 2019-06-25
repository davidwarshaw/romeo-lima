
function titleCase(lower) {
  return lower.replace(/\b\w/, c => c.toUpperCase());
}

function createMeleeMessage(character) {
  return { name: character.name, text: 'engages in hand-to-hand combat' };
}

function createFireMessage(character, weapon) {
  return { name: character.name, text: `fires his ${weapon.name}` };
}

function createBattleMessages(actions) {
  // console.log(`createBattleMessages: actions: ${JSON.stringify(actions)}`);
  const messages = Object.entries(actions)
    .map(action => {
      const name = action[0];
      const { hits, killed } = action[1];
      const luckImpact = `(-${hits} ♦)`;
      if (killed) {
        return { name, text: `was hit and killed: ${luckImpact}` };
      }
      return { name, text: `was almost hit: ${luckImpact}` };
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
  createMeleeMessage,
  createFireMessage,
  createBattleMessages,
  timesWords,
  truncateAndCenterText
};
