import properties from './properties';
import utils from './util/utils';

import PlayerSquad from './characters/PlayerSquad';
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

  // Squad
  const squadMembers = squadProcedures.createSquadMembers('US', true);
  const squadEquipment = squadProcedures.startingEquipment();
  const squad = new PlayerSquad(
    squadMembers, squadStartX, squadStartY, squadEquipment);

  // Enemies
  const enemies = [];
  const enemySquadMembers = squadProcedures.createSquadMembers('NVA', false);
  enemies.push(new EnemySquad(enemySquadMembers, 10, 10));

  return {
    day: 0,
    watch: 1,
    map,
    squad,
    enemies,

    // Local map is populated in the battle system
    localMap: null
  };
}

export default {
  createPlayState
};
