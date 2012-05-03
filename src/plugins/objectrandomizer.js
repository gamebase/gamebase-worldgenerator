var _ = require('underscore'),
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TiledObjectLayer = GBTypes.TiledObjectLayer;

/**
  The ObjectRandomizer allows for random object to be placed on appropriate tile types
 **/
function ObjectRandomizer(map, options) {
    
    var sourceLayer = map.getLayer(options.sourceLayer),
        outputLayer = map.getLayer(options.outputLayer),
        sections = options.sections,
        numTiles = sourceLayer.tiles.length;
        
    if (!outputLayer) {
        outputLayer = new TiledObjectLayer(options.outputLayer || Date.now(), map.size, {});
        map.addLayer(outputLayer);
    }
    
    // Simple probability calculation
    function isTriggered(probability) {
        var outcome = Math.random();
        return (outcome <= probability);
    }
    
    /**
      Checks that the tiles in the indicated positions match the required tiles
     **/
    function checkBase(position, baseSize, requiredTiles) {
        
        for (var i = 0; i < baseSize[0]; i++) {
            for (var j = 0; j < baseSize[1]; j++) {
                
                var tile = sourceLayer.getTile({x: position.x + i, y: position.y + j});
                if (!tile || !helper.isInArray(tile.tn, requiredTiles)) {
                    return false;
                }        
            }
        }
        return true;        
    }
    
        
    while (numTiles--) {
        var position = sourceLayer.getIndexPosition(numTiles),
            tile = sourceLayer.getTile(position),
            objectTile = outputLayer.getTile(position);
        
        // If this tile is occupied, ignore as we are going to have conflicts
        if (objectTile && objectTile.tn && objectTile.tn != -1) continue;

        for (var j = 0; j < sections.length; j++) {
            
            var section = sections[j],
                created = false;
            
            if (created) break;
            
            if (tile && helper.isInArray(tile.tn, section.baseTiles)) {

                var numObjects = section.objects.length;

                // Process until a biome is triggered. If no biome is triggered, stay as the base
                while (numObjects--) {

                    var object = section.objects[numObjects],
                        chance = object.probability;

                    // Check to see whether this biome should be applied
                    if (isTriggered(chance)) {
                        
                        var origin = object.sprite.origin || [0,0],
                            topLeft = {x: position.x - origin[0], y: position.y - origin[1]},
                            entity = _.extend(object.sprite, {topLeft: topLeft, id: object.name + '-' + Date.now()});
                            
                        // Checks that the base of the object sits on the relevant land type
                        if (checkBase(topLeft, object.sprite.base || [1,1], section.baseTiles)) {
                            created = outputLayer.addObject(entity);
                            break;
                        }
                    }
                }    
            }    
        }
    }
}

module.exports = ObjectRandomizer;