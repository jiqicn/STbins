/***********************************
 * Initialization
 ***********************************/

// components like buttons, inputs
const selectTable = $('select#table');
const selectSeries = $('select#series');
const selectAttr = $('select#attr');
const inputNumber = $('input#number');
const inputJump = $('input#jump');
const buttonStart = $('button#start');
const buttonPause = $('button#pause');
const buttonMonitor = $('button#monitor');
const checkArc = $('input#arc');
const checkSorted = $('input#sorted');

// tooltips
const tooltip = $('div#detail');
const tooltipInfo = $('div#info');
const tooltipRank = $('div#rank');

// other parameters
var tableID = selectTable.val(), varSeries = selectSeries.val(), varAttr = selectAttr.val(); // parameters to be set by components
var intervalID // id of setInterval listener, used to control the timer
var sPoint = 0; // 
var pauseFlag = true, startFlag = false; // flags to control the flow
var processor = new Processor(); // instance of processor
var widthTotal = $(window).width() - 30 - 4; // window width - margin - border
var k = $('input#number').val(), d = widthTotal / (3 * k - 1), maxGroup = 2 * k - 1; // k: number of net entities within the screen, d: unit width
var draw, drawer, rank, rankSize = [tooltipRank.width(), tooltipRank.height()]; // svg drawer
var titleID, shift = 0, flow = 0;


/************************************
 * Functions of the components
 ***********************************/

// component event responder
selectTable.on('change', function(e) {
        tableID = $(this).val();
        startFlag = false;
    });

selectSeries.on('change', function(e) {
        varSeries = $(this).val();
        startFlag = false;
    });

selectAttr.on('change', function(e) {
        varAttr = $(this).val();
        startFlag = false;
    });

inputNumber.on('change', function(e) {
        // update all the window settings
        k = parseInt($(this).val());
        d = widthTotal / (3 * k - 1);
        maxGroup = 2 * k - 1;
        startFlag = false;
    });

inputJump.on('change', function(e) {
        sPoint = parseInt($(this).val());
        startFlag = false;
    });

buttonStart.on('click', function(e) {
        if (tableID == undefined)
        alert('WARNING: Please choose a data table!');
        else {
            startFlag = true;
            drawer.clean(maxGroup, d, sPoint);
            if (pauseFlag) {
                setStreamFormat(sPoint);
                // start data stream
                var speed = $('input#speed').val();
                intervalID = setInterval(getData, speed);
                pauseFlag = !pauseFlag;
            }
        }
    });

buttonPause.on('click', function(e) {
        if (!pauseFlag || !startFlag)
            // pause data stream
            clearInterval(intervalID);
        else {
            // restart data stream
            var speed = $('input#speed').val();
            intervalID = setInterval(getData, speed);
        }
        pauseFlag = !pauseFlag;
    });

buttonMonitor.on('click', function() {
    // switcher of the tooltip
    var state = tooltip.css('display') == 'none' ? 'block' : 'none';
    tooltip.css({
        'display': state,
        'right': '10px',
        'bottom': '10px'
    });
    if (state == 'block') {
        drawer.udpateMonitor();
    }
});

checkArc.on('change', function() {
    drawer.arc = this.checked;
    startFlag = false;
});

checkSorted.on('change', function() {
    drawer.sorted = this.checked;
    startFlag = false;
})

// fetch get for getting data
const getData = function() {
    // fetch for getting response from the server
    fetch('/index', {method: 'GET'})
    .then(function(response) {
        if (response.ok) {
            // console.log('ok');
            return response.json();
        }
    })
    .then(function(data) {
        // get tempory results
        // console.time('process')
        var result = processor.process(data, varSeries, varAttr);
        // console.timeEnd('process')

        // draw the visualization
        // console.time('monitor')
        drawer.update(result, d);
        // drawer.udpateMonitor();
        // console.timeEnd('monitor')
    })
    .catch(function(error) {
        console.log(error);
    });
};

// fetch post for sending stream configuration to the server
const setStreamFormat = function(point) {
    var tWindow = $('input#window').val();

    // fetch for sending post to server
    fetch('/index', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            startPoint: point,
            timeWindow: tWindow,
            table: tableID
        })
    })
    .catch(function(error) {
        console.log(error);
    });
};

/************************************
 * Other basic settings
 ***********************************/

// initialize the SVG drawer
if (SVG.supported) {    // check if SVG supported by the browser
    draw = SVG('drawing').size('100%', 3000);
    rank = SVG('rank').size(rankSize[0], rankSize[1]);
    drawer = new Drawer(draw, maxGroup, d, sPoint);
} else {
    alert('WARNING: SVG not supported!');
}

// initialize the tooltip
tooltip.draggable({ containment: "parent" }); // make the tooltip draggable
tooltip.data('lastRank', []);

// global keyboard shortcut
document.onkeyup = function(e) {
    if (e.which == 13) { // enter to pause or active the flow
        if (!startFlag) buttonStart.trigger('click');
        else buttonPause.trigger('click');
    }
    else if (e.which == 27) { // exc to escape from tooltip
        // buttonMonitor.trigger('click');
        drawer.cleanMonitor();
    }
    // else {
    //     console.log(e.which);
    // }
};