# Installation
Open chrome://extensions in developer mode. Click "Load upacked extension ..", and select the project folder. You may click on "background page" to see the console output.

# Documentation
## Objects:
### TrafficMonitor
The main object takes a list of MonitorJobs to perform and a flush rate in milliseconds.

### MonitorJob
```
{
  type:           The job type.
                  Required.
                  Allowed values: 1) extractFromReqHeaders
                                  2) extractFromReqBody
  requestFilter:  Chrome RequestFilter object.
                  Required.
  parsers:        A list of HeaderParser objects.
                  Required.
  reporters:      A list of ResultReporter objects.
                  Required.
}
```
### HeaderParser
```
{
  exactMatch:    Exact match of the header name.
                 Optional. Required if regex is not provided.
  regex:         Regex of the header name.
                 Optional. Required if exactMatch is not provided.
  extractor:     Regex or HeaderExtractor the header value.
                 Optional.
                 If not provided, full header value is extracted.
}
```

### BodyParser
```
{
  name:          Parser name.
                 Required.
  extractor:     BodyExtractor function to extract from body.
                 Required.
}
```

## Interfaces

### BodyExtractor
Implements one method to `extract(requestBody)`. Used to extract relavent information from the request body. Should return `undefined` if nothing is found.
### HeaderExtractor
Implements one method `extract(headerValue)`. Used to extract relavent information from a request header value. Should return `undefined` if nothing is found.

### ResultReporter
Implements one method `report(result)`. Used to report results of extraction. The content of result varies from one monitor job to another.
