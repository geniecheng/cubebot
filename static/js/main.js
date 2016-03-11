
var $w = $(window);
var $cube;
var cube;

var x = 0;
var y = 0;
var z = 37.5;

var ua = window.navigator.userAgent;
var ie = (ua.indexOf('MSIE') + ua.indexOf('Triden')>-2);
var ieFaces = [];


var initial = true;

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
    'front':'translateZ('+z+'vh)',
    'right':'rotateY(90deg) translateZ('+z+'vh)',
    'back':'rotateY(180deg) translateZ('+z+'vh)',
    'left':'rotateY(270deg) translateZ('+z+'vh)',
    'top':'rotateX(90deg) translateZ('+z+'vh)',
    'bottom':'rotateX(-90deg) translateZ('+z+'vh)'
}


function transEnd(){
    if(ie)
        $cube.find('.face').removeClass('smoothing');
    else
        $cube.removeClass('smoothing');

    $(window).trigger('anim-done');
}

function orientCube(evt){
    evt.preventDefault();

    var face;

    if(!$(evt.target).data('face'))
        face = $(evt.target).parents('div.lock').data('face');
    else
        face = $(evt.target).data('face');

    // if face contains a slideshow, reset
    if(typeof objBin[face].slideshow !== "undefined" && objBin[face].slideshow){
        $(window).one('anim-done',function (){
            objBin[face].first();
        });
    }

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
    transform(x,y);

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

            transform(x,y);
        }
    },50);
}

function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


// xbrowser transforms
var locales = ['-moz-transform','-webkit-transform','transform'];
function transform(x,y){
    if(ie){
        ieFaces.each(function (){
            var f = $(this).data('face');
            $(this).css('transform', 'perspective(3000px) rotateY('+x+'deg) rotateX('+y+'deg) ' + ieCubeMap[f]);
        });
    }else{
        _(locales).each(function (l){
            $cube.css(l, 'translateZ(-'+z+'vh) rotateX('+y+'deg) rotateY('+x+'deg)');
        });
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

    var $shop = $('nav');
    var $container = $('#container');

    cube = new Cube();
    $cube = cube.render().$el;

    $('#intermediary').append(
        $cube
    );

    if(window.location.search.replace('?','') === 'basic' || isMobile()){
        var css = document.createElement('link');
        css.href = '/css/basic.css';
        css.setAttribute('rel','stylesheet');
        css.setAttribute('type','text/css');
        document.getElementsByTagName("head")[0].appendChild(css);

        $(document).on('cube-rendered', function (){
            $cube.find('.face').each(function (){
                var o = $(this);
                var f = o.data('face');
                o.before('<li><a name="'+f+'"></a></li>');
            });
        });

        var nav_h = $('nav').height();
        $('nav').on('click', 'a', function (evt){
            evt.preventDefault();

            var face;
            if(!$(evt.target).data('face'))
                face = $(evt.target).parents('div.lock').data('face');
            else
                face = $(evt.target).data('face');

            // if face contains a slideshow, reset
            if(typeof objBin[face].slideshow !== "undefined" && objBin[face].slideshow){
                objBin[face].first();
            }

            $('html, body').animate({
                scrollTop: $('li.'+face).offset().top - (isMobile()?nav_h:0),
            }, 750, function (){ suppress=false;});
        });

        return;
    }

    $(document).on('cube-rendered',function (){
        if(ie){
            ieFaces = $cube.find('.face');
            ieFaces.on('transitionend', transEnd);
            setTimeout(function(){ transform(0,0); }, 50);
        }else
            $cube.on(transEndStr, transEnd);
    });


    $(document).on('click','.face-nav',orientCube);
});