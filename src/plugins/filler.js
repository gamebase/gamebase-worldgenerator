var GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer,
    helper = require('../util/helper');

/**
  The Filler just fills the map with a specified terrain type
 **/
function Filler(map, options) {
   
   var terrain = map.getLayer(options.outputLayer || 'terrain'),
       fill = options.fillTile || 0,
       where = options.baseTiles || null;
   
   if (!terrain) {
       terrain = new TerrainLayer(options.outputLayer || 'terrain', map.size, {}),
       map.addLayer(terrain);       
   }   
    
   var terrainBase = {elevation: 1, terrain: fill},
       size = map.size,
       i = terrain.tiles.length;
    
    // Set all the terrain to water
    while (i--) {
        if (where) {
            if (terrain.tiles[i] && helper.isInArray(terrain.tiles[i].tn, where)) {
                terrain.tiles[i] = new Tile(terrainBase);
            }
        } else {
            terrain.tiles[i] = new Tile(terrainBase);
        }        
    }
}

module.exports = Filler;