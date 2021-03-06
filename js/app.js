define(['config/config', 'vie', 'logger', 'userParams', 'data/episode/UserData', 'service/SocialSemanticService', 'extender', 
        'data/AppData', 'underscore',
        'view/AppView', 'view/LoginFormView', 'voc',
        'text!../schemata/ss.sss.json',
        'jquery-cookie', 'bootstrap'],
function(appConfig, VIE, Logger, userParams, UserData, SocialSemanticService, extender,
        AppData, _, AppView, LoginFormView, Voc, schema){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('Data').setLevel(Logger.OFF);
    Logger.get('UserData').setLevel(Logger.OFF);
    Logger.get('OrganizeData').setLevel(Logger.OFF);
    Logger.get('CircleData').setLevel(Logger.OFF);
    Logger.get('VersionData').setLevel(Logger.OFF);
    Logger.get('EpisodeData').setLevel(Logger.OFF);
    Logger.get('TimelineData').setLevel(Logger.OFF);
    Logger.get('UserEventData').setLevel(Logger.OFF);
    Logger.get('TimelineView').setLevel(Logger.OFF);
    Logger.get('OrganizeView').setLevel(Logger.OFF);
    Logger.get('WidgetView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.OFF);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.OFF);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('ActivityView').setLevel(Logger.OFF);
    Logger.get('EntityRecommendationView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.OFF);
    Logger.get('AppData').setLevel(Logger.OFF);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.OFF);
    Logger.get('SSSModel').setLevel(Logger.OFF);
    Logger.get('Mockup').setLevel(Logger.OFF);
    Logger.get('ToolbarView').setLevel(Logger.OFF);
    Logger.get('ActivityStreamToolbarView').setLevel(Logger.OFF);
    Logger.get('SearchToolbarView').setLevel(Logger.OFF);
    Logger.get('BitToolbarView').setLevel(Logger.OFF);
    Logger.get('EntityData').setLevel(Logger.OFF);
    Logger.get('OrgaEntityData').setLevel(Logger.OFF);
    Logger.get('UserAuth').setLevel(Logger.OFF);
    Logger.get('EpisodeToolbarView').setLevel(Logger.OFF);
    Logger.get('EntitiesHelper').setLevel(Logger.OFF);
    Logger.get('SearchHelper').setLevel(Logger.OFF);
    Logger.get('CategoryData').setLevel(Logger.OFF);
    Logger.get('SystemMessages').setLevel(Logger.OFF);
    Logger.get('LocalMessages').setLevel(Logger.OFF);
    Logger.get('InputValidation').setLevel(Logger.OFF);
    Logger.get('ActivityData').setLevel(Logger.OFF);
    Logger.get('CircleRenameModalView').setLevel(Logger.OFF);
    Logger.get('EntityHelpers').setLevel(Logger.OFF);
    Logger.get('OrganizeLockBarView').setLevel(Logger.OFF);
    Logger.get('BitThumbnailModalView').setLevel(Logger.OFF);
    Logger.get('EpisodeAddModalView').setLevel(Logger.OFF);
    Logger.get('BitAddModalView').setLevel(Logger.OFF);

    // Add app version
    var appVersion = appConfig.appVersion || '',
        documentHeadElement = $(document).find('head'),
        documentTitleElement = documentHeadElement.find('title');

    $('<meta name="version" content="' + appVersion + '">')
        .insertAfter(documentHeadElement.find('title'));
    documentTitleElement.html(documentTitleElement.html() + ' (' + appVersion + ')');

    // Show login form if not ahthenticated
    if ( !userParams.isAuthenticated) {
        var loginView = new LoginFormView({
            'el' : 'body .container-fluid'
        });
        loginView.render();
        return null;
    }

    var v = new VIE();

    AppLog.debug('vie', v);

    var namespace = "http://eval.bp/" ;

    var sss = new SocialSemanticService(_.extend({
        'namespaces': {
            'sss': namespace
        },
        'hostREST' : appConfig.sssHostREST,
        'hostRESTPrefix' : appConfig.sssHostRESTPrefix
    }, userParams));
    v.use(sss, 'sss');
    //v.namespaces.base(namespace);
    // Configure attributes that should not be considered linked
    // even in case the value is a URL that exists in collection
    v.addAsIsAttribute(Voc.label);
    v.addAsIsAttribute(Voc.description);

    extender.syncByVIE(v);
    extender.addOnUrisReady(v);
    //extender.autoResolveReferences(v);

    AppData.init(v);

    VIE.Util.loadSchemaOrg(v, JSON.parse(schema));
    $(document).ready(function(){
        var user = new v.Entity;
        user.set(user.idAttribute, userParams.user);
        user.set('@type', Voc.USER);
        v.entities.addOrUpdate(user);
        user.fetch();

        var view = new AppView({
            'model' : user,
            'el' : 'body .container-fluid',
            'vie' :  v
        });

        view.render();

    });



    return null;

});
