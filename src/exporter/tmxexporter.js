var _ = require('underscore'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util'),
    XML = require('xml'),
    path = require('path'),
    layerExporters = {
        'terrain': exportTerrainLayer,
        'tiledobject': exportTerrainLayer
    };

function BufferedStream() {
    
    
    
}
util.inherits(BufferedStream, stream.Stream);

/**
  Exports a map to a TMX (Tiled Map Editor) file format
 **/
function TMXExporter(opts) {
    this.opts = opts;
}

/**
  Exports a world map into a TMX format
 **/
TMXExporter.prototype.export = function(map, worldConfigFile, output, callback) {
    
    fs.readFile(worldConfigFile, 'UTF-8', function(err, data) {
        if (err) return callback(err);
        var config = JSON.parse(data),
            root = XML.Element({ 
                _attr: { 
                    version: '1.0', 
                    orientation: 'orthogonal', 
                    width: map.size.width,
                    height: map.size.height,
                    tilewidth: map.tile.width, 
                    tileheight: map.tile.height
                } 
            }),
            xml = XML({ map: root }, {stream: true});
            
        var buffer = "",
            writing = false,
            closed = false;
        
        function writeToOutput() {
            var buf = buffer;
            buffer = "";
            output.write(buf, "utf-8");
            writing = true;
        }
        
        xml.on('data', function(chunk) {
            buffer += chunk.toString();
            if (!writing) {
                writeToOutput();                
            }            
        });
        
        output.on('drain', function() {
            writing = false;
            if (!writing && buffer != "") {
                writeToOutput();  
            } else if (closed && buffer === "") {
                output.end();
            }
        });
        
        xml.on('close', function() {
           closed = true;
        });

        if (config.tilesets) {
            _.forEach(config.tilesets, function(tileset, key) {
                var tsel = XML.Element({
                    _attr: {
                        firstgid: "1",
                        name: key,
                        tilewidth: tileset.tile.width,
                        tileheight: tileset.tile.height
                    }
                });
                root.push({tileset: tsel});
                if (tileset.image) {
                    var imagePath = path.resolve(path.dirname(worldConfigFile), tileset.image.source);
                    tsel.push({image: {
                        _attr: {
                            source: imagePath,
                            width: tileset.image.width,
                            height: tileset.image.height
                        }
                    }});                    
                }
                tsel.close();
            });
        }

        for (var i = 0; i < map.layers.length; i++) {
            var layer = map.layers[i];  
            if (layerExporters[layer.type]) {
                layerExporters[layer.type](layer, root, config);
            }
        }
        
        root.close();
        callback();
        
    });
        
}

module.exports = TMXExporter;
/**
  Appends layer information to the given root element
 **/
function exportTerrainLayer(layer, root, config) {
    var tileset = config.tilesets['terrain'],
        element = XML.Element({
            _attr: {
                name: layer.id,
                width: layer.size.width,
                height: layer.size.height
            }
        }),
        data = XML.Element({    
        });
    root.push({layer: element});
    element.push({data: data});
    
    for (var i = 0; i < layer.tiles.length; i++) {
        var tile = layer.tiles[i],
            info = (tile ? tileset.tiles[tile.tn] || {gid: 0} : {gid: 0});
        data.push({
            tile: {
                _attr: {
                    gid: info.gid
                }
            }
        });
    }
    data.close();
    element.close();
}