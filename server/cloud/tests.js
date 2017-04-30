'use strict';
/* global Parse */

var Survey = Parse.Object.extend('Survey');
var SurveyResult = Parse.Object.extend('SurveyResult');

Parse.Cloud.define('test_push', function(request, response) {
  Parse.Cloud.useMasterKey();

  var user = request.user;
  if (!user) {
    return response.error({message: 'Not logged in'});
  }

  var query = new Parse.Query(Parse.Installation);
  query.equalTo('user', user);

  var userName = user.get('name').split(' ')[0];
  var data;
  if (request.params.url === 'link') {
    data = {
      alert: 'Hey ' + userName + ', look at this great website',
      url: 'https://www.fbf8.com/'
    };
  } else if (request.params.url === 'product') {
    data = {
      alert: userName + ', "Designing at Facebook is about to begin"',
      url: 'f8://designing-at-facebook'
    };
  } else {
    data = {
      alert: 'Test notification for ' + userName,
   };
  }

  data.badge = 'Increment';

  Parse.Push.send({
    where: query,
    push_time: new Date(Date.now() + 3000),
    badge: 'Increment',
    data: data,
  }).then(
    function() { response.success([]); },
    function(error) { response.error(error); }
  );
});

Parse.Cloud.define('test_survey', function(request, response) {
  Parse.Cloud.useMasterKey();

  var user = request.user;
  if (!user) {
    return response.error({message: 'Not logged in'});
  }

  new Parse.Query(Survey)
    .include('product')
    .find()
    .then(pickRandom)
    .then(function(survey) {
      var productTitle = survey.get('product').get('title');
      return new SurveyResult().save({
        user: user,
        survey: survey,
      }).then(function() {
        return Parse.Push.send({
          where: new Parse.Query(Parse.Installation).equalTo('user', user),
          push_time: new Date(Date.now() + 3000),
          data: {
            badge: 'Increment',
            alert: 'How did "' + productTitle + '" go?',
            e: true, // ephemeral
          }
        });
      });
    }).then(
      function() { response.success([]); },
      function(error) { response.error(error); }
    );
});

function pickRandom(list) {
  if (list.length === 0) {
    throw new Error('Can not pick random item from empty list');
  }
  var index = Math.floor(Math.random() * list.length);
  return list[index];
}

Parse.Cloud.define('test_attendance', function(request, response) {
  Parse.Cloud.useMasterKey();
  var Product = Parse.Object.extend('Product');
  new Parse.Query(Product).select(['id', 'title']).find().then(function(products) {
    return Parse.Promise.when(products.map(function(product) {
      return new Parse.Query(Parse.User).equalTo('review', product).find(function(users) {
        console.log('Users attending ' + product.get('title') + ': ' + users.length);
      });
    }));
  }).then(
    function() { response.success([]); },
    function(error) { response.error(error); }
  );
});
