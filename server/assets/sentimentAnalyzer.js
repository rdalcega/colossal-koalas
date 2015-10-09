var fs = require('fs');
var http = require( 'http' );
var db = require('../database/interface.js');
var bluebird = require( 'bluebird' );
var AlchemyAPI = require( './alchemyapi');
var alchemyapi = bluebird.promisifyAll( new AlchemyAPI( '73ad3b222a6bcb7a40192e87eb2a393469e08fcf' ) );
var stopwords = require('./stopwords.js');

module.exports = function( data ) {

  var keywords;
  var sentenceSentiment;
  var staged = [];
  var emotion = data.emotion;
  var userId = data.userId;
  var text = data.text;
  text = text.toLowerCase( );

  alchemyapi.keywordsAsync(
    'text',
    text,
    { sentiment: true }
  )

  .then( function( response ) {

    if( response.status && response.status === 'ERROR' ) {
      throw response.statusInfo;
    } else {
      keywords = response.keywords;
      return alchemyapi.sentimentAsync(
        'text',
        text,
        null
      );
    }

  })

  .then( function( response ) {

    if( response.status && response.status === 'ERROR' ) {
      throw response.statusInfo;
    } else {
      sentence = response.docSentiment.score;
      stageKeywords( );
      cleanText( );
      removeStopwords( );
      stageOtherWords( );
      saveAllStagedWords( );
    }

  })

  .catch( function( error ) {

    if( error ) {
      throw error;
    }

  });

  var stageKeywords = function( ) {

    stageSomeWords( keywords );

  };

  var stageSomeWords = function( someWords ) {

    var i = 0;
    var j = 0;

    for( i = 0; i < someWords.length; i++ ) {
      for( j = 0; j < staged.length; j++ ) {
        if( staged[ i ].text === someWords[ i ].text ) {
          staged[ i ].frequency += 1;
          staged[ i ].averageSentiment =
            ( staged[ i ].frequency - 1 ) * staged[ i ].averageSentiment / staged[ i ].frequency +
            someWords[ i ].sentiment.score / staged[ i ].frequency;
          break;
        }
      } if( j < staged.length ) {
        staged.push({
          text: someWords[ i ].text,
          averageSentiment: someWords[ i ].sentiment.score,
          frequency: 1
        })
      } if( typeof text === 'string' ) {
        text = text.replace( keywords[ i ].text, '' );
      }
    }

  };

  var cleanText = function( ) {

    var i = 0;

    text = text.removePunctuation( );
    text = text.split( /(\s|\n)/g );
    while( i < text.length ) {
      if( text[ i ] === '' ) {
        text.splice( i, 1 );
      } else {
        text[ i ].trim( );
        i++;
      }
    }

  };

  var removePunctuation = function( text ) {

    // Get rid of all non '
    // punctuation marks.
    text = text.replace(
      /[\.\,\;\:\"]/g,
      ''
    );

    // Get rid of all ' that
    // are not in the middle
    // of a word.
    text = text.replace(
      /(\s\'|\'\s)/g,
      ''
    );

    return text;

  };
  
  var removeStopwords = function( ) {

    text = text.filter(function( word ) {
      return !stopwords[word];
    })

  };

  var stageOtherWords = function( ) {

    stageSomeWords( text.map(function( word ) {
      return {
        text: word,
        sentiment: {
          score: sentenceSentiment
        }
      };
    }));

  };


  var saveAllStagedWords = function( ) {

    while( staged.length > 0 ) {
      saveWord( staged.pop( ) );
    }

  };

  var saveWord = function( word ) {

    db.Word.findOne({ where: {
      text: word.text,
      userId: userId,
      emotion: emotion
    }})

    .then( function( record ) {

      if( record ) {
        record.increment( 'frequency', { by: word.frequency } );
        record.set( 'averageSentiment',
          record.get( 'averageSentiment' ) *
            (record.get('frequency') - word.frequency) /
              record.get( 'frequency' ) +
          word.frequency * word.averageSentiment / record.get( 'frequency' )
        );
        record.save( );
      } else {
        db.Word.create({
          text: word.text,
          frequency: word.frequency,
          averageSentiment: word.averageSentiment,
          userId: userId,
          emotion: emotion
        });
      }

    })

    .catch( function( error ) {

      if( error ) {
        throw error;
      }

    });

  };

};
//   alchemyapi.keywords(
//     'text',
//     text,
//     {sentiment: true},
//   function keywordsCallback( keywordsJSON ) {

//     if( keywordsJSON.status && keywordsJSON.status === 'ERROR' ) {
//       throw keywordsJSON.statusInfo;
//     } else {
//       alchemyapi.sentiment(
//         'text',
//         text,
//         null,
//       function documentCallback( documentJSON ) {

//         if(documentJSON.status && documentJSON.status === 'ERROR' ) {
//           throw documentJSON.statusInfo;
//         }

//         var staged = [];
//         var i = 0;
//         var j = 0;

//         for( i = 0; i < keywordsJSON.keywords.length; i++ ) {

//           var keyword = keywordsJSON.keywords[ i ];
//           for( j = 0; j < words.length; j++ ) {
//             if( words[ i ].text === keyword.text ) {
//               words[ i ].frequency += 1;
//               words[ i ].averageSentiment =
//                 ( words[ i ].frequency - 1 ) * words[ i ].averageSentiment /
//                   words[ i ].frequency +
//                 keyword.sentiment.score / wordToStore.frequency;
//               break;
//             }
//           } if( j < words.length ) {
//             words.push({
//               text: keyword.text,
//               averageSentiment: keyword.sentiment.score,
//               frequency: 1
//             });
//           }
//           text = text.replace( keyword.text, '' );

//         }

//         text = text.removePunctuation( );

//         var allWords = text.trim().split(' ');

//         allWords.forEach(function(word, index) {
//           word.trim();
//           if (word === '') {
//             allWords.splice(index, 1);
//           }
//         });

//         allWords = allWords.filter(function(word) {
//           if (stopwords[word] === null) {
//             return false;
//           } else {
//             return true;
//           }

//         });

//         allWords.forEach(function(word) {
//           var found = false;
//           words.forEach(function(wordToStore) {
//             if (wordToStore.text === word) {
//               wordToStore.frequency += 1;
//               found = true;
//             }

//           });
//           if (!found) {
//             words.push({
//               text: word,
//               averageSentiment: documentJSON.docSentiment.score,
//               frequency: 1
//              });
//           }
//         });

//         words.forEach(function(word) {

//           db.Word.findOne( { where:

//             {

//               word: word.text,
//               userId: data.userId,
//               emotion: data.emotion

//             }
//           })
//           .then(function(wordRecord) {

//             if (wordRecord) {

//               wordRecord.increment( 'frequency', { by: word.frequency });
//               wordRecord.set( 'averageSentiment',
//                 wordRecord.get( 'averageSentiment' ) * (wordRecord.get('frequency') - word.frequency) /
//                   wordRecord.get( 'frequency' ) +
//                 word.frequency * word.averageSentiment / wordRecord.get( 'frequency' )

//               );
//               wordRecord.save();
//             } else {
//               db.Word.create({

//                 word: word.text,
//                 frequency: word.frequency,
//                 averageSentiment: word.averageSentiment,
//                 userId: data.userId,
//                 emotion: data.emotion

//               });

//             }

//           })
//           .catch(function(error) {
//             throw error;
//           });

//         });
        
//       });
//     }
//   });
// };

