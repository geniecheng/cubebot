
var $w = $(window);
var $cube;
var cube;

var x = 0;
var y = 0;
var z = 40;

var ua = window.navigator.userAgent;
var ie = (ua.indexOf('MSIE') + ua.indexOf('Triden')>-2);
var ieFaces = [];
var handle = null;

var rot = {
    'front': [0,0],
    'right': [3,0],
    'back' : [2,0],
    'left' : [1,0],
    'top'  : [0,3],
    'bottom':[0,1],
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

function getNearestRotation(face, axis) {
    // current rotation
    var c = axis === 0 ? x:y;

    var r = rot[face];
    var a = -360 + r[axis] * 90;
    var b = r[axis] * 90;

    var rotation = difference(a,c) < difference(b,c) ? a : b;

    // if were a 0 rotation, factor 360 too
    if( r[axis] == 0){
        a = -360;
        b = 360;
        if(difference(rotation,c) > difference(a,c) ||
           difference(rotation,c) > difference(b,c))
            rotation = difference(a,c) < difference(b,c) ? a : b;
    }

    return rotation;
}

function transEnd(){
    handle = null;

    if(ie)
        $cube.find('.face').removeClass('smoothing');
    else
        $cube.removeClass('smoothing');

    // zero out 360'd rotations
    if(Math.abs(x) === 360 || Math.abs(y) === 360){
        if(Math.abs(x) === 360)
            x = 0;
        if(Math.abs(y) === 360)
            y = 0;

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

    if(ie)
        $cube.find('.face').addClass('smoothing');
    else
        $cube.addClass('smoothing');

    x = getNearestRotation(face, 0);
    y = getNearestRotation(face, 1);

    transform(x,y);
    if(handle) clearTimeout(handle);
    handle = setTimeout(transEnd, 660);
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
            setTimeout(function(){ transform(0,0); }, 50);
        }
    });


    $(document).on('click','.face-nav',orientCube);
});