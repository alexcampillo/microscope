Posts = new Mongo.Collection('posts');

Posts.allow({
	update: function(userId, post) { return ownsDocument(userId, post); },
	remove: function(userId, post) { return ownsDocument(userId, post); }
});

Posts.deny({
	update: function(userId, post, fieldNames) {
		//may only edit the following fields
		return (_.without(fieldNames, 'url', 'title').length > 0);
	}
});

Posts.deny({
  update: function(userId, post, fieldNames, modifier) {
    var errors = validatePost(modifier.$set);
    return errors.title || errors.url;
  }
});

validatePost = function (post) {
  var errors = {};
  if (!post.title)
    errors.title = "Please fill in a headline";
  if (!post.url)
    errors.url =  "Please fill in a URL";
  return errors;
}

Meteor.methods({
	postInsert: function(postAttributes) {
		check(Meteor.userId(), String);
		check(postAttributes, {
			title: String,
			url: String
		});

	var errors = validatePost(postAttributes);
    if (errors.title || errors.url)
      throw new Meteor.Error('invalid-post', "You must set a title and URL for your post");

		var postsWithSameLink = Posts.findOne({url: postAttributes.url});
		if (postsWithSameLink) {
			return {
				postExists: true,
				_id: postsWithSameLink._id
			}
		}

		var user = Meteor.user();
		var post = _.extend(postAttributes, {
			userId: user._id,
			author: user.username,
			submitted: new Date(),
  			commentsCount: 0
		});

		var postId = Posts.insert(post);

		return {
			_id: postId
		};
	}
});