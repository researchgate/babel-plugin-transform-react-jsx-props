var getFixtures = require("babel-helper-fixtures").default;
var transform   = require("babel-core").transform;
var test        = require("ava");

var fixtures = getFixtures(__dirname + "/fixtures");

fixtures.forEach(function (testSuite) {
  testSuite.tests.forEach(function (task) {
    test(testSuite.title + "/" + task.title, !task.disabled && function () {
        try {
          return runTest(task);
        } catch (err) {
          err.message = task.actual.loc + ": " + err.message;
          throw err;
        }
      });
  });
});

function runTest(test) {
  const { plugins, ...opts } = test.options;

  try {
    var result = transform(test.actual.code, { plugins });
    if (result.code && result.code.endsWith(';')) {
      result.code = result.code.slice(0, -1);
    }
  } catch (err) {
    if (opts.throws) {
      if (err.message === opts.throws) {
        return;
      } else {
        err.message = 'Expected error message: ' + opts.throws + '. Got error message: ' + err.message;
        throw err;
      }
    }

    throw err;
  }

  if (opts.throws) {
    throw new Error('Expected error message: ' + opts.throws + '. But parsing succeeded.');
  } else {
    if (test.expect.code !== result.code) {
      throw new Error(test.expect.code + ' !== ' + result.code);
    }
  }
}
