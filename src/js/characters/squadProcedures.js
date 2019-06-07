import properties from '../properties';
import utils from '../util/utils';

import Inventory from './Inventory';

import surnames from './data/surnames.json';
import playerSquadDefinition from './data/playerSquadDefinition.json';
import enemyDefinitions from './data/enemyDefinitions.json';
import enemyDistributions from './data/enemyDistributions.json';
import weapons from './data/weapons.json';
import equipment from './data/equipment.json';

import overworldTileDictionary from '../maps/data/overworldTileDictionary.json';
import localTileDictionary from '../maps/data/localTileDictionary.json';

function weaponReport() {
  Object.entries(weapons)
    .sort((l, r) => {
      const luc = l[1].type.toUpperCase();
      const ruc = r[1].type.toUpperCase();
      if (luc < ruc) {
        return -1;
      }
      else if (luc > ruc) {
        return 1;
      }
      return 0;
    })
    .forEach(weapon => {
      const name = weapon[0];
      const { type, bursts, roundsPerBurst, power, accuracy } = weapon[1];
      const score = bursts * roundsPerBurst * power * accuracy;
      console.log(`${type} ${name}`);
      console.log(`${bursts} x ${roundsPerBurst} x ${power} x ${accuracy}` +
        ` => ${score}`);
    });
}

function populateInventory(members, inventory, startWithEquipment) {

  // Add starting equipment
  if (startWithEquipment) {
    Object.entries(equipment)
      .forEach(item => {
        [...Array(item[1].startWith).keys()]
          .forEach(() => inventory.addItem(item[0], item[1]));
      });
  }

  // Add and assign member weapons
  members.forEach(member => {
    // Add weapon
    const itemName = member.weapon.name;
    const itemDetail = member.weapon;
    const itemNumber = inventory.addItem(itemName, itemDetail);
    inventory.assignItem(itemNumber, member.number);

    // Add ammo
    const startingRounds = 5 * itemDetail.bursts * itemDetail.roundsPerBurst;
    const ammoName = itemDetail.ammo;
    const ammoDetail = equipment[ammoName];
    [...Array(startingRounds).keys()]
      .forEach(() => inventory.addItem(ammoName, ammoDetail));
  });
}

function populatePlayerInventory(members, inventory) {
  const startWithEquipment = true;
  return populateInventory(members, inventory, startWithEquipment);
}

function populateEnemyInventory(members, inventory) {
  const startWithEquipment = false;
  return populateInventory(members, inventory, startWithEquipment);
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

function weaponForMember(member, faction) {

  const roleWeapons = Object.entries(weapons)
    .filter(weapon => weapon[1].faction === faction)
    .filter(weapon => weapon[1].role === member.role);

  const rifles = Object.entries(weapons)
    .filter(weapon => weapon[1].faction === faction)
    .filter(weapon => weapon[1].type === 'rifle');

  const weaponEntry = roleWeapons.length > 0 ? roleWeapons[0] : rifles[0];

  const weapon = Object.assign({}, { name: weaponEntry[0] }, weaponEntry[1]);

  return weapon;
}

function createPlayerSquadMembers() {
  const definitions = playerSquadDefinition;
  const faction = 'US';
  const playerControlled = true;
  return createSquadMembers(definitions, playerControlled, faction);
}

function createSquadMembers(definitions, playerControlled, faction) {
  const members = definitions.map((definition, i) => {
    const number = i + 1;

    // Make a copy of the weapon
    const weapon = weaponForMember(definition, faction);

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
      secondary: null,
      primarySelected: true,
      inBattle: false,
      selected: false
    };
    return member;
  });
  return members;
}

function getOverworldEnemyLocations(map) {
  return Object.values(map)
    .filter(tile => {
      const tileDef = overworldTileDictionary[tile.name];
      return tileDef.enemySpawn;
    })
    .map(tile => {
      const { x, y } = tile;
      const {
        overworldWidth, overworldHeight,
        baseOverworldEnemyProb, xOverworldEnemyProb,
        southernOverworldEnemyHeight, southernOverworldEnemyProb } = properties;
      const xProb =
        (1 - ((overworldWidth - x) / overworldWidth))
        * xOverworldEnemyProb;
      const ySouthernThreshold = overworldHeight - southernOverworldEnemyHeight;
      const yProb = y >= ySouthernThreshold ? southernOverworldEnemyProb : 0;
      const tileProb = Math.max(xProb, yProb);
      const difficulty = utils.clamp(~~(1 + (10 * tileProb)), 1, 10);
      const enemyProb = ~~(100 * tileProb * baseOverworldEnemyProb);

      //
      // if (yProb > 0.90) {
      //   console.log(`${x}-${y}`);
      //   console.log(`${tileProb} ${difficulty} ${enemyProb}`);
      // }
      const roll = properties.rng.getPercentage();
      if (roll < enemyProb) {
        return { x, y, difficulty };
      }
      return null;
    })
    .filter(location => location);
}

function selectEnemyDefinition(difficulty) {
  const distroForDifficulty = enemyDistributions
    .filter(definition => definition.difficulty === difficulty)
    .slice(0, 1)[0];

  const definitionType =
    properties.rng.getWeightedValue(distroForDifficulty.distribution);
  const definition = enemyDefinitions[definitionType];

  return definition;
}

function createEnemyMembers(definition, faction) {
  const members = [];
  definition.members.forEach((memberDefinition, i) => {
    const number = i + 1;

    // Make a copy of the weapon
    const weapon = weaponForMember(memberDefinition, faction);

    const member = {
      playerControlled: false,
      faction,
      rank: memberDefinition.rank,
      role: memberDefinition.role,
      marchingOrder: i,
      number,
      name: properties.rng.getWeightedValue(surnames),
      pointman: false,
      prone: false,
      stats: rollStats(),
      injuries: 0,
      alive: true,
      weapon,
      inBattle: false,
      selected: false
    };

    // Add copies of the member if more than one are specified
    for (let i = 0; i < definition.count; i++) {
      members.push(Object.assign({}, member));
    }
  });

  return members;
}

function tileRectForSide(side, opposite, numMembers) {
  const localStartingWidth = numMembers * 2;

  let xFrom;
  let yFrom;
  let xTo;
  let yTo;
  if ((!opposite && side === 'TOP') || (opposite && side === 'BOTTOM')) {
    const borderBuffer = 1;
    const localStartingSideOffset =
      Math.round((properties.localWidth - localStartingWidth) / 2);

    xFrom = localStartingSideOffset;
    yFrom = borderBuffer;
    xTo = properties.localWidth - 1 - localStartingSideOffset;
    yTo = borderBuffer + properties.localStartingDepth;
  }
  else if ((!opposite && side === 'BOTTOM') || (opposite && side === 'TOP')) {
    const borderBuffer = 1;
    const localStartingSideOffset =
      Math.round((properties.localWidth - localStartingWidth) / 2);

    xFrom = localStartingSideOffset;
    yFrom = properties.localHeight - 1 -
      borderBuffer - properties.localStartingDepth;
    xTo = properties.localWidth - 1 - localStartingSideOffset;
    yTo = properties.localHeight - 1 - borderBuffer;
  }
  else if ((!opposite && side === 'RIGHT') || (opposite && side === 'LEFT')) {
    const borderBuffer =
      Math.round((properties.localWidth - properties.localHeight) / 2);
    const localStartingSideOffset =
      Math.round((properties.localHeight - localStartingWidth) / 2);

    xFrom = properties.localWidth - 1 -
      borderBuffer - properties.localStartingDepth;
    yFrom = localStartingSideOffset;
    xTo = properties.localWidth - 1 - borderBuffer;
    yTo = properties.localHeight - 1 - localStartingSideOffset;
  }
  else if ((!opposite && side === 'LEFT') || (opposite && side === 'RIGHT')) {
    const borderBuffer =
      Math.round((properties.localWidth - properties.localHeight) / 2);
    const localStartingSideOffset =
      Math.round((properties.localHeight - localStartingWidth) / 2);

    xFrom = borderBuffer;
    yFrom = localStartingSideOffset;
    xTo = borderBuffer + properties.localStartingDepth;
    yTo = properties.localHeight - 1 - localStartingSideOffset;
  }
  return { xFrom, yFrom, xTo, yTo };
}

function tileRectForSide2(side, opposite, numMembers) {
  const localStartingWidth = numMembers * 2;

  let xFrom;
  let yFrom;
  let xTo;
  let yTo;
  if ((!opposite && side === 'RIGHT') || (opposite && side === 'LEFT')) {
    const borderBuffer =
      Math.round((properties.localWidth - properties.localHeight) / 2);
    const localStartingSideOffset =
      Math.round((properties.localHeight - localStartingWidth) / 2);

    xFrom = properties.localWidth - 1 -
      borderBuffer - properties.localStartingDepth;
    xTo = properties.localWidth - 1 - borderBuffer;

    yFrom = localStartingSideOffset;
    yTo = properties.localHeight - 1 - localStartingSideOffset;
  }
  else if ((!opposite && side === 'LEFT') || (opposite && side === 'RIGHT')) {
    const borderBuffer =
      Math.round((properties.localWidth - properties.localHeight) / 2);
    const localStartingSideOffset =
      Math.round((properties.localHeight - localStartingWidth) / 2);

    xFrom = borderBuffer;
    yFrom = localStartingSideOffset;
    xTo = borderBuffer + properties.localStartingDepth;
    yTo = properties.localHeight - 1 - localStartingSideOffset;
  }
  return { xFrom, yFrom, xTo, yTo };
}

function placeSquadInLocalMap(squad, map, ambushState, playerSide, opposite) {
  const numMembers = squad.getAliveMembers().length;
  let eligibleRect;
  if (ambushState === 'No-Ambush') {
    eligibleRect = tileRectForSide(playerSide, opposite, numMembers);
  }
  else if (ambushState === 'Player-Ambushed') {
    eligibleRect = tileRectForSide(playerSide, opposite, numMembers);
  }
  else if (ambushState === 'Enemy-Ambushed') {
    eligibleRect = tileRectForSide(playerSide, opposite, numMembers);
  }
  const eligibleTiles = Object.values(map)

    // Only place members on a startable tiles
    .filter(tile => {
      const tileDef = localTileDictionary[tile.name];
      return tileDef.startable;
    })

    // Only place members in the starting rectangle
    .filter(tile => {
      const { x, y } = tile;
      const { xFrom, yFrom, xTo, yTo } = eligibleRect;
      return x >= xFrom && x <= xTo && y >= yFrom && y <= yTo;
    })

    // Randomize order
    .map(tile => ({
      x: tile.x, y: tile.y, randomOrder: properties.rng.getUniform()
    }))
    .sort((l, r) => l.randomOrder - r.randomOrder);

  // Get a tile for each squad member
  const memberTiles = eligibleTiles.slice(0, numMembers);

  squad.getAliveMembers().forEach((member, i) => {
    member.x = memberTiles[i].x;
    member.y = memberTiles[i].y;
  });
}

function placePlayerSquadInLocalMap(squad, map, ambushState, playerSide) {
  // Player squad does not go on the opposite of the player side
  const opposite = false;
  return placeSquadInLocalMap(squad, map, ambushState, playerSide, opposite);
}

function placeEnemySquadInLocalMap(squad, map, ambushState, playerSide) {
  // Enemy squad goes on the opposite of the player side
  const opposite = true;
  return placeSquadInLocalMap(squad, map, ambushState, playerSide, opposite);
}

function placeSingleEnemyInLocalMap(squad) {
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
    .slice(0, 1);
}

function getEnemySquadByOverworldXY(enemies, x, y) {
  const enemiesInTile = enemies
    .filter(enemy => enemy.x === x && enemy.y === y)
    .slice(0, 1);
  return enemiesInTile.length > 0 ? enemiesInTile[0] : null;
}

function getLootByEnemySquad(members, inventory) {
  const numItems = members.length * properties.lootDropsPerEnemyMember;
  const loot = new Inventory();
  inventory.getItems()
    .map((item) => {
      item.rand = properties.rng.getPercentage();
      return item;
    })
    .sort((l, r) => l.rand - r.rand)
    .slice(0, numItems)
    .forEach(item => loot.addItem(item.name, item));
  return loot;
}

function getAllMembersByTurnOrder(squad, enemySquad) {
  return squad.getBattleMembersByNumber()
    .concat(enemySquad.getBattleMembersByNumber())
    .sort((l, r) => l.stats.initiative - r.stats.initiative);
}

function getMovesForMember(member) {
  return Math.round(member.stats.aggression / 10) * 2;
}

export default {
  weaponReport,
  populatePlayerInventory,
  populateEnemyInventory,
  createPlayerSquadMembers,
  createSquadMembers,
  placePlayerSquadInLocalMap,
  getOverworldEnemyLocations,
  selectEnemyDefinition,
  createEnemyMembers,
  placeEnemySquadInLocalMap,
  placeSingleEnemyInLocalMap,
  getEnemySquadByOverworldXY,
  getLootByEnemySquad,
  getAllMembersByTurnOrder,
  getMovesForMember
};
