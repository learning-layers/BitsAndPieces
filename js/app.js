define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'model/episode/UserModel','model/episode/EpisodeModel',
        'model/episode/VersionModel','model/timeline/TimelineModel',
        'model/organize/OrganizeModel',
        'view/AppView', 'voc'],
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        UserModel, EpisodeModel, VersionModel, TimelineModel, OrganizeModel, 
        AppView, Voc){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('UserModel').setLevel(Logger.OFF);
    Logger.get('OrganizeModel').setLevel(Logger.OFF);
    Logger.get('VersionModel').setLevel(Logger.DEBUG);
    Logger.get('EpisodeModel').setLevel(Logger.DEBUG);
    Logger.get('TimelineModel').setLevel(Logger.DEBUG);
    Logger.get('TimelineView').setLevel(Logger.DEBUG);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('DetailView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.DEBUG);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.DEBUG);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.DEBUG);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.DEBUG);
    Logger.get('Mockup').setLevel(Logger.DEBUG);

    var username = window.location.search.substring(1);
    if( !username) return alert('no username given!');

    var v = new VIE();

    AppLog.debug('vie', v);

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
    //extender.autoResolveReferences(v);

    UserModel.init(v);
    EpisodeModel.init(v);
    VersionModel.init(v);
    TimelineModel.init(v);
    OrganizeModel.init(v);

    var user = new v.Entity;
    user.set(user.idAttribute, userParams.user);

    var view = new AppView({
        'model' : user,
        'el' : 'body',
        'vie' :  v
    });

    $(document).ready(function(){
        view.render();
        user.fetch({'success': function(){
            v.entities.addOrUpdate(user);
        }});
    });

    return null;

});
