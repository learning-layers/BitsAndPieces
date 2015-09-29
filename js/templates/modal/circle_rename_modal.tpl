<div class="modal fade" id="circleRenameModal" tabindex="-1" role="dialog" aria-labelledby="circleRenameModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="circleRenameModalLabel">Please enter the Concept</h4>
            </div>
            <div class="modal-body">
                <div class="well well-sm">
                    <label>Author:</label>
                    <span class="authorName"></span>
                </div>
                <form role="form">
                    <div class="form-group">
                        <label for="renamedCircleLabel">Concept label:</label>
                        <input type="text" class="form-control" id="renamedCircleLabel" value="" />
                    </div>

                    <div class="form-group">
                        <label for="renameCircleDescription">Description:</label>
                        <textarea class="form-control" id="renameCircleDescription"></textarea>
                        <p class="help-block">Allows input of up to 5.000 characters. </p>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
            </div>
        </div>
    </div>
</div>
