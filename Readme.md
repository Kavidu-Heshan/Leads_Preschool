Client
    1.Clone my github repo. Link = ""
    2.open terminal(press ctrl+ ~ ) and then type cd client.Then type
        npm i or npm install
        npm install bootstrap axios react-router-
    
Server
    1.open new terminal
    2.Type cd server
    3.Then type
        npm init -y
        npm install express mongoose cors nodemon
    4.Go to package.json in server folder edit script as
        "scripts":{"test":"echo\"Error:no test specified\"&& exit 1","start":"nodemon index.js"},
    5.you must create index.js file in server. That index.js file should have backend pipelines.
    6.Delete files --> App.css , index.css
    7.Clear files --> App.jsx
    8.remove index.js file path in main.jsx
