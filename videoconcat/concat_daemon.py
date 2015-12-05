#!/usr/bin/env python
import pika, json

from config import config

connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=config["server"]))
channel = connection.channel()

#create queue if it doesn't exist
channel.queue_declare(queue=config["queue"])

print ' [*] Waiting for messages. To exit press CTRL+C'

def cut(video_path, start, end):
    output = str(start)+"__"+video_path
    pass

def concatenate(videos):
    f = open("list.txt", "w")
    for v in videos:
        f.write()
        ["ffmpeg", "-f", "concat", "-i", "mylist.txt", "-c", "copy", job_data[output]]
        pass

def callback(ch, method, properties, body):
    job_data = json.loads(body)
    print " [x] Received new job"
    print " [x]   session: ", job_data["session_key"]
    print " [x]   videos: ", ", ".join(job_data["videos"])

channel.basic_consume(callback,
                      queue=config["queue"],
                      no_ack=True)

channel.start_consuming()
