
function titleCase(lower) {
  return lower.replace(/\b\w/, c => c.toUpperCase());
}

function glyphForName(name) {
  const lookup = {
    aggression: '♠',
    resilience: '♥',
    presence: '♣',
    luck: '♦'
  };
  return lookup[name];
}

function createLevelUpMessages(levelUps) {
  return levelUps.map(values => {
    const delta = values.newValue - values.value;
    const glyph = glyphForName(values.name);
    const impact = `(+${delta} ${glyph})`;
    return { name: values.name, text: `Leveled Up: ${impact}` };
  });
}

function createMeleeMessage(character) {
  return { name: character.name, text: 'engages in hand-to-hand combat' };
}

function createFireMessage(character, weapon) {
  return { name: character.name, text: `fires their ${weapon.name}` };
}

function createBattleMessages(actions) {
  // console.log(`createBattleMessages: actions: ${JSON.stringify(actions)}`);
  const messages = Object.entries(actions)
    .map(action => {
      const name = action[0];
      const { hits, killed } = action[1];
      const impact = `(-${hits} ♦)`;
      if (killed) {
        return { name, text: `is out of luck: ${impact}` };
      }
      return { name, text: `has a close call: ${impact}` };
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
  glyphForName,
  createLevelUpMessages,
  createMeleeMessage,
  createFireMessage,
  createBattleMessages,
  timesWords,
  truncateAndCenterText
};
