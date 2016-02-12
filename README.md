#Slingxdcc
===================
Slingxdcc is an XDCC download manager completely written in ES6 / TypeScript.

requires [Node.js](http://nodejs.org)

How to use
------------
This branch is still under development. Please use the [master branch](https://github.com/DaVarga/slingxdcc/tree/master) for productive use.

#### "Build" from source

Since this branch is not available via npm you have to clone the repo.

    $ git clone git@github.com:DaVarga/slingxdcc.git --branch es6

cd in the project directory to install the dependencies via 

    $ cd slingxdcc
    $ npm install
    $ npm typings
    
Make sure you have [gulp installed](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md).
Initialize transpiling with following command:

    $ gulp build

#### Run slingxdcc

To start slingxdcc simply execute following command in the project directory.

    $ npm start

How to contribute
------------

#### Before submitting a bug or feature request
- Have you actually read the error message?
- Have you searched for [similar issues](https://github.com/davarga/slingxdcc/search?q=Similar%20issues&type=Issues)?
- Have you looked at what's involved in fixing/implementing this yourself?

Capable programmers should always attempt to investigate and fix problems themselves before asking for others to help. Submit a pull request instead of an issue! :)

#### A great bug report contains
- Context – what were you trying to achieve?
- Detailed steps to reproduce the error from scratch.Try isolating the minimal amount of code needed to reproduce the error.
- A link to the full corresponding log output (e.g. as a gist).
- Evidence you've looked into solving the problem and ideally, a theory on the cause and a possible solution.

#### A great feature request contains
- The current situation.
- How and why the current situation is problematic.
- A detailed proposal or pull request that demonstrates how the problem could be solved.
- A use case – who needs this feature and why?

#### A great pull request contains
- Minimal changes. Only submit code relevant to the current issue. Other changes should go in new pull requests.
- Minimal commits. Please squash to a single commit before sending your pull request.
- No conflicts. Please rebase off the latest before submitting.
- Code conforming to the existing conventions and formats. i.e. Please don't reformat whitespace.
- Consider the tslint / eslint / editorconfig rules.

Settings
------------

The configuration of slingxdcc differs from previous releases. The configuration file ist located in $homedir/.slingxdcc/settings.json

    {
      "db": {
        "compactThreshold": 50000,              //amount of packets till compacting database
        "pageSize": 30,                         //search result page size
        "cacheTTL": 600000,                     //life time of search results
        "maxResults": 3000,                     //maximum number of search results
        "defaultSorting": {
          "date": -1                            //default sorting column and direction (-1 = desc, 1 = asc)
        }
      },
      "basic": {
        "logLevel": "debug",                    //logging levels error,warn,info,verbose,debug,silly
        "dlPath": "/mnt/hugedrive/slingxdcc/",  //download destination
        "httpPort": 3000                        //webserver port
      },
      "xdcc": {
        "progressThreshold": 1048576,           //intervall of downloaded bytes each xdcc reports its progress
        "useSSL": false,                        //try ssl encrypted transfer (SSEND)
        "forceSSL": false,                      //dont fallback to unencrypted transfer
        "resume": true,                         //resume downloads
        "checkFilename": true                   //check if filename has changed since request
      }
    }
    
The download queue is stored in $homedir/.slingxdcc/downloads.json

    {
      "${network}": {
        "${botName}": [
          {
            "pack": 1,                          //xdcc pack id
            "name": "filename.tar"              //filename
          },{
          ...
          }
        ]
      },
      "${network}": ...
    }
    
