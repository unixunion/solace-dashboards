#!/usr/bin/env python

'''

codes

100 release request prepared

200 release request verified
201 infrastructure tests passed
202 skipping infrastructure tests
203 db migration completed
204 closing release jira
205 deploy succeeded
206 loadbalander succeeded

300 migrating databses
301 verifying infrastructure
302 release in progress

500 error verify release request
501 error verify infra
502 deploy failed
'''

from optparse import OptionParser
import urllib
import urllib2
import json

url = "http://localhost:8080/api/event"

request = {}

request['data'] = {}

if __name__ == "__main__":
	usage="-h for help"
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
		help="status string")

	(options, args) = parser.parse_args()

	request['topic'] = options.topic
	request['data']['component'] = options.component;
	request['data']['version'] = options.version
	request['data']['code'] = options.code
	request['data']['status'] = options.status

	print("%s" % request)

	req = urllib2.Request(url=url,
	                      data=json.dumps(request),
	                      headers={'Content-Type': 'application/json'})

	response = urllib2.urlopen(req)