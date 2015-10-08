var fs = require('fs');
var http = require( 'http' );
var db = require('./database/interface');
var AlchemyAPI = require( './assets/alchemyapi');
var alchemyapi = new AlchemyAPI( '73ad3b222a6bcb7a40192e87eb2a393469e08fcf' );
var stopwords = require('./assets/stopwords.js');

fs.watch('./queue', function (event, filename) {
  if (filename) {
    if( fs.readdirSync( './queue/' ).indexOf( filename ) >= 0 ) {
      var JSON = JSON.parse( fs.readFileSync( './queue/' + filename, 'utf8' ) );
      fs.unlink( './queue/' + filename );
      alchemyapi.keywords('text', JSON.text, null, function keywordsCallback( keywordsJSON ) {
        if( error ) {
          throw error;
        } else {
          alchemyapi.sentiment('text', JSON.text, null, function documentCallback( documentJSON ) {
            if(error) {
              throw error;
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

              JSON.text.replace(keyword, '');

            });

            var allWords = JSON.text.trim().split(' ');

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
                if (wordToStore === word) {
                  wordToStore.frequency += 1;
                  found = true;
                }

              });
              if (!found) {
                words.push({
                  text: word,
                  averageSentiment: documentJSON.docSentiment[0].score,
                  frequency: 1
                 });
              }
            });

            words.forEach(function(word) {

              db.Word.findOne( { where:

                {

                  word: word.text,
                  userId: JSON.userId,
                  emotion: JSON.emotion

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
                    userId: JSON.userId,
                    emotion: JSON.emotion

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
    }
  }
});