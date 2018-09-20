import properties from '../properties';
import surnames from './data/surnames.json';
import squadDefinition from './data/squadDefinition.json';
import weapons from './data/weapons.json';
import equipment from './data/equipment.json';

function weaponReport() {
  weapons
    .sort((l, r) => {
      const luc = l.type.toUpperCase();
      const ruc = r.type.toUpperCase();
      if (luc < ruc) {
        return -1;
      }
      else if (luc > ruc) {
        return 1;
      }
      return 0;
    })
    .forEach(weapon => {
      const { name, type, bursts, roundsPerBurst, power, accuracy } = weapon;
      const score = bursts * roundsPerBurst * power * accuracy;
      console.log(`${type} ${name}`);
      console.log(`${bursts} x ${roundsPerBurst} x ${power} x ${accuracy}` +
        ` => ${score}`);
    });
}

function startingEquipment() {
  return equipment.map(type => Object.assign({}, type));
}

function rollStats() {
  const initiative = Math.round(properties.rng.getNormal(50, 10));
  const aggression = Math.round(properties.rng.getNormal(50, 10));
  const patience = Math.round(properties.rng.getNormal(50, 10));
  const resilience = Math.round(properties.rng.getNormal(50, 10));
  const presence = Math.round(properties.rng.getNormal(50, 10));
  const perception = Math.round(properties.rng.getNormal(50, 10));
  return { initiative, aggression, patience, resilience, presence, perception };
}

function createSquadMembers(faction, playerControlled) {
  const members = squadDefinition.map((definition, i) => {
    const number = i + 1;

    const roleWeapons = weapons
      .filter(weapon => weapon.role === definition.role);
    const rifles = weapons
      .filter(weapon => weapon.type === 'rifle');
    const weaponType = roleWeapons.length > 0 ? roleWeapons[0] : rifles[0];

    // Make a copy of the weapon
    const weapon = Object.assign({}, weaponType);

    weapon.memberNumber = number;

    const member = {
      playerControlled,
      faction,
      rank: definition.rank,
      role: definition.role,
      marchingOrder: definition.marchingOrder,
      number,
      name: properties.rng.getWeightedValue(surnames),
      pointman: definition.pointman,
      prone: false,
      stats: rollStats(),
      injuries: 0,
      alive: true,
      weapon,
      selected: false
    };
    return member;
  });
  return members;
}

function placeSquadMembersInLocalMap(squad, map, ambush) {
  const { members, formation } = squad;
  const spacing = 2;
  const pointmanLead = 4;
  members
    .forEach((member) => {
      if (formation === 'File') {
        member.x = 1 +
          (member.marchingOrder * spacing);
        member.y = Math.round(properties.localHeight / 2);
      }
      else {
        const offset = properties.localHeight -
          (spacing * (members.length - 1)) + 1;
        member.x = 1;
        member.y = Math.round(offset / 2) +
          (member.marchingOrder * spacing);
      }

      // Pointman is 2 positions to the right
      if (member.pointman) {
        member.x += pointmanLead;
        member.y = Math.round(properties.localHeight / 2);
      }
    });

  // If it's an ambush, move the squad to 2/3 across the map
  if (ambush) {
    const ambushOffset = Math.round(properties.localWidth * (3 / 7));
    members.forEach((member) => member.x += ambushOffset);
  }
}

function placeEnemiesInLocalMap(squad, map, ambush) {
  const spacing = 2;
  squad.members = squad.members
    .map((member) => {
      const offset = properties.localHeight -
          (spacing * (squad.members.length - 1)) + 1;
      member.x = 1;
      member.y = Math.round(offset / 2) +
          (member.marchingOrder * spacing);

      member.rand = properties.rng.getPercentage();
      return member;
    })
    .sort((l, r) => l.rand - r.rand)
    .slice(0, 5);

  // If it's an ambush, stage the enemies on either side of the sqaud
  if (ambush) {
    const ambushOffset = Math.round(properties.localWidth * (6 / 7));
    squad.members
      .slice(0, 2)
      .forEach(member => member.x += ambushOffset);
  }
}

function getAllMembersByTurnOrder(squad, enemySquad) {
  return squad.members
    .concat(enemySquad.members)
    .sort((l, r) => l.stats.initiative - r.stats.initiative);
}

function getMovesForMember(member) {
  return Math.round(member.stats.aggression / 10) * 2;
}

function numberOfAliveMembers(squad) {
  return squad.members
    .map(member => member.alive ? 1 : 0)
    .reduce((acc, l) => acc + l);
}

export default {
  weaponReport,
  startingEquipment,
  createSquadMembers,
  placeSquadMembersInLocalMap,
  placeEnemiesInLocalMap,
  getAllMembersByTurnOrder,
  getMovesForMember,
  numberOfAliveMembers
};
