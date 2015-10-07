var fs = require('fs');
var http = require( 'http' );
var db = require('./database/interface');

fs.watch('./queue', function (event, filename) {
  if (filename) {
    if( fs.readdirSync( './queue/' ).indexOf( filename ) >= 0 ) {
      var file = fs.readFileSync( './queue/' + filename );
      fs.unlink( './queue/' + filename );
      //Here we do the shabang.
    }
  } else {
    void 0;
  }
});