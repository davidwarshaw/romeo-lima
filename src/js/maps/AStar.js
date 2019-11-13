import utils from '../util/utils';

import localTileDictionary from './data/localTileDictionary.json';

function distance(from, to) {
  return (Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
}

export default class AStar {
  constructor(map, playerSquad, enemySquad, playerSquadLocalFov) {
    this.map = map;
    this.playerSquad = playerSquad;
    this.enemySquad = enemySquad;
    this.playerSquadLocalFov = playerSquadLocalFov;

    this.visibleTileCost = 2;
    this.notVisibleTileCost = 1;
  }

  tileCost(x, y) {
    return this.playerSquadLocalFov.visibleMap[utils.keyFromXY(x, y)] ?
      this.visibleTileCost : this.notVisibleTileCost;
  }

  addNeighbor(neighbors, x, y) {
    if (this.enemySquad) {
      const enemyHere = this.enemySquad.getByXY(x, y);
      if (enemyHere && enemyHere.alive) {
        return;
      }
    }
    const tile = this.map[utils.keyFromXY(x, y)];
    if (!tile) {
      return;
    }
    const tileType = localTileDictionary[tile.name];
    if (!tileType.traversable) {
      return;
    }

    neighbors.push({ x, y });
  }

  getNeighbors(x, y) {
    const neighbors = [];
    this.addNeighbor(neighbors, x, y - 1);
    this.addNeighbor(neighbors, x, y + 1);
    this.addNeighbor(neighbors, x - 1, y);
    this.addNeighbor(neighbors, x + 1, y);
    return neighbors;
  }

  addToOpenSet(openSet, goal, current, previous) {
    // Calculate the scores need to judge better paths
    const { x, y } = current;
    const gScore = previous ? previous.gScore + this.tileCost(x, y) : 0;
    const hScore = distance(current, goal);
    const fScore = gScore + hScore;
    const currentNode = { x, y, previous, gScore, hScore, fScore };

    // if the open set is empty no need to search for the insertion point
    if (openSet.length === 0) {
      openSet.push(currentNode);
      return;
    }

    // Search for the insertion point in the queue and insert
    for (let i = 0; i < openSet.length; i++) {
      const e = openSet[i];
      if (fScore < e.fScore || (fScore === e.fScore && hScore < e.hScore)) {
        openSet.splice(i, 0, currentNode);
        return;
      }
    }
  }


  findPath(from, to) {
    const openSet = [];
    const closedSet = {};

    this.addToOpenSet(openSet, to, from, null);

    while (openSet.length > 0) {
      // Left pop the next best node from the priority queue
      const current = openSet.shift();

      // If the current key is in the closed set, go to the next one
      const currentKey = utils.keyFromXY(current.x, current.y);
      if (currentKey in closedSet) {
        continue;
      }

      // Add to the closed set
      closedSet[currentKey] = current;

      // If we're at the goal, stop searching
      if (current.x === to.x && current.y === to.y) {
        break;
      }

      // Check neighbors
      for (let neighbor of this.getNeighbors(current.x, current.y)) {
        const neighborKey = utils.keyFromXY(neighbor.x, neighbor.y);
        if (neighborKey in closedSet) {
          continue;
        }
        this.addToOpenSet(openSet, to, neighbor, current);
      }
    }

    // Reconstruct path by left pushing previous nodes back to start
    const path = [];
    let node = closedSet[utils.keyFromXY(to.x, to.y)];
    while (node) {
      path.unshift({ x: node.x, y: node.y });
      node = node.previous;
    }
    return path;
  }
}
