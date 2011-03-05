/*!
 * jQuery NearBy Tweet Stream Plugin
 * Copyright (c) 2010 Wongso Wijaya
 * Version: 0.1 (17 Aug 10)
 * Requires: jQuery v1.4.2 
 */
 
;(function($) {

	$.fn.jqNearbyTweetStream = function(options) {

		//ignore options for now
		
		return this.each(function() {

			var $frame = $(this);
			var opts = $.extend(true, {}, $.fn.jqNearbyTweetStream.defaults, options || {}, $.metadata ? $frame.metadata() : {});

			opts.title = opts.title || '';
			var t = opts.titleLink ? ('<a href="'+ opts.titleLink +'">'+ opts.title + '</a>') : ('<span>' + opts.title + '</span>');
			var $t = $(t);
			var $title = $('<div class="nearbyTweetTitle"></div>').append($t).appendTo($frame).css(opts.css['title']);
		
			var $cont = $('<div class="nearbyTweetContainter"></div>').appendTo($frame).css(opts.css['container']);
			var url = opts.url + '&geocode=' + opts.latitude + ',' + opts.longtitude + ',' + opts.radius;
			$frame.css(opts.css['frame']);
			
			var h = $frame.innerHeight() - $title.outerHeight();
			$cont.height(h);

			var tweetArray = [];
			var prevTweetArray = [];
			var sinceId = '-1';
		
			//timer to grab the JSON
			getTweets(url); //time to get tweets
		
			updateScreen(0); //timer to update the display

			function getTweets(url) {
				  var tempurl = url;
					if (sinceId != '-1') tempurl = tempurl + '&since_id=' + sinceId;
					if (prevTweetArray.length > 100) {
						//console.log('clear prev tweet');
						prevTweetArray = [];
					}
					if (tweetArray.length > 100) {
						//console.log('pause');
						waitTimer(5000);
					}
					// grab twitter stream
					$.getJSON(tempurl, function(json){
						if (json && json.results && json.results.length > 0) {
							sinceId = json.results[0].id;
							if (tweetArray.length == 0) tweetArray = json.results.reverse();
							else  {
								tweetArray.concat(json.results.reverse());
							}
						} else {
							sinceId = '-1';
						}
						setTimeout(function(){getTweets(url)}, 60000);
					}); // end get json
			} // end getTweets
			
			function 	updateScreen(displayCounter) {
				if (tweetArray && tweetArray.length > 0) {
					var tweetData = tweetArray.shift();
					if (! prevTweetArray[tweetData.id]) {
						var tweet = tweetFormatter(tweetData), $tweet = $(tweet);
						$tweet.css(opts.css['tweet']);
						var $img = $tweet.find('.twitterProfileImg').css(opts.css['img']);
						$tweet.find('.twitterUser').css(opts.css['user']);
						$tweet.find('.twitterTime').css(opts.css['time']);
						$tweet.find('a').css(opts.css['a']);
						$tweet.hide().css('opacity',0.0).prependTo($cont).slideDown('slow').animate({opacity: 1.0});
						++displayCounter;
						
						if (displayCounter > 10) {
							var $el = $cont.children(':last'), el = $el[0];
							$el.empty();
							$el.remove();
						}
					} else {
						//console.log('found duplicate');
					}
					prevTweetArray[tweetData.id] = true;
				}
				setTimeout(function(){updateScreen(displayCounter)}, opts.timeout);	
			} // end updateScreen

		});
	};
	
	$.fn.jqNearbyTweetStream.defaults = {
		url: 'http://search.twitter.com/search.json?callback=?',
		rpp: 30,
		latitude: 37.781157,
		longtitude: -122.398720,
		radius: '20km',
		pause: false,				// true or false (pause on hover)
		time: true,					// true or false (show or hide the time that the tweet was sent)
		timeout: 5000,				// delay betweet tweet scroll
		title: 'NearBy Tweets Stream',				// title text to display when frame option is true (default = 'term' text)
		titleLink: null,			// url for title link
		css: {
			// default styling
			a:     { textDecoration: 'none', color: '#3B5998' },
			container: { overflow: 'hidden', backgroundColor: '#eee', height: '100%' },
			frame: { border: '10px solid #C2CFF1', borderRadius: '10px', '-moz-border-radius': '10px', '-webkit-border-radius': '10px' },
			tweet: { padding: '5px 10px', clear: 'left' },
			img:   { 'float': 'left', margin: '5px', width: '48px', height: '48px' },
			loading: { padding: '20px', textAlign: 'center', color: '#888' },
			text:  {},
			time:  { fontSize: 'smaller', color: '#888' },
			title: { backgroundColor: '#C2CFF1', margin: 0, padding: '0 0 5px 0', textAlign: 'center', fontWeight: 'bold', fontSize: 'large', position: 'relative' },
			titleLink: { textDecoration: 'none', color: '#3B5998' },
			user:  { fontWeight: 'bold' }
		}
	};

	function tweetFormatter(data) {
		var t = data.text.parseURL().parseHashtag().parseUsername();
	
		var s = '<div class="twitterTweet">';
		s += '<img class="twitterProfileImg" src="' + data.profile_image_url + '" />';
		s += '<div><span class="twitterUser"><a href="http://www.twitter.com/'+ data.from_user+'/status/'+ data.id +'">' + data.from_user + '</a></span>';
		var d = new Date((data.created_at || "").replace(/-/g,"/").replace(/TZ/g," "));
		s += ' <span class="twitterTime">('+ d.toUTCString() +')</span>'
	 	s += '<div class="twitterText">' + t + '</div></div></div>';
		return s;
	} // end tweetFormatter
	
	
	function waitTimer(milis) { setTimeout(wakeupTimer, milis); }
	function wakeupTimer() { return; }

	String.prototype.parseURL = function() {
		return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+/g, function(url) {
			return url.link(url);
		});
	};
	
	String.prototype.parseUsername = function() {
		return this.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
			var username = u.replace("@","")
			return u.link("http://twitter.com/"+username);
		});
	};
	
	String.prototype.parseHashtag = function() {
		return this.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {
			var tag = t.replace("#","%23")
			return t.link("http://search.twitter.com/search?q="+tag);
		});
	};

})(jQuery);
