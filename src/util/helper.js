exports.isInArray = function(value, array) {
    if (array.indexOf) {
        return array.indexOf(value) != -1;
    } else {
        var i = array.length;
        while (i--) {
            if (value == array[i]) {
                return true;
            }
        }
        return false;        
    }
}

// Simple probability calculation
exports.isTriggered = function(probability) {
    var outcome = Math.random();
    return (outcome <= probability);
}