var _ = require('underscore'),
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer,
    probabilityCalculators = {
        additive: function(adjacent, options) {
            var value = options.base + (options.value * adjacent);
            return (value > (options.ceiling || 1) ? options.ceiling || 1 : value);
        },
        exponential: function(adjacent, options) {
            var value = options.base + (Math.pow(options.factor, adjacent) * options.value); 
            return value;
        }
    };

/**
  The BiomeGenerator iterates over all the tiles in a given layer where the tile
  is one of the matching base tiles, and then, using a probability matrix, determines
  whether the tile needs to change to a different type
 **/
function BiomeGenerator(map, options) {
    
    var sourceLayer = map.getLayer(options.sourceLayer),
        outputLayer = map.getLayer(options.outputLayer),
        baseTerrains = options.baseTerrains,
        biomes = options.biomes,
        numPasses = options.passes || 2;
        
    if (!outputLayer) {
        outputLayer = new TerrainLayer(options.outputLayer || 'biomes', map.size, {});
        map.addLayer(outputLayer);
    }
            
    // Returns the number of adjacent tiles that are a part of the same biome
    function getAdjacentBiomeTiles(biomeTiles, surrounds) {
        var i = surrounds.length,
            result = 0;
        while (i--) {
            // console.log((surrounds[i] ? surrounds[i].tn : 'inv: ' + i) + " || " + biomeTiles);
            if (surrounds[i] && helper.isInArray(surrounds[i].tn, biomeTiles)) {
                result++;
            }
        }
        return result;
    }
    
    // Simple probability calculation
    function isTriggered(probability) {
        var outcome = Math.random();
        return (outcome <= probability);
    }
    
    // Returns the option that matches the given probability
    function returnMatching(matrix) {
        var base = 0,
            outcome = Math.random(),
            result = null;
            
        _.each(matrix, function(value, key) {
            var upperRange = base + value;
            if (outcome >= base && outcome < upperRange) {
                result = key;
            }
            base = upperRange;
        });
        return result;        
    }
    
    /**
      Creates a chunk of biome tiles
     **/
    function createChunk(biome, position) {
            
        var chunkSize = biome.chunkSize || {width: 1, height: 1};
        
        for (var i = 0; i < chunkSize.width; i++) {
            for (var j = 0; j < chunkSize.height; j++) {
                
                var fillPosition = {x: position.x + i, y: position.y + j},
                    sourceTile = sourceLayer.getTile(fillPosition);
                    
                if (sourceTile && helper.isInArray(sourceTile.tn, baseTerrains)) {
                    var triggeredTile = parseInt(returnMatching(biome.output));
                    outputLayer.setTile(fillPosition.x, fillPosition.y, new Tile({terrain: triggeredTile}));
                }
            }
        }
    }
    
    function doPass(passNum, fillOnly) {
        var forward = (passNum % 2 === 0),
            counter = (forward ? 0 : sourceLayer.tiles.length - 1);
            
        while ((forward ? counter < sourceLayer.tiles.length : counter > 0)) {
            var position = sourceLayer.getIndexPosition(counter),
                tile = sourceLayer.getTile(position);

            if (helper.isInArray(tile.tn, baseTerrains)) {

                var surrounds = sourceLayer.getSurrounds(position.x, position.y),
                    numBiomes = biomes.length;

                // Process until a biome is triggered. If no biome is triggered, stay as the base
                while (numBiomes--) {

                    var biome = biomes[numBiomes],
                        prob = biome.probability,
                        adjacent = getAdjacentBiomeTiles(biome.biomeTiles, surrounds),
                        chance = prob.normal || 0;

                    // Use the adjacent probability
                    if (adjacent > 0) {
                        chance = probabilityCalculators[prob.adjacent.type](adjacent, prob.adjacent.options);                                        
                    }

                    // Check to see whether this biome should be applied
                    if (adjacent >= (prob.adjacent.fill || 9) || (!fillOnly && isTriggered(chance))) {
                        createChunk(biome, position);
                        break;
                    }
                }    
            }
            
            counter = counter + (forward ? 1 : -1);            
        }
        
    }
    
    for (var i = 1; i <= numPasses; i++) {
        doPass(i, false);
    }
    
    if (options.fillPass) {
        doPass(options.passes + 1, true);
    }
}

module.exports = BiomeGenerator;