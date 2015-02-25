define(['logger', 'underscore', 'jquery', 'backbone',
        'text!templates/modal/bit_thumbnail_modal.tpl'], function(Logger, _, $, Backbone, BitThumbnailModalTemplate){
    return Backbone.View.extend({
        events: {
        },
        LOG: Logger.get('BitThumbnailModalView'),
        initialize: function() {
            this.bitThumbnailModalSelector = '#bitThumbnailModal';
        },
        render: function() {
            var that = this;

            this.$el.html(_.template(BitThumbnailModalTemplate));
            $(document).find('body').prepend(this.$el);
            
            return this;
        },
        showModal: function() {
            this.$el.find(this.bitThumbnailModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.bitThumbnailModalSelector).modal('hide');
        },
        addThumbnail: function(imgData) {
            this.$el.find('.modal-body').append('<img class="thumbnail bitModalThumbnail" src="' + imgData + '" alt="thumbnail" />');
        },
        removeThumbnails: function() {
            this.$el.find('img.thumbnail').remove();
        }
    });
});
