requirejs.config((function() {
    //var sss_url = 'http://kedemo.know-center.tugraz.at:8080/SSSClientSide/';
    var sss_url = 'http://127.0.0.1/sm-improved/lib/SocialSemanticServer/SSSClientSide/';
    return {
        paths: {
            'sss.jsutils' : sss_url + "JSUtilities/JSGlobals",
            'sss.globals' : sss_url + "SSSClientInterfaceGlobals/globals/SSGlobals",
            'sss.varu' : sss_url + "SSSClientInterfaceGlobals/globals/SSVarU",
            //'sss.conn.entity' : sss_url + "SSSClientInterfaceREST/connectors/SSEntityConns",
            //'sss.conn.userevent' : sss_url + "SSSClientInterfaceREST/connectors/SSUserEventConns",
            //'sss.conn.learnep' : sss_url + "SSSClientInterfaceREST/connectors/SSLearnEpConns",
            'sss.conn.entity' : 'mockup/SSResourceConns', 
            'sss.conn.userevent' : 'mockup/SSUserEventConns', 
            'sss.conn.learnep' : 'mockup/SSLearnEpConns', 
            'vie' : '../lib/VIE/dist/vie',
            'backbone' : '../lib/VIE/lib/backbone/backbone',
            'underscore' : '../lib/VIE/lib/underscore/underscore-min',
            'jquery' : '../lib/VIE/lib/jquery/jquery.min',
            'jquery-ui' : '../lib/jquery-ui-1.10.3.custom/js/jquery-ui-1.10.3.custom.min',
            'logger' : '../lib/logger',
            'chap-timeline' : '../lib/chap-links-library/js/src/timeline/timeline',
            'svg' : '../lib/svgjs/svg',
            'svg.draggable' : '../lib/svgjs/svg.draggable',
            'svg.foreignobject' : '../lib/svgjs/svg.foreignobject',
            'organize' : '../lib/organize/organize'
        },
        shim: {
            'logger' : { 
                'exports' : 'Logger'
            },
            'sss.conn.userevent' : [ 'sss.jsutils', 'sss.globals', 'sss.varu', 'logger'],
            'sss.conn.entity' : [ 'sss.jsutils', 'sss.globals', 'sss.varu', 'logger'],
            'sss.conn.learnep' : [ 'sss.jsutils', 'sss.globals', 'sss.varu', 'logger'],
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
            'svg.foreignobject' : ['svg']
        }
    };
}()));

requirejs(["app"]);

