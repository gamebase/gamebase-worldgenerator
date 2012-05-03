var _ = require('underscore'), 
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TiledObjectLayer = GBTypes.TiledObjectLayer;

/**
  The Meanderer takes a number of origin points and then selects a random direction to progress in.
  It will then continue to meander in a direction until probability tells it to stop, or
  it encounters a base terrain it cannot use. 
  
  Each direction is given a number (c), and the meanderer can only move to a direction n, where n is between c and c + range.
 **/
function Meanderer(map, options) {
   
   this.map = map;
   this.outputLayer = this.map.getLayer(options.outputLayer || Date.now());
   this.sourceLayer = this.map.getLayer(options.sourceLayer);
   
   // Create an output layer if required
   if (!this.outputLayer) {
       this.outputLayer = new TiledObjectLayer(options.outputLayer || Date.now(), this.map.size, {}),
       this.map.addLayer(this.outputLayer);    
   }
   
   this.numOrigins = options.numOrigins || 5;
   this.continuation = options.continuation;
   this.baseTiles = options.baseTiles;
   this.wheel = options.directionWheel;
   this.elements = 0;
   
   while (this.numOrigins--) {
       this.meander();
   }
}

/**
  The meander function chooses a starting point on the map that meets the criteria, and
  meanders until it reaches a stop
 **/
Meanderer.prototype.meander = function() {
    
    var origin = null,
        direction = 0,
        maxAttempts = 10,
        attempt = 0,
        size = this.map.size,
        width = size.width,
        height = size.height,
        dirInfo = null;
        
    // Get a valid starting point and direction
    while (!this.validPlacement(origin, direction)) {
        
        // Break out if required
        if (attempt >= maxAttempts) {
            return false;
        }
        
        origin = {
            x: GBTypes.randomInRange(0, width - 1),
            y: GBTypes.randomInRange(0, height - 1)
        };
        if (this.wheel.start) {
            direction = this.wheel.start.actsAs;
            dirInfo = this.wheel.start;
            
        } else {
            direction = GBTypes.randomInRange(0, this.wheel.directions.length - 1);
            this.wheel.directions[direction];
        }
                
        attempt ++;        
    }
    
    console.log('starting sequence');
    
    var canPlace = true,
        topLeft = origin,
        movements = 0,
        options = {};
        
    function couldPossiblyTerminate(direction, maxDirection) {
        
        
        
    }
        
    while (canPlace) {
        
        var alignment = dirInfo.alignNext,
            nextDir = null,
            maxDirection = direction + (dirInfo.range || 1),
            nextDirection = null, 
            deltaX = 0,
            deltaY = 0;
            
        if (!this.place(topLeft, direction, dirInfo, options)) {
            console.log('breaking because could not place');
            break;
        };        
        options = {};
        movements++;
        if ()
        // Check if we are allowed a new movement
        canPlace = helper.isTriggered(this.continuation.probability - (movements * this.continuation.degradation));
        if (!canPlace) {
            console.log('probability broken');
            break;
        }

        // Choose the next direction
        console.log('choosing direction beween ' + direction + ' and ' + maxDirection);
        nextDirection = GBTypes.randomInRange(direction, maxDirection);
        if (nextDirection >= this.wheel.directions.length) {
            nextDirection = nextDirection - this.wheel.directions.length;
        }
        
        nextDir = this.wheel.directions[nextDirection];
        console.log('direction = ' + nextDirection + ' [' + nextDir.name + ']');
        
        // Calculate the delta x and y to use to calculate the new topLeft
        if (nextDirection === direction && nextDir.sameNext) {
            deltaX = nextDir.sameNext.deltaX || 0;
            deltaY = nextDir.sameNext.deltaY || 0;
            options = {allowCollisions: true};
        } else if (alignment === "bottom") {
            deltaY = dirInfo.size.height - nextDir.size.height;
            deltaX = dirInfo.size.width;
        } else if (alignment === "right") {
            deltaY = 0 - nextDir.size.height;
            deltaX = dirInfo.size.width - nextDir.size.width;
        } else if (alignment === "top") {
            deltaY = 0;
            deltaX = 0 - nextDir.size.width;
        } else if (alignment === "left") {
            deltaX = 0;
            deltaY = 0 + dirInfo.size.height;
        }
        direction = nextDirection;
        dirInfo = this.wheel.directions[direction];
        console.log('deltaX = ' + deltaX + '; deltaY = ' + deltaY);
        topLeft = {x: topLeft.x + deltaX, y: topLeft.y + deltaY};
        canPlace = this.validPlacement(topLeft, direction);
        console.log('placement valid? ' + canPlace);
    }
}

/**
  Validates that for the origin point the direction can be placed
 **/
Meanderer.prototype.validPlacement = function(topLeft, direction) {
    
    if (!topLeft || direction < 0) {
        console.log('No top left or direction');
        return false;
    }
        
    var tile = this.sourceLayer.getTile(topLeft);
    
    // Check the topLeft point first
    if (!tile || !helper.isInArray(tile.tn, this.baseTiles)) {
        console.log('Invalid top left base tile');
        return false;
    }
    
    // Check we have a valid direction
    if (direction < 0 || direction >= this.wheel.directions.length) {
        console.log('invalid direction');
        return false;
    }
    
    var dirInfo = this.wheel.directions[direction],
        size = dirInfo.size || {width: 1, height: 1},
        numTiles = dirInfo.tiles.length;
        
    // Check the placement of the tile    
    while (numTiles--) {
        var relativePosition = { x: numTiles % size.width, y: Math.floor(numTiles / size.width) },
            layerPosition = { x: topLeft.x + relativePosition.x, y: topLeft.y + relativePosition.y },
            dirTile = this.sourceLayer.getTile(layerPosition);
            
        if (!dirTile || !helper.isInArray(dirTile.tn, this.baseTiles)) {
            console.log('tile @ ' + layerPosition.x + ',' + layerPosition.y + ' is invalid');
            return false;
        }
    }
    
    return true;
}

/**
  Places the meandered piece down
 **/
Meanderer.prototype.place = function(topLeft, direction, dirInfo, options) {
    console.log('placing cliff at ' + topLeft.x + ',' + topLeft.y + ' in direction ' + direction);
    var result = this.outputLayer.addObject({width: dirInfo.size.width, tiles: dirInfo.tiles, topLeft: topLeft, id: "element " + this.elements}, options);
    this.elements++;
    return result;
}

module.exports = Meanderer;