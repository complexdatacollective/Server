const { createServer } = require('./components/serverManager');

createServer(8080, 'asdf')
.then((serverProcess) => {
  server = serverProcess;
  server.on('REQUEST_SERVER_STATUS', (event) => {
    console.log('request received', event);
    serverProcess.on(
      'SERVER_STATUS',
      ({ data }) => {
        console.log(data);
        event.sender.send('SERVER_STATUS', data);
      }
    );

    serverProcess.send({ action: 'REQUEST_SERVER_STATUS' });
  });
});


console.log("Server running on port 8080");
