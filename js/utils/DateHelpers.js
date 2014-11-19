define(['logger'],
function (Logger) {
    return {
        LOG: Logger.get('DateHelpers'),
        _zeroFillIfNeeded: function(number) {
            if ( number < 10 ) {
                number = '0' + number;
            }

            return number;
        },
        _getDate: function(date) {
            return this._zeroFillIfNeeded(date.getDate());
        },
        _getMonth: function(date) {
            return this._zeroFillIfNeeded(date.getMonth() + 1);
        },
        _getHours: function(date) {
            return this._zeroFillIfNeeded(date.getHours());
        },
        _getMinutes: function(date) {
            return this._zeroFillIfNeeded(date.getMinutes());
        },
        timestampIntoDate: function(timestamp) {
            return new Date(timestamp);
        },
        formatTimestampDateDMY: function(timestamp) {
            var date = this.timestampIntoDate(timestamp);

            return this._getDate(date)
                   + '.' + this._getMonth(date)
                   + '.' + date.getFullYear();
        },
        formatTimestampDateDMYHM: function(timestamp) {
            var date = this.timestampIntoDate(timestamp);

            return this._getDate(date)
                   + '.' + this._getMonth(date)
                   + '.' + date.getFullYear()
                   + ' ' + this._getHours(date)
                   + ':' + this._getMinutes(date);
        }
    }
});
