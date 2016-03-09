<div class="modal fade" id="episodeAddModal" tabindex="-1" role="dialog" aria-labelledby="episodeAddModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="episodeAddModalLabel">Add New Episode</h4>
            </div>
            <div class="modal-body">
                <form role="form">
                    <div class="form-group">
                        <label for="episodeLabel">Label:</label>
                        <input type="text" class="form-control" id="episodeLabel" value="" />
                    </div>
                    
                    <div class="form-group">
                        <label for="episodeDescription">Description:</label>
                        <textarea class="form-control" rows="<%= rows %>" id="episodeDescription"></textarea>
                        <p class="help-block">Allows input of up to <%= descriptionMaxLength %> characters. </p>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create</button>
            </div>
        </div>
    </div>
</div>
