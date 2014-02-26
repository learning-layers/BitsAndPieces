define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'model/AppModel',
        'view/AppView', 'voc'],
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        AppModel, AppView, Voc){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('Model').setLevel(Logger.DEBUG);
    Logger.get('UserModel').setLevel(Logger.DEBUG);
    Logger.get('OrganizeModel').setLevel(Logger.DEBUG);
    Logger.get('VersionModel').setLevel(Logger.DEBUG);
    Logger.get('EpisodeModel').setLevel(Logger.DEBUG);
    Logger.get('TimelineModel').setLevel(Logger.DEBUG);
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
    Logger.get('AppModel').setLevel(Logger.DEBUG);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.OFF);
    Logger.get('Mockup').setLevel(Logger.OFF);

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
    v.namespaces.base(namespace);
    v.use(sss, 'sss');

    extender.syncByVIE(v);
    //extender.autoResolveReferences(v);

    AppModel.init(v);

    $(document).ready(function(){
        var user = new v.Entity;
        user.set(user.idAttribute, userParams.user);
        user.set('@type', Voc.USER);
        user.fetch();
        v.entities.addOrUpdate(user);

        var view = new AppView({
            'model' : user,
            'el' : 'body',
            'vie' :  v
        });

        view.render();

        // LOAD APPLICATION DATA
        // user data
        // episode data 
        v.load({
            'user': user.getSubject(),
            'type' : Voc.EPISODE
        }).from('sss').execute().success(
            function(episodes) {
                AppLog.debug("success fetchEpisodes");
                AppLog.debug("episodes", episodes);
                /* If no episodes exist create a new one */
                if( episodes.length === 0 ) {
                    var ep = EpisodeModel.newEpisode(user); 
                    AppLog.debug("episode created", ep);
                } else {
                    v.entities.addOrUpdate(episodes);
                }
            }
        );
        // more data is fetched by EpisodeModel
    });

    return null;

});
