define(['underscore', 'jquery', 'text!../data/help.json', 'colorbox', 'bootstrap'],
function(_, $, help) {
    $(document).ready(function(){
        var helpData = JSON.parse(help),
            appContainerElement = $(document).find('#bnp-help-app'),
            helpText = '';

        _.each(helpData.apps, function(app) {
            helpText += '<h2>' + app.title + '</h2>';

            if ( app.alerts && _.isArray(app.alerts) && app.alerts.length > 0 ) {
                _.each(app.alerts, function(single) {
                    helpText += '<div class="alert alert-' + single.type + '">' + single.text + '</div>';
                });
            }

            _.each(app.chapters, function(chapter) {
                helpText += '<h3>' + chapter.title + '</h3>';

                helpText += '<ul class="list-group">';
                _.each(chapter.videos, function(video) {
                    helpText += '<li class="list-group-item">';
                    helpText += '<a href="' + video.url + '" class="youtube">';
                    helpText += '<i class="fa fa-youtube"></i>';
                    helpText += video.title;
                    helpText += '</a>';
                    helpText += '<span class="badge">' + video.duration + '</span>';
                    helpText += '</li>';
                });
                helpText += '</ul>';
            });
        });

        appContainerElement.find('.bnp-help-loading').hide();
        appContainerElement.append(helpText);

        $('.youtube').colorbox({
            iframe:true,
            innerWidth:560,
            innerHeight:315
        });
    });

    return null;
});
