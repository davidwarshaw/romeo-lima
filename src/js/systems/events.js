export default [
  {
    tiles: [],
    watches: [],
    chanceToHappen: 10,
    cooldown: 10,
    chanceToSucceed: 66,
    name: '"Should we check it out?"',
    proceedLabel: '"Search it."',
    skipLabel: '"Leave it."',
    description: {
      setup: [
        {
          name: '${Pointman}',
          text: '"I got something in the brush up here. ' +
          'It\'s a bicycle.""'
        },
        {
          name: '${Team Lead}',
          text: '"It looks like it\'s been rigged to carry cargo. ' +
          '\n\nShould we check it out?"'
        }
      ],
      success: 'You find some stuff',
      failure: 'As ${Pointman} carefully lifts the bicycle frame a ' +
        'clicking sound can be heard. An explosion tears and killed.' +
        'You snap off one of his ID tags and note your location.' +
        '\n\nYou spend the rest of the day burying him.'
    }
  }
];
