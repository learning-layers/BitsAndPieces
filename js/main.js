var require = (function() {
    var appVersion = '3.0.0';
    var sssHostREST = "http://localhost:8080/ss-adapter-rest/SSAdapterRest/";
    var oidcAuthorizationUrl = "";
    var oidcClientID = "";
    var affectUrl = "";
    var helpUrl = "http://foti.ee/bits_and_pieces_manual/BnP_usermanual.html";
    return {
        config: {
            'app' : {
                'sssHostREST' : sssHostREST
            },
            'tracker' : {
                'sssHostREST' : sssHostREST
            },
            'UserAuth' : {
                'sssHostREST' : sssHostREST
            },
            'view/sss/EntityView' : {
                'sssHostRESTFileDownload' : sssHostREST.replace(/SSAdapterRest/, 'SSAdapterRESTFileDownload')
            },
            'view/LoginFormView' : {
                'oidcAuthorizationUrl' : oidcAuthorizationUrl,
                'oidcClientID' : oidcClientID
            },
            'view/AppView' : {
                'affectUrl' : affectUrl,
                'appVersion' : appVersion,
                'helpUrl' : helpUrl
            }
        },
        baseUrl: 'js',
        paths: {
            'vie' : '../lib/VIE/vie',
            'backbone' : '../lib/backbone/backbone-min',
            'underscore' : '../lib/underscore/underscore-min',
            'jquery' : '../lib/jquery/js/jquery-1.9.1',
            'jquery-ui' : '../lib/jquery/js/jquery-ui-1.10.3.custom.min',
            'jquery-cookie' : '../lib/jquery-cookie/jquery.cookie',
            'logger' : '../lib/logger',
            'chap-timeline' : '../lib/chap-links-library/timeline',
            'svg' : '../lib/svgjs/svg',
            'svg.draggable' : '../lib/svgjs/svg.draggable',
            'svg.foreignobject' : '../lib/svgjs/svg.foreignobject',
            'organize' : '../lib/organize/organize',
            'text' : '../lib/text',
            'bootstrap' : '../lib/bootstrap/js/bootstrap',
            'spin' : '../lib/spinjs/spin.min'
        },
        shim: {
            'logger' : { 
                'exports' : 'Logger'
            },
            'vie' : {
                'deps' : ['backbone', 'jquery', 'underscore'],
                'exports' : 'VIE'
            },
            'backbone' : {
                'deps': ['underscore', 'jquery'],
                'exports' : 'Backbone'
            },
            'underscore' : {
                'exports' : '_'
            },
            'organize' : {
                'deps' : ['svg', 'svg.draggable', 'svg.foreignobject', 'jquery'],
                'exports' : 'Organize'
            },
            'chap-timeline' : {
                'exports': 'links.Timeline'     
            },
            'svg.draggable' : ['svg'],
            'svg.foreignobject' : ['svg'],
            'jquery-cookie' : {
                'deps' : ['jquery']
            },
            'jquery-ui' : {
                'deps' : ['jquery']
            },
            'bootstrap' : {
                'deps' : ['jquery']
            },
            'spin' : {
                'exports' : 'Spinner'
            }
        },
        urlArgs: "bust=" + (new Date()).getTime()
    };
}());


