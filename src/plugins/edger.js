var _ = require('underscore'),
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer;

function Edger(map, options) {
    this.addEdges(map, options);
}

/**
  Creates an edge between two different terrain types, and adds them as another layer to the map
 **/
Edger.prototype.addEdges = function(map, options) {
    
    var sourceLayer = map.getLayer(options.sourceLayer),
        edgeLayer = new TerrainLayer(options.outputLayer || 'edges', map.size, {}),
        sources = options.sourceTiles,
        nextTo = options.nextToTiles,
        edges = options.edges,
        invert = options.invert || false;
        
    function testSurrounds(surrounds) {
        var result = 0;
        for (var i = 0; i < surrounds.length; i++) {
            if (surrounds[i] && helper.isInArray(surrounds[i].tn, nextTo)) {
                var apply = (i === 0 ? 1 : Math.pow(2, i));
                result = result | apply;
            }
        }
        return result;
    }
    
    for (var i = 0; i < sourceLayer.tiles.length; i++) {
        var position = sourceLayer.getIndexPosition(i),
            tile = sourceLayer.getTile(position);
        if (helper.isInArray(tile.tn, sources)) {
            var surrounds = sourceLayer.getSurrounds(position.x, position.y),
                test = testSurrounds(surrounds);
                
            _.each(edges, function(value, key) {
               var flag = parseInt(key, 2);
               if ((test & flag) === flag) {
                   edgeLayer.setTile(position.x, position.y, new Tile({terrain: value}));
               } 
            });
        }
    }
    
    if (invert) {
        for (var i = 0; i < edgeLayer.tiles.length; i++) {
            var position = edgeLayer.getIndexPosition(i),
                    tile = edgeLayer.getTile(position);
                    
            if (tile && tile.tn > 0) {
                sourceLayer.setTile(position.x, position.y, new Tile({terrain: options.invertTo || nextTo[0]}));    
            }
        }        
    }
    
    map.addLayer(edgeLayer);
    console.log('edging done');
    
}

module.exports = Edger;