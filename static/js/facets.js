var transEndStr = 'webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd';
var URL;

if(window.location.hostname == "localhost")
	URL = 'http://localhost:8000/api';
else
	URL = 'https://morning-thicket-7130.herokuapp.com/api';


var BaseCollection = Backbone.Collection.extend({
	initialize: function (opts){
		this.params = opts || {};
	},
	url: function (){
		var params = [];

		if(typeof this.params.offset !== "undefined")
			params.push('offset='+this.params.offset);

		if(typeof this.params.limit !== "undefined")
			params.push('limit='+this.params.limit);

		return URL + this.fragment+(params.length?'?'+params.join('&'):'');
	},
	parse: function (data){
		return data.results;
	}
});

/*
	Instagram face
*/
var Gram = Backbone.Model.extend({
	truncate:20,
	template: _.template(
		"<img class='pic' src='<%= o.get('photo') %>'>"+
		"<h3><a href='<%= o.get('url') %>'>"+
		"<%= o.user() %>"+
		//"<%= o.get_caption() %>"+
		"</a></h3>"
	),

	intitialze: function (){
		_.bindAll(this,'get_caption','user');
	},

	user: function (){
		return '@' + this.get('user');
	},

	get_caption: function (){
		var c = this.get('caption');

		if(typeof c !== "undefined" && c.length > this.truncate)
			c = c.slice(0,this.truncate) + '...';

		return c;
	}
});

var Grams = BaseCollection.extend({
	model: Gram,
	fragment:'/instagram/'
});

var InstagramView = Backbone.View.extend({
	tagName:'div',
	className:'photo',
	initialize: function (){

	},
	render: function (){
		this.$el.html(this.model.template({o: this.model}));

		return this;
	}
});

var Instagram = Backbone.View.extend({
	tagName:'li',
	className:'instagram',
	initialize: function (opts){
		_.bindAll(this,'enlarge','close');

		this.items = new Grams(opts)
		this.items.fetch();

		var v = $("<div id='enlarge'><div class='close'></div></div>");
		this.$viewport = v;

		this.$viewport.find('.close').on('click', this.close);
		$(document).on('keyup', this.close);

		this.$viewport.on(transEndStr, _.bind(function (){
			if(!this.$viewport.hasClass('open'))
				this.$viewport.css('z-index',-1);
		},this));

		this.listenTo(this.items,'sync',this.render);
		this.$el.on('click','img.pic',this.enlarge);
	},

	close: function (evt){
		if((evt.type == 'keyup' && evt.keyCode == 27) || evt.type == 'click')
			this.$viewport.removeClass('open');
	},

	enlarge: function (evt){
		this.$viewport.addClass('open').css({
			zIndex:100,
			'background-image':'url('+$(evt.target).prop('src')+')'
		});
	},

	render: function (){
		this.$el.empty();

		if($('#viewport'))
			$('body').append(this.$viewport);

		_(this.items.models).each(_.bind(function (item, idx){
			var ele = new InstagramView({model:item});

			var $ele = ele.render().$el;

			$ele.css({
				'left': _.random(-5,80)+'%',
				'top': _.random(-5,80)+'%'
			})

			$ele.find('img').css('width',_.random(40,90)+'%');

			this.$el.append($ele);
		},this));

		var lock = $("<img class='lock' src='/img/eye.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});

/*
	Youtube face
*/
var Tube = Backbone.Model.extend({
	truncate:20,
	template: _.template(
	"<iframe id=\"ytplayer\" type=\"text/html\" width=\"640\" height=\"390\""+
		"src=\"http://www.youtube.com/embed/<%= o.get('yt_id') %>\""+
	  	"frameborder=\"0\"/>"+
	  	"<h3><%= o.get('title') %></h3>"+
	  	"<p><%= o.get('description') %></p>"
	)
});

var Tubes = BaseCollection.extend({
	model: Tube,
	fragment:'/youtube/'
});

var TubeView = Backbone.View.extend({
	tagName:'div',
	className:'video',
	render: function (){
		this.$el.html(this.model.template({o: this.model}));

		return this;
	}
});

var Youtube = Backbone.View.extend({
	tagName:'li',
	className:'youtube',
	initialize: function (opts){
		this.items = new Tubes(opts);
		this.items.fetch();

		this.listenTo(this.items,'sync',this.render);
	},

	render: function (){
		this.$el.empty();

		_(this.items.models).each(_.bind(function (item, idx){
			var ele = new TubeView({model:item});

			var $ele = ele.render().$el;

			this.$el.append($ele);
		},this));

		var lock = $("<img class='lock' src='/img/eye.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});


/*
	Solution face
*/
var Mix = Backbone.Model.extend({
	truncate:20,
	template: _.template($('#solution-stack-template').html()),
	initialize: function (){
		_.bindAll(this,'first_media');
	},
	first_media: function(){
		return this.get('media')[0].photo;
	}
});

var Mixes = BaseCollection.extend({
	model: Mix,
	fragment:'/solutions/'
});

var MixView = Backbone.View.extend({
	tagName:'div',
	className:'solution-item',
	render: function (){
		this.$el.html(this.model.template({o: this.model}));

		return this;
	}
});

var Solution = Backbone.View.extend({
	tagName:'li',
	className:'solution',
	solutionMenu: _.template($('#solution-menu-template').html()),
	initialize: function (opts){
		_.bindAll(this, 'select');

		this.items = new Mixes();

		this.$menu = $("<ul id='solution-menu'></ul>");

		this.$el.on('click','#solution-menu li.solution-option',this.select);
		this.$el.on(transEndStr, 'div.solution-item', function (){
			if($(this).hasClass('selected'))
				$(this).css('z-index',99);
			else
				$(this).css('z-index',-1);
		});


		this.items.fetch();
		this.listenTo(this.items,'sync',this.render);
	},

	select: function (evt){
		var idx = $(evt.target).index();

		this.$menu.find('.solution-option')
				  .removeClass('selected')
				  .eq(idx)
				  .addClass('selected');

		this.$el.find('div.selected').removeClass('selected');
		this.$el.find('.solution-item').eq(idx).addClass('selected');

	},

	render: function (){
		this.$el.empty();
		if(this.items.models.length < 1 )return this;

		this.$el.append(this.$menu);
		this.$menu.html(
			this.solutionMenu({items: this.items.models})
		);

		_(this.items.models).each(_.bind(function (item, idx){
			var ele = new MixView({model:item});

			var $ele = ele.render().$el;

			this.$el.append($ele);
		},this));

		var lock = $("<img class='lock' src='/img/eye.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		/* select first solution */
		this.$menu.find('li.solution-option').first().addClass('selected');
		this.$el.find('.solution-item')
				.first()
				.addClass('selected')
				.css('z-index',1);

		return this;
	}
});


var Links = Backbone.View.extend({});
var Photos = Backbone.View.extend({});

var Cube = Backbone.View.extend({
	tagName:'ul',
	id:'cube',
	faces: [
		new Solution({limit:1}),
		new Instagram(),
		new Youtube({limit:1}),
		new Instagram({offset:10}),
		new Youtube({limit:1,offset:1}),
		new Instagram()
	],
	faceMap: ['front','right','back','left','top','bottom'],
	initialize: function (){

	},
	render: function (){
		var self = this;
		_(this.faces).each(_.bind(function (obj, idx){
			var ele = obj.render().$el;
			ele.addClass(this.faceMap[idx]+' face');
			obj.face = this.faceMap[idx];
			this.$el.append(ele);
		},this));

		return this;
	}
});