define(['module', 'jquery', 'userParams', 'logger'],
    function(module, $, userParams, Logger) {
        tracker = Logger.get('Tracker');
        tracker.setLevel(Logger.INFO);
        tracker.setHandler(function(messages, context){
            var typeParam = messages[0],
                toolContextParam = messages[1],
                entityParam = messages[2] ? messages[2] : null,
                contentParam = messages[3] ? messages[3] : null,
                entitiesParam = messages[4] ? messages[4] : [],
                usersParam = messages[5] ? messages[5] : [],
                op = "evalLog"
                params = {
                    'user' : userParams.user,
                    'key' : userParams.userKey,
                    'type' : typeParam,
                    'toolContext' : toolContextParam,
                    'forUser' : userParams.user,
                    'entity' : entityParam,
                    'content' : contentParam,
                    'entities' : entitiesParam,
                    'users' : usersParam
                };
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

        tracker.TIMELINEAREA = 'timelineArea';
        tracker.CLICKJUMPTODATEBUTTON = 'clickJumpToDateButton';
        tracker.CLICKBIT = 'clickBit';
        tracker.SEARCHTAB = 'searchTab';
        tracker.CLICKTAG = 'clickTag';
        tracker.SEARCHWITHKEYWORD = 'searchWithKeyword';

        return tracker;
});
