import properties from '../properties';
import utils from '../util/utils';

import TileMath from '../util/TileMath';

import Inventory from './Inventory';
import Character from './Character';
import Vehicle from './Vehicle';

import surnames from './data/surnames.json';
import playerSquadDefinition from './data/playerSquadDefinition.json';
import enemyDefinitions from './data/enemyDefinitions.json';
import enemyDistributions from './data/enemyDistributions.json';
import weapons from './data/weapons.json';
import equipment from './data/equipment.json';
import vehicleDefinition from './data/vehicleDefinition';

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

function nameCharacter(faction, role) {
  if (faction === 'US') {
    return properties.rng.getWeightedValue(surnames);
  }
  return `${faction} ${role}`;
}

function addEquipmentForDifficulty(members, inventory, difficulty) {

  // Get frequency weights for all equipment at or below difficulty level
  const candidateWeights = {};
  Object.entries(equipment)
    .filter(item => item[1].difficulty <= difficulty)
    .forEach(item => candidateWeights[item[0]] = item[1].frequency);
  console.log(candidateWeights);

  console.log(`difficulty: ${difficulty} candidates: ${Object.entries(candidateWeights).length}`);

  // For each member, see if we should assign equipment
  members.forEach(member => {

    // Don't always assign equipment
    const roll = properties.rng.getPercentage();
    console.log(`roll: ${roll} enemyEquipmentChance: ${properties.enemyEquipmentChance}`);
    if (roll <= properties.enemyEquipmentChance) {

      // If we assign, assign by frequency
      const itemName = properties.rng.getWeightedValue(candidateWeights);
      const item = Object.assign({}, { name: itemName }, equipment[itemName]);
      console.log('assigned:');
      console.log(item);

      // Add and assign
      member.secondary = item;
      const itemNumber = inventory.addItem(item.name, item);
      inventory.assignItem(itemNumber, member.number);

      // Add ammo if needed
      if (item.ammo) {
        const startingRounds = properties.startingAmmoBursts;
        const ammoName = item.ammo;
        const ammoDetail = equipment[ammoName];
        [...Array(startingRounds).keys()]
          .forEach(() => inventory.addItem(ammoName, ammoDetail));
      }
    }
  });
}

function addStartingEquipment(inventory) {
  Object.entries(equipment)
    .forEach(item => {
      [...Array(item[1].startWith).keys()]
        .forEach(() => inventory.addItem(item[0], item[1]));
    });
}

function addWeapons(members, inventory) {
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
  addWeapons(members, inventory);
  addStartingEquipment(inventory);
}

function populateEnemyInventory(members, inventory, difficulty) {
  addWeapons(members, inventory);
  addEquipmentForDifficulty(members, inventory, difficulty);
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

function createVehicleSquadMember(number, name, playerControlled, faction, map) {
  const memberDefinition = {
    playerControlled,
    faction,
    rank: 'N/A',
    role: name,
    marchingOrder: 0,
    pointman: false
  };
  const definition = Object.assign({}, vehicleDefinition[name], memberDefinition);
  const weapon = weaponForMember(definition, faction);

  return new Vehicle(number, definition, weapon, map);
}

function createSquadMember(number, definition, playerControlled, faction) {
  const memberDefinition = {
    playerControlled,
    faction,
    rank: definition.rank,
    role: definition.role,
    marchingOrder: definition.marchingOrder,
    pointman: definition.pointman
  };
  const weapon = weaponForMember(memberDefinition, faction);

  return new Character(number, memberDefinition, weapon);
}

function createPlayerSquadMembers() {
  const definitions = playerSquadDefinition;
  const faction = 'US';
  const playerControlled = true;
  return createSquadMembers(definitions, playerControlled, faction);
}

function createSquadMembers(definitions, playerControlled, faction) {
  return definitions.map((definition, i) =>
    createSquadMember(i + 1, definition, playerControlled, faction));
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
        southernOverworldEnemyHeight, southernOverworldEnemyProb,
        maxDifficulty
      } = properties;
      const xProb =
        (1 - ((overworldWidth - x) / overworldWidth))
        * xOverworldEnemyProb;
      const ySouthernThreshold = overworldHeight - southernOverworldEnemyHeight;
      const yProb = y >= ySouthernThreshold ? southernOverworldEnemyProb : 0;
      const tileProb = Math.max(xProb, yProb);
      const difficulty = utils.clamp(~~(1 + (maxDifficulty * tileProb)), 1, maxDifficulty);
      const enemyProb = ~~(100 * tileProb * baseOverworldEnemyProb);
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

function tileRectForSide(map, side, opposite, numMembers) {
  const localStartingWidth = numMembers;
  const centerY = Math.round(properties.localHeight / 2);

  const top = utils.clamp(centerY - localStartingWidth, 0, properties.localHeight);
  const bottom = utils.clamp(centerY + localStartingWidth, 0, properties.localHeight);

  if ((!opposite && side === 'LEFT') || (opposite && side === 'RIGHT')) {
    const left = properties.localStartingDepth;
    const right = properties.localStartingDepth + localStartingWidth;
    return Object.entries(map)
      .filter(tile => {
        const { x, y } = tile[1];
        return x >= left && x <= right && y >= top && y <= bottom;
      });
  }
  else if ((!opposite && side === 'RIGHT') || (opposite && side === 'LEFT')) {
    const left = properties.localWidth - properties.localStartingDepth - localStartingWidth;
    const right = properties.localWidth - properties.localStartingDepth;
    return Object.entries(map)
      .filter(tile => {
        const { x, y } = tile[1];
        return x >= left && x <= right && y >= top && y <= bottom;
      });
  }
}

function tileRectSurround(map, side, opposite) {
  const xCenter = Math.round(properties.localWidth / 2);
  const yCenter = Math.round(properties.localHeight / 2);
  const smallRadius = Math.round(5);
  const mediumRadius = Math.round(15);
  const largeRadius = Math.round(20);

  const smallCircle = TileMath.tileCircleFilled(xCenter, yCenter, smallRadius);
  const mediumCircle = TileMath.tileCircleFilled(xCenter, yCenter, mediumRadius);
  const largeCircle = TileMath.tileCircleFilled(xCenter, yCenter, largeRadius);

  if ((!opposite && side === 'Player-Ambushed') || (opposite && side === 'Enemy-Ambushed')) {

    // Ambushee
    console.log(`first one side: ${side}`);
    return Object.entries(map)
      .filter(tile => {
        const { x, y } = tile[1];
        return smallCircle[utils.keyFromXY(x, y)];
      });
  }
  else if ((!opposite && side === 'Enemy-Ambushed') || (opposite && side === 'Player-Ambushed')) {
    console.log(`second one side: ${side}`);

    // Ambusher
    return Object.entries(map)
      .filter(tile => {
        const { x, y } = tile[1];
        return largeCircle[utils.keyFromXY(x, y)] && !mediumCircle[utils.keyFromXY(x, y)];
      });
  }
}

function placeSquadInLocalMap(squad, map, ambushState, playerSide, opposite) {
  const numMembers = squad.getAliveMembers().length;
  console.log(`ambushState: ${ambushState} playerSide: ${playerSide} opposite: ${opposite}`);
  let candidateTiles;
  if (ambushState === 'No-Ambush') {
    candidateTiles = tileRectForSide(map, playerSide, opposite, numMembers);
  }
  else if (ambushState === 'Player-Ambushed' || ambushState === 'Enemy-Ambushed') {
    candidateTiles = tileRectSurround(map, ambushState, opposite, numMembers);
  }
  const eligibleTiles = candidateTiles

    // Only place members on a startable tiles
    .filter(tile => {
      const tileDef = localTileDictionary[tile[1].name];
      return tileDef.startable;
    })

    // Randomize order
    .map(tile => {
      return {
        x: tile[1].x,
        y: tile[1].y,
        randomOrder: properties.rng.getUniform()
      };
    })
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
    .sort((l, r) => l.getTurnOrder() - r.getTurnOrder());
}

export default {
  weaponReport,
  nameCharacter,
  populatePlayerInventory,
  populateEnemyInventory,
  createVehicleSquadMember,
  createSquadMember,
  createPlayerSquadMembers,
  createSquadMembers,
  placePlayerSquadInLocalMap,
  getOverworldEnemyLocations,
  selectEnemyDefinition,
  placeEnemySquadInLocalMap,
  placeSingleEnemyInLocalMap,
  getEnemySquadByOverworldXY,
  getLootByEnemySquad,
  getAllMembersByTurnOrder
};
