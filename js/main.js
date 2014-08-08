var require = (function() {
    //var sss_url = 'http://kedemo.know-center.tugraz.at:8080/SocialSemanticServerClientSide_Rella/';
    //var sss_url = 'http://localhost/sm/lib/SocialSemanticServer/SSSClientSide/';
    var sss_url = 'http://localhost:8080/SocialSemanticServerClientSide/';
    return {
        baseUrl: 'js',
        paths: {
            'sss.jsutils' : sss_url + "JSUtilities/JSGlobals",
            'sss.globals' : sss_url + "SSSClientInterfaceGlobals/globals/SSGlobals",
            'sss.varu' : sss_url + "SSSClientInterfaceGlobals/globals/SSVarU",
            'sss.conns' : sss_url + "SSSClientInterfaceREST/SSConns",
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
            'bootstrap': '../lib/bootstrap/js/bootstrap'
        },
        shim: {
            'logger' : { 
                'exports' : 'Logger'
            },
            'sss.conns' : [ 'sss.jsutils', 'sss.globals', 'sss.varu', 'logger'],
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
            }
        },
        urlArgs: "bust=" + (new Date()).getTime()
    };
}());


