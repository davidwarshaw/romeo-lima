import properties from '../properties';

import choiceEvents from './data/events/choices.json';
import findableChoiceEvents from './data/events/findableChoices.json';
import dialogEvents from './data/events/dialogs.json';

import equipment from '../characters/data/equipment.json';

export default class EventSystem {
  constructor() {

    this.events = [].concat(choiceEvents, findableChoiceEvents, dialogEvents)
      .map((event, i) => {

        // Set event ID
        event.id = i;

        // Cooldowns start at 0
        event.currentCooldown = 0;

        return event;
      });

    // TODO: dialog about movies
    console.log('Events:');
    this.events.forEach((event, i) => console.log(`${i}: ${event.name}`));

    const findableEquipmentTypes = [
      'medical equipment', 'existence equipment', 'grenade', 'grenade launcher',
      'rocket launcher', 'flame thrower'
    ];

    const findableItems = Object.entries(equipment)
      .filter(entry => findableEquipmentTypes.includes(entry[1].type))
      .map(entry => entry[0]);

    this.itemMap = properties.rng.shuffle(findableItems);
    console.log('Findable Items:');
    this.itemMap.forEach((item, i) => console.log(`${i}: ${item}`));
  }

  checkForEvent(watch, playerSquad) {

    // First, decrement the cooldowns
    this.events.forEach(event => {
      event.currentCooldown -= 1;
      if (event.currentCooldown < 0) {
        event.currentCooldown = 0;
      }
    });

    // Roll for an event
    const eventProb = this.eventProbForWatch(watch);
    console.log(`eventProb: ${eventProb}`);
    const roll = properties.rng.getPercentage();
    console.log(`roll: ${roll}`);
    if (roll >= eventProb) {
      // No event
      return null;
    }

    console.log('Event');

    const eventCandidates = {};
    this.events

      // Only events with zero cooldown are valid
      .filter(event => event.currentCooldown === 0)

      // Only events that need the same or fewer members
      .filter(event => event.squadSizeMin <= playerSquad.getAliveMembers().length)

      // Add a pair of event IDs and frequency weights
      .forEach(event => eventCandidates[event.id] = event.frequency);

    const eventId = properties.rng.getWeightedValue(eventCandidates);

    console.log(eventId);

    if (eventId) {

      const event = this.events[eventId];
      const { id, choice, name, intro, proceedLabel, skipLabel } = event;
      let text = intro;

      // Set the cooldown for this event
      event.currentCooldown = event.cooldown;

      console.log(event);

      // If the event is a findable choice, then attach a findable to it
      if (event.findableChoice) {
        const findableNumber = Math.round(this.itemMap.length * properties.rng.getUniform());
        event.findableNumber = findableNumber;
        text = this.populateFindableItem(text, findableNumber);
      }

      text = playerSquad.populateNames(text);

      return { eventId: id, choice, name, text, proceedLabel, skipLabel };
    }

    // No event this turn
    return null;
  }

  proceedWithEvent(eventId, playerSquad) {
    const event = this.events[eventId];
    const { name, statToCheck } = event;

    let success;
    let text;

    // If the event is a findable choice, check the pointman's stat
    if (event.findableChoice) {
      const pointman = playerSquad.getPointman();
      const roll = properties.rng.getPercentage();
      const statChance = pointman.getStatChance(statToCheck);

      //console.log(`statToCheck: ${statToCheck} roll: ${roll} statChance: ${statChance}`);
      if (roll <= statChance) {
        const { findableNumber } = event;

        success = true;
        text = playerSquad.populateNames(event.outcomes.success);
        text = this.populateFindableItem(text, findableNumber);

        // Give the squad the findable
        const name = this.itemMap[event.findableNumber];
        const detail = equipment[name];
        playerSquad.inventory.addItem(name, detail);
      }
      else {
        success = false;
        text = playerSquad.populateNames(event.outcomes.failure);
      }
    }

    return { success, name, text };
  }

  eventProbForWatch(watch) {
    if (watch >= 3 && watch <= 9) {
      return 40;
    }
    return 20;
  }

  populateFindableItem(text, findableNumber) {
    const findableName = this.itemMap[findableNumber];
    return text.map(paragraph => {
      const { name, text } = paragraph;
      console.log(text);
      const replacedText = text
        .replace(/FINDABLE_NUMBER/g, findableNumber)
        .replace(/FINDABLE_NAME/g, findableName);
      return { name, text: replacedText };
    });
  }
}
