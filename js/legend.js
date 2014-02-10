define([ 'jquery', 'view/sss/EntityView'],
function($, EntityView){
    var ul = $('<ul></ul>');
    var icons = EntityView.prototype.icons;
    for( var key in icons ) {
        if ( key.substring(0, 8) != 'evernote') continue;
        ul.append('<li><strong>'+key+':</strong><br/><img src="'+icons[key]+'" width="50"/></li>');
    }
    $('body').append(ul);

    return null;

});
