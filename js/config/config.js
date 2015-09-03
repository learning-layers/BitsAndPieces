define(['module', 'text!config/config.json'],
function(module, config){
    var appConfig = JSON.parse(config);

    return {
        'appVersion' : module.config().appVersion,
        'sssHostREST' : appConfig.sssHostREST,
        'sssHostRESTFileDownload' : appConfig.sssHostREST + 'files/files/download/',
        'oidcAuthorizationUrl' : appConfig.oidcAuthorizationUrl,
        'oidcClientID' : appConfig.oidcClientID,
        'affectUrl' : appConfig.affectUrl,
        'helpUrl' : appConfig.helpUrl,
        'discussionToolUrl': appConfig.discussionToolUrl,
        'localSearchOp' : appConfig.search.localSearchOp || 'and',
        'globalSearchOp' : appConfig.search.globalSearchOp || 'and'
    };
});

