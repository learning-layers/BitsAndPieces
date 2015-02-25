define(['view/sss/EntityView', 'logger', 'tracker', 'underscore', 'jquery', 'voc',
        'utils/DateHelpers',
        'text!templates/sss/entity_recommendation.tpl'], function(EntityView, Logger, tracker, _, $, Voc, DateHelpers, EntityRecommendationTemplate){
    return EntityView.extend({
        LOG: Logger.get('EntityRecommendationView'),
        render: function() {
            this.toolContext = tracker.NOTIFICATIONTAB;
            var label,
                iconClass = '',
                type = this.getRecommendationEntityType();

            this.$el.attr({
              'class' : 'recommendation singleEntry singleRecommendation',
              'about' : this.model.getSubject()
            });
            
            label = this.model.get(Voc.label) || "";

            if( true === this.model.get(Voc.isUsed) ) {
                iconClass = 'used';
            }
            if( label && label.isEntity ) label = label.getSubject();

            this.$el.html(_.template(EntityRecommendationTemplate, {
                icon : this.getIcon(),
                iconClass : iconClass,
                date: DateHelpers.formatTimestampDateDMYHM(this.model.get(Voc.creationTime)),
                content : 'The ' + type + ' <strong>' + label + '</strong> is recommended for you',
                label : label
            }));

            this.draggable();
            return this;
        },
        getRecommendationEntityType: function() {
            var type = 'bit';
            if ( this.model.isof(Voc.FILE) ) {
                type = 'file';
            } else if ( this.model.isof(Voc.EVERNOTE_RESOURCE) ) {
                type = 'evernote resource';
            } else if ( this.model.isof(Voc.EVERNOTE_NOTE) ) {
                type = 'evernote note';
            } else if ( this.model.isof(Voc.EVERNOTE_NOTEBOOK) ) {
                type = 'evernote notebook';
            }

            return type;
        }
    });
});
