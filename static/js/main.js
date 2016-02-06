
var $w = $(window);
var w = 50000;
var h = 50000;
var $cube;
var cube;

// scroll delta
var deltaX = 0;
var lDeltaX = 0;
var deltaY = 0;
var lDeltaY = 0;
var timer;

// rotation index
var x = 0;
var y = 0;

// state booleans
var suppress = false;
var keyed = false;
var ua = window.navigator.userAgent;
var ie = (ua.indexOf('MSIE') + ua.indexOf('Triden')>-2);

var initial = true;

var keyMap = {
    37:'left',
    38:'up',
    39:'right',
    40:'down'
}

var rotationMap = {
    'front': [0,0],
    'right': [0,270],
    'back': [0,180],
    'left': [0,90],
    'top': [270,0],
    'bottom': [90,0]
}
var reverseRotationMap = {
    'front':[0,0],
    'right':[0,-90],
    'back':[0,-180],
    'left':[0,-270],
    'top': [-90,0],
    'bottom': [-270,0]
}

var ieCubeMap = {
    'front': 'translateZ(50vh)',
    'right':'rotateY(90deg) translateZ(50vh)',
    'back':'rotateY(180deg) translateZ(50vh)',
    'left':'rotateY(270deg) translateZ(50vh)',
    'top':'rotateX(90deg) translateZ(50vh)',
    'bottom':'rotateX(-90deg) translateZ(50vh)'
}

function transEnd(){
    if(ie)
        $cube.find('.face').removeClass('smoothing');
    else
        $cube.removeClass('smoothing');

    keyed = false;

    // reset deltas when realligning cube to grid
    lDeltaX = 0;
    lDeltaY = 0;
    window.scrollTo(w/2, h/2);
}

function orientCube(evt){
    evt.preventDefault();

    keyed = true;
    var face;

    if(!$(evt.target).data('face'))
        face = $(evt.target).parents('div.lock').data('face');
    else
        face = $(evt.target).data('face');

    /*
        reorient faces to within one revolution
    */
    if(face === 'front'){
        x = Math.abs(x) < 180 || Math.abs(x) > 540 ? x % 360: x>0? x - 360 : x + 360;
        y = Math.abs(y) < 180 || Math.abs(y) > 540  ? y % 360: y>0? y - 360 : y + 360;
    }else{
        x = x % 360;
        y = y % 360;
    }
    transform($cube, x,y);

    setTimeout(function (){
        if(ie)
            $cube.find('.face').addClass('smoothing');
        else
            $cube.addClass('smoothing');

        if(y == rotationMap[face][0] && x == rotationMap[face][1]){
            transEnd();
        }else{
            if(y >= 0)
                y = rotationMap[face][0];
            else
                y = reverseRotationMap[face][0];

            if(x >= 0)
                x = rotationMap[face][1];
            else
                x = reverseRotationMap[face][1];

            transform($cube, x,y);
        }
    },50);
}

function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


// xbrowser transforms
var locales = ['-moz-transform','-webkit-transform','transform'];
function transform(o,x,y){
    if(ie){
        o.find('.face').each(function (){
            var f = $(this).data('face');
            $(this).css('transform', 'perspective(3000px) rotateY('+x+'deg) rotateX('+y+'deg) ' + ieCubeMap[f]);
        });
    }else{
        _(locales).each(function (l){
            o.css(l, 'translateZ(-45vh) rotateX('+y+'deg) rotateY('+x+'deg)');
        });
    }
}

function delegate(evt){
    switch(evt.type){
        case 'keydown':
        if(typeof keyMap[evt.keyCode] == "undefined") break;
            keyed = true;

            if(ie)
                $cube.find('.face').addClass('smoothing');
            else
                $cube.addClass('smoothing');

            switch(keyMap[evt.keyCode]){
                case 'up':
                    y -= 90;
                    break;
                case 'down':
                    y += 90;
                    break;
                case 'left':
                    x += 90;
                    break;
                case 'right':
                    x -= 90;
                    break;
            }

            x = 90 * Math.round(x / 90);
            y = 90 * Math.round(y / 90);

            transform($cube, x,y);
        break;

        case 'scroll':
            if(keyed) break;

            if(!suppress){
                var _x = ($w.scrollLeft()-w/2);
                var _y = ($w.scrollTop()-h/2);

                x +=  (_x - lDeltaX) * 0.1;
                y +=  (_y - lDeltaY) * 0.1;

                lDeltaX = _x; lDeltaY = _y;

                transform($cube, x,y);
            }else{
                suppress = false;
                lDeltaX = 0;
                lDeltaY = 0;
            }

            clearTimeout(timer);
            timer = setTimeout(function (){
                suppress = true;
                window.scrollTo(w/2, h/2);
            },250);
        break;
    }
}


/* get a random face for og & twitter image */
$.getJSON(URL+'/photography/',function (data){
    var faces = _.pluck(data.results,'photo');
    var face = faces[_.random(faces.length-1)];
    $('head').append("<meta name='twitter:image' content="+face+">")
             .append("<meta name='og:image' content="+face+">");
})

var doc = document.documentElement;
doc.setAttribute('data-useragent', navigator.userAgent);

$(function (){
    /* supress intial centering operation */
    setTimeout(function (){
        initial=false;
    },200);

    window.scrollTo(w/2, h/2);
    lDeltaX = 0;
    lDeltaY = 0;

    var $shop = $('nav');
    var $container = $('#container');

    cube = new Cube();
    $cube = cube.render().$el;

    if(ie)
        $cube.find('.face').on(transEndStr, transEnd);
    else
        $cube.on(transEndStr, transEnd);

    $('#intermediary').append(
        $cube
    );

    $('#keyMap').on('mouseup', function (evt){
        var idx = $(evt.target).index();
        var fake = {type:'keydown',keyCode: 37 + idx};
        delegate(fake);
    });

    if(!isMobile()){
        /* face focusing utils */
        $(document).on('click','.lock',orientCube)
                   .on('click','.face-nav',orientCube)
                   .on('scroll keydown',delegate);
    }else{
        $(document).on('click','.face-nav',orientCube);
    }
});