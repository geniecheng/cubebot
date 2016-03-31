
var $w = $(window);
var $cube;
var cube;

var x = 0;
var y = 0;
var z = 40;

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
    'front':[0,-360],
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

function difference(a,b) {
    return Math.abs(a - b);
}

function transEnd(){
    if(ie)
        $cube.find('.face').removeClass('smoothing');
    else
        $cube.removeClass('smoothing');

    if(x === -360 || x === 360){
        x = 0;
        transform(x,y);
    }

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

    setTimeout(function (){
        if(ie)
            $cube.find('.face').addClass('smoothing');
        else
            $cube.addClass('smoothing');

        if(y == rotationMap[face][0] && x == rotationMap[face][1]){
            transEnd();
        }else{

            var x1 = rotationMap[face][1];
            var x2 = reverseRotationMap[face][1];
            var y1 = rotationMap[face][0];
            var y2 = reverseRotationMap[face][0];

            if(difference(x1,x) < difference(x2,x))
                x = (x == 270 && x1 == 0 ? 360:x1);
            else if(difference(x1,x) === difference(x2,x)){
                if(x < 0)
                    x = x2
                else
                    x = x1
            } else
                x = x2

            if(difference(y1,y) < difference(y2,y))
                y = y1;
            else if(difference(y1,y) === difference(y2,y)){
                if(y < 0)
                    y = y2
                else
                    y = y1
            } else
                y = y2



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

function modal(evt) {
    evt.preventDefault();
    $modal = $('#modal');

    if($modal.hasClass('off')){
        $modal.removeClass('off')
              .addClass('in');
    } else {
        $modal.removeClass('in')
              .addClass('out');

        setTimeout(function (){
            $modal.removeClass('out').addClass('off');
        }, 300);
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

    $container.append(
        $cube
    );

    /* wire up modal */
    $.getJSON(URL+'/flex-content/', function (data) {
        if(data.results)
            $('#text').html(data.results[0].html);
    });

    $('.about-modal').on('click', modal);
    $('#modal > .close').on('click', modal);
    $('#screen').on('click', modal);

    if(window.location.search.replace('?','') === 'basic' || isMobile()){
        var css = document.createElement('link');
        css.href = '/css/basic.css';
        css.setAttribute('rel','stylesheet');
        css.setAttribute('type','text/css');
        document.getElementsByTagName("head")[0].appendChild(css);

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