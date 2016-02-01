## Flipcam Backend

Instantly team-up with passers-by to create amazing videos.

The app was created in 24h at TechCrunch Disrupt London Hackathon 2015. For more information
check out the [Devpost project page for Flipcam.](http://devpost.com/software/flipcam)

The iOS client app can be found [here.](https://github.com/adrianchifor/Flipcam-iOS)

### Run

- Install MongoDB, RabbitMQ, Python, ffmpeg, node.js, npm and pika (`pip install pika`)
- Start MongoDB and RabbitMQ on localhost
- Set your server IP in *server.js* 'serverIp' variable
- Create the directory where the video files are going to be uploaded (*/data/www/uploads*)
- Setup Nginx to serve files from */data/www*
- Create an isolated Python environment:
```bash
virtualenv videoconcat-env
```
- Start the videoconcat service:
```bash
source videoconcat-env/bin/activate
python videoconcat/concat_daemon.py
```
- Start the node.js server:
```bash
nodejs server.js
```

### License

Copyright &copy; 2015 Adrian Chifor, Roderick Hodgson, Pawel Kupiec

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
