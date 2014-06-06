define([], {
    user : "",
    ueTrackUser : "",
    userKey : "FischersFritzFischtFrischeFische",
    init: function(username, space, app) {
            var namespace = "http://"+space+"."+app+"/";
            //this.user = namespace + 'user/'+username;
            // XXX THIS IS HARD CODED; SHOULD BE TAKEN FROM AUTH API CALL
            this.user = 'http://eval.bp/140203616126664800010';
            this.ueTrackUser = namespace + 'user/ue_track_'+username;
        }
});
