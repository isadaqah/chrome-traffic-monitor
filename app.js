// -------- TrafficMonitor

function TrafficMonitor(jobs, flushEvery) {
  if (!jobs || !jobs.length)  {
    throw new Exception("At least one job is required to initialize the agent.");
  }
  var self = this;
  self.results = {};
  self.reporters = {};

  _.each(jobs, function(job, i) {
    job.id = i;
    self.reporters[i] = job.reporters;
    self.results[i] = [];
    self.addJobListeners(job);
  });

  self.resetResults = function() {
    self.results = {};
    _.each(jobs, function(_, i) {
      self.results[i] = [];
    });
  }
  setInterval(_.bind(self.flush, self), flushEvery);
}

TrafficMonitor.prototype.addJobListeners = function(job) {
  var self = this;
  if (!job) {
    throw new Exception("Invalid job.");
  }
  if (job.type === "extractFromReqHeaders") {
    chrome.webRequest.onBeforeSendHeaders.addListener(function(d) {
      console.log("SEND", d.timeStamp, d.requestId, d.method, d.url, d.requestHeaders, d.requestBody);
      return {requestHeaders: d.requestHeaders};
    }, job.requestFilter, ["requestHeaders"]);
  } else if (job.type === "extractFromReqBody") {
    chrome.webRequest.onBeforeRequest.addListener(function(d) {
      var body = d.requestBody;
      if (!body) {
        return;
      }
      var results = [];
      _.each(job.parsers, function(parser) {
        var result = parser.extractor(body);
        if (result) {
          self.addResult(job.id, {
            timestamp: d.timeStamp,
            method: d.method,
            url: d.url,
            value: result
          });
        }
      });
    }, job.requestFilter, ["requestBody"]);
  } else {
    throw new Exception("Unknown job type: " + job.type);
  }
};

TrafficMonitor.prototype.addResult = function(jobId, result) {
  this.results[jobId].push(result);
};

TrafficMonitor.prototype.flush = function() {
  var reporters = this.reporters;
  var results = JSON.parse(JSON.stringify(this.results));
  this.resetResults();
  _.each(results, function(jobResults, jobId) {
    var jobReporters = reporters[jobId];
    _.each(jobReporters, function(reporter) {
      _.each(jobResults, function(result) {
        reporter.report(result);
      });
    });
  });
};


// ----- ResultReporters

function ConsoleResultReporter() {}
ConsoleResultReporter.prototype.report = function(result) {
  console.log(result);
};

function HTMLResultReporter() {}
HTMLResultReporter.prototype.report = function(result) {
  var view = chrome.extension.getViews()[1];
  view.document.body.innerHTML += JSON.stringify(result) + '<br/>';
};


// -------- Main

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
    new TrafficMonitor([{
      type: "extractFromReqBody",
      requestFilter: {
        urls: ["https://launchpad.37signals.com/session"]
      },
      parsers: [{
        extractor: function(body) {
          if (!body) return;
          return body.formData.username[0];
        }
      }],
      reporters: [
        new ConsoleResultReporter(),
        new HTMLResultReporter(tab.id)
      ]
    }], 1000);
  });
});
