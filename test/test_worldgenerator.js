var async = require('async'),
    expect = require('chai').expect,
    fs = require('fs'),
    GBTypes = require('gamebase-types'),
    Map = GBTypes.Map2D,
    VectorGenerator = require('../src/generator/vectorgenerator');

describe('Test making a map', function() {
    
    it('should correctly create a map', function(done) {
       
        var world = new Map({size: {width: 300, height: 300}}),
            generator = new VectorGenerator(world);
            
        console.log('Map generated');
        fs.writeFile('world.json', JSON.stringify(world), function (err) {
          if (err) throw err;
          done();
        });
    });
         
});