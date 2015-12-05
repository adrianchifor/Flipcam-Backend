#!/usr/bin/env python
import pika, json
from config import config

f = open("sample_queue_message", "r")
sample_data = json.load(f)


connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=config["server"]))
channel = connection.channel()

channel.queue_declare(queue=config["queue"])

channel.basic_publish(exchange='',
                      routing_key=config["queue"],
                      body=json.dumps(sample_data))

print " [x] Sent ", json.dumps(sample_data)
connection.close()
