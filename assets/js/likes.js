// Generated by CoffeeScript 1.9.3
(function() {
  var ContentHelper, UQC;

  UQC = (function() {
    function UQC() {}

    UQC.bind = function(scope, func, args) {
      if (typeof func === "string") {
        func = scope[func];
      }
      return function() {
        return func.apply(scope, args || arguments_);
      };
    };

    UQC.trim = function(string) {
      return string.replace(/^\s*|\s*$/g, "");
    };

    UQC.stripHTML = function(text) {
      return text.replace(/<\/?[^>]+>/g, "");
    };

    return UQC;

  })();

  ContentHelper = (function() {
    var thumbSize,curOff, COLUMNS, MIN_HEIGHT, MONTHS, MONTHS_SHORT, append, appendMonth, createContext, lastMonth, makeDate, makeTime, renderPartial, renderTemplate, sections, setContextForText, setContextForAnswer, setContextForAudio, setContextForChat, setContextForPhoto, setContextForQuote, setContextForVideo, templateCache;

    function ContentHelper() {}

    COLUMNS = 8;

    MIN_HEIGHT = null;

    MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    ContentHelper.debug = false;

    lastMonth = -1;

    templateCache = {};

    sections = {};
    curOff = -1;
    thumbSize = [];

    ContentHelper.setContent = function(posts, currentOffset) {
      var ctx, date, j, len, post, results, sectionName, thumbnail;
      if (this.debug) {
        console.log("received posts:");
        console.log(posts);
      }
      results = [];
      for (j = 0, len = posts.length; j < len; j++) {
        post = posts[j];
        date = new Date(post.timestamp * 1000);
        var pageLimit = 250;
        var page = Math.round(currentOffset/pageLimit)+1;
        sectionName = "Tile List Page " + page + "(" + Math.max((page-1)*pageLimit, 0) + "~" + page*pageLimit + "Posts)";
        if (curOff != page) {
          appendMonth("<div class=\"heading\">" + sectionName + "</div>", sectionName);
          curOff = page;
        }

        ctx = createContext();
        ctx.date = {
          year: date.getYear(),
          month: date.getMonth(),
          day: date.getDay(),
          shortForm: makeDate(date.getMonth(), date.getDate()),
          time: makeTime(date.getHours(), date.getMinutes())
        };
        ctx.id = post.id;
        ctx.key = post.reblog_key;
        ctx.type = post.type;
        ctx.url = post.post_url;
        ctx.user = post.blog_name;
        ctx.noteCount = post.note_count;
        ctx.caption = post.caption || "";
        ctx.text = post.body || "";
        ctx.fullText = ctx.text;
        ctx.title = post.title || null;
        ctx.height = 125;
        var height = ctx.height;
        switch (post.type) {
          case "video":
            setContextForVideo(post, ctx);
            break;
          case "audio":
            setContextForAudio(post, ctx);
            break;
          case "photo":
            setContextForPhoto(post, ctx);
            height = ctx.thumbnail.height;
            break;
          case "quote":
            setContextForQuote(post, ctx);
            break;
          case "chat":
            setContextForChat(post, ctx);
            break;
          case "answer":
            setContextForAnswer(post, ctx);
            break;
          case "text":
            setContextForText(post,ctx);
            break;
        }
        thumbnail = ctx.thumbnail;
        if (thumbnail && thumbnail.height && thumbnail.height < ctx.height) {
          if (thumbnail.height < MIN_HEIGHT) {
            ctx.height = MIN_HEIGHT;
          } else {
            ctx.height = thumbnail.height;
          }
        }
        ctx.text = $("<div>" + ctx.text + "</div>").text();
        if (ctx.title && ctx.title.length > 210) {
          ctx.title = ctx.title.substring(0, 210);
        }
        if (ctx.text.length == 0){
          ctx.text += "テキストポストですが動画か画像のみっぽいです:( Text post, but video or image only."
        }
        if (ctx.text.length > 180) {
          ctx.text = ctx.text.substring(0, 180) + " [...]";
        }
        else if (ctx.text.length < 180) {
          ctx.text += "　".repeat(180 - ctx.text.length);
        }
        lastMonth = date.getMonth();
        results.push(append(renderTemplate("node", ctx), sectionName, height));
      }
      return results;
    };

    renderTemplate = function(name, data) {
      var ctx, template;
      template = "Could not find template '" + name + "'.";
      if (!templateCache[name]) {
        ctx = {};
        $.ajax({
          url: "/Tumblr-Likes-Grid/assets/templates/" + name + ".mustache",
          async: false,
          context: ctx,
          success: function(data) {
            if (this.debug) {
              console.log("retrieved template '" + name + "' from file.");
            }
            return ctx.data = data;
          },
          failure: function() {
            if (this.debug) {
              return console.log("cold not retrieve template '" + name + "' from file.");
            }
          }
        });
        if (ctx.data) {
          templateCache[name] = ctx.data;
          template = ctx.data;
        }
      } else {
        template = templateCache[name];
      }
      return Mustache.to_html(template, data);
    };

    renderPartial = function(partial, render) {
      partial = UQC.trim(render(partial));
      return renderTemplate(partial, this);
    };

    createContext = function() {
      return {
        dynamicPartial: function() {
          return renderPartial;
        }
      };
    };

    setContextForChat = function(post, ctx) {
      var chat, lcv, results;
      ctx.type = "conversation";
      ctx.chat = [];
      chat = ctx.chat;
      lcv = 0;
      results = [];
      while (lcv < post.dialogue.length) {
        if (lcv % 2 === 0) {
          chat[lcv] = {};
          chat[lcv].first = post.dialogue[lcv];
        } else {
          chat[lcv - 1].second = post.dialogue[lcv];
        }
        results.push(++lcv);
      }
      return results;
    };

    setContextForAnswer = function(post, ctx) {
      ctx.theQuestion = post.question || "";
      ctx.theAnswer = post.answer || "";
      return ctx.theAsker = post.asking_name || "";
    };

    setContextForText = function(post, ctx) {
      return ctx.body = post.body;
    };

    setContextForQuote = function(post, ctx) {
      ctx.fullText = ctx.text = post.text;
      return ctx.source = post.source;
    };

    setContextForPhoto = function(post, ctx) {
      var img, sizes, thumbnail;
      ctx.thumbnail = {
        url: "#"
      };
      thumbnail = ctx.thumbnail;
      if (post.photos.length > 0) {
        thumbnail.urls = [];
      for (j = 0, len = post.photos.length; j < len; j++) {
        sizes = post.photos[j].alt_sizes;
        img = sizes.length - 3 < 0 ? sizes.length - 1 : sizes.length - 3;
        img = sizes[img];
        thumbnail.urls.push(img);
      }

        thumbnail.height = thumbnail.urls.reduce((p, x) => p + x.height, 0);
        ctx.preview_url = post.photos[0].original_size.url;
        ctx.preview_urls = post.photos;
        ctx.sourceLink = post.source_url;
        ctx.sourceTitle = post.source_title;
        ctx.caption = post.caption;
        return thumbnail.width = img.width;
      }
    };

    setContextForAudio = function(post, ctx) {
      var info;
      ctx.fullText = ctx.text = post.caption;
      info = "";
      if (post.artist && post.artist.length > 0) {
        if (post.track_name && post.track_name.length > 0) {
          info = post.artist + " - " + post.track_name;
        } else {
          info = post.artist;
        }
      }
      if (post.album && post.album.length > 0) {
        info += "<br/>" + post.album;
      }
      ctx.info = info.length > 0 ? info : null;
      if (post.album_art && post.album_art.length > 0) {
        return ctx.thumbnail = post.album_art;
      }
    };

    setContextForVideo = function(post, ctx) {
      var frameText, frames, iEnd, iStart, raw, thumbnail, x;
      thumbnail = {
        url: "#"
      };
      if (post.player && post.player.length > 0) {
        raw = post.player[0].embed_code;
        iStart = raw.indexOf("'poster=");
        iEnd = raw.length - 10;
        if (iStart !== -1) {
          frameText = raw.substring(iStart + 8, iEnd - 1);
          frames = frameText.split(",");
          x = 0;
          while (x < frames.length) {
            frames[x] = {
              url: decodeURIComponent(frames[x])
            };
            ++x;
          }
          ctx.frames = frames;
        }
      }
      thumbnail.url = post.thumbnail_url;
      thumbnail.height = post.thumbnail_height;
      thumbnail.width = post.thumbnail_width;
      ctx.preview_url = post.video_url;
      return ctx.thumbnail = thumbnail;
    };

    appendMonth = function(html, sectionName) {
      var container, i, section;
      section = sections[sectionName];
      if (!section) {
        container = $("<div class=\"container\">");
        container.append(html);
        i = 0;
        thumbSize = [];
        while (i < COLUMNS) {
          container.append($("<ul class=\"column\">"));
          thumbSize.push(0);
          ++i;
        }
        section = container;
        sections[sectionName] = section;
        return $(".grid").append(section);
      }
    };

    append = function(html, sectionName, height) {
      var col, node, nodes, section;
      section = sections[sectionName];
      nodes = section.find("div.brick");
      col = nodes.length % COLUMNS;
      node = $("<li class=\"stack\" style=\"display:none;\">");
      node.append(html);
      var index = thumbSize.indexOf(Math.min(...thumbSize));

      $(section.find("ul.column")[index]).append(node);
      thumbSize[index] += height;
      return node.fadeIn(600);
    };

    makeDate = function(month, day) {
      var str;
      day += 1;
      str = "";
      if (day === 1 || day === 21 || day === 31) {
        str = "st";
      } else if (day === 2 || day === 22) {
        str = "nd";
      } else if (day === 3 || day === 23) {
        str = "rd";
      } else {
        str = "th";
      }
      str = MONTHS_SHORT[month] + ". " + day + "<sup>" + str + "</sup>";
      return str;
    };

    makeTime = function(hours, minutes) {
      var pm, str;
      pm = hours >= 12;
      str = (hours % 12) + ":";
      str += (minutes < 10 ? "0" : "") + minutes;
      str += pm ? "pm" : "am";
      return str;
    };

    return ContentHelper;

  })();

  this.Likes = (function() {
    var currentOffset, failForLikes, failForUnlike, failForUserInfo, getLikes, isFinished, isScrolling, scrollWatch, setHeaderInfo, setHeaderInfoComplete, successForLikes, successForUnlike, successForUserInfo;

    function Likes() {}

    Likes.debug = true;

    Likes.tumblr;

    currentOffset = 0;
    after = "";
    limit = 20;

    isScrolling = false;

    isFinished = false;

    getLikes = function(runs, etc) {
      var next;
      if (isFinished) {
        return;
      }
      runs = runs || 1;
      etc = etc || function() {};
      if (this.debug) {
        console.log("getting likes at offset " + currentOffset);
      }
      next = runs === 1 ? etc : function() {
        return getLikes(runs - 1, etc);
      };
      url_q = "https://api.tumblr.com/v2/user/likes?offset="+currentOffset+"&limit="+limit;
      console.log(after);

      if(after)
      {
          url_q = "https://api.tumblr.com"+after;
      }
      Likes.tumblr.get(url_q).done(function(data) {
        if (this.debug) {
          console.log("200 OK /v2/user/likes");
        }
        console.log(data);
        if(typeof data.response._links != "undefined"){
          after = data.response._links.next.href;
        }
        console.log(after);
        console.log(url_q);
        successForLikes(data);
        return next();
      }).fail(function(err) {
        if (this.debug) {
          console.log(err);
        }
        failForLikes();
        return next();
      });
      currentOffset += limit;
      if (this.debug) {
        return console.log("finished");
      }
    };

    successForLikes = function(data) {
      if (this.debug) {
        console.log("got data");
      }
      if (currentOffset >= data.response.liked_count) {
        if (this.debug) {
          console.log("We're finished!");
        }
        isFinished = true;
        $("#loading").fadeOut(800);
      }
      return ContentHelper.setContent(data.response.liked_posts, currentOffset);
    };

    failForLikes = function(data) {
      console.log("failure");
      return console.log(data);
    };

    setHeaderInfo = function() {
      return Likes.tumblr.get("https://api.tumblr.com/v2/user/info").done(function(data) {
        if (this.debug) {
          console.log("200 OK /v2/user/info");
        }
        return successForUserInfo(data);
      }).fail(function(err) {
        if (this.debug) {
          console.log(err);
        }
        return failForUserInfo(data);
      });
    };

    successForUserInfo = function(data) {
      if (this.debug) {
        console.log("got user data");
      }
      console.log(data);
      return setHeaderInfoComplete(data.response.user.likes, data.response.user.name, data.response.user.blogs[0].url);
    };

    failForUserInfo = function(data) {
      console.log("GET /v2/user/info fail");
      return console.log(data);
    };

    setHeaderInfoComplete = function(likesCount, userName, primaryUrl) {
      var blog, text;
      blog = $("#nav a.blog_title");
      text = userName + " &mdash; You like " + likesCount + " posts!";
      blog.attr("href", primaryUrl);
      return blog.html(text);
    };

    Likes.unlike = function(post) {
      return Likes.tumblr.post("https://api.tumblr.com/v2/user/unlike", {
        "id": post.id,
        "reblog_key": post.key
      }).done(function(data) {
        return successForUnlike(post.id, data);
      }).fail(function(err) {
        return failForUnlike(data);
      });
    };

    successForUnlike = function(id, data) {
      if (this.debug) {
        console.log("unliked post " + id);
      }
      $("#" + id + " a.remove").remove();
      $("#" + id + " img").remove();
      $("#" + id + " div.overprint").remove();
      $("#" + id + " div.play_overlay").remove();
      $("#" + id + " div.caption").remove();
      return $("#" + id).addClass("removed");
    };

    failForUnlike = function(data) {
      return alert("Sorry, but an error has occurred.");
    };

    scrollWatch = function() {
      var win;
      win = $(window);
      return win.scroll(function() {
        if (isFinished) {
          return;
        }
        if (win.scrollTop() >= $(document).height() - win.height() - 400) {
          if (isScrolling) {
            return;
          }
          isScrolling = true;
          return getLikes(1, function() {
            return isScrolling = false;
          });
        }
      });
    };

    Likes.startUp = function() {
      console.log("Tumblr Likes Grid, by Ben Fagin\nhttp://life.unquietcode.com\n\n");
      console.log("Initialize Oauth.js");
      try{
        OAuth.initialize('epZ3ZbW2o20TLFHglXMahz2jWB4');
      }
      catch(e){
        window.location = "../";
      }
      console.log("Get cached credentials");
      Likes.tumblr = OAuth.create("tumblr");
      if(!Likes.tumblr){
        window.location = "../";
      }
      setHeaderInfo();
      getLikes(4);
      return scrollWatch();
    };

    return Likes;

  })();

  window.Likes = Likes;

}).call(this);
