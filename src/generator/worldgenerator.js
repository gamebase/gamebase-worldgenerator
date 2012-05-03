var _ = require('underscore'),
    GBTypes = require('gamebase-types'),
    defaultConfig = {
        parameters: {
            size: { width: 100, height: 100}
        }
    };



/**
  The WorldGenerator is used to handle the creation of a world based on a supplied
  configuration. The configuration should include details as to the tileset, tile
  definitions, and the generation phases (passes) that should be used to create the world.
  
  Once the config has been loaded, a world may be generated (or repeatedly generated) by using
  the .generate(outputTo, callback) function. When completed, the load function will return a callback indicating success or
  failure
 **/
function WorldGenerator(config) {
    
    this.config = _.extend(defaultConfig, config);
    
}

/**
  Generates a world using this WorldGenerator's configuration
  and streams outputs the result to the stream given by outputTo
 **/
WorldGenerator.prototype.generate = function(options, callback) {
    
    var map = new GBTypes[this.config.parameters.type || 'Map2D'](this.config.parameters.size),
        self = this;
    
    // Process the phases
    _.each(this.config.phases, function(phase, index) {
        
        console.log(phase.description || 'Phase ' + (index + 1));
    
        var plugin = require('../plugins/' + phase.plugin),
            instance = new plugin(map, phase.options);
        
    });
    
    return map;
    
}

module.exports = WorldGenerator;