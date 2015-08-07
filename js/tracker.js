define(['config/config', 'jquery', 'logger'],
    function(appConfig, $, Logger) {
        tracker = Logger.get('Tracker');
        tracker.setLevel(Logger.INFO);
        tracker.setHandler(function(messages, context){
            var typeParam = messages[0],
                toolContextParam = messages[1],
                entityParam = messages[2] ? messages[2] : null,
                contentParam = messages[3] ? messages[3] : null,
                entitiesParam = messages[4] ? messages[4] : [],
                usersParam = messages[5] ? messages[5] : [],
                params = {
                    'type' : typeParam,
                    'toolContext' : toolContextParam,
                    'entity' : entityParam,
                    'content' : contentParam,
                    'entities' : entitiesParam,
                    'users' : usersParam
                };
            $.ajax({
                'url' : appConfig.sssHostRESTV2 + 'eval/eval/log/',
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

        tracker.ORGANIZEAREA = 'organizeArea';
        tracker.REMOVELEARNEPVERSIONCIRCLE = 'removeLearnEpVersionCircle';
        tracker.REMOVELEARNEPVERSIONENTITY = 'removeLearnEpVersionEntity';
        tracker.ADDENTITYTOLEARNEPVERSION = 'addEntityToLearnEpVersion';
        tracker.ADDCIRCLETOLEARNEPVERSION = 'addCircleToLearnEpVersion';
        tracker.CLICKLABELRECOMMENDATION = 'clickLabelRecommendation';
        tracker.REQUESTEDITBUTTON = 'requestEditButton';
        tracker.RELEASEEDITBUTTON = 'releaseEditButton';
        tracker.TIMELINEAREA = 'timelineArea';
        tracker.CLICKJUMPTODATEBUTTON = 'clickJumpToDateButton';
        tracker.EXECUTEJUMPTODATEBUTTON = 'executeJumpToDateButton';
        tracker.CLICKBIT = 'clickBit';
        tracker.SEARCHTAB = 'searchTab';
        tracker.CLICKTAG = 'clickTag';
        tracker.BITTAB = 'bitTab';
        tracker.CHANGELABEL = 'changeLabel';
        tracker.CHANGEDESCRIPTION = 'changeDescription';
        tracker.SETIMPORTANCE = 'setImportance';
        tracker.ADDTAG = 'addTag';
        tracker.REMOVETAG = 'removeTag';
        tracker.CLICKTAGRECOMMENDATION = 'clickTagRecommendation';
        tracker.CLICKHELPBUTTON = 'clickHelpButton';
        tracker.CLICKAFFECTBUTTON = 'clickAffectButton';
        tracker.NOTIFICATIONTAB = 'notificationTab';
        tracker.SENDMESSAGE = 'sendMessage';
        tracker.READMESSAGE = 'readMessage';
        tracker.SETFILTER = 'setFilter';
        tracker.REMOVEFILTER = 'removeFilter';
        tracker.EPISODETAB = 'episodeTab';
        tracker.SHARELEARNEPWITHUSER = 'shareLearnEpWithUser';
        tracker.COPYLEARNEPFORUSER = 'copyLearnEpForUser';
        tracker.SEARCHWITHKEYWORD = 'searchWithKeyword';

        return tracker;
});
