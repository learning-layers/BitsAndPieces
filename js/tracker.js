define(['module', 'jquery', 'userParams', 'logger'],
    function(module, $, userParams, Logger) {
        tracker = Logger.get('Tracker');
        tracker.setLevel(Logger.INFO);
        tracker.setHandler(function(messages, context){
            // Sending events is disabled
            return;

            var op = "uEAdd";
            var params = {
                    'user' : userParams.user,
                    'key' : userParams.userKey,
                    'type' : messages[0],
                    'content' : (new Date()).getTime()+(messages[2] ? ";"+JSON.stringify(messages[2]): "")
                };
            if( messages[1] ) {
                params['entity'] = messages[1];
            }
            $.ajax({
                'url' : module.config().sssHostREST + op + "/",
                'type': "POST",
                'data' : JSON.stringify(params),
                'contentType' : "application/json",
                'async' : true,
                'dataType': "application/json",
                'complete' : function(jqXHR, textStatus) {

                    if( jqXHR.readyState !== 4 || jqXHR.status !== 200){
                        AppLog.error("sss json request failed");
                        return;
                    }

                    var result = $.parseJSON(jqXHR.responseText); 

                    if( result.error ) {
                        if( error ) AppLog.error('USEREVENT NOT ADDED', result);
                        return;
                    }
                    AppLog.info('USEREVENT ADDED', result);
                }
            });
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
