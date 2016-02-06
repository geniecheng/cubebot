var transEndStr = 'transitionend msTransitionEnd oTransitionEnd';
var URL;

URL = 'https://morning-thicket-7130.herokuapp.com/api';
//URL = 'http://localhost:8000/api';

var rotate_svg = '<svg x="0px" y="0px" viewBox="0 0 486.805 486.805"><path d="M261.397,17.983c-88.909,0-167.372,51.302-203.909,129.073L32.072,94.282L0,109.73l52.783,109.565l109.565-52.786l-15.451-32.066L89.82,161.934c30.833-65.308,96.818-108.353,171.577-108.353c104.668,0,189.818,85.154,189.818,189.821s-85.15,189.824-189.818,189.824c-61.631,0-119.663-30.109-155.228-80.539l-29.096,20.521c42.241,59.87,111.143,95.613,184.324,95.613c124.286,0,225.407-101.122,225.407-225.419S385.684,17.983,261.397,17.983z"/></svg>';

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
		"<a href='https://www.instagram.com/<%= o.get('user') %>/' target='_blank'>@cubebotofficial</a>"
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
	render: function (){
		this.$el.attr('data-face',this.face);

		this.$el.html(this.model.template({o: this.model}));

		return this;
	}
});

var Instagram = Backbone.View.extend({
	tagName:'li',
	className:'instagram',
	limit:4,
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

		var lock = $("<div class='lock' data-face='"+this.face+"'>"+rotate_svg+"</div>");
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
	  	"frameborder=\"0\"/>"
	  	//"<h3><%= o.get('title') %></h3>"+
	  	//"<p><%= o.get('description') %></p>"
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

		var lock = $("<div class='lock' data-face='"+this.face+"'>"+rotate_svg+"</div>");
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
	animDelay:300,
	initialize: function (opts){
		_.bindAll(this, 'cursor','delegate','prev','next');
		opts = opts || {};

		this.item = new Mixes(opts);

		this.anim = false;
		this.idx = 0;

		this.$el.on('mousemove',_.throttle(this.cursor,50));
		this.$el.on('mouseup','.solution-slideshow',this.delegate);


		this.item.fetch();
		this.listenTo(this.item,'sync',this.render);
	},

	cursor: function (evt){
		var x = evt.clientX;
		var bb = this.el.getBoundingClientRect();

		if(x - bb.left > bb.width/2)
			this.$el.css('cursor','e-resize')
		else
			this.$el.css('cursor','w-resize')
	},

	delegate: function (evt){
		if(this.anim)return;

		var bb = this.el.getBoundingClientRect();
		this.images.eq(this.idx).css('z-index',95);

		// click over halfway point?
		if(evt.clientX - bb.left > bb.width/2 || isMobile())
			this.next();
		else
			this.prev();

		var self = this;
		this.images.eq(this.idx)
				   .css('z-index',99)
				   .addClass('active');

		setTimeout(function (){
			self.images.eq(self.lidx)
					   .removeClass('active')
					   .css('z-index',-1);

			self.anim = false;
		},this.animDelay);
	},

	prev: function (){
		this.anim = true;
		this.lidx = this.idx;
		this.idx = this.idx - 1 < 0 ? this.images.length-1:this.idx - 1;
	},

	next: function (){
		this.anim = true;
		this.lidx = this.idx;
		this.idx = (this.idx + 1) % this.images.length;
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

		var lock = $("<div class='lock' data-face='"+this.face+"'>"+rotate_svg+"</div>");
		this.$el.append(lock);

		/* cache images*/
		this.images = this.$el.find('.solution-slideshow li');

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

		var lock = $("<div class='lock' data-face='"+this.face+"'>"+rotate_svg+"</div>");
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
	animDelay:300,
	initialize: function (opts){
		_.bindAll(this, 'prev','next','delegate','cursor');
		opts = opts || {};

		this.item = new PhotoCollection(opts);

		this.anim = false;
		this.idx = 0;

		this.$el.on('mousemove',_.throttle(this.cursor,50));
		this.$el.on('mouseup','.photo-slideshow',this.delegate);

		this.item.fetch();
		this.listenTo(this.item,'sync',this.render);
	},

	cursor: function (evt){
		var x = evt.clientX;
		var bb = this.el.getBoundingClientRect();

		if(x - bb.left > bb.width/2)
			this.$el.css('cursor','e-resize')
		else
			this.$el.css('cursor','w-resize')
	},

	delegate: function (evt){
		if(this.anim)return;
		var bb = this.el.getBoundingClientRect();

		this.images.eq(this.idx).css('z-index',95);

		// click over halfway point?
		if(evt.clientX - bb.left > bb.width/2 || isMobile())
			this.next();
		else
			this.prev();

		var self = this;
		this.images.eq(this.idx)
				   .css('z-index',99)
				   .addClass('active');

		setTimeout(function (){
			self.images.eq(self.lidx)
					   .removeClass('active')
					   .css('z-index',-1);

			self.anim = false;
		},this.animDelay);
	},

	prev: function (){
		this.anim = true;
		this.lidx = this.idx;
		this.idx = this.idx - 1 < 0 ? this.images.length-1:this.idx - 1;
	},

	next: function (){
		this.anim = true;
		this.lidx = this.idx;
		this.idx = (this.idx + 1) % this.images.length;
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

		var lock = $("<div class='lock' data-face='"+this.face+"'>"+rotate_svg+"</div>");
		this.$el.append(lock);

		/* cache images, boundingbox */
		this.bb = this.el.getBoundingClientRect();
		this.images = this.$el.find('.photo-slideshow li');

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
		navTemplate:_.template("<a href='#' class='face-nav <%= face %>' data-face='<%= face %>'><span data-face='<%= face %>'><%= label %></span></a>"),
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

				this.$nav.append(
					this.navTemplate({face:face,label:labels[_type]})
				);
			},this));

			this.$nav.append(
				"<hr />"+
				"<a href='http://www.areaware.com/collections/cubebot' target='_blank' class='yellow'><span>shop</span></a>"
			);

			return this;
		}
	});
});