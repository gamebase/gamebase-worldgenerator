var _ = require('underscore'), 
    async = require('async'),
    paper = require('paperjs-geometry'),
    GBTypes = require('gamebase-types'),
    Tile = GBTypes.Tile,
    TerrainLayer = GBTypes.TerrainLayer;

/**
  The VectorGenerator attempts to create a map by creating a number of 'sparks' from
  which to shoot out random vector lines. These vector lines are then joined together by working around clockwise
  to join them together
 **/
function VectorGenerator(map, opts) {
   
   opts = opts || {};
   this.map = map;
   this.terrain = this.map.getLayer(opts.outputLayer || 'terrain');
   
   // Create an output layer if required
   if (!this.terrain) {
       this.terrain = new TerrainLayer(opts.outputLayer || 'terrain', this.map.size, {}),
       this.map.addLayer(this.terrain);    
   }
   
   this.numOrigins = opts.numOrigins || 5;
   this.numVectors = opts.numVectors || 6;
   this.vectorMin = opts.minVectorLength || 5;
   this.vectorMax = opts.maxVectorLength || 50;
   this.baseTile = opts.baseTile
   this.terrainTile = opts.terrainTile;
   
   this.originators = [];
   
   var self = this;
   this.generateLandMass();
}

/**
  Initialises the map to water
 **/
VectorGenerator.prototype.initialiseToWater = function(callback) {
    
    var terrainBase = {elevation: 1, terrain: this.baseTile},
        size = this.map.size,
        self = this,
        i = this.terrain.tiles.length;
    
    // Set all the terrain to water
    while (i--) {
        this.terrain.tiles[i] = new Tile(terrainBase);
    }
    callback();
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
       terrainTile = {elevation: 2, terrain: this.terrainTile};
       
   // Clear any existing originators
   this.originators = [];
   
   // Create the originators
   for (var i = 0; i < this.numOrigins; i++) {
       var originator = {
           x: GBTypes.randomInRange(0, width - 1),
           y: GBTypes.randomInRange(0, height - 1)
       };
       this.originators.push(originator);
       this.terrain.setTile(originator.x, originator.y, new Tile(terrainTile));
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
        if (point.x >= size.width) point.x = size.width - 1;
        if (point.y < 0) point.y = 0;
        if (point.y >= size.height) point.y = size.height - 1;
        
        points.push(point);
        angle += deltaAngle;
    }
    
    this.createContinents(points);
}

/**
  Creates the boundaries of the continent
 **/
VectorGenerator.prototype.createContinents = function(points) {
    
    
    var boundaries = {},
        land = {elevation: 2, terrain: this.terrainTile},
        self = this;
    
    function addBoundary(point) {
        if (!boundaries[point.x]) {
            boundaries[point.x] = new Array();
        }
        boundaries[point.x].push(point.y);
    }
    
    for (var i = 0; i < points.length; i++) {
        var point1 = points[i],
            point2 = points[(i+1 == points.length ? 0 : i + 1)],
            nextPoint = {x: point1.x, y: point1.y};
        
        addBoundary(point1);
        addBoundary(point2);
            
        // Draw a line between the two
        while (nextPoint.x != point2.x || nextPoint.y != point2.y) {
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
    _.each(boundaries, function(value, key) {
        var sorted = _.sortBy(value, function(y) { return y; });

        for (var yPos = sorted[0]; yPos <= sorted[sorted.length - 1]; yPos++) {
           self.terrain.setTile(parseInt(key), yPos, new Tile(land));
        }    
    });
}

module.exports = VectorGenerator;