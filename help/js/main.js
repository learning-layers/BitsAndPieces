var require = (function() {
    return {
        baseUrl: 'js',
        paths: {
            'backbone' : '../../lib/backbone/backbone-min',
            'underscore' : '../../lib/underscore/underscore-min',
            'jquery' : '../../lib/jquery/js/jquery-1.9.1',
            'text' : '../../lib/text',
            'bootstrap' : '../../lib/bootstrap/js/bootstrap',
            'colorbox' : '../colorbox/jquery.colorbox-min',
            'help' : '../js/app'
        },
        shim: {
            'backbone' : {
                'deps': ['underscore', 'jquery'],
                'exports' : 'Backbone'
            },
            'underscore' : {
                'exports' : '_'
            },
            'bootstrap' : {
                'deps' : ['jquery']
            },
            'colorbox' : {
                'deps' : ['jquery']
            }
        },
        urlArgs: "bust=" + (new Date()).getTime()
    };
}());


