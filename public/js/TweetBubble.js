var TweetStore = require('./TweetStore');
var tweetTpl = function(tweet){ return '<b>@'+tweet.screen_name+'</b><br>'+tweet.tweetText; };
function TweetBubble(opts){
	this.$el = createEl();
	this.sourceEl = null;// the element we "attach" to bubble to

	if(opts.tweetTpl){
		tweetTpl = opts.tweetTpl;
	}
	$('body').append(this.$el);
	$(window).on('resize', attach.bind(this));
}

TweetBubble.prototype.show = function(sourceEl, tweetId) {
	this.sourceEl = sourceEl;
	this.tweetId = tweetId;
	renderLoading.call(this);
	TweetStore.get(tweetId, renderTweet.bind(this));
	attach.call(this);
	show.call(this);
};

TweetBubble.prototype.hide = hide;


function renderTweet(tweet){
	console.log('renderTweet', tweet);
	if(tweet.index !== this.tweetId) return; //server responded too late
	this.$el.html(tweetTpl(tweet));
	// tweet might have changed $el size
	attach.call(this);
}

function renderLoading(){
	this.$el.html('loading...');
}

function createEl(){
	var $el = $('<div class="tweet-bubble"></div>');
	return $el;
}

function attach(){
	if(!this.sourceEl) return;
	var sourceElPos = $(this.sourceEl).offset();
	sourceElPos.top += $(this.sourceEl).height()+2;
	sourceElPos.left -= 10;
	this.$el.css(sourceElPos);
}

function show(){
	this.$el.addClass('visible');
}

function hide(){
	this.sourceEl = null;
	this.$el.removeClass('visible');
}



module.exports = TweetBubble;

