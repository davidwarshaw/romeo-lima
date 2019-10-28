import properties from '../properties';

function dateLine(day, watch) {
  const startDate = properties.inGameStartDate;
  const elapsedMillis = (((day * 24) + (watch * 2)) * 60 * 60 * 1000);
  const currentDate = new Date(startDate.getTime() + elapsedMillis);
  const hours = String(currentDate.getHours()).padStart(2, '0');
  return `${currentDate.toDateString()} ${hours}:00`;
}

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

function formatMessages(messages, width) {
  const messageLines = [];
  let messageLine = { name: '', text: '' };
  let lineChar = 0;
  const addMessageLine = () => {
    messageLine.text = messageLine.text.trimEnd();
    messageLines.push(messageLine);
    messageLine = { name: '', text: '' };
    lineChar = 0;
  };

  messages.forEach((message) => {
    // console.log(`message: ${JSON.stringify(message)}`);
    message.name.split(' ').forEach(token => {
      // console.log(`token: ${JSON.stringify(token)}`);
      if (token.length >= (width - lineChar)) {
        addMessageLine();
      }
      messageLine.name += token + ' ';
      lineChar += token.length + 1;
    });
    message.text.split(/\s/).forEach(token => {
      // console.log(`token: ${JSON.stringify(token)}`);
      if (token.length >= (width - lineChar)) {
        addMessageLine();
      }
      messageLine.text += token + ' ';
      lineChar += token.length + 1;
    });
    addMessageLine();
  });
  messageLines.push(messageLine);

  // console.log('messageLines:');
  // console.log(`${JSON.stringify(messageLines)}`);
  return messageLines;
}

function textFromMessageLines(messageLines, style) {
  return messageLines.map(message => {
    const formattedText =
    `%c{${style.nameColor}}%b{${style.fieldBgColor}}` +
      `${message.name}` +
    `%c{${style.textColor}}%b{${style.fieldBgColor}}` +
      `${message.text}`;
    return formattedText;
  });
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
  dateLine,
  titleCase,
  glyphForName,
  createLevelUpMessages,
  createMeleeMessage,
  createFireMessage,
  createBattleMessages,
  formatMessages,
  textFromMessageLines,
  timesWords,
  truncateAndCenterText
};
