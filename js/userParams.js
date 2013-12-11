define([], {
    user : "",
    ueTrackUser : "",
    userKey : "681V454J1P3H4W3B367BB79615U184N22356I3E",
    init: function(username, namespace) {
            this.user = namespace + 'user/'+username+'/';
            this.ueTrackUser = namespace + 'user/ue_track_'+username+'/';
        }
});
