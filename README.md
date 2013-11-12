Slingxdcc
===================
Slingxdcc is an XDCC download manager completely written in javascript.

requires [Node.js](http://nodejs.org)

Tested on Windows and Linux

Installation
------------

Grab the source or clone the repo, 
then in terminal:

    npm install
    node app.js
    
Point your browser to localhost:3000

Enable https
------------

Follow this guide till Step 4: [How to create a self-signed SSL Certificate](http://www.akadia.com/services/ssh_test_certificate.html)

Copy server.key and server.crt into ssl directory and make sure ssl is activated in config/settings.json

settings.json
------------

	{
	  "logger": {
	    "servers": {},					// Servers and channels, can be edited via GUI
	    "packRegex": "#(\\d+)\\s+(\\d+)x\\s+\\[\\s*[><]?([0-9\\.]+)([TGMKtgmk]?)\\]\\s+(.*)", // Regex for pack information
	    "packdb": "packets.db"			// Path to packdb file
	    "autocleandb": true,			// Clean redundant entries from packdb
	    "cleandb_Xminutes": 60			// Clean every X minutes
	    "redundantPercentage": 2		// If there are more then 25% redundant
	  },
	  "webserver": {
	    "port": 3000					// Webserver port
	    "ssl": true,					// Use https
	    "ssl.crt": "ssl/server.crt",	// Path to ssl.crt
	    "ssl.key": "ssl/server.key"		// Path to ssl.key
	  },
	  "downloadHandler": {
	    "destination": "downloads/",	// Downloads folder
	    "resumeDownloads": true			// Resume or overwrite downloads
	  },
	  "downloads": {},
	  "PacketList": {
	    "sortBy": "lastseen"			// Sort search by, can be edited via GUI
	    "sortOrder": "desc",			// Sort order, can be edited via GUI
	    "filterDiscon": true			// Filter offline downloads
	    "pageItemLimit": 20				// Items per page
	  }
	}
