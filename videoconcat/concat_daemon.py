#!/usr/bin/env python
import pika, json, os, time

from config import config
from subprocess import call

connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=config["server"]))
channel = connection.channel()

#create queue if it doesn't exist
channel.queue_declare(queue=config["queue"])

print ' [*] Waiting for messages. To exit press CTRL+C'

def cut(video_path, start, end):
    output = str(start)+"__"+video_path
    call(["ffmpeg", "-i", video_path, "-ss", str(start), "-to", str(end), output])
    return output

def concatenate(videos, final_output):
    f = open("list.txt", "w")
    for v in videos:
        f.write("file '"+v+"'\n")
    f.close()
    call(["ffmpeg", "-f", "concat", "-i", "list.txt", "-c", "copy", final_output])
    print " ".join(["ffmpeg", "-f", "concat", "-i", "list.txt", "-c", "copy", final_output])

def callback(ch, method, properties, body):
    job_data = json.loads(body)
    segments = []
    print " [x] Received new job"
    print " [x]   session: ", job_data["session_key"]
    print " [x]   videos: ", ", ".join(job_data["videos"])
    for c in job_data["cuts"]:
        segment = cut(c["video"], c["start"], c["stop"])
        print " [x]   cut ", c["video"], " from ", c["start"], " to ", c["stop"],". Saved to ", segment
        segments.append(segment)

    print " [x]   All videos cut"
    concatenate(segments, job_data['output'])
    print " [x]   "
    for s in segments:
        os.remove(s)

channel.basic_consume(callback,
                      queue=config["queue"],
                      no_ack=True)

channel.start_consuming()
