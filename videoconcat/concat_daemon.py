#!/usr/bin/env python
import pika, json

from config import config

connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=config["server"]))
channel = connection.channel()

#create queue if it doesn't exist
channel.queue_declare(queue=config["queue"])

print ' [*] Waiting for messages. To exit press CTRL+C'

def callback(ch, method, properties, body):

    print " [x] Received %r" % (body,)

channel.basic_consume(callback,
                      queue=config["queue"],
                      no_ack=True)

channel.start_consuming()
