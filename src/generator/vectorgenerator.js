var _ = require('underscore'), 
    async = require('async'),
    paper = require('paperjs-geometry'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    Terrain = require('./terrain');

/**
  The VectorGenerator attempts to create a map by creating a number of 'sparks' from
  which to shoot out random vector lines. These vector lines are then joined together by working around clockwise
  to join them together
 **/
function VectorGenerator(map, opts) {
   
   opts = opts || {};
   this.map = map;
   this.numOrigins = opts.numOrigins || 5;
   this.numVectors = opts.numVectors || 6;
   this.vectorMin = opts.minVectorLength || 5;
   this.vectorMax = opts.maxVectorLength || 50;
   
   this.originators = [];
   
   var self = this;
   this.initialiseToWater(function() {
       self.generateLandMass();
   });
}

/**
  Initialises the map to water
 **/
VectorGenerator.prototype.initialiseToWater = function(callback) {
    
    var water = {elevation: 1, terrain: Terrain.sand.id},
        size = this.map.size,
        self = this;
    
    this.map.tiles = new Array(this.map.size.width);
    
    for (var i = 0; i < size.width; i++) {
        this.map.tiles[i] = new Array(size.height);
    }
    
    async.map(this.map.tiles, 
        function (column, callback) {
            for (var j = 0; j < column.length; j++) {
                column[j] = new Tile(water);
            }
            callback(null, column);
        },
        function (err, results) {
            self.map.tiles = results;
            callback();
        }        
    );
}

/**
  Generates the land mass using originators and vectors
 **/
VectorGenerator.prototype.generateLandMass = function() {
    
    this.generateOriginators();
    for (var i = 0; i < this.originators.length; i++) {
        this.explodeLandMass(this.originators[i]);
    }
    
}

/**
  This creates the originator points for the vectors
 **/
VectorGenerator.prototype.generateOriginators = function() {
   
   var size = this.map.size,
       width = size.width,
       height = size.height,
       land = {elevation: 2, terrain: Terrain.grass.id};
       
   // Clear any existing originators
   this.originators = [];
   
   // Create the originators
   for (var i = 0; i < this.numOrigins; i++) {
       var originator = {
           x: GBTypes.randomInRange(0, width),
           y: GBTypes.randomInRange(0, height)
       };
       this.originators.push(originator);
       this.map.setTile(originator.x, originator.y, new Tile(land));
   }
    
}

/**
  Takes an originating point, creates n number of points that reflect end points
  of vectors flung out from the originator, and then join the points together
 **/
VectorGenerator.prototype.explodeLandMass = function(originator) {
    
    var origin = new paper.Point(originator.x, originator.y),
        deltaAngle = 360 / this.numVectors,
        angle = 0,
        size = this.map.size,
        points = [];
    
    // Create a vector for each point
    for (var i = 0; i < this.numVectors; i++) {
        
        // Create a vector with a random length and specified angle
        var vector = new paper.Point(),
            terminus;
        vector.angle = angle;
        vector.length = GBTypes.randomInRange(this.vectorMin, this.vectorMax);
        terminus = origin.add(vector);
        var point = {x: Math.round(terminus.x), y: Math.round(terminus.y)};
        
        // Keep the point within the bounds of the map
        if (point.x < 0) point.x = 0;
        if (point.x >= size.width) point.x = size.width;
        if (point.y < 0) point.y = 0;
        if (point.y >= size.height) point.y = size.height;
        
        points.push(point);
        angle += deltaAngle;
    }
    
    console.log(points);
    this.createContinents(points);
    
}

/**
  Creates the boundaries of the continent
 **/
VectorGenerator.prototype.createContinents = function(points) {
    
    
    var boundaries = [],
        land = {elevation: 2, terrain: Terrain.grass.id};
    
    function addBoundary(point) {
        if (!boundaries[point.x]) {
            boundaries[point.x] = new Array();
        }
        boundaries[point.x][point.y] = point.y;
    }
    
    for (var i = 0; i < points.length; i++) {
        var point1 = points[i],
            point2 = points[(i+1 == points.length ? 0 : i + 1)],
            nextPoint = {x: point1.x, y: point1.y};
        
        addBoundary(point1);
        addBoundary(point2);
            
        // Draw a line between the two
        while (nextPoint.x != point2.x && nextPoint.y != point2.y) {
            var deltaX = (nextPoint.x < point2.x ? 1 : -1),
                deltaY = (nextPoint.y < point2.y ? 1 : -1);
                
            if (nextPoint.x == point2.x) {
                nextPoint.y += deltaY;
            } else {
                nextPoint.x += deltaX;
            }
            addBoundary(nextPoint);            
        }
        
    }
    
    // Fill in down from top to bottom
    for (var i = 0; i < boundaries.length; i++) {
        var sorted = _.sortBy(boundaries[i], function(y) { return y; });
        
        for (var yPos = sorted[0]; yPos <= sorted[sorted.length - 1]; yPos++) {
           this.map.setTile(xPos, yPos, new Tile(land));
        }
    }
}

module.exports = VectorGenerator;