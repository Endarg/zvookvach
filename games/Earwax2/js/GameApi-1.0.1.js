// namespace:
this.JVG = this.JVG||{};


(function() {
/**
*
* @class SubscriberBar
* @extends Container
* @constructor
**/
var GameApi = function( contentUrl, gameUrl ) {
    this.initialize( contentUrl, gameUrl );
}
var p = GameApi.prototype;

//public properties:
    p.flashVars = null;
    p.request = null;
    p.browserData = null;

    p.contentUrl = null;
    p.gameUrl = null;

    p.usingScreenShot = false;

    p.flashWidth;
    p.flashHeight;

    p.initialize = function( contentUrl, gameUrl ) {
        this.contentUrl = contentUrl;
        this.gameUrl = gameUrl;

        this.flashVars = {};
        this._detectBrowser();
        this._detectRequest();
    }

    p.isMobile = function() {
        this.browserData
        var mobileIndex = this.browserData.userAgent.toLowerCase().indexOf( "mobile" );
        var androidIndex = this.browserData.userAgent.toLowerCase().indexOf( "android" );
        return (mobileIndex > 0) || (androidIndex > 0);
    }

    p.getFlashVars = function() {
        return this.flashVars;
    }

    p._onResize = function() { 
    }

    p.resizeContent = function ( contentId, width, height ) {
        $(contentId).css( "width", width );
        $(contentId).attr( "width", width );
        $(contentId).css( "height", height );
        $(contentId).attr( "height", height );
        $(contentId).css( "float", "left" );
        $(contentId).css( "margin", "0 auto" );
        $(contentId).css( "padding", "0 auto" );
    }

    p.log = function ( data ) {
        window.console&&console.log( data );
    }

    p.detectZoom = function() {
        JVG.swf.onDetectZoom( screen.width / $(window).width );
    }

    p.handleSwfLoaded = function() {
        if ( navigator.appName.indexOf("Microsoft") != -1 )
            JVG.swf = window["Earwax"];
        else
            JVG.swf = document["Earwax"];
        JVG.api._onResize();
    }

    p._handleMouseWheel = function( event ) {
        if ( JVG.swf ) {
            if ( event.originalEvent != null )
              event = event.originalEvent;

            var delta = event.wheelDelta ? event.wheelDelta : event.detail;

            var o = {
                x: event.clientX, y: event.clientY, delta: delta,
                ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey
            };

            //JVG.swf.jsMouseWheel(o);
        }
    }
    
    /**
    *
    * @method forceRefresh
    * @param refreshLink String
    * @public
    **/
    p.forceRefresh = function( refreshLink ) {
        window.open( refreshLink, "_top" );
    }

    /**
     *
     * @method openNewWindow
     * @param linkToOpen
     *             String
     * @public
     */
    p.openNewWindow = function( linkToOpen, newWidth, newHeight )
    {
        
        if ( newWidth && newHeight )
        {
            // Specify dimensions of the popup if width and height were passed in
            var dimensions = 'width='+ newWidth + ', height='+ newHeight;
            window.open( linkToOpen, "_blank", dimensions );
        }
        else
            // Otherwise, just open link in a new window.
            window.open( linkToOpen, "_blank");
        
    }

    /**
    *
    * @method REQUEST
    * @protected
    **/
    p._detectRequest = function () {
        this.request = {};
        // This function is anonymous, is executed immediately and
        // the return value is assigned to QueryString!
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
            // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
            // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }

        this.request = query_string;
    };


    p._detectBrowser = function() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName  = navigator.appName;

        var fullVersion  = '' + parseFloat( navigator.appVersion );
        var majorVersion = parseInt( navigator.appVersion, 10 );

        var nameOffset;
        var verOffset;
        var ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ( ( verOffset = nAgt.indexOf( "Opera" ) ) != -1 ) {
           browserName = "Opera";
           fullVersion = nAgt.substring( verOffset + 6 );

           if ( ( verOffset = nAgt.indexOf( "Version" ) ) != -1 )
               fullVersion = nAgt.substring(verOffset+8);
        }

        // In MSIE, the true version is after "MSIE" in userAgent
        else if ( ( verOffset = nAgt.indexOf( "MSIE" ) ) != -1 ) {
           browserName = "Microsoft Internet Explorer";
           fullVersion = nAgt.substring( verOffset + 5 );
        }

        // In Chrome, the true version is after "Chrome"
        else if ( ( verOffset = nAgt.indexOf( "Chrome" ) ) != -1 ) {
            browserName = "Chrome";
            fullVersion = nAgt.substring( verOffset + 7 );
        }

        // In Safari, the true version is after "Safari" or after "Version"
        else if ( ( verOffset = nAgt.indexOf( "Safari" ) ) != -1 ) {
            browserName = "Safari";
            fullVersion = nAgt.substring( verOffset + 7 );
            if ( ( verOffset = nAgt.indexOf( "Version" ) ) != -1 )
                fullVersion = nAgt.substring( verOffset + 8 );
        }

        // In Firefox, the true version is after "Firefox"
        else if ( ( verOffset = nAgt.indexOf( "Firefox" ) ) != -1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring( verOffset + 8 );
        }

        // In most other browsers, "name/version" is at the end of userAgent
        else if ( (nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/')) )
        {
            browserName = nAgt.substring( nameOffset, verOffset );
            fullVersion = nAgt.substring( verOffset + 1 );
            if ( browserName.toLowerCase() == browserName.toUpperCase() )
                browserName = navigator.appName;
        }

        // trim the fullVersion string at semicolon/space if present
        if ( (ix = fullVersion.indexOf(";")) != -1 )
            fullVersion = fullVersion.substring( 0, ix );
        if ( (ix = fullVersion.indexOf(" ")) != -1 )
            fullVersion = fullVersion.substring( 0, ix );

        majorVersion = parseInt( '' + fullVersion, 10 );
        if ( isNaN( majorVersion ) ) {
            fullVersion  = '' + parseFloat( navigator.appVersion );
            majorVersion = parseInt( navigator.appVersion, 10 );
        }

        this.browserData = {
            name : browserName,
            fullVersion : fullVersion,
            majorVersion : majorVersion,
            appName : navigator.appName,
            userAgent : navigator.userAgent
        };
    }

    p.isIE = function() {
        return this.browserData.name == "Microsoft Internet Explorer";
    }


JVG.GameApi = GameApi;
}());
