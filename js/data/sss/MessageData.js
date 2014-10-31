define(['logger', 'voc', 'underscore', 'jquery'], function(Logger, Voc, _, $){
    return {
        init : function(vie) {
            this.LOG.debug("initialize MessageData");
            this.vie = vie;
        },
        LOG : Logger.get('MessageData'),
        sendMessage : function(forUser, message) {
            var that = this,
                defer = $.Deferred();
            this.LOG.debug('sendMessage', forUser, message);
            this.vie.onUrisReady(
                function() {
                    that.vie.save({
                        'service' : 'messageSend',
                        'data' : {
                            'forUser' : forUser,
                            'message' : message
                        }
                    }).to('sss').execute().success(function(s){
                        that.LOG.debug('success messageSent', s);
                        defer.resolve(true);
                    }).fail(function(f){
                        that.LOG.debug('error messageSent', f);
                        defer.reject(false);
                    });
                }
            );
            return defer.promise();
        },
        getMessages : function(includeRead) {
            var that = this,
                defer = $.Deferred();
            this.vie.load({
                'service' : 'messagesGet',
                'data' : {
                    'includeRead' : includeRead
                }
            }).using('sss').execute().success(function(messages) {
                that.LOG.debug('success messagesGet', messages);
                defer.resolve(messages);
            }).fail(function(f) {
                that.LOG.debug('error messagesGet', f);
                defer.reject(f);
            });

            return defer.promise();
        }
    }
});
