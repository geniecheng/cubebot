var transEndStr = 'webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd';
var URL;

URL = 'https://morning-thicket-7130.herokuapp.com/api';
//URL = 'http://localhost:8000/api';

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
	template: _.template(
		"<img class='pic' src='<%= o.get('photo') %>'>"+
		"<div id='bg-fill'><a href='https://www.instagram.com/cubebotofficial/' target='_blank'>@cubebotofficial</a></div>"
	)
});

var Grams = BaseCollection.extend({
	model: Gram,
	fragment:'/instagram/'
});

var InstagramView = Backbone.View.extend({
	tagName:'div',
	className:'photo',
	render: function (){
		this.$el.attr('data-face',this.face);

		this.$el.html(this.model.template({o: this.model}));

		return this;
	}
});

var Instagram = Backbone.View.extend({
	tagName:'li',
	className:'instagram',
	limit:1,
	initialize: function (opts){
		this.items = new Grams({limit:this.limit});
		this.items.fetch();

		this.listenTo(this.items,'sync',this.render);
	},

	render: function (){
		this.$el.empty();
		this.$el.attr('data-face',this.face);

		var container = $("<div class='insta-container clearfix'></div>");
		this.$el.append(container);

		_(this.items.models).each(_.bind(function (item, idx){
			var ele = new InstagramView({model:item});

			var $ele = ele.render().$el;

			container.append($ele);
		},this));

		var lock = $("<img class='lock' src='/img/rotate.svg' data-face='"+this.face+"'>");
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
		opts = opts || {};
		opts['limit'] = 1;

		this.items = new Tubes(opts);
		this.items.fetch();

		this.listenTo(this.items,'sync',this.render);
	},

	render: function (){
		this.$el.empty();
		this.$el.attr('data-face',this.face);

		_(this.items.models).each(_.bind(function (item, idx){
			var ele = new TubeView({model:item});

			var $ele = ele.render().$el;

			this.$el.append($ele);
		},this));

		var lock = $("<img class='lock' src='/img/rotate.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});


/*
	Solution face
*/
var Mix = Backbone.Model.extend({
	truncate:20,
	template: _.template($('#solution-template').html())
});

var Mixes = BaseCollection.extend({
	model: Mix,
	fragment:'/solutions/',
	url: function (){
		return URL + this.fragment + this.params.type;
	},
	parse: function (data){
		return data;
	}
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
	initialize: function (opts){
		_.bindAll(this, 'advance');
		opts = opts || {};

		this.item = new Mixes(opts);

		this.anim = false;

		this.$el.on('click','.solution-slideshow li',this.advance);

		this.item.fetch();
		this.listenTo(this.item,'sync',this.render);
	},

	advance: function (evt){
		if(this.anim)return;
		this.anim = true;

		var idx = $(evt.target).index();
		var images = this.$el.find('.solution-slideshow li');

		images.eq(idx).css('z-index',95).addClass('soon-inactive');
		images.eq( (idx + 1) % images.length)
			  .css('z-index',99)
			  .addClass('active');

		var self = this;
		setTimeout(function (){
			self.$el.find('.soon-inactive').each(function (){
				$(this).removeClass('soon-inactive active')
					   .css('z-index',-1);
			});
			self.anim = false;
		},350);

	},

	render: function (){
		this.$el.empty();
		if(this.item.models.length < 1) return this;

		this.$el.attr('data-face',this.face);

		var ele = new MixView({model:this.item.models[0]});
		var $ele = ele.render().$el;
		this.$el.append($ele);

		this.$el.find('.solution-slideshow li')
			.first()
			.addClass('active')
			.css('z-index',1);

		var lock = $("<img class='lock' src='/img/rotate.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});



var StaticResource = BaseCollection.extend({
	fragment:'/flex-content/'
});

var Static = Backbone.View.extend({
	tagName:'div',
	className:'static',
	initialize: function (){
		this.item = new StaticResource();
		this.item.fetch();

		this.listenTo(this.item,'sync',this.render);
	},
	render: function (){
		this.$el.attr('data-face',this.face);

		if(this.item.models.length){
			this.$el.html(this.item.models[0].get('html'))
		}

		var lock = $("<img class='lock' src='/img/rotate.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});


var Photo = Backbone.Model.extend({
	truncate:20,
	template: _.template($('#photography-template').html()),
	initialize: function (opts){
		_.bindAll(this,'get_caption');
	},
	get_caption: function() {
		var safe_caption = _.escape(this.get('caption'));
		if(this.get('link'))
			return "<a href=\""+this.get('link')+"\" target=\"_blank\">"+safe_caption+"</a>";
		else
			return safe_caption;
	}
});

var PhotoCollection = BaseCollection.extend({
	model: Photo,
	fragment:'/photography/'
});

var PhotoView = Backbone.View.extend({
	tagName:'div',
	className:'photo-item',
	render: function (){
		this.$el.empty();

		var container = $("<ul class='photo-slideshow'></ul>");
		this.$el.append(container);

		_(this.model.models).each(_.bind(function (item, idx){
			var ele = item.template({o: item});
			container.append(ele);
		},this));

		return this;
	}
});

var Photos = Backbone.View.extend({
	tagName:'div',
	className:'photos',
	initialize: function (opts){
		_.bindAll(this, 'advance');
		opts = opts || {};

		this.item = new PhotoCollection(opts);

		this.anim = false;

		this.$el.on('click','.photo-slideshow li',this.advance);

		this.item.fetch();
		this.listenTo(this.item,'sync',this.render);
	},

	advance: function (evt){
		if(this.anim)return;
		this.anim = true;

		var idx = $(evt.target).index();
		var images = this.$el.find('.photo-slideshow li');

		images.eq(idx).css('z-index',95).addClass('soon-inactive');
		images.eq( (idx + 1) % images.length)
			  .css('z-index',99)
			  .addClass('active');

		var self = this;
		setTimeout(function (){
			self.$el.find('.soon-inactive').each(function (){
				$(this).removeClass('soon-inactive active')
					   .css('z-index',-1);
			});
			self.anim = false;
		},350);

	},

	render: function (){
		this.$el.empty();
		if(this.item.models.length < 2) return this;

		this.$el.attr('data-face',this.face);

		var view = new PhotoView({model: this.item});
		this.$el.html(view.render().$el);

		this.$el.find('.photo-slideshow li')
			.first()
			.addClass('active')
			.css('z-index',1);

		var lock = $("<img class='lock' src='/img/rotate.svg' data-face='"+this.face+"'>");
		this.$el.append(lock);

		return this;
	}
});

var registry = {
	'instagram':Instagram,
	'static':Static,
	'youtube':Youtube,
	'photos':Photos,

	'cub-sol':Solution,
	'jul-sol':Solution,
	'gut-sol':Solution
};

var labels = {
	'instagram':'#cubebot',
	'static':'Additional Info',
	'youtube':'Watch',
	'photos':'MEET CUBEBOT',

	'cub-sol':'Solve Cubebot',
	'jul-sol':'Solve Julien',
	'gut-sol':'Solve Guthrie',
}

var Configuration = BaseCollection.extend({
	fragment: '/configuration/'
});

var Cube;
$(function (){
	Cube = Backbone.View.extend({
		tagName:'ul',
		id:'cube',
		navTemplate:_.template("<a href='#' class='face-nav <%= face %>'><span data-face='<%= face %>'><%= label %></span></a>"),
		initialize: function (){
			/* get cube configuration from backend */
			this.config = new Configuration();
			this.config.fetch();

			this.$nav = $('nav');

			this.listenTo(this.config,'sync',this.render);
		},
		render: function (){
			this.$el.empty();

			if(!this.config.models.length) return this;
			var self = this;

			_(this.config.models[0].attributes).each(_.bind(function (_type,face){
				var _class = registry[_type]

				obj = new _class({type:_type});
				obj.face = face;

				var ele = obj.render().$el;
				ele.addClass(face+' face');

				this.$el.append(ele);

				this.$nav.prepend(
					this.navTemplate({face:face,label:labels[_type]})
				);
			},this));

			return this;
		}
	});
});