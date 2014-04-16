define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'data/AppData',
        'view/AppView', 'voc'],
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        AppData, AppView, Voc){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('Data').setLevel(Logger.DEBUG);
    Logger.get('UserData').setLevel(Logger.DEBUG);
    Logger.get('OrganizeData').setLevel(Logger.DEBUG);
    Logger.get('VersionData').setLevel(Logger.DEBUG);
    Logger.get('EpisodeData').setLevel(Logger.DEBUG);
    Logger.get('TimelineData').setLevel(Logger.DEBUG);
    Logger.get('UserEventData').setLevel(Logger.DEBUG);
    Logger.get('TimelineView').setLevel(Logger.DEBUG);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('WidgetView').setLevel(Logger.DEBUG);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('DetailView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.DEBUG);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.OFF);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.DEBUG);
    Logger.get('AppData').setLevel(Logger.DEBUG);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.DEBUG);
    Logger.get('Mockup').setLevel(Logger.DEBUG);

    var username = window.location.search.substring(1);
    if( !username) return alert('no username given!');

    var v = new VIE();

    AppLog.debug('vie', v);

    var namespace = "http://eval.bp/" ;
    userParams.init(username, namespace);

    var sss = new SocialSemanticService(_.extend({
        'namespaces': {
            'sss': namespace
        }
    }, userParams));
    v.use(sss, 'sss');
    //v.namespaces.base(namespace);

    extender.syncByVIE(v);
    //extender.autoResolveReferences(v);

    AppData.init(v);

    $.getJSON("schemata/ss.sss.json", {}, function(data) {
        VIE.Util.loadSchemaOrg(v, data);
        $(document).ready(function(){
            var user = new v.Entity;
            user.set(user.idAttribute, userParams.user);
            user.set('@type', Voc.USER);
            v.entities.addOrUpdate(user);
            user.fetch();

            var view = new AppView({
                'model' : user,
                'el' : 'body',
                'vie' :  v
            });

            view.render();

        });
    });



    return null;

});
