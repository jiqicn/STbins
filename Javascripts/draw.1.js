// class for drawing the visualization main view
var Drawer = function (draw, maxGroup, d, sPoint) {
    this.draw = draw; // svg instance for drawing
    this.maxGroup = maxGroup + 2; // max number of groups included
    this.d = d;
    this.groups = []; // group array
    this.lastResult = null; // last input for computing link similarity
    this.sPoint = sPoint;
    this.hLegend = {};
};

Drawer.prototype.update = function (input) {
    var svg = this.draw, hLegend = this.hLegend, drawer = this;
    var keys = Object.keys(input).sort()
    var d = this.d
    if (this.groups.length == 0) {
        // If nothing in the group list, only generate net entity
        var net = this.draw.group().move(0, 10).attr('id', 'netid_' + this.sPoint); 

        // add the net entity to the group
        this.groups.push(net);
    } else {
        // remove groups outside the screen
        if (this.groups.length >= this.maxGroup) {
            this.groups.shift().remove();
            this.groups.shift().remove();
        }

        // else, create both net and link
        var leftWidth = (3 * this.groups.length + 1) * 0.5 * d;
        var link = draw.group().move(leftWidth, 10);
        var net = draw.group().move(leftWidth + d, 10).attr('id', 'netid_' + this.sPoint);

        // draw link entity
        var keysLeft = Object.keys(this.lastResult).sort();
        var keysRight = keys;
        var len = keysLeft.length;
        for (var i = 0; i < len; i++) {
            var id = 'series_' + keysLeft[i];
            var j = keysRight.indexOf(keysLeft[i]); // get the right position
            if (j != -1) {
                // compute similarity
                var listA = this.lastResult[keysLeft[i]] == undefined ? {} : this.lastResult[keysLeft[i]].major;
                var listB = input[keysRight[j]] == undefined ? {} : input[keysRight[j]].major;
                // var s = 0.95 * jaccard(listA, listB) + 0.05;
                var s = jaccard(listA, listB);

                // draw the lines
                var xLeft = 0, yLeft = i * 1.5 * d + d * 0.75;
                var xRight = d * 1.5, yRight = j * 1.5 * d + d * 0.75;
                link.line(xLeft, yLeft, xRight, yRight).stroke({width: 1})
                    .attr({
                        // 'class': id,
                        'stroke': hLegend[id] == undefined ? 'hsl(0, 0%, ' + (1 - s) * 100 + '%)' : 'hsl(' + hLegend[id]+ ', 50%, ' + (1 - s) * 100+ '%)'
                    })
            }
        }

        // add the net and link entity to the group
        this.groups.push(link);
        this.groups.push(net);

        // shift exist groups while overloading
        if (this.groups.length >= this.maxGroup) {
            // move left all the groups
            this.draw.each(function(i, children) {
                this.animate(100).dx(-3 * d);
            });
        }
    }
    var len = keys.length;

    // draw links between dots and circles within net entities
    drawData = []
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len; j++) {
            if (i != j) {
                var listA = (input[keys[i]] || {list: {}}).major, listB = (input[keys[j]] || {list: {}}).major;
                // var s = 0.95 * jaccard(listA, listB) + 0.05;
                var s = jaccard(listA, listB);
                drawData.push({i: i, j: j, s: s});
            }
        }
    }
    drawData.sort(function(a, b){return a.s - b.s;});
    drawData.forEach(function(item) {
        var id = 'series_' + keys[i];
        var i = item.i, j = item.j, s = item.s;

        // draw the lines
        var xLeft = 0.5 * d, yLeft = i * 1.5 * d + d * 0.75;
        var xRight = 2 * d, yRight = j * 1.5 * d + d * 0.75;
        net.line(xLeft, yLeft, xRight, yRight).stroke({width: 1})
            .attr({
                // 'class': 'series_' + keys[i],
                'stroke': hLegend[id] == undefined ? 'hsl(0, 0%, ' + (1 - s) * 100 + '%)' : 'hsl(' + hLegend[id]+ ', 50%, ' + (1 - s) * 100+ '%)',
            });
    });

    // draw dot entity
    for (var i = 0; i < len; i++) {
        var series = input[keys[i]];
        var L = lightness(series.freq) * 100;
        var y = i * 1.5 * d + d * 0.75;
        var diameter = d * (0.3 + 0.7 * series.entropy);
        var id = 'series_' + keys[i].replace(/[^a-z0-9]/g, '');

        // get term frequency data
        for (j in series['list']) {
            series['list'][j] = series['list'][j] / series.freq;
        }

        // draw dots
        net.circle(diameter).center(d * 0.5, y)
            .attr({
                'fill': 'hsl(0, 0%, '+ L +'%)',
                'stroke-width': hLegend[id] == undefined ? 0.5 : 3,
                'stroke': hLegend[id] == undefined ? 'black' : 'hsl(' + hLegend[id]+ ', 50%, 50%)',
                'class': id
            })
            .data(series)
            .data('savedColor', 'hsl(0, 0%, '+ L +'%)')
            .mouseover(function() {
                if (fixFlag) {
                    var tfData = this.data('list');

                    cloud.children().each(function() {
                        var tag = $(this).text();
                        if (tfData[tag] == undefined) {
                            $(this).css('opacity', 0.1);
                        } else {
                            var freq = tfData[tag];
                            color = "hsl(" + (240 + 120 * freq) + ", 100%, 50%)";
                            $(this).css('color', color);
                        }
                    });
                }
            })
            .mouseout(function() {
                if (fixFlag) { // Being actived only when the tooltip is fixed
                    var tfData = this.data('list');
    
                    cloud.children().each(function() {
                        var tag = $(this).text();
                        if (tfData[tag] == undefined) {
                            $(this).css('opacity', 1);
                        } else {
                            color = $(this).attr('data-savedColor');
                            $(this).css('color', color);
                        }
                    });
                }
            })

        // draw paired rects
        net.rect(4, 4).center(d * 2, y).attr({'opacity': 1,});
    }

    // get document frequency data
    var list = {}, words = {}, circleCount = 0 // total list
    net.select("circle").each(function() {
        circleCount += 1
        // add current list content to the total list
        var currList = this.data("list");
        Object.keys(currList).forEach(function(key) {
            if (list[key] == undefined) list[key] = 1
            else list[key] += 1
        });
    });
    Object.keys(list).forEach(function(key) {words[key] = list[key] / circleCount});

    // draw title entity
    net.text(this.sPoint.toString()).attr("id", "titleid_" + this.sPoint).attr('class', 'titleLabel')
        .style('cursor', 'pointer').y(3).dx(d/5).font({size: 12})
        .data("list", words)
        .click(function() {
            // store the titleID
            titleID = this.attr('id')
            svg.select('text.titleLabel').each(function() {
                this.style('font-size', null);
            });
            this.style('font-size', '22px');

            // show the tooltip
            fixFlag = true
            tooltip.css({
                'display': 'block',
                'bottom': "10px",
                'right': "10px"
            });

            // show information
            var dfData = this.data('list');
            var infoHTML = '&#9654 Number of Different Value: ' + Object.keys(dfData).length;
            tooltipInfo.html(infoHTML);

            // show the cloud
            var order = Object.keys(dfData).sort(function(a, b) {return dfData[b] - dfData[a]}); // sort the keys based on freq value
            var cloudHTML = ''
            order.forEach(function(key) {
                var freq = dfData[key];
                color = "hsl(" + (240 + 120 * freq) + ", 100%, 50%)"
                cloudHTML += "<span data-savedColor='" + color + "' style='color: " + color + "'>" + key + "</span> ";
            });
            cloud.html(cloudHTML);

            // hovering event responder of tag
            cloud.children().each(function() {
                $(this).mouseover(function() {
                    var tag = $(this).text();

                    // for each dot in the current screen
                    svg.select('circle').each(function() {
                        var tfData = this.data('list');
                        if (tfData[tag] != undefined) { // if the tag exists in this circle
                            var freq = tfData[tag];
                            color = "hsl(" + (240 + 120 * freq) + ", 100%, 50%)";
                            this.attr('fill', color);
                        }
                    });

                    // for each title in the current screen
                    svg.select('text.titleLabel').each(function() {
                        var dfData = this.data('list');
                        if (dfData[tag] != undefined) {
                            var freq = dfData[tag];
                            color = "hsl(" + (240 + 120 * freq) + ", 100%, 50%)";
                            this.attr('fill', color);
                        }
                    });
                    
                }).mouseout(function() {
                    var tag = $(this).text();

                    // restore the color of dots
                    svg.select('circle').each(function() {
                        var tfData = this.data('list');
                        if (tfData[tag] != undefined) { // if the tag exists in this circle
                            color = this.data('savedColor');
                            this.attr('fill', color);
                        }
                    });  

                    // for each title in the current screen
                    svg.select('text.titleLabel').each(function() {
                        var dfData = this.data('list');
                        if (dfData[tag] != undefined) {
                            this.attr('fill', 'black');
                        }
                    });
                })
            });
        })
        .mouseover(function() {
            if (fixFlag) { // Being actived only when the tooltip is fixed
                var dfData = this.data('list');

                // change the opacity to leave only the overlap part
                cloud.children().each(function() {
                    var tag = $(this).text();
                    if (dfData[tag] == undefined) {
                        $(this).css('opacity', 0.1);
                    } else {
                        var freq = dfData[tag];
                        color = "hsl(" + (240 + 120 * freq) + ", 100%, 50%)";
                        $(this).css('color', color);
                    }
                });
            }
        })
        .mouseout(function() {
            if (fixFlag) { // Being actived only when the tooltip is fixed
                var dfData = this.data('list');

                // change the opacity to leave only the overlap part
                cloud.children().each(function() {
                    var tag = $(this).text();
                    if (dfData[tag] == undefined) {
                        $(this).css('opacity', 1);
                    } else {
                        color = $(this).attr('data-savedColor');
                        $(this).css('color', color);
                    }
                });
            }
        })

    // save the current input as the previous input for next step
    this.lastResult = input;
    this.sPoint += 1;
};

// clear all the elements
Drawer.prototype.clean = function(maxGroup, d, sPoint) {
    this.draw.clear();
    this.groups = [];
    this.lastResult = null;
    this.maxGroup = maxGroup + 2;
    this.d = d;
    this.sPoint = sPoint;
}

// compute the lightness of links by number, range: [0.5, 1)
const lightness = function(n) {
    // return 0.5 * (1 + Math.pow(0.998, n)); // lightness range for other colors
    return Math.pow(0.998, n); // lightness range for black
}