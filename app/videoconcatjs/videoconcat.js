var amqp = require('amqp');

var connection;
var x;

module.exports = {

    connect : function() {
      console.log("Setting up connection to videoconcat service");
      connection = amqp.createConnection({ host: 'localhost' },
               {defaultExchangeName: ""});

        // Wait for connection to become established.
      connection.on('ready', function () {
        console.log("videoconcat ready");
        x = connection.exchange();
      });
    },
    concat : function(data) {
      x.publish('concatjobs', data);
    },
    disconnect : function(data) {
      console.log("Disconnecting");
      connection.disconnect();
    },
};
