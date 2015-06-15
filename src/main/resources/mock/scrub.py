#!/usr/bin/env python

import sys
import re

valid = re.compile(r"^(\s+<name>).*(<\/name>)\n")
mvpn = re.compile(r"^(\s+<message-vpn>).*(<\/message-vpn>)\n")



i=0
with open("list-vpns.xml") as f:
  target = open('list-vpns.xml.scrubbed', 'w')
  target.truncate()
  for line in f:
    m = valid.match(line)
    if m != None: 
        i=i+1;
        sys.stdout.write("%svpn_%s%s\n" % ( m.group(1), i, m.group(2)))
        target.write("%svpn_%s%s\n" % ( m.group(1), i, m.group(2)))
    else:
        sys.stdout.write(line)
        target.write(line)


vpn_max = i
i = 0
iv = 0

with open("queues.xml") as f:
  target = open('queues.xml.scrubbed', 'w')
  target.truncate()
  for line in f:
    m = valid.match(line)
    if m != None: 
        i=i+1;
        sys.stdout.write("%smycompany.queue.%s%s\n" % ( m.group(1), i, m.group(2)))
        target.write("%smycompany.queue.%s%s\n" % ( m.group(1), i, m.group(2)))
    elif mvpn.match(line) != None:
      v = mvpn.match(line)
      if v != None:
          iv=iv+1
          if iv > vpn_max:
            iv = 1
          sys.stdout.write("%svpn_%s%s\n" % ( v.group(1), iv, v.group(2)))
          target.write("%svpn_%s%s\n" % ( v.group(1), iv, v.group(2)))
    else:
        sys.stdout.write(line)
        target.write(line)




i=0
with open("vpns.xml") as f:
  target = open('vpns.xml.scrubbed', 'w')
  target.truncate()
  for line in f:
    m = valid.match(line)
    if m != None: 
        i=i+1;
        sys.stdout.write("%svpn_%s%s\n" % ( m.group(1), i, m.group(2)))
        target.write("%svpn_%s%s\n" % ( m.group(1), i, m.group(2)))
    else:
        sys.stdout.write(line)
        target.write(line)




