import properties from './properties';
import utils from './util/utils';

import PlayerSquad from './characters/PlayerSquad';
import Inventory from './characters/Inventory';
import EnemySquad from './characters/EnemySquad';

import overworldMapCreation from './maps/overworldMapCreation';
import squadProcedures from './characters/squadProcedures';


function createPlayState() {

  // Print out the weapon report for balance
  squadProcedures.weaponReport();

  // Overworld map
  const { width, overworldHeight } = properties;
  const { map, highestTerrain } = overworldMapCreation
    .createBaseOverworldMap(width, overworldHeight);
  overworldMapCreation.assignSea(map, width - 1, overworldHeight - 1);
  overworldMapCreation.assignRivers(map, highestTerrain);
  overworldMapCreation.assignRoads(map, width, overworldHeight);
  overworldMapCreation.assignBuildings(map);
  overworldMapCreation.developLandscape(map);

  // Overworld map starting position
  const heightOffset =
        ~~((properties.rng.getPercentage() / 100) * overworldHeight);
  const squadStartX = 5;
  const squadStartY = utils.clamp(heightOffset, 5, overworldHeight - 5);

  // Place the crash site at the overworld starting position
  overworldMapCreation.placeCrashSite(map, squadStartX, squadStartY);

  // Squad
  const squadMembers = squadProcedures.createPlayerSquadMembers();
  const squadInventory = new Inventory();
  squadProcedures.populatePlayerInventory(squadMembers, squadInventory);
  const squad = new PlayerSquad(
    squadMembers, squadStartX, squadStartY, squadInventory);

  // Enemies
  const enemies = squadProcedures.getOverworldEnemyLocations(map)
    .map((location) => {
      const { x, y, difficulty } = location;
      const definition =
        squadProcedures.selectEnemyDefinition(difficulty);
      const definitions = definition.members;
      const playerControlled = false;
      const faction = 'NVA';
      const enemySquadMembers = squadProcedures
        .createSquadMembers(definitions, playerControlled, faction);
      const { glyph, overworldVisible } = definition;
      const enemySquadInventory = new Inventory();
      squadProcedures
        .populateEnemyInventory(enemySquadMembers, enemySquadInventory);
      return new EnemySquad(
        enemySquadMembers, x, y, enemySquadInventory,
        glyph, overworldVisible);
    });

  return {
    day: 0,
    watch: 1,
    map,
    squad,
    enemies,

    // Local map and vehicles are populated in the battle system
    localMap: null,
    vehicles: null
  };
}

export default { createPlayState };
