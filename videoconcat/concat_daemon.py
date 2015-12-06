#!/usr/bin/env python
import pika, json, os, time

from config import config
from subprocess import call, Popen

VIDEO_FOLDER = "/data/www/uploads/"
HIDE_FFMPEG_OUT = True

logfile = open('ffmpeg.log', 'w')

VIDEO_FOLDER = "/data/www/uploads/"

connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=config["server"]))
channel = connection.channel()

#create queue if it doesn't exist
channel.queue_declare(queue=config["queue"])
channel.queue_declare(queue=config["queue_complete"])

print ' [*] Waiting for messages. To exit press CTRL+C'

def cut(video_path, start, end, number):
    output = str(number)+"__"+video_path+".mp4"
    p = Popen(["ffmpeg", "-i", VIDEO_FOLDER+video_path, "-vf", "transpose=2", "-ss", str(start), "-to", str(end), VIDEO_FOLDER+output], stdout=logfile, stderr=logfile)
    retcode = p.wait()
    return output

def concatenate(videos, final_output):
    try:
        os.remove("list.txt")
    except OSError:
        pass
    data_to_write = ""
    for v in videos:
        data_to_write += "file '"+VIDEO_FOLDER+v+"'\n"
    f = open("list.txt", "w")
    f.write(data_to_write)
    f.close()
    p = Popen(["ffmpeg", "-f", "concat", "-i", "list.txt", "-c", "copy", VIDEO_FOLDER+final_output], stdout=logfile, stderr=logfile)
    retcode = p.wait()
    print " ".join(["ffmpeg", "-f", "concat", "-i", "list.txt", "-c", "copy", VIDEO_FOLDER+final_output])

def callback(ch, method, properties, body):
    job_data = json.loads(body)
    print "JSON data: "
    print job_data
    segments = []
    print " [x] Received new job"
    number = 0
    for c in job_data["cuts"]:
        segment = cut(c["video"], c["start"], c["stop"], number)
        number += 1
        print " [x]   cut ", c["video"], " from ", c["start"], " to ", c["stop"],". Saved to ", segment
        segments.append(segment)

    print " [x]   All videos cut"

    concatenate(segments, job_data['output'])
    print " [x]   "
    for s in segments:
        try:
            os.remove(VIDEO_FOLDER+s)
        except OSError:
            pass


    channel.basic_publish(exchange='',
                      routing_key=config["queue_complete"],
                      body=job_data['output'])

channel.basic_consume(callback,
                      queue=config["queue"],
                      no_ack=True)

channel.start_consuming()
