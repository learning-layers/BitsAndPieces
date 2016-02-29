define(['module', 'text!config/config.json'],
function(module, config){
    var appConfig = JSON.parse(config);

    var buildHelpUrl = function() {
        var currentUrl = window.location.href;
        if ( currentUrl.substr(-1) !== '/' ) currentUrl += '/';
        return currentUrl + 'help';
    };

    var sssHostRESTPrefix = 'rest';

    return {
        'appVersion' : module.config().appVersion,
        'sssHostREST' : appConfig.sssHostREST,
        'sssHostRESTFileDownload' : appConfig.sssHostREST + sssHostRESTPrefix +'/files/download/',
        'sssHostRESTPrefix' : sssHostRESTPrefix,
        'oidcAuthorizationUrl' : appConfig.oidcAuthorizationUrl,
        'oidcClientID' : appConfig.oidcClientID,
        'affectUrl' : appConfig.affectUrl,
        'helpUrl' : appConfig.helpUrl ? appConfig.helpUrl : buildHelpUrl(),
        'discussionToolUrl': appConfig.discussionToolUrl,
        'localSearchOp' : appConfig.search.localSearchOp || 'and',
        'globalSearchOp' : appConfig.search.globalSearchOp || 'and',
        'acceptableEntityTypes': ['entity', 'uploadedFile', 'evernoteResource', 'evernoteNote', 'evernoteNotebook', 'placeholder'],
        'toolbarDescriptionRows' : appConfig.toolbar.description.rows || 2
    };
});

