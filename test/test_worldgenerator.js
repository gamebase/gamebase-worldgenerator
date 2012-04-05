var async = require('async'),
    expect = require('chai').expect,
    fs = require('fs'),
    Map = require('../src/map/map'),
    VectorGenerator = require('../src/map/vectorgenerator');

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