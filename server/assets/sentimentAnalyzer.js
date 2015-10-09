var fs = require('fs');
var http = require( 'http' );
var db = require('../database/interface.js');
var bluebird = require( 'bluebird' );
var AlchemyAPI = require( './alchemyapi');
var alchemyapi = bluebird.promisifyAll( new AlchemyAPI( process.env.ALCHEMY_KEY ) );
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
      console.log( "STAGED KEYWORDS!");
      cleanText( );
      console.log( "CLEANED TEXT!");
      removeStopwords( );
      console.log( "REMOVED STOPWORDS!");
      stageOtherWords( );
      console.log( "STAGED OTHER WORDS!");
      saveAllStagedWords( );
      console.log( "SAVED ALL STAGED WORDS!");
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
        });
      } if( typeof text === 'string' ) {
        text = text.replace( keywords[ i ].text, '' );
      }
    }

  };

  var cleanText = function( ) {

    var i = 0;

    text = removePunctuation( text );
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
      /[\.\,\;\:\"\[\{\(\]\}\)\|\*\^\&\^\`}]]/g,
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
    });

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
          word: word.text,
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