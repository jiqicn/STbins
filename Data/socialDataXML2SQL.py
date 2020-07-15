import sqlite3
import xml.sax
from datetime import datetime

class PhotoHandler (xml.sax.ContentHandler):
	def __init__(self):
		self.currentData = ""
		self.photo = {
			"photoID": "",
			"photoURL": "",
			"userID": "",
			"dateTaken": "",
			# "dateUploaded": "",
			# "title": "",
			# "description": "",
			"tags": []
		}
		self.tag = ""
		self.baseTime = datetime.strptime("2009-01-01 00:00:00", "%Y-%m-%d %H:%M:%S")
		self.conn = ""
		self.noTagList = []

	def startElement(self, tag, attributes):
		self.currentData = tag

		# get all the attributes from photo element
		if tag == "photo":
			self.photo["photoID"] = attributes["id"]
			self.photo["photoURL"] = attributes["photo_url"]
			self.photo["userID"] = attributes["username"].replace("\"", "'")
			self.photo["dateTaken"] = long((datetime.strptime(attributes["dateTaken"].split(".")[0], "%Y-%m-%d %H:%M:%S") - self.baseTime).total_seconds() * 1000000000)
			# self.photo["dateUploaded"] = long((datetime.strptime(attributes["dateUploaded"].split(".")[0], "%Y-%m-%d %H:%M:%S") - self.baseTime).total_seconds() * 1000000000)

	def endElement(self, tag):
		if tag == "photo":
			# print photo info
			# c = self.conn.cursor()
			# for t in self.photo["tags"]:
			# 	query = "insert into photo (userid, timestamp, tag) values (\"" + self.photo["userID"] + "\", " + str(self.photo["dateTaken"]) + ", \"" + t + "\")"
			# 	try:
			# 		c.execute(query)
			# 	except:
			# 		print self.photo
			# insert photoid table		
			query = "insert into photoid (photoid, timestamp, photoURL) values ('" + self.photo["photoID"] + "', " + str(self.photo["dateTaken"]) + ", '" + str(self.photo["photoURL"]) + "')"
			self.conn.cursor().execute(query)
			self.conn.commit()

			# reinitialize photo dict
			self.photo = {
				"photoID": "",
				"photoURL": "",
				"userID": "",
				"dateTaken": "",
				# "dateUploaded": "",
				# "title": "",
				# "description": "",
				"tags": []
			}
		# elif tag == "tag":
		# 	if len(self.tag) > 0:
		# 		self.photo["tags"].append(self.tag.replace("\"", "'"))
		# 	else:
		# 		self.noTagList.append(self.photo["photoID"])
		# 	self.tag = ""0
		self.currentData = ""

	def characters(self, content):
		# if self.currentData == "title":
		# 	self.photo["title"] = content
		# elif self.currentData == "description":
		# 	self.photo["description"] = content
		# if self.currentData == "tag":
		# 	self.tag += content
		pass

	def connectDatabase(self, database):
		self.conn = sqlite3.connect(database)
		print "Database connected...\n"

	def closeDatabase(self):
		self.conn.close()
		print "Database closed...\n"
		print self.noTagList


class CompareResult:
	def __init__(self, input_target, input_source):
		# get target content and transfer to a list
		with open(input_target, 'r') as targetFile:
			targetContent = targetFile.read()
			targetContent = targetContent.replace("[", '')
			targetContent = targetContent.replace("u", '')
			targetContent = targetContent.replace("'", '')
			targetContent = targetContent.replace("]", '')
			self.targetList = targetContent.split(", ")

		# get source content and transfer to a list
		with open(input_source, 'r') as sourceFile:
			sourceContent = sourceFile.read().replace('\r\n', ',')
			self.sourceList = sourceContent.split(",")

	def compare(self):
		# search by the less one
		if len(self.targetList) <= len(self.sourceList):
			less = self.targetList
			more = self.sourceList
		else:
			less = self.sourceList
			more = self.targetList

		count = 0
		for i in less:
			if i in more:
				count += 1

		print count

class EventTimeRange:
	def __init__(self, input_source):
		self.events = {}
		self.timeRange = {}
		self.conn = None
		self.total = 0
		count = 0

		# read event data by event
		with open(input_source, 'r') as sourceFile:
			reader = sourceFile.read().split('\n')
			for row in reader:
				if len(row) > 0:
					event = row.split(',')
					self.events[count] = event
					self.timeRange[count] = []
					count += 1

	def connectDatabase(self, database):
		self.conn = sqlite3.connect(database)
		print "Database connected...\n"

	def getRange(self, windowSize):
		for i in self.events:
			for e in self.events[i]:
				query = "select * from photoid where photoid = '" + e + "'"
				cursor = self.conn.cursor().execute(query)
				for row in cursor:
					self.timeRange[i].append(row[1] / windowSize)
			self.timeRange[i] = list(set(self.timeRange[i]))
			self.timeRange[i].sort()
			gap = max(self.timeRange[i]) - min(self.timeRange[i]);
			print "Event " + str(i) + " (freq: " + str(len(self.events[i])) + "): ", len(self.timeRange[i])
			self.total += len(self.timeRange[i])
		print self.total



if __name__ == '__main__':
	# # collect data
	# # create parser
	# INPUT_FILE_NAME = "sed2012_metadata.xml"
	# parser = xml.sax.make_parser()
	# parser.setFeature(xml.sax.handler.feature_namespaces, 0)

	# # reload handler
	# handler = PhotoHandler()
	# parser.setContentHandler(handler)

	# # parse data
	# handler.connectDatabase("test.db")
	# parser.parse(INPUT_FILE_NAME)
	# handler.closeDatabase()

	# # compare notaglist to eventlist
	# c = CompareResult("noTagList.txt", "indignados_events.txt")
	# print "To indignados events: ", c.compare()
	# c = CompareResult("noTagList.txt", "soccer_events.txt")
	# print "To soccer events:", c.compare()
	# c = CompareResult("noTagList.txt", "technical_events.txt")
	# print "To technical events:", c.compare()

	# window size
	day = 86400000000000
	hour = 3600000000000
	minute = 60000000000

	etr = EventTimeRange("technical_events.txt")
	etr.connectDatabase("test.db")
	etr.getRange(hour)


