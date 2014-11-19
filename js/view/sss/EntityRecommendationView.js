define(['view/sss/EntityView', 'logger', 'underscore', 'jquery', 'voc',
        'text!templates/sss/entity_recommendation.tpl'], function(EntityView, Logger, _, $, Voc, EntityRecommendationTemplate){
    return EntityView.extend({
        LOG: Logger.get('EntityRecommendationView'),
        render: function() {
            var label,
                iconClass = '',
                type = 'bit';

            this.$el.attr({
              'class' : 'recommendation singleEntry singleRecommendation',
              'about' : this.model.getSubject()
            });
            
            label = this.model.get(Voc.label) || "";

            if( true === this.model.get(Voc.isUsed) ) {
                iconClass = 'used';
            }
            if( label && label.isEntity ) label = label.getSubject();

            if ( this.model.isof(Voc.FILE) ) {
                type = 'file';
            }

            this.$el.html(_.template(EntityRecommendationTemplate, {
                icon : this.getIcon(),
                iconClass : iconClass,
                date : $.datepicker.formatDate('dd.mm.yy', new Date(this.model.get(Voc.creationTime))),
                content : 'The bit <strong>' + this.model.get(Voc.label) + '</strong> is recommended for you'
            }));

            this.draggable();
            return this;
        }
    });
});
