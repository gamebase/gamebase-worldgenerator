var _ = require('underscore'),
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TiledObjectLayer = GBTypes.TiledObjectLayer;

/**
The advanced edger is similar to the Edger, but allows for edge tiles of a customisable size
**/
function AdvancedEdger(map, options) {
    this.addEdges(map, options);
}


AdvancedEdger.prototype.addEdges = function(map, options) {
    
    var sourceLayer = map.getLayer(options.sourceLayer),
        outputLayer = map.getLayer(options.outputLayer),
        sources = options.sourceTiles,
        nextTo = options.nextToTiles,
        objects = options.objects,
        edges = options.edges,
        invert = options.invert || false,
        objectId = 0;
        
    if (!outputLayer) {
        outputLayer = new TiledObjectLayer(options.outputLayer || Date.now(), map.size, {});
        map.addLayer(outputLayer);
    }
        
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
            tile = sourceLayer.getTile(position) || {tn: -1};
        if (helper.isInArray(tile.tn, sources)) {
            var surrounds = sourceLayer.getSurrounds(position.x, position.y),
                test = testSurrounds(surrounds);
                
            _.each(edges, function(edge) {
                
                _.each(edge, function(value, key) {
                    var flag = parseInt(key, 2);
                    if ((test & flag) === flag) {
                        var object = objects[value],
                            offset = object.offset || {x: 0, y: 0},
                            topLeft = {x: position.x + offset.x, y: position.y + offset.y},
                            entity = _.extend(object, {topLeft: topLeft, id: objectId});
                            
                        outputLayer.addObject(entity, {allowCollisions: object.overwrite === true});
                        objectId++;
                    }
                });
               
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
    
}

module.exports = AdvancedEdger;