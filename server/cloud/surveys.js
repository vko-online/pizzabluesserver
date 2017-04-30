'use strict';
/* global Parse */

var Product = Parse.Object.extend('Product');
var Review = Parse.Object.extend('Review');
var Survey = Parse.Object.extend('Survey');
var SurveyResult = Parse.Object.extend('SurveyResult');

Parse.Cloud.define('send_surveys', function(request, response) {
  if (request.master) {
    Parse.Cloud.useMasterKey();
  } else {
    return response.error('Need master key');
  }

  var productId = request.params.productId;
  if (!productId) {
    return response.error('Need productId');
  }

  console.log('Fetching attendees for ' + productId);
  var product = new Product({id: productId});
  var reviewers = new Parse.Query(Review)
    .equalTo('product', product)
    .notEqualTo('sent', true)
    .find();
  var survey = new Parse.Query(Survey)
    .equalTo('product', product)
    .first();

  Parse.Promise.when(reviewers, survey, new Parse.Query(Product).get(productId))
    .then(sendSurveys)
    .then(
      function(value) { response.success(value); },
      function(error) { response.error(error); }
    );
});

Parse.Cloud.define('surveys', function(request, response) {
  Parse.Cloud.useMasterKey();

  var user = request.user;
  if (!user) {
    return response.success([]);
  }

  new Parse.Query(SurveyResult)
    .equalTo('user', user)
    .equalTo('rawAnswers', null)
    .include('survey')
    .include('survey.product')
    .find()
    .then(toSurveys)
    .then(
      function(value) { response.success(value); },
      function(error) { response.error(error); }
    );
});

Parse.Cloud.define('submit_survey', function(request, response) {
  Parse.Cloud.useMasterKey();

  var user = request.user;
  if (!user) {
    return response.error({message: 'Not logged in'});
  }

  var params = request.params;
  if (!params.id || !params.answers) {
    return response.error({message: 'Need id and answers'});
  }

  new Parse.Query(SurveyResult)
    .equalTo('user', user)
    .equalTo('objectId', params.id)
    .find()
    .then(function(results) {
      if (results.length === 0) {
        throw new Error('No user/id combination found');
      }
      return results[0].save({
        a1: params.answers[0],
        a2: params.answers[1],
        rawAnswers: JSON.stringify(params.answers)
      });
    }).then(
      function(value) { response.success(value); },
      function(error) { response.error(error); }
    );
});

function sendSurveys(reviewers, survey, product) {
  if (!survey) {
    throw new Error('Survey not found for product ' + product.id);
  }

  console.log('Found ' + reviewers.length + ' reviewers');
  return Parse.Promise.when(reviewers.map(function(record) {
    var user = record.get('user');
    return new SurveyResult().save({
      user: user,
      survey: survey,
    }).then(function() {
      return Parse.Push.send({
        where: new Parse.Query(Parse.Installation).equalTo('user', user),
        data: {
          badge: 'Increment',
          alert: 'Пожалуйста оцените "' + product.get('title') + '"',
          e: true, // ephemeral
        }
      });
    }).then(function() {
      return record.save({sent: true});
    });
  })).then(function() {
    return arguments.length;
  });
}

function toSurveys(emptyResults) {
  return emptyResults.map(function(emptyResult) {
    var survey = emptyResult.get('survey');

    var questions = [];
    if (survey.get('q1')) {
      questions.push({
        text: survey.get('q1'),
        lowLabel: 'Not at all',
        highLabel: 'Very useful',
      });
    }

    if (survey.get('q2')) {
      questions.push({
        text: survey.get('q2'),
        lowLabel: 'Not likely',
        highLabel: 'Very likely',
      });
    }

    return {
      id: emptyResult.id,
      productId: survey.get('product').id,
      questions: questions,
    };
  });
}
