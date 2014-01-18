define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'model/episode/UserModel','model/episode/EpisodeModel',
        'view/AppView', 'voc'],
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        UserModel, EpisodeModel, AppView, Voc){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('UserModel').setLevel(Logger.OFF);
    Logger.get('OrganizeModel').setLevel(Logger.OFF);
    Logger.get('VersionModel').setLevel(Logger.OFF);
    Logger.get('EpisodeModel').setLevel(Logger.DEBUG);
    Logger.get('TimelineModel').setLevel(Logger.OFF);
    Logger.get('TimelineView').setLevel(Logger.OFF);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('DetailView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.DEBUG);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.OFF);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.DEBUG);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.OFF);
    Logger.get('Mockup').setLevel(Logger.OFF);

    var username = window.location.search.substring(1);
    if( !username) return alert('no username given!');

    var v = new VIE();

    var timelineView;
    var organizeView;

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

    EpisodeModel.init(v);
    var user = new v.Entity({
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
            // load Episodes of User
            v.load({
                'user': model.getSubject(),
                'type' : Voc.EPISODE
            }).from('sss').execute().success(
                function(episodes) {
                    Logger.debug("success fetchEpisodes");
                    Logger.debug("episodes", episodes);
                    /* If no episodes exist create a new one */
                    if( episodes.length === 0 ) {
                        var ep = EpisodeModel.newEpisode(model);
                        Logger.debug("episode created", ep);
                    } else {
                        v.entities.addOrUpdate(episodes);
                    }
                }
            );
        }});
    });

});
