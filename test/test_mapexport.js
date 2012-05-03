var async = require('async'),
    expect = require('chai').expect,
    fs = require('fs'),
    GBTypes = require('gamebase-types'),
    WorldGenerator = require('../src/generator/worldgenerator.js'),
    TMXExporter = require('../src/exporter/tmxexporter');
;

describe('Test generating and exporting a map to TMX', function() {
    
    it('should create and generate a map', function(done) {
       
        var configFile = '../resources/world/browserquest/worldconfig.json';
        
        fs.readFile(configFile, 'UTF-8', function(err, data) {
            
            var config = JSON.parse(data),
                generator = new WorldGenerator(config),
                exporter = new TMXExporter(),
                output = fs.createWriteStream('world1.tmx'),
                world = generator.generate();
                       
            output.on('close', function() {
                console.log('ended');
                done();
            });
        
            output.on('error', function(exception) {
                console.log(exception);
            });            
            
            exporter.export(world, configFile, output, function(err) {
            });
        });
    });
         
});