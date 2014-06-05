define([], {
    user : "",
    ueTrackUser : "",
    userKey : "FischersFritzFischtFrischeFische",
    init: function(username, space, app) {
            var namespace = "http://"+space+"."+app+"/";
            //this.user = namespace + 'user/'+username;
            // XXX THIS IS HARD CODED; SHOULD BE TAKEN FROM AUTH API CALL
            this.user = 'http://eval.bp/140187632648701900010/';
            //this.user = 'http://eval.bp/1401967344571539000790/';
            this.ueTrackUser = namespace + 'user/ue_track_'+username;
        }
});
