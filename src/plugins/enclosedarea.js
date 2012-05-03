var _ = require('underscore'), 
    helper = require('../util/helper'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer;

/**
  The EnclosedArea attempts to create an enclosed terrain area within set parameters. It uses
  octal directions to move around, and requires that each time a direction is changed that
  it continues in that direction for a mininum number of movements
 **/
function EnclosedArea(map, options) {
   
   this.map = map;
   this.outputLayer = this.map.getLayer(options.outputLayer || Date.now());
   this.sourceLayer = this.map.getLayer(options.sourceLayer);
   
   // Create an output layer if required
   if (!this.outputLayer) {
       this.outputLayer = new TerrainLayer(options.outputLayer || Date.now(), this.map.size, {}),
       this.map.addLayer(this.outputLayer);    
   }
   
   this.numOrigins = options.numOrigins || 5;
   this.baseTiles = options.baseTiles;
   this.outputTile = options.outputTile;
   this.minimumMovements = options.minimumMovements || 3;
   this.maxDirections = 8;
   this.changeProbability = options.changeProbability || 0.5;
   this.deltas = [
       {x: 1, y: 0}, // East
       {x: 1, y: -1}, // North East
       {x: 0, y: -1}, // North,
       {x: -1, y: -1}, // North West
       {x: -1, y: 0}, // West
       {x: -1, y: 1}, // South West
       {x: 0, y: 1}, // South
       {x: 1, y: 1} // South East            
   ];
   
   while (this.numOrigins--) {
       this.enclose();
   }
}

/**
  The meander function chooses a starting point on the map that meets the criteria, and
  meanders until it reaches a stop
 **/
EnclosedArea.prototype.enclose = function() {

    var origin = {
            x: GBTypes.randomInRange(0, this.map.size.width - 1),
            y: GBTypes.randomInRange(0, this.map.size.height - 1)
        },
        direction = 0, 
        joined = false,
        // max = 20,
        // current = 0,
        position = {x: origin.x, y: origin.y};
        
    this.boundaries = [];
    while (!joined) {
        
        var delta = this.deltas[direction];
            
        // Move the minimum distance, but no minimum distance for the last straight
        if (!(position.y === origin.y && position.x < origin.x)) {
            position = this.moveMinimum(position, delta);
        }
        console.log('moving in direction ' + direction);
        console.log('a) Position: ' + position.x + ',' + position.y + ' [' + delta.x + ',' + delta.y + ']');
        while (!this.changeDirection(origin, position, direction)) {
            position = this.move(position, delta);
            console.log('b) Position: ' + position.x + ',' + position.y + ' [' + delta.x + ',' + delta.y + ']');
            if (position.x === origin.x && position.y === origin.y) break;
        }
        
        direction = direction + 1;
        if (direction >= this.maxDirections) {
            direction = this.maxDirections - direction;
        }
        joined = position.x === origin.x && position.y === origin.y;        
    }
    
    var self = this;
    // Fill in down from top to bottom
    _.each(this.boundaries, function(value, key) {
        var sorted = _.sortBy(value, function(y) { return y; });
    
        for (var yPos = sorted[0]; yPos <= sorted[sorted.length - 1]; yPos++) {
           self.outputLayer.setTile(parseInt(key), yPos, new Tile({terrain: self.outputTile}));
        }    
    });
    
}

/**
  Moves in the indicated delta once from the given position
 **/
EnclosedArea.prototype.move = function(position, delta) {
    
    var newPosition = {x: position.x + delta.x, y: position.y + delta.y};
    this.addBoundary(newPosition)
    return newPosition;
}

EnclosedArea.prototype.addBoundary = function(position) {
    this.outputLayer.setTile(position.x, position.y, new Tile({terrain: this.outputTile}));
    if (!this.boundaries[position.x]) {
        this.boundaries[position.x] = new Array();
    }
    this.boundaries[position.x].push(position.y);
}

/**
  Moves the minimum distance in the required direction, and returns
  the new position
 **/
EnclosedArea.prototype.moveMinimum = function(position, delta) {
    var i = this.minimumMovements;
    while (i--) {
        position = this.move(position, delta);
    }
    return position;
}

/**
  Does a check to see whether we are required to change direction in order to 
  maintain the ability to create the enclosure, or failing that, if we have 
  been triggered by probability to change
 **/
EnclosedArea.prototype.changeDirection = function(origin, position, direction) {
    
    var nextDirection = direction + 1;
    if (nextDirection >= this.maxDirections) {
        nextDirection = this.maxDirections - nextDirection;
    }
    var delta = this.deltas[direction],
        nextDelta = this.deltas[nextDirection];
    
    // Switch to the home straight when they are on the straight
    if (direction === 7) {
        return (position.y >= origin.y);
    }
    
    if (delta.y > 0) {
        
        if (delta.y > 0 && position.y + delta.y > origin.y) {
            return true;
        }
        
        // Make sure we're not switching to the last direction too early
        if (nextDelta.x > 0) {
            var remainingX = origin.x - position.x,
                remainingY = origin.y - position.y,
                turns = remainingY * nextDelta.y;
                
            // Can't switch yet as we'll overrun
            if (turns * nextDelta.x + position.x > origin.x) {
                return false;
            }
            
        }
    }
    
    // Determine if we wait another turn to change direction, will the movement push us outside
    // the thresholds
    if (nextDelta.y > 0) {
        
        // Do not allow movements to start heading back to the origin until the position x has returned past the origin
        if (position.x > origin.x) return false;
                
        // If we are heading back, determine whether we have room to move
        var minimumYChange = nextDelta.y * (this.minimumMovements + 1),
            minimumY = position.y + minimumYChange;
            
        // We must change directions now in order to meet the origin
        if (minimumY >= origin.y) return true;
    } else if (direction === 0){
        
        // If we are finishing, do not allow a direction change
        if (position.x < origin.x && position.y == origin.y) {
            return false;
        }
        
    } 
    
    // If no thresholds are triggered, leave it up to chance
    return (helper.isTriggered(this.changeProbability));
}

module.exports = EnclosedArea;