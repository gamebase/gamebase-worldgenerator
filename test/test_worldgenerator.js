var async = require('async'),
    expect = require('chai').expect,
    fs = require('fs'),
    GBTypes = require('gamebase-types'),
    Map = GBTypes.Map2D,
    VectorGenerator = require('../src/generator/vectorgenerator'),
    Visualizer = GBTypes.ASCIIVisualizer;

describe('Test making a map', function() {
    
    it('should correctly create a map', function(done) {
       
        var world = new Map({size: {width: 70, height: 70}}),
            generator = new VectorGenerator(world, {maxVectorLength: 20, numVectors: 10, numOrigins: 2}),
            visual = new Visualizer({colorize:true});
            
        console.log('Map generated');
        visual.visualizeTo(world, process.stdout);
        
        fs.writeFile('world.json', JSON.stringify(world), function (err) {
          if (err) throw err;
          done();
        });
    });
         
});