define(['userParams', 'logger', 'sss.conns'],
    function(userParams, Logger) {
        tracker = Logger.get('Tracker');
        tracker.setLevel(Logger.INFO);
        tracker.setHandler(function(messages, context){
            new SSUserEventAdd(
                    function(object){
                        AppLog.info('USEREVENT ADDED', object);
                    },
                    function(object){
                        AppLog.error('USEREVENT NOT ADDED', object);
                    },
                    userParams.user,
                    userParams.userKey,
                    messages[0],
                    messages[1] || null,
                    (new Date()).getTime()+(messages[2] ? ";"+JSON.stringify(messages[2]): "")
            );
        });
         



        tracker.OPENEPISODESDIALOG = "learnEpOpenEpisodesDialog";
        tracker.SWITCHEPISODE = "learnEpSwitchEpisode";
        tracker.SWITCHVERSION = "learnEpSwitchVersion";
        tracker.RENAMEEPISODE = "learnEpRenameEpisode";
        tracker.CREATENEWEPISODEFROMSCRATCH = "learnEpCreateNewEpisodeFromScratch";
        tracker.CREATENEWEPISODEFROMVERSION = "learnEpCreateNewEpisodeFromVersion";
        tracker.CREATENEWVERSION = "learnEpCreateNewVersion";
        tracker.CHANGETIMELINERANGE = "timelineChangeTimelineRange";
        tracker.VIEWDETAILS = "learnEpViewEntityDetails";
        tracker.OPENRESOURCE = "viewEntity";
        tracker.DROPORGANIZEENTITY = "learnEpDropOrganizeEntity";
        tracker.MOVEORGANIZEENTITY = "learnEpMoveOrganizeEntity";
        tracker.DELETEORGANIZEENTITY = "learnEpDeleteOrganizeEntity";
        tracker.CREATEORGANIZECIRCLE = "learnEpCreateOrganizeCircle";
        tracker.CHANGEORGANIZECIRCLE = "learnEpChangeOrganizeCircle";
        tracker.RENAMEORGANIZECIRCLE = "learnEpRenameOrganizeCircle";
        tracker.DELETEORGANIZECIRCLE = "learnEpDeleteOrganizeCircle";
        tracker.NULL = 'http://dummy.dm/';

        return tracker;
});
