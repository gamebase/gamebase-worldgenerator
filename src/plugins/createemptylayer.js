var GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer,
    helper = require('../util/helper');

/**
  Does as the name suggest - creates as empty layer
 **/
function CreateEmptyLayer(map, options) {
   
   var layer = map.getLayer(options.outputLayer);
   
   if (layer) return;
   
   layer = new GBTypes[options.type || 'TerrainLayer'](options.outputLayer || 'empty', map.size, {}),
   map.addLayer(layer);       
}

module.exports = CreateEmptyLayer;