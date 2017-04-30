'use strict';
/* global Parse */

Parse.Cloud.define('friends', function(request, response) {
  Parse.Cloud.useMasterKey();

  var user = request.user;
  if (!user) {
    return response.success([]);
  }
  if (!Parse.FacebookUtils.isLinked(user)) {
    return response.error('Current user is not linked to Facebook');
  }

  var authData = user.get('authData');
  var token = authData.facebook.access_token;
  // TODO: Fetch all friends using paging
  Parse.Cloud.httpRequest({
    url: 'https://graph.facebook.com/me/friends?fields=id&access_token=' + token,
  }).then(
    function(res) {
      var friendIds = res.data.data.map(function(friend) {
        return friend.id;
      });

      var query = new Parse.Query(Parse.User)
        .containedIn('facebook_id', friendIds);

      return query.find().then(
        function(users) {
          return Parse.Promise.when(users.map(fetchBasket));
        }
      ).then(
        function(/* ...friends */) {
          // Parse Cloud Code and Parse Server have slightly different behavior
          // of Parse.Promise.when
          var args = arguments;
          if (arguments.length === 1 && Array.isArray(arguments[0])) {
            args = arguments[0];
          }
          return Array.prototype.filter.call(args, function(friend) {
            return friend !== null;
          });
        }
      );
    }
  ).then(
    function(value) { response.success(value); },
    function(error) { response.error(error); }
  );
});

function fetchBasket(user) {
  if (!user.get('sharedBasket')) {
    return Parse.Promise.as(null);
  }
  // https://www.parse.com/questions/can-i-use-include-in-a-query-to-include-all-members-of-a-parserelation-error-102
  return user.relation('myBasket').query().find().then(
    function(products) {
      var basket = {};
      products.forEach(function(product) {
        basket[product.id] = true;
      });
      return {
        id: user.get('facebook_id'),
        name: user.get('name'),
        basket: basket,
      };
    }
  );
}
