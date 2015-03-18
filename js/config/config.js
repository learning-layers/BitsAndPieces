define(['module', 'text!config/config.json'],
function(module, config){

    var appConfig = JSON.parse(config);
    console.log('appConfig', appConfig);
    return {
        'appVersion' : module.config().appVersion,
        'sssHostREST' : appConfig.sssHostREST,
        'sssHostRESTFileDownload' : appConfig.sssHostREST.replace(/SSAdapterRest/, 'SSAdapterRESTFileDownload'),
        'oidcAuthorizationUrl' : appConfig.oidcAuthorizationUrl,
        'oidcClientID' : appConfig.oidcClientID,
        'affectUrl' : appConfig.affectUrl,
        'helpUrl' : appConfig.helpUrl
    };
});

