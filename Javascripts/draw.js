// class for drawing the visualization main view
var Drawer = function (draw, maxGroup, d, sPoint) {
    this.draw = draw; // svg instance for drawing
    this.maxGroup = maxGroup; // max number of groups included
    this.d = d;
    this.groups = []; // group array
    this.lastResult = null; // last input for computing link similarity
    this.lastKey = null;
    this.sPoint = sPoint;
    this.available = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    this.selected = [], anySelected = false;
    this.circleList = [];
    this.arc = true;
    this.sorted = false;
    // this.legendBar = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'];

    var title = rank.group().move(0, -10).attr('id', 'title');
    title.text("Frequency").attr('text-anchor', 'start').x(0)
    title.text("Object").attr('text-anchor', 'middle').x(rankSize[0]/ 2)
    title.text("Occupation").attr('text-anchor', 'end').x(rankSize[0])
};

Drawer.prototype.update = function (input) {
    var drawer = this;
    var keys = Object.keys(input).sort(), len = keys.length; // sort input by alphabetic
    var d = this.d
    var drawData = [] // data of node similarity

    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len; j++) {
            if (i != j) {
                var listA = (input[keys[i]] || {list: {}}).major, listB = (input[keys[j]] || {list: {}}).major;
                var s = jaccard(listA, listB);
                if (s > 0)
                    drawData.push({i: i, j: j, s: s});
            }
        }
    }
    drawData.sort(function(a, b){return a.s - b.s;});
    if (drawer.sorted)
        keys = TSP(keys, drawData); // order keys by the arc
    

    if (this.groups.length == 0) {
        // If nothing in the group list, only generate net entity, then add the net entity to the group
        var net = this.draw.group().move(0, 10); 
        this.groups.push(net);
    } else {
        // create both net and link
        var leftWidth = (3 * this.groups.length + 1) * 0.5 * d;
        var link = draw.group().move(leftWidth, 10);
        var net = draw.group().move(leftWidth + d, 10);

        // draw link entity
        var keysLeft = Object.keys(this.lastResult).sort();
        if (drawer.sorted)
            var keysLeft = this.lastKey;
        var keysRight = keys;
        var lenLeft = keysLeft.length;
        for (var i = 0; i < lenLeft; i++) {
            // var id = 'series_' + keysLeft[i].replace(/[^a-z0-9]/g, '');
            var j = keysRight.indexOf(keysLeft[i]); // get the right position
            if (j != -1) {
                // compute similarity
                var listA = this.lastResult[keysLeft[i]] == undefined ? {} : this.lastResult[keysLeft[i]].major;
                var listB = input[keysRight[j]] == undefined ? {} : input[keysRight[j]].major;
                var s = jaccard(listA, listB);

                // draw the lines
                var xLeft = 4.5, yLeft = i * d + d * 0.75;
                var xRight = d + 4.5, yRight = j * d + d * 0.75;
                link.line(xLeft, yLeft, xRight, yRight).stroke({width: 1.5})
                    .data('savedColor', 'hsl(0, 0%, ' + (1 - s) * 100 + '%)')
                    .attr({
                        'stroke': 'hsl(0, 0%, ' + (1 - s) * 100 + '%)'
                    });
            }
        }

        // add the net and link entity to the group
        this.groups.push(link);
        this.groups.push(net);

        // shift exist groups while overloading
        var shiftSpeed = $('input#speed').val() - 20
        if (this.groups.length >= this.maxGroup) {
            this.draw.each(function(i, children) {
                this.animate(shiftSpeed).dx(-3 * d); // move left all the groups
            }); 

            var removeID = setInterval(function() {
                drawer.groups.shift().remove();
                drawer.groups.shift().remove(); // remove groups outside
                clearInterval(removeID);
            }, 50);
        }
    }

    // draw background color
    if (len > 0)
        net.rect(2 * d, len * d - 0.2 * d).move(0.134 * d, 0.35 * d)
            .fill('white').attr({'rx': 7, 'ry': 6, 'stroke-width': 1, 'stroke': 'grey'});

    // draw dot entity
    for (var i = 0; i < len; i++) {
        var name = keys[i];
        var series = input[keys[i]];
        var y = i * d + d * 0.75;
        // var id = 'series_' + keys[i].replace(/[^a-z0-9]/g, '');

        // draw dots
        var mergeList = drawer.selected.concat(Object.keys(series.major))
        var selected = drawer.selected.length > 0 && Array.from(new Set(mergeList)).length < mergeList.length; 
        if (selected) {
            var selectedFreq = 0
            drawer.selected.forEach(function(item) {
                if (item in series.major)
                    selectedFreq += series.major[item];
            });
            var fOpacity = selectedFreq / (series.freq * 0.3);
            if (fOpacity <= 1/3) {
                fOpacity = 1/3
            } else if (fOpacity > 1/3 && fOpacity <= 2/3) {
                fOpacity = 2/3
            } else {
                fOpacity = 1
            }

        } else {
            if (drawer.anySelected)
                var fOpacity = 0.1;
            else
                var fOpacity = lightness(series.freq) / 0.3;
        }
        fOpacity = fOpacity;
        circleR = d * 0.5
        // circleR = 3 * d * Math.sqrt(fOpacity) 
        net.circle(circleR).center(d * 0.5, y)
            .attr({
                'fill': 'black',
                // 'fill': 'hsl(' + (fOpacity / 0.2 * 120 + 240)+ ', 100%, 50%)',
                'fill-opacity': fOpacity,
                // 'fill': 'white',
                'stroke-width': selected ? 2 : 1,
                'stroke': selected ? '#da532c': (drawer.anySelected ? 'lightgrey' : 'black')
            })
            .data(series)
            .data('index', i)
            .data('name', name)
            .data('savedFillOpacity', fOpacity)
            .click(function() {
                drawer.udpateMonitor(this);
                this.attr({
                    'stroke': '#da532c',
                    'stroke-width': 2
                });
            })
            .mouseover(function() {
                if (!drawer.anySelected) {
                    var infotip = $('div#info');
                    var currentIndex = this.data('index');
                    infotip.css({
                        'display': 'block',
                    });
                    var html = "&#9654Sequence Name: " + this.data('name');
                    html += "&nbsp&nbsp&nbsp &#9654Data Frequency: " + this.data('freq');
                    html += "&nbsp&nbsp&nbsp &#9654Number of different values: " + Object.keys(this.data('major')).length
                    infotip.html(html)

                    // mark similar circles
                    var similarCircleKeys = [];
                    drawData.forEach(function(item) {
                        if (item.i == currentIndex)
                            similarCircleKeys.push(item.j);
                    });

                    net.select('circle').each(function() {
                        var index = this.data('index');
                        if (similarCircleKeys.includes(index)) {
                            this.attr({
                                'fill': '#da532c',
                                'fill-opacity': 1
                            })
                        }
                    })
                }
            })
            .mouseout(function() {
                if (!drawer.anySelected) {
                    var infotip = $('div#info');
                    infotip.css({
                        'display': 'none'
                    })

                    net.select('circle').each(function() {
                        this.attr({
                            'fill': 'black',
                            'fill-opacity': this.data('savedFillOpacity')
                        })
                    })
                }
            });

        // draw paired rects
        if (drawer.arc) {
            net.line(d - 2, y, d * 2, y).attr({
                'stroke': 'grey',
                'opacity': 1,
                'stroke-width': 1,
                'stroke-dasharray': 3
            });
        }
        else {
            net.rect(4, 2).center(d * 2, y).attr({'opacity': 1, 'fill': 'lightgrey'});
        }
    }

    // get the base length involved in the similarities
    var marked = [];
    drawData.forEach(function(item) {
        marked.push(item.i);
        marked.push(item.j);
    });
    marked = Array.from(new Set(marked))

    // draw links within net entities
    drawData.forEach(function(item) {
        var id = 'series_' + keys[i];
        var i = item.i, j = item.j, s = item.s;

        // draw the lines
        var xLeft = 0.8 * d, yLeft = i * d + d * 0.75;
        var xRight = 2 * d - 3, yRight = j * d + d * 0.75;

        if (drawer.arc) {
            var xMiddle = Math.min((Math.abs(i - j) + 1) / marked.length, 1) * (xRight - xLeft) + xLeft, yMiddle = (yRight + yLeft) / 2;
            var xCtrlUp = xMiddle, yCtrlUp = Math.min(yLeft, yRight);
            var xCtrlDown = xMiddle, yCtrlDown = Math.max(yLeft, yRight);
            var path = "M" + xLeft + " " + yLeft;
            if (yRight > yLeft) {
                var hEdge = xMiddle - xLeft, vEdge = yMiddle - yLeft, dEdge = Math.sqrt(hEdge * hEdge + vEdge * vEdge);
                if (hEdge < vEdge) {
                    var gap = dEdge * dEdge / (2 * vEdge);
                    var xCtrlUp = xMiddle, yCtrlUp = yMiddle - gap;
                }
                else if (hEdge > vEdge) {
                    var gap = dEdge * dEdge / (2 * hEdge);
                    var xCtrlUp = xLeft + gap, yCtrlUp = yLeft
                }
                else {
                    var xCtrlUp = xMiddle, yCtrlUp = yLeft;
                }
                path += "Q" + xCtrlUp + " " + yCtrlUp + ", " + xMiddle + " " + yMiddle; // left curve
                // path += "T" + xRight + " " + yRight; // right curve
            }
            else {
                var hEdge = xMiddle - xLeft, vEdge = yLeft - yMiddle, dEdge = Math.sqrt(hEdge * hEdge + vEdge * vEdge);
                if (hEdge < vEdge) {
                    var gap = dEdge * dEdge / (2 * vEdge);
                    var xCtrlDown = xMiddle, yCtrlDown = yMiddle + gap;
                }
                else if (hEdge > vEdge) {
                    var gap = dEdge * dEdge / (2 * hEdge);
                    var xCtrlDown = xLeft + gap, yCtrlDown = yLeft;
                }
                else {
                    var xCtrlDown = xMiddle, yCtrlDown = yLeft;
                }
                path += "Q" + xCtrlDown + " " + yCtrlDown + ", " + xMiddle + " " + yMiddle; // left curve
                // path += "T" + xRight + " " + yRight; // right curve
            }
            net.path(path).attr({
                'stroke-width': 1,
                'stroke': 'hsl(0, 0%, ' + (1 - s) * 100 + '%)',
                // 'stroke': 'black',
                'fill': 'transparent'
            });
        }
        else {
            net.line(xLeft, yLeft, xRight, yRight)
            .attr({
                'stroke-width': 1,
                'stroke': 'hsl(0, 0%, ' + (1 - s) * 100 + '%)'
            });
        }
    });

    

    // draw title entity
    net.text(this.sPoint.toString()).attr("id", "titleid_" + this.sPoint).attr('class', 'titleLabel').y(-3).dx(d/5).font({size: 12});

    // save the current input as the previous input for next step
    this.lastResult = input;
    this.lastKey = keys;
    this.sPoint += 1;
};

Drawer.prototype.udpateMonitor = function(circle) {
    var isOpened = tooltip.css('display') == 'block';
    var drawer = this;
    var tfData = {}, dfData = {};
    var gWidth = rankSize[0], gHeight = rankSize[1] / 11, maxBarLenght = gWidth / 5;

    // monitor works only when it is on
    if (isOpened && !drawer.circleList.includes(circle)) {
        drawer.circleList.push(circle);
        // var circles = drawer.draw.select('circle');
        var circles = drawer.circleList;
        // var numCircles = circles.members.length; // number of circles
        var numCircles = circles.length;
        var totalTF = 0;
        if (numCircles == 0) return;

        // collect data
        circles.forEach(function(circle) {
            var data = circle.data('major');
            totalTF += circle.data('freq');
            for (var item in data) {
                tfData[item] = tfData[item] == undefined ? data[item] : (tfData[item] + data[item]); // cumulate term freq
                dfData[item] = dfData[item] == undefined ? 1 : (dfData[item] + 1); // cumulate doc freq
            }
        });
        // console.timeEnd('collect')

        // normalization of term and doc freq to [0, 1]
        Object.keys(tfData).forEach(function(key) { 
            tfData[key] = tfData[key] / totalTF; 
        });
        Object.keys(dfData).forEach(function(key) {
            dfData[key] = dfData[key] / numCircles; 
        });

        // sort and pick
        var topTF = Object.keys(tfData).sort(function(a, b) {
            return tfData[b] - tfData[a];
        });
        var topDF = Object.keys(dfData).sort(function(a, b) {
            return dfData[b] - dfData[a];
        });

        // weighted sum ranking and pick top 10
        var count = 0, len = topTF.length > 1000 ? 1000 : topTF.length, rankDict = {};
        for (var i = 0; i < len; i++) {
            var tValue = topTF[i], tWeight = tfData[tValue], dValue = topDF[i], dWeight = dfData[dValue];
            rankDict[tValue] = rankDict[tValue] == undefined ? tWeight : rankDict[tValue] + tWeight;
            rankDict[dValue] = rankDict[dValue] == undefined ? dWeight : rankDict[dValue] + dWeight;
        }
        var currentRank = Object.keys(rankDict).sort(function(a, b) {
            return rankDict[b] - rankDict[a];
        }).slice(0, 10);
        
        // get and reset last rank
        var lastRank = tooltip.data('lastRank');
        tooltip.data('lastRank', currentRank);

        // get remained, added, and removed list
        var remained = lastRank.filter(function(item) {
            if (currentRank.includes(item))
                return item;
        });
        var added = currentRank.filter(function(item) {
            if (!remained.includes(item))
                return item;
        });
        var removed = lastRank.filter(function(item) {
            if (!remained.includes(item))
                return item;
        });

        var removeTime = addTime = barTime = 100, sortTime = 100, wait = 100;
        // remove items
        removed.forEach(function(item) {
            var groupID = 'item_' + item.replace(/[^a-zA-Z0-9]+/g, ""); // get the id of the group gonna be removed
            var group = rank.select('g#' + groupID).first(); // get the group
            group.animate(removeTime).attr('opacity', 0); // disappear animation
            if (drawer.selected.includes(item)) {
                // if selected item is removed, restore all the settings
                drawer.selected.splice(drawer.selected.indexOf(item), 1);
                if (drawer.selected.length == 0) drawer.anySelected = false;
                draw.select('circle').each(function() {
                    var o = this.data('savedFillOpacity');
                    this.attr({
                        'stroke': 'black',
                        'stroke-width': 1,
                        'fill-opacity': o
                    });
                });
            }
            var intervalID = setInterval(function() { // remove the group element
                group.remove();
                clearInterval(intervalID);
            }, removeTime);
        });

        // maintain items
        remained.forEach(function(item) {
            var groupID = 'item_' + item.replace(/[^a-zA-Z0-9]+/g, ""); // get the id of the group gonna be maintained
            var leftLength = tfData[item] * maxBarLenght, rightLength = dfData[item] * maxBarLenght;
            var group = rank.select('g#' + groupID).first();
            group.select('line.left').first().animate(barTime).plot(maxBarLenght, gHeight - 2, maxBarLenght - leftLength, gHeight - 2); // animation of left and right bar
            group.select('line.right').first().animate(barTime).plot((gWidth - maxBarLenght), gHeight - 2, (gWidth - maxBarLenght) + rightLength, gHeight - 2);
        });

        // sort items
        var sortID = setInterval(function() {
            currentRank.forEach(function(item) {
                if (remained.includes(item)) {
                    var groupID = 'item_' + item.replace(/[^a-zA-Z0-9]+/g, ""); // get the id of the group gonna be removed
                    var pos = currentRank.indexOf(item) + 1; // new position of this group
                    drawer.available.splice(drawer.available.indexOf(pos) ,1)
                    var group = rank.select('g#' + groupID).first(); // get the group
                    group.animate(sortTime).move(0, gHeight * pos - 10);
                }
            });
            clearInterval(sortID);
        }, removeTime + wait); // wait for remove, add, and maintain

        // add items
        var addID = setInterval(function() {
            added.forEach(function(item) {
                var groupID = 'item_' + item.replace(/[^a-zA-Z0-9]+/g, ""); // get the id of the group gonna be added
                var leftLength = tfData[item] * maxBarLenght, rightLength = dfData[item] * maxBarLenght;
                var pos = drawer.available.shift(); // get an available position
                var group = rank.group().move(0, gHeight * pos - 10) // create group and save position
                    .attr({
                        'id': groupID,
                        'opacity': 0,
                    });
                var label = group.text(item).attr('text-anchor', 'middle').attr('cursor', 'pointer').move(gWidth / 2, gHeight / 2).data('selected', false);
                label.click(function() {
                    if (!this.data('selected')) {
                        drawer.selected.push(item);
                        drawer.anySelected = drawer.selected.length > 0;

                        // change the color of labels
                        this.data('selected', true);
                        this.fill('#da532c');
                    }
                    else {
                        var index = drawer.selected.indexOf(item);
                        if (index != -1) drawer.selected.splice(index, 1);
                        drawer.anySelected = drawer.selected.length > 0

                        // change the color of labels
                        this.data('selected', false);
                        this.fill('black');
                    }

                    // change the color and fill of selected circles
                    draw.select('circle').each(function() {
                        this.attr({
                            'stroke': 'black',
                            'stroke-width': 1
                        });
                    });

                    draw.select('circle').each(function() {
                        var data = this.data('major');
                        var totalFreq = 0;
                        drawer.selected.forEach(function(item) {
                            if (item in data)
                                totalFreq += data[item];
                        });
                        if (totalFreq > 0) {
                            var o = totalFreq / this.data('freq');
                            this.attr({
                                'stroke': '#da532c',
                                'stroke-width': 2,
                                'fill-opacity': o
                            });
                        }
                        else {
                            this.attr({
                                'stroke': 'lightgrey',
                                'fill-opacity': 0.1
                            });
                        }
                    });

                    if (drawer.selected.length === 0) {
                        draw.select('circle').each(function() {
                            var savedFillOpacity = this.data('savedFillOpacity');
                            this.attr({
                                'stroke': 'black',
                                'fill-opacity': savedFillOpacity
                            });
                        });
                    };
                });
                group.line(maxBarLenght, gHeight - 2, maxBarLenght - maxBarLenght, gHeight - 2).attr({'stroke': 'lightgrey', 'stroke-width': 5}); // left bar chart
                group.line(maxBarLenght, gHeight - 2, maxBarLenght - leftLength, gHeight - 2).attr({'stroke': '#3e3e3e', 'stroke-width': 3, 'class': 'left'});
                group.line((gWidth - maxBarLenght), gHeight - 2, (gWidth - maxBarLenght) + maxBarLenght, gHeight - 2).attr({'stroke': 'lightgrey', 'stroke-width': 5}); // right bar chart
                group.line((gWidth - maxBarLenght), gHeight - 2, (gWidth - maxBarLenght) + rightLength, gHeight - 2).attr({'stroke': '#3e3e3e', 'stroke-width': 3, 'class': 'right'}); 
                group.animate(addTime).attr('opacity', 1); // appearing animation
            });
            clearInterval(addID);
        }, (removeTime + wait) + sortTime + wait); // wait for removement

        drawer.available = [1,2,3,4,5,6,7,8,9,10]; // reset the available list
    }
};

// clear all the elements
Drawer.prototype.clean = function(maxGroup, d, sPoint) {
    this.draw.clear();
    this.groups = [];
    this.lastResult = null;
    this.maxGroup = maxGroup + 2;
    this.d = d;
    this.sPoint = sPoint;
};

Drawer.prototype.cleanMonitor = function() {
    this.circleList = [];
    rank.select('g').each(function() {
        if (this.attr('id') != 'title')
            this.remove();
    });
    drawer.available = [1,2,3,4,5,6,7,8,9,10];
    drawer.selected = [];
    drawer.anySelected = false;
    tooltip.data('lastRank', []);
    draw.select('circle').each(function() {
        var o = this.data('savedFillOpacity');
        this.attr({
            'stroke': 'black',
            'stroke-width': 1,
            'fill-opacity': o
        });
    });
};

// compute the lightness of links by number
const lightness = function(n, gama) {
    var order = n.toString().length;
    var l = (order - 1) * 0.1 + n * Math.pow(10, -(order + 1));
    return l;
};

const TSP = function(keys, data) {
    if (keys.length == 1 || data.length == 0) return keys;

    var simiData = JSON.parse(JSON.stringify(data)), resultPool = [], temp = [], beginer = simiData.pop();
    var origKeys = JSON.parse(JSON.stringify(keys));

    // push the beginner elements to the temp store
    temp.push(beginer.i);
    temp.push(beginer.j);

    // loop for generating result pool
    while(simiData.length > 0) {
        var left = temp[0], right = temp[temp.length - 1], len = simiData.length, leftItem = null, rightItem = null;

        // get left and right item
        for (i = len - 1; i > -1; i--) { // from the largets
            if (simiData[i].i == left || simiData[i].j == left) {
                leftItem = simiData[i];
                break;
            }
        }
        for (i = len - 1; i > -1; i--) {
            if (simiData[i].i == right || simiData[i].j == right) {
                rightItem = simiData[i];
                break;
            }
        }

        // extend the temp store
        if (leftItem == null && rightItem == null) { // current community is finished
            // remove elements related to the current temp store from simidata
            len = simiData.length;
            for (var i = len - 1; i > -1; i--) {
                if (temp.includes(simiData[i].i) || temp.includes(simiData[i].j))
                    simiData.splice(i, 1);
            }

            // start a new temp store
            resultPool.push(temp);
            temp = []; // reinitialize the temp store
            if (simiData.length > 0) {
                beginer = simiData.pop();
                temp.push(beginer.i);
                temp.push(beginer.j);
            }
        }
        else if (rightItem == null) { // choose left
            var another = leftItem.i == left ? leftItem.j : leftItem.i;
            if(!temp.includes(another)) temp.unshift(another); // add the item
            simiData.splice(simiData.indexOf(leftItem), 1); // remove the left item from simi data
        }
        else if (leftItem == null) { // choose right
            var another = rightItem.i == right ? rightItem.j : rightItem.i;
            if(!temp.includes(another)) temp.push(another);
            simiData.splice(simiData.indexOf(rightItem), 1);
        }
        else if (leftItem.s >= rightItem.s) { // choose left
            var another = leftItem.i == left ? leftItem.j : leftItem.i;
            if(!temp.includes(another)) temp.unshift(another); // add the item
            simiData.splice(simiData.indexOf(leftItem), 1); // remove the left item from simi data
        }
        else if (leftItem.s < rightItem.s) { // choose right
            var another = rightItem.i == right ? rightItem.j : rightItem.i;
            if(!temp.includes(another)) temp.push(another);
            simiData.splice(simiData.indexOf(rightItem), 1);
        }
    }

    // create new list
    var result = [], finalKeys = [], maxLength = 0; // final connected part
    resultPool.forEach(function(i) {
        maxLength = maxLength <= i.length ? i.length: maxLength
        result = result.concat(i);
    });
    result.forEach(function(i) {
        finalKeys.push(keys[i])
    });
    var rest = keys.filter(function(i) {
        return !finalKeys.includes(i)
    });
    finalKeys = finalKeys.concat(rest);

    // exchange the drawing data
    var exchangeTable = {};
    origKeys.forEach(function(item) {
        var origIndex = origKeys.indexOf(item);
        var finalIndex = finalKeys.indexOf(item);
        exchangeTable[origIndex] = finalIndex;
    });
    data.forEach(function(item) {
        item.i = exchangeTable[item.i];
        item.j = exchangeTable[item.j];
    });

    return finalKeys
};