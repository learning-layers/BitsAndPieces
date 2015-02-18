define(['tracker', 'underscore', 'backbone', 'logger', 'jquery', 'voc',
        'utils/DateHelpers',
        'data/sss/MessageData',
        'text!templates/sss/message.tpl',
        'view/sss/EntityView'], function(tracker, _, Backbone, Logger, $, Voc, DateHelpers, MessageData, MessageTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('MessageView'),
        events: {
            'click' : 'messageClicked'
        },
        initialize: function(options) {
            this.listenTo(this.model, 'change', this.render);
            this.owner = this.model.get(Voc.belongsToUser);
            this.listenTo(this.owner, 'change:'+this.model.vie.namespaces.uri(Voc.label), this.render);
        },
        render: function() {
            var that = this;
            this.$el.attr({
              'class' : 'message singleEntry singleMessage',
              'about' : this.model.getSubject()
            });

            if ( !this.model.get(Voc.isRead) ) {
                this.$el.addClass('unreadMessage');
            }

            this.$el.html(_.template(MessageTemplate, {
                date : DateHelpers.formatTimestampDateDMYHM(this.model.get(Voc.creationTime)),
                author : this.getOwnerName(),
                message : this.model.get(Voc.content)
            }));

            if ( !this.model.get(Voc.isRead) ) {
                this.$el.addClass('unreadMessage');
                this.$el.find('.messageIcon span').on('click', function(e) {
                    var promise = MessageData.markAsRead(that.model);

                    promise.done(function() {
                        var ev = $.Event('bnp:markMessageAsRead', {
                            entity: that.model
                        });
                        that.$el.trigger(ev);
                        // View updates automatically when model attribute value changes
                    });

                    tracker.info(tracker.READMESSAGE, tracker.NOTIFICATIONTAB, that.model.getSubject(), that.model.get(Voc.content));
                });
            } else {
                this.$el.find('.messageIcon .glyphicon').addClass('streamActionOthers');
            }

            return this;
        },
        getOwnerName: function() {
            if ( this.owner && this.owner.isEntity ) {
                return this.owner.get(Voc.label);
            }
            return this.owner;
        },
        messageClicked: function(e) {
            tracker.info(tracker.CLICKBIT, tracker.NOTIFICATIONTAB, this.model.getSubject());
        }
    });
});
