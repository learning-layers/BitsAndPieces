<div class="panel panel-default toolbarContent toolbarcontentSearch">

    <div class="panel-heading">
        <h3 class="panel-title">Search</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">
            <div class="form-group search">
                <label>Search a Bit:</label>
                <input class="form-control" type="text" value="" placeholder="Enter tag" />
            </div>

            <div class="tagcloud"></div>
            <br />
        </div>

        <div class="toolbarSection">
            <div class="form-group filter">
                <label>Filter search result by deadline:</label>
                <div class="input-group">
                    <input class="datepicker form-control" type="text" value="" placeholder="Select a date" disabled="disabled" />
                    <span class="input-group-addon">
                        <a href="#" class="clearDatepicker"><span class="glyphicon glyphicon-remove-circle"></span></a>
                    </span>
                </div>
            </div>

            <div class="results" style="display:none;">
                <label class="subsectionLabelSmall">Results found:</label>
                <div class="resultSet"></div>
            </div>
        </div>

    </div><!-- .panel-body -->

</div>
