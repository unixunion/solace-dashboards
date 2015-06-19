#!/usr/bin/env python


from optparse import OptionParser
import urllib
import urllib2
import json

#url = "http://solacemonitor.swe1.unibet.com/api/event"
url = "http://localhost:8080/api/event"

request = {}

request['data'] = {}

if __name__ == "__main__":
	usage='''

Options:
  -h, --help            show this help message and exit
  -t TOPIC, --topic=TOPIC
                        topic to send to
  -p COMPONENT, --component=COMPONENT
                        component name
  -v VERSION, --version=VERSION
                        version
  -s STATUS, --status=STATUS
  -c CODE, --code=CODE  status code

code must be one of:

100 release request prepared

200 release request verified
201 infrastructure tests passed
202 skipping infrastructure tests
203 db migration completed
204 closed release jira
205 deploy succeeded
206 loadbalander succeeded
207 release completed

300 migrating databses
301 verifying infrastructure
302 release in progress
303 not taking traffic
304 closing release jira

500 error verify release request
501 error verify infrastructure tests
502 deploy failed
503 error closing release jira
504 error calling RAT
505 error activating in loadbalander
506 error migrating database

	'''
	parser = OptionParser(usage=usage)
	parser.add_option("-t", "--topic", action="store", type="string", dest="topic",
		help="topic to send to", default="release-event")

	parser.add_option("-p", "--component", action="store", type="string", dest="component",
		help="component name")

	parser.add_option("-v", "--version", action="store", type="string", dest="version",
		help="version")

	parser.add_option("-c", "--code", action="store", type="int", dest="code",
		help="status code")

	parser.add_option("-s", "--status", action="store", type="string", dest="status",
		help='code')

	parser.add_option("-e", "--environment", action="store", type="string", dest="environment",
		help='environment string')

	parser.add_option

	(options, args) = parser.parse_args()

	if options.component is None:
		parser.error("component name missing")
	if options.version is None:
		parser.error("version missing")
	if options.code is None:
		parser.error("code is missing")
	if options.status is None:
		parser.error("status string is missing")
	if options.environment is None:
		parser.error("env string is missing")

	request['topic'] = options.topic
	request['data']['component'] = options.component;
	request['data']['version'] = options.version
	request['data']['code'] = options.code
	request['data']['status'] = options.status
	request['data']['environment'] = options.environment

	print("%s" % request)

	req = urllib2.Request(url=url,
	                      data=json.dumps(request),
	                      headers={'Content-Type': 'application/json'})

	response = urllib2.urlopen(req)
