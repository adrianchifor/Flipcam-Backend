var amqp = require('amqp');

var connection;
var x;

module.exports = {

    connect : function(notify_callback) {
      console.log("Setting up connection to videoconcat service");
      connection = amqp.createConnection({ host: 'localhost' },
               {defaultExchangeName: ""});

        // Wait for connection to become established.
      connection.on('error', function (err) {
            console.log("Error: " + err + ". RETRYING");
      });
      connection.on('ready', function () {
        console.log("videoconcat ready");
        x = connection.exchange();

        connection.queue('complete', {autoDelete: false}, function (q) {
          // Catch all messages
          q.bind('#');

          // Receive messages
          q.subscribe(function (message, headers, deliveryInfo, messageObject) {
          // Print messages to stdout
          notify_callback(message.data.toString());
          });
        });


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
