var _ = require('underscore'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer,
    helper = require('../util/helper');

/**
  The LayerDifference will remove tiles from an output layer, if tiles already exist
  on the source layers
 **/
function LayerDifference(map, options) {
   
   var outputLayer = map.getLayer(options.outputLayer || 'terrain'),
       sourceLayers = _.map(options.sourceLayers, function(value) { return map.getLayer(value); });
       
   var i = outputLayer.tiles.length;
    
    // Go through all the tiles and check
    while (i--) {
        
        for (var j = 0; j < sourceLayers.length; j++) {
            var tile = sourceLayers[j].tiles[i];
            if (tile && tile.tn > 0) {
                outputLayer.tiles[i] = null;
                break;
            }
        }        
    }
}

module.exports = LayerDifference;