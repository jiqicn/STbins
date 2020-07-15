// background algorithms to deal with the input data

var Processor = function() {
    this.result = {} // final result
};

// preprocess the input list into the following format
// {index: {freq:, list:{value: freq...}}...}
Processor.prototype.process = function(input, varSeries, varAttr) {
    // stream the input
    this.result = {};
    var len = input.length;
    var english = /^[A-Za-z0-9]*$/; // english charactor check

    for (var i = 0; i < len; i++) {
        // get the series and attribute value
        var series = input[i][varSeries];
        var attr = input[i][varAttr].toLowerCase().replace(/[#\s]/g, '');

        if (this.result[series] == undefined) {
            // if not exist, add new entity
            this.result[series] = {
                freq: 1,
                list: {}, // frequency statis for each value
                major: {} // major components of list
            };
            this.result[series].list[attr] = 1;
        } else {
            this.result[series].freq += 1;
            if (english.test(attr) && attr.length > 0)
                    this.result[series].list[attr] = this.result[series].list[attr] == undefined ? 1 : this.result[series].list[attr] + 1;
        }
    }

    // reduce the size of list
    for (var i in this.result) {
        var list = this.result[i].list;

        // compute the major list
        var m = rangeValue(Object.keys(list).map(function(key) {return list[key];}), 0.25); // larger than Q1 value
        for (j in list) if (list[j] >= m) this.result[i].major[j] = list[j];
    }

    // console.log(this.result);
    return this.result;
};

const rangeValue = function(values, r) {
    var max = Math.max(...values), min = Math.min(...values);
    return (max - min) * r + min
}

// Compute Jaccard similarity between two lists with duplication
// format of lists: {item: freq...}
const jaccard = function(listA, listB) {
    // get the union set of items between list A and B
    var indexA = Object.keys(listA),
        indexB = Object.keys(listB);
    var index = Array.from(new Set(indexA.concat(indexB)));

    // compute top and bottom values of jaccard similarity
    var top = 0, bottom = 0;
    Array.from(index).forEach(function(v) {
        var a = listA[v] || 0, b = listB[v] || 0;
        top += Math.min(a, b);
        bottom += Math.max(a, b);
    });
    
    return (top / bottom);
};