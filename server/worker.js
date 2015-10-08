var fs = require('fs');
var cron = require( 'cron' ).CronJob;
var http = require( 'http' );
var db = require('./database/interface.js');
var AlchemyAPI = require( './assets/alchemyapi');
var alchemyapi = new AlchemyAPI( '73ad3b222a6bcb7a40192e87eb2a393469e08fcf' );
var stopwords = require('./assets/stopwords.js');

new cron( '* * * * * *', function( ) {
  var files = fs.readdirSync( 'server/queue' );
  if( !( files.length > 0 ) ) {
    return;
  }
  var filename = files[ 0 ];
  for( var i = 0; i < files.length; i++ ) {
    if( +files[ i ] < +filename ) {
      filename = files[ i ];
    }
  }

  var data = JSON.parse( fs.readFileSync( 'server/queue/' + filename, 'utf8' ) );
  fs.unlink( 'server/queue/' + filename );
  alchemyapi.keywords('text', data.text, {sentiment: true}, function keywordsCallback( keywordsJSON ) {
    data.text = data.text.replace(/[\.\,\:\;\'\"\?\!']/g, '');
    if( keywordsJSON.status && keywordsJSON.status === 'ERROR' ) {
      throw keywordsJSON.statusInfo;
    } else {
      alchemyapi.sentiment('text', data.text, null, function documentCallback( documentJSON ) {
        if(documentJSON.status && documentJSON.status === 'ERROR' ) {
          throw documentJSON.statusInfo;
        }
        var words = [];
        keywordsJSON.keywords.forEach( function( keyword ) {

          var found = false;
          words.forEach(function(wordToStore) {

            if (wordToStore.text === keyword.text){

              wordToStore.frequency += 1;
              wordToStore.averageSentiment =
                (wordToStore.frequency - 1) * wordToStore.averageSentiment /
                  wordToStore.frequency +
                keyword.sentiment.score / wordToStore.frequency;
              found = true;

            }

          });
          if (!found) {

            words.push({
              text: keyword.text,
              averageSentiment: keyword.sentiment.score,
              frequency: 1
            });

          }

          data.text = data.text.replace(keyword.text, '');

        });

        var allWords = data.text.trim().split(' ');

        allWords.forEach(function(word, index) {
          word.trim();
          if (word === '') {
            allWords.splice(index, 1);
          }
        });

        allWords = allWords.filter(function(word) {
          if (stopwords[word] === null) {
            return false;
          } else {
            return true;
          }

        });

        allWords.forEach(function(word) {
          var found = false;
          words.forEach(function(wordToStore) {
            if (wordToStore.text === word) {
              wordToStore.frequency += 1;
              found = true;
            }

          });
          if (!found) {
            words.push({
              text: word,
              averageSentiment: documentJSON.docSentiment.score,
              frequency: 1
             });
          }
        });

        words.forEach(function(word) {

          db.Word.findOne( { where:

            {

              word: word.text,
              userId: data.userId,
              emotion: data.emotion

            }
          })
          .then(function(wordRecord) {

            if (wordRecord) {

              wordRecord.increment( 'frequency', { by: word.frequency });
              wordRecord.set( 'averageSentiment',
                wordRecord.get( 'averageSentiment' ) * (wordRecord.get('frequency') - word.frequency) /
                  wordRecord.get( 'frequency' ) +
                word.frequency * word.averageSentiment / wordRecord.get( 'frequency' )

              );
              wordRecord.save();
            } else {
              db.Word.create({

                word: word.text,
                frequency: word.frequency,
                averageSentiment: word.averageSentiment,
                userId: data.userId,
                emotion: data.emotion

              });

            }

          })
          .catch(function(error) {
            throw error;
          });

        });
        
      });
    }
  });
}, null, true, 'America/Los_Angeles');
