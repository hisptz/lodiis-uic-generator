async function getHttpAuthorizationHeader(username, password) {
    return {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' + new Buffer.from(`${username}:${password}`).toString('base64'),
    };
  }

  module.exports = {
      getHttpAuthorizationHeader
  }