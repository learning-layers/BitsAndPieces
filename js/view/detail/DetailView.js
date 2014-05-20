define(['require', 'vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 
        'view/sss/EntityView', 'jquery-ui' ], 
function(require, VIE, Logger, tracker, _, $, Backbone, EntityView){
    return Backbone.View.extend({
        LOG: Logger.get('DetailView'),
        events: { 
            'click .close' : 'close'
        },
        initialize: function() {
            this.model.on('showDetails', this.open, this);
            this.render();
        },
        render: function() {
            var list = $('<ul>');
            for( var prop in this.model.attributes) {
                if(prop != '@type' && prop.indexOf('@') === 0 ) continue;
                var property = this.model.vie.namespaces.curie(prop);
                var item = $("<li><strong>"+property+"</strong>:</li>");
                var val = this.model.get(prop);
                this.LOG.debug('val',val);
                var res_cont, dView; 
                if( prop == '@type') {
                    res_cont = val && val.id ? this.model.vie.namespaces.curie(val.id) : val;
                } else if( val.isEntity ) {
                    var EntityView = require('view/sss/EntityView');
                    var view = new EntityView({
                                'model' : val
                               });
                    res_cont = view.render().$el;
                } else if (property == 'timestamp' || property == 'creationTime')  {
                    res_cont = _.isNumber(val) ? new Date(val-0) : val;
                } else res_cont = val;
                item.append(res_cont);
                if( dView ) item.append(dView.render().$el);
                list.append(item);
            }
            this.$el.html('');
            this.$el.append(list);
            return this;
        },
        open: function(event) {
            this.LOG.debug('open');
            this.LOG.debug("event", event);
            var x = event.pageX + 10;
            var y = event.pageY + 10;
            if( !this.dialog_init ) {
                var title = "no title";
                try {
                    title = this.model.vie.namespaces.curie(this.model.getSubject());
                } catch(e) {
                    title = this.model.getSubject();
                }
                this.$el.addClass('detailView');
                this.$el.dialog({
                    'title' : title,
                    'position':[
                        //'my': 'left top',
                        //'at': 'center',
                        //'of': event.currentTarget
                         x,
                         y
                    ],
                    'draggable' : false,
                    'resizeable' : false
                });
                this.$el.dialog('widget').zIndex(1000);
                this.dialog_init = true;
            } else {
                this.$el.dialog('option', 'position', [
                        //'my': 'left top',
                        //'at': 'center',
                        //'of': event.currentTarget
                         x,
                         y
                ]);
                this.$el.dialog('open');
            }

        },
        close: function(event) {
            this.$el.hide();
        }

    });
});
