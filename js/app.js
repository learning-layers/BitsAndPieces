define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'model/episode/UserModel',
        'view/AppView'],
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        UserModel, AppView){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('UserModel').setLevel(Logger.OFF);
    Logger.get('OrganizeModel').setLevel(Logger.OFF);
    Logger.get('VersionModel').setLevel(Logger.OFF);
    Logger.get('EpisodeModel').setLevel(Logger.OFF);
    Logger.get('TimelineModel').setLevel(Logger.OFF);
    Logger.get('TimelineView').setLevel(Logger.OFF);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('DetailView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.OFF);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.OFF);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.OFF);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.OFF);
    Logger.get('Mockup').setLevel(Logger.OFF);

    var v = new VIE();

    var timelineView;
    var organizeView;

    var username = window.location.search.substring(1);
    if( !username) return alert('no username given!');

    var namespace = "http://eval.bp/" ;
    userParams.init(username, namespace);

    var sss = new SocialSemanticService(_.extend({
        'namespaces': {
            'sss': namespace
        }
    }, userParams));
    v.namespaces.base(namespace);
    v.use(sss, 'sss');

    extender.syncByVIE(v);
    extender.autoResolveReferences(v);

    var user = new UserModel({
        '@subject':userParams.user,
    });

    v.entities.addOrUpdate(user);


    var AppView = new AppView({
        'model' : user,
        'el' : 'body',
        'vie' :  v
    })

    $(document).ready(function(){
        AppView.render();
        user.fetch({'success' : function(model, response, options) {
            model.fetchEpisodes(); //model === user
        }});
    });

});
